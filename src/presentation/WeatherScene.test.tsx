import { render, screen } from '@testing-library/react-native';

import { OPEN_METEO_PRESENTATION } from './providers';
import { WeatherScene } from './WeatherScene';

const palette = {
  accent: OPEN_METEO_PRESENTATION.accent,
  sceneColor: OPEN_METEO_PRESENTATION.sceneColor,
};
const hidden = { includeHiddenElements: true };

describe('WeatherScene', () => {
  it('switches the visual sky from sun to moon when forecast daylight changes', async () => {
    const view = await render(<WeatherScene {...palette} condition="clear" isDay />);
    expect(screen.getByTestId('scene-sun', hidden)).toBeOnTheScreen();
    expect(screen.queryByTestId('scene-moon', hidden)).toBeNull();
    await view.rerender(<WeatherScene {...palette} condition="clear" isDay={false} />);
    expect(screen.getByTestId('scene-moon', hidden)).toBeOnTheScreen();
    expect(screen.queryByTestId('scene-sun', hidden)).toBeNull();
  });

  it('uses a neutral sky rather than inventing conditions when the source has no condition', async () => {
    await render(<WeatherScene {...palette} condition="unknown" isDay />);
    expect(screen.getByTestId('scene-neutral', hidden)).toBeOnTheScreen();
    expect(screen.queryByTestId('scene-sun', hidden)).toBeNull();
    expect(screen.queryByTestId('scene-moon', hidden)).toBeNull();
    expect(screen.queryByTestId('scene-cloud', hidden)).toBeNull();
  });

  it('adds cloud cover only for a condition that reports it', async () => {
    const view = await render(<WeatherScene {...palette} condition="cloudy" isDay />);
    expect(screen.getByTestId('scene-cloud', hidden)).toBeOnTheScreen();
    await view.rerender(<WeatherScene {...palette} condition="clear" isDay />);
    expect(screen.queryByTestId('scene-cloud', hidden)).toBeNull();
  });

  it('does not infer daylight from a condition that has no daylight metadata', async () => {
    await render(<WeatherScene {...palette} condition="cloudy" isDay={null} />);
    expect(screen.getByTestId('scene-neutral', hidden)).toBeOnTheScreen();
    expect(screen.getByTestId('scene-cloud', hidden)).toBeOnTheScreen();
    expect(screen.queryByTestId('scene-sun', hidden)).toBeNull();
    expect(screen.queryByTestId('scene-moon', hidden)).toBeNull();
  });
});
