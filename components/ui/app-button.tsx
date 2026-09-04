import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from "react-native";

import { useColors } from "@/hooks/use-colors";

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
  accessibilityLabel,
  ...props
}: AppButtonProps) {
  const colors = useColors();
  const isDisabled = disabled || loading;
  const buttonColor = variant === "primary" ? colors.gold : variant === "secondary" ? colors.surface : "transparent";
  const textColor = variant === "primary" ? colors.foreground : variant === "secondary" ? colors.foreground : colors.primary;

  return (
    <Pressable
      {...props}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={(state) => {
        const externalStyle = typeof style === "function" ? style(state) : style;
        return [
          styles.button,
          { backgroundColor: buttonColor },
          variant === "secondary" && { borderColor: colors.border, borderWidth: 1 },
          variant === "quiet" && { minHeight: 44, paddingHorizontal: 12 },
          isDisabled && styles.disabled,
          state.pressed && styles.pressed,
          externalStyle,
        ];
      }}
    >
      {loading ? <ActivityIndicator color={textColor} /> : <Text style={[styles.label, { color: textColor }]}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.1,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
});
