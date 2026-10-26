import {
  appendAssistantExchange,
  ASSISTANT_DISCLOSURE,
  ASSISTANT_EXCHANGE_LIMIT,
  ASSISTANT_REPLIES,
  countAssistantCharacters,
  normalizeAssistantPrompt,
  validateAssistantPrompt,
  type AssistantExchange,
} from './assistantPreview';

describe('local assistant preview', () => {
  it.each(['', '  \n\t ', '\u200B', '\u0301'])('rejects a visually empty prompt %p', (input) => {
    expect(validateAssistantPrompt(input)).toMatchObject({ success: false });
  });

  it('normalizes spacing and compatibility characters without changing international names', () => {
    expect(validateAssistantPrompt('  Ｓｋｙ,   თბილისი?  ')).toEqual({
      success: true,
      value: 'Sky, თბილისი?',
    });
    expect(normalizeAssistantPrompt('one\n\t two')).toBe('one two');
  });

  it('counts Unicode code points rather than UTF-16 units', () => {
    expect(countAssistantCharacters(' ☁ 🪐 ')).toBe(3);
    expect(validateAssistantPrompt('🪐'.repeat(200))).toMatchObject({ success: true });
    expect(validateAssistantPrompt('🪐'.repeat(201))).toMatchObject({ success: false });
  });

  it('accepts a short punctuation-only question', () => {
    expect(validateAssistantPrompt('?')).toEqual({ success: true, value: '?' });
  });

  it('keeps complete exchanges bounded and leaves earlier arrays unchanged', () => {
    const first = appendAssistantExchange([], 'First question');
    let exchanges: readonly AssistantExchange[] = first;
    for (let index = 2; index <= 9; index += 1)
      exchanges = appendAssistantExchange(exchanges, `Question ${index}`);
    expect(first).toHaveLength(1);
    expect(first[0]?.prompt).toBe('First question');
    expect(exchanges).toHaveLength(ASSISTANT_EXCHANGE_LIMIT);
    expect(exchanges.map(({ id }) => id)).toEqual([4, 5, 6, 7, 8, 9]);
    expect(exchanges.every(({ prompt, reply }) => prompt.length > 0 && reply.length > 0)).toBe(
      true,
    );
  });

  it('uses original coming-soon replies with an explicit scripted-preview disclosure', () => {
    for (const reply of ASSISTANT_REPLIES) expect(reply).toMatch(/coming.soon|not ready/i);
    expect(ASSISTANT_REPLIES[0]).toContain('can’t wait to talk with you');
    expect(ASSISTANT_DISCLOSURE).toContain('replies are scripted');
    expect(ASSISTANT_DISCLOSURE).toContain('No messages leave this device');
    const first = appendAssistantExchange([], 'Will it rain?');
    const second = appendAssistantExchange(first, 'Can you answer?');
    const third = appendAssistantExchange(second, 'What next?');
    const fourth = appendAssistantExchange(third, 'One more');
    expect(first[0]?.reply).toBe(fourth.at(-1)?.reply);
  });
});
