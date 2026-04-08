import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol, type IconSymbolName } from "@/components/ui/icon-symbol";
import type { FileCategory } from "@/lib/api";

type CategoryItem = {
	id: FileCategory;
	title: string;
	icon: IconSymbolName;
	color: string;
	bgClass: string;
};

const CATEGORIES: CategoryItem[] = [
	{
		id: "MUSIC",
		title: "Music",
		icon: "music.note",
		color: "#EC4899",
		bgClass: "bg-pink-100 dark:bg-pink-900/30",
	},
	{
		id: "DOCUMENTS",
		title: "Documents",
		icon: "doc.text",
		color: "#6366F1",
		bgClass: "bg-indigo-100 dark:bg-indigo-900/30",
	},
	{
		id: "IMAGES",
		title: "Images",
		icon: "photo",
		color: "#F97316",
		bgClass: "bg-orange-100 dark:bg-orange-900/30",
	},
	{
		id: "CODE",
		title: "Code",
		icon: "chevron.left.forwardslash.chevron.right",
		color: "#22C55E",
		bgClass: "bg-green-100 dark:bg-green-900/30",
	},
	{
		id: "VIDEO",
		title: "Video",
		icon: "film",
		color: "#A855F7",
		bgClass: "bg-purple-100 dark:bg-purple-900/30",
	},
	{
		id: "ARCHIVES",
		title: "Archives",
		icon: "archivebox",
		color: "#14B8A6",
		bgClass: "bg-teal-100 dark:bg-teal-900/30",
	},
	{
		id: "3D",
		title: "3D Objects",
		icon: "cube",
		color: "#F43F5E",
		bgClass: "bg-rose-100 dark:bg-rose-900/30",
	},
];

function CategoryCard({ item }: { item: CategoryItem }) {
	return (
		<Pressable
			onPress={() => router.push(`/category/${item.id}`)}
			className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 gap-3 active:bg-gray-100 dark:active:bg-gray-800"
			style={{ width: "47%" }}
		>
			<View
				className={`w-12 h-12 rounded-xl items-center justify-center ${item.bgClass}`}
			>
				<IconSymbol size={24} name={item.icon} color={item.color} />
			</View>
			<Text className="text-base font-semibold text-gray-900 dark:text-gray-100">
				{item.title}
			</Text>
		</Pressable>
	);
}

export default function BrowseScreen() {
	return (
		<ThemedView style={{ flex: 1 }}>
			<ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
				<View className="px-4 pt-4 pb-2">
					<Text className="text-2xl font-bold text-gray-900 dark:text-gray-100">
						Browse
					</Text>
				</View>
				<View className="px-4 pt-2 flex-row flex-wrap gap-3">
					{CATEGORIES.map((cat) => (
						<CategoryCard key={cat.id} item={cat} />
					))}
				</View>
			</ScrollView>
		</ThemedView>
	);
}
