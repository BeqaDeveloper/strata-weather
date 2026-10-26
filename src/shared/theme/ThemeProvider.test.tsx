import { act, renderHook } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { ThemeProvider, useAppTheme, useThemedStyles } from './ThemeProvider';
import { DEFAULT_THEME, type AppTheme, type ThemeId } from './themes';

function Wrapper({ children }: PropsWithChildren) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

describe('theme state', () => {
  it('provides Studio for standalone presentation previews', async () => {
    const { result } = await renderHook(() => useAppTheme());
    expect(result.current.theme).toBe(DEFAULT_THEME);
    await act(() => result.current.selectTheme('orchid'));
    expect(result.current.selectedThemeId).toBe('studio');
  });

  it('selects a preset without replacing the stable selection action', async () => {
    const { result } = await renderHook(() => useAppTheme(), { wrapper: Wrapper });
    const action = result.current.selectTheme;
    await act(() => action('midnight'));
    expect(result.current.theme.dark).toBe(true);
    expect(result.current.selectedThemeId).toBe('midnight');
    expect(result.current.selectTheme).toBe(action);
    await act(() => action('not-a-theme' as ThemeId));
    expect(result.current.selectedThemeId).toBe('midnight');
  });

  it('falls back safely for an unavailable initial preference', async () => {
    const { result } = await renderHook(() => useAppTheme(), {
      wrapper: ({ children }: PropsWithChildren) => (
        <ThemeProvider initialThemeId={'removed' as ThemeId}>{children}</ThemeProvider>
      ),
    });
    expect(result.current.selectedThemeId).toBe('studio');
  });

  it('reuses resolved styles until the actual appearance changes', async () => {
    const factory = jest.fn((theme: AppTheme) => ({
      panel: { backgroundColor: theme.colors.canvas },
    }));
    const { result, rerender } = await renderHook(
      () => ({ theme: useAppTheme(), styles: useThemedStyles(factory) }),
      { wrapper: Wrapper },
    );
    const firstStyles = result.current.styles;
    await rerender(undefined);
    expect(result.current.styles).toBe(firstStyles);
    expect(factory).toHaveBeenCalledTimes(1);
    await act(() => result.current.theme.selectTheme('orchid'));
    expect(result.current.styles).not.toBe(firstStyles);
    expect(result.current.styles.panel.backgroundColor).toBe(
      result.current.theme.theme.colors.canvas,
    );
  });
});
