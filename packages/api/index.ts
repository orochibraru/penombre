import { auth } from "@lib/auth";
import { logger } from "@lib/logger";
import { cleanupDeletedUserStorage } from "@lib/storage";
import { $ } from "bun";
import { Api } from "koritsu";
import { runMigrations } from "./migrate";

const port = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 8080;
const host = process.env.HOST || "0.0.0.0";

async function writeRealTimeSpec() {
    logger.info("Writing real-time OpenAPI spec...");
    const serverUrl = `http://${host}:${port}`;
    logger.info(`Fetching OpenAPI spec from ${serverUrl}...`);
    const specUrl = `${serverUrl}/swagger/api-docs.json`;
    const specPath = "./openapi.json";
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 3000);
    const req = await fetch(specUrl, {
        signal: controller.signal,
    });
    if (controller.signal.aborted) {
        logger.error("Fetch OpenAPI spec request timed out.");
        return;
    }
    if (!req.ok) {
        logger.error(
            `Failed to fetch OpenAPI spec from ${specUrl}: ${req.status} ${req.statusText}`,
        );
        return;
    }
    logger.info("Fetched OpenAPI spec successfully.");
    const spec = await req.text();
    try {
        await Bun.write(specPath, spec);
    } catch (err) {
        logger.error("Failed to write OpenAPI spec to file:", err);
        return;
    }
    logger.info("OpenAPI spec written to", specPath);
    const res = await $`bunx biome format ${specPath} --write`;
    if (res.exitCode !== 0) {
        logger.error("Failed to format OpenAPI spec:", res.stderr);
    }
    logger.info("Formatted OpenAPI spec successfully.");
}

const env: "development" | "production" | "test" =
    (process.env.NODE_ENV as "development" | "production" | "test") ||
    "development";

async function cleanup() {
    try {
        logger.info("Initial cleanup of deleted user storage...");
        await cleanupDeletedUserStorage();
    } catch (err) {
        logger.error(
            "Error during initial cleanup of deleted user storage:",
            err,
        );
    }
}

// Cleanup storage of deleted users periodically
setInterval(
    async () => {
        await cleanup();
    },
    24 * 60 * 60 * 1000, // Every 24 hours
);

const server = new Api({
    title: "Opendrive API",
    environment: env,
    cors: {
        enabled: true,
        methods: ["GET", "POST", "PUT", "DELETE"],
        origin: "http://localhost:5173",
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
    },
    server: {
        maxRequestBodySize: 5000 * 1024 * 1024, // 5GB
        logLevel: "info",
        port,
        host,
        routes: {
            basePath: "/api",
            dir: "./routes",
        },
    },
    swagger: {
        enabled: true,
        path: "/swagger",
        // Unified OpenAPI documentation
        externalSpecs: [
            {
                url: "http://localhost:8080/auth/open-api/generate-schema",
                name: "better-auth",
                tags: ["Auth"],
                pathPrefix: "/auth",
            },
        ],
    },
    proxy: {
        enabled: true,
        configs: [
            // Auth
            {
                pattern: "/auth/**",
                description: "Authentication endpoints handled by better-auth",
                handler: async ({ request }) => {
                    const start = Date.now();

                    const response = await auth.handler(request);
                    logger.http(request, response, Date.now() - start);

                    return {
                        proceed: false,
                        response,
                    };
                },
            },
            // UI Proxy - serve static files and SSR
            {
                pattern: "/**",
                description: "Serve UI static files and SSR",
                handler: async ({ request }) => {
                    const start = Date.now();
                    const url = new URL(request.url);
                    if (
                        url.pathname.startsWith("/api") ||
                        url.pathname.startsWith("/auth") ||
                        url.pathname.startsWith("/swagger")
                    ) {
                        return {
                            skip: true,
                            proceed: false,
                        };
                    }

                    // Serve static files from UI build
                    const staticPath = `./frontend/client${url.pathname}`;
                    const file = Bun.file(staticPath);

                    if (await file.exists()) {
                        const response = new Response(file);
                        logger.http(request, response, Date.now() - start);
                        return {
                            proceed: false,
                            response,
                        };
                    }

                    // Forward to UI SSR handler
                    const uiHandler = await import("./frontend/handler");
                    const response = await uiHandler
                        .getHandler()
                        .fetch(request);
                    logger.http(request, response, Date.now() - start);

                    return {
                        proceed: false,
                        response,
                    };
                },
            },
        ],
    },
});

if (import.meta.main) {
    logger.info("Running migrations in production environment.");
    runMigrations()
        .then(async () => {
            logger.info("Migrations completed.");
            return server.start().then(async () => {
                await cleanup();
                logger.info(`Server started in ${env} mode.`);
                if (env === "development") {
                    writeRealTimeSpec();
                }
            });
        })
        .catch((err) => {
            logger.error("Migration failed:", err);
            process.exit(1);
        });
}
