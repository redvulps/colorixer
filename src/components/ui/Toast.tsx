import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { colors, radius, shadows, type } from '@/src/theme/tokens';

const DURATION_MS = 1900;

type ShowToast = (message: string) => void;

const ToastContext = createContext<ShowToast>(() => {});

/** Short confirmation shown near the bottom of the screen ("Saved …", "Copied …") */
export function ToastProvider({ children, bottom }: { children: React.ReactNode; bottom: number }) {
  const [message, setMessage] = useState<string | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback<ShowToast>(
    (text) => {
      setMessage(text);
      Animated.timing(opacity, { toValue: 1, duration: 120, useNativeDriver: true }).start();
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() =>
          setMessage(null),
        );
      }, DURATION_MS);
    },
    [opacity],
  );

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return (
    <ToastContext.Provider value={show}>
      {children}
      {message !== null && (
        <View pointerEvents="none" style={[styles.layer, { bottom }]}>
          <Animated.View style={[styles.toast, { opacity }]} accessibilityLiveRegion="polite">
            <Text testID="toast" style={styles.text}>
              {message}
            </Text>
          </Animated.View>
        </View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ShowToast {
  return useContext(ToastContext);
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  toast: {
    backgroundColor: colors.inverseSurface,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 16,
    ...shadows.toast,
  },
  text: {
    ...type.labelPill,
    color: colors.inverseText,
  },
});
