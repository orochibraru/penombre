import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Pressable,
	Text,
	TextInput,
	View,
} from "react-native";
import useSWR from "swr";
import { type AuthProvider, fetchAuthProviders } from "@/lib/api";
import { authClient } from "@/lib/auth-client";

export default function SignInScreen() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);

	const { data: session, isPending } = authClient.useSession();

	useEffect(() => {
		if (session && !isPending) {
			router.push("/(tabs)");
		}
	}, [session, isPending]);

	const {
		data: providers,
		error: providersError,
		isLoading: providersLoading,
		mutate,
	} = useSWR("/api/v1/auth/providers", fetchAuthProviders);

	const handleSignIn = async () => {
		if (!email || !password) {
			Alert.alert("Error", "Please enter email and password");
			return;
		}

		setLoading(true);
		const { error } = await authClient.signIn.email({
			email,
			password,
		});
		if (error) {
			setLoading(false);
			console.log("Sign-in error:", error);
			Alert.alert("Error", error.message || "Failed to sign in");
			return;
		}
	};

	const handleOAuthSignIn = async (provider: AuthProvider) => {
		setLoading(true);
		const { error } = await authClient.signIn.oauth2({
			providerId: provider.name,
			callbackURL: "/(tabs)",
		});

		if (error) {
			setLoading(false);
			console.log("OAuth sign-in error:", error);
			Alert.alert("Error", "Failed to initiate OAuth sign-in");
			return;
		}
	};

	if (providersLoading || isPending) {
		return (
			<View className="flex-1 items-center justify-center bg-white dark:bg-black">
				<ActivityIndicator size="large" color="#9333ea" />
			</View>
		);
	}

	if (providersError) {
		console.log("Error fetching auth providers:", providersError);
		return (
			<View className="flex-1 items-center justify-center bg-white dark:bg-black p-6">
				<Text className="text-red-500 text-center mb-4">
					Failed to load auth providers
				</Text>
				<Pressable
					className="bg-purple-600 py-3 px-6 rounded-lg"
					onPress={() => mutate()}
				>
					<Text className="text-white font-semibold">Reload</Text>
				</Pressable>
			</View>
		);
	}

	if (!providers || !providers.data || providers.data.length === 0) {
		return (
			<View className="flex-1 items-center justify-center bg-white dark:bg-black p-6">
				<Text className="text-gray-500 dark:text-gray-400 text-center mb-4">
					No authentication providers are configured.
				</Text>
				<Text className="text-gray-500 dark:text-gray-400 text-center">
					Please contact the administrator.
				</Text>
			</View>
		);
	}

	const emailProvider = providers.data.find(
		(p) => p.type === "email" && p.enabled,
	);
	const oauthProviders = providers.data.filter(
		(p) => p.type === "oauth" && p.enabled,
	);

	return (
		<View className="flex-1 items-center justify-center bg-white dark:bg-black p-6">
			<View className="w-full max-w-md">
				<Text className="text-3xl font-bold text-center mb-2 text-black dark:text-white">
					Penombre
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
								{loading ? (
									<ActivityIndicator color="#9333ea" />
								) : (
									<Text className="text-black dark:text-white font-semibold text-base">
										Continue with {provider.prettyName}
									</Text>
								)}
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
