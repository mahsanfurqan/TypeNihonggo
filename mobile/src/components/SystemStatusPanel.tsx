import { Pressable, StyleSheet, Text, View } from 'react-native';
import { mobileTheme } from '../theme/mobileTheme';

type SystemStatusPanelProps = {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  danger?: boolean;
};

export function SystemStatusPanel({
  title,
  message,
  actionLabel,
  onAction,
  danger = false,
}: SystemStatusPanelProps) {
  const accentColor = danger ? mobileTheme.colors.danger : mobileTheme.colors.border;

  return (
    <View style={styles.backdrop} pointerEvents={actionLabel ? 'auto' : 'none'}>
      <View style={[styles.panel, { borderColor: accentColor }]}>
        <View style={[styles.accent, { backgroundColor: accentColor }]} />
        <Text style={[styles.eyebrow, { color: accentColor }]}>SYSTEM · MOBILE LINK</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>

        {actionLabel && onAction ? (
          <Pressable
            accessibilityRole="button"
            onPress={onAction}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          >
            <Text style={styles.buttonText}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(2, 9, 20, 0.78)',
  },
  panel: {
    width: '100%',
    maxWidth: 420,
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 26,
    backgroundColor: mobileTheme.colors.panel,
    shadowColor: mobileTheme.colors.border,
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  accent: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: 2,
  },
  eyebrow: {
    marginBottom: 10,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.8,
    textAlign: 'center',
  },
  title: {
    color: mobileTheme.colors.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  message: {
    marginTop: 10,
    color: mobileTheme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  button: {
    marginTop: 22,
    alignSelf: 'center',
    minWidth: 168,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    borderRadius: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: mobileTheme.colors.panelSoft,
  },
  buttonPressed: {
    opacity: 0.72,
    transform: [{ translateY: 1 }],
  },
  buttonText: {
    color: mobileTheme.colors.text,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.1,
    textAlign: 'center',
  },
});
