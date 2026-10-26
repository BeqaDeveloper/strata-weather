import { fireEvent, render, screen } from '@testing-library/react-native';
import type * as ReactModule from 'react';
import type * as ReactNativeModule from 'react-native';
import { Pressable, Text } from 'react-native';

import { ThemeProvider, useAppTheme } from '../../shared/theme/ThemeProvider';
import { THEME_PRESETS } from '../../shared/theme/themes';
import { ASSISTANT_DISCLOSURE, ASSISTANT_REPLIES, ASSISTANT_SUGGESTIONS } from './assistantPreview';
import { WeatherAssistantWidget } from './WeatherAssistantWidget';

jest.mock('@expo/vector-icons/Feather', () => {
  const { createElement } = jest.requireActual<typeof ReactModule>('react');
  const { View } = jest.requireActual<typeof ReactNativeModule>('react-native');
  return ({ name }: { readonly name: string }) => createElement(View, { testID: `icon-${name}` });
});
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.setTimeout(15_000);

async function openPreview() {
  await fireEvent.press(screen.getByRole('button', { name: 'Open Sky assistant, coming soon' }));
}

function ThemeSwitch() {
  const { selectTheme } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Use Midnight theme"
      onPress={() => selectTheme('midnight')}
    >
      <Text>Midnight</Text>
    </Pressable>
  );
}

describe('WeatherAssistantWidget', () => {
  it('clearly identifies the unreleased local preview before and after opening it', async () => {
    await render(<WeatherAssistantWidget />);
    expect(screen.getByText('COMING SOON')).toBeOnTheScreen();
    expect(screen.queryByLabelText('Message Sky')).toBeNull();
    await openPreview();
    expect(screen.getByRole('header', { name: 'Sky, by Strata' })).toBeOnTheScreen();
    expect(screen.getByText(ASSISTANT_DISCLOSURE)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Send preview message' })).toBeDisabled();
  });

  it('answers a submitted question locally without network requests', async () => {
    const fetch = jest.spyOn(globalThis, 'fetch');
    await render(<WeatherAssistantWidget />);
    await openPreview();
    await fireEvent.changeText(screen.getByLabelText('Message Sky'), '  Will I need a jacket?  ');
    await fireEvent.press(screen.getByRole('button', { name: 'Send preview message' }));
    expect(screen.getByLabelText('You: Will I need a jacket?')).toBeOnTheScreen();
    expect(screen.getByLabelText(`Sky: ${ASSISTANT_REPLIES[0]}`)).toBeOnTheScreen();
    expect(screen.getByLabelText('Message Sky')).toHaveDisplayValue('');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('supports keyboard submit and lets the user send another question', async () => {
    await render(<WeatherAssistantWidget />);
    await openPreview();
    await fireEvent.changeText(screen.getByLabelText('Message Sky'), 'თბილისი?');
    await fireEvent(screen.getByLabelText('Message Sky'), 'submitEditing');
    await fireEvent.changeText(screen.getByLabelText('Message Sky'), 'And tomorrow?');
    await fireEvent(screen.getByLabelText('Message Sky'), 'submitEditing');
    expect(screen.getByLabelText('You: თბილისი?')).toBeOnTheScreen();
    expect(screen.getByLabelText(`Sky: ${ASSISTANT_REPLIES[1]}`)).toBeOnTheScreen();
  });

  it('rejects a blank keyboard submit and clears validation after editing', async () => {
    await render(<WeatherAssistantWidget />);
    await openPreview();
    await fireEvent(screen.getByLabelText('Message Sky'), 'submitEditing');
    expect(screen.getByRole('alert')).toHaveTextContent('Give Sky a little something to reply to.');
    await fireEvent.changeText(screen.getByLabelText('Message Sky'), 'Hello');
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByLabelText(`Sky: ${ASSISTANT_REPLIES[0]}`)).toBeNull();
  });

  it('rejects an oversized prompt without adding it to the transcript', async () => {
    await render(<WeatherAssistantWidget />);
    await openPreview();
    const oversized = 'x'.repeat(201);
    await fireEvent.changeText(screen.getByLabelText('Message Sky'), oversized);
    await fireEvent.press(screen.getByRole('button', { name: 'Send preview message' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/200 characters or fewer/);
    expect(screen.queryByLabelText(`You: ${oversized}`)).toBeNull();
    expect(screen.getByLabelText('Message Sky')).toHaveDisplayValue(oversized);
  });

  it('turns a suggestion into an honest preview exchange', async () => {
    await render(<WeatherAssistantWidget />);
    await openPreview();
    await fireEvent.press(screen.getByRole('button', { name: ASSISTANT_SUGGESTIONS[0] }));
    expect(screen.getByLabelText(`You: ${ASSISTANT_SUGGESTIONS[0]}`)).toBeOnTheScreen();
    expect(screen.getByText(ASSISTANT_DISCLOSURE)).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: ASSISTANT_SUGGESTIONS[1] })).toBeNull();
  });

  it('preserves its session conversation when closed and reopened', async () => {
    await render(<WeatherAssistantWidget />);
    await openPreview();
    await fireEvent.press(screen.getByRole('button', { name: ASSISTANT_SUGGESTIONS[1] }));
    await fireEvent.press(screen.getByRole('button', { name: 'Close Sky assistant' }));
    expect(screen.queryByLabelText('Message Sky')).toBeNull();
    await openPreview();
    expect(screen.getByLabelText(`You: ${ASSISTANT_SUGGESTIONS[1]}`)).toBeOnTheScreen();
  });

  it('supports dismissing with the native back action and the backdrop', async () => {
    await render(<WeatherAssistantWidget />);
    await openPreview();
    await fireEvent(screen.getByTestId('assistant-preview-modal'), 'requestClose');
    expect(
      screen.getByRole('button', { name: 'Open Sky assistant, coming soon' }),
    ).toBeOnTheScreen();
    await openPreview();
    await fireEvent.press(
      screen.getByRole('button', { name: 'Dismiss Sky assistant', includeHiddenElements: true }),
    );
    expect(screen.queryByLabelText('Message Sky')).toBeNull();
  });

  it('recolors an open conversation without resetting it when appearance changes', async () => {
    await render(
      <ThemeProvider>
        <WeatherAssistantWidget />
        <ThemeSwitch />
      </ThemeProvider>,
    );
    await openPreview();
    await fireEvent.press(screen.getByRole('button', { name: ASSISTANT_SUGGESTIONS[0] }));
    await fireEvent.press(screen.getByRole('button', { name: 'Use Midnight theme' }));
    const midnight = THEME_PRESETS.find(({ id }) => id === 'midnight');
    expect(screen.getByLabelText('Message Sky')).toHaveStyle({ color: midnight?.colors.ink });
    expect(screen.getByLabelText('Message Sky')).toHaveProp('keyboardAppearance', 'dark');
    expect(screen.getByLabelText(`You: ${ASSISTANT_SUGGESTIONS[0]}`)).toBeOnTheScreen();
  });
});
