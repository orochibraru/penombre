// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { SymbolViewProps, SymbolWeight } from "expo-symbols";
import type { ComponentProps } from "react";
import type { OpaqueColorValue, StyleProp, TextStyle } from "react-native";

type IconMapping = Record<
	SymbolViewProps["name"],
	ComponentProps<typeof MaterialIcons>["name"]
>;
export type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
	"house.fill": "home",
	"paperplane.fill": "send",
	"star.fill": "star",
	magnifyingglass: "search",
	"archivebox.circle.fill": "archive",
	"person.crop.circle": "person",
	"gearshape.fill": "settings",
	"chevron.left.forwardslash.chevron.right": "code",
	"chevron.right": "chevron-right",
	"folder.fill": "folder",
	folder: "folder",
	"clock.fill": "schedule",
	clock: "schedule",
	"person.fill": "person",
	person: "person",
	gear: "settings",
	trash: "delete",
	lock: "lock",
	iphone: "smartphone",
	"person.2": "people",
	globe: "language",
	bell: "notifications",
	"sun.max": "light-mode",
	moon: "dark-mode",
	desktopcomputer: "desktop-windows",
	externaldrive: "storage",
	"arrow.triangle.2.circlepath": "sync",
	"doc.text": "description",
	"info.circle": "info",
	"checkmark.circle.fill": "check-circle",
	doc: "insert-drive-file",
	"doc.plaintext": "article",
	photo: "image",
	film: "movie",
	"music.note": "music-note",
	archivebox: "archive",
	cube: "view-in-ar",
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
	name,
	size = 24,
	color,
	style,
}: {
	name: IconSymbolName;
	size?: number;
	color: string | OpaqueColorValue;
	style?: StyleProp<TextStyle>;
	weight?: SymbolWeight;
}) {
	return (
		<MaterialIcons
			color={color}
			size={size}
			name={MAPPING[name]}
			style={style}
		/>
	);
}
