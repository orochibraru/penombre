<script lang="ts">
	import { EraserIcon } from "@lucide/svelte";
	import { untrack } from "svelte";
	import { Button } from "#lib/components/ui/button/index.js";
	import { Input } from "#lib/components/ui/input/index.js";
	import * as Tabs from "#lib/components/ui/tabs/index.js";
	import { m } from "#lib/paraglide/messages.js";

	/**
	 * A signature as a PNG data URL: drawn with a finger or a mouse, typed and
	 * set in a handwriting face, or the one the account used last time. Empty
	 * until there is something to sign with.
	 */
	interface Props {
		value?: string;
		/** Prefills the typed signature. */
		name?: string;
		/** The account's previous signature, offered as a third choice. */
		saved?: string | null;
	}

	let { value = $bindable(""), name = "", saved = null }: Props = $props();

	// Fixed pixels, scaled by CSS: the PNG stays small whatever the screen.
	const WIDTH = 600;
	const HEIGHT = 200;
	const INK = "#111827";
	const SCRIPT =
		'"Segoe Script", "Brush Script MT", "Snell Roundhand", "Apple Chancery", cursive';

	let mode = $state<"draw" | "type" | "saved">("draw");
	let canvas = $state<HTMLCanvasElement | null>(null);
	let typed = $state("");
	let drew = $state(false);
	let last: { x: number; y: number } | null = null;

	$effect(() => {
		mode = saved ? "saved" : "draw";
	});
	$effect(() => {
		const initial = name;
		untrack(() => {
			typed ||= initial;
		});
	});

	// The draw tab remounts its canvas, empty: what was drawn is gone with it.
	$effect(() => {
		if (canvas) {
			untrack(() => {
				drew = false;
			});
		}
	});

	$effect(() => {
		if (mode === "saved") {
			value = saved ?? "";
		} else if (mode === "type") {
			value = typed.trim() ? typedPng(typed.trim()) : "";
		} else {
			value = drew && canvas ? canvas.toDataURL("image/png") : "";
		}
	});

	function typedPng(text: string): string {
		const sheet = document.createElement("canvas");
		sheet.width = WIDTH;
		sheet.height = HEIGHT;
		const context = sheet.getContext("2d");
		if (!context) {
			return "";
		}
		let size = 72;
		context.font = `${size}px ${SCRIPT}`;
		const width = context.measureText(text).width;
		if (width > WIDTH - 40) {
			size = Math.max(24, Math.floor((size * (WIDTH - 40)) / width));
			context.font = `${size}px ${SCRIPT}`;
		}
		context.fillStyle = INK;
		context.textAlign = "center";
		context.textBaseline = "middle";
		context.fillText(text, WIDTH / 2, HEIGHT / 2);
		return sheet.toDataURL("image/png");
	}

	function point(event: PointerEvent) {
		const box = canvas?.getBoundingClientRect();
		if (!box) {
			return { x: 0, y: 0 };
		}
		return {
			x: ((event.clientX - box.left) * WIDTH) / box.width,
			y: ((event.clientY - box.top) * HEIGHT) / box.height,
		};
	}

	function start(event: PointerEvent) {
		canvas?.setPointerCapture(event.pointerId);
		last = point(event);
	}

	function move(event: PointerEvent) {
		const context = canvas?.getContext("2d");
		if (!(last && context)) {
			return;
		}
		const next = point(event);
		context.strokeStyle = INK;
		context.lineWidth = 3.5;
		context.lineCap = "round";
		context.lineJoin = "round";
		context.beginPath();
		context.moveTo(last.x, last.y);
		context.lineTo(next.x, next.y);
		context.stroke();
		last = next;
	}

	function end() {
		if (!last) {
			return;
		}
		last = null;
		drew = true;
		value = canvas?.toDataURL("image/png") ?? "";
	}

	function clear() {
		canvas?.getContext("2d")?.clearRect(0, 0, WIDTH, HEIGHT);
		drew = false;
		value = "";
	}
</script>

<Tabs.Root
    value={mode}
    onValueChange={(next) => (mode = next as typeof mode)}
    class="flex min-w-0 flex-col gap-3"
>
    <Tabs.List class="w-full">
        <Tabs.Trigger value="draw">{m.sign_pad_draw()}</Tabs.Trigger>
        <Tabs.Trigger value="type">{m.sign_pad_type()}</Tabs.Trigger>
        {#if saved}
            <Tabs.Trigger value="saved">{m.sign_pad_saved()}</Tabs.Trigger>
        {/if}
    </Tabs.List>

    <!-- Paper, not a themed surface: this is what lands on the white PDF. -->
    <Tabs.Content value="draw" class="flex flex-col gap-2">
        <div class="relative overflow-hidden rounded-lg border bg-white">
            <canvas
                bind:this={canvas}
                width={WIDTH}
                height={HEIGHT}
                aria-label={m.sign_pad_draw_label()}
                class="block aspect-3/1 w-full cursor-crosshair touch-none"
                onpointerdown={start}
                onpointermove={move}
                onpointerup={end}
                onpointercancel={end}
            ></canvas>
            {#if !drew}
                <p
                    class="pointer-events-none absolute inset-x-0 bottom-3 text-center text-xs text-neutral-500"
                >
                    {m.sign_pad_draw_hint()}
                </p>
            {/if}
        </div>
        <Button
            type="button"
            variant="ghost"
            size="sm"
            class="self-end"
            disabled={!drew}
            onclick={clear}
        >
            <EraserIcon class="size-4" />
            {m.sign_pad_clear()}
        </Button>
    </Tabs.Content>

    <Tabs.Content value="type" class="flex flex-col gap-2">
        <Input
            bind:value={typed}
            autocomplete="name"
            aria-label={m.sign_pad_type_label()}
            maxlength={80}
        />
        <div
            class="flex aspect-3/1 w-full items-center justify-center overflow-hidden rounded-lg border bg-white px-4 text-4xl text-neutral-900"
            style:font-family={SCRIPT}
        >
            <span class="truncate">{typed}</span>
        </div>
    </Tabs.Content>

    {#if saved}
        <Tabs.Content value="saved">
            <div class="rounded-lg border bg-white p-2">
                <img
                    src={saved}
                    alt={m.sign_pad_saved()}
                    class="mx-auto aspect-3/1 w-full object-contain"
                />
            </div>
        </Tabs.Content>
    {/if}
</Tabs.Root>
