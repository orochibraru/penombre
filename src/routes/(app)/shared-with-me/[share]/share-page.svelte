<script lang="ts">
	import { LockIcon, UsersIcon } from "@lucide/svelte";
	import type { ObjectList } from "$lib/api";
	import FileLayout from "$lib/components/file/layout.svelte";
	import Badge from "$lib/components/ui/badge/badge.svelte";
	import { m } from "$lib/paraglide/messages.js";
	import { title } from "$lib/store/title";

	interface Props {
		data: {
			share: { name: string; ownerName: string; readOnly: boolean };
			files: { data: ObjectList | undefined; err: unknown };
			title?: string;
			preferences?: Record<string, unknown>;
		};
	}

	const { data }: Props = $props();

	$effect(() => {
		title.set(data.title ?? data.share.name);
	});
</script>

<div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center gap-2">
        <UsersIcon class="text-primary size-4" />
        <h1 class="text-lg font-semibold tracking-tight">{data.share.name}</h1>
        <span class="text-muted-foreground text-sm">
            {m.shared_by({ name: data.share.ownerName })}
        </span>
        {#if data.share.readOnly}
            <Badge variant="secondary">
                <LockIcon />
                {m.permission_read()}
            </Badge>
        {/if}
    </div>

    <FileLayout data={data.files} preferences={data.preferences} />
</div>
