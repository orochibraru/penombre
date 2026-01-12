import { $ } from "bun";
import { pgGenerate } from "drizzle-dbml-generator";
import * as schema from "../packages/web/src/lib/server/db/schema"; // Path to your Drizzle schema

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

try {
	console.log("Generating SVG from DBML...");
	$`dbml-renderer -i ${schemaDestination} -o ${svgDestination}`;
	console.log("✅ SVG generated successfully");
} catch (error) {
	console.error("❌ Error generating SVG:", error);
}
