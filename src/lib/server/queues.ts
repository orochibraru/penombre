import { QueueService } from '$lib/server/services/queue';

export type UploadQueueJob = {
	tempFilePath: string;
	originalFileName: string;
	originalChecksum: string;
};

export const uploadQueue = new QueueService<UploadQueueJob>({
	name: 'Uploads',
	concurrency: 5
});
