import React from 'react';
import { Platform, Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

type PlatformIconProps = {
  ios: React.ComponentProps<typeof Ionicons>['name'];
  android: React.ComponentProps<typeof MaterialIcons>['name'];
  size: number;
  color: string;
};

// Ionicons match SF Symbols on iOS; Material Icons are the native set on Android.
export function PlatformIcon({ ios, android, size, color }: PlatformIconProps) {
  return Platform.OS === 'ios'
    ? <Ionicons name={ios} size={size} color={color} />
    : <MaterialIcons name={android} size={size} color={color} />;
}

const RIPPLE = { color: 'rgba(255, 255, 255, 0.3)', borderless: true, radius: 24 };

// iOS: "‹ Back" text button. Android: ← arrow icon (Material top app bar).
export function HeaderBackButton({ onPress }: { onPress: () => void }) {
  if (Platform.OS === 'ios') {
    return (
      <Pressable
        onPress={onPress}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Back"
        style={({ pressed }) => [styles.iosBack, pressed && styles.pressed]}
      >
        <Ionicons name="chevron-back" size={28} color="#fff" />
        <Text style={styles.iosBackText}>Back</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      android_ripple={RIPPLE}
      accessibilityRole="button"
      accessibilityLabel="Back"
      style={styles.iconButton}
    >
      <MaterialIcons name="arrow-back" size={24} color="#fff" />
    </Pressable>
  );
}

export function HeaderIconButton({
  onPress,
  accessibilityLabel,
  ...icon
}: Omit<PlatformIconProps, 'size' | 'color'> & { onPress: () => void; accessibilityLabel: string }) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={RIPPLE}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.iconButton, Platform.OS === 'ios' && pressed && styles.pressed]}
    >
      <PlatformIcon {...icon} size={Platform.OS === 'ios' ? 28 : 24} color="#fff" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  iosBack: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    marginLeft: -8,
  },
  iosBackText: {
    color: '#fff',
    fontSize: 17,
  },
  iconButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.5,
  },
});
