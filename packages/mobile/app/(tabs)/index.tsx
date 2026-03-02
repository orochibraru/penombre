import { Button } from "@react-navigation/elements";
import { useCallback } from "react";
import { Text, View } from "react-native";
import { FileList } from "@/components/file-list";
import { ThemedView } from "@/components/themed-view";
import { useApiQuery } from "@/hooks/use-api-query";
import { listFiles, type ObjectItem } from "@/lib/api";

export default function HomeScreen() {
	const fetchFiles = useCallback(() => listFiles(), []);
	const { data, loading, refetch, error } = useApiQuery(fetchFiles);

	const handleItemPress = (item: ObjectItem) => {
		if (item.type === "folder") {
			// TODO: Navigate into folder
		} else {
			// TODO: Open file preview
		}
	};

	const handleRefresh = () => {
		refetch();
	};

	if (error) {
		return (
			<ThemedView
				style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
			>
				<Text className="text-red-500">Failed to load files</Text>
				<Text className="text-gray-500">{error}</Text>
				<Button onPress={handleRefresh}>Retry</Button>
			</ThemedView>
		);
	}

	return (
		<ThemedView style={{ flex: 1 }}>
			<View className="px-4 pt-4 pb-2">
				<Text className="text-2xl font-bold text-gray-900 dark:text-gray-100">
					My Drive
				</Text>
			</View>
			<FileList
				items={data?.list ?? []}
				loading={loading}
				onRefresh={refetch}
				onItemPress={handleItemPress}
				emptyIcon="folder"
				emptyTitle="No files yet"
				emptyDescription="Upload files from the web app to see them here"
			/>
		</ThemedView>
	);
}
