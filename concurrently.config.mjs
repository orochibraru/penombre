import concurrently from "concurrently";
import path from "node:path";
import { cwd } from "node:process";

/**
 * @type {import('concurrently').ConcurrentlyResult}
 */
const tasks = concurrently(
  [
    {
      name: "ui:dev",
      prefix: "ui:dev",
      command: "pnpm run dev:silent",
      prefixColor: 'green',
      cwd: path.resolve(cwd(), "packages/ui"),
    },
    {
      name: 'api:dev',
      prefix: "api:dev",
      command: 'go tool air',
      prefixColor: 'blue',
      cwd: path.resolve(cwd(), "packages/api"),
    },
    {
      name: "containers:dev",
      prefix: "containers:dev",
      command: 'docker compose up',
      prefixColor: 'cyan',
      killOthersOn: ["failure"],
    }
  ],
);

void tasks.result;
