import { t } from 'elysia';

export const unauthorizedSchema = t.Unknown({ description: 'Unauthorized' });

export const notFoundSchema = t.Unknown({ description: 'Not Found' });
export const deletedSchema = t.Unknown({ description: 'Deleted' });

export const internalServerErrorSchema = t.Unknown({ description: 'Internal Server Error' });
export const badRequestErrorSchema = t.Object({
	message: t.String({ description: 'Error details' })
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
