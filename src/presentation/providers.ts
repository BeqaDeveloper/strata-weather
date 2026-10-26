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
}

export const PROVIDER_PRESENTATIONS = [
  {
    id: 'open-meteo',
    name: 'Open-Meteo',
    eyebrow: 'A WIDER PERSPECTIVE',
    description: 'Global forecasts. A fresh perspective on your day.',
    accent: '#B84E29',
    surface: '#F7E7D8',
    ink: '#172A2D',
    attribution: 'Weather data by Open-Meteo',
    url: 'https://open-meteo.com/',
  },
  {
    id: 'met-norway',
    name: 'MET Norway',
    eyebrow: 'A NORDIC PERSPECTIVE',
    description: 'From the Norwegian Meteorological Institute, to wherever you are.',
    accent: '#5650A0',
    surface: '#EAE7F7',
    ink: '#23263E',
    attribution: 'Weather data by MET Norway',
    url: 'https://www.met.no/en',
  },
] as const satisfies readonly ProviderDefinition[];
