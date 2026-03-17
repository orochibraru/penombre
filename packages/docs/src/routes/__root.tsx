import {
	createRootRoute,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import { Banner } from "fumadocs-ui/components/banner";
import { RootProvider } from "fumadocs-ui/provider/tanstack";
import appCss from "@/styles/app.css?url";

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "Penombre - Documentation",
			},
		],
		links: [{ rel: "stylesheet", href: appCss }],
	}),
	component: RootComponent,
});

function RootComponent() {
	return (
		<html suppressHydrationWarning lang="en">
			<head>
				<HeadContent />
			</head>
			<body className="flex flex-col min-h-screen">
				<Banner className="text-xs prose" id="docs-warning">
					This documentation is still a work in progress as Penombre is still in
					its very early stages. If you have any questions or feedback, please{" "}
					<a
						href="https://github.com/orochibraru/penombre/issues/new"
						target="_blank"
						rel="noopener noreferrer"
						className="mx-2"
					>
						raise a ticket
					</a>{" "}
					on our GitHub repository.
				</Banner>
				<RootProvider>
					<Outlet />
				</RootProvider>
				<Scripts />
			</body>
		</html>
	);
}
