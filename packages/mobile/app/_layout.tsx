import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider,
} from "@react-navigation/native";
import { Redirect, Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import "react-native-reanimated";
import "./global.css";

import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { useColorScheme } from "@/hooks/use-color-scheme";

const CustomTheme = {
	...DefaultTheme,
	colors: {
		...DefaultTheme.colors,
		primary: "rgb(173, 66, 245)",
		background: "#f0f0f0",
	},
};

const CustomDarkTheme = {
	...DarkTheme,
	colors: {
		...DarkTheme.colors,
		primary: "rgb(173, 66, 245)",
		background: "#121212",
	},
};

export const unstable_settings = {
	anchor: "(tabs)",
};

function AuthGuard() {
	const { isAuthenticated } = useAuth();
	const pathname = usePathname();

	// Show loading screen while checking auth
	if (isAuthenticated === null) {
		return (
			<View className="flex-1 items-center justify-center bg-white dark:bg-black">
				<ActivityIndicator size="large" color="rgb(173, 66, 245)" />
			</View>
		);
	}

	// If not authenticated and not on sign-in page, redirect
	if (!isAuthenticated && pathname !== "/sign-in") {
		return <Redirect href="/sign-in" />;
	}

	// If authenticated and on sign-in page, redirect to tabs
	if (isAuthenticated && pathname === "/sign-in") {
		return <Redirect href="/(tabs)" />;
	}

	return null;
}

function RootLayoutNav() {
	const colorScheme = useColorScheme();

	return (
		<ThemeProvider
			value={colorScheme === "dark" ? CustomDarkTheme : CustomTheme}
		>
			<AuthGuard />
			<Stack>
				<Stack.Screen name="sign-in" options={{ headerShown: false }} />
				<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
			</Stack>
			<StatusBar style="auto" />
		</ThemeProvider>
	);
}

export default function RootLayout() {
	return (
		<AuthProvider>
			<RootLayoutNav />
		</AuthProvider>
	);
}
