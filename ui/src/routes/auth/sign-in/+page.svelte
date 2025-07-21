<script lang="ts">
  import * as Alert from "$lib/components/ui/alert/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { title } from "$lib/store/title";
  import { capitalizeFirstLetter, cn } from "$lib/utils.js";
  import { dev } from "$app/environment";
  import { PUBLIC_API_URL } from "$env/static/public";
  import { AlertCircleIcon } from "@lucide/svelte";

  $title = "Sign in";

  const { data } = $props();

  let error: boolean = $state(false);
</script>

<form class={cn("flex flex-col gap-6")}>
  <div class="flex flex-col items-center gap-2 text-center">
    <h1 class="text-2xl font-bold">Access to your account</h1>
    <p class="text-muted-foreground text-sm text-balance">
      Choose one of the sign in methods to continue.
    </p>
  </div>
  {#if error}
    <Alert.Root class="mb-5" variant="destructive">
      <Alert.Title>Oops.</Alert.Title>
      <Alert.Description>
        There was an error when signing in. Please try again.
      </Alert.Description>
    </Alert.Root>
  {/if}
  <div class="grid gap-6">
    {#if data.providers && data.providers.length > 0}
      <div class="grid gap-2">
        {#each data.providers as provider}
          <a
            href={dev
              ? new URL(`/api/v1/auth/oauth/${provider}/login`, PUBLIC_API_URL)
                  .href
              : `/api/v1/auth/oauth/${provider}/login`}
            class="w-full"
          >
            <Button variant="outline" class="w-full">
              Sign in with {capitalizeFirstLetter(provider)}
            </Button>
          </a>
        {/each}
      </div>
    {:else}
      <Alert.Root>
        <AlertCircleIcon />
        <Alert.Title>
          No providers have been configured for this application.
        </Alert.Title>
        <Alert.Description>
          <p>
            Please read <a
              target="_blank"
              class="underline"
              href="https://opendrive.space/docs">the docs</a
            > to configure an auth provider.
          </p>
        </Alert.Description>
      </Alert.Root>
    {/if}

    <div class="text-center text-sm">Don&apos;t have an account? Too bad.</div>
  </div>
</form>
