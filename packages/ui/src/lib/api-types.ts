// This file exports the API router type for the Hono RPC client.
// We use `import type` which only imports the type, not the runtime value.

// Re-export the AppType for the client
export type { AppType as Router } from "$lib/server/api";
