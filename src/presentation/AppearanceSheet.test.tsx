import { fireEvent, render, screen } from '@testing-library/react-native';
import type * as ReactModule from 'react';
import type * as ReactNativeModule from 'react-native';
import { Text } from 'react-native';

import { getContrastRatio } from '../shared/theme/contrast.test-support';
import { ThemeProvider, useAppTheme } from '../shared/theme/ThemeProvider';
import { THEME_PRESETS } from '../shared/theme/themes';
import { AppearanceSheet } from './AppearanceSheet';
import { PROVIDER_PRESENTATIONS } from './providers';

jest.mock('@expo/vector-icons/Feather', () => {
  const { createElement } = jest.requireActual<typeof ReactModule>('react');
  const { View } = jest.requireActual<typeof ReactNativeModule>('react-native');
  return () => createElement(View);
});
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

function CurrentTheme() {
  const { selectedThemeId } = useAppTheme();
  return <Text>{`Current theme: ${selectedThemeId}`}</Text>;
}

describe('appearance chooser', () => {
  it('exposes each preset as an explicit accessible choice and switches the active theme', async () => {
    const close = jest.fn();
    await render(
      <ThemeProvider>
        <AppearanceSheet visible onClose={close} />
        <CurrentTheme />
      </ThemeProvider>,
    );
    expect(screen.getAllByRole('radio')).toHaveLength(THEME_PRESETS.length);
    expect(screen.getByRole('radio', { name: 'Studio' })).toBeChecked();
    await fireEvent.press(screen.getByRole('radio', { name: 'Orchid' }));
    expect(screen.getByRole('radio', { name: 'Orchid' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Studio' })).not.toBeChecked();
    expect(screen.getByText('Current theme: orchid')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Close appearance' }));
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('supports backdrop dismissal without selecting another preset', async () => {
    const close = jest.fn();
    await render(
      <ThemeProvider>
        <AppearanceSheet visible onClose={close} />
      </ThemeProvider>,
    );
    await fireEvent.press(
      screen.getByRole('button', { name: 'Dismiss appearance', includeHiddenElements: true }),
    );
    expect(close).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('radio', { name: 'Studio' })).toBeChecked();
  });

  it.each(PROVIDER_PRESENTATIONS)(
    '$name retains a readable source identity across presets',
    (provider) => {
      expect(getContrastRatio(provider.ink, provider.accent)).toBeGreaterThanOrEqual(4.5);
    },
  );
});
