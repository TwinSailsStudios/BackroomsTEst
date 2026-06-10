import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  ToastAndroid,
  View,
} from 'react-native';
import { COLORS, RIPPLE, RIPPLE_LIGHT } from '../theme/colors';
import { useAppStore } from '../state/useAppStore';
import AdBanner from '../components/AdBanner';

export default function SettingsScreen({ navigation }) {
  const goals = useAppStore((s) => s.goals);
  const isPremium = useAppStore((s) => s.isPremium);
  const premiumUntil = useAppStore((s) => s.premiumUntil);
  const adsWatched = useAppStore((s) => s.adsWatched);
  const debugTogglePremium = useAppStore((s) => s.debugTogglePremium);
  const debugResetDay = useAppStore((s) => s.debugResetDay);
  const debugResetAll = useAppStore((s) => s.debugResetAll);

  // The debug section stays hidden until the version row is tapped 5 times.
  const [versionTaps, setVersionTaps] = useState(0);
  const debugUnlocked = versionTaps >= 5;

  const onVersionTap = () => {
    const next = versionTaps + 1;
    setVersionTaps(next);
    if (next < 5 && next >= 2) {
      ToastAndroid.show(`${5 - next} taps away from developer mode...`, ToastAndroid.SHORT);
    }
    if (next === 5) {
      ToastAndroid.show('🛠️ Developer mode unlocked!', ToastAndroid.SHORT);
    }
  };

  const tier = isPremium
    ? 'Premium (permanent)'
    : premiumUntil > Date.now()
      ? `Premium until ${new Date(premiumUntil).toLocaleDateString()}`
      : 'Free';

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Settings</Text>

        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <Row label="Current tier" value={tier} />
          <Row label="Rewarded ads watched" value={`${adsWatched} / 50`} />
          <Pressable
            android_ripple={RIPPLE}
            style={styles.linkBtn}
            onPress={() => navigation.navigate('Paywall')}
          >
            <Text style={styles.linkText}>View Premium options →</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Daily Goals</Text>
        <View style={styles.card}>
          <Row label="Calories" value={`${goals.calories} kcal`} />
          <Row label="Protein" value={`${goals.protein} g`} />
          <Row label="Carbs" value={`${goals.carbs} g`} />
          <Row label="Fat" value={`${goals.fat} g`} />
          <Row label="Water" value={`${goals.waterCups} cups`} />
        </View>

        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.card}>
          <Pressable android_ripple={RIPPLE} onPress={onVersionTap} style={styles.versionRow}>
            <Text style={styles.rowLabel}>Version</Text>
            <Text style={styles.rowValue}>1.0.0 (Android)</Text>
          </Pressable>
        </View>

        {debugUnlocked && (
          <>
            <Text style={[styles.sectionTitle, { color: COLORS.warning }]}>
              🛠️ Developer Tools
            </Text>
            <View style={[styles.card, styles.debugCard]}>
              <Pressable
                android_ripple={RIPPLE_LIGHT}
                style={styles.debugBtn}
                onPress={() => {
                  debugTogglePremium();
                  ToastAndroid.show(
                    isPremium ? 'Switched to FREE tier' : 'Switched to PREMIUM tier',
                    ToastAndroid.SHORT
                  );
                }}
              >
                <Text style={styles.debugBtnText}>
                  Toggle Premium (currently: {isPremium ? 'ON' : 'OFF'})
                </Text>
              </Pressable>
              <Pressable
                android_ripple={RIPPLE_LIGHT}
                style={[styles.debugBtn, { backgroundColor: COLORS.surfaceAlt }]}
                onPress={() => {
                  debugResetDay();
                  ToastAndroid.show('Daily progress & swipes reset', ToastAndroid.SHORT);
                }}
              >
                <Text style={styles.debugBtnText}>Reset Today (macros + swipes)</Text>
              </Pressable>
              <Pressable
                android_ripple={RIPPLE_LIGHT}
                style={[styles.debugBtn, { backgroundColor: '#46202C' }]}
                onPress={() => {
                  debugResetAll();
                  ToastAndroid.show('Everything reset to factory state', ToastAndroid.SHORT);
                }}
              >
                <Text style={[styles.debugBtnText, { color: COLORS.danger }]}>
                  Factory Reset (pet, ads, premium)
                </Text>
              </Pressable>
            </View>
          </>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
      <AdBanner />
    </View>
  );
}

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 16 },
  title: { color: COLORS.text, fontSize: 26, fontWeight: 'bold', marginBottom: 6 },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 18,
    marginBottom: 8,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
  },
  versionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
  },
  rowLabel: { color: COLORS.textDim, fontSize: 14 },
  rowValue: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  linkBtn: { marginTop: 8, paddingVertical: 8 },
  linkText: { color: COLORS.primary, fontWeight: 'bold' },
  debugCard: { borderWidth: 1, borderColor: COLORS.warning },
  debugBtn: {
    backgroundColor: COLORS.primaryDark,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginVertical: 5,
    overflow: 'hidden',
  },
  debugBtnText: { color: COLORS.text, fontWeight: 'bold', fontSize: 13 },
});
