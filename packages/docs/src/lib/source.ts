import { docs } from "collections/server";
import { type InferPageType, loader } from "fumadocs-core/source";
import { lucideIconsPlugin } from "fumadocs-core/source/lucide-icons";
import { openapiPlugin } from "fumadocs-openapi/server";

export const source = loader({
	source: docs.toFumadocsSource(),
	baseUrl: "/docs",
	plugins: [lucideIconsPlugin(), openapiPlugin()],
});

export async function getLLMText(page: InferPageType<typeof source>) {
	const processed = await page.data.getText("processed");

	return `# ${page.data.title}

${processed}`;
}
