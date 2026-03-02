import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Pressable,
	Text,
	TextInput,
	View,
} from "react-native";
import { useAuth } from "@/contexts/auth-context";
import {
	type AuthProvider,
	fetchAuthProviders,
	signInWithOAuth,
} from "@/lib/api";

export default function SignInScreen() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [providers, setProviders] = useState<AuthProvider[]>([]);
	const [providersLoading, setProvidersLoading] = useState(true);
	const { signIn, checkAuthStatus } = useAuth();
	const router = useRouter();

	const emailProvider = providers.find((p) => p.type === "email" && p.enabled);
	const oauthProviders = providers.filter(
		(p) => p.type === "oauth" && p.enabled,
	);

	useEffect(() => {
		fetchAuthProviders().then((result) => {
			if (result.data) {
				setProviders(result.data);
			}

			setProvidersLoading(false);
		});
	}, []);

	const handleSignIn = async () => {
		if (!email || !password) {
			Alert.alert("Error", "Please enter email and password");
			return;
		}

		setLoading(true);
		try {
			const result = await signIn(email, password);
			if (result.success) {
				router.replace("/(tabs)");
			} else {
				Alert.alert("Sign In Failed", result.error || "Unknown error");
			}
		} catch (_error) {
			Alert.alert("Error", "An unexpected error occurred");
		} finally {
			setLoading(false);
		}
	};

	const handleOAuthSignIn = async (provider: AuthProvider) => {
		const callbackURL = Linking.createURL("/");

		try {
			const { url, error } = await signInWithOAuth(provider.name, callbackURL);
			if (error || !url) {
				Alert.alert("Error", error || "Failed to start OAuth flow");
				return;
			}

			const result = await WebBrowser.openAuthSessionAsync(url, callbackURL);
			if (result.type === "success") {
				await checkAuthStatus();
				router.replace("/(tabs)");
			}
		} catch (_error) {
			Alert.alert("Error", "OAuth sign in failed");
		}
	};

	if (providersLoading) {
		return (
			<View className="flex-1 items-center justify-center bg-white dark:bg-black">
				<ActivityIndicator size="large" color="#9333ea" />
			</View>
		);
	}

	return (
		<View className="flex-1 items-center justify-center bg-white dark:bg-black p-6">
			<View className="w-full max-w-md">
				<Text className="text-3xl font-bold text-center mb-2 text-black dark:text-white">
					OpenDrive
				</Text>
				<Text className="text-center mb-8 text-gray-600 dark:text-gray-400">
					Sign in to continue
				</Text>

				{oauthProviders.length > 0 && (
					<View className="mb-6">
						{oauthProviders.map((provider) => (
							<Pressable
								key={provider.name}
								className="w-full py-3 border border-gray-300 dark:border-gray-700 rounded-lg items-center mb-3 active:opacity-80 bg-white dark:bg-gray-900"
								onPress={() => handleOAuthSignIn(provider)}
								disabled={loading}
							>
								<Text className="text-black dark:text-white font-semibold text-base">
									Continue with {provider.prettyName}
								</Text>
							</Pressable>
						))}
					</View>
				)}

				{emailProvider && oauthProviders.length > 0 && (
					<View className="flex-row items-center mb-6">
						<View className="flex-1 h-px bg-gray-300 dark:bg-gray-700" />
						<Text className="mx-4 text-gray-500 dark:text-gray-400 text-sm">
							or
						</Text>
						<View className="flex-1 h-px bg-gray-300 dark:bg-gray-700" />
					</View>
				)}

				{emailProvider && (
					<View className="space-y-4">
						<View>
							<Text className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
								Email
							</Text>
							<TextInput
								className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-black dark:text-white"
								placeholder="your@email.com"
								placeholderTextColor="#999"
								value={email}
								onChangeText={setEmail}
								autoCapitalize="none"
								keyboardType="email-address"
								editable={!loading}
							/>
						</View>

						<View>
							<Text className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
								Password
							</Text>
							<TextInput
								className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-black dark:text-white"
								placeholder="••••••••"
								placeholderTextColor="#999"
								value={password}
								onChangeText={setPassword}
								secureTextEntry
								editable={!loading}
							/>
						</View>

						<Pressable
							className="w-full py-3 bg-purple-600 rounded-lg items-center mt-6 active:opacity-80"
							onPress={handleSignIn}
							disabled={loading}
						>
							{loading ? (
								<ActivityIndicator color="white" />
							) : (
								<Text className="text-white font-semibold text-base">
									Sign In
								</Text>
							)}
						</Pressable>
					</View>
				)}

				{!emailProvider && oauthProviders.length === 0 && (
					<Text className="text-center text-gray-500 dark:text-gray-400">
						No sign-in methods are currently available.
					</Text>
				)}
			</View>
		</View>
	);
}
