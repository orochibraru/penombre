<script lang="ts">
	import { toast } from "svelte-sonner";
	import { authClient } from "#lib/auth-client.js";
	import ResponsiveDialog from "#lib/components/responsive-dialog.svelte";
	import { Button } from "#lib/components/ui/button/index.js";
	import { Input } from "#lib/components/ui/input/index.js";
	import { Label } from "#lib/components/ui/label/index.js";
	import * as m from "#lib/paraglide/messages.js";
	import { refreshAll } from "$app/navigation";

	/**
	 * Changing or verifying the account's address with emailed codes.
	 *
	 * A change takes a code from the current address and one from the new,
	 * as better-auth's `changeEmail.verifyCurrentEmail` requires: a stolen
	 * session alone cannot move the account to another mailbox.
	 */
	let {
		open = $bindable(false),
		mode,
		email,
	}: { open?: boolean; mode: "change" | "verify"; email: string } = $props();

	type Step = "start" | "current" | "new" | "confirm";
	let step = $state<Step>("start");
	let currentCode = $state("");
	let newEmail = $state("");
	let newCode = $state("");
	let busy = $state(false);

	$effect(() => {
		if (open) {
			step = "start";
			currentCode = "";
			newEmail = "";
			newCode = "";
		}
	});

	const CODE_ERRORS = new Set([
		"INVALID_OTP",
		"OTP_EXPIRED",
		"TOO_MANY_ATTEMPTS",
	]);

	/**
	 * Runs one call; better-auth answers `{ error }` rather than throwing.
	 * Returns the refusal's code, "" for any other failure, null on success.
	 */
	async function run(
		call: () => Promise<{
			error: { message?: string; code?: string } | null;
		}>,
		failed: string,
	): Promise<string | null> {
		busy = true;
		const { error } = await call();
		busy = false;
		if (!error) {
			return null;
		}
		const code = error.code ?? "";
		toast.error(CODE_ERRORS.has(code) ? failed : error.message || failed);
		return code;
	}

	async function sendCurrent() {
		const sent = await run(
			() =>
				authClient.emailOtp.sendVerificationOtp({
					email,
					type: "email-verification",
				}),
			m.email_send_error(),
		);
		if (sent === null) {
			step = "current";
		}
	}

	async function confirmCurrent() {
		if (mode === "verify") {
			const done = await run(
				() =>
					authClient.emailOtp.verifyEmail({ email, otp: currentCode.trim() }),
				m.email_code_error(),
			);
			if (done === null) {
				toast.success(m.email_done_verified());
				open = false;
				await refreshAll();
			}
			return;
		}
		step = "new";
	}

	async function sendNew() {
		const sent = await run(
			() =>
				authClient.emailOtp.requestEmailChange({
					newEmail: newEmail.trim(),
					otp: currentCode.trim(),
				}),
			m.email_code_error(),
		);
		if (sent === null) {
			step = "confirm";
		} else if (CODE_ERRORS.has(sent)) {
			// The current address's code is what was refused.
			currentCode = "";
			step = "current";
		}
	}

	async function confirmNew() {
		const done = await run(
			() =>
				authClient.emailOtp.changeEmail({
					newEmail: newEmail.trim(),
					otp: newCode.trim(),
				}),
			m.email_code_error(),
		);
		if (done === null) {
			toast.success(m.email_done_changed({ email: newEmail.trim() }));
			open = false;
			await refreshAll();
		}
	}
</script>

<ResponsiveDialog
    bind:open
    title={mode === "change" ? m.email_change_title() : m.email_verify_title()}
    description={email}
>
    <div class="flex flex-col gap-4">
        {#if step === "start"}
            <p class="text-muted-foreground text-sm">
                {m.email_step_current({ email })}
            </p>
            <Button loading={busy} onclick={sendCurrent}>{m.email_send_code()}</Button>
        {:else if step === "current"}
            <div class="flex flex-col gap-1.5">
                <Label for="email-current-code">
                    {m.email_code_sent({ email })}
                </Label>
                <Input
                    id="email-current-code"
                    inputmode="numeric"
                    autocomplete="one-time-code"
                    bind:value={currentCode}
                />
            </div>
            <div class="flex gap-2">
                <Button variant="ghost" disabled={busy} onclick={sendCurrent}>
                    {m.email_resend()}
                </Button>
                <Button
                    class="ms-auto"
                    loading={busy}
                    disabled={!currentCode.trim()}
                    onclick={confirmCurrent}
                >
                    {mode === "verify" ? m.email_verify() : m.email_next()}
                </Button>
            </div>
        {:else if step === "new"}
            <p class="text-muted-foreground text-sm">{m.email_step_new()}</p>
            <div class="flex flex-col gap-1.5">
                <Label for="email-new">{m.email_new_label()}</Label>
                <Input
                    id="email-new"
                    type="email"
                    autocomplete="email"
                    bind:value={newEmail}
                />
            </div>
            <Button
                loading={busy}
                disabled={!newEmail.includes("@")}
                onclick={sendNew}
            >
                {m.email_send_code()}
            </Button>
        {:else}
            <div class="flex flex-col gap-1.5">
                <Label for="email-new-code">
                    {m.email_code_sent({ email: newEmail.trim() })}
                </Label>
                <Input
                    id="email-new-code"
                    inputmode="numeric"
                    autocomplete="one-time-code"
                    bind:value={newCode}
                />
            </div>
            <Button loading={busy} disabled={!newCode.trim()} onclick={confirmNew}>
                {m.email_change()}
            </Button>
        {/if}
    </div>
</ResponsiveDialog>
