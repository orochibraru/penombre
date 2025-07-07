import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { blue, cyan, gray, green, magenta, red, white, yellow } from '@kitql/helpers';

const logFormats = ['console', 'json'];
export type LogFormats = 'console' | 'json';

export enum LOG_LEVELS {
	INFO = 'INFO',
	WARN = 'WARN',
	ERROR = 'ERROR',
	DEBUG = 'DEBUG',
	TRACE = 'TRACE'
}

const logLevels = [
	LOG_LEVELS.INFO,
	LOG_LEVELS.WARN,
	LOG_LEVELS.ERROR,
	LOG_LEVELS.DEBUG,
	LOG_LEVELS.TRACE
];

export type HttpLog = {
	req: Request;
	url: URL;
	res: Response;
	duration: number;
	type: 'pre' | 'post';
};

export class Logger {
	logFormat: 'console' | 'json';
	prefix?: string;
	prettyPrefix?: string;
	logLevel: LOG_LEVELS;

	/**
	 * Initializes a new instance of the Logger class.
	 * @param prefix Optional string to be used as a prefix for log messages.
	 * Sets the log format based on the LOG_FORMAT environment variable. If the environment variable
	 * is not set, defaults to 'console'. Throws an error if the format is invalid.
	 */
	constructor(prefix?: string) {
		let formatEnv = env.LOG_FORMAT;

		if (!formatEnv) {
			formatEnv = 'console';
		} else if (!logFormats.includes(formatEnv)) {
			throw new Error(
				`Invalid LOG_FORMAT. Please set to either: 'console', or 'json' (Received: ${formatEnv}).`
			);
		}

		const envLogLevel: LOG_LEVELS | null = env.LOG_LEVEL
			? (env.LOG_LEVEL.toUpperCase() as LOG_LEVELS)
			: null;

		if (envLogLevel && !logLevels.includes(envLogLevel)) {
			throw new Error(
				`Invalid LOG_LEVEL. Please set it to one of the following: ${logLevels.join(', ')}`
			);
		}

		this.prefix = prefix;
		this.prettyPrefix = magenta(`[${this.prefix}]`);
		this.logFormat = formatEnv as LogFormats;
		const defaultLogLevel: LOG_LEVELS = dev ? LOG_LEVELS.DEBUG : LOG_LEVELS.INFO;
		this.logLevel = (envLogLevel as LOG_LEVELS) ?? defaultLogLevel;
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
		if (this.logFormat === 'console') {
			if (type === 'pre') {
				return console.info(
					this.prettyPrefix,
					`[${blue(`${url.protocol.replace(':', '').toUpperCase()}::${req.method}`)}] ${url.pathname}${url.search}`
				);
			}

			let color: (str: string) => string;
			let statusText = 'OK';

			if (res.status > 307) {
				// Error
				color = red;
				statusText = res.statusText;
			} else {
				// Normal
				color = green;
			}

			return console.info(
				this.prettyPrefix,
				`[${color(`${url.protocol.replace(':', '').toUpperCase()}::${req.method}`)}] ${color(res.status.toString())} ${statusText} ${url.pathname}${url.search} ${gray(`[${duration}ms]`)}`
			);
		}

		return console.info({
			scope: this.prefix,
			method: req.method,
			path: url.pathname,
			proto: url.protocol,
			status: res.status,
			duration: duration === 0 ? 'pending' : duration,
			search: url.search === '' ? undefined : url.search,
			statusText: res.statusText === '' ? undefined : res.statusText
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
			LOG_LEVELS.TRACE
		];
		if (!acceptedLogLevels.includes(this.logLevel)) {
			return;
		}

		if (this.logFormat === 'console') {
			return console.log(
				this.prettyPrefix,
				blue(`[LEVEL::${LOG_LEVELS.INFO}]`),
				input,
				...optionalParams
			);
		}

		return console.log({
			scope: this.prefix,
			level: LOG_LEVELS.INFO,
			input,
			...optionalParams
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
			LOG_LEVELS.ERROR,
			LOG_LEVELS.DEBUG,
			LOG_LEVELS.TRACE
		];
		if (!acceptedLogLevels.includes(this.logLevel)) {
			return;
		}

		if (this.logFormat === 'console') {
			return console.log(
				this.prettyPrefix,
				yellow(`[LEVEL::${LOG_LEVELS.WARN}]`),
				input,
				...optionalParams
			);
		}

		return console.log({
			scope: this.prefix,
			level: LOG_LEVELS.WARN,
			input,
			...optionalParams
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
		const acceptedLogLevels = [LOG_LEVELS.ERROR, LOG_LEVELS.DEBUG, LOG_LEVELS.TRACE];
		if (!acceptedLogLevels.includes(this.logLevel)) {
			return;
		}

		if (this.logFormat === 'console') {
			return console.error(
				this.prettyPrefix,
				`${red(`[LEVEL::${LOG_LEVELS.ERROR}]`)}`,
				err,
				...optionalParams
			);
		}

		return console.error({
			scope: this.prefix,
			level: LOG_LEVELS.ERROR,
			message: err,
			...optionalParams
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
		if (!acceptedLogLevels.includes(this.logLevel)) {
			return;
		}

		if (this.logFormat === 'console') {
			console.log();
			return console.log(
				this.prettyPrefix,
				cyan(`[LEVEL::${LOG_LEVELS.DEBUG}]`),
				input,
				...optionalParams
			);
		}

		return console.log({
			scope: this.prefix,
			level: LOG_LEVELS.DEBUG,
			input,
			...optionalParams
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
		if (!acceptedLogLevels.includes(this.logLevel)) {
			return;
		}

		if (this.logFormat === 'console') {
			console.log();
			return console.log(
				this.prettyPrefix,
				white(`[LEVEL::${LOG_LEVELS.TRACE}]`),
				input,
				...optionalParams
			);
		}

		return console.log({
			scope: this.prefix,
			level: LOG_LEVELS.TRACE,
			input,
			...optionalParams
		});
	}
}
