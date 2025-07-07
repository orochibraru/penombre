<script lang="ts">
	import DataTable from '$lib/components/file-table.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { title } from '$lib/store/title';
	import { TrashIcon } from '@lucide/svelte';

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
	<DataTable data={data.files} />
</div>
