import type { BottomTabBarButtonProps } from "expo-router/build/react-navigation/bottom-tabs/types";
import { PlatformPressable } from "expo-router/react-navigation";
import * as Haptics from "expo-haptics";
import type { ComponentProps } from "react";

export function HapticTab(props: BottomTabBarButtonProps) {
  const { pressColor: _pressColor, ...pressableProps } = props;
  const compatibleProps = pressableProps as unknown as ComponentProps<typeof PlatformPressable>;

  return (
    <PlatformPressable
      {...compatibleProps}
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === "ios") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPressIn?.(ev);
      }}
    />
  );
}
