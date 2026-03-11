import { $ } from "bun";

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
}

void main();
