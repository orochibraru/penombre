<script lang="ts">
	import SignaturesPanel from "#lib/components/signatures/signatures-panel.svelte";
	import { m } from "#lib/paraglide/messages.js";
	import { title } from "#lib/store/title.js";

	$title = m.sign_page_list_title();
</script>

<div class="flex flex-col gap-5">
    <div>
        <h2 class="text-xl font-semibold tracking-tight">
            {m.sign_page_list_title()}
        </h2>
        <p class="text-muted-foreground text-sm">
            {m.sign_page_list_description()}
        </p>
    </div>
    <SignaturesPanel />
</div>
