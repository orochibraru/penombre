import {
	blue,
	cyan,
	gray,
	green,
	magenta,
	red,
	white,
	yellow,
} from "@kitql/helpers";
import { building, dev } from "$app/environment";
import { getPenombreConfig } from "$lib/server/config";

export type LogFormats = "console" | "json";

export enum LOG_LEVELS {
	DEBUG = "debug",
	INFO = "info",
	WARN = "warn",
	ERROR = "error",
	TRACE = "trace",
}

type RawLogLevels = "debug" | "info" | "warn" | "error" | "trace";

export type HttpLog = {
	req: Request;
	url: URL;
	res: Response;
	duration: number;
	type: "pre" | "post";
};

export class Logger {
	logFormat: "console" | "json";
	prefix?: string;
	prettyPrefix?: string;
	logLevel: LOG_LEVELS | RawLogLevels;

	/**
	 * Initializes a new instance of the Logger class.
	 * @param prefix Optional string to be used as a prefix for log messages.
	 * Sets the log format based on the LOG_FORMAT environment variable. If the environment variable
	 * is not set, defaults to 'console'. Throws an error if the format is invalid.
	 */
	constructor(prefix?: string) {
		const config = getPenombreConfig();

		this.prefix = prefix;
		this.prettyPrefix = magenta(`[${this.prefix}]`);
		this.logFormat = config.logFormat;
		if (dev && !building) {
			this.logLevel = LOG_LEVELS.DEBUG;
		} else if (
			config.logFormat === "console" &&
			!Object.values(LOG_LEVELS).includes(config.logLevel as LOG_LEVELS)
		) {
			throw new Error(
				`Invalid log level: ${config.logLevel}. Valid levels are: ${Object.values(
					LOG_LEVELS,
				).join(", ")}`,
			);
		} else {
			this.logLevel = config.logLevel;
		}
	}

	log({
		level,
		message,
		metadata = [],
	}: {
		level: LOG_LEVELS | RawLogLevels;
		message: string;
		metadata?: unknown[];
	}) {
		if (this.logFormat === "console") {
			const colorFn = (str: string) => {
				switch (level) {
					case LOG_LEVELS.DEBUG:
						return cyan(str);
					case LOG_LEVELS.INFO:
						return blue(str);
					case LOG_LEVELS.WARN:
						return yellow(str);
					case LOG_LEVELS.ERROR:
						return red(str);
					case LOG_LEVELS.TRACE:
						return white(str);
					default:
						return str;
				}
			};

			console.log(
				colorFn(`[LEVEL::${level}]`),
				this.prettyPrefix,
				message,
				...metadata,
			);
			return;
		}

		console.log({
			scope: this.prefix,
			level,
			message,
			...metadata,
		});
	}

	/**
	 * Logs an HTTP request and response information.
	 * @param {HttpLog} log - An object containing details of the HTTP request/response.
	 * @param {Request} log.req - The HTTP request object.
	 * @param {Response} log.res - The HTTP response object.
	 * @param {number} log.duration - The duration of the request in milliseconds.
	 * @param {string} log.path - The path of the request.
	 * @param {'pre' | 'post'} log.type - The type of log, either 'pre' for request or 'post' for response.
	 * If `this.logFormat` is set to 'console', logs formatted information to the console.
	 * Otherwise, logs a JSON object with relevant HTTP details.
	 */
	http({ req, res, duration, url, type }: HttpLog) {
		if (this.logFormat === "console") {
			if (type === "pre") {
				return console.info(
					blue(
						`[${url.protocol.replace(":", "").toUpperCase()}::${req.method}]`,
					),
					`${url.pathname}${url.search}`,
					this.prettyPrefix,
				);
			}

			let color: (str: string) => string;

			color = green;
			if (res.status > 307) {
				// Error
				color = red;
			}

			return console.info(
				color(
					`[${url.protocol.replace(":", "").toUpperCase()}::${req.method}]`,
				),
				color(res.status.toString()),
				`${url.pathname}${url.search} ${gray(`[${duration}ms]`)}`,
				this.prettyPrefix,
			);
		}

		return console.info({
			scope: this.prefix,
			method: req.method,
			path: url.pathname,
			proto: url.protocol,
			status: res.status,
			duration: duration === 0 ? "pending" : duration,
			search: url.search === "" ? undefined : url.search,
			statusText: res.statusText === "" ? undefined : res.statusText,
		});
	}

	/**
	 * Logs an INFO level message to the console.
	 * @param input The input to log. Can be any type. If an object, it will be stringified.
	 * @param optionalParams Any additional parameters to log.
	 * If `this.logFormat` is set to 'console', the message will be logged as a console.log.
	 * Otherwise, it will be logged as a JSON object with the level set to 'info'.
	 */
	info(input: unknown, ...optionalParams: unknown[]) {
		const acceptedLogLevels = [
			LOG_LEVELS.INFO,
			LOG_LEVELS.WARN,
			LOG_LEVELS.ERROR,
			LOG_LEVELS.DEBUG,
			LOG_LEVELS.TRACE,
		];
		if (!acceptedLogLevels.includes(this.logLevel as LOG_LEVELS)) {
			return;
		}

		if (this.logFormat === "console") {
			return console.log(
				blue(`[LEVEL::${LOG_LEVELS.INFO.toUpperCase()}] `),
				this.prettyPrefix,
				input,
				...optionalParams,
			);
		}

		return console.log({
			scope: this.prefix,
			level: LOG_LEVELS.INFO,
			input,
			...optionalParams,
		});
	}

