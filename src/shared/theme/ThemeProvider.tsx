import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import type { ImageStyle, TextStyle, ViewStyle } from 'react-native';

import { DEFAULT_THEME, findTheme, type AppTheme, type ThemeId } from './themes';

interface ThemeContextValue {
  readonly theme: AppTheme;
  readonly selectedThemeId: ThemeId;
  readonly selectTheme: (id: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: DEFAULT_THEME,
  selectedThemeId: DEFAULT_THEME.id,
  selectTheme: () => {},
});

export function ThemeProvider({
  children,
  initialThemeId = DEFAULT_THEME.id,
}: PropsWithChildren<{ readonly initialThemeId?: ThemeId }>) {
  const [theme, setTheme] = useState<AppTheme>(() => findTheme(initialThemeId) ?? DEFAULT_THEME);
  const selectTheme = useCallback((id: ThemeId) => {
    const nextTheme = findTheme(id);
    if (nextTheme) setTheme(nextTheme);
  }, []);
  const value = useMemo(
    () => ({ theme, selectedThemeId: theme.id, selectTheme }),
    [theme, selectTheme],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

export function useThemedStyles<T extends Record<string, ViewStyle | TextStyle | ImageStyle>>(
  factory: (theme: AppTheme) => T,
): T {
  const { theme } = useAppTheme();
  return useMemo(() => factory(theme), [factory, theme]);
}
