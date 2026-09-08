<script lang="ts">
	import { LoaderCircleIcon } from "@lucide/svelte";
	import { cn } from "$lib/utils";

	interface Props {
		size?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
		class?: string;
	}

	const { size = 5, class: className = "" }: Props = $props();

	function getClasses() {
		switch (size) {
			case 1:
				return "h-1 w-1";
			case 2:
				return "h-2 w-2";
			case 3:
				return "h-3 w-3";
			case 4:
				return "h-4 w-4";
			case 5:
				return "h-5 w-5";
			case 6:
				return "h-6 w-6";
			case 7:
				return "h-7 w-7";
			case 8:
				return "h-8 w-8";
			case 9:
				return "h-9 w-9";
			case 10:
				return "h-10 w-10";
			default:
				return "h-5 w-5";
		}
	}
</script>

<LoaderCircleIcon class={cn('animate-spin', getClasses(), className)} />
