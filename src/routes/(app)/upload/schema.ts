import * as v from 'valibot';

export const schema = v.object({
	attachments: v.pipe(v.array(v.pipe(v.file())), v.minLength(1))
});

export type Schema = v.InferInput<typeof schema>;
