import { Menubar as MenubarPrimitive } from "bits-ui";
import Root from "./menubar.svelte";
import CheckboxItem from "./menubar-checkbox-item.svelte";
import Content from "./menubar-content.svelte";
import Group from "./menubar-group.svelte";
import GroupHeading from "./menubar-group-heading.svelte";
import Item from "./menubar-item.svelte";
import Label from "./menubar-label.svelte";
import RadioItem from "./menubar-radio-item.svelte";
import Separator from "./menubar-separator.svelte";
import Shortcut from "./menubar-shortcut.svelte";
import SubContent from "./menubar-sub-content.svelte";
import SubTrigger from "./menubar-sub-trigger.svelte";
import Trigger from "./menubar-trigger.svelte";

const Menu = MenubarPrimitive.Menu;
const Sub = MenubarPrimitive.Sub;
const RadioGroup = MenubarPrimitive.RadioGroup;

export {
	CheckboxItem,
	CheckboxItem as MenubarCheckboxItem,
	Content,
	Content as MenubarContent,
	Group,
	Group as MenubarGroup,
	GroupHeading,
	GroupHeading as MenubarGroupHeading,
	Item,
	Item as MenubarItem,
	Label,
	Label as MenubarLabel,
	Menu,
	Menu as MenubarMenu,
	RadioGroup,
	RadioGroup as MenubarRadioGroup,
	RadioItem,
	RadioItem as MenubarRadioItem,
	Root,
	//
	Root as Menubar,
	Separator,
	Separator as MenubarSeparator,
	Shortcut,
	Shortcut as MenubarShortcut,
	Sub,
	Sub as MenubarSub,
	SubContent,
	SubContent as MenubarSubContent,
	SubTrigger,
	SubTrigger as MenubarSubTrigger,
	Trigger,
	Trigger as MenubarTrigger,
};
