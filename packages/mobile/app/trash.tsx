import { Stack } from "expo-router";
import { Alert, Text } from "react-native";
import useSWR from "swr";
import { FileList } from "@/components/file-list";
import { ThemedView } from "@/components/themed-view";
import {
	deleteFile,
	listTrashedFiles,
	type ObjectItem,
	restoreFile,
} from "@/lib/api";

export default function TrashScreen() {
	const { data, error, mutate, isLoading } = useSWR(
		"/api/v1/storage/file/trash",
		listTrashedFiles,
	);

	const handleItemLongPress = (item: ObjectItem) => {
		const name = item.metadata.name ?? item.key.split("/").pop() ?? item.key;
		Alert.alert(name, "Choose an action", [
			{
				text: "Restore",
				onPress: async () => {
					await restoreFile(item.metadata.id);
					mutate();
				},
			},
			{
				text: "Delete permanently",
				style: "destructive",
				onPress: () => {
					Alert.alert("Delete permanently?", "This action cannot be undone.", [
						{ text: "Cancel", style: "cancel" },
						{
							text: "Delete",
							style: "destructive",
							onPress: async () => {
								await deleteFile(item.metadata.id);
								mutate();
							},
						},
					]);
				},
			},
			{ text: "Cancel", style: "cancel" },
		]);
	};

	if (error) {
		return (
			<ThemedView
				style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
			>
				<Stack.Screen options={{ title: "Trash" }} />
				<Text className="text-red-500">Failed to load trash</Text>
			</ThemedView>
		);
	}

	return (
		<ThemedView style={{ flex: 1 }}>
			<Stack.Screen options={{ title: "Trash" }} />
			<FileList
				items={data?.data?.list ?? []}
				loading={isLoading}
				onRefresh={mutate}
				onItemLongPress={handleItemLongPress}
				emptyIcon="trash"
				emptyTitle="Trash is empty"
				emptyDescription="Long-press any file in trash to restore or permanently delete it"
			/>
		</ThemedView>
	);
}
