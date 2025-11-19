import path from "node:path";
import { cwd } from "node:process";
import concurrently, { type ConcurrentlyResult } from "concurrently";

const tasks: ConcurrentlyResult = concurrently([
	{
		name: "db",
		command: "docker compose up db",
		prefixColor: "cyan",
	},
	{
		name: "api",
		command: "bunx wait-on tcp:5432 && bun run dev",
		prefixColor: "blue",
		cwd: path.resolve(cwd(), "packages/api"),
	},
	{
		name: "ui",
		command: "bun run dev",
		prefixColor: "green",
		cwd: path.resolve(cwd(), "packages/ui"),
	},
]);

void tasks.result.catch(() => {
	console.error("One of the tasks failed. Exiting...");
	process.exit(1);
});
