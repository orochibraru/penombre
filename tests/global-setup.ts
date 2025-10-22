// global-setup.ts
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { MinioContainer } from "@testcontainers/minio";
import { PortWithBinding } from "testcontainers";
import { spawn } from "node:child_process";

process.env.DEV_PROXY = "false";

function sleep(s: number) {
    console.log(`Sleeping for ${s} seconds...`);
    return new Promise((resolve) => setTimeout(resolve, s * 1000));
}

async function startWebServer() {
    console.log("Starting Go web server...");
    const goServer = spawn("go", ["run", "."], {
        cwd: "packages/api",
        env: { ...process.env },
        stdio: "inherit",
    });

    await sleep(5);

    const response = await fetch("http://localhost:8080/api/v1/healthz");
    if (!response.ok) {
        console.log("Go web server not ready!");
        console.log(response.status);
        console.log(await response.text());
    }

    return goServer;
}

async function globalSetup(): Promise<() => Promise<void>> {
    console.log("Starting services...");
    if (process.env.CI === "true" || process.env.CI === "1") {
        // Skip containers, only start the webserver.
        const goServer = await startWebServer();

        return async () => {
            console.log("Stopping services...");
            if (goServer) {
                goServer.kill();
                console.log("Go server stopped");
            }
            console.log("Services stopped.");
        };
    }

    // 1. Start PostgreSQL
    console.log("Starting Database...");
    const dbUser = "test_user";
    const dbName = "test_db";
    const dbPassword = "test_password";
    const postgresContainer = await new PostgreSqlContainer(
        "postgres:17-alpine",
    )
        .withDatabase(dbName)
        .withUsername(dbUser)
        .withPassword(dbPassword)
        .withHealthCheck({
            test: ["CMD-SHELL", `sh -c 'pg_isready -U ${dbUser} -d ${dbName}'`],
            interval: 3000,
            timeout: 10000,
            retries: 5000,
            startPeriod: 3000,
        })
        .start();

    console.log("PostgreSQL started");

    // 2. Start MinIO
    // We explicitly expose the API port (9000) and the Console port (9001)
    const minioApiPort: PortWithBinding = { container: 9000, host: 9000 };
    const minioConsolePort: PortWithBinding = { container: 9001, host: 9001 };

    console.log("Starting Storage...");
    const minioContainer = await new MinioContainer("minio/minio:latest")
        .withExposedPorts(minioApiPort, minioConsolePort)
        .withHealthCheck({
            test: [
                "CMD-SHELL",
                `curl -f http://0.0.0.0:9000/minio/health/live`,
            ],
            interval: 3000,
            timeout: 10000,
            retries: 5000,
            startPeriod: 3000,
        })
        .start();

    console.log("MinIO started");

    // 3. Set environment variables for Playwright tests
    const dbUri = postgresContainer.getConnectionUri();
    // Add sslmode=disable if not already present
    process.env.DATABASE_URL = dbUri.includes("?")
        ? `${dbUri}&sslmode=disable`
        : `${dbUri}?sslmode=disable`;

    // MinIO S3-compatible endpoint
    process.env.STORAGE_URL = minioContainer.getConnectionUrl();
    process.env.STORAGE_ACCESS_KEY_ID = minioContainer.getUsername();
    process.env.STORAGE_ACCESS_KEY_SECRET = minioContainer.getPassword();

    console.log("Services started successfully!");
    console.log("DATABASE_URL:", process.env.DATABASE_URL);
    console.log("STORAGE_URL:", process.env.STORAGE_URL);

    // 4. Start Go web server
    const goServer = await startWebServer();

    // We return a "teardown" function
    // This function will be called by Playwright after all tests have run
    return async () => {
        console.log("Stopping services...");
        if (goServer) {
            goServer.kill();
            console.log("Go server stopped");
        }
        await postgresContainer.stop();
        await minioContainer.stop();
        console.log("Services stopped.");
    };
}

export default globalSetup;
