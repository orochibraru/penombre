<script lang="ts">
	import {
		CheckCircle2Icon,
		ClockIcon,
		DownloadIcon,
		ExternalLinkIcon,
		FileTextIcon,
		SignatureIcon,
		XCircleIcon,
	} from "@lucide/svelte";
	import SignaturePad from "#lib/components/signatures/signature-pad.svelte";
	import { Button, buttonVariants } from "#lib/components/ui/button/index.js";
	import * as Card from "#lib/components/ui/card/index.js";
	import { Checkbox } from "#lib/components/ui/checkbox/index.js";
	import { Label } from "#lib/components/ui/label/index.js";
	import { Textarea } from "#lib/components/ui/textarea/index.js";
	import { enhance } from "#lib/forms.js";
	import { m } from "#lib/paraglide/messages.js";
	import { title } from "#lib/store/title.js";
	import { cn } from "#lib/utils.js";
	import { resolve } from "$app/paths";
	import { page } from "$app/state";

	const { data, form } = $props();

	const view = $derived(data.view);
	const token = $derived(page.params.token ?? "");
	const documentUrl = $derived(resolve("/sign/[token]/document", { token }));
	const signedUrl = $derived(resolve("/sign/[token]/signed", { token }));
	const canSign = $derived(
		view.status === "pending" &&
			view.signer.status === "pending" &&
			!view.waitingFor,
	);
	const signedCount = $derived(
		view.signers.filter((signer) => signer.status === "signed").length,
	);

	let signature = $state("");
	let consent = $state(false);
	let declining = $state(false);
	let busy = $state(false);
	const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

	const day = (iso: string) =>
		new Date(iso).toLocaleDateString(undefined, { dateStyle: "long" });

	$effect(() => {
		title.set(view.documentName);
	});

	const submit = () => {
		busy = true;
		return async ({ update }: { update: () => Promise<void> }) => {
			await update();
			busy = false;
			declining = false;
		};
	};
</script>

<!-- A capability URL, like /s/[token]: no app chrome, and it has to work at
     390px inside the mobile app's web view as well as on a desktop. -->
<div
    class="from-background to-muted/40 flex min-h-screen flex-col items-center bg-linear-to-b px-4 py-8 sm:py-12"
