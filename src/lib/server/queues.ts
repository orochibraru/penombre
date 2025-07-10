import type { User } from 'better-auth';
import { building } from '$app/environment';
import { QueueService } from '$lib/server/services/queue';

let uploadQueueInstance: QueueService<UploadQueueJob> | undefined;

export type UploadQueueJob = {
	tempFilePath: string;
	originalFileName: string;
	originalChecksum: string;
	user: User;
};

export function uploadQueue(): QueueService<UploadQueueJob> | undefined {
	if (building) {
		return;
	}

	if (!uploadQueueInstance) {
		uploadQueueInstance = new QueueService<UploadQueueJob>({
			name: 'Uploads',
			concurrency: 5
		});
	}

	return uploadQueueInstance;
}
