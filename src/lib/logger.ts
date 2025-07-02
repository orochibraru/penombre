import { env } from '$env/dynamic/private';
import { blue, cyan, gray, green, red } from '@kitql/helpers';

const logFormats = ['console', 'json'];
export type LogFormats = 'console' | 'json';

export enum LOG_LEVELS {
	INFO = 'info',
	DEBUG = 'debug',
	ERROR = 'error',
	WARN = 'warn',
	TRACE = 'trace',
	HTTP = 'http'
}

export type HttpLog = {
	req: Request;
	path: string;
	res: Response;
	duration: number;
	type: 'pre' | 'post';
};

export class Logger {
	logFormat: 'console' | 'json';
	prefix?: string;

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

		this.prefix = prefix;
		this.logFormat = formatEnv as LogFormats;
	}

	/**
	 * Logs an INFO level message to the console.
	 * @param input The input to log. Can be any type. If an object, it will be stringified.
	 * @param optionalParams Any additional parameters to log.
	 * If `this.logFormat` is set to 'console', the message will be logged as a console.log.
	 * Otherwise, it will be logged as a JSON object with the level set to 'info'.
	 */
	info(input: unknown, ...optionalParams: unknown[]) {
		if (this.logFormat === 'console') {
			return console.log(blue(`[${LOG_LEVELS.INFO}]`), input, ...optionalParams);
		}

		return console.log({
			level: LOG_LEVELS.INFO,
			input,
			...optionalParams
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

	http({ req, res, duration, path, type }: HttpLog) {
		if (this.logFormat === 'console') {
			if (type === 'pre') {
				return console.info(`===> ${green(req.method)} ${path}`);
			}

			let color: (str: string) => string;
			let arrows = '<===';
			let statusText = 'OK';

			if (res.status > 204) {
				// Error
				color = red;
				arrows = '<=x=';
				statusText = res.statusText;
			} else {
				// Normal
				color = blue;
			}

			return console.info(
				`${arrows} ${color(res.status.toString())} ${statusText} ${path} ${gray(`[${duration}ms]`)}`
			);
		}

		return console.info({
			method: req.method,
			path: path,
			status: res.status,
			statusText: res.statusText,
			duration
		});
	}

	/**
	 * Logs an ERROR level message to the console.
	 * @param err The error to log.
	 * @param optionalParams Any additional parameters to log.
	 * If `this.logFormat` is set to 'console', logs an error to the console with a red prefix.
	 * Otherwise, logs a JSON object with the level set to 'error' and the error as the message.
	 */
	error(err: unknown, ...optionalParams: unknown[]) {
		if (this.logFormat === 'console') {
			return console.error(`${red(`[${LOG_LEVELS.ERROR}]`)}`, err, ...optionalParams);
		}

		return console.error({
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
		if (this.logFormat === 'console') {
			return console.log(cyan(`[${LOG_LEVELS.DEBUG}]`), input, ...optionalParams);
		}

		return console.log({
			level: LOG_LEVELS.DEBUG,
			input,
			...optionalParams
		});
	}
}
