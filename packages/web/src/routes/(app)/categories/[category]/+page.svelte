<script lang="ts">
    import FileLayout from "$lib/components/file/layout.svelte";
    import { title } from "$lib/store/title";
    import * as m from "$lib/paraglide/messages.js";

    const categoryNames: Record<string, () => string> = {
        MUSIC: m.nav_music,
        DOCUMENTS: m.nav_documents,
        IMAGES: m.nav_images,
        CODE: m.nav_code,
        VIDEO: m.nav_video,
        ARCHIVES: m.nav_archives,
        "3D": m.nav_3d_objects,
    };

    const { data } = $props();

    $effect(() => {
        $title =
            categoryNames[data.category ?? ""]?.() ??
            m.title_unknown_category();
    });
</script>

<FileLayout data={data.files} preferences={data.preferences} />
