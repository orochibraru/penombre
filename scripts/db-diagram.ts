import { $ } from "bun";
import { pgGenerate } from "drizzle-dbml-generator";
import * as schema from "../packages/web/src/lib/server/db/schema";

const schemaDestination = "./resources/schema.dbml";
const svgDestination = "./resources/db.svg";
const relational = true;

try {
	console.log("Generating DBML from Drizzle schema...");
	pgGenerate({ schema, out: schemaDestination, relational });
	console.log("✅ DBML generated successfully");
} catch (error) {
	console.error("❌ Error generating DBML:", error);
}

console.log("Generating SVG from DBML...");
const res =
	await $`bunx dbml-renderer -i ${schemaDestination} -o ${svgDestination}`;
if (res.exitCode !== 0) {
	throw new Error(`dbml-renderer failed with exit code ${res.exitCode}`);
}
console.log("✅ SVG generated successfully");
