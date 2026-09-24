<script lang="ts">
	// Inline, not `<img src="/logo.svg">`: an image cannot read page CSS, so
	// the mark stayed purple whatever accent was picked.
	const { label, class: className }: { label: string; class?: string } =
		$props();
	const id = $props.id();
</script>

<!-- A penumbra: a disc eclipsed by one with a soft edge. -->
<svg viewBox="0 0 48 48" role="img" aria-label={label} class={className}>
    <defs>
        <linearGradient id="{id}-light" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" style="stop-color: var(--primary)" />
            <stop offset="1" style="stop-color: var(--brand-2)" />
        </linearGradient>
        <radialGradient
            id="{id}-shade"
            cx="31"
            cy="17"
            r="20"
            gradientUnits="userSpaceOnUse"
        >
            <stop offset="0.72" stop-color="#000" />
            <stop offset="1" stop-color="#fff" />
        </radialGradient>
        <mask id="{id}-eclipse">
            <rect width="48" height="48" fill="#fff" />
            <circle cx="31" cy="17" r="20" fill="url(#{id}-shade)" />
        </mask>
    </defs>
    <circle
        cx="24"
        cy="24"
        r="20"
        fill="none"
        stroke-width="2"
        class="stroke-primary opacity-30"
    />
    <circle
        cx="24"
        cy="24"
        r="21"
        fill="url(#{id}-light)"
        mask="url(#{id}-eclipse)"
    />
</svg>
