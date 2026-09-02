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
  ...props
}: AppButtonProps) {
  const colors = useColors();
  const isDisabled = disabled || loading;
  const buttonColor = variant === "primary" ? colors.primary : variant === "secondary" ? colors.surface : "transparent";
  const textColor = variant === "primary" ? colors.background : variant === "secondary" ? colors.foreground : colors.primary;

  return (
    <Pressable
      {...props}
      disabled={isDisabled}
      style={(state) => {
        const externalStyle = typeof style === "function" ? style(state) : style;
        return [
          styles.button,
          { backgroundColor: buttonColor },
          variant === "secondary" && { borderColor: colors.border, borderWidth: StyleSheet.hairlineWidth },
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
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
