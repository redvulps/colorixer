import { useEffect, useState } from 'react';

import { screens } from '../../tailwind.config.js';

export const breakpoints = Object.entries(screens).map(([key, value]) => ({
  key,
  minWidth: parseInt(value),
}));

export const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState('base');

  useEffect(() => {
    const mediaQueries = breakpoints.map((bp) => ({
      ...bp,
      mql: window.matchMedia(`(min-width: ${bp.minWidth}px)`),
    }));

    const getCurrentBreakpoint = () => {
      for (let i = mediaQueries.length - 1; i >= 0; i--) {
        if (mediaQueries[i].mql.matches) {
          return mediaQueries[i].key;
        }
      }
      return 'base';
    };

    const updateBreakpoint = () => {
      setBreakpoint(getCurrentBreakpoint());
    };

    mediaQueries.forEach(({ mql }) => {
      mql.addEventListener('change', updateBreakpoint);
    });

    updateBreakpoint();

    return () => {
      mediaQueries.forEach(({ mql }) => {
        mql.removeEventListener('change', updateBreakpoint);
      });
    };
  }, []);

  return breakpoint;
};
