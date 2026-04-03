import type { LoaderConfig, LoaderOutput } from "fumadocs-core/source";
import {
	DocsBody,
	DocsDescription,
	DocsPage,
	DocsTitle,
	MarkdownCopyButton,
	ViewOptionsPopover,
} from "fumadocs-ui/layouts/notebook/page";
import { createRelativeLink } from "fumadocs-ui/mdx";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMDXComponents } from "@/components/mdx";
import { gitConfig } from "@/lib/layout.shared";
import { getPageImage, source } from "@/lib/source";

export default async function Page(props: PageProps<"/docs/[[...slug]]">) {
	const params = await props.params;
	const page = source.getPage(params.slug);
	if (!page) notFound();

	const MDX = page.data.body;
	const markdownUrl = `/llms.mdx/docs/${[...page.slugs, "index.mdx"].join("/")}`;

	return (
		<DocsPage toc={page.data.toc} full={page.data.full}>
			<DocsTitle>{page.data.title}</DocsTitle>
			<DocsDescription className="mb-0">
				{page.data.description}
			</DocsDescription>
			<div className="flex flex-row gap-2 items-center border-b pb-6">
				<MarkdownCopyButton markdownUrl={markdownUrl} />
				<ViewOptionsPopover
					markdownUrl={markdownUrl}
					githubUrl={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/content/docs/${page.path}`}
				/>
			</div>
			<DocsBody>
				<MDX
					components={getMDXComponents({
						// this allows you to link to other pages with relative file paths
						a: createRelativeLink(
							source as unknown as LoaderOutput<LoaderConfig>,
							page,
						),
					})}
				/>
			</DocsBody>
			<p className="text-xs text-gray-500">
				Found an issue or want to contribute?{" "}
				<a
					href={`https://github.com/orochibraru/penombre/edit/main/packages/docs/content/docs/${page.path}`}
					rel="noreferrer noopener"
					target="_blank"
					className="hover:text-gray-700 transition-colors underline text-end"
				>
					Edit this page on GitHub
				</a>
			</p>
		</DocsPage>
	);
}

export async function generateStaticParams() {
	return source.generateParams();
}

export async function generateMetadata(
	props: PageProps<"/docs/[[...slug]]">,
): Promise<Metadata> {
	const params = await props.params;
	const page = source.getPage(params.slug);
	if (!page) notFound();

	return {
		title: `Penombre - ${page.data.title}`,
		description: page.data.description,
		openGraph: {
			images: getPageImage(page).url,
		},
	};
}
