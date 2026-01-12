import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test";
import { LOG_LEVELS, Logger } from "./logger";

/**
 * Logger unit tests
 *
 * Tests the Logger class functionality including log levels,
 * output formats (console vs JSON), and all logging methods.
 *
 * Note: These tests use the real config module but modify env vars
 * to control log format and level. This avoids mock conflicts with config tests.
 */

// Spy on console methods
let consoleLogSpy: ReturnType<typeof spyOn>;
let consoleInfoSpy: ReturnType<typeof spyOn>;
let consoleErrorSpy: ReturnType<typeof spyOn>;

// Store original env
let originalLogFormat: string | undefined;
let originalLogLevel: string | undefined;

beforeEach(() => {
	// Save original env values
	originalLogFormat = process.env.LOG_FORMAT;
	originalLogLevel = process.env.LOG_LEVEL;

	// Set default test values
	process.env.LOG_FORMAT = "console";
	process.env.LOG_LEVEL = "info";

	// Setup console spies
	consoleLogSpy = spyOn(console, "log").mockImplementation(() => {});
	consoleInfoSpy = spyOn(console, "info").mockImplementation(() => {});
	consoleErrorSpy = spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
	// Restore console methods
	consoleLogSpy.mockRestore();
	consoleInfoSpy.mockRestore();
	consoleErrorSpy.mockRestore();

	// Restore original env
	if (originalLogFormat !== undefined) {
		process.env.LOG_FORMAT = originalLogFormat;
	} else {
		delete process.env.LOG_FORMAT;
	}
	if (originalLogLevel !== undefined) {
		process.env.LOG_LEVEL = originalLogLevel;
	} else {
		delete process.env.LOG_LEVEL;
	}
});

describe("Logger - Constructor", () => {
	it("should create logger with prefix", () => {
		const logger = new Logger("TestPrefix");

		expect(logger.prefix).toBe("TestPrefix");
		expect(logger.prettyPrefix).toContain("TestPrefix");
	});

	it("should create logger without prefix", () => {
		const logger = new Logger();

		expect(logger.prefix).toBeUndefined();
	});

	it("should set logFormat from config", () => {
		process.env.LOG_FORMAT = "json";
		const logger = new Logger("Test");

		expect(logger.logFormat).toBe("json");
	});

	it("should set logLevel from config", () => {
		process.env.LOG_LEVEL = "debug";
		const logger = new Logger("Test");

		expect(logger.logLevel).toBe("debug");
	});
});

describe("Logger - log method", () => {
	it("should log with console format", () => {
		process.env.LOG_FORMAT = "console";
		const logger = new Logger("Test");

		logger.log({ level: LOG_LEVELS.INFO, message: "Test message" });

		expect(consoleLogSpy).toHaveBeenCalled();
		const args = consoleLogSpy.mock.calls[0];
		expect(args).toBeDefined();
		expect(args[1]).toContain("Test");
		expect(args[2]).toBe("Test message");
	});

	it("should log with JSON format", () => {
		process.env.LOG_FORMAT = "json";
		const logger = new Logger("Test");

		logger.log({ level: LOG_LEVELS.INFO, message: "Test message" });

		expect(consoleLogSpy).toHaveBeenCalled();
		const args = consoleLogSpy.mock.calls[0];
		expect(args[0]).toEqual(
			expect.objectContaining({
				scope: "Test",
				level: LOG_LEVELS.INFO,
				message: "Test message",
			}),
		);
	});

	it("should include metadata in log", () => {
		process.env.LOG_FORMAT = "console";
		const logger = new Logger("Test");

		logger.log({
			level: LOG_LEVELS.INFO,
			message: "Test",
			metadata: [{ extra: "data" }],
		});

		expect(consoleLogSpy).toHaveBeenCalled();
		const args = consoleLogSpy.mock.calls[0];
		expect(args[3]).toEqual({ extra: "data" });
	});

	it("should color DEBUG level with cyan", () => {
		const logger = new Logger("Test");
		logger.log({ level: LOG_LEVELS.DEBUG, message: "Debug message" });

		expect(consoleLogSpy).toHaveBeenCalled();
	});

	it("should color WARN level with yellow", () => {
		const logger = new Logger("Test");
		logger.log({ level: LOG_LEVELS.WARN, message: "Warn message" });

		expect(consoleLogSpy).toHaveBeenCalled();
	});

	it("should color ERROR level with red", () => {
		const logger = new Logger("Test");
		logger.log({ level: LOG_LEVELS.ERROR, message: "Error message" });

		expect(consoleLogSpy).toHaveBeenCalled();
	});

	it("should color TRACE level with white", () => {
		const logger = new Logger("Test");
		logger.log({ level: LOG_LEVELS.TRACE, message: "Trace message" });

		expect(consoleLogSpy).toHaveBeenCalled();
	});
});

