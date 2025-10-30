type FetchResponse = {
    err: string | undefined;
    success: string | undefined;
};

const envVars = [
    "DOKPLOY_URL",
    "DOKPLOY_AUTH_TOKEN",
    "REGISTRY_USER",
    "REGISTRY_PASSWORD",
    "DOCKER_TAG",
];

// Validation
const undefinedEnvVars = envVars.filter((envVar) => !process.env[envVar]);

if (undefinedEnvVars.length > 0) {
    throw new Error(
        `Missing environment variables: ${undefinedEnvVars.join(", ")}`,
    );
}

type Config = {
    dokploy: {
        url: string;
        authorization: string;
        token: string;
    };
    registry: {
        user: string;
        password: string;
    };
    dockerTag: string;
};

const baseImage = "git.ombrage.space/opendrive";

const config: Config = {
    dokploy: {
        url: `https://${process.env.DOKPLOY_URL!}`,
        authorization: `Bearer ${process.env.DOKPLOY_AUTH_TOKEN!}`,
        token: process.env.DOKPLOY_AUTH_TOKEN!,
    },
    registry: {
        user: process.env.REGISTRY_USER!,
        password: process.env.REGISTRY_PASSWORD!,
    },
    dockerTag: process.env.DOCKER_TAG!,
};

const headers = {
    "x-api-key": config.dokploy.token,
    "Content-Type": "application/json",
    accept: "application/json",
};

type Application = {
    applicationId: string;
    name: string;
    appName: string;
    description: string;
    dockerImage: string;
    registryUrl: string;
};

type Environment = {
    environmentId: string;
    name: string;
    description: string;
    createdAt: string;
    env: string;
    projectId: string;
    applications: Application[];
    mariadb: string[];
    postgres: string[];
    redis: string[];
    compose: string[];
    mongo: string[];
};

type Project = {
    projectId: string;
    name: string;
    createdAt: string;
    organizationId: string;
    env: string;
    environments: Environment[];
};

type AppIDResponse = {
    app: string;
    docs: string;
};

async function getAppId() {
    const req = await fetch(`${config.dokploy.url}/api/project.all`, {
        method: "GET",
        headers,
    });

    if (!req.ok) {
        throw new Error(`Failed to fetch projects: ${await req.text()}`);
    }

    const data: Project[] = await req.json();

    const project = data.find((project) => project.name === "Opendrive");
    if (!project) {
        throw new Error("Opendrive project not found");
    }
    console.log("Project ID:", project?.projectId);

    const environment = project?.environments.find(
        (env) => env.name === "production",
    );
    if (!environment) {
        throw new Error("Production environment not found");
    }
    console.log("Environment ID:", environment?.environmentId);

    console.log(
        environment.applications
            .map((app) => {
                return `- ${app.name}: ${app.applicationId}`;
            })
            .join("\n"),
    );
    const opendriveApp = environment?.applications.find(
        (app) => app.name === "app",
    );
    console.log("Opendrive Application ID:", opendriveApp?.applicationId);

    const opendriveDocs = environment?.applications.find(
        (app) => app.name === "docs",
    );
    console.log("Docs Application ID:", opendriveDocs?.applicationId);

    return {
        app: opendriveApp?.applicationId!,
        docs: opendriveDocs?.applicationId!,
    };
}

async function updateImage({
    appId,
    appName,
}: {
    appId: string;
    appName: string;
}): Promise<FetchResponse> {
    const req = await fetch(
        `${config.dokploy.url}/api/application.saveDockerProvider`,
        {
            method: "POST",
            headers,
            body: JSON.stringify({
                applicationId: appId,
                dockerImage: `${baseImage}/${appName}:${config.dockerTag}`,
                username: config.registry.user,
                password: config.registry.password,
            }),
        },
    );

    if (!req.ok) {
        return {
            err: await req.text(),
            success: undefined,
        };
    }

    return {
        err: undefined,
        success: "✅ The image was updated.",
    };
}

async function deploy(appId: string): Promise<FetchResponse> {
    const req = await fetch(`${config.dokploy.url}/api/application.deploy`, {
        method: "POST",
        headers,
        body: JSON.stringify({
            applicationId: appId,
        }),
    });

    if (!req.ok) {
        return {
            err: await req.text(),
            success: undefined,
        };
    }

    return {
        err: undefined,
        success: "✅ The application was deployed.",
    };
}

async function main() {
    console.log("🚀 Starting deployment...");
    const appIds = await getAppId();
    console.log("Updating application image for app...");
    let res = await updateImage({ appId: appIds.app, appName: "opendrive" });
    if (res.err) {
        console.error(
            "❌ Failed to update application image for app.",
            res.err,
        );
        throw new Error(res.err);
    }

    console.log("Updating application image for docs...");
    res = await updateImage({ appId: appIds.docs, appName: "docs" });
    if (res.err) {
        console.error(
            "❌ Failed to update application image for docs.",
            res.err,
        );
        throw new Error(res.err);
    }

    console.log(res.success);
    console.log("Deploying application for app...");
    res = await deploy(appIds.app);

    if (res.err) {
        console.error("❌ Failed to deploy application.", res.err);
        throw new Error(res.err);
    }

    console.log(res.success);
    console.log("Deploying application for docs...");
    res = await deploy(appIds.docs);

    if (res.err) {
        console.error("❌ Failed to deploy application.", res.err);
        throw new Error(res.err);
    }

    console.log(res.success);

    console.log("✅ Done");
}

void main();
