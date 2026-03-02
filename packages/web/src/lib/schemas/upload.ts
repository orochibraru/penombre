import z from "zod";

export const uploadSchema = z.object({
	attachments: z.array(z.instanceof(File)).min(1),
	rootFolder: z.string(),
});

export type UploadSchema = z.infer<typeof uploadSchema>;

export type CustomReq = {
	file: string;
	// biome-ignore lint/suspicious/noExplicitAny: Treaty is too complicated to type.
	promise: any;
	error: boolean;
	fullfilled: boolean;
	errorMessage?: string;
};
