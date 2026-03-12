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
	"DOKPLOY_APP_ID",
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
		appId: string;
	};
	registry: {
		user: string;
		password: string;
	};
	dockerTag: string;
};

const baseImage = "git.ombrage.space/penombre/penombre";

const config: Config = {
	dokploy: {
		url: `https://${process.env.DOKPLOY_URL}`,
		authorization: `Bearer ${process.env.DOKPLOY_AUTH_TOKEN}`,
		// biome-ignore lint/style/noNonNullAssertion: Already checked
		token: process.env.DOKPLOY_AUTH_TOKEN!,
		// biome-ignore lint/style/noNonNullAssertion: Already checked
		appId: process.env.DOKPLOY_APP_ID!,
	},
	registry: {
		// biome-ignore lint/style/noNonNullAssertion: Already checked
		user: process.env.REGISTRY_USER!,
		// biome-ignore lint/style/noNonNullAssertion: Already checked
		password: process.env.REGISTRY_PASSWORD!,
	},
	// biome-ignore lint/style/noNonNullAssertion: Already checked
	dockerTag: process.env.DOCKER_TAG!,
};

const headers = {
	"x-api-key": config.dokploy.token,
	"Content-Type": "application/json",
	accept: "application/json",
};

async function updateImage(): Promise<FetchResponse> {
	const fullImage = `${baseImage}:${config.dockerTag}`;
	const req = await fetch(
		`${config.dokploy.url}/api/application.saveDockerProvider`,
		{
			method: "POST",
			headers,
			body: JSON.stringify({
				applicationId: config.dokploy.appId,
				registryUrl: "git.ombrage.space",
				dockerImage: fullImage,
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
		headers,
		body: JSON.stringify({
			applicationId: config.dokploy.appId,
			registryUrl: "git.ombrage.space",
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
	console.log("Updating application image for app...");
	let res = await updateImage();
	if (res.err) {
		console.error("❌ Failed to update application image for app.", res.err);
		throw new Error(res.err);
	}

	console.log(res.success);
	console.log("Deploying application...");
	res = await deploy();

	if (res.err) {
		console.error("❌ Failed to deploy application.", res.err);
		throw new Error(res.err);
	}

	console.log(res.success);

	console.log("✅ Done");
}

void main();
