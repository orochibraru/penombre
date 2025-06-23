import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import * as Minio from 'minio';

export class StorageService extends Minio.Client {
	constructor() {
		super({
			endPoint: env.MINIO_ENDPOINT ?? '0.0.0.0',
			port: 9000,
			useSSL: !dev,
			accessKey: 'opendrive',
			secretKey: 'opendrive'
		});
	}
}
