import { View, type ViewProps } from "react-native";

export type ThemedViewProps = ViewProps & {
	lightColor?: string;
	darkColor?: string;
};

export function Section({ className, ...otherProps }: ThemedViewProps) {
	return (
		<View
			className={`flex flex-col items-start gap-2 p-3 ${className}`}
			{...otherProps}
		/>
	);
}
