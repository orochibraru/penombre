// Mock SvelteKit and environment modules before any imports
const mockAppEnvironment = {
	dev: false,
	building: false,
	browser: false,
};

const mockEnvDynamic = {
	env: {
		LOG_LEVEL: "info",
	},
};

// Register mock modules using import.meta.resolve if available
// Otherwise, use a simpler approach with module mocking

// Store original require/import handlers
declare global {
	var __BTEST_MOCKS__: Record<string, any>;
}

if (!globalThis.__BTEST_MOCKS__) {
	globalThis.__BTEST_MOCKS__ = {
		"$app/environment": mockAppEnvironment,
		"$env/dynamic/private": mockEnvDynamic,
	};
}

// Try using import.meta.glob or a dynamic import workaround
// Since Bun doesn't easily support module aliasing in tests, we'll use a different strategy
// This file will be preloaded before tests run
