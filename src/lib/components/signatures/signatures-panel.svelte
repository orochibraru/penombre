<script lang="ts">
	import {
		CheckCircle2Icon,
		ClockIcon,
		DownloadIcon,
		EyeIcon,
		LinkIcon,
		XCircleIcon,
	} from "@lucide/svelte";
	import { toast } from "svelte-sonner";
	import { api } from "#lib/api/index.js";
	import { Badge, type BadgeVariant } from "#lib/components/ui/badge/index.js";
	import { Button, buttonVariants } from "#lib/components/ui/button/index.js";
	import * as Card from "#lib/components/ui/card/index.js";
	import Spinner from "#lib/components/ui/spinner.svelte";
	import { m } from "#lib/paraglide/messages.js";
	import { copyText } from "#lib/utils.js";
	import { resolve } from "$app/paths";

	/**
	 * Signature requests with each signer's status, and what the requester can
	 * do about them: a new link, cancelling, the PDFs.
	 */
	interface Props {
		/** One document's requests; omit for every request you made. */
		fileId?: string;
		/** Change it to reload, e.g. after the dialog sent a request. */
		refresh?: number;
	}

	const { fileId, refresh = 0 }: Props = $props();

	type Request = NonNullable<Awaited<ReturnType<typeof load>>>[number];

	let requests: Request[] = $state([]);
	let loaded = $state(false);
	let confirming = $state<string | null>(null);
	let busy = $state<string | null>(null);

	async function load() {
		const { data } = await api.GET("/api/v1/signatures", {
			params: { query: fileId ? { fileId } : {} },
		});
		return data?.data;
	}

	async function reload() {
		requests = (await load()) ?? [];
		loaded = true;
	}

	$effect(() => {
		void refresh;
		void fileId;
		void reload();
	});

	const STATUS: Record<
		Request["status"],
		{ label: () => string; variant: BadgeVariant }
	> = {
		pending: { label: m.sign_status_pending, variant: "secondary" },
		completed: { label: m.sign_status_completed, variant: "default" },
		declined: { label: m.sign_status_declined, variant: "destructive" },
		cancelled: { label: m.sign_status_cancelled, variant: "outline" },
		expired: { label: m.sign_status_expired, variant: "outline" },
	};

	const stamp = (iso: string) =>
		new Date(iso).toLocaleString(undefined, {
			dateStyle: "medium",
			timeStyle: "short",
		});

	const pdfHref = (id: string, kind: "original" | "signed") =>
		`${resolve("/api/v1/signatures/[id]/pdf", { id })}?kind=${kind}`;

	function signerLine(signer: Request["signers"][number]): string {
		if (signer.status === "signed" && signer.respondedAt) {
			return m.sign_signer_signed({ date: stamp(signer.respondedAt) });
		}
		if (signer.status === "declined") {
			return signer.declineReason
				? m.sign_signer_declined_reason({ reason: signer.declineReason })
				: m.sign_signer_declined();
		}
		return signer.viewedAt
			? m.sign_signer_opened({ date: stamp(signer.viewedAt) })
			: m.sign_signer_not_opened();
	}

	/** A new link replaces the old one: emailed when possible, always copied. */
	async function renew(request: Request, signerId: string) {
		busy = signerId;
		try {
			const { data, error } = await api.POST(
				"/api/v1/signatures/{id}/signers/{signerId}/link",
				{
					params: { path: { id: request.id, signerId } },
					body: { send: true },
				},
			);
			if (error || !data?.data) {
				toast.error(m.sign_link_failed(), {
					description: (error as { message?: string } | undefined)?.message,
				});
				return;
			}
			const copied = await copyText(data.data.url);
			toast.success(
				data.data.emailed ? m.sign_link_emailed() : m.sign_link_new(),
				{ description: copied ? m.toast_link_copied() : data.data.url },
			);
		} finally {
			busy = null;
		}
	}

	async function cancel(request: Request) {
		confirming = null;
		busy = request.id;
		try {
			const { error } = await api.POST("/api/v1/signatures/{id}/cancel", {
				params: { path: { id: request.id } },
			});
			if (error) {
				toast.error(m.sign_cancel_failed());
				return;
			}
			await reload();
		} finally {
			busy = null;
		}
	}
