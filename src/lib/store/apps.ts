import { writable } from "svelte/store";

/** The "get the apps" and "connect the mobile app" dialogs, opened from the
 *  account menu, the phone banner and each other. */
export const appsDialogOpen = writable(false);
export const connectMobileOpen = writable(false);
