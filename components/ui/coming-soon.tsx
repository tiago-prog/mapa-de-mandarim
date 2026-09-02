import { Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";

export interface ComingSoonProps {
  eyebrow: string;
  title: string;
  description: string;
  glyph: string;
}

export function ComingSoon({ eyebrow, title, description, glyph }: ComingSoonProps) {
  return (
    <ScreenContainer className="px-5 pt-3" edges={["top", "left", "right"]}>
      <View className="flex-1 items-center justify-center">
        <View className="mb-5 h-20 w-20 items-center justify-center rounded-[28px] bg-primary/10">
          <Text className="text-4xl text-primary">{glyph}</Text>
        </View>
        <Text className="text-xs font-semibold uppercase tracking-widest text-primary">{eyebrow}</Text>
        <Text className="mt-3 text-center text-3xl font-bold text-foreground">{title}</Text>
        <Text className="mt-3 max-w-sm text-center text-base leading-6 text-muted">{description}</Text>
      </View>
    </ScreenContainer>
  );
}
