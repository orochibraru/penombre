<script lang="ts">
	import AlertCircle from '@lucide/svelte/icons/alert-circle';
	import AlertTriangle from '@lucide/svelte/icons/alert-triangle';
	import Info from '@lucide/svelte/icons/info';
	import Lightbulb from '@lucide/svelte/icons/lightbulb';
	import OctagonAlert from '@lucide/svelte/icons/octagon-alert';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes, HTMLBlockquoteAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Props = {
		class?: string;
		children?: Snippet;
		restProps: HTMLBlockquoteAttributes | HTMLDivElement;
	};

	let { class: className, children, ...restProps }: Props = $props();

	// Extract text content to detect callout type
	let textContent = $state('');

	function getCalloutType(content: string): keyof typeof calloutConfig | null {
		const lower = content.toLowerCase();
		if (lower.includes('[!note]')) return 'note';
		if (lower.includes('[!tip]')) return 'tip';
		if (lower.includes('[!important]')) return 'important';
		if (lower.includes('[!warning]')) return 'warning';
		if (lower.includes('[!caution]')) return 'caution';
		return null;
	}

	const calloutConfig = {
		note: {
			icon: Info,
			label: 'Note',
			class: 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100'
		},
		tip: {
			icon: Lightbulb,
			label: 'Tip',
			class: 'border-l-green-500 bg-green-50 dark:bg-green-950/30 text-green-900 dark:text-green-100'
		},
		important: {
			icon: AlertCircle,
			label: 'Important',
			class: 'border-l-purple-500 bg-purple-50 dark:bg-purple-950/30 text-purple-900 dark:text-purple-100'
		},
		warning: {
			icon: AlertTriangle,
			label: 'Warning',
			class: 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/30 text-yellow-900 dark:text-yellow-100'
		},
		caution: {
			icon: OctagonAlert,
			label: 'Caution',
			class: 'border-l-red-500 bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-100'
		}
	};

	let type = $state<keyof typeof calloutConfig | null>(null);
	let config = $state<(typeof calloutConfig)[keyof typeof calloutConfig] | null>(null);

	function cleanContent(element: HTMLElement) {
		const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);

		let node: Node | null;
		node = walker.nextNode();
		while (node) {
			if (node.textContent) {
				node.textContent = node.textContent.replace(
					/\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i,
					''
				);
			}
			node = walker.nextNode();
		}
	}

	function handleMount(element: HTMLElement) {
		textContent = element.textContent || '';
		type = getCalloutType(textContent);
		config = type ? calloutConfig[type] : null;

		if (type) {
			cleanContent(element);
		}
	}
</script>

{#if type && config}
	{@const Icon = config.icon}
	<div {...restProps} use:handleMount>
		<div class="flex items-start gap-3">
			<Icon class="mt-0.5 size-5 shrink-0" />
			<div class="flex-1">
				<div class="mb-1 font-semibold">{config.label}</div>
				<div class="[&>p]:mb-2 last:[&>p]:mb-0">
					{#if children}
						{@render children()}
					{/if}
				</div>
			</div>
		</div>
	</div>
{:else}
	<blockquote
		{...restProps}
		class={cn('bg-muted border-l-primary mt-6 rounded-sm border-l-2 p-5 italic', className)}
		use:handleMount
	>
		{@render children?.()}
	</blockquote>
{/if}

<!-- Usage Examples -->

<!-- 
> [!NOTE]
> Highlights information that users should take into account, even when skimming.

> [!TIP]
> Optional information to help a user be more successful.

> [!IMPORTANT]
> Crucial information necessary for users to succeed.

> [!WARNING]
> Critical content demanding immediate user attention due to potential risks.

> [!CAUTION]
> Negative potential consequences of an action. 
 -->
