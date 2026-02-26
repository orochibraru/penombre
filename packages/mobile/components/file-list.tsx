import { useCallback, useState } from "react";
import {
	ActivityIndicator,
	FlatList,
	RefreshControl,
	View,
} from "react-native";
import { EmptyState } from "@/components/empty-state";
import { FileItemRow } from "@/components/file-item";
import type { IconSymbolName } from "@/components/ui/icon-symbol";
import type { ObjectItem } from "@/lib/api";

type FileListProps = {
	items: ObjectItem[];
	loading?: boolean;
	onRefresh?: () => void;
	onItemPress?: (item: ObjectItem) => void;
	onItemLongPress?: (item: ObjectItem) => void;
	emptyIcon?: IconSymbolName;
	emptyTitle?: string;
	emptyDescription?: string;
	ListHeaderComponent?: React.ReactElement;
};

export function FileList({
	items,
	loading = false,
	onRefresh,
	onItemPress,
	onItemLongPress,
	emptyIcon = "folder",
	emptyTitle = "No files",
	emptyDescription,
	ListHeaderComponent,
}: FileListProps) {
	const [refreshing, setRefreshing] = useState(false);

	const handleRefresh = useCallback(async () => {
		if (!onRefresh) return;
		setRefreshing(true);
		onRefresh();
		// Allow visual feedback
		setTimeout(() => setRefreshing(false), 500);
	}, [onRefresh]);

	if (loading && items.length === 0) {
		return (
			<View className="flex-1 items-center justify-center py-20">
				<ActivityIndicator size="large" />
			</View>
		);
	}

	// Sort: folders first, then by name
	const sorted = [...items].sort((a, b) => {
		if (a.type === "folder" && b.type !== "folder") return -1;
		if (a.type !== "folder" && b.type === "folder") return 1;
		const nameA = a.metadata.name ?? a.key;
		const nameB = b.metadata.name ?? b.key;
		return nameA.localeCompare(nameB);
	});

	return (
		<FlatList
			data={sorted}
			keyExtractor={(item) => item.metadata.id}
			renderItem={({ item }) => (
				<FileItemRow
					item={item}
					onPress={onItemPress}
					onLongPress={onItemLongPress}
				/>
			)}
			ItemSeparatorComponent={() => (
				<View className="h-px bg-gray-100 dark:bg-gray-800 ml-16" />
			)}
			ListHeaderComponent={ListHeaderComponent}
			ListEmptyComponent={
				<EmptyState
					icon={emptyIcon}
					title={emptyTitle}
					description={emptyDescription}
				/>
			}
			refreshControl={
				onRefresh ? (
					<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
				) : undefined
			}
			contentContainerStyle={{ flexGrow: 1 }}
		/>
	);
}
