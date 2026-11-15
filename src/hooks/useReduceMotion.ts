import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** Whether the system asks for reduced motion (prefers-reduced-motion on web) */
export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduce)
      .catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => subscription.remove();
  }, []);
  return reduce;
}
