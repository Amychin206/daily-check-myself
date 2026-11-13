import { ReactNode, useEffect, useRef } from 'react';
import { Animated, Easing, Platform, Pressable, StyleProp, ViewStyle } from 'react-native';

// Small shared animations: a press that dips, and content that eases in.

const NATIVE = Platform.OS !== 'web';

/** A pressable that dips slightly while held. */
export function PressScale({
  onPress,
  disabled,
  style,
  grow,
  children,
}: {
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Share the row's width with siblings. */
  grow?: boolean;
  children: ReactNode;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (toValue: number) =>
    Animated.spring(scale, { toValue, speed: 40, bounciness: 8, useNativeDriver: NATIVE }).start();
  return (
    <Pressable
      style={grow && { flex: 1 }}
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => to(0.93)}
      onPressOut={() => to(1)}
    >
      <Animated.View style={[style, { transform: [{ scale }] }, disabled && { opacity: 0.4 }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

/** Fades and slides its children in when first shown. */
export function Appear({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, {
      toValue: 1,
      duration: 320,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: NATIVE,
    }).start();
  }, [v, delay]);
  const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [8, 0] });
  return <Animated.View style={{ opacity: v, transform: [{ translateY }] }}>{children}</Animated.View>;
}
