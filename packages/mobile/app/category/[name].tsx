import { Stack, useLocalSearchParams } from "expo-router";
import { Text } from "react-native";
import useSWR from "swr";
import { FileList } from "@/components/file-list";
import { ThemedView } from "@/components/themed-view";
import {
	type FileCategory,
	listFilesByCategory,
	type ObjectItem,
} from "@/lib/api";

const CATEGORY_TITLES: Record<string, string> = {
	MUSIC: "Music",
	DOCUMENTS: "Documents",
	IMAGES: "Images",
	CODE: "Code",
	VIDEO: "Video",
	ARCHIVES: "Archives",
	"3D": "3D Objects",
};

export default function CategoryScreen() {
	const { name } = useLocalSearchParams<{ name: string }>();
	const category = (name ?? "UNKNOWN") as FileCategory;
	const title = CATEGORY_TITLES[category] ?? category;

	const { data, error, mutate, isLoading } = useSWR(
		`/api/v1/storage/file/category/${category}`,
		() => listFilesByCategory(category),
	);

	const handleItemPress = (_item: ObjectItem) => {
		// TODO: Open file preview
	};

	if (error) {
		return (
			<ThemedView
				style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
			>
				<Stack.Screen options={{ title }} />
				<Text className="text-red-500">Failed to load files</Text>
			</ThemedView>
		);
	}

	return (
		<ThemedView style={{ flex: 1 }}>
			<Stack.Screen options={{ title }} />
			<FileList
				items={data?.data?.list ?? []}
				loading={isLoading}
				onRefresh={mutate}
				onItemPress={handleItemPress}
				emptyIcon="folder"
				emptyTitle={`No ${title.toLowerCase()} files`}
				emptyDescription={`Your ${title.toLowerCase()} files will appear here`}
			/>
		</ThemedView>
	);
}
