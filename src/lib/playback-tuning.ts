import type { SoundTouchNode } from "@soundtouchjs/audio-worklet";

export const SPEEDS = [0.5, 0.75, 0.9, 1, 1.1, 1.25, 1.5, 2] as const;
export const SEMITONES = Array.from({ length: 25 }, (_, i) => i - 12);

/** An AudioWorklet needs a secure context: plain HTTP past localhost has none. */
export function pitchAvailable(): boolean {
	return typeof window !== "undefined" && window.isSecureContext;
}

interface Shifter {
	node: SoundTouchNode;
	context: AudioContext;
}

/**
 * One pitch shifter per element, built the first time pitch leaves 0. Once an
 * element feeds an AudioContext it can never be detached again, so a track
 * nobody transposes never goes through Web Audio at all.
 */
const shifters = new WeakMap<HTMLMediaElement, Promise<Shifter>>();

function shifterFor(element: HTMLMediaElement): Promise<Shifter> {
	let shifter = shifters.get(element);
	if (!shifter) {
		shifter = (async () => {
			const [{ SoundTouchNode: Node }, { default: processorUrl }] =
				await Promise.all([
					import("@soundtouchjs/audio-worklet"),
					import("@soundtouchjs/audio-worklet/processor?url"),
				]);
			const context = new AudioContext();
			await Node.register(context, processorUrl);
			const node = new Node({ context });
			node.connect(context.destination);
			// Last: before this the element still plays on its own.
			context.createMediaElementSource(element).connect(node);
			return { node, context };
		})();
		// A failed setup must not look like a live chain to the next call.
		void shifter.catch(() => shifters.delete(element));
		shifters.set(element, shifter);
	}
	return shifter;
}

/**
 * Speed without changing pitch, and pitch without changing speed. The
 * browser time-stretches on its own; transposing needs SoundTouch, which then
 * also takes over the pitch correction the browser would otherwise add.
 */
export async function tune(
	element: HTMLMediaElement,
	speed: number,
	semitones: number,
): Promise<void> {
	element.playbackRate = speed;
	const shifting = semitones !== 0 || shifters.has(element);
	element.preservesPitch = !shifting;
	if (!shifting) {
		return;
	}
	const { node, context } = await shifterFor(element).catch(
		(error: unknown) => {
			element.preservesPitch = true;
			throw error;
		},
	);
	node.playbackRate.value = speed;
	node.pitchSemitones.value = semitones;
	await context.resume();
}
