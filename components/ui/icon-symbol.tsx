import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

export type IconSymbolName = keyof typeof MAPPING;
type IconMapping = Record<string, ComponentProps<typeof MaterialIcons>["name"]>;

const MAPPING = {
  "house.fill": "home",
  "map.fill": "map",
  repeat: "refresh",
  "books.vertical.fill": "menu-book",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
} as const satisfies IconMapping;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: unknown;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
