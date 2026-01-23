<script lang="ts">
    import { title } from "$lib/store/title";
    import * as Field from "$lib/components/ui/field/index.js";
    import Input from "$lib/components/ui/input/input.svelte";
    import { Button } from "$lib/components/ui/button/index";
    import { enhance } from "$app/forms";
    import { cn } from "tailwind-variants";
    import { route } from "$lib/ROUTES";
    import { m } from "$lib/paraglide/messages.js";

    let loading: boolean = $state(false);

    $title = m.forgot_password_title();
</script>

<form class={cn("flex flex-col gap-6")} use:enhance method="POST">
    <Field.FieldSet>
        <Field.Group>
            <div class="flex flex-col items-center gap-1 text-center">
                <h1 class="text-2xl font-bold">{m.forgot_password_title()}</h1>
                <p class="text-muted-foreground text-sm text-balance">
                    {m.forgot_password_description()}
                </p>
            </div>
            <Field.Field>
                <Field.Label for="email">{m.email()}</Field.Label>
                <Input
                    autocomplete="email"
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                />
            </Field.Field>
            <Field.Field>
                <Button class="w-full" type="submit"
                    >{m.reset_password()}</Button
                >
            </Field.Field>
        </Field.Group>
    </Field.FieldSet>
    <div class="grid gap-6">
        <div class="text-center text-sm">
            <p>
                {m.remembered_password()}
                <a
                    href={route("/auth/sign-in")}
                    class="underline hover:text-primary transition-colors"
                >
                    {m.sign_in()}
                </a>
            </p>
        </div>
    </div>
</form>