</script>

{#if !loaded}
    <div class="flex justify-center py-8"><Spinner /></div>
{:else if requests.length === 0}
    <p class="text-muted-foreground py-6 text-center text-sm">
        {m.sign_panel_empty()}
    </p>
{:else}
    <div class="flex min-w-0 flex-col gap-3">
        {#each requests as request (request.id)}
            {@const status = STATUS[request.status]}
            {@const signed = request.signers.filter((s) => s.status === "signed").length}
            <Card.Root class="gap-3 py-4">
                <Card.Header class="px-4">
                    <Card.Title class="text-sm wrap-anywhere">
                        {fileId ? m.sign_panel_request({ date: stamp(request.createdAt) }) : request.documentName}
                    </Card.Title>
                    <Card.Description class="text-xs">
                        {m.sign_panel_progress({
                            signed: String(signed),
                            total: String(request.signers.length),
                        })}
                        ·
                        {request.completedAt
                            ? m.sign_panel_completed_on({ date: stamp(request.completedAt) })
                            : m.sign_panel_expires_on({ date: stamp(request.expiresAt) })}
                    </Card.Description>
                    <Card.Action>
                        <Badge variant={status.variant}>{status.label()}</Badge>
                    </Card.Action>
                </Card.Header>
                <Card.Content class="flex min-w-0 flex-col gap-1 px-4">
                    {#each request.signers as signer (signer.id)}
                        <div class="flex min-w-0 items-center gap-2 py-1">
                            {#if signer.status === "signed"}
                                <CheckCircle2Icon class="text-primary size-4 shrink-0" />
                            {:else if signer.status === "declined"}
                                <XCircleIcon class="text-destructive size-4 shrink-0" />
                            {:else if signer.viewedAt}
                                <EyeIcon class="text-muted-foreground size-4 shrink-0" />
                            {:else}
                                <ClockIcon class="text-muted-foreground size-4 shrink-0" />
                            {/if}
                            <div class="min-w-0 flex-1">
                                <p class="truncate text-sm">
                                    {signer.name}
                                    <span class="text-muted-foreground text-xs">
                                        {signer.email}
                                    </span>
                                </p>
                                <p class="text-muted-foreground truncate text-xs">
                                    {signerLine(signer)}
                                </p>
                            </div>
                            {#if (request.status === "pending" && signer.status === "pending") || request.status === "completed"}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    class="size-8 shrink-0"
                                    aria-label={request.status === "completed"
                                        ? m.sign_link_send_download()
                                        : m.sign_link_renew()}
                                    title={request.status === "completed"
                                        ? m.sign_link_send_download()
                                        : m.sign_link_renew()}
                                    disabled={busy === signer.id}
                                    onclick={() => renew(request, signer.id)}
                                >
                                    <LinkIcon class="size-4" />
                                </Button>
                            {/if}
                        </div>
                    {/each}
                </Card.Content>
                <Card.Footer class="flex flex-wrap gap-2 px-4">
                    <a
                        class={buttonVariants({ variant: "outline", size: "sm" })}
                        href={pdfHref(request.id, "original")}
                        download
                    >
                        <DownloadIcon />
                        {m.sign_panel_original()}
                    </a>
                    {#if request.signedAvailable}
                        <a
                            class={buttonVariants({ size: "sm" })}
                            href={pdfHref(request.id, "signed")}
                            download
                        >
                            <DownloadIcon />
                            {m.sign_panel_signed()}
                        </a>
                    {/if}
                    {#if request.status === "pending"}
                        {#if confirming === request.id}
                            <Button
                                size="sm"
                                variant="destructive"
                                disabled={busy === request.id}
                                onclick={() => cancel(request)}
                            >
                                {m.sign_panel_cancel_confirm()}
                            </Button>
                            <Button size="sm" variant="ghost" onclick={() => (confirming = null)}>
                                {m.cancel()}
                            </Button>
                        {:else}
                            <Button
                                size="sm"
                                variant="ghost"
                                class="text-muted-foreground"
                                onclick={() => (confirming = request.id)}
                            >
                                {m.sign_panel_cancel()}
                            </Button>
                        {/if}
                    {/if}
                </Card.Footer>
            </Card.Root>
        {/each}
    </div>
{/if}
