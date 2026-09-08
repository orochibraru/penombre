import process from "node:process";
import concurrently, { type ConcurrentlyResult } from "concurrently";

const tasks: ConcurrentlyResult = concurrently([
	{
		name: "db",
		command: "docker compose up",
		prefixColor: "cyan",
	},
	{
		name: "ui",
		command: "bun run dev:app",
		prefixColor: "green",
	},
]);

void tasks.result.catch(() => {
	console.error("One of the tasks failed. Exiting...");
	process.exit(1);
});
