export const ADMIN_USERS = ['NBOYER'];

export enum RbacOperations {
	DELETE_FILE = 'delete_file',
	LIST_FILES = 'list_files',
	VIEW_FILE = 'view_file',
	CREATE_FILE = 'create_file',
	LIST_FOLDER_FILES = 'list_folder_files',
	VIEW_FOLDER_FILE = 'view_folder_file',
	DELETE_FOLDER_FILE = 'delete_folder_file',
	CREATE_FOLDER_FILE = 'create_folder_file'
}

export const adminOnlyOperations = [RbacOperations.DELETE_FILE, RbacOperations.DELETE_FOLDER_FILE];

export const impersonatingParam = 'impersonateDeveloper';
