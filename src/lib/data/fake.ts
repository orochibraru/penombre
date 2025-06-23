import type { DataItem } from '$lib/components/schemas';

const items: DataItem[] = [
	{
		id: 1,
		title: 'Cover page',
		category: 'Document',
		status: 'In Process',
		size: 18,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 2,
		title: 'Table of contents',
		category: 'Table of contents',
		status: 'Done',
		size: 29,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 3,
		title: 'Executive summary',
		category: 'Narrative',
		status: 'Done',
		size: 10,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 4,
		title: 'Technical approach',
		category: 'Narrative',
		status: 'Done',
		size: 27,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 5,
		title: 'Design',
		category: 'Narrative',
		status: 'In Process',
		size: 2,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 6,
		title: 'Capabilities',
		category: 'Narrative',
		status: 'In Process',
		size: 20,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 7,
		title: 'Integration with existing systems',
		category: 'Narrative',
		status: 'In Process',
		size: 19,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 8,
		title: 'Innovation and Advantages',
		category: 'Narrative',
		status: 'Done',
		size: 25,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 9,
		title: "Overview of EMR's Innovative Solutions",
		category: 'Technical content',
		status: 'Done',
		size: 7,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 10,
		title: 'Advanced Algorithms and Machine Learning',
		category: 'Narrative',
		status: 'Done',
		size: 30,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 11,
		title: 'Adaptive Communication Protocols',
		category: 'Narrative',
		status: 'Done',
		size: 9,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 12,
		title: 'Advantages Over Current Technologies',
		category: 'Narrative',
		status: 'Done',
		size: 12,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 13,
		title: 'Past Performance',
		category: 'Narrative',
		status: 'Done',
		size: 22,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 14,
		title: 'Customer Feedback and Satisfaction Levels',
		category: 'Narrative',
		status: 'Done',
		size: 15,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 15,
		title: 'Implementation Challenges and Solutions',
		category: 'Narrative',
		status: 'Done',
		size: 3,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 16,
		title: 'Security Measures and Data Protection Policies',
		category: 'Narrative',
		status: 'In Process',
		size: 6,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 17,
		title: 'Scalability and Future Proofing',
		category: 'Narrative',
		status: 'Done',
		size: 4,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 18,
		title: 'Cost-Benefit Analysis',
		category: 'Plain language',
		status: 'Done',
		size: 14,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 19,
		title: 'User Training and Onboarding Experience',
		category: 'Narrative',
		status: 'Done',
		size: 17,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 20,
		title: 'Future Development Roadmap',
		category: 'Narrative',
		status: 'Done',
		size: 11,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 21,
		title: 'System Architecture Overview',
		category: 'Technical content',
		status: 'In Process',
		size: 24,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 22,
		title: 'Risk Management Plan',
		category: 'Narrative',
		status: 'Done',
		size: 15,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 23,
		title: 'Compliance Documentation',
		category: 'Legal',
		status: 'In Process',
		size: 31,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 24,
		title: 'API Documentation',
		category: 'Technical content',
		status: 'Done',
		size: 8,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 25,
		title: 'User Interface Mockups',
		category: 'Visual',
		status: 'In Process',
		size: 19,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 26,
		title: 'Database Schema',
		category: 'Technical content',
		status: 'Done',
		size: 22,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 27,
		title: 'Testing Methodology',
		category: 'Technical content',
		status: 'In Process',
		size: 17,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 28,
		title: 'Deployment Strategy',
		category: 'Narrative',
		status: 'Done',
		size: 26,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 29,
		title: 'Budget Breakdown',
		category: 'Financial',
		status: 'In Process',
		size: 13,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 30,
		title: 'Market Analysis',
		category: 'Research',
		status: 'Done',
		size: 29,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 31,
		title: 'Competitor Comparison',
		category: 'Research',
		status: 'In Process',
		size: 21,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 32,
		title: 'Maintenance Plan',
		category: 'Technical content',
		status: 'Done',
		size: 16,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 33,
		title: 'User Personas',
		category: 'Research',
		status: 'In Process',
		size: 27,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 34,
		title: 'Accessibility Compliance',
		category: 'Legal',
		status: 'Done',
		size: 18,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 35,
		title: 'Performance Metrics',
		category: 'Technical content',
		status: 'In Process',
		size: 23,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 36,
		title: 'Disaster Recovery Plan',
		category: 'Technical content',
		status: 'Done',
		size: 14,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 37,
		title: 'Third-party Integrations',
		category: 'Technical content',
		status: 'In Process',
		size: 25,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 38,
		title: 'User Feedback Summary',
		category: 'Research',
		status: 'Done',
		size: 20,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 39,
		title: 'Localization Strategy',
		category: 'Narrative',
		status: 'In Process',
		size: 12,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 40,
		title: 'Mobile Compatibility',
		category: 'Technical content',
		status: 'Done',
		size: 28,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 41,
		title: 'Data Migration Plan',
		category: 'Technical content',
		status: 'In Process',
		size: 19,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 42,
		title: 'Quality Assurance Protocols',
		category: 'Technical content',
		status: 'Done',
		size: 30,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 43,
		title: 'Stakeholder Analysis',
		category: 'Research',
		status: 'In Process',
		size: 11,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 44,
		title: 'Environmental Impact Assessment',
		category: 'Research',
		status: 'Done',
		size: 24,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 45,
		title: 'Intellectual Property Rights',
		category: 'Legal',
		status: 'In Process',
		size: 17,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 46,
		title: 'Customer Support Framework',
		category: 'Narrative',
		status: 'Done',
		size: 22,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 47,
		title: 'Version Control Strategy',
		category: 'Technical content',
		status: 'In Process',
		size: 15,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 48,
		title: 'Continuous Integration Pipeline',
		category: 'Technical content',
		status: 'Done',
		size: 26,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 49,
		title: 'Regulatory Compliance',
		category: 'Legal',
		status: 'In Process',
		size: 13,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 50,
		title: 'User Authentication System',
		category: 'Technical content',
		status: 'Done',
		size: 28,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 51,
		title: 'Data Analytics Framework',
		category: 'Technical content',
		status: 'In Process',
		size: 21,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 52,
		title: 'Cloud Infrastructure',
		category: 'Technical content',
		status: 'Done',
		size: 16,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 53,
		title: 'Network Security Measures',
		category: 'Technical content',
		status: 'In Process',
		size: 29,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 54,
		title: 'Project Timeline',
		category: 'Planning',
		status: 'Done',
		size: 14,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 55,
		title: 'Resource Allocation',
		category: 'Planning',
		status: 'In Process',
		size: 27,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 56,
		title: 'Team Structure and Roles',
		category: 'Planning',
		status: 'Done',
		size: 20,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 57,
		title: 'Communication Protocols',
		category: 'Planning',
		status: 'In Process',
		size: 15,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 58,
		title: 'Success Metrics',
		category: 'Planning',
		status: 'Done',
		size: 30,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 59,
		title: 'Internationalization Support',
		category: 'Technical content',
		status: 'In Process',
		size: 23,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 60,
		title: 'Backup and Recovery Procedures',
		category: 'Technical content',
		status: 'Done',
		size: 18,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 61,
		title: 'Monitoring and Alerting System',
		category: 'Technical content',
		status: 'In Process',
		size: 25,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 62,
		title: 'Code Review Guidelines',
		category: 'Technical content',
		status: 'Done',
		size: 12,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 63,
		title: 'Documentation Standards',
		category: 'Technical content',
		status: 'In Process',
		size: 27,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 64,
		title: 'Release Management Process',
		category: 'Planning',
		status: 'Done',
		size: 22,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 65,
		title: 'Feature Prioritization Matrix',
		category: 'Planning',
		status: 'In Process',
		size: 19,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 66,
		title: 'Technical Debt Assessment',
		category: 'Technical content',
		status: 'Done',
		size: 24,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 67,
		title: 'Capacity Planning',
		category: 'Planning',
		status: 'In Process',
		size: 21,
		createdAt: new Date(),
		lastUpdated: new Date()
	},
	{
		id: 68,
		title: 'Service Level Agreements',
		category: 'Legal',
		status: 'Done',
		size: 26,
		createdAt: new Date(),
		lastUpdated: new Date()
	}
];

export default items;
