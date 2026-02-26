import { Pressable, Text, View } from "react-native";
import { IconSymbol, type IconSymbolName } from "@/components/ui/icon-symbol";
import type { ObjectItem } from "@/lib/api";
import { fileIcon, readableFileSize, relativeTime } from "@/lib/utils";

type FileItemProps = {
	item: ObjectItem;
	onPress?: (item: ObjectItem) => void;
	onLongPress?: (item: ObjectItem) => void;
};

export function FileItemRow({ item, onPress, onLongPress }: FileItemProps) {
	const name = item.metadata.name ?? item.key.split("/").pop() ?? item.key;
	const icon = fileIcon(item.type, item.metadata.contentType) as IconSymbolName;
	const isFolder = item.type === "folder";

	return (
		<Pressable
			onPress={() => onPress?.(item)}
			onLongPress={() => onLongPress?.(item)}
			className="flex-row items-center gap-3 px-4 py-3 active:bg-gray-100 dark:active:bg-gray-800"
		>
			<View
				className={`w-10 h-10 rounded-lg items-center justify-center ${
					isFolder
						? "bg-blue-100 dark:bg-blue-900/30"
						: "bg-gray-100 dark:bg-gray-800"
				}`}
			>
				<IconSymbol
					size={22}
					name={icon}
					color={isFolder ? "#3B82F6" : "#6B7280"}
				/>
			</View>
			<View className="flex-1 gap-0.5">
				<Text
					className="text-base font-medium text-gray-900 dark:text-gray-100"
					numberOfLines={1}
				>
					{name}
				</Text>
				<View className="flex-row items-center gap-2">
					{!isFolder && item.size != null && (
						<Text className="text-xs text-gray-500 dark:text-gray-400">
							{readableFileSize(item.size)}
						</Text>
					)}
					{item.updatedAt && (
						<Text className="text-xs text-gray-400 dark:text-gray-500">
							{relativeTime(item.updatedAt)}
						</Text>
					)}
				</View>
			</View>
			{item.metadata.isStarred && (
				<IconSymbol size={16} name="star.fill" color="#EAB308" />
			)}
			<IconSymbol size={18} name="chevron.right" color="#9CA3AF" />
		</Pressable>
	);
}

export function FileItemGrid({ item, onPress, onLongPress }: FileItemProps) {
	const name = item.metadata.name ?? item.key.split("/").pop() ?? item.key;
	const icon = fileIcon(item.type, item.metadata.contentType) as IconSymbolName;
	const isFolder = item.type === "folder";

	return (
		<Pressable
			onPress={() => onPress?.(item)}
			onLongPress={() => onLongPress?.(item)}
			className="w-[48%] rounded-xl border border-gray-200 dark:border-gray-700 p-3 gap-2 active:bg-gray-100 dark:active:bg-gray-800"
		>
			<View
				className={`w-12 h-12 rounded-lg items-center justify-center self-center ${
					isFolder
						? "bg-blue-100 dark:bg-blue-900/30"
						: "bg-gray-100 dark:bg-gray-800"
				}`}
			>
				<IconSymbol
					size={28}
					name={icon}
					color={isFolder ? "#3B82F6" : "#6B7280"}
				/>
			</View>
			<Text
				className="text-sm font-medium text-gray-900 dark:text-gray-100 text-center"
				numberOfLines={2}
			>
				{name}
			</Text>
			{!isFolder && item.size != null && (
				<Text className="text-xs text-gray-400 dark:text-gray-500 text-center">
					{readableFileSize(item.size)}
				</Text>
			)}
		</Pressable>
	);
}
