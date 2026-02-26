import { Tabs } from "expo-router";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function TabLayout() {
	const colorScheme = useColorScheme();

	return (
		<Tabs
			screenOptions={{
				tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
				headerShown: false,
				tabBarButton: HapticTab,
				tabBarStyle: {
					borderTopLeftRadius: 20,
					borderTopRightRadius: 20,
					borderTopWidth: 1,
					borderTopColor:
						colorScheme === "dark"
							? "rgba(255,255,255,0.1)"
							: "rgba(0,0,0,0.1)",
					position: "absolute",
					paddingTop: 6,
				},
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: "Home",
					tabBarIcon: ({ color }) => (
						<IconSymbol size={24} name="folder.fill" color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="recent"
				options={{
					title: "Recent",
					tabBarIcon: ({ color }) => (
						<IconSymbol size={24} name="clock.fill" color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="profile"
				options={{
					title: "Account",
					tabBarIcon: ({ color }) => (
						<IconSymbol size={24} name="person.fill" color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="settings"
				options={{
					title: "Settings",
					tabBarIcon: ({ color }) => (
						<IconSymbol size={24} name="gear" color={color} />
					),
				}}
			/>
		</Tabs>
	);
}
