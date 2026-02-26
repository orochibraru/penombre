import { Text, View } from "react-native";
import { IconSymbol, type IconSymbolName } from "@/components/ui/icon-symbol";

type EmptyStateProps = {
	icon?: IconSymbolName;
	title: string;
	description?: string;
};

export function EmptyState({
	icon = "folder",
	title,
	description,
}: EmptyStateProps) {
	return (
		<View className="flex-1 items-center justify-center py-20 gap-3">
			<IconSymbol size={48} name={icon} color="#9CA3AF" />
			<Text className="text-lg font-semibold text-gray-500 dark:text-gray-400">
				{title}
			</Text>
			{description && (
				<Text className="text-sm text-gray-400 dark:text-gray-500 text-center px-8">
					{description}
				</Text>
			)}
		</View>
	);
}
