import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  ToastAndroid,
  View,
} from 'react-native';
import { COLORS, RIPPLE_LIGHT } from '../theme/colors';
import { useAppStore, ADS_FOR_FREE_WEEK } from '../state/useAppStore';

const PERKS = [
  { emoji: '♾️', title: 'Unlimited Swipe Matches', desc: 'No more 3-per-day limit on the Swipe-to-Eat feed' },
  { emoji: '🥽', title: 'AI Photo Plate Scanner', desc: 'Your pet puts on scanner goggles and analyzes meal photos' },
  { emoji: '🚫', title: 'Zero Banner Ads', desc: 'Every ad banner disappears, forever' },
];

export default function PaywallScreen({ navigation }) {
  const adsWatched = useAppStore((s) => s.adsWatched);
  const isPremium = useAppStore((s) => s.isPremium);
  const premiumUntil = useAppStore((s) => s.premiumUntil);
  const registerAdWatched = useAppStore((s) => s.registerAdWatched);
  const purchasePremium = useAppStore((s) => s.purchasePremium);
  const [adPlaying, setAdPlaying] = useState(false);

  const hasPremium = isPremium || premiumUntil > Date.now();
  const tempDaysLeft =
    premiumUntil > Date.now()
      ? Math.ceil((premiumUntil - Date.now()) / (24 * 60 * 60 * 1000))
      : 0;

  // Simulates watching a rewarded ad: 1.5s "playback", then tick the counter.
  // Swap with `RewardedAd` from react-native-google-mobile-ads in a dev build.
  const watchAd = () => {
    if (adPlaying) return;
    setAdPlaying(true);
    setTimeout(() => {
      const unlocked = registerAdWatched();
      setAdPlaying(false);
      ToastAndroid.show(
        unlocked
          ? '🎉 50 ads watched — FREE PREMIUM WEEK unlocked!'
          : `📺 Ad watched! ${ADS_FOR_FREE_WEEK - (adsWatched + 1)} to go`,
        ToastAndroid.SHORT
      );
      if (unlocked) navigation.goBack();
    }, 1500);
  };

  const buy = () => {
    // Swap with real Google Play Billing (e.g. react-native-iap) for release.
    purchasePremium();
    ToastAndroid.show('⭐ Welcome to FitPet Premium!', ToastAndroid.SHORT);
    navigation.goBack();
  };

  const progress = Math.min(1, adsWatched / ADS_FOR_FREE_WEEK);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>
      <Text style={styles.kicker}>FITPET</Text>
      <Text style={styles.title}>Go Premium ⭐</Text>
      <Text style={styles.subtitle}>
        {hasPremium
          ? isPremium
            ? 'You already have Premium. Enjoy! 🎉'
            : `Free Premium Week active — ${tempDaysLeft} day(s) left`
          : 'Level up your pet (and yourself) without limits.'}
      </Text>

      {PERKS.map((perk) => (
        <View key={perk.title} style={styles.perkRow}>
          <Text style={styles.perkEmoji}>{perk.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.perkTitle}>{perk.title}</Text>
            <Text style={styles.perkDesc}>{perk.desc}</Text>
          </View>
        </View>
      ))}

      <Pressable
        android_ripple={RIPPLE_LIGHT}
        style={[styles.buyBtn, hasPremium && styles.btnDisabled]}
        onPress={buy}
        disabled={hasPremium}
      >
        <Text style={styles.buyText}>Unlock Premium — $4.99/mo</Text>
        <Text style={styles.buySub}>(mock purchase — wires to Google Play Billing later)</Text>
      </Pressable>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or grind it out</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Rewarded Ad Loop */}
      <View style={styles.adCard}>
        <Text style={styles.adTitle}>📺 Watch {ADS_FOR_FREE_WEEK} Ads → Free Premium Week</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.adCount}>
          {adsWatched} / {ADS_FOR_FREE_WEEK} ads watched
        </Text>
        <Pressable
          android_ripple={RIPPLE_LIGHT}
          style={[styles.adBtn, (adPlaying || isPremium) && styles.btnDisabled]}
          onPress={watchAd}
          disabled={adPlaying || isPremium}
        >
          <Text style={styles.adBtnText}>
            {adPlaying ? '▶ Ad playing…' : 'Watch a Rewarded Ad'}
          </Text>
        </Pressable>
      </View>

      <Pressable
        android_ripple={RIPPLE_LIGHT}
        style={styles.closeBtn}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.closeText}>Maybe later</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 20, paddingBottom: 40 },
  kicker: { color: COLORS.primary, fontWeight: 'bold', letterSpacing: 4, fontSize: 12 },
  title: { color: COLORS.text, fontSize: 32, fontWeight: 'bold', marginTop: 4 },
  subtitle: { color: COLORS.textDim, fontSize: 14, marginTop: 6, marginBottom: 20 },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  perkEmoji: { fontSize: 28 },
  perkTitle: { color: COLORS.text, fontWeight: 'bold', fontSize: 15 },
  perkDesc: { color: COLORS.textDim, fontSize: 12, marginTop: 2 },
  buyBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 14,
    overflow: 'hidden',
    elevation: 6,
  },
  buyText: { color: COLORS.text, fontWeight: 'bold', fontSize: 17 },
  buySub: { color: 'rgba(255,255,255,0.7)', fontSize: 10, marginTop: 2 },
  btnDisabled: { opacity: 0.45 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.outline },
  dividerText: { color: COLORS.textDim, fontSize: 12 },
  adCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  adTitle: { color: COLORS.gold, fontWeight: 'bold', fontSize: 15, textAlign: 'center' },
  progressTrack: {
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.surfaceAlt,
    marginTop: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.outline,
  },
  progressFill: { height: '100%', backgroundColor: COLORS.gold, borderRadius: 7 },
  adCount: { color: COLORS.textDim, textAlign: 'center', fontSize: 12, marginTop: 6 },
  adBtn: {
    backgroundColor: '#3A3413',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  adBtnText: { color: COLORS.gold, fontWeight: 'bold' },
  closeBtn: { alignItems: 'center', marginTop: 18, padding: 10 },
  closeText: { color: COLORS.textDim, fontSize: 14 },
});
