import { Pressable, Text, View } from "react-native";
import { IconSymbol, type IconSymbolName } from "@/components/ui/icon-symbol";
import type { ObjectItem } from "@/lib/api";
import { fileIcon, readableFileSize, relativeTime } from "@/lib/utils";

interface FileItemProps {
	item: ObjectItem;
	onPress?: (item: ObjectItem) => void;
	onLongPress?: (item: ObjectItem) => void;
}

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
				className={`h-10 w-10 items-center justify-center rounded-lg ${
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
					className="font-medium text-base text-gray-900 dark:text-gray-100"
					numberOfLines={1}
				>
					{name}
				</Text>
				<View className="flex-row items-center gap-2">
					{!isFolder && item.size != null && (
						<Text className="text-gray-500 text-xs dark:text-gray-400">
							{readableFileSize(item.size)}
						</Text>
					)}
					{item.updatedAt && (
						<Text className="text-gray-400 text-xs dark:text-gray-500">
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
			className="w-[48%] gap-2 rounded-xl border border-gray-200 p-3 active:bg-gray-100 dark:border-gray-700 dark:active:bg-gray-800"
		>
			<View
				className={`h-12 w-12 items-center justify-center self-center rounded-lg ${
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
				className="text-center font-medium text-gray-900 text-sm dark:text-gray-100"
				numberOfLines={2}
			>
				{name}
			</Text>
			{!isFolder && item.size != null && (
				<Text className="text-center text-gray-400 text-xs dark:text-gray-500">
					{readableFileSize(item.size)}
				</Text>
			)}
		</Pressable>
	);
}
