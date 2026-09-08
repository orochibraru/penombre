import { Text, View } from "react-native";
import { IconSymbol, type IconSymbolName } from "@/components/ui/icon-symbol";

interface EmptyStateProps {
	icon?: IconSymbolName;
	title: string;
	description?: string;
}

export function EmptyState({
	icon = "folder",
	title,
	description,
}: EmptyStateProps) {
	return (
		<View className="flex-1 items-center justify-center gap-3 py-20">
			<IconSymbol size={48} name={icon} color="#9CA3AF" />
			<Text className="font-semibold text-gray-500 text-lg dark:text-gray-400">
				{title}
			</Text>
			{description && (
				<Text className="px-8 text-center text-gray-400 text-sm dark:text-gray-500">
					{description}
				</Text>
			)}
		</View>
	);
}
