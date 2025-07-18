import { t } from 'elysia';

export const simplisticSchema = t.Unknown({
	description: 'OK',
	default: 'OK'
});

export const unauthorizedSchema = t.Unknown({
	description: 'Unauthorized',
	default: 'Unauthorized'
});

export const createdSchema = t.Unknown({
	description: 'Created',
	default: 'Created'
});

export const notFoundSchema = t.Unknown({ description: 'Not Found', default: 'Not Found' });
export const deletedSchema = t.Unknown({ description: 'Deleted', default: 'Deleted' });

export const pongSchema = t.String({
	description: 'Should respond "PONG!"',
	default: 'PONG!'
});

export const internalServerErrorSchema = t.Unknown({
	description: 'Internal Server Error',
	default: 'Internal Server Error'
});
export const badRequestErrorSchema = t.Object({
	message: t.String({ description: 'Error details', default: 'Bad Request' })
});

enum ErrorLocations {
	BODY = 'body',
	HEADERS = 'headers',
	PATH = 'path'
}

export const validationErrorSchema = t.Object({
	type: t.Numeric(),
	schema: t.Any({
		default: {
			minLength: 3,
			type: 'string'
		}
	}),
	path: t.String({ default: '/<property-name>' }),
	message: t.String({ default: 'Expected required property' }),
	errors: t.Array(t.String()),
	summary: t.String({ default: "Property '<property-name>' is missing" })
});

export const validationErrorWrapperSchema = t.Object({
	type: t.String({ default: 'validation' }),
	on: t.Enum(ErrorLocations, { default: 'body' }),
	summary: t.String({ default: "Property '<property-name>' is missing" }),
	property: t.String({ default: '/<property-name>' }),
	message: t.String({ default: 'Expected required property' }),
	expected: t.Record(t.String(), t.String()),
	found: t.Record(t.String(), t.String()),
	errors: t.Array(validationErrorSchema)
});

export const BareBonesFileSchema = t.Object({
	name: t.String(),
	type: t.String(),
	metadata: t.Any()
});

export const UploadedFileSchema = t.Object({
	file: BareBonesFileSchema,
	finalName: t.String(),
	presignedUrl: t.String()
});
