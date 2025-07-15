import * as v from 'valibot';

export const uploadSchema = v.object({
	attachments: v.pipe(v.array(v.pipe(v.file())), v.minLength(1))
});

export type UploadSchema = v.InferInput<typeof uploadSchema>;

export type CustomReq = {
	file: string;
	// biome-ignore lint/suspicious/noExplicitAny: Treaty is too complicated to type.
	promise: any;
	error: boolean;
	fullfilled: boolean;
	errorMessage?: string;
};
