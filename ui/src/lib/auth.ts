import { getCookie } from "$lib/utils";

export function getAuthToken() {
  return getCookie("csrf_token");
}

export function getAuthError() {
  return getCookie("auth_error");
}
