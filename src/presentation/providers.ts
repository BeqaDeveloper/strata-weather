export interface ProviderDefinition {
  readonly id: string;
  readonly name: string;
  readonly eyebrow: string;
  readonly description: string;
  readonly accent: string;
  readonly surface: string;
  readonly ink: string;
  readonly attribution: string;
  readonly url: string;
  readonly sceneColor: string;
}

export const OPEN_METEO_PRESENTATION = {
  id: 'open-meteo',
  name: 'Open-Meteo',
  eyebrow: 'GLOBAL MODELS · OPEN DATA',
  description: 'A world of weather, brought together by Open-Meteo.',
  accent: '#D8F36A',
  surface: '#E7EDCF',
  ink: '#152019',
  sceneColor: '#749C48',
  attribution: 'Weather data by Open-Meteo',
  url: 'https://open-meteo.com/',
} as const satisfies ProviderDefinition;

export const MET_NORWAY_PRESENTATION = {
  id: 'met-norway',
  name: 'MET Norway',
  eyebrow: 'NORDIC SCIENCE · GLOBAL REACH',
  description: 'A global forecast from the Norwegian Meteorological Institute.',
  accent: '#9DE6EE',
  surface: '#E0EEF0',
  ink: '#15232A',
  sceneColor: '#457B89',
  attribution: 'Weather data by MET Norway',
  url: 'https://www.met.no/en',
} as const satisfies ProviderDefinition;

export const PROVIDER_PRESENTATIONS = [OPEN_METEO_PRESENTATION, MET_NORWAY_PRESENTATION] as const;
