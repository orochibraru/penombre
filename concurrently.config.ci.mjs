import concurrently from "concurrently";
import path from "node:path";
import { cwd } from "node:process";

/**
 * @type {import('concurrently').ConcurrentlyResult}
 */
const tasks = concurrently(
    [
        {
            name: "ui:build",
            prefix: "ui:build",
            command: "pnpm run build",
            prefixColor: 'green',
            cwd: path.resolve(cwd(), "packages/ui"),
        },
        {
            name: "ui:check",
            prefix: "ui:check",
            command: "pnpm run check",
            prefixColor: 'blue',
            cwd: path.resolve(cwd(), "packages/ui"),
        },
        {
            name: "ui:lint",
            prefix: "ui:lint",
            command: "pnpm run lint",
            prefixColor: 'red',
            cwd: path.resolve(cwd(), "packages/ui"),
        },
        {
            name: "ui:circular",
            prefix: "ui:circular",
            command: "pnpm run circular",
            prefixColor: 'purple',
            cwd: path.resolve(cwd(), "packages/ui"),
        },
        {
            name: "ui:formatting",
            prefix: "ui:formatting",
            command: "pnpm run format:check",
            prefixColor: 'cyan',
            cwd: path.resolve(cwd(), "packages/ui"),
        },
    ],
);

void tasks.result;
