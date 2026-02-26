import { useCallback, useEffect, useState } from "react";

type AsyncFn<T> = () => Promise<{ data?: T; error?: string }>;

/**
 * A simple hook for fetching API data with loading/error/refresh states.
 */
export function useApiQuery<T>(fn: AsyncFn<T>) {
	const [data, setData] = useState<T | undefined>(undefined);
	const [error, setError] = useState<string | undefined>(undefined);
	const [loading, setLoading] = useState(true);

	const fetchData = useCallback(async () => {
		setLoading(true);
		setError(undefined);
		const result = await fn();
		if (result.error) {
			setError(result.error);
		} else {
			setData(result.data);
		}
		setLoading(false);
	}, [fn]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	return { data, error, loading, refetch: fetchData };
}
