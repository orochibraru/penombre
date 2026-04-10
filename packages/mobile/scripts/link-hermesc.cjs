#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const resolvePaths = [process.cwd()];
const reactNativeDir = path.dirname(
	require.resolve("react-native/package.json", { paths: resolvePaths }),
);
const hermesCompilerDir = path.dirname(
	require.resolve("hermes-compiler/package.json", {
		paths: [reactNativeDir, ...resolvePaths],
	}),
);

const hermescSourceRoot = path.join(hermesCompilerDir, "hermesc");
const hermescTargetRoot = path.join(reactNativeDir, "sdks", "hermesc");
const binaryDirectories = ["osx-bin", "linux64-bin", "win64-bin"];

fs.mkdirSync(hermescTargetRoot, { recursive: true });

for (const binaryDirectory of binaryDirectories) {
	const sourcePath = path.join(hermescSourceRoot, binaryDirectory);
	const targetPath = path.join(hermescTargetRoot, binaryDirectory);

	if (!fs.existsSync(sourcePath)) {
		continue;
	}

	fs.rmSync(targetPath, { recursive: true, force: true });
	fs.symlinkSync(sourcePath, targetPath, "dir");
}

console.log("Hermes compiler symlinks are ready.");
