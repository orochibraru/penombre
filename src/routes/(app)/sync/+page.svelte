<script lang="ts">
	import * as m from "$lib/paraglide/messages.js";
	import { title } from "$lib/store/title";

	$title = m.nav_sync();
</script>

<div>
    <p>{m.sync_coming_soon()}</p>
</div>
