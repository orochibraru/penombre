<script lang="ts">
	import { page } from '$app/state';
	import { title } from '$lib/store/title';
	$title = 'API docs';
</script>

<div class="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
	<div class="p-5">
		<h2 class="text-xl font-medium">API Docs</h2>
		<iframe src={`${page.url.origin}/api/v1/docs`} title="OpenAPI Spec" class="h-screen w-full"
		></iframe>
	</div>
</div>
