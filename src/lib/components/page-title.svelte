<script lang="ts">
	const { children } = $props();
</script>

<div class="px-5">
	<h2 class="text-xl font-medium">
		{@render children()}
	</h2>
</div>
