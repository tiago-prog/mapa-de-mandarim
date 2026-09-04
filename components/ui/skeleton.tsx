import { View, type ViewProps } from "react-native";

import { useColors } from "@/hooks/use-colors";

export function Skeleton({ className, style, ...props }: ViewProps & { className?: string }) {
  const colors = useColors();
  return <View {...props} className={className} style={[{ backgroundColor: colors.border }, style]} />;
}
