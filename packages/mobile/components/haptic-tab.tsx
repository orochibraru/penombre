import process from "node:process";
import type { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { PlatformPressable } from "@react-navigation/elements";
import * as Haptics from "expo-haptics";
import type { GestureResponderEvent } from "react-native";

export function HapticTab(props: BottomTabBarButtonProps) {
	const handlePress = (ev: GestureResponderEvent) => {
		if (process.env.EXPO_OS === "ios") {
			// Add a soft haptic feedback when pressing down on the tabs.
			void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		}
		props.onPressIn?.(ev);
	};

	return <PlatformPressable {...props} onPressIn={handlePress} />;
}
