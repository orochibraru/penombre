import { Text } from "react-native";
import { Section } from "@/components/section";
import { ThemedView } from "@/components/themed-view";

export default function RecentScreen() {
	return (
		<ThemedView>
			<Section className="items-center justify-center flex-row">
				<Text className="text-5xl font-bold">Profile</Text>
			</Section>
		</ThemedView>
	);
}
