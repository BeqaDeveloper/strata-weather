export const ASSISTANT_PROMPT_LIMIT = 200;
export const ASSISTANT_EXCHANGE_LIMIT = 6;
export const ASSISTANT_DISCLOSURE =
  'Preview · replies are scripted. No messages leave this device.';
export const ASSISTANT_SUGGESTIONS = ['Will I need a jacket?', 'What’s next for Sky?'] as const;

export const ASSISTANT_REPLIES = [
  'I’m still finding my weather words. A proper conversation is coming soon. Come back when my skies clear—I can’t wait to talk with you.',
  'A little more cloud-gazing, then we can talk. I’m a coming-soon preview for now, but I’m already looking forward to our first real conversation.',
  'My forecast is: good conversations ahead. I’m not ready to answer questions yet. Check back another time—I can’t wait to meet you properly.',
] as const;

export interface AssistantExchange {
  readonly id: number;
  readonly prompt: string;
  readonly reply: string;
}

type PromptValidation =
  | { readonly success: true; readonly value: string }
  | { readonly success: false; readonly error: string };

export function normalizeAssistantPrompt(input: string): string {
  return input.normalize('NFKC').trim().replace(/\s+/gu, ' ');
}

export function countAssistantCharacters(input: string): number {
  return Array.from(normalizeAssistantPrompt(input)).length;
}

export function validateAssistantPrompt(input: string): PromptValidation {
  const value = normalizeAssistantPrompt(input);
  if (!/[\p{L}\p{N}\p{P}\p{S}]/u.test(value)) {
    return { success: false, error: 'Give Sky a little something to reply to.' };
  }
  if (Array.from(value).length > ASSISTANT_PROMPT_LIMIT) {
    return { success: false, error: 'Keep your message to 200 characters or fewer.' };
  }
  return { success: true, value };
}

export function appendAssistantExchange(
  exchanges: readonly AssistantExchange[],
  validatedPrompt: string,
): readonly AssistantExchange[] {
  const id = (exchanges.at(-1)?.id ?? 0) + 1;
  const reply = ASSISTANT_REPLIES[(id - 1) % ASSISTANT_REPLIES.length] ?? ASSISTANT_REPLIES[0];
  return [...exchanges, { id, prompt: validatedPrompt, reply }].slice(-ASSISTANT_EXCHANGE_LIMIT);
}
