<script lang="ts">
	import { resolve } from "$app/paths";
	import LanguageDropdown from "$lib/components/language-dropdown.svelte";

	const { children, data } = $props();
</script>

<div class="grid min-h-svh lg:grid-cols-2">
    <div class="bg-muted relative hidden lg:block">
        <img
            src="/background.png"
            alt="background"
            class="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
    </div>
    <div class="flex flex-col gap-4 p-6 md:p-10">
        <div class="flex justify-center gap-2 md:justify-start">
            <a href={resolve("/")} class="flex items-center gap-2 font-medium">
                <img
                    src="/logo.svg"
                    alt={`${data.config.appName} logo`}
                    class="text-primary size-8"
                />
                <span
                    class="from-primary to-brand-2 bg-linear-to-r bg-clip-text text-transparent"
                >
                    {data.config.appName}
                </span>
            </a>
        </div>
        <div class="flex flex-1 items-center justify-center">
            <div class="w-full max-w-lg">
                {@render children()}
            </div>
        </div>
        <div class="flex">
            <div class="w-44">
                <LanguageDropdown compact />
            </div>
        </div>
    </div>
</div>
