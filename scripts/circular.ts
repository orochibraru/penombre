import madge from "madge";

const packages = ["./packages/api", "./packages/ui"];

madge(packages, {
	fileExtensions: ["ts"],
}).then((res) => {
	const circular = res.circular();
	if (circular.length > 0) {
		console.error(`Found ${circular.length} circular dependencies`, circular);
		throw new Error();
	}

	console.log("No circular dependencies found.");
});
