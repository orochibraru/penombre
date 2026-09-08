import { ContextMenu as ContextMenuPrimitive } from "bits-ui";

import CheckboxItem from "./context-menu-checkbox-item.svelte";
import Content from "./context-menu-content.svelte";
import Group from "./context-menu-group.svelte";
import GroupHeading from "./context-menu-group-heading.svelte";
import Item from "./context-menu-item.svelte";
import Label from "./context-menu-label.svelte";
import RadioGroup from "./context-menu-radio-group.svelte";
import RadioItem from "./context-menu-radio-item.svelte";
import Separator from "./context-menu-separator.svelte";
import Shortcut from "./context-menu-shortcut.svelte";
import SubContent from "./context-menu-sub-content.svelte";
import SubTrigger from "./context-menu-sub-trigger.svelte";
import Trigger from "./context-menu-trigger.svelte";

const Sub = ContextMenuPrimitive.Sub;
const Root = ContextMenuPrimitive.Root;

export {
	CheckboxItem,
	CheckboxItem as ContextMenuCheckboxItem,
	Content,
	Content as ContextMenuContent,
	Group,
	Group as ContextMenuGroup,
	GroupHeading,
	GroupHeading as ContextMenuGroupHeading,
	Item,
	Item as ContextMenuItem,
	Label,
	Label as ContextMenuLabel,
	RadioGroup,
	RadioGroup as ContextMenuRadioGroup,
	RadioItem,
	RadioItem as ContextMenuRadioItem,
	Root,
	//
	Root as ContextMenu,
	Separator,
	Separator as ContextMenuSeparator,
	Shortcut,
	Shortcut as ContextMenuShortcut,
	Sub,
	Sub as ContextMenuSub,
	SubContent,
	SubContent as ContextMenuSubContent,
	SubTrigger,
	SubTrigger as ContextMenuSubTrigger,
	Trigger,
	Trigger as ContextMenuTrigger,
};
