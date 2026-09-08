import { type Writable, writable } from "svelte/store";

export const title: Writable<string> = writable("");
