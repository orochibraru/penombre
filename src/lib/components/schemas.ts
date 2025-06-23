import { z } from 'zod/v4';

export const schema = z.object({
	id: z.number(),
	title: z.string(),
	category: z.string(),
	status: z.string(),
	size: z.number(),
	createdAt: z.date(),
	lastUpdated: z.date()
});

export type DataItem = z.infer<typeof schema>;
