import madge from "madge";

const packages = ["./src"];

madge(packages, {
	fileExtensions: ["ts"],
}).then((res) => {
	const circular = res.circular();
	if (circular.length > 0) {
		console.error(`Found ${circular.length} circular dependencies`, circular);
		throw new Error(`Found ${circular.length} circular dependencies`);
	}

	console.log("No circular dependencies found.");
});
