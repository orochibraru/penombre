<script lang="ts">
	import { title } from '$lib/store/title';
	$title = 'Account';

	const { data } = $props();
</script>

<div>
	<pre class="rounded-xl bg-black p-5 text-white">{JSON.stringify(data.user, null, 2)}</pre>
</div>
