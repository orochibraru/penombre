<script lang="ts">
	/**
	 * Seeded, not `Math.random()`: the server and the browser must draw the
	 * same particles, or hydration finds a different DOM than it rendered.
	 */
	function* seeded(seed: number) {
		let state = seed;
		while (true) {
			state = (state * 1_664_525 + 1_013_904_223) % 2 ** 32;
			yield state / 2 ** 32;
		}
	}

	const random = seeded(7);
	const next = () => random.next().value as number;

	const particles = Array.from({ length: 42 }, () => ({
		left: next() * 100,
		top: next() * 100,
		size: 1 + next() * 2.5,
		duration: 14 + next() * 18,
		// Negative, so the field is already in motion on the first frame.
		delay: -next() * 30,
		drift: (next() - 0.5) * 60,
		warm: next() > 0.6,
	}));
</script>

<div class="backdrop" aria-hidden="true">
    <div class="field one"></div>
    <div class="field two"></div>
    <div class="field three"></div>
    {#each particles as p, index (index)}
        <span
            class={["mote", p.warm && "warm"]}
            style:left="{p.left}%"
            style:top="{p.top}%"
            style:width="{p.size}px"
            style:height="{p.size}px"
            style:animation-duration="{p.duration}s, {p.duration / 3}s"
            style:animation-delay="{p.delay}s, {p.delay / 2}s"
            style:--drift="{p.drift}px"
        ></span>
    {/each}
</div>

<style>
    .backdrop {
        position: fixed;
        inset: 0;
        z-index: -5;
        overflow: hidden;
        pointer-events: none;
    }

    .field {
        position: absolute;
        width: 60vmax;
        height: 60vmax;
        border-radius: 50%;
        filter: blur(90px);
        opacity: 0.3;
        animation: wander 28s ease-in-out infinite alternate;
    }

    .one {
        top: -25vmax;
        left: -15vmax;
        background: var(--primary);
    }

    .two {
        right: -20vmax;
        bottom: -30vmax;
        background: var(--brand-2);
        animation-duration: 34s;
        animation-direction: alternate-reverse;
    }

    .three {
        top: 30%;
        left: 45%;
        width: 40vmax;
        height: 40vmax;
        background: var(--brand-3);
        opacity: 0.25;
        animation-duration: 40s;
    }

    :global(.dark) .field {
        opacity: 0.4;
    }

    /* Mixed towards white they vanish on a light page; full colour there. */
    :global(:root:not(.dark)) .mote {
        background: var(--primary);
    }

    :global(:root:not(.dark)) .mote.warm {
        background: var(--brand-2);
    }

    .mote {
        position: absolute;
        border-radius: 50%;
        background: color-mix(in oklab, var(--primary) 55%, white);
        box-shadow: 0 0 6px color-mix(in oklab, var(--primary) 70%, transparent);
        animation:
            rise linear infinite,
            twinkle ease-in-out infinite alternate;
    }

    .mote.warm {
        background: color-mix(in oklab, var(--brand-2) 50%, white);
        box-shadow: 0 0 6px color-mix(in oklab, var(--brand-2) 70%, transparent);
    }

    @keyframes wander {
        to {
            transform: translate(8vmax, 6vmax) scale(1.15);
        }
    }

    @keyframes rise {
        from {
            transform: translate(0, 0);
        }
        to {
            transform: translate(var(--drift), -40vh);
        }
    }

    @keyframes twinkle {
        from {
            opacity: 0.15;
        }
        to {
            opacity: 0.85;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .field,
        .mote {
            animation: none;
        }
    }
</style>
