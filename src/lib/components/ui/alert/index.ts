import Description from "./alert-description.svelte";
import Title from "./alert-title.svelte";
import Root from "./alert.svelte";

export { type AlertVariant, alertVariants } from "./alert.svelte";

export {
	Description,
	Description as AlertDescription,
	Root,
	//
	Root as Alert,
	Title,
	Title as AlertTitle,
};
