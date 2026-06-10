import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, RIPPLE_LIGHT } from '../theme/colors';
import { useAppStore } from '../state/useAppStore';

/**
 * Google AdMob banner PLACEHOLDER (320x50 standard banner size).
 *
 * Real AdMob requires native code, which Expo Go cannot load. When you
 * are ready to ship, create a dev build and swap this component for
 * `BannerAd` from `react-native-google-mobile-ads` — the rest of the
 * app will not need to change.
 *
 * Renders nothing for premium users ("removes all banner ads").
 */
export default function AdBanner() {
  const navigation = useNavigation();
  const isPremium = useAppStore((s) => s.isPremium);
  const premiumUntil = useAppStore((s) => s.premiumUntil);
  if (isPremium || premiumUntil > Date.now()) return null;

  return (
    <View style={styles.container}>
      <View style={styles.banner}>
        <Text style={styles.adTag}>AD</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>AdMob Banner Placeholder</Text>
          <Text style={styles.subtitle}>320×50 · swap with react-native-google-mobile-ads</Text>
        </View>
        <Pressable
          android_ripple={RIPPLE_LIGHT}
          style={styles.removeBtn}
          onPress={() => navigation.navigate('Paywall')}
        >
          <Text style={styles.removeText}>Remove</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surfaceAlt,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.outline,
  },
  banner: {
    height: 50,
    borderRadius: 8,
    backgroundColor: '#2A2D4A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 10,
  },
  adTag: {
    backgroundColor: COLORS.gold,
    color: '#1A1C2E',
    fontWeight: 'bold',
    fontSize: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  title: { color: COLORS.text, fontSize: 12, fontWeight: '600' },
  subtitle: { color: COLORS.textDim, fontSize: 10 },
  removeBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    overflow: 'hidden',
  },
  removeText: { color: COLORS.text, fontSize: 11, fontWeight: 'bold' },
});
