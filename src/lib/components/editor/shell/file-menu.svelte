<script lang="ts">
	import {
		CopyIcon,
		DownloadIcon,
		HistoryIcon,
		ListChecksIcon,
		PencilIcon,
		PrinterIcon,
		Share2Icon,
		SignatureIcon,
		SquarePlusIcon,
	} from "@lucide/svelte";
	import * as Menubar from "#lib/components/ui/menubar/index.js";
	import { exportLabel } from "#lib/editor/export.js";
	import { m } from "#lib/paraglide/messages.js";
	import type { FileActions } from "./file-actions.js";

	/** The File menu every office editor opens its menu bar with. */
	const { file, print }: { file: FileActions; print?: () => void } = $props();

	/**
	 * Run once the menu has closed: a dialog opened while it closes loses
	 * the focus back to the menu's trigger.
	 */
	let after: (() => void) | null = null;
	const later = (run: () => void) => () => {
		after = run;
	};
</script>

<Menubar.Menu>
    <Menubar.Trigger>{m.doc_menu_file()}</Menubar.Trigger>
    <Menubar.Content
        onCloseAutoFocus={(e: Event) => {
            const run = after;
            after = null;
            if (run) {
                e.preventDefault();
                run();
            }
        }}
    >
        {#if file.canShare}
            <Menubar.Item onSelect={later(file.share)}>
                <Share2Icon class="size-4" />
                {m.shell_share()}
            </Menubar.Item>
            <Menubar.Separator />
        {/if}
        {#if file.canWrite}
            <Menubar.Item onSelect={later(file.rename)}>
                <PencilIcon class="size-4" />
                {m.rename()}
            </Menubar.Item>
            <Menubar.Item onSelect={file.copy}>
                <CopyIcon class="size-4" />
                {m.shell_make_copy()}
            </Menubar.Item>
            <Menubar.Separator />
        {/if}
        {#if file.downloads}
            <Menubar.Item onSelect={file.download}>
                <DownloadIcon class="size-4" />
                {m.shell_download()}
            </Menubar.Item>
            {#if file.exports.length > 0}
                <Menubar.Sub>
                    <Menubar.SubTrigger>
                        <DownloadIcon class="size-4" />
                        {m.office_export()}
                    </Menubar.SubTrigger>
                    <Menubar.SubContent>
                        {#each file.exports as format (format)}
                            <Menubar.Item onSelect={() => file.exportAs(format)}>
                                {exportLabel(format)}
                            </Menubar.Item>
                        {/each}
                    </Menubar.SubContent>
                </Menubar.Sub>
            {/if}
            {#if print}
                <Menubar.Item onSelect={print}>
                    <PrinterIcon class="size-4" />
                    {m.doc_print()}
                </Menubar.Item>
            {/if}
        {/if}
        {#if file.versioning}
            <Menubar.Separator />
            {#if file.canWrite}
                <Menubar.Item onSelect={file.saveVersion}>
                    <SquarePlusIcon class="size-4" />
                    {m.versions_save_as()}
                </Menubar.Item>
            {/if}
            <Menubar.Item onSelect={later(file.history)}>
                <HistoryIcon class="size-4" />
                {m.shell_version_history()}
            </Menubar.Item>
        {/if}
        {#if file.requestSignatures && file.kind === "document"}
            <Menubar.Separator />
            <Menubar.Item onSelect={later(file.requestSignatures)}>
                <SignatureIcon class="size-4" />
                {m.shell_request_signatures()}
            </Menubar.Item>
        {/if}
        {#if file.signatures && file.kind === "document"}
            <Menubar.Item onSelect={later(file.signatures)}>
                <ListChecksIcon class="size-4" />
                {m.sign_menu_status()}
            </Menubar.Item>
        {/if}
    </Menubar.Content>
</Menubar.Menu>
