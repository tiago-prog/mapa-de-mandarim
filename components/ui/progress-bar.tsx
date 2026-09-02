import { View, type ViewProps } from "react-native";

import { cn } from "@/lib/utils";

export interface ProgressBarProps extends ViewProps {
  value: number;
  className?: string;
  fillClassName?: string;
}

export function ProgressBar({ value, className, fillClassName, ...props }: ProgressBarProps) {
  const clampedValue = Math.max(0, Math.min(100, value));

  return (
    <View {...props} className={cn("h-2 overflow-hidden rounded-full bg-border", className)}>
      <View
        className={cn("h-full rounded-full bg-primary", fillClassName)}
        style={{ width: `${clampedValue}%` }}
      />
    </View>
  );
}
