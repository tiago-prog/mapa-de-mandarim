import { View, type ViewProps } from "react-native";

import { useColors } from "@/hooks/use-colors";
import { cn } from "@/lib/utils";

export interface AppCardProps extends ViewProps {
  className?: string;
  tone?: "paper" | "sand" | "ink";
}

export function AppCard({ className, tone = "paper", style, ...props }: AppCardProps) {
  const colors = useColors();
  const toneStyle = {
    paper: { backgroundColor: colors.surface, borderColor: colors.border },
    sand: { backgroundColor: colors.surface, borderColor: colors.border },
    ink: { backgroundColor: colors.foreground, borderColor: colors.foreground },
  }[tone];

  return (
    <View
      {...props}
      style={[toneStyle, style]}
      className={cn("rounded-[24px] border p-5", className)}
    />
  );
}
