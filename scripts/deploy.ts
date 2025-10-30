type FetchResponse = {
    err: string | undefined;
    success: string | undefined;
};

const envVars = [
    "DOKPLOY_URL",
    "DOKPLOY_AUTH_TOKEN",
    "DOKPLOY_APP_ID",
    "REGISTRY_USER",
    "REGISTRY_PASSWORD",
    "DOCKER_IMAGE",
];

// Validation
const undefinedEnvVars = envVars.filter((envVar) => !process.env[envVar]);

if (undefinedEnvVars.length > 0) {
    throw new Error(
        `Missing environment variables: ${undefinedEnvVars.join(", ")}`,
    );
}

const config = {
    dokploy: {
        url: `https://${process.env.DOKPLOY_URL}`,
        authorization: `Bearer ${process.env.DOKPLOY_AUTH_TOKEN}`,
        appId: process.env.DOKPLOY_APP_ID,
    },
    registry: {
        user: process.env.REGISTRY_USER,
        password: process.env.REGISTRY_PASSWORD,
    },
    dockerImage: process.env.DOCKER_IMAGE,
};

async function updateImage(): Promise<FetchResponse> {
    const req = await fetch(
        `${config.dokploy.url}/api/application.saveDockerProvider`,
        {
            method: "POST",
            headers: {
                Authorization: config.dokploy.authorization,
            },
            body: JSON.stringify({
                applicationId: config.dokploy.appId,
                dockerImage: config.dockerImage,
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

async function deploy(): Promise<FetchResponse> {
    const req = await fetch(`${config.dokploy.url}/api/application.deploy`, {
        method: "POST",
        headers: {
            Authorization: config.dokploy.authorization,
        },
        body: JSON.stringify({
            applicationId: config.dokploy.appId,
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
    let res = await updateImage();
    if (res.err) {
        console.error("❌ Failed to update application image.", res.err);
        throw new Error(res.err);
    }

    console.log(res.success);
    res = await deploy();

    if (res.err) {
        console.error("❌ Failed to deploy application.", res.err);
        throw new Error(res.err);
    }

    console.log(res.success);

    console.log("✅ Done");
}

void main();
