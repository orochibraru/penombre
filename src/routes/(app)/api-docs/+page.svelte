<script lang="ts">
	import { page } from '$app/state';
	import { title } from '$lib/store/title';
	$title = 'API docs';

	function iframeLoaded() {
		const iFrameID = document.getElementById('docs-iframe') as HTMLIFrameElement;
		if (iFrameID?.contentWindow) {
			// here you can make the height, I delete it first, then I make it again
			iFrameID.height = '';
			const mainContainer = document.querySelector('.main-container');
			if (!mainContainer) {
				return;
			}
			iFrameID.height = `${mainContainer.scrollHeight - 120}px`;
		}
	}
</script>

<div class="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
	<div class="p-5">
		<h2 class="text-xl font-medium">API Docs</h2>
		<iframe
			id="docs-iframe"
			onload={iframeLoaded}
			src={`${page.url.origin}/api/v1/docs`}
			title="OpenAPI Spec"
			class="w-full"
		></iframe>
	</div>
</div>
