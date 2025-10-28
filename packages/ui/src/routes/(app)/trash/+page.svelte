<script lang="ts">
	import { TrashIcon } from '@lucide/svelte';
	import FileLayout from '$lib/components/file/layout.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { title } from '$lib/store/title';

	const { data } = $props();
	$title = 'Trash';
</script>

<div>
	<div class="mb-3 flex items-center justify-end">
		<Button size="sm" variant="destructive">
			Empty Trash
			<TrashIcon />
		</Button>
	</div>
</div>

<FileLayout data={data.files} />