>
    <div class="flex w-full max-w-3xl min-w-0 flex-col gap-4">
        <p
            class="text-muted-foreground text-center text-sm font-medium tracking-wide"
        >
            {data.config.appName}
        </p>

        <Card.Root class="shadow-lg">
            <Card.Header>
                <div class="flex min-w-0 items-start gap-3">
                    <div
                        class="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-lg"
                    >
                        <SignatureIcon class="size-5" />
                    </div>
                    <div class="min-w-0">
                        <Card.Title class="text-lg wrap-anywhere">
                            {view.documentName}
                        </Card.Title>
                        <Card.Description>
                            {m.sign_page_asks({ name: view.requesterName })}
                        </Card.Description>
                    </div>
                </div>
            </Card.Header>
            <Card.Content class="flex min-w-0 flex-col gap-4">
                {#if view.message}
                    <blockquote
                        class="border-primary/40 text-foreground border-l-2 pl-3 text-sm whitespace-pre-line wrap-anywhere"
                    >
                        {view.message}
                    </blockquote>
                {/if}

                <div
                    class="bg-muted/40 flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                    <div class="flex min-w-0 items-center gap-3">
                        <FileTextIcon class="text-primary size-5 shrink-0" />
                        <div class="min-w-0 text-sm">
                            <p class="font-medium">
                                {m.sign_page_pages({
                                    count: String(view.pageCount),
                                })}
                            </p>
                            <p class="text-muted-foreground text-xs">
                                {m.sign_page_frozen()}
                            </p>
                        </div>
                    </div>
                    <div class="flex shrink-0 gap-2">
                        <a
                            class={buttonVariants({
                                variant: "outline",
                                size: "sm",
                            })}
                            href={documentUrl}
                            target="_blank"
                            rel="noopener"
                        >
                            <ExternalLinkIcon />
                            {m.sign_page_open_pdf()}
                        </a>
                        <a
                            class={buttonVariants({
                                variant: "ghost",
                                size: "sm",
                            })}
                            href="{documentUrl}?download"
                            download
                        >
                            <DownloadIcon />
                            <span class="sr-only sm:not-sr-only">
                                {m.download()}
                            </span>
                        </a>
                    </div>
                </div>

                <!-- Phones draw a PDF badly in a frame, or not at all in an
                     Android web view: they get the button above instead. -->
                {#if view.status === "pending" || view.status === "completed"}
                    <iframe
                        src={documentUrl}
                        title={view.documentName}
                        class="hidden h-[70vh] w-full rounded-lg border md:block"
                    ></iframe>
                {/if}

                <ul class="flex flex-col gap-1.5 text-sm">
                    {#each view.signers as signer, index (index)}
                        <li class="flex min-w-0 items-center gap-2">
                            {#if signer.status === "signed"}
                                <CheckCircle2Icon
                                    class="text-primary size-4 shrink-0"
                                />
                            {:else if signer.status === "declined"}
                                <XCircleIcon
                                    class="text-destructive size-4 shrink-0"
                                />
                            {:else}
                                <ClockIcon
                                    class="text-muted-foreground size-4 shrink-0"
                                />
                            {/if}
                            <span
                                class={cn(
                                    "truncate",
                                    signer.you && "font-medium",
                                )}
                            >
                                {signer.you
                                    ? m.sign_page_you({ name: signer.name })
                                    : signer.name}
                            </span>
                        </li>
                    {/each}
                </ul>
            </Card.Content>
        </Card.Root>

        {#if view.status === "completed"}
            <Card.Root>
                <Card.Header>
                    <Card.Title>{m.sign_page_completed_title()}</Card.Title>
                    <Card.Description>
                        {view.downloadUntil
                            ? m.sign_page_completed_until({
                                  date: day(view.downloadUntil),
                              })
                            : m.sign_page_completed_preparing()}
                    </Card.Description>
                </Card.Header>
                {#if view.downloadUntil}
                    <Card.Content>
                        <a
                            class={cn(buttonVariants(), "w-full sm:w-auto")}
                            href={signedUrl}
                            download
                        >
                            <DownloadIcon />
                            {m.sign_page_download_signed()}
                        </a>
                    </Card.Content>
                {/if}
            </Card.Root>
        {:else if view.status !== "pending"}
            <Card.Root>
                <Card.Header>
                    <Card.Title>
                        {view.status === "declined"
                            ? m.sign_page_declined_title()
                            : view.status === "cancelled"
                              ? m.sign_page_cancelled_title()
                              : m.sign_page_expired_title()}
                    </Card.Title>
                    <Card.Description>
                        {m.sign_page_closed_description({
                            name: view.requesterName,
                        })}
                    </Card.Description>
                </Card.Header>
            </Card.Root>
        {:else if view.signer.status === "signed"}
            <Card.Root>
                <Card.Header>
                    <Card.Title>{m.sign_page_signed_title()}</Card.Title>
                    <Card.Description>
                        {m.sign_page_signed_waiting({
                            signed: String(signedCount),
                            total: String(view.signers.length),
                        })}
                    </Card.Description>
                </Card.Header>
            </Card.Root>
        {:else if view.waitingFor}
            <Card.Root>
                <Card.Header>
                    <Card.Title>{m.sign_page_turn_title()}</Card.Title>
                    <Card.Description>
                        {m.sign_page_turn_description({
                            name: view.waitingFor,
                        })}
                    </Card.Description>
                </Card.Header>
            </Card.Root>
        {/if}

        {#if canSign}
            <Card.Root>
                <Card.Header>
                    <Card.Title>{m.sign_page_your_signature()}</Card.Title>
                    <Card.Description>
                        {m.sign_page_signing_as({
                            name: view.signer.name,
                            email: view.signer.email,
                        })}
                    </Card.Description>
                </Card.Header>
                <Card.Content>
                    <form
                        method="POST"
                        action="?/sign"
                        class="flex min-w-0 flex-col gap-4"
                        use:enhance={submit}
                    >
                        <SignaturePad
                            bind:value={signature}
                            name={view.signer.name}
                            saved={data.lastSignature}
                        />
                        <input type="hidden" name="signature" value={signature} />
                        <input type="hidden" name="timeZone" value={timeZone} />
                        <div class="flex items-start gap-3">
                            <Checkbox
                                id="consent"
                                name="consent"
                                bind:checked={consent}
                                class="mt-0.5"
                            />
                            <Label
                                for="consent"
                                class="text-sm leading-snug font-normal"
                            >
                                {m.sign_page_consent()}
                            </Label>
                        </div>
                        {#if form?.error}
                            <p class="text-destructive text-sm" role="alert">
                                {form.error}
                            </p>
                        {/if}
                        <Button
                            type="submit"
                            class="w-full sm:w-auto sm:self-end"
                            disabled={!(signature && consent) || busy}
                            loading={busy}
                        >
                            <SignatureIcon />
                            {m.sign_page_sign()}
                        </Button>
                    </form>
                </Card.Content>
                <Card.Footer class="flex-col items-stretch gap-3 border-t">
                    {#if declining}
                        <form
                            method="POST"
                            action="?/decline"
                            class="flex flex-col gap-3"
                            use:enhance={submit}
                        >
                            <Label for="reason">{m.sign_page_decline_reason()}</Label>
                            <Textarea id="reason" name="reason" maxlength={500} rows={3} />
                            <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onclick={() => (declining = false)}
                                >
                                    {m.cancel()}
                                </Button>
                                <Button
                                    type="submit"
                                    variant="destructive"
                                    loading={busy}
                                    disabled={busy}
                                >
                                    {m.sign_page_decline_confirm()}
                                </Button>
                            </div>
                        </form>
                    {:else}
                        <Button
                            type="button"
                            variant="ghost"
                            class="text-muted-foreground self-start"
                            onclick={() => (declining = true)}
                        >
                            {m.sign_page_decline()}
                        </Button>
                    {/if}
                </Card.Footer>
            </Card.Root>
        {/if}

        <p class="text-muted-foreground px-1 text-xs leading-relaxed">
            {m.sign_page_honest()}
            <span class="font-mono break-all">
                SHA-256 {view.documentHash}
            </span>
        </p>
    </div>
</div>
