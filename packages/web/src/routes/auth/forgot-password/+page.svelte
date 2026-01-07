<script lang="ts">
    import { title } from "$lib/store/title";
    import * as Field from "$lib/components/ui/field/index.js";
    import Input from "$lib/components/ui/input/input.svelte";
    import { Button } from "$lib/components/ui/button/index";
    import { enhance } from "$app/forms";
    import { cn } from "tailwind-variants";
    import { route } from "$lib/ROUTES";

    let loading: boolean = $state(false);

    $title = "Forgot Password";
</script>

<form class={cn("flex flex-col gap-6")} use:enhance method="POST">
    <Field.FieldSet>
        <Field.Group>
            <div class="flex flex-col items-center gap-1 text-center">
                <h1 class="text-2xl font-bold">Forgot your password?</h1>
                <p class="text-muted-foreground text-sm text-balance">
                    Enter your email below to reset your password.
                </p>
            </div>
            <Field.Field>
                <Field.Label for="email">Email</Field.Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                />
            </Field.Field>
            <Field.Field>
                <Button class="w-full" type="submit">Reset Password</Button>
            </Field.Field>
        </Field.Group>
    </Field.FieldSet>
    <div class="grid gap-6">
        <div class="text-center text-sm">
            <p>
                Remembered your password?
                <a
                    href={route("/auth/sign-in")}
                    class="underline hover:text-primary transition-colors"
                >
                    Sign in
                </a>
            </p>
        </div>
    </div>
</form>
