<script lang="ts">
	import {
		FileArchiveIcon,
		FileCodeIcon,
		FileIcon,
		FileTextIcon,
		ImageIcon,
		MusicIcon,
		Rotate3dIcon,
		VideoIcon,
	} from "@lucide/svelte";
	import { FileCategoryEnum } from "$lib/file-helpers";

	interface Props {
		category?: string;
		class?: string;
	}

	const { category, class: className }: Props = $props();

	// Same categories the sidebar nav uses, so a file reads the same wherever
	// it appears.
	const icons: Record<string, typeof FileIcon> = {
		[FileCategoryEnum.MUSIC]: MusicIcon,
		[FileCategoryEnum.DOCUMENTS]: FileTextIcon,
		[FileCategoryEnum.IMAGES]: ImageIcon,
		[FileCategoryEnum.CODE]: FileCodeIcon,
		[FileCategoryEnum.VIDEO]: VideoIcon,
		[FileCategoryEnum.ARCHIVES]: FileArchiveIcon,
		[FileCategoryEnum.THREE_D]: Rotate3dIcon,
	};

	const Icon = $derived(icons[category ?? ""] ?? FileIcon);
</script>

<Icon class={className} />
