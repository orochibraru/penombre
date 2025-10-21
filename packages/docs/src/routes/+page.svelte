<script lang="ts">
	import ConnectArrow from '$lib/components/connect-arrow.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card/index.js';
	import { additionalFeatures, mainFeatures } from '$lib/config/features.js';

	import BookOpen from '@lucide/svelte/icons/book-open';
	import Github from '@lucide/svelte/icons/github';
	import TestTube from '@lucide/svelte/icons/test-tube';
	import { onMount } from 'svelte';
	import type { PageProps } from './$types.js';

	let { data }: PageProps = $props();

	let isLoaded = $state(false);

	onMount(() => {
		requestAnimationFrame(() => (isLoaded = true));
	});
</script>

<svelte:head>
	<title>Opendrive - Simple OIDC Provider</title>
	<meta
		name="description"
		content="A simple and easy-to-use OIDC provider that allows users to authenticate with their passkeys to your services."
	/>
</svelte:head>

<div class="bg-background text-foreground min-h-screen">
	<!-- Hero Section -->
	<section class="px-4 py-20">
		<div class="container mx-auto max-w-4xl text-center">
			<h1
				class="text-foreground mb-6 text-5xl font-bold md:text-7xl"
				style="transform: {isLoaded
					? 'translateY(0)'
					: 'translateY(30px)'}; opacity: {isLoaded
					? 1
					: 0}; transition: all 0.6s ease-out 50ms;"
			>
				Opendrive
			</h1>
			<p
				class="text-muted-foreground mb-8 text-xl leading-relaxed md:text-2xl"
				style="transform: {isLoaded
					? 'translateY(0)'
					: 'translateY(30px)'}; opacity: {isLoaded
					? 1
					: 0}; transition: all 0.6s ease-out 100ms;"
			>
				A simple and easy-to-use OIDC provider that allows users to authenticate with their
				passkeys to your services.
			</p>
			<div
				class="flex flex-col justify-center gap-4 sm:flex-row"
				style="transform: {isLoaded
					? 'translateY(0)'
					: 'translateY(30px)'}; opacity: {isLoaded
					? 1
					: 0}; transition: all 0.6s ease-out 150ms;"
			>
				<Button size="lg" href="/docs">
					<BookOpen class="mr-2 h-5 w-5" />
					Documentation
				</Button>
				<Button
					size="lg"
					variant="outline"
					href="https://demo.pocket-id.org"
					target="_blank"
				>
					<TestTube class="mr-1 h-5 w-5" />
					Demo
				</Button>
			</div>
			<div
				style="transform: {isLoaded
					? 'translateY(0)'
					: 'translateY(30px)'}; opacity: {isLoaded
					? 1
					: 0}; transition: all 0.6s ease-out 150ms;"
			>
				{#if data.instanceCount}
					<Badge variant="outline" class="mt-6">
						<div
							class="mr-1 inline-block h-2 w-2 animate-pulse rounded-full bg-green-400"
						></div>
						{data.instanceCount} Active Instances
					</Badge>
				{/if}
			</div>
		</div>
	</section>

	<!-- Main Features Section -->
	<section id="features" class="px-4 pt-20 pb-10">
		<div class="container mx-auto">
			<div
				class="mb-16 text-center"
				style="transform: {isLoaded
					? 'translateY(0)'
					: 'translateY(30px)'}; opacity: {isLoaded
					? 1
					: 0}; transition: all 0.6s ease-out 50ms;"
			>
				<h2 class="mb-4 text-4xl font-bold">Key Features</h2>
				<p class="text-muted-foreground mx-auto max-w-2xl text-lg">
					Everything you need for modern authentication in one simple package
				</p>
			</div>

			<div class="mx-auto grid max-w-6xl gap-12">
				{#each mainFeatures as feature, index}
					{@const imageFirst = index % 2 === 0}
					{@const Icon = feature.icon}
					<div
						class="grid items-center gap-8 md:grid-cols-2"
						style="transform: {isLoaded
							? 'translateY(0)'
							: 'translateY(30px)'}; opacity: {isLoaded
							? 1
							: 0}; transition: all 0.6s ease-out {100 + index * 20}ms;"
					>
						<div class={imageFirst ? 'md:order-2' : ''}>
							<div class="mb-4 flex items-center">
								<Icon class="text-foreground mr-3 size-8" />
								<h3 class="mb-0 text-2xl font-bold">{feature.title}</h3>
							</div>
							<p class="text-muted-foreground text-lg leading-relaxed">
								{feature.description}
							</p>
						</div>
						<div
							class="bg-card border-border rounded-lg border p-4 {imageFirst
								? 'md:order-1'
								: ''}"
						>
							<img
								src="/img/landing/{feature.image}"
								alt={feature.title}
								class="w-full rounded-lg"
							/>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- Additional Features Section -->
	<section class="px-4 pb-20">
		<div class="container mx-auto">
			<div class="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3">
				{#each additionalFeatures as feature, index}
					{@const Icon = feature.icon}
					<Card
						class="bg-card border-border hover:border-muted-foreground/50 transition-all duration-300"
						style="transform: {isLoaded
							? 'translateY(0)'
							: 'translateY(30px)'}; opacity: {isLoaded
							? 1
							: 0}; transition: all 0.6s ease-out {100 + index * 15}ms;"
					>
						<CardHeader>
							<div class="flex items-center space-x-2">
								<Icon this={feature.icon} class="text-foreground size-6" />
								<CardTitle class="text-foreground">{feature.title}</CardTitle>
							</div>
						</CardHeader>
						<CardContent>
							<CardDescription class="text-muted-foreground"
								>{feature.description}</CardDescription
							>
						</CardContent>
					</Card>
				{/each}
			</div>
		</div>
	</section>

	<section class="py-8">
		<div class="container mx-auto text-center">
			<ConnectArrow class="mx-auto mb-8 h-12 rotate-90 text-gray-400" />
		</div>
	</section>

	<!-- CTA Section -->
	<section class="px-4 py-10">
		<div
			class="container mx-auto max-w-3xl text-center"
			style="transform: {isLoaded ? 'translateY(0)' : 'translateY(30px)'}; opacity: {isLoaded
				? 1
				: 0}; transition: all 0.6s ease-out 150ms;"
		>
			<h2 class="mb-6 text-3xl font-bold md:text-4xl">Ready to get started?</h2>
			<p class="text-muted-foreground mb-8 text-xl">
				Deploy Opendrive today and start providing secure, passwordless authentication to
				your users.
			</p>
			<div class="flex flex-col justify-center gap-4 sm:flex-row">
				<Button size="lg" href="/docs">
					<BookOpen class="mr-1 h-5 w-5" />
					Read Documentation
				</Button>
				<Button
					size="lg"
					variant="outline"
					href="https://github.com/pocket-id/pocket-id"
					target="_blank"
				>
					<Github class="mr-1 size-5" />
					View on GitHub
				</Button>
			</div>
		</div>
	</section>
</div>
