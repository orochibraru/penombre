import { useCallback } from "react";
import { Text, View } from "react-native";
import { FileList } from "@/components/file-list";
import { ThemedView } from "@/components/themed-view";
import { useApiQuery } from "@/hooks/use-api-query";
import { listRecentFiles, type ObjectItem } from "@/lib/api";

export default function RecentScreen() {
	const fetchRecent = useCallback(() => listRecentFiles(), []);
	const { data, loading, refetch } = useApiQuery(fetchRecent);

	const handleItemPress = (item: ObjectItem) => {
		if (item.type === "folder") {
			// TODO: Navigate into folder
		} else {
			// TODO: Open file preview
		}
	};

	return (
		<ThemedView style={{ flex: 1 }}>
			<View className="px-4 pt-4 pb-2">
				<Text className="text-2xl font-bold text-gray-900 dark:text-gray-100">
					Recent
				</Text>
			</View>
			<FileList
				items={data?.list ?? []}
				loading={loading}
				onRefresh={refetch}
				onItemPress={handleItemPress}
				emptyIcon="clock.fill"
				emptyTitle="No recent files"
				emptyDescription="Files you've recently accessed will appear here"
			/>
		</ThemedView>
	);
}
