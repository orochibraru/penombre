import { Http } from "#lib/server/http.js";
import {
	createFileVersion,
	listFileVersions,
} from "#lib/server/openapi/v1/versions.js";

export const GET = listFileVersions.handler(async ({ params, service }) => {
	const [listed, versioning] = await Promise.all([
		service.listFileVersions(params.id),
		service.fileVersioning(params.id),
	]);
	if (!(listed && versioning)) {
		return Http.NotFound("File not found");
	}
	const { file, versions } = listed;
	return Http.Ok({
		current: {
			size: file.size,
			updatedAt: file.updatedAt.toISOString(),
			nextSeq: (versions[0]?.seq ?? 0) + 1,
		},
		versions: versions.map((version) => ({
			id: version.id,
			seq: version.seq,
			size: version.size,
			contentType: version.contentType,
			name: version.name,
			authorName: version.authorName,
			createdAt: version.createdAt.toISOString(),
		})),
		versioning,
	});
});

export const POST = createFileVersion.handler(async ({ params, service }) => {
	const version = await service.snapshotFile(params.id);
	if (!version) {
		return Http.NotFound("File not found");
	}
	return Http.Ok({
		id: version.id,
		seq: version.seq,
		size: version.size,
		contentType: version.contentType,
		name: version.name,
		authorName: null,
		createdAt: version.createdAt.toISOString(),
	});
});
