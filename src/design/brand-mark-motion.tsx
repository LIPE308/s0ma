import { useEffect, useRef, useState } from "react";
import { useIsFocused } from "@react-navigation/native";
import { Animated, AppState, Easing, View } from "react-native";
import { nativeDriver, useReducedMotion } from "./motion";

// Os mesmos dois L da marca: os cantos se aproximam e giram até formar um +.
export function BrandMarkMotion({
  size,
  color,
}: {
  size: number;
  color: string;
}) {
  const progress = useRef(new Animated.Value(0)).current;
  const reduced = useReducedMotion();
  const focused = useIsFocused();
  const [active, setActive] = useState(AppState.currentState === "active");
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) =>
      setActive(state === "active"),
    );
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    progress.setValue(0);
    if (reduced || !focused || !active) return;
    const options = {
      duration: 1600,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: nativeDriver,
      isInteraction: false,
    };
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(1000),
        Animated.timing(progress, { ...options, toValue: 1 }),
        Animated.delay(1000),
        Animated.timing(progress, { ...options, toValue: 0 }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [active, focused, progress, reduced]);
  const u = size / 100;
  return (
    <View
      testID="access-logo-symbol"
      accessible={false}
      style={{ width: size, height: size }}
    >
      {[0, 1].map((part) => (
        <Animated.View
          key={part}
          testID={`access-logo-part-${part}`}
          style={{
            position: "absolute",
            width: 58 * u,
            height: 58 * u,
            left: part * 42 * u,
            top: part * 42 * u,
            transform: [
              {
                translateX: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, (part ? -21 : 21) * u],
                }),
              },
              {
                translateY: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, (part ? -21 : 21) * u],
                }),
              },
              {
                rotate: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: part ? ["180deg", "360deg"] : ["0deg", "180deg"],
                }),
              },
            ],
          }}
        >
          <View
            style={{
              position: "absolute",
              left: 20 * u,
              top: 20 * u,
              width: 44 * u,
              height: 18 * u,
              borderRadius: 2 * u,
              backgroundColor: color,
            }}
          />
          <View
            style={{
              position: "absolute",
              left: 20 * u,
              top: 38 * u,
              width: 18 * u,
              height: 26 * u,
              borderRadius: 2 * u,
              backgroundColor: color,
            }}
          />
        </Animated.View>
      ))}
    </View>
  );
}
