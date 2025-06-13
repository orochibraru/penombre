export const ADMIN_USERS = ['BOYERN2', 'MCKINNA1', 'SEANTC', 'DOUGLAK1']; // Janus Maintainers

export enum RbacOperations {
	DELETE_POOL = 'delete_pool',
	LIST_POOLS = 'list_pools',
	VIEW_POOL = 'view_pool',
	CREATE_POOL = 'create_pool',
	LIST_POOL_CLIENTS = 'list_clients',
	VIEW_POOL_CLIENT = 'view_client',
	DELETE_POOL_CLIENT = 'delete_client',
	CREATE_POOL_CLIENT = 'create_client'
}

export const adminOnlyOperations = [RbacOperations.DELETE_POOL, RbacOperations.DELETE_POOL_CLIENT];

export const impersonatingParam = 'impersonateDeveloper';