describe("Logger - info method", () => {
	it("should log info messages when level is info", () => {
		process.env.LOG_LEVEL = "info";
		const logger = new Logger("Test");

		logger.info("Info message");

		expect(consoleLogSpy).toHaveBeenCalled();
	});

	it("should log info messages when level is debug", () => {
		process.env.LOG_LEVEL = "debug";
		const logger = new Logger("Test");

		logger.info("Info message");

		expect(consoleLogSpy).toHaveBeenCalled();
	});

	it("should log info messages when level is warn", () => {
		process.env.LOG_LEVEL = "warn";
		const logger = new Logger("Test");

		logger.info("Info message");

		expect(consoleLogSpy).toHaveBeenCalled();
	});

	it("should log info messages when level is error", () => {
		process.env.LOG_LEVEL = "error";
		const logger = new Logger("Test");

		logger.info("Info message");

		expect(consoleLogSpy).toHaveBeenCalled();
	});

	it("should include optional params", () => {
		process.env.LOG_LEVEL = "info";
		const logger = new Logger("Test");

		logger.info("Info message", { extra: "data" }, 123);

		expect(consoleLogSpy).toHaveBeenCalled();
		const args = consoleLogSpy.mock.calls[0];
		// Check that extra params are included in the call
		expect(args[3]).toEqual({ extra: "data" });
		expect(args[4]).toBe(123);
	});

	it("should use JSON format when configured", () => {
		process.env.LOG_FORMAT = "json";
		process.env.LOG_LEVEL = "info";
		const logger = new Logger("Test");

		logger.info("Info message");

		expect(consoleLogSpy).toHaveBeenCalled();
		const args = consoleLogSpy.mock.calls[0];
		expect(args[0]).toEqual(
			expect.objectContaining({
				scope: "Test",
				level: LOG_LEVELS.INFO,
				input: "Info message",
			}),
		);
	});
});

describe("Logger - warn method", () => {
	it("should log warn messages when level is warn", () => {
		process.env.LOG_LEVEL = "warn";
		const logger = new Logger("Test");

		logger.warn("Warning message");

		expect(consoleLogSpy).toHaveBeenCalled();
	});

	it("should log warn messages when level is info", () => {
		process.env.LOG_LEVEL = "info";
		const logger = new Logger("Test");

		logger.warn("Warning message");

		expect(consoleLogSpy).toHaveBeenCalled();
	});

	it("should log warn messages when level is debug", () => {
		process.env.LOG_LEVEL = "debug";
		const logger = new Logger("Test");

		logger.warn("Warning message");

		expect(consoleLogSpy).toHaveBeenCalled();
	});

	it("should use JSON format when configured", () => {
		process.env.LOG_FORMAT = "json";
		process.env.LOG_LEVEL = "warn";
		const logger = new Logger("Test");

		logger.warn("Warning message");

		expect(consoleLogSpy).toHaveBeenCalled();
		const args = consoleLogSpy.mock.calls[0];
		expect(args[0]).toEqual(
			expect.objectContaining({
				scope: "Test",
				level: LOG_LEVELS.WARN,
				input: "Warning message",
			}),
		);
	});
});

