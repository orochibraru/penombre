declare module "virtual:pwa-info" {
	export interface PwaInfo {
		pwaInDevEnvironment: boolean;
		webManifest: {
			href: string;
			useCredentials: boolean;
			linkTag: string;
		};
		registerSW?: {
			inline: boolean;
			mode: "inline" | "script" | "script-defer";
			inlinePath: string;
			registerPath: string;
			scope: string;
			type: string;
		};
	}

	export const pwaInfo: PwaInfo | undefined;
}
