export interface ThemeColors {
  readonly canvas: string;
  readonly paper: string;
  readonly ink: string;
  readonly muted: string;
  readonly line: string;
  readonly segmented: string;
  readonly scene: string;
  readonly sceneText: string;
  readonly sceneMuted: string;
  readonly sceneLine: string;
  readonly error: string;
  readonly errorSurface: string;
  readonly onError: string;
  readonly scrim: string;
  readonly accent: string;
  readonly onAccent: string;
}

interface ThemeDefinition {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly dark: boolean;
  readonly colors: ThemeColors;
}

const studioColors = {
  canvas: '#F3F4EE',
  paper: '#FFFFFF',
  ink: '#152019',
  muted: '#536157',
  line: '#CDD6C8',
  segmented: '#E7EAE1',
  scene: '#121C18',
  sceneText: '#F7FAF0',
  sceneMuted: '#C0CEC0',
  sceneLine: '#37483B',
  error: '#8D332A',
  errorSurface: '#FBECE7',
  onError: '#FFFFFF',
  scrim: '#07100BC7',
  accent: '#152019',
  onAccent: '#F3F8E9',
} as const satisfies ThemeColors;

const definitions = [
  {
    id: 'studio',
    name: 'Studio',
    description: 'Paper, ink, and open skies.',
    dark: false,
    colors: studioColors,
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'A quiet view after dark.',
    dark: true,
    colors: {
      ...studioColors,
      canvas: '#10161F',
      paper: '#19232F',
      ink: '#F0F5FC',
      muted: '#B0BECD',
      line: '#344558',
      segmented: '#253241',
      scene: '#0A1019',
      sceneText: '#F5F8FF',
      sceneMuted: '#BDCBDF',
      sceneLine: '#35445A',
      error: '#FFB4AB',
      errorSurface: '#392421',
      onError: '#36100B',
      accent: '#B7D4FF',
      onAccent: '#102238',
    },
  },
  {
    id: 'sandstone',
    name: 'Sandstone',
    description: 'Warm earth. Softer light.',
    dark: false,
    colors: {
      ...studioColors,
      canvas: '#F4EEE5',
      paper: '#FFFCF7',
      ink: '#392B25',
      muted: '#6D594C',
      line: '#D8CCBC',
      segmented: '#E7DBCD',
      scene: '#251C18',
      sceneText: '#FFF4E7',
      sceneMuted: '#DBC6B2',
      sceneLine: '#594536',
      error: '#8E332F',
      errorSurface: '#F8E7E0',
      accent: '#51382B',
      onAccent: '#FFF5E9',
    },
  },
  {
    id: 'aurora',
    name: 'Aurora',
    description: 'Deep greens. Northern energy.',
    dark: true,
    colors: {
      ...studioColors,
      canvas: '#0D1C19',
      paper: '#152C25',
      ink: '#E8F6EC',
      muted: '#ABC7B7',
      line: '#34564A',
      segmented: '#213F34',
      scene: '#081711',
      sceneText: '#F1FCEB',
      sceneMuted: '#BFDBC9',
      sceneLine: '#355845',
      error: '#FFBCB3',
      errorSurface: '#362924',
      onError: '#3B1712',
      accent: '#C7EE9C',
      onAccent: '#172C0B',
    },
  },
  {
    id: 'glacier',
    name: 'Glacier',
    description: 'Cool air. A clear perspective.',
    dark: false,
    colors: {
      ...studioColors,
      canvas: '#EDF4F6',
      paper: '#FFFFFF',
      ink: '#162D39',
      muted: '#506873',
      line: '#CBDDE3',
      segmented: '#DDE9EF',
      scene: '#0B2532',
      sceneText: '#F2FAFF',
      sceneMuted: '#BDD6E3',
      sceneLine: '#365362',
      error: '#8B352F',
      errorSurface: '#FBECE7',
      accent: '#1F5268',
      onAccent: '#FFFFFF',
    },
  },
  {
    id: 'orchid',
    name: 'Orchid',
    description: 'A little cosmic. Entirely yours.',
    dark: true,
    colors: {
      ...studioColors,
      canvas: '#1B1526',
      paper: '#292035',
      ink: '#F5EDF9',
      muted: '#C5B1D4',
      line: '#51405F',
      segmented: '#382B47',
      scene: '#150F20',
      sceneText: '#FCF4FF',
      sceneMuted: '#DAC2E8',
      sceneLine: '#4A355D',
      error: '#FFB4AB',
      errorSurface: '#3C2633',
      onError: '#3D101E',
      accent: '#DEC2FF',
      onAccent: '#2D104B',
    },
  },
] as const satisfies readonly ThemeDefinition[];

export type ThemeId = (typeof definitions)[number]['id'];
export interface AppTheme extends ThemeDefinition {
  readonly id: ThemeId;
}
export const THEME_PRESETS: readonly AppTheme[] = definitions;
export const DEFAULT_THEME: AppTheme = definitions[0];

export function findTheme(id: string): AppTheme | undefined {
  return THEME_PRESETS.find((theme) => theme.id === id);
}