	/**
	 * Logs a WARN level message to the console.
	 * @param input The input to log. Can be any type. If an object, it will be stringified.
	 * @param optionalParams Any additional parameters to log.
	 * If `this.logFormat` is set to 'console', the message will be logged as a console.log with a yellow prefix.
	 * Otherwise, it will be logged as a JSON object with the level set to 'warn'.
	 */
	warn(input: unknown, ...optionalParams: unknown[]) {
		const acceptedLogLevels = [
			LOG_LEVELS.WARN,
			LOG_LEVELS.INFO,
			LOG_LEVELS.ERROR,
			LOG_LEVELS.DEBUG,
			LOG_LEVELS.TRACE,
		];
		if (!acceptedLogLevels.includes(this.logLevel as LOG_LEVELS)) {
			return;
		}

		if (this.logFormat === "console") {
			return console.log(
				yellow(`[LEVEL::${LOG_LEVELS.WARN.toUpperCase()}] `),
				this.prettyPrefix,
				input,
				...optionalParams,
			);
		}

		return console.log({
			scope: this.prefix,
			level: LOG_LEVELS.WARN,
			input,
			...optionalParams,
		});
	}

	/**
	 * Logs an ERROR level message to the console.
	 * @param err The error to log.
	 * @param optionalParams Any additional parameters to log.
	 * If `this.logFormat` is set to 'console', logs an error to the console with a red prefix.
	 * Otherwise, logs a JSON object with the level set to 'error' and the error as the message.
	 */
	// biome-ignore lint/suspicious/noExplicitAny: This is a logger
	error(err: any, ...optionalParams: unknown[]) {
		const acceptedLogLevels = [
			LOG_LEVELS.ERROR,
			LOG_LEVELS.INFO,
			LOG_LEVELS.WARN,
			LOG_LEVELS.DEBUG,
			LOG_LEVELS.TRACE,
		];
		if (!acceptedLogLevels.includes(this.logLevel as LOG_LEVELS)) {
			return;
		}

		if (this.logFormat === "console") {
			return console.error(
				red(`[LEVEL::${LOG_LEVELS.ERROR.toUpperCase()}]`),
				this.prettyPrefix,
				err,
				...optionalParams,
			);
		}

		return console.error({
			scope: this.prefix,
			level: LOG_LEVELS.ERROR,
			message: err,
			...optionalParams,
		});
	}

	/**
	 * Logs a DEBUG level message to the console.
	 * @param input The input to log. Can be any type. If an object, it will be stringified.
	 * @param optionalParams Any additional parameters to log.
	 * If `this.logFormat` is set to 'console', the message will be logged as a console.log with a cyan prefix.
	 * Otherwise, it will be logged as a JSON object with the level set to 'debug'.
	 */
	debug(input: unknown, ...optionalParams: unknown[]) {
		const acceptedLogLevels = [LOG_LEVELS.DEBUG, LOG_LEVELS.TRACE];
		if (!acceptedLogLevels.includes(this.logLevel as LOG_LEVELS)) {
			return;
		}

		if (this.logFormat === "console") {
			return console.log(
				cyan(`[LEVEL::${LOG_LEVELS.DEBUG.toUpperCase()}]`),
				this.prettyPrefix,
				input,
				...optionalParams,
			);
		}

		return console.log({
			scope: this.prefix,
			level: LOG_LEVELS.DEBUG,
			input,
			...optionalParams,
		});
	}

	/**
	 * Logs a TRACE level message to the console.
	 * @param input The input to log. Can be any type. If an object, it will be stringified.
	 * @param optionalParams Any additional parameters to log.
	 * If `this.logFormat` is set to 'console', the message will be logged as a console.log with a cyan prefix.
	 * Otherwise, it will be logged as a JSON object with the level set to 'trace'.
	 */

	trace(input: unknown, ...optionalParams: unknown[]) {
		const acceptedLogLevels = [LOG_LEVELS.TRACE];
		if (!acceptedLogLevels.includes(this.logLevel as LOG_LEVELS)) {
			return;
		}

		if (this.logFormat === "console") {
			console.log();
			return console.log(
				this.prettyPrefix,
				white(`[LEVEL::${LOG_LEVELS.TRACE.toUpperCase()}]`),
				input,
				...optionalParams,
			);
		}

		return console.log({
			scope: this.prefix,
			level: LOG_LEVELS.TRACE,
			input,
			...optionalParams,
		});
	}
}
