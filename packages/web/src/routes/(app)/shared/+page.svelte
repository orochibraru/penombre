<script lang="ts">
    import DataTable from "$lib/components/file/wrapper.svelte";
    import { title } from "$lib/store/title";
    import * as m from "$lib/paraglide/messages.js";

    $title = m.nav_shared();
</script>

<div>
    <DataTable data={{ count: 0, list: [], total: 0 }} />
</div>
