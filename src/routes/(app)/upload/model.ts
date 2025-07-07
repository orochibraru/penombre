export type CustomReq = {
	file: string;
	// biome-ignore lint/suspicious/noExplicitAny: Treaty is too complicated to type.
	promise: any;
	error: boolean;
	fullfilled: boolean;
	errorMessage?: string;
};
