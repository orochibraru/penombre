import madge from "madge";

madge(["./src"], {
  fileExtensions: ["ts"],
  tsConfig: "./tsconfig.json",
}).then((res) => {
  const circular = res.circular();
  if (circular.length > 0) {
    console.error(`Found ${circular.length} circular dependencies`);
    console.error(circular);
    throw new Error();
  }

  console.log("No circular dependencies found.");
});
