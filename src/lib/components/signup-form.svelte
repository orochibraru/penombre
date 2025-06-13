<script lang="ts">
	import { route } from '$lib/ROUTES';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import BrandGithub from '@tabler/icons-svelte/icons/brand-github';

	const id = $props.id();
</script>

<Card.Root class="mx-auto w-full max-w-sm">
	<Card.Header>
		<Card.Title class="text-2xl">Sign up</Card.Title>
		<Card.Description>Enter your email below to login to your account</Card.Description>
	</Card.Header>
	<Card.Content>
		<form action="">
			<fieldset class="grid gap-4">
				<div class="grid gap-2">
					<Label for="email-{id}">Email</Label>
					<Input id="email-{id}" type="email" placeholder="m@example.com" required />
				</div>
				<div class="grid gap-2">
					<div class="flex items-center">
						<Label for="password-{id}">Password</Label>
					</div>
					<Input id="password-{id}" type="password" required />
				</div>
				<div class="grid gap-2">
					<div class="flex items-center">
						<Label for="confirm-password-{id}">Confirm Password</Label>
					</div>
					<Input id="confirm-password-{id}" type="password" required />
				</div>
				<Button type="submit" class="w-full">Login</Button>
				<Button variant="outline" class="w-full">
					<BrandGithub />
					Login with Github
				</Button>
			</fieldset>
		</form>
		<div class="mt-4 text-center text-sm">
			Already have an account?
			<a href={route('/auth/sign-in')} class="underline"> Sign in </a>
		</div>
		<div class="mt-4 text-center text-sm">
			<a href={route('/')} class="underline"> Back home </a>
		</div>
	</Card.Content>
</Card.Root>
