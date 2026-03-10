import { Button } from "@react-navigation/elements";
import { Text, View } from "react-native";
import useSWR from "swr";
import { FileList } from "@/components/file-list";
import { ThemedView } from "@/components/themed-view";
import { listFiles, type ObjectItem } from "@/lib/api";

export default function HomeScreen() {
	const { data, error, mutate, isLoading } = useSWR(
		"/api/v1/storage/list",
		listFiles,
	);

	const handleItemPress = (item: ObjectItem) => {
		if (item.type === "folder") {
			// TODO: Navigate into folder
		} else {
			// TODO: Open file preview
		}
	};

	if (error) {
		return (
			<ThemedView
				style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
			>
				<Text className="text-red-500">Failed to load files</Text>
				<Text className="text-gray-500">{error}</Text>
				<Button onPress={() => mutate()}>Retry</Button>
			</ThemedView>
		);
	}

	console.log("Files data:", data);

	return (
		<ThemedView style={{ flex: 1 }}>
			<View className="px-4 pt-4 pb-2">
				<Text className="text-2xl font-bold text-gray-900 dark:text-gray-100">
					My Drive
				</Text>
			</View>
			<FileList
				items={data?.data?.list ?? []}
				loading={isLoading}
				onRefresh={mutate}
				onItemPress={handleItemPress}
				emptyIcon="folder"
				emptyTitle="No files yet"
				emptyDescription="Upload files from the web app to see them here"
			/>
		</ThemedView>
	);
}
