import { GlobalRegistrator } from "@happy-dom/global-registrator";

// Register Happy DOM globally before tests
GlobalRegistrator.register();

// Make sure fetch is available
if (!globalThis.fetch) {
	globalThis.fetch = fetch;
}

// Cleanup on exit
if (typeof process !== "undefined") {
	process.on("exit", () => {
		GlobalRegistrator.unregister();
	});
}
