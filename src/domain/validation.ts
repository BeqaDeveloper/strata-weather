type LocationValidation =
  | { readonly success: true; readonly value: string }
  | { readonly success: false; readonly error: string };

export function validateLocationQuery(input: string): LocationValidation {
  const value = input.normalize('NFKC').trim().replace(/\s+/gu, ' ');
  const length = Array.from(value).length;
  if (length < 2) {
    return { success: false, error: 'Enter at least 2 characters for a city or postal code.' };
  }
  if (length > 80) {
    return { success: false, error: 'Keep your location to 80 characters or fewer.' };
  }
  if (!/^[\p{L}\p{M}\p{N}\s.,'’()&\/-]+$/u.test(value) || !/[\p{L}\p{N}]/u.test(value)) {
    return { success: false, error: 'Use a city name or postal code, with an optional country.' };
  }
  return { success: true, value };
}
