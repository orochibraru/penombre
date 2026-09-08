declare module "music-metadata" {
	export function parseFile(
		filePath: string,
		options?: unknown,
	): Promise<{
		common: Record<string, unknown>;
		format: {
			duration?: number;
			bitrate?: number;
			sampleRate?: number;
			numberOfChannels?: number;
			codec?: string;
			container?: string;
			[key: string]: unknown;
		};
		native: Record<string, Array<{ id: string; value: unknown }>>;
		quality: { warnings: Array<{ message: string }> };
	}>;
}
