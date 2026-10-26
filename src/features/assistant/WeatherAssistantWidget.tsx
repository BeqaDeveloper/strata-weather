import Feather from '@expo/vector-icons/Feather';
import { memo, useCallback, useRef, useState, type ComponentRef } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme, useThemedStyles } from '../../shared/theme/ThemeProvider';
import type { AppTheme } from '../../shared/theme/themes';
import { IconButton } from '../../shared/ui/IconButton';
import { typography } from '../../shared/ui/tokens';
import {
  appendAssistantExchange,
  ASSISTANT_DISCLOSURE,
  ASSISTANT_PROMPT_LIMIT,
  ASSISTANT_SUGGESTIONS,
  countAssistantCharacters,
  validateAssistantPrompt,
  type AssistantExchange,
} from './assistantPreview';
import { SkyMark } from './SkyMark';

export const WeatherAssistantWidget = memo(function WeatherAssistantWidget() {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [exchanges, setExchanges] = useState<readonly AssistantExchange[]>([]);
  const transcript = useRef<ComponentRef<typeof ScrollView>>(null);
  const characterCount = countAssistantCharacters(draft);
  const panelHeight = Math.min(760, height * 0.88, height - insets.top - insets.bottom - 24);

  const close = useCallback(() => setOpen(false), []);
  const submitPrompt = useCallback((input: string) => {
    const result = validateAssistantPrompt(input);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setExchanges((current) => appendAssistantExchange(current, result.value));
    setDraft('');
    setError(null);
  }, []);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open Sky assistant, coming soon"
        accessibilityHint="Opens a local preview with scripted replies"
        aria-expanded={open}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.launcher,
          {
            bottom: Math.max(insets.bottom, 16) + 8,
            right: Math.max(20, (width - 620) / 2),
          },
          pressed && styles.pressed,
        ]}
      >
        <SkyMark accent={theme.colors.accent} ink={theme.colors.onAccent} size={36} />
        <View style={styles.launcherCopy}>
          <Text style={styles.launcherName}>Meet Sky</Text>
          <Text style={styles.launcherSoon}>COMING SOON</Text>
        </View>
        <Feather
          name="arrow-up-right"
          size={17}
          color={theme.colors.ink}
          accessible={false}
          aria-hidden={true}
        />
      </Pressable>
      {open ? (
        <Modal
          transparent
          visible
          animationType="none"
          onRequestClose={close}
          statusBarTranslucent
          testID="assistant-preview-modal"
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[
              styles.overlay,
              {
                paddingTop: insets.top + 12,
                paddingBottom: Math.max(insets.bottom, 12),
                justifyContent: width >= 700 ? 'center' : 'flex-end',
              },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Dismiss Sky assistant"
              onPress={close}
              style={styles.backdrop}
            />
            <View accessibilityViewIsModal style={[styles.panel, { height: panelHeight }]}>
              <View style={styles.header}>
                <View style={styles.identity}>
                  <SkyMark accent={theme.colors.accent} ink={theme.colors.onAccent} />
                  <View style={styles.headerCopy}>
                    <Text accessibilityRole="header" style={styles.name}>
                      Sky, by Strata
                    </Text>
                    <View style={styles.statusRow}>
                      <View style={styles.statusDot} />
                      <Text style={styles.status}>COMING SOON</Text>
                    </View>
                  </View>
                </View>
                <IconButton
                  label="Close Sky assistant"
                  icon="x"
                  onPress={close}
                  backgroundColor={theme.colors.segmented}
                  color={theme.colors.ink}
                />
              </View>
              <ScrollView
                ref={transcript}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.transcript}
                style={styles.conversation}
                onContentSizeChange={() => transcript.current?.scrollToEnd({ animated: false })}
              >
                <View style={styles.introduction}>
                  <Text style={styles.eyebrow}>A LITTLE MORE HUMAN. A LITTLE MORE SKY.</Text>
                  <Text style={styles.introTitle}>Still finding my{'\n'}weather words.</Text>
                  <Text style={styles.introBody}>
                    I’m Sky, your future weather companion. A proper conversation is on the horizon.
                    For now, try this little preview.
                  </Text>
                </View>
                {exchanges.length === 0 ? (
                  <View style={styles.suggestions}>
                    {ASSISTANT_SUGGESTIONS.map((suggestion) => (
                      <Pressable
                        key={suggestion}
                        accessibilityRole="button"
                        onPress={() => submitPrompt(suggestion)}
                        style={({ pressed }) => [styles.suggestion, pressed && styles.pressed]}
                      >
                        <Text style={styles.suggestionText}>{suggestion}</Text>
                        <Feather
                          name="arrow-up-right"
                          size={15}
                          color={theme.colors.muted}
                          accessible={false}
                          aria-hidden={true}
                        />
                      </Pressable>
                    ))}
                  </View>
                ) : null}
                {exchanges.map((exchange, index) => (
                  <View key={exchange.id} style={styles.exchange}>
                    <View
                      accessible
                      accessibilityLabel={`You: ${exchange.prompt}`}
                      style={styles.userBubble}
                    >
                      <Text style={styles.userMessage}>{exchange.prompt}</Text>
                    </View>
                    <View style={styles.replyHeading}>
                      <View style={styles.replyDot} />
                      <Text style={styles.replyName}>SKY / PREVIEW</Text>
                    </View>
                    <View
                      accessible
                      accessibilityLabel={`Sky: ${exchange.reply}`}
                      accessibilityLiveRegion={index === exchanges.length - 1 ? 'polite' : 'none'}
                      style={styles.replyBubble}
                    >
                      <Text style={styles.replyMessage}>{exchange.reply}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
              <View style={styles.composerSection}>
                <View style={[styles.composer, error !== null && styles.composerInvalid]}>
                  <TextInput
                    accessibilityLabel="Message Sky"
                    accessibilityHint="A local scripted preview, up to 200 characters"
                    value={draft}
                    placeholder="Ask Sky something…"
                    placeholderTextColor={theme.colors.muted}
                    keyboardAppearance={theme.dark ? 'dark' : 'light'}
                    onChangeText={(value) => {
                      setDraft(value);
                      setError(null);
                    }}
                    onSubmitEditing={() => submitPrompt(draft)}
                    returnKeyType="send"
                    submitBehavior="submit"
                    maxLength={ASSISTANT_PROMPT_LIMIT * 2}
                    style={styles.input}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Send preview message"
                    aria-disabled={characterCount === 0}
                    disabled={characterCount === 0}
                    onPress={() => submitPrompt(draft)}
                    style={({ pressed }) => [
                      styles.sendButton,
                      (pressed || characterCount === 0) && styles.pressed,
                    ]}
                  >
                    <Feather
                      name="arrow-up"
                      color={theme.colors.onAccent}
                      size={20}
                      accessible={false}
                      aria-hidden={true}
                    />
                  </Pressable>
                </View>
                <View style={styles.composerMeta}>
                  <Text
                    accessibilityRole={error !== null ? 'alert' : undefined}
                    style={[styles.inputHint, error !== null && styles.errorText]}
                  >
                    {error ?? 'Just a preview. Curiosity welcome.'}
                  </Text>
                  <Text
                    style={[
                      styles.characterCount,
                      characterCount > ASSISTANT_PROMPT_LIMIT && styles.errorText,
                    ]}
                  >
                    {characterCount}/{ASSISTANT_PROMPT_LIMIT}
                  </Text>
                </View>
                <Text style={styles.disclosure}>{ASSISTANT_DISCLOSURE}</Text>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      ) : null}
    </>
  );
});

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    launcher: {
      position: 'absolute',
      zIndex: 20,
      alignItems: 'center',
      flexDirection: 'row',
      gap: 10,
      borderWidth: 1,
      borderColor: theme.colors.line,
      backgroundColor: theme.colors.paper,
      paddingLeft: 11,
      paddingRight: 16,
      paddingVertical: 10,
      borderRadius: 36,
      minHeight: 60,
      boxShadow: '0px 8px 28px rgba(0, 0, 0, 0.14)',
    },
    launcherCopy: { gap: 4 },
    launcherName: { color: theme.colors.ink, fontSize: 13, fontWeight: '700' },
    launcherSoon: {
      color: theme.colors.muted,
      fontFamily: typography.mono,
      fontSize: 8,
      letterSpacing: 1,
    },
    pressed: { opacity: 0.55 },
    overlay: { flex: 1, alignItems: 'center', paddingHorizontal: 14 },
    backdrop: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      backgroundColor: theme.colors.scrim,
    },
    panel: {
      width: '100%',
      maxWidth: 480,
      maxHeight: '100%',
      backgroundColor: theme.colors.canvas,
      borderColor: theme.colors.line,
      borderWidth: 1,
      borderRadius: 28,
      overflow: 'hidden',
      boxShadow: '0px 20px 70px rgba(0, 0, 0, 0.24)',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      paddingHorizontal: 20,
      paddingVertical: 18,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.line,
    },
    identity: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
    headerCopy: { gap: 6, flexShrink: 1 },
    name: { color: theme.colors.ink, fontSize: 18, fontWeight: '700', letterSpacing: -0.5 },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    statusDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: theme.colors.muted },
    status: {
      color: theme.colors.muted,
      fontFamily: typography.mono,
      fontSize: 8,
      letterSpacing: 1.1,
    },
    conversation: { flex: 1 },
    transcript: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 24, gap: 22 },
    introduction: { gap: 14 },
    eyebrow: {
      color: theme.colors.muted,
      fontFamily: typography.mono,
      fontSize: 8,
      lineHeight: 15,
      letterSpacing: 0.8,
    },
    introTitle: {
      color: theme.colors.ink,
      fontSize: 31,
      fontWeight: '600',
      letterSpacing: -1.5,
      lineHeight: 36,
    },
    introBody: { color: theme.colors.muted, fontSize: 14, lineHeight: 23 },
    suggestions: { gap: 9 },
    suggestion: {
      minHeight: 46,
      borderColor: theme.colors.line,
      borderWidth: 1,
      borderRadius: 15,
      backgroundColor: theme.colors.paper,
      paddingHorizontal: 14,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },
    suggestionText: { flex: 1, color: theme.colors.ink, fontSize: 13, lineHeight: 20 },
    exchange: { gap: 10 },
    userBubble: {
      alignSelf: 'flex-end',
      maxWidth: '92%',
      backgroundColor: theme.colors.accent,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 19,
      borderBottomRightRadius: 5,
    },
    userMessage: { color: theme.colors.onAccent, fontSize: 14, lineHeight: 22 },
    replyHeading: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 7 },
    replyDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: theme.colors.muted },
    replyName: {
      color: theme.colors.muted,
      fontFamily: typography.mono,
      fontSize: 8,
      letterSpacing: 1,
    },
    replyBubble: {
      alignSelf: 'flex-start',
      maxWidth: '96%',
      backgroundColor: theme.colors.paper,
      borderWidth: 1,
      borderColor: theme.colors.line,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: 19,
      borderBottomLeftRadius: 5,
    },
    replyMessage: { color: theme.colors.ink, fontSize: 14, lineHeight: 23 },
    composerSection: { borderTopWidth: 1, borderTopColor: theme.colors.line, padding: 16, gap: 10 },
    composer: {
      backgroundColor: theme.colors.paper,
      borderWidth: 1,
      borderColor: theme.colors.line,
      minHeight: 58,
      borderRadius: 21,
      paddingLeft: 14,
      paddingRight: 6,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    composerInvalid: { borderColor: theme.colors.error },
    input: { flex: 1, minWidth: 0, color: theme.colors.ink, fontSize: 14, paddingVertical: 17 },
    sendButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 17,
      backgroundColor: theme.colors.accent,
    },
    composerMeta: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 8,
    },
    inputHint: { flex: 1, color: theme.colors.muted, fontSize: 10, lineHeight: 16 },
    characterCount: {
      color: theme.colors.muted,
      fontFamily: typography.mono,
      fontSize: 9,
      lineHeight: 16,
    },
    errorText: { color: theme.colors.error },
    disclosure: { color: theme.colors.muted, fontSize: 9, lineHeight: 15, textAlign: 'center' },
  });
