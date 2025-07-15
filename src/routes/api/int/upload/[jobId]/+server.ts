import { uploadQueue } from '$lib/server/queues';

export const DELETE = ({ params, locals }) => {
	const logger = locals.logger;

	const jobId = params.jobId;

	if (!jobId) {
		return new Response(JSON.stringify({ error: 'Missing JobID' }), {
			status: 400
		});
	}

	logger.debug('Deleting job', jobId);

	const queue = uploadQueue();

	if (!queue) {
		logger.error('Failed to get queue');
		return new Response(JSON.stringify({ error: 'Failed to get queue' }), {
			status: 500
		});
	}

	try {
		queue.remove(jobId);
	} catch (e) {
		logger.error(`Failed to remove job ${jobId}`, e);
		return new Response(JSON.stringify({ error: `Failed to remove job ${jobId}` }), {
			status: 500
		});
	}

	return new Response(null, {
		status: 204
	});
};
