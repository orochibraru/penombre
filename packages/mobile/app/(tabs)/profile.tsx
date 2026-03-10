import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol, type IconSymbolName } from "@/components/ui/icon-symbol";
import { authClient } from "@/lib/auth-client";

type MenuItemProps = {
	icon: IconSymbolName;
	iconColor?: string;
	title: string;
	subtitle?: string;
	onPress?: () => void;
	destructive?: boolean;
};

function MenuItem({
	icon,
	iconColor = "#6B7280",
	title,
	subtitle,
	onPress,
	destructive,
}: MenuItemProps) {
	return (
		<Pressable
			onPress={onPress}
			className="flex-row items-center gap-3 px-4 py-3.5 active:bg-gray-100 dark:active:bg-gray-800"
		>
			<View className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 items-center justify-center">
				<IconSymbol size={18} name={icon} color={iconColor} />
			</View>
			<View className="flex-1">
				<Text
					className={`text-base font-medium ${
						destructive ? "text-red-500" : "text-gray-900 dark:text-gray-100"
					}`}
				>
					{title}
				</Text>
				{subtitle && (
					<Text className="text-xs text-gray-400 dark:text-gray-500">
						{subtitle}
					</Text>
				)}
			</View>
			<IconSymbol size={16} name="chevron.right" color="#9CA3AF" />
		</Pressable>
	);
}

function SectionHeader({ title }: { title: string }) {
	return (
		<Text className="text-xs font-semibold uppercase text-gray-400 dark:text-gray-500 px-4 pt-5 pb-1">
			{title}
		</Text>
	);
}

function Divider() {
	return <View className="h-px bg-gray-100 dark:bg-gray-800 ml-16" />;
}

export default function ProfileScreen() {
	const { data: session } = authClient.useSession();
	if (!session || !session.user) {
		return (
			<View className="flex-1 items-center justify-center bg-white dark:bg-black">
				<Text className="text-gray-500 dark:text-gray-400">
					Please sign in to view your profile.
				</Text>
			</View>
		);
	}
	return (
		<ThemedView style={{ flex: 1 }}>
			<ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
				<View className="px-4 pt-4 pb-2">
					<Text className="text-2xl font-bold text-gray-900 dark:text-gray-100">
						Account
					</Text>
				</View>

				{/* User profile card */}
				<View className="mx-4 mt-3 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex-row items-center gap-3">
					<View className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/30 items-center justify-center">
						<IconSymbol size={28} name="person.fill" color="#3B82F6" />
					</View>
					<View className="flex-1">
						<Text className="text-lg font-semibold text-gray-900 dark:text-gray-100">
							{session.user.name}
						</Text>
						<Text className="text-sm text-gray-500 dark:text-gray-400">
							{session.user.email}
						</Text>
					</View>
				</View>

				<SectionHeader title="Account" />
				<View className="mx-4 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
					<MenuItem
						icon="person"
						iconColor="#3B82F6"
						title="Personal Information"
						subtitle="Name, email, profile photo"
					/>
					<Divider />
					<MenuItem
						icon="clock"
						iconColor="#8B5CF6"
						title="Activity"
						subtitle="Recent account activity"
					/>
					<Divider />
					<MenuItem
						icon="lock"
						iconColor="#F59E0B"
						title="Security"
						subtitle="Password, two-factor auth"
					/>
					<Divider />
					<MenuItem
						icon="iphone"
						iconColor="#10B981"
						title="Sessions"
						subtitle="Active sign-in sessions"
					/>
				</View>

				<SectionHeader title="Storage" />
				<View className="mx-4 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
					<MenuItem
						icon="star.fill"
						iconColor="#EAB308"
						title="Starred"
						subtitle="Your starred files"
					/>
					<Divider />
					<MenuItem
						icon="trash"
						iconColor="#EF4444"
						title="Trash"
						subtitle="Deleted files"
					/>
					<Divider />
					<MenuItem
						icon="person.2"
						iconColor="#6366F1"
						title="Shared"
						subtitle="Files shared with you"
					/>
				</View>

				<View className="mx-4 mt-8">
					<Pressable
						className="rounded-xl border border-red-200 dark:border-red-900/50 p-4 items-center active:bg-red-50 dark:active:bg-red-900/20"
						onPress={async () => {
							await authClient.signOut({
								fetchOptions: {
									onSuccess: () => {
										router.push("/");
									},
								},
							});
						}}
					>
						<Text className="text-base font-medium text-red-500">Sign Out</Text>
					</Pressable>
				</View>
			</ScrollView>
		</ThemedView>
	);
}
