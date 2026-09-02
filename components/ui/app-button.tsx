import { ActivityIndicator, Pressable, Text, type PressableProps } from "react-native";

import { cn } from "@/lib/utils";

export interface AppButtonProps extends PressableProps {
  label: string;
  variant?: "primary" | "secondary" | "quiet";
  loading?: boolean;
}

export function AppButton({
  label,
  variant = "primary",
  loading = false,
  disabled,
  style,
  ...props
}: AppButtonProps) {
  const buttonClass = {
    primary: "bg-primary",
    secondary: "border border-border bg-surface",
    quiet: "bg-transparent",
  }[variant];
  const textClass = {
    primary: "text-background",
    secondary: "text-foreground",
    quiet: "text-primary",
  }[variant];

  return (
    <Pressable
      {...props}
      disabled={disabled || loading}
      style={(state) => {
        const externalStyle = typeof style === "function" ? style(state) : style;
        return [
          { transform: [{ scale: state.pressed ? 0.98 : 1 }], opacity: state.pressed ? 0.9 : 1 },
          externalStyle,
        ];
      }}
      className={cn(
        "min-h-[52px] flex-row items-center justify-center rounded-full px-5",
        buttonClass,
        (disabled || loading) && "opacity-50",
      )}
    >
      {loading ? <ActivityIndicator color={variant === "primary" ? "#FFFCF4" : "#172A35"} /> : <Text className={cn("text-base font-semibold", textClass)}>{label}</Text>}
    </Pressable>
  );
}
