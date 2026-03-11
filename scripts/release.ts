import { $ } from "bun";

const GITEA_URL = "https://git.ombrage.space";
const GITEA_REPO = "opendrive/opendrive";

async function getChangelogSection(version: string): Promise<string> {
	const changelog = await Bun.file("CHANGELOG.md").text();
	const versionHeader = `## ${version}`;
	const start = changelog.indexOf(versionHeader);
	if (start === -1) return "";
	const afterHeader = changelog.indexOf("\n", start) + 1;
	const nextSection = changelog.indexOf("\n## ", afterHeader);
	return changelog
		.slice(afterHeader, nextSection === -1 ? undefined : nextSection)
		.trim();
}

async function createGiteaRelease(version: string, body: string) {
	const token = process.env.GITEA_TOKEN;
	if (!token) throw new Error("GITEA_TOKEN environment variable is not set");

	const response = await fetch(
		`${GITEA_URL}/api/v1/repos/${GITEA_REPO}/releases`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `token ${token}`,
			},
			body: JSON.stringify({
				tag_name: version,
				name: version,
				body,
			}),
		},
	);

	if (!response.ok) {
		const text = await response.text();
		throw new Error(
			`Failed to create Gitea release: ${response.status} ${text}`,
		);
	}

	console.log(`Gitea release ${version} created.`);
}

async function main() {
	// Get the current version from package.json
	const packageJson = JSON.parse(await Bun.file("package.json").text());
	const currentVersion = packageJson.version;
	console.log(`Current version: ${currentVersion}`);

	// Increment the patch version
	await $`bunx changelogen@latest --release`;
	const newVersion = JSON.parse(await Bun.file("package.json").text()).version;
	console.log(`New version: ${newVersion}`);

	if (currentVersion === newVersion) {
		console.log("Version did not change, skipping release.");
		return;
	}

	// commit the changes
	await $`git push origin main --tags`;

	// Create Gitea release
	const releaseNotes = await getChangelogSection(`v${newVersion}`);
	await createGiteaRelease(`v${newVersion}`, releaseNotes);
}

void main();
