import { Stack } from "expo-router";
import { Text } from "react-native";
import useSWR from "swr";
import { FileList } from "@/components/file-list";
import { ThemedView } from "@/components/themed-view";
import { listSharedFiles, type ObjectItem } from "@/lib/api";

export default function SharedScreen() {
	const { data, error, mutate, isLoading } = useSWR(
		"/api/v1/storage/list",
		listSharedFiles,
	);

	const handleItemPress = (_item: ObjectItem) => {
		// TODO: Open file preview
	};

	if (error) {
		return (
			<ThemedView
				style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
			>
				<Stack.Screen options={{ title: "Shared" }} />
				<Text className="text-red-500">Failed to load shared files</Text>
			</ThemedView>
		);
	}

	return (
		<ThemedView style={{ flex: 1 }}>
			<Stack.Screen options={{ title: "Shared" }} />
			<FileList
				items={data?.data?.list ?? []}
				loading={isLoading}
				onRefresh={mutate}
				onItemPress={handleItemPress}
				emptyIcon="person.2"
				emptyTitle="No shared files"
				emptyDescription="Files shared with you will appear here"
			/>
		</ThemedView>
	);
}
