import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

// fill this with your actual GitHub info, for example:
export const gitConfig = {
	user: "orochibraru",
	repo: "penombre",
	branch: "main",
};

export function baseOptions(): BaseLayoutProps {
	return {
		nav: {
			title: "Penombre",
		},
		githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
		links: [
			{
				text: "Docs",
				url: "/docs",
			},
			{
				text: "Changelog",
				url: "/changelog",
			},
		],
	};
}
