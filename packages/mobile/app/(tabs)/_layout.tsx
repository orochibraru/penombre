import { router, Tabs } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { authClient } from "@/lib/auth-client";

export default function TabLayout() {
	const { data: session, isPending } = authClient.useSession();

	useEffect(() => {
		if (!session && !isPending) {
			router.replace("/sign-in");
		}
	}, [session, isPending]);

	const colorScheme = useColorScheme();

	if (isPending) {
		return (
			<View className="flex-1 items-center justify-center bg-white dark:bg-black">
				<ActivityIndicator size="large" color="#9333ea" />
			</View>
		);
	}

	return (
		<SafeAreaProvider>
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
		</SafeAreaProvider>
	);
}
