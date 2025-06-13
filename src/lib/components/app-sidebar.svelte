<script lang="ts">
	import { route } from '$lib/ROUTES';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import CameraIcon from '@tabler/icons-svelte/icons/camera';
	import DashboardIcon from '@tabler/icons-svelte/icons/dashboard';
	import DatabaseIcon from '@tabler/icons-svelte/icons/database';
	import FileAiIcon from '@tabler/icons-svelte/icons/file-ai';
	import FileDescriptionIcon from '@tabler/icons-svelte/icons/file-description';
	import FileWordIcon from '@tabler/icons-svelte/icons/file-word';
	import HelpIcon from '@tabler/icons-svelte/icons/help';
	import InnerShadowTopIcon from '@tabler/icons-svelte/icons/inner-shadow-top';
	import ReportIcon from '@tabler/icons-svelte/icons/report';
	import SearchIcon from '@tabler/icons-svelte/icons/search';
	import SettingsIcon from '@tabler/icons-svelte/icons/settings';
	import type { ComponentProps } from 'svelte';
	import NavDocuments from './nav-documents.svelte';
	import NavMain from './nav-main.svelte';
	import NavSecondary from './nav-secondary.svelte';
	import NavUser from './nav-user.svelte';

	const data = {
		user: {
			name: 'Nicolas Boyer',
			email: 'nicolas.boyer@gmail.com',
			avatar: '/avatars/shadcn.jpg'
		},
		navClouds: [
			{
				title: 'Capture',
				icon: CameraIcon,
				isActive: true,
				url: route('/'),
				items: [
					{
						title: 'Active Proposals',
						url: route('/')
					},
					{
						title: 'Archived',
						url: route('/')
					}
				]
			},
			{
				title: 'Proposal',
				icon: FileDescriptionIcon,
				url: '/',
				items: [
					{
						title: 'Active Proposals',
						url: route('/')
					},
					{
						title: 'Archived',
						url: route('/')
					}
				]
			},
			{
				title: 'Prompts',
				icon: FileAiIcon,
				url: route('/'),
				items: [
					{
						title: 'Active Proposals',
						url: route('/')
					},
					{
						title: 'Archived',
						url: route('/')
					}
				]
			}
		],
		navSecondary: [
			{
				title: 'Settings',
				url: route('/'),
				icon: SettingsIcon
			},
			{
				title: 'Get Help',
				url: route('/'),
				icon: HelpIcon
			},
			{
				title: 'Search',
				url: route('/'),
				icon: SearchIcon
			}
		],
		documents: [
			{
				name: 'Dashboard',
				url: route('/'),
				icon: DashboardIcon
			},
			{
				name: 'Lifecycle',
				url: route('/lifecycle'),
				icon: DatabaseIcon
			}
		]
	};

	let { ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();
</script>

<Sidebar.Root collapsible="offcanvas" {...restProps}>
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton class="data-[slot=sidebar-menu-button]:!p-1.5">
					{#snippet child({ props })}
						<a href={route('/')} {...props}>
							<InnerShadowTopIcon class="!size-5" />
							<span class="text-base font-semibold">Opendrive.</span>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>
	<Sidebar.Content>
		<NavDocuments items={data.documents} />
		<NavSecondary items={data.navSecondary} class="mt-auto" />
	</Sidebar.Content>
	<Sidebar.Footer>
		<NavUser user={data.user} />
	</Sidebar.Footer>
</Sidebar.Root>
