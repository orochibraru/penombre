import type { Snippet } from "svelte";

export interface CopyButtonProps {
	text: string;
	class?: string;
	children?: Snippet;
}
