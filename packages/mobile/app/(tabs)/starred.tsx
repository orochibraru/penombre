import { Button } from "@react-navigation/elements";
import { Text, View } from "react-native";
import useSWR from "swr";
import { FileList } from "@/components/file-list";
import { ThemedView } from "@/components/themed-view";
import { listStarredFiles, type ObjectItem } from "@/lib/api";

export default function StarredScreen() {
	const { data, error, mutate, isLoading } = useSWR(
		"/api/v1/storage/file/starred",
		listStarredFiles,
	);

	const handleItemPress = (_item: ObjectItem) => {
		// TODO: Open file preview
	};

	if (error) {
		return (
			<ThemedView
				style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
			>
				<Text className="text-red-500">Failed to load starred files</Text>
				<Button onPress={() => mutate()}>Retry</Button>
			</ThemedView>
		);
	}

	return (
		<ThemedView style={{ flex: 1 }}>
			<View className="px-4 pt-4 pb-2">
				<Text className="text-2xl font-bold text-gray-900 dark:text-gray-100">
					Starred
				</Text>
			</View>
			<FileList
				items={data?.data?.list ?? []}
				loading={isLoading}
				onRefresh={mutate}
				onItemPress={handleItemPress}
				emptyIcon="star.fill"
				emptyTitle="No starred files"
				emptyDescription="Star files to quickly access them here"
			/>
		</ThemedView>
	);
}