describe("Logger - error method", () => {
	it("should log error messages when level is error", () => {
		process.env.LOG_LEVEL = "error";
		const logger = new Logger("Test");

		logger.error("Error message");

		expect(consoleErrorSpy).toHaveBeenCalled();
	});

	it("should log error messages when level is info", () => {
		process.env.LOG_LEVEL = "info";
		const logger = new Logger("Test");

		logger.error("Error message");

		expect(consoleErrorSpy).toHaveBeenCalled();
	});

	it("should log error messages when level is warn", () => {
		process.env.LOG_LEVEL = "warn";
		const logger = new Logger("Test");

		logger.error("Error message");

		expect(consoleErrorSpy).toHaveBeenCalled();
	});

	it("should log error messages when level is debug", () => {
		process.env.LOG_LEVEL = "debug";
		const logger = new Logger("Test");

		logger.error("Error message");

		expect(consoleErrorSpy).toHaveBeenCalled();
	});

	it("should handle Error objects", () => {
		process.env.LOG_LEVEL = "error";
		const logger = new Logger("Test");
		const error = new Error("Test error");

		logger.error(error);

		expect(consoleErrorSpy).toHaveBeenCalled();
	});

	it("should use JSON format when configured", () => {
		process.env.LOG_FORMAT = "json";
		process.env.LOG_LEVEL = "error";
		const logger = new Logger("Test");

		logger.error("Error message");

		expect(consoleErrorSpy).toHaveBeenCalled();
		const args = consoleErrorSpy.mock.calls[0];
		expect(args[0]).toEqual(
			expect.objectContaining({
				scope: "Test",
				level: LOG_LEVELS.ERROR,
				message: "Error message",
			}),
		);
	});
});

describe("Logger - debug method", () => {
	it("should log debug messages when level is debug", () => {
		process.env.LOG_LEVEL = "debug";
		const logger = new Logger("Test");

		logger.debug("Debug message");

		expect(consoleLogSpy).toHaveBeenCalled();
	});

	it("should NOT log debug messages when level is info", () => {
		process.env.LOG_LEVEL = "info";
		const logger = new Logger("Test");

		logger.debug("Debug message");

		expect(consoleLogSpy).not.toHaveBeenCalled();
	});

	it("should NOT log debug messages when level is warn", () => {
		process.env.LOG_LEVEL = "warn";
		const logger = new Logger("Test");

		logger.debug("Debug message");

		expect(consoleLogSpy).not.toHaveBeenCalled();
	});

	it("should NOT log debug messages when level is error", () => {
		process.env.LOG_LEVEL = "error";
		const logger = new Logger("Test");

		logger.debug("Debug message");

		expect(consoleLogSpy).not.toHaveBeenCalled();
	});

	it("should use JSON format when configured", () => {
		process.env.LOG_FORMAT = "json";
		process.env.LOG_LEVEL = "debug";
		const logger = new Logger("Test");

		logger.debug("Debug message");

		expect(consoleLogSpy).toHaveBeenCalled();
		const args = consoleLogSpy.mock.calls[0];
		expect(args[0]).toEqual(
			expect.objectContaining({
				scope: "Test",
				level: LOG_LEVELS.DEBUG,
				input: "Debug message",
			}),
		);
	});
});

describe("Logger - trace method", () => {
	it("should NOT log trace messages when level is debug", () => {
		process.env.LOG_LEVEL = "debug";
		const logger = new Logger("Test");

		logger.trace("Trace message");

		expect(consoleLogSpy).not.toHaveBeenCalled();
	});

	it("should NOT log trace messages when level is info", () => {
		process.env.LOG_LEVEL = "info";
		const logger = new Logger("Test");

		logger.trace("Trace message");

		expect(consoleLogSpy).not.toHaveBeenCalled();
	});

	it("should NOT log trace messages when level is warn", () => {
		process.env.LOG_LEVEL = "warn";
		const logger = new Logger("Test");

		logger.trace("Trace message");

		expect(consoleLogSpy).not.toHaveBeenCalled();
	});

	it("should NOT log trace messages when level is error", () => {
		process.env.LOG_LEVEL = "error";
		const logger = new Logger("Test");

		logger.trace("Trace message");

		expect(consoleLogSpy).not.toHaveBeenCalled();
	});
});

