import Feather from '@expo/vector-icons/Feather';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme, useThemedStyles } from '../shared/theme/ThemeProvider';
import { THEME_PRESETS, type AppTheme } from '../shared/theme/themes';
import { IconButton } from '../shared/ui/IconButton';
import { typography } from '../shared/ui/tokens';

interface AppearanceSheetProps {
  readonly visible: boolean;
  readonly onClose: () => void;
}

function ThemePreview({ theme }: { readonly theme: AppTheme }) {
  return (
    <View
      accessible={false}
      aria-hidden={true}
      importantForAccessibility="no-hide-descendants"
      style={[preview.frame, { backgroundColor: theme.colors.canvas }]}
    >
      <View style={[preview.wordmark, { backgroundColor: theme.colors.ink }]} />
      <View
        style={[
          preview.search,
          { backgroundColor: theme.colors.paper, borderColor: theme.colors.line },
        ]}
      />
      <View style={[preview.sky, { backgroundColor: theme.colors.scene }]}>
        <View style={[preview.orbit, { borderColor: theme.colors.accent }]} />
        <View style={[preview.orb, { backgroundColor: theme.colors.accent }]} />
        <View style={[preview.reading, { backgroundColor: theme.colors.sceneText }]} />
      </View>
      <View style={preview.footer}>
        {[0, 1, 2].map((number) => (
          <View key={number} style={[preview.metric, { backgroundColor: theme.colors.muted }]} />
        ))}
      </View>
    </View>
  );
}

export function AppearanceSheet({ visible, onClose }: AppearanceSheetProps) {
  const { theme, selectedThemeId, selectTheme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={[styles.overlay, { paddingTop: insets.top + 16 }]}>
        <Pressable
          accessibilityLabel="Dismiss appearance"
          accessibilityRole="button"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View
          accessibilityViewIsModal
          style={[styles.panel, { paddingBottom: insets.bottom + 16 }]}
        >
          <View style={styles.heading}>
            <View style={styles.headingCopy}>
              <Text style={styles.eyebrow}>YOUR OWN ATMOSPHERE</Text>
              <Text accessibilityRole="header" style={styles.title}>
                Make it yours.
              </Text>
            </View>
            <IconButton label="Close appearance" icon="x" onPress={onClose} />
          </View>
          <Text style={styles.description}>A different mood. The same clear forecast.</Text>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            <View
              accessibilityRole="radiogroup"
              accessibilityLabel="Appearance theme"
              style={styles.grid}
            >
              {THEME_PRESETS.map((preset) => {
                const selected = preset.id === selectedThemeId;
                return (
                  <Pressable
                    key={preset.id}
                    accessibilityRole="radio"
                    accessibilityLabel={preset.name}
                    accessibilityHint={preset.description}
                    aria-checked={selected}
                    onPress={() => selectTheme(preset.id)}
                    style={({ pressed }) => [
                      styles.option,
                      { borderColor: selected ? theme.colors.ink : theme.colors.line },
                      pressed && styles.pressed,
                    ]}
                  >
                    <ThemePreview theme={preset} />
                    <View style={styles.optionLabel}>
                      <Text style={styles.optionName}>{preset.name}</Text>
                      {selected ? (
                        <Feather
                          name="check-circle"
                          size={17}
                          color={theme.colors.ink}
                          accessible={false}
                          aria-hidden={true}
                        />
                      ) : null}
                    </View>
                    <Text style={styles.optionDescription}>{preset.description}</Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
          <View style={styles.note}>
            <Feather
              name="layers"
              color={theme.colors.muted}
              size={14}
              accessible={false}
              aria-hidden={true}
            />
            <Text style={styles.noteText}>Your forecast source keeps its own signature color.</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = ({ colors }: AppTheme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'flex-end',
      backgroundColor: colors.scrim,
      paddingHorizontal: 12,
    },
    panel: {
      backgroundColor: colors.canvas,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      maxHeight: '100%',
      maxWidth: 620,
      width: '100%',
      padding: 20,
      gap: 12,
    },
    heading: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    headingCopy: { flex: 1, gap: 7 },
    eyebrow: { color: colors.muted, fontFamily: typography.mono, fontSize: 9, letterSpacing: 1.2 },
    title: { color: colors.ink, fontSize: 30, fontWeight: '600', letterSpacing: -1.2 },
    description: { color: colors.muted, fontSize: 13, lineHeight: 20 },
    scroll: { paddingVertical: 7 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14 },
    option: {
      backgroundColor: colors.paper,
      borderRadius: 17,
      borderWidth: 1.5,
      padding: 9,
      width: '48%',
      minHeight: 160,
      gap: 8,
    },
    optionLabel: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 6,
    },
    optionName: { color: colors.ink, fontSize: 13, fontWeight: '700', flexShrink: 1 },
    optionDescription: { color: colors.muted, fontSize: 10, lineHeight: 15 },
    note: { flexDirection: 'row', gap: 8, alignItems: 'center', paddingTop: 8 },
    noteText: { color: colors.muted, fontSize: 11, lineHeight: 18, flex: 1 },
    pressed: { opacity: 0.75 },
  });

const preview = StyleSheet.create({
  frame: { borderRadius: 10, overflow: 'hidden', height: 99, padding: 9, gap: 7 },
  wordmark: { width: 25, height: 4, borderRadius: 2 },
  search: { height: 9, borderRadius: 5, borderWidth: 0.5 },
  sky: { flex: 1, borderRadius: 8, overflow: 'hidden', justifyContent: 'center', padding: 8 },
  orbit: {
    width: 43,
    height: 43,
    borderRadius: 24,
    borderWidth: 0.5,
    opacity: 0.4,
    position: 'absolute',
    right: 4,
    top: 3,
  },
  orb: { height: 22, width: 22, borderRadius: 12, position: 'absolute', right: 15, top: 10 },
  reading: { width: 18, height: 22, borderRadius: 3, opacity: 0.9 },
  footer: { flexDirection: 'row', justifyContent: 'space-between' },
  metric: { height: 3, width: 15, borderRadius: 2, opacity: 0.7 },
});
