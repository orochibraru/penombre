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
		if (!(email && password)) {
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
			<View className="flex-1 items-center justify-center bg-white p-6 dark:bg-black">
				<Text className="mb-4 text-center text-red-500">
					Failed to load auth providers
				</Text>
				<Pressable
					className="rounded-lg bg-purple-600 px-6 py-3"
					onPress={() => mutate()}
				>
					<Text className="font-semibold text-white">Reload</Text>
				</Pressable>
			</View>
		);
	}

	if (!providers?.data || providers.data.length === 0) {
		return (
			<View className="flex-1 items-center justify-center bg-white p-6 dark:bg-black">
				<Text className="mb-4 text-center text-gray-500 dark:text-gray-400">
					No authentication providers are configured.
				</Text>
				<Text className="text-center text-gray-500 dark:text-gray-400">
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
		<View className="flex-1 items-center justify-center bg-white p-6 dark:bg-black">
			<View className="w-full max-w-md">
				<Text className="mb-2 text-center font-bold text-3xl text-black dark:text-white">
					Penombre
				</Text>
				<Text className="mb-8 text-center text-gray-600 dark:text-gray-400">
					Sign in to continue
				</Text>

				{oauthProviders.length > 0 && (
					<View className="mb-6">
						{oauthProviders.map((provider) => (
							<Pressable
								key={provider.name}
								className="mb-3 w-full items-center rounded-lg border border-gray-300 bg-white py-3 active:opacity-80 dark:border-gray-700 dark:bg-gray-900"
								onPress={() => handleOAuthSignIn(provider)}
								disabled={loading}
							>
								{loading ? (
									<ActivityIndicator color="#9333ea" />
								) : (
									<Text className="font-semibold text-base text-black dark:text-white">
										Continue with {provider.prettyName}
									</Text>
								)}
							</Pressable>
						))}
					</View>
				)}

				{emailProvider && oauthProviders.length > 0 && (
					<View className="mb-6 flex-row items-center">
						<View className="h-px flex-1 bg-gray-300 dark:bg-gray-700" />
						<Text className="mx-4 text-gray-500 text-sm dark:text-gray-400">
							or
						</Text>
						<View className="h-px flex-1 bg-gray-300 dark:bg-gray-700" />
					</View>
				)}

				{emailProvider && (
					<View className="space-y-4">
						<View>
							<Text className="mb-2 font-medium text-gray-700 text-sm dark:text-gray-300">
								Email
							</Text>
							<TextInput
								className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-black dark:border-gray-700 dark:bg-gray-900 dark:text-white"
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
							<Text className="mb-2 font-medium text-gray-700 text-sm dark:text-gray-300">
								Password
							</Text>
							<TextInput
								className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-black dark:border-gray-700 dark:bg-gray-900 dark:text-white"
								placeholder="••••••••"
								placeholderTextColor="#999"
								value={password}
								onChangeText={setPassword}
								secureTextEntry
								editable={!loading}
							/>
						</View>

						<Pressable
							className="mt-6 w-full items-center rounded-lg bg-purple-600 py-3 active:opacity-80"
							onPress={handleSignIn}
							disabled={loading}
						>
							{loading ? (
								<ActivityIndicator color="white" />
							) : (
								<Text className="font-semibold text-base text-white">
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
