import { getContrastRatio } from './contrast.test-support';
import { DEFAULT_THEME, findTheme, THEME_PRESETS } from './themes';

describe('theme presets', () => {
  it('has unique identifiers and a stable default', () => {
    expect(new Set(THEME_PRESETS.map(({ id }) => id)).size).toBe(THEME_PRESETS.length);
    expect(findTheme('studio')).toBe(DEFAULT_THEME);
    expect(findTheme('unavailable-theme')).toBeUndefined();
  });

  it.each(THEME_PRESETS)(
    '$name maintains readable text, input, error, and scene colors',
    ({ colors }) => {
      const pairs = [
        [colors.ink, colors.canvas],
        [colors.ink, colors.paper],
        [colors.muted, colors.canvas],
        [colors.muted, colors.paper],
        [colors.muted, colors.segmented],
        [colors.sceneText, colors.scene],
        [colors.sceneText, colors.sceneLine],
        [colors.sceneMuted, colors.scene],
        [colors.onAccent, colors.accent],
        [colors.error, colors.errorSurface],
        [colors.onError, colors.error],
      ];
      for (const [foreground, background] of pairs) {
        expect(getContrastRatio(foreground ?? '', background ?? '')).toBeGreaterThanOrEqual(4.5);
      }
    },
  );
});
