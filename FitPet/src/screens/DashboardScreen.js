import React, { useCallback } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  ToastAndroid,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, RIPPLE, RIPPLE_LIGHT } from '../theme/colors';
import { useAppStore, xpForLevel } from '../state/useAppStore';
import { QUICK_MEALS } from '../data/meals';
import PetAvatar from '../components/PetAvatar';
import StatBar from '../components/StatBar';
import AdBanner from '../components/AdBanner';

export default function DashboardScreen({ navigation }) {
  const pet = useAppStore((s) => s.pet);
  const daily = useAppStore((s) => s.daily);
  const goals = useAppStore((s) => s.goals);
  const isPremium = useAppStore((s) => s.isPremium);
  const premiumUntil = useAppStore((s) => s.premiumUntil);
  const logMeal = useAppStore((s) => s.logMeal);
  const logWater = useAppStore((s) => s.logWater);
  const syncDay = useAppStore((s) => s.syncDay);

  const hasPremium = isPremium || premiumUntil > Date.now();

  // Roll the day over (and apply pet decay) whenever this screen gains focus.
  useFocusEffect(
    useCallback(() => {
      syncDay();
    }, [syncDay])
  );

  const onQuickLog = (meal) => {
    logMeal(meal);
    ToastAndroid.show(`${meal.emoji} ${meal.name} logged! ${pet.name} is munching...`, ToastAndroid.SHORT);
  };

  const onWater = () => {
    logWater();
    ToastAndroid.show(`💧 Glug glug! +6 energy for ${pet.name}`, ToastAndroid.SHORT);
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.petName}>{pet.name}</Text>
            <Text style={styles.levelText}>Lv. {pet.level} Fitness Pet</Text>
          </View>
          <View style={[styles.tierBadge, hasPremium && styles.tierBadgePremium]}>
            <Text style={styles.tierText}>{hasPremium ? '★ PREMIUM' : 'FREE TIER'}</Text>
          </View>
        </View>

        {/* The Pet */}
        <PetAvatar health={pet.health} energy={pet.energy} />

        {/* RPG stats */}
        <View style={styles.card}>
          <StatBar label="HEALTH" value={pet.health} max={100} color={COLORS.danger} />
          <StatBar label="ENERGY" value={pet.energy} max={100} color={COLORS.warning} />
          <StatBar label="XP" value={pet.xp} max={xpForLevel(pet.level)} color={COLORS.primary} />
        </View>

        {/* Daily budget */}
        <Text style={styles.sectionTitle}>Today's Budget</Text>
        <View style={styles.card}>
          <StatBar label="CALORIES" value={daily.calories} max={goals.calories} color={COLORS.accent} />
          <StatBar label="PROTEIN" value={daily.protein} max={goals.protein} color={COLORS.primary} suffix="g" />
          <StatBar label="CARBS" value={daily.carbs} max={goals.carbs} color={COLORS.gold} suffix="g" />
          <StatBar label="FAT" value={daily.fat} max={goals.fat} color={COLORS.warning} suffix="g" />
          <StatBar label="WATER" value={daily.waterCups} max={goals.waterCups} color={COLORS.water} suffix=" cups" />
        </View>

        {/* Manual logger */}
        <Text style={styles.sectionTitle}>Feed {pet.name}</Text>
        <View style={styles.quickRow}>
          {QUICK_MEALS.map((meal) => (
            <Pressable
              key={meal.name}
              android_ripple={RIPPLE}
              style={styles.quickBtn}
              onPress={() => onQuickLog(meal)}
            >
              <Text style={styles.quickEmoji}>{meal.emoji}</Text>
              <Text style={styles.quickName}>{meal.name}</Text>
              <Text style={styles.quickCals}>{meal.calories} kcal</Text>
            </Pressable>
          ))}
        </View>
        <Pressable android_ripple={RIPPLE_LIGHT} style={styles.waterBtn} onPress={onWater}>
          <Text style={styles.waterText}>💧 Drink a cup of water (+6 energy)</Text>
        </Pressable>

        {/* Premium feature entry point */}
        <Pressable
          android_ripple={RIPPLE_LIGHT}
          style={[styles.scannerBtn, !hasPremium && styles.scannerLocked]}
          onPress={() => navigation.navigate(hasPremium ? 'Scanner' : 'Paywall')}
        >
          <Text style={styles.scannerEmoji}>🥽</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.scannerTitle}>AI Photo Plate Scanner</Text>
            <Text style={styles.scannerSub}>
              {hasPremium
                ? `${pet.name} puts on the goggles and analyzes your meal photo`
                : 'Premium feature — tap to unlock'}
            </Text>
          </View>
          {!hasPremium && <Text style={styles.lockIcon}>🔒</Text>}
        </Pressable>

        <View style={{ height: 16 }} />
      </ScrollView>
      <AdBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 16, paddingBottom: 8 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  petName: { color: COLORS.text, fontSize: 26, fontWeight: 'bold' },
  levelText: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },
  tierBadge: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.outline,
  },
  tierBadgePremium: { backgroundColor: COLORS.primaryDark, borderColor: COLORS.gold },
  tierText: { color: COLORS.text, fontSize: 11, fontWeight: 'bold' },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    marginTop: 10,
    elevation: 4,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 18,
  },
  quickRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  quickBtn: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    overflow: 'hidden',
    elevation: 3,
  },
  quickEmoji: { fontSize: 26 },
  quickName: { color: COLORS.text, fontSize: 11, fontWeight: '600', marginTop: 4 },
  quickCals: { color: COLORS.textDim, fontSize: 10 },
  waterBtn: {
    backgroundColor: '#173A52',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.water,
  },
  waterText: { color: COLORS.water, fontWeight: 'bold' },
  scannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.primaryDark,
    borderRadius: 16,
    padding: 14,
    marginTop: 18,
    overflow: 'hidden',
    elevation: 4,
  },
  scannerLocked: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.outline },
  scannerEmoji: { fontSize: 30 },
  scannerTitle: { color: COLORS.text, fontWeight: 'bold', fontSize: 15 },
  scannerSub: { color: COLORS.textDim, fontSize: 12, marginTop: 2 },
  lockIcon: { fontSize: 20 },
});
