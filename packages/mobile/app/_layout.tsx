import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { useColorScheme } from "@/hooks/use-color-scheme";
import "./global.css";

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

function RootLayoutNav() {
	const colorScheme = useColorScheme();

	return (
		<ThemeProvider
			value={colorScheme === "dark" ? CustomDarkTheme : CustomTheme}
		>
			<Stack>
				<Stack.Screen name="sign-in" options={{ headerShown: false }} />
				<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
			</Stack>
			<StatusBar style="auto" />
		</ThemeProvider>
	);
}

export default function RootLayout() {
	return <RootLayoutNav />;
}
