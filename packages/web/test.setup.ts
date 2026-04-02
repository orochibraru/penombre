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

mock.module("$app/paths", () => ({
	resolve: mock((path: string) => path),
}));

mock.module("$lib/api", () => ({
	api: {
		GET: mock(() => Promise.resolve({ data: null, error: undefined })),
	},
}));

mock.module("$lib/server/auth", () => ({
	auth: {
		api: {
			getSession: mock(() => Promise.resolve(null)),
			updateUser: mock(() => Promise.resolve({ status: true })),
			adminUpdateUser: mock(() => Promise.resolve({})),
			listApiKeys: mock(() => Promise.resolve([])),
			listPasskeys: mock(() => Promise.resolve([])),
			createApiKey: mock(() => Promise.resolve({ key: "mock-key" })),
			changePassword: mock(() => Promise.resolve({})),
			listSessions: mock(() => Promise.resolve([])),
			listUsers: mock(() => Promise.resolve({ users: [] })),
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

// Dynamically import real CacheManager/CacheKeys AFTER logger mock is registered.
// Bun on AMD64 resolves sub-path imports (e.g. "$lib/server/services/storage/cache")
// by prefix-matching against registered barrel mocks. Including the real implementations
// here ensures that cache tests get the correct exports regardless of architecture.
const { CacheManager, CacheKeys } = await import(
	"$lib/server/services/storage/cache"
);

mock.module("$lib/server/services/storage", () => ({
	CacheManager,
	CacheKeys,
	StorageService: {
		getAvailableStorageSize: mock(() => 1073741824),
	},
}));

// Chainable mock query builder for Drizzle ORM
function createMockQueryBuilder(resolveValue: unknown[] = []) {
	const builder: Record<string, unknown> = {};
	const chain = () =>
		new Proxy(builder, {
			get: (_target, prop) => {
				if (prop === "then") {
					return (
						resolve: (v: unknown) => void,
						reject: (e: unknown) => void,
					) => Promise.resolve(resolveValue).then(resolve, reject);
				}
				return mock(() => chain());
			},
		});
	return chain();
}

const mockDbSelect = mock(() => createMockQueryBuilder([]));
const mockDbInsert = mock(() => createMockQueryBuilder([]));
const mockDbTransaction = mock((fn: (tx: unknown) => Promise<unknown>) =>
	fn({
		insert: mock(() => createMockQueryBuilder([])),
		select: mock(() => createMockQueryBuilder([])),
	}),
);

const mockDb = {
	select: mockDbSelect,
	insert: mockDbInsert,
	transaction: mockDbTransaction,
};

mock.module("$lib/server/db", () => ({
	db: mockDb,
	getDb: () => mockDb,
}));
