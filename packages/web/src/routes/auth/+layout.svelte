<script lang="ts">
    import { route } from "$lib/ROUTES";

    const { children } = $props();
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
            <a href={route("/")} class="flex items-center gap-2 font-medium">
                <img src="/logo.svg" alt="Opendrive Logo" class="w-12 h-12" />
                Opendrive
            </a>
        </div>
        <div class="flex flex-1 items-center justify-center">
            <div class="w-full max-w-lg">
                {@render children()}
            </div>
        </div>
    </div>
</div>
