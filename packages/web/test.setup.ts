import { mock } from "bun:test";

// Mock SvelteKit and environment modules before any imports
const mockAppEnvironment = {
	dev: false,
	building: false,
	browser: false,
};

// Use Bun's mock.module to properly mock SvelteKit modules
mock.module("$app/environment", () => mockAppEnvironment);

mock.module("$env/dynamic/private", () => ({
	env: process.env, // Use actual process.env so tests can manipulate it
}));

mock.module("$app/server", () => ({
	getRequestEvent: () => null,
}));

mock.module("$lib/server/auth", () => ({
	auth: {
		api: {
			getSession: mock(() => Promise.resolve(null)),
			updateUser: mock(() => Promise.resolve({ status: true })),
			adminUpdateUser: mock(() => Promise.resolve({})),
		},
	},
}));

mock.module("$lib/server/config", () => ({
	getPenombreConfig: mock(() => ({
		smtp: undefined,
	})),
}));

mock.module("$lib/logger", () => ({
	Logger: class {
		debug() {}
		error() {}
		info() {}
		warn() {}
	},
}));
