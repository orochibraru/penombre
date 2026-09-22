import madge from "madge";

const packages = ["./src"];

madge(packages, {
	fileExtensions: ["ts"],
	// `local.ts` only imports `StorageDriver` as a type; madge's TS detective
	// still counts it as an edge unless told to skip type-only imports, which
	// turned a non-issue into a false-positive cycle with `driver.ts`.
	detectiveOptions: { ts: { skipTypeImports: true } },
}).then((res) => {
	const circular = res.circular();
	if (circular.length > 0) {
		console.error(`Found ${circular.length} circular dependencies`, circular);
		throw new Error(`Found ${circular.length} circular dependencies`);
	}

	console.log("No circular dependencies found.");
});
