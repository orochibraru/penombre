import { Link } from "expo-router";
import { Platform, Text } from "react-native";
import { HelloWave } from "@/components/hello-wave";
import { Section } from "@/components/section";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

export default function HomeScreen() {
	return (
		<ThemedView>
			<Section className="items-center justify-center flex-row">
				<Text className="text-5xl font-bold">Welcome!</Text>
				<HelloWave />
			</Section>
			<Section>
				<ThemedText type="subtitle">Step 1: Try it</ThemedText>
				<ThemedText>
					Edit{" "}
					<ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText>{" "}
					to see changes. Press{" "}
					<ThemedText type="defaultSemiBold">
						{Platform.select({
							ios: "cmd + d",
							android: "cmd + m",
							web: "F12",
						})}
					</ThemedText>{" "}
					to open developer tools.
				</ThemedText>
			</Section>
			<Section>
				<Link href="/modal">
					<Link.Trigger>
						<ThemedText type="subtitle">Step 2: Explore</ThemedText>
					</Link.Trigger>
					<Link.Preview />
					<Link.Menu>
						<Link.MenuAction
							title="Action"
							icon="cube"
							onPress={() => alert("Action pressed")}
						/>
						<Link.MenuAction
							title="Share"
							icon="square.and.arrow.up"
							onPress={() => alert("Share pressed")}
						/>
						<Link.Menu title="More" icon="ellipsis">
							<Link.MenuAction
								title="Delete"
								icon="trash"
								destructive
								onPress={() => alert("Delete pressed")}
							/>
						</Link.Menu>
					</Link.Menu>
				</Link>

				<ThemedText>
					{`Tap the Explore tab to learn more about what's included in this starter app.`}
				</ThemedText>
			</Section>
			<Section>
				<ThemedText type="subtitle">Step 3: Get a fresh start</ThemedText>
				<ThemedText>
					{`When you're ready, run `}
					<ThemedText type="defaultSemiBold">npm run reset-project</ThemedText>{" "}
					to get a fresh <ThemedText type="defaultSemiBold">app</ThemedText>{" "}
					directory. This will move the current{" "}
					<ThemedText type="defaultSemiBold">app</ThemedText> to{" "}
					<ThemedText type="defaultSemiBold">app-example</ThemedText>.
				</ThemedText>
			</Section>
		</ThemedView>
	);
}
