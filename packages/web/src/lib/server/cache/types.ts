/**
 * Async cache backend interface.
 * All implementations must provide these methods.
 */
export interface CacheBackend {
	get<T>(key: string): Promise<T | undefined>;
	set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
	delete(key: string): Promise<boolean>;
	deleteByPrefix(prefix: string): Promise<number>;
	clear(): Promise<void>;
	getSize(): Promise<number>;
}
