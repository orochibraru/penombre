<script lang="ts">
	import { dev } from '$app/environment';

	type Props = {
		sourceUrl: string;
	};

	const { sourceUrl }: Props = $props();
</script>

<div class="music-player lg:music-player-lg fixed right-0 bottom-0">
	<audio
		class="w-full rounded-none"
		controls
		src={sourceUrl}
		playsinline
		autoplay={!dev}
		crossorigin="anonymous"
	></audio>
</div>
