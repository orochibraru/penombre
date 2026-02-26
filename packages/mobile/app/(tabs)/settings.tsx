import { useState } from "react";
import { Pressable, ScrollView, Switch, Text, View } from "react-native";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol, type IconSymbolName } from "@/components/ui/icon-symbol";

type SettingsRowProps = {
	icon: IconSymbolName;
	iconColor?: string;
	title: string;
	subtitle?: string;
	onPress?: () => void;
	trailing?: React.ReactNode;
};

function SettingsRow({
	icon,
	iconColor = "#6B7280",
	title,
	subtitle,
	onPress,
	trailing,
}: SettingsRowProps) {
	return (
		<Pressable
			onPress={onPress}
			className="flex-row items-center gap-3 px-4 py-3.5 active:bg-gray-100 dark:active:bg-gray-800"
		>
			<View className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 items-center justify-center">
				<IconSymbol size={18} name={icon} color={iconColor} />
			</View>
			<View className="flex-1">
				<Text className="text-base font-medium text-gray-900 dark:text-gray-100">
					{title}
				</Text>
				{subtitle && (
					<Text className="text-xs text-gray-400 dark:text-gray-500">
						{subtitle}
					</Text>
				)}
			</View>
			{trailing ?? (
				<IconSymbol size={16} name="chevron.right" color="#9CA3AF" />
			)}
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

type ThemeOption = "system" | "light" | "dark";

export default function SettingsScreen() {
	const [selectedTheme, setSelectedTheme] = useState<ThemeOption>("system");

	const themes: { id: ThemeOption; label: string; icon: IconSymbolName }[] = [
		{ id: "system", label: "System", icon: "desktopcomputer" },
		{ id: "light", label: "Light", icon: "sun.max" },
		{ id: "dark", label: "Dark", icon: "moon" },
	];

	return (
		<ThemedView style={{ flex: 1 }}>
			<ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
				<View className="px-4 pt-4 pb-2">
					<Text className="text-2xl font-bold text-gray-900 dark:text-gray-100">
						Settings
					</Text>
				</View>

				<SectionHeader title="General" />
				<View className="mx-4 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
					<SettingsRow
						icon="globe"
						iconColor="#3B82F6"
						title="Language"
						subtitle="English"
					/>
					<Divider />
					<SettingsRow
						icon="bell"
						iconColor="#F59E0B"
						title="Notifications"
						trailing={<Switch value={true} />}
					/>
				</View>

				<SectionHeader title="Theme" />
				<View className="mx-4 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
					{themes.map((theme, i) => (
						<View key={theme.id}>
							{i > 0 && <Divider />}
							<Pressable
								onPress={() => setSelectedTheme(theme.id)}
								className="flex-row items-center gap-3 px-4 py-3.5 active:bg-gray-100 dark:active:bg-gray-800"
							>
								<View className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 items-center justify-center">
									<IconSymbol
										size={18}
										name={theme.icon}
										color={selectedTheme === theme.id ? "#3B82F6" : "#6B7280"}
									/>
								</View>
								<Text
									className={`flex-1 text-base font-medium ${
										selectedTheme === theme.id
											? "text-blue-500"
											: "text-gray-900 dark:text-gray-100"
									}`}
								>
									{theme.label}
								</Text>
								{selectedTheme === theme.id && (
									<IconSymbol
										size={20}
										name="checkmark.circle.fill"
										color="#3B82F6"
									/>
								)}
							</Pressable>
						</View>
					))}
				</View>

				<SectionHeader title="Storage" />
				<View className="mx-4 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
					<SettingsRow
						icon="externaldrive"
						iconColor="#10B981"
						title="Storage"
						subtitle="Manage your storage usage"
					/>
					<Divider />
					<SettingsRow
						icon="arrow.triangle.2.circlepath"
						iconColor="#8B5CF6"
						title="Sync"
						subtitle="Sync settings and status"
					/>
				</View>

				<SectionHeader title="Help" />
				<View className="mx-4 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
					<SettingsRow
						icon="doc.text"
						iconColor="#6366F1"
						title="API Documentation"
						subtitle="/api/v1/docs"
					/>
					<Divider />
					<SettingsRow
						icon="info.circle"
						iconColor="#6B7280"
						title="About"
						subtitle="OpenDrive v1.0.0"
					/>
				</View>
			</ScrollView>
		</ThemedView>
	);
}
