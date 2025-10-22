const e = [
		{
			title: 'Introduction',
			description:
				'Welcome to Opendrive - A simple OIDC provider for passwordless authentication',
			path: 'introduction',
			published: !0,
			toc: [
				{ title: 'Get to know Opendrive', url: '#get-to-know-opendrive', items: [] },
				{ title: 'Creator Reviews', url: '#creator-reviews', items: [] },
				{ title: 'Useful Links', url: '#useful-links', items: [] }
			],
			slug: 'introduction',
			section: 'introduction',
			segments: ['introduction']
		}
	],
	t = [
		{
			title: 'API Reference',
			description: 'Complete reference for all Opendrive API endpoints',
			path: 'api',
			published: !0,
			toc: [
				{ title: 'Generating a API Key', url: '#generating-a-api-key', items: [] },
				{ title: 'Custom Dashboards', url: '#custom-dashboards', items: [] },
				{ title: 'Endpoints', url: '#endpoints', items: [] }
			],
			slug: 'api',
			section: 'api',
			segments: ['api']
		}
	],
	i = [
		{
			title: 'Installation',
			description: 'Get Opendrive running quickly with Docker or standalone installation',
			path: 'setup/installation',
			published: !0,
			toc: [
				{ title: 'Before you start', url: '#before-you-start', items: [] },
				{
					title: 'Installation Methods',
					url: '#installation-methods',
					items: [
						{
							title: 'Installation with Docker (recommended)',
							url: '#installation-with-docker-recommended',
							items: []
						},
						{
							title: 'Stand-alone Installation',
							url: '#stand-alone-installation',
							items: []
						}
					]
				},
				{
					title: 'Community Installation Methods',
					url: '#community-installation-methods',
					items: [
						{ title: 'Proxmox', url: '#proxmox', items: [] },
						{ title: 'Unraid', url: '#unraid', items: [] },
						{
							title: 'Kubernetes Helm Chart',
							url: '#kubernetes-helm-chart',
							items: []
						},
						{ title: 'NixOS', url: '#nixos', items: [] }
					]
				},
				{ title: 'Installation from Source', url: '#installation-from-source', items: [] }
			],
			slug: 'setup/installation',
			section: 'setup',
			segments: ['setup', 'installation']
		},
		{
			title: 'Migrate to v1.0',
			description: 'Migrate from previous versions to Opendrive v1.0',
			path: 'setup/migrate-v1',
			published: !0,
			toc: [
				{
					title: 'Breaking Changes',
					url: '#breaking-changes',
					items: [
						{ title: 'Port', url: '#port', items: [] },
						{
							title: 'Environment Variables',
							url: '#environment-variables',
							items: []
						},
						{
							title: 'Database Configuration',
							url: '#database-configuration',
							items: [
								{
									title: 'SQLite Configuration',
									url: '#sqlite-configuration',
									items: []
								},
								{
									title: 'PostgreSQL Connection',
									url: '#postgresql-connection',
									items: []
								}
							]
						},
						{
							title: 'Reverse Proxy Configuration',
							url: '#reverse-proxy-configuration',
							items: []
						}
					]
				},
				{
					title: 'Migration Steps',
					url: '#migration-steps',
					items: [
						{ title: 'Docker', url: '#docker', items: [] },
						{ title: 'Standalone', url: '#standalone', items: [] }
					]
				}
			],
			slug: 'setup/migrate-v1',
			section: 'setup',
			segments: ['setup', 'migrate-v1']
		},
		{
			title: 'Upgrading',
			description: 'Keep your Opendrive installation up to date',
			path: 'setup/upgrading',
			published: !0,
			toc: [
				{ title: 'Docker', url: '#docker', items: [] },
				{ title: 'Stand-alone', url: '#stand-alone', items: [] }
			],
			slug: 'setup/upgrading',
			section: 'setup',
			segments: ['setup', 'upgrading']
		},
		{
			title: 'User Management',
			description: 'Learn how to manage users and set up passkeys in Opendrive',
			path: 'setup/user-management',
			published: !0,
			toc: [
				{
					title: 'Setting Up User Passkeys',
					url: '#setting-up-user-passkeys',
					items: [
						{ title: 'Login Code', url: '#login-code', items: [] },
						{
							title: 'One-Time Access Email',
							url: '#one-time-access-email',
							items: []
						},
						{ title: 'Signup Tokens', url: '#signup-tokens', items: [] }
					]
				}
			],
			slug: 'setup/user-management',
			section: 'setup',
			segments: ['setup', 'user-management']
		}
	],
	n = [
		{
			title: 'Custom Keys',
			description: 'Configure custom signing keys for enhanced security',
			path: 'advanced/custom-keys',
			published: !0,
			toc: [],
			slug: 'advanced/custom-keys',
			section: 'advanced',
			segments: ['advanced', 'custom-keys']
		},
		{
			title: 'Container Security Hardening',
			description:
				'Secure your Opendrive deployment with distroless containers and hardening',
			path: 'advanced/hardening',
			published: !0,
			toc: [
				{ title: 'System requirements', url: '#system-requirements', items: [] },
				{ title: 'Container configuration', url: '#container-configuration', items: [] },
				{ title: 'Distroless container', url: '#distroless-container', items: [] },
				{ title: 'Docker Compose', url: '#docker-compose', items: [] }
			],
			slug: 'advanced/hardening',
			section: 'advanced',
			segments: ['advanced', 'hardening']
		},
		{
			title: 'Nginx Reverse Proxy',
			description: 'Set up Nginx as a reverse proxy for Opendrive',
			path: 'advanced/nginx-reverse-proxy',
			published: !0,
			toc: [],
			slug: 'advanced/nginx-reverse-proxy',
			section: 'advanced',
			segments: ['advanced', 'nginx-reverse-proxy']
		}
	],
	s = [
		{
			title: 'Allowed User Groups',
			description: 'Configure allowed user groups for authentication',
			path: 'configuration/allowed-groups',
			published: !0,
			toc: [],
			slug: 'configuration/allowed-groups',
			section: 'configuration',
			segments: ['configuration', 'allowed-groups']
		},
		{
			title: 'Analytics',
			description: 'Analytics notice for Opendrive',
			path: 'configuration/analytics',
			published: !0,
			toc: [
				{ title: 'What We Collect', url: '#what-we-collect', items: [] },
				{ title: 'Opting Out', url: '#opting-out', items: [] },
				{ title: 'Public Statistics', url: '#public-statistics', items: [] }
			],
			slug: 'configuration/analytics',
			section: 'configuration',
			segments: ['configuration', 'analytics']
		},
		{
			title: 'App Dashboard',
			description: 'The user application dashboard shows apps that the user has access to',
			path: 'configuration/appdashboard',
			published: !0,
			toc: [
				{ title: 'My Apps', url: '#my-apps', items: [] },
				{ title: 'App Configuration', url: '#app-configuration', items: [] },
				{ title: 'Self-Serve Revoke', url: '#self-serve-revoke', items: [] }
			],
			slug: 'configuration/appdashboard',
			section: 'configuration',
			segments: ['configuration', 'appdashboard']
		},
		{
			title: 'Environment Variables',
			description: 'Complete reference for all Opendrive configuration options',
			path: 'configuration/environment-variables',
			published: !0,
			toc: [
				{
					title: 'Overriding the UI configuration',
					url: '#overriding-the-ui-configuration',
					items: []
				},
				{
					title: 'Observability',
					url: '#observability',
					items: [
						{
							title: 'Using OpenTelemetry for logs, metrics, and traces',
							url: '#using-opentelemetry-for-logs-metrics-and-traces',
							items: []
						},
						{
							title: 'Using Prometheus for metrics',
							url: '#using-prometheus-for-metrics',
							items: []
						}
					]
				}
			],
			slug: 'configuration/environment-variables',
			section: 'configuration',
			segments: ['configuration', 'environment-variables']
		},
		{
			title: 'LDAP Integration',
			description: 'Connect Opendrive to your LDAP server for user synchronization',
			path: 'configuration/ldap',
			published: !0,
			toc: [
				{ title: 'LDAP Sync', url: '#ldap-sync', items: [] },
				{ title: 'Generic LDAP Setup', url: '#generic-ldap-setup', items: [] }
			],
			slug: 'configuration/ldap',
			section: 'configuration',
			segments: ['configuration', 'ldap']
		}
	],
	r = [
		{
			title: 'OIDC Client Authentication',
			description:
				'Learn how to authenticate OIDC clients in Opendrive using client secrets and federated credentials.',
			path: 'guides/oidc-client-authentication',
			published: !0,
			toc: [
				{
					title: 'Shared secrets and security',
					url: '#shared-secrets-and-security',
					items: []
				},
				{
					title: 'Using Federated Client Credentials',
					url: '#using-federated-client-credentials',
					items: []
				},
				{
					title: 'Configuring a client for Federated Client Credentials in Opendrive',
					url: '#configuring-a-client-for-federated-client-credentials-in-opendrive',
					items: [
						{
							title: 'Kubernetes Service Account Tokens',
							url: '#kubernetes-service-account-tokens',
							items: []
						},
						{ title: 'Microsoft Azure', url: '#microsoft-azure', items: [] }
					]
				}
			],
			slug: 'guides/oidc-client-authentication',
			section: 'guides',
			segments: ['guides', 'oidc-client-authentication']
		},
		{
			title: 'Proxy Services',
			description: 'Reverse Proxy Setup Guide for Opendrive',
			path: 'guides/proxy-services',
			published: !0,
			toc: [
				{ title: 'Tinyauth', url: '#tinyauth', items: [] },
				{
					title: 'Caddy',
					url: '#caddy',
					items: [
						{
							title: '1. Create a new OIDC client in Opendrive.',
							url: '#1-create-a-new-oidc-client-in-opendrive',
							items: []
						},
						{
							title: '2. Install caddy-security',
							url: '#2-install-caddy-security',
							items: []
						},
						{
							title: '3. Create your Caddyfile',
							url: '#3-create-your-caddyfile',
							items: []
						},
						{
							title: '4. Start Caddy',
							url: '#4-start-caddy',
							items: [
								{
									title: '5. Access the service',
									url: '#5-access-the-service',
									items: []
								}
							]
						}
					]
				},
				{
					title: 'OAuth2 Proxy',
					url: '#oauth2-proxy',
					items: [
						{
							title: 'Docker Installation',
							url: '#docker-installation',
							items: [
								{
									title: '1. Add OAuth2 proxy to the service that should be proxied.',
									url: '#1-add-oauth2-proxy-to-the-service-that-should-be-proxied',
									items: []
								},
								{
									title: '2. Create a new OIDC client in Opendrive.',
									url: '#2-create-a-new-oidc-client-in-opendrive',
									items: []
								},
								{
									title: '3. Create a configuration file for OAuth2 Proxy.',
									url: '#3-create-a-configuration-file-for-oauth2-proxy',
									items: []
								},
								{
									title: '4. Start the services.',
									url: '#4-start-the-services',
									items: []
								},
								{
									title: '5. Access the service.',
									url: '#5-access-the-service-1',
									items: []
								}
							]
						},
						{
							title: 'Standalone Installation',
							url: '#standalone-installation',
							items: []
						}
					]
				},
				{ title: 'Traefik', url: '#traefik', items: [] }
			],
			slug: 'guides/proxy-services',
			section: 'guides',
			segments: ['guides', 'proxy-services']
		}
	],
	o = [
		{
			title: 'Contributing',
			description: 'Learn how to contribute to the Opendrive project',
			path: 'helping-out/contributing',
			published: !0,
			toc: [
				{ title: 'Getting started', url: '#getting-started', items: [] },
				{ title: 'Submit a Pull Request', url: '#submit-a-pull-request', items: [] },
				{
					title: 'Development Environment',
					url: '#development-environment',
					items: [
						{
							title: '1. Install required tools',
							url: '#1-install-required-tools',
							items: [
								{
									title: 'With Dev Containers',
									url: '#with-dev-containers',
									items: []
								},
								{
									title: 'Without Dev Containers',
									url: '#without-dev-containers',
									items: []
								}
							]
						},
						{
							title: '2. Setup',
							url: '#2-setup',
							items: [{ title: 'Backend', url: '#backend', items: [] }]
						},
						{ title: 'Frontend', url: '#frontend', items: [] },
						{ title: 'Testing', url: '#testing', items: [] }
					]
				}
			],
			slug: 'helping-out/contributing',
			section: 'helping-out',
			segments: ['helping-out', 'contributing']
		},
		{
			title: 'Documentation',
			description: 'Contribute to improving the Opendrive website or documentation',
			path: 'helping-out/documentation',
			published: !0,
			toc: [
				{ title: '1. Where docs live', url: '#1-where-docs-live', items: [] },
				{ title: '2. Adding a new page', url: '#2-adding-a-new-page', items: [] },
				{
					title: '3. Frontmatter & generated metadata',
					url: '#3-frontmatter--generated-metadata',
					items: []
				},
				{ title: '4. Navigation', url: '#4-navigation', items: [] },
				{ title: '5. Hiding a page (draft)', url: '#5-hiding-a-page-draft', items: [] },
				{ title: '6. Callouts (Admonitions)', url: '#6-callouts-admonitions', items: [] },
				{ title: '7. Code blocks', url: '#7-code-blocks', items: [] },
				{ title: '8. Images', url: '#8-images', items: [] },
				{ title: '9. Tables', url: '#9-tables', items: [] },
				{ title: '10. Search / TOC', url: '#10-search--toc', items: [] },
				{ title: '11. Common issues', url: '#11-common-issues', items: [] },
				{
					title: '12. Checklist for a new page',
					url: '#12-checklist-for-a-new-page',
					items: []
				},
				{ title: '13. Submitting changes', url: '#13-submitting-changes', items: [] }
			],
			slug: 'helping-out/documentation',
			section: 'helping-out',
			segments: ['helping-out', 'documentation']
		},
		{
			title: 'Translating',
			description: 'Help translate Opendrive into your language',
			path: 'helping-out/translating',
			published: !0,
			toc: [
				{ title: 'Translation Guidelines', url: '#translation-guidelines', items: [] },
				{ title: 'Getting Started', url: '#getting-started', items: [] },
				{ title: 'Adding a New Language', url: '#adding-a-new-language', items: [] },
				{ title: 'Need Help?', url: '#need-help', items: [] }
			],
			slug: 'helping-out/translating',
			section: 'helping-out',
			segments: ['helping-out', 'translating']
		}
	],
	l = [
		{
			title: 'Account Recovery',
			description: 'Solutions to account recovery issues',
			path: 'troubleshooting/account-recovery',
			published: !0,
			toc: [],
			slug: 'troubleshooting/account-recovery',
			section: 'troubleshooting',
			segments: ['troubleshooting', 'account-recovery']
		},
		{
			title: 'Common Issues',
			description: 'Solutions to frequently encountered problems',
			path: 'troubleshooting/common-issues',
			published: !0,
			toc: [
				{ title: 'Unable to Add a Passkey', url: '#unable-to-add-a-passkey', items: [] },
				{
					title: 'Unable to Access the Admin UI After Setup',
					url: '#unable-to-access-the-admin-ui-after-setup',
					items: []
				},
				{ title: 'Invalid Callback URL', url: '#invalid-callback-url', items: [] }
			],
			slug: 'troubleshooting/common-issues',
			section: 'troubleshooting',
			segments: ['troubleshooting', 'common-issues']
		}
	];
export { n as a, t as b, s as c, r as g, o as h, e as i, i as s, l as t };
