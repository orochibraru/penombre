import { type Job, type JobJson, Queue, Worker } from 'bullmq';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { Logger } from '$lib/logger';

const redisConnection = {
	host: dev ? '0.0.0.0' : env.REDIS_HOST,
	port: 6379
};

export interface INewQueue {
	name: string;
	concurrency: number;
}

export class QueueService<DataType> extends Queue<DataType> {
	public name: string;
	public logger: Logger;
	private concurrency: number;

	/**
	 * Creates a new instance of the QueueService class.
	 *
	 * @param {INewQueue} args - An object containing the name of the queue and a callback function.
	 * The callback function will be executed for each job in the queue.
	 *
	 * The callback function will receive a Job object as an argument, which is a object containing
	 * the id, name, and data of the job.
	 *
	 * The callback function should return a Promise that resolves when the job is completed.
	 *
	 * The constructor also sets up a Worker to process jobs in the queue.
	 * The Worker will execute the callback function for each job in the queue.
	 *
	 * The constructor also sets up a Logger to log information about the queue.
	 *
	 * The constructor will also set up an event listener for the 'progress' event on the Worker.
	 * When a job is processed, the event listener will be called with a Job object as an argument.
	 * The event listener will log a message to the console with the id, name, and progress of the job.
	 */
	constructor(args: INewQueue) {
		super(args.name, {
			connection: redisConnection
		});

		this.logger = new Logger(`Queue::${args.name}`);
		this.logger.info(`Initialized queue ${args.name}`);
		this.name = args.name;
		this.concurrency = args.concurrency;
	}

	/**
	 * Sets up a worker to process jobs in the queue.
	 *
	 * The callback function will be executed for each job in the queue.
	 * The callback function will receive a Job object as an argument, which is an object containing
	 * the id, name, and data of the job.
	 *
	 * The callback function should return a Promise that resolves when the job is completed.
	 *
	 * The worker will execute the callback function for each job in the queue.
	 *
	 * The worker will also set up event listeners for the following events:
	 *
	 * - stalled: Called when the worker is stalled.
	 * - closed: Called when the worker is closed.
	 * - failed: Called when a job fails.
	 * - resumed: Called when the worker is resumed.
	 * - drained: Called when the queue is drained.
	 * - progress: Called when a job is processed.
	 *
	 * The worker will log information to the console when events occur.
	 *
	 * @param {Function} callback - The callback function to execute for each job.
	 * @returns {Worker} The worker instance.
	 */
	public setWorker(callback: (job: Job<DataType>) => void): Worker<DataType> {
		const worker = new Worker<DataType>(
			this.name,
			async (job) => {
				return callback(job);
			},
			{
				autorun: false,
				connection: redisConnection,
				concurrency: this.concurrency
			}
		);

		worker.on('stalled', () => {
			this.logger.info('Worker is stalled');
		});

		worker.on('closed', () => {
			this.logger.info('Worker was closed');
		});

		worker.on('failed', (job, err) => {
			if (!job) {
				this.logger.error('Unknown worker failure.', err);
				return;
			}

			this.logger.error(`Job #${job.id} failure`, err);
		});

		worker.on('resumed', () => {
			this.logger.info('Worker resumed');
		});

		worker.on('drained', () => {
			this.logger.info('Worker drained');
		});

		worker.on('progress', (job) => {
			this.logger.info(`Job ${job.name} (#${job.id}) progress: ${job.progress}`);
		});

		return worker;
	}

	/**
	 * Cleans up all jobs in the queue by removing each one.
	 * Logs the start and end of the cleanup process.
	 * Skips jobs without an id.
	 */
	public async cleanup(): Promise<void> {
		this.logger.info('Cleaning up jobs');
		const jobs = await this.getJobs();

		for (const job of jobs) {
			if (!job.id) {
				continue;
			}

			await this.remove(job.id);
		}

		this.logger.info('Finished cleaning up jobs');
	}

	/**
	 * Retrieves and lists all jobs in the queue.
	 * The jobs are mapped to include only their id, name, and progress.
	 * The resulting list is sorted by job id in ascending order.
	 */
	public async listJobs(): Promise<JobJson[]> {
		const jobs = await this.getJobs();

		const filtered = jobs.filter((job) => job.id !== undefined);

		const mapped = filtered.map((job) => {
			return job.asJSON();
		});

		const sorted = mapped.sort((a, b) => {
			if (!a.id || !b.id) {
				return -1;
			}

			return a.id.localeCompare(b.id);
		});

		return sorted;
	}
}