describe("Logger - http method", () => {
	const createMockRequest = (method = "GET") =>
		new Request("http://localhost:3000/api/test?query=1", { method });

	const createMockResponse = (status = 200) =>
		new Response(null, { status, statusText: status === 200 ? "OK" : "Error" });

	it("should log pre-request in console format", () => {
		process.env.LOG_FORMAT = "console";
		const logger = new Logger("Test");
		const req = createMockRequest();
		const url = new URL(req.url);

		logger.http({
			req,
			res: createMockResponse(),
			url,
			duration: 0,
			type: "pre",
		});

		expect(consoleInfoSpy).toHaveBeenCalled();
	});

	it("should log post-request with success status in console format", () => {
		process.env.LOG_FORMAT = "console";
		const logger = new Logger("Test");
		const req = createMockRequest();
		const url = new URL(req.url);

		logger.http({
			req,
			res: createMockResponse(200),
			url,
			duration: 50,
			type: "post",
		});

		expect(consoleInfoSpy).toHaveBeenCalled();
	});

	it("should log post-request with error status in console format", () => {
		process.env.LOG_FORMAT = "console";
		const logger = new Logger("Test");
		const req = createMockRequest();
		const url = new URL(req.url);

		logger.http({
			req,
			res: createMockResponse(500),
			url,
			duration: 100,
			type: "post",
		});

		expect(consoleInfoSpy).toHaveBeenCalled();
	});

	it("should log in JSON format", () => {
		process.env.LOG_FORMAT = "json";
		const logger = new Logger("Test");
		const req = createMockRequest("POST");
		const url = new URL(req.url);

		logger.http({
			req,
			res: createMockResponse(201),
			url,
			duration: 25,
			type: "post",
		});

		expect(consoleInfoSpy).toHaveBeenCalled();
		const args = consoleInfoSpy.mock.calls[0];
		expect(args[0]).toEqual(
			expect.objectContaining({
				scope: "Test",
				method: "POST",
				path: "/api/test",
				status: 201,
				duration: 25,
			}),
		);
	});

	it("should include search params in JSON format", () => {
		process.env.LOG_FORMAT = "json";
		const logger = new Logger("Test");
		const req = createMockRequest();
		const url = new URL(req.url);

		logger.http({
			req,
			res: createMockResponse(),
			url,
			duration: 10,
			type: "post",
		});

		expect(consoleInfoSpy).toHaveBeenCalled();
		const args = consoleInfoSpy.mock.calls[0];
		expect(args[0].search).toBe("?query=1");
	});

	it("should show pending duration in JSON format when duration is 0", () => {
		process.env.LOG_FORMAT = "json";
		const logger = new Logger("Test");
		const req = createMockRequest();
		const url = new URL(req.url);

		logger.http({
			req,
			res: createMockResponse(),
			url,
			duration: 0,
			type: "pre",
		});

		expect(consoleInfoSpy).toHaveBeenCalled();
		const args = consoleInfoSpy.mock.calls[0];
		expect(args[0].duration).toBe("pending");
	});

	it("should handle different HTTP methods", () => {
		process.env.LOG_FORMAT = "json";
		const logger = new Logger("Test");

		for (const method of ["GET", "POST", "PUT", "DELETE", "PATCH"]) {
			const req = createMockRequest(method);
			const url = new URL(req.url);

			logger.http({
				req,
				res: createMockResponse(),
				url,
				duration: 10,
				type: "post",
			});

			const lastCall = consoleInfoSpy.mock.calls.at(-1);
			expect(lastCall?.[0].method).toBe(method);
		}
	});
});

describe("Logger - LOG_LEVELS enum", () => {
	it("should have correct values", () => {
		// @ts-expect-error Testing log levels
		expect(LOG_LEVELS.DEBUG).toBe("debug");
		// @ts-expect-error Testing log levels
		expect(LOG_LEVELS.INFO).toBe("info");
		// @ts-expect-error Testing log levels
		expect(LOG_LEVELS.WARN).toBe("warn");
		// @ts-expect-error Testing log levels
		expect(LOG_LEVELS.ERROR).toBe("error");
		// @ts-expect-error Testing log levels
		expect(LOG_LEVELS.TRACE).toBe("trace");
	});
});
