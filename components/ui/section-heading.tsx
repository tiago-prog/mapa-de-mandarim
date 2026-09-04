import { Text, View } from "react-native";

export function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <View className="gap-2">
      <Text className="text-xs font-bold uppercase tracking-[1.5px] text-primary">{eyebrow}</Text>
      <Text className="text-3xl font-bold leading-9 text-foreground">{title}</Text>
      {description ? <Text className="text-base leading-6 text-muted">{description}</Text> : null}
    </View>
  );
}
