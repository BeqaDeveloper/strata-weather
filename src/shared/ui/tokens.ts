import { Platform } from 'react-native';

export const colors = {
  canvas: '#F3F4EE',
  paper: '#FFFFFF',
  ink: '#152019',
  muted: '#606B62',
  line: '#DDE2D7',
  night: '#121C18',
  nightMuted: '#B7C6B8',
  error: '#8D332A',
  errorSurface: '#FBECE7',
} as const;

export const typography = {
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 20, xl: 28, xxl: 40 } as const;
