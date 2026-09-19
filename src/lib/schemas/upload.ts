import z from "zod";

export const uploadSchema = z.object({
	attachments: z.array(z.instanceof(File)).min(1),
	rootFolder: z.string(),
});

export type UploadSchema = z.infer<typeof uploadSchema>;

export interface CustomReq {
	file: string;
	promise: any;
	error: boolean;
	fulfilled: boolean;
	errorMessage?: string;
}
