import { toast } from 'svelte-sonner';
import { goto } from '$app/navigation';
import {
	type ApiResponse,
	api,
	apiError,
	apiSuccess,
	type Providers,
	type UserSession
} from '$lib/api';
import { route } from '$lib/ROUTES';

export async function getProviders(): Promise<ApiResponse<Providers>> {
	try {
		const { data, error: err, response } = await api.GET('/api/v1/auth/oauth/providers');

		if (err) {
			return apiError(response.status, err.error);
		}

		return apiSuccess(data);
	} catch (e) {
		return apiError(500, 'API seems unreachable', e);
	}
}

export async function getUser(): Promise<ApiResponse<UserSession>> {
	try {
		const { data, error: err, response } = await api.GET('/api/v1/auth/me');

		if (err) {
			return apiError(response.status, err.error);
		}

		if (!data) {
			return apiError(500, 'No user or session retrieved from auth me endpoint');
		}

		return apiSuccess(data);
	} catch (e) {
		return apiError(500, 'API seems unreachable', e);
	}
}

async function signOutCallback() {
	const { error } = await api.POST('/api/v1/auth/sign-out');
	if (error) {
		console.error(error);
		return false;
	}

	await goto(route('/auth/sign-in'), { invalidateAll: true });

	return true;
}

export async function handleSignOut() {
	toast.promise(signOutCallback, {
		loading: 'Signing you out',
		success: 'You were signed out',
		error: 'Failed to sign you out'
	});
}
