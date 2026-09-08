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

const SCREEN = "flex-1 items-center justify-center bg-white p-6 dark:bg-black";
const INPUT =
	"w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-black dark:border-gray-700 dark:bg-gray-900 dark:text-white";
const LABEL = "mb-2 font-medium text-gray-700 text-sm dark:text-gray-300";
const MUTED = "text-center text-gray-500 dark:text-gray-400";

function LoadingScreen() {
	return (
		<View className="flex-1 items-center justify-center bg-white dark:bg-black">
			<ActivityIndicator size="large" color="#9333ea" />
		</View>
	);
}

function ProvidersErrorScreen({ onRetry }: { onRetry: () => void }) {
	return (
		<View className={SCREEN}>
			<Text className="mb-4 text-center text-red-500">
				Failed to load auth providers
			</Text>
			<Pressable
				className="rounded-lg bg-purple-600 px-6 py-3"
				onPress={onRetry}
			>
				<Text className="font-semibold text-white">Reload</Text>
			</Pressable>
		</View>
	);
}

function NoProvidersScreen() {
	return (
		<View className={SCREEN}>
			<Text className={`mb-4 ${MUTED}`}>
				No authentication providers are configured.
			</Text>
			<Text className={MUTED}>Please contact the administrator.</Text>
		</View>
	);
}

function OAuthButtons({
	providers,
	loading,
	onSelect,
}: {
	providers: AuthProvider[];
	loading: boolean;
	onSelect: (provider: AuthProvider) => void;
}) {
	return (
		<View className="mb-6">
			{providers.map((provider) => (
				<Pressable
					key={provider.name}
					className="mb-3 w-full items-center rounded-lg border border-gray-300 bg-white py-3 active:opacity-80 dark:border-gray-700 dark:bg-gray-900"
					onPress={() => onSelect(provider)}
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
	);
}

function Separator() {
	return (
		<View className="mb-6 flex-row items-center">
			<View className="h-px flex-1 bg-gray-300 dark:bg-gray-700" />
			<Text className="mx-4 text-gray-500 text-sm dark:text-gray-400">or</Text>
			<View className="h-px flex-1 bg-gray-300 dark:bg-gray-700" />
		</View>
	);
}

function EmailSignInForm({
	email,
	password,
	loading,
	onEmailChange,
	onPasswordChange,
	onSubmit,
}: {
	email: string;
	password: string;
	loading: boolean;
	onEmailChange: (value: string) => void;
	onPasswordChange: (value: string) => void;
	onSubmit: () => void;
}) {
	return (
		<View className="space-y-4">
			<View>
				<Text className={LABEL}>Email</Text>
				<TextInput
					className={INPUT}
					placeholder="your@email.com"
					placeholderTextColor="#999"
					value={email}
					onChangeText={onEmailChange}
					autoCapitalize="none"
					keyboardType="email-address"
					editable={!loading}
				/>
			</View>

			<View>
				<Text className={LABEL}>Password</Text>
				<TextInput
					className={INPUT}
					placeholder="••••••••"
					placeholderTextColor="#999"
					value={password}
					onChangeText={onPasswordChange}
					secureTextEntry
					editable={!loading}
				/>
			</View>

			<Pressable
				className="mt-6 w-full items-center rounded-lg bg-purple-600 py-3 active:opacity-80"
				onPress={onSubmit}
				disabled={loading}
			>
				{loading ? (
					<ActivityIndicator color="white" />
				) : (
					<Text className="font-semibold text-base text-white">Sign In</Text>
				)}
			</Pressable>
		</View>
	);
}

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
		const { error } = await authClient.signIn.email({ email, password });
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
		return <LoadingScreen />;
	}

	if (providersError) {
		console.log("Error fetching auth providers:", providersError);
		return <ProvidersErrorScreen onRetry={() => mutate()} />;
	}

	if (!providers?.data || providers.data.length === 0) {
		return <NoProvidersScreen />;
	}

	const emailProvider = providers.data.find(
		(p) => p.type === "email" && p.enabled,
	);
	const oauthProviders = providers.data.filter(
		(p) => p.type === "oauth" && p.enabled,
	);

	return (
		<View className={SCREEN}>
			<View className="w-full max-w-md">
				<Text className="mb-2 text-center font-bold text-3xl text-black dark:text-white">
					Penombre
				</Text>
				<Text className="mb-8 text-center text-gray-600 dark:text-gray-400">
					Sign in to continue
				</Text>

				{oauthProviders.length > 0 && (
					<OAuthButtons
						providers={oauthProviders}
						loading={loading}
						onSelect={handleOAuthSignIn}
					/>
				)}

				{emailProvider && oauthProviders.length > 0 && <Separator />}

				{emailProvider && (
					<EmailSignInForm
						email={email}
						password={password}
						loading={loading}
						onEmailChange={setEmail}
						onPasswordChange={setPassword}
						onSubmit={handleSignIn}
					/>
				)}

				{!emailProvider && oauthProviders.length === 0 && (
					<Text className={MUTED}>
						No sign-in methods are currently available.
					</Text>
				)}
			</View>
		</View>
	);
}
