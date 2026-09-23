import { mock } from "bun:test";

// Mock SvelteKit and environment modules before any imports
const mockAppEnvironment = {
	dev: false,
	building: false,
	browser: false,
};

// Use Bun's mock.module to properly mock SvelteKit modules
mock.module("$app/env", () => mockAppEnvironment);

mock.module("$app/server", () => ({
	getRequestEvent: () => null,
}));

mock.module("$app/paths", () => ({
	// Route ids resolve without their groups: `/(app)` is `/`.
	resolve: mock((path: string) => path.replace(/\/\([^)]+\)/g, "") || "/"),
}));

mock.module("#lib/api/index.js", () => ({
	api: {
		GET: mock(() => Promise.resolve({ data: null, error: undefined })),
	},
}));

mock.module("#lib/server/auth/index.js", () => ({
	auth: {
		api: {
			getSession: mock(() => Promise.resolve(null)),
			signInSocial: mock(() => Promise.resolve({ url: undefined })),
			updateUser: mock(() => Promise.resolve({ status: true })),
			adminUpdateUser: mock(() => Promise.resolve({})),
			listApiKeys: mock(() => Promise.resolve([])),
			listPasskeys: mock(() => Promise.resolve([])),
			createApiKey: mock(() => Promise.resolve({ key: "mock-key" })),
			changePassword: mock(() => Promise.resolve({})),
			setPassword: mock(() => Promise.resolve({ status: true })),
			listUserAccounts: mock(() => Promise.resolve([])),
			setRole: mock(() => Promise.resolve({})),
			banUser: mock(() => Promise.resolve({})),
			unbanUser: mock(() => Promise.resolve({})),
			removeUser: mock(() => Promise.resolve({})),
			listSessions: mock(() => Promise.resolve([])),
			listUsers: mock(() => Promise.resolve({ users: [] })),
		},
	},
	loadedOAuthProviders: mock(() => Promise.resolve([])),
	refreshAuth: mock(() => Promise.resolve()),
	instanceSignInMethods: mock(() =>
		Promise.resolve({
			password: true,
			passkey: true,
			magicLink: false,
			emailOtp: false,
		}),
	),
}));

mock.module("#lib/server/config.js", () => ({
	getConfig: mock(() => ({
		smtp: undefined,
		appName: "Penombre",
		origin: "http://localhost:5173",
		auth: {
			secret: "test-secret",
			enableEmailSignIn: true,
			minPasswordLength: 8,
		},
		worker: { mode: "embedded", concurrency: 4 },
	})),
	getStoragePath: mock(() => "/tmp/penombre-test-storage"),
	envProvided: mock(() => ({
		emailSignIn: true,
		oauthSignIn: true,
		passkeySignIn: false,
		minPasswordLength: true,
		smtp: true,
		versionCheck: false,
		releaseChannel: false,
		dataRetention: false,
	})),
	isSimpleMode: mock(() => false),
	isAuthBypassed: mock(() => false),
}));

mock.module("#lib/logger.js", () => ({
	Logger: class {
		debug() {}
		error() {}
		info() {}
		warn() {}
	},
}));

mock.module("#lib/server/services/storage/index.js", () => ({
	StorageService: {
		getAvailableStorageSize: mock(() => 1_073_741_824),
		getAdminStoragePath: mock(() => "/tmp/penombre-test-storage"),
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

mock.module("#lib/server/db/index.js", () => ({
	db: mockDb,
	getDb: () => mockDb,
	getDbUrl: () => "file:./data/db/penombre.sqlite",
}));
