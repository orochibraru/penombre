const GITHUB_URL = "https://github.com";
const GITHUB_REPO = "orochibraru/penombre";

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

async function createGithubRelease(version: string, body: string) {
	const token = process.env.GITHUB_TOKEN;
	if (!token) throw new Error("GITHUB_TOKEN environment variable is not set");

	const response = await fetch(
		`${GITHUB_URL}/api/v1/repos/${GITHUB_REPO}/releases`,
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
			`Failed to create Github release: ${response.status} ${text}`,
		);
	}

	console.log(`Github release ${version} created.`);
}

async function main() {
	const newVersion = JSON.parse(await Bun.file("package.json").text()).version;
	console.log(`New version: ${newVersion}`);
	// Create Github release
	const releaseNotes = await getChangelogSection(`v${newVersion}`);
	await createGithubRelease(`v${newVersion}`, releaseNotes);
}

void main();
