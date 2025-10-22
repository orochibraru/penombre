/*
	Installed from @ieedan/shadcn-svelte-extras
*/

import { Context } from 'runed';

export type Timeout = ReturnType<typeof setTimeout> | undefined;

export type TerminalLoopProps = {
	onComplete: () => void;
};

export class TerminalLoop {
	constructor(readonly opts: TerminalLoopProps) {
		this.onComplete = this.onComplete.bind(this);
	}

	onComplete() {
		this.opts.onComplete();
	}
}

export type TerminalRootProps = {
	delay: number;
	speed: number;
	onComplete: () => void;
};

export class TerminalSession {
	#animations: AnimationState[] = $state([]);
	#timeout: Timeout;

	constructor(
		readonly opts: TerminalRootProps,
		readonly loop?: TerminalLoop
	) {
		this.onComplete = this.onComplete.bind(this);
	}

	play() {
		this.#timeout = setTimeout(() => {
			this.#animations.sort((a, b) => a.delay - b.delay);

			for (let i = 0; i < this.#animations.length; i++) {
				const animation = this.#animations[i];
				if (!animation) continue;

				animation.timeout = setTimeout(() => {
					animation.play(this.opts.speed);

					// when the most delayed animation is complete call onComplete
					if (i === this.#animations.length - 1) {
						animation.onComplete = this.onComplete;
					}
				}, animation.delay);
			}
		}, this.opts.delay);
	}

	onComplete() {
		this.opts.onComplete?.();

		this.loop?.onComplete();
	}

	dispose() {
		clearTimeout(this.#timeout);
	}

	registerAnimation(animation: AnimationState) {
		this.#animations.push(animation);
	}
}

export type AnimationStateProps = {
	delay: number;
	play: (speed: number) => void;
};

export class AnimationState {
	delay: number;
	timeout: Timeout;
	onComplete = $state<() => void>();

	constructor(
		readonly rootState: TerminalSession,
		readonly opts: AnimationStateProps
	) {
		this.delay = opts.delay;

		rootState.registerAnimation(this);
	}

	play(speed: number) {
		this.opts.play(speed);
	}

	dispose() {
		clearTimeout(this.timeout);
	}
}

const TerminalLoopContext = new Context<TerminalLoop>('Terminal.Loop');
const TerminalRootContext = new Context<TerminalSession>('Terminal.Root');

export const useTerminalLoop = (props: TerminalLoopProps) => {
	return TerminalLoopContext.set(new TerminalLoop(props));
};

export const useTerminalRoot = (props: TerminalRootProps) => {
	let loopState: TerminalLoop | undefined;

	try {
		loopState = TerminalLoopContext.get();
	} catch {
		// do nothing we don't care
	}

	return TerminalRootContext.set(new TerminalSession(props, loopState));
};

export const useAnimation = (props: AnimationStateProps) => {
	return new AnimationState(TerminalRootContext.get(), props);
};
