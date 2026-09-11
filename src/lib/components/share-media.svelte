<script lang="ts">
	import { FileCategoryEnum } from "$lib/file-helpers";
	import { m } from "$lib/paraglide/messages.js";

	/**
	 * Inline preview for a shared file.
	 *
	 * Renders nothing for anything a browser cannot play, so the page falls
	 * back to the download button on its own. The source is the same download
	 * endpoint with `?inline`, which serves the bytes for display and honours
	 * Range requests so seeking works.
	 */
	let {
		src,
		category,
		contentType,
		name,
	}: {
		src: string;
		category?: string;
		contentType?: string | null;
		name?: string | null;
	} = $props();

	/**
	 * Trust the MIME type first and the category second: the category is our
	 * own coarse grouping, while the MIME type is what the browser will
	 * actually try to decode.
	 */
	const kind = $derived.by((): "image" | "video" | "audio" | null => {
		const type = contentType ?? "";
		if (type.startsWith("image/")) {
			return "image";
		}
		if (type.startsWith("video/")) {
			return "video";
		}
		if (type.startsWith("audio/")) {
			return "audio";
		}
		if (category === FileCategoryEnum.IMAGES) {
			return "image";
		}
		if (category === FileCategoryEnum.VIDEO) {
			return "video";
		}
		if (category === FileCategoryEnum.MUSIC) {
			return "audio";
		}
		return null;
	});

	/** Set when the browser cannot decode it after all — hides the frame. */
	let failed = $state(false);
</script>

{#if kind && !failed}
    <div class="border-t">
        {#if kind === "image"}
            <!-- Checkerboard-free plain surface: a shared image is the subject
                 of the page, so it gets the room rather than a thumbnail box. -->
            <div class="bg-muted/30 flex justify-center">
                <img
                    {src}
                    alt={name ?? ""}
                    class="max-h-[70vh] w-auto max-w-full object-contain"
                    onerror={() => (failed = true)}
                />
            </div>
        {:else if kind === "video"}
            <!-- svelte-ignore a11y_media_has_caption -->
            <video
                {src}
                controls
                preload="metadata"
                class="bg-muted/30 max-h-[70vh] w-full"
                onerror={() => (failed = true)}
            ></video>
        {:else}
            <div class="flex flex-col gap-2 px-6 py-5">
                <audio
                    {src}
                    controls
                    preload="metadata"
                    class="w-full"
                    onerror={() => (failed = true)}
                ></audio>
                <p class="text-muted-foreground text-xs">
                    {m.share_preview_hint()}
                </p>
            </div>
        {/if}
    </div>
{/if}
