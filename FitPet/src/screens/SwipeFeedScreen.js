import React, { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  ToastAndroid,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, RIPPLE, RIPPLE_LIGHT } from '../theme/colors';
import { useAppStore, FREE_DAILY_SWIPES } from '../state/useAppStore';
import { generateMealCards } from '../data/meals';
import AdBanner from '../components/AdBanner';

const { width: SCREEN_W } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_W * 0.28;

export default function SwipeFeedScreen({ navigation }) {
  const daily = useAppStore((s) => s.daily);
  const goals = useAppStore((s) => s.goals);
  const isPremium = useAppStore((s) => s.isPremium);
  const premiumUntil = useAppStore((s) => s.premiumUntil);
  const logMeal = useAppStore((s) => s.logMeal);
  const syncDay = useAppStore((s) => s.syncDay);

  const hasPremium = isPremium || premiumUntil > Date.now();
  const swipesLeft = hasPremium
    ? Infinity
    : Math.max(0, FREE_DAILY_SWIPES - daily.swipesUsed);
  const remaining = {
    calories: Math.max(0, goals.calories - daily.calories),
    protein: Math.max(0, goals.protein - daily.protein),
    carbs: Math.max(0, goals.carbs - daily.carbs),
    fat: Math.max(0, goals.fat - daily.fat),
  };

  const [cards, setCards] = useState([]);
  const position = useRef(new Animated.ValueXY()).current;

  // Refs so the PanResponder (created once) always sees fresh values.
  const cardsRef = useRef(cards);
  cardsRef.current = cards;
  const canMatchRef = useRef(swipesLeft > 0);
  canMatchRef.current = swipesLeft > 0;

  const refillCards = useCallback(() => {
    const { daily: d, goals: g } = useAppStore.getState();
    setCards(
      generateMealCards(
        {
          calories: Math.max(0, g.calories - d.calories),
          protein: Math.max(0, g.protein - d.protein),
          carbs: Math.max(0, g.carbs - d.carbs),
          fat: Math.max(0, g.fat - d.fat),
        },
        10
      )
    );
  }, []);

  useFocusEffect(
    useCallback(() => {
      syncDay();
      refillCards();
    }, [syncDay, refillCards])
  );

  const popCard = useCallback(() => {
    setCards((prev) => {
      const next = prev.slice(1);
      return next.length === 0 ? prev.slice(1) : next;
    });
    position.setValue({ x: 0, y: 0 });
  }, [position]);

  const completeSwipe = useCallback(
    (direction) => {
      const card = cardsRef.current[0];
      Animated.timing(position, {
        toValue: { x: direction * SCREEN_W * 1.3, y: 40 },
        duration: 220,
        useNativeDriver: true,
      }).start(() => {
        if (direction === 1 && card) {
          logMeal(card, { countsAsSwipe: true });
          ToastAndroid.show(`🎉 Match! ${card.name} logged & fed to your pet`, ToastAndroid.SHORT);
        }
        popCard();
        if (cardsRef.current.length <= 2) refillCards();
      });
    },
    [logMeal, popCard, position, refillCards]
  );

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_, g) => {
        position.setValue({ x: g.dx, y: g.dy * 0.2 });
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx > SWIPE_THRESHOLD) {
          if (canMatchRef.current) {
            completeSwipe(1);
          } else {
            // Out of free matches: bounce back and send to paywall.
            Animated.spring(position, {
              toValue: { x: 0, y: 0 },
              useNativeDriver: true,
            }).start();
            navigation.navigate('Paywall');
          }
        } else if (g.dx < -SWIPE_THRESHOLD) {
          completeSwipe(-1);
        } else {
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            friction: 6,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_W, 0, SCREEN_W],
    outputRange: ['-18deg', '0deg', '18deg'],
  });
  const eatOpacity = position.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const skipOpacity = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const topCard = cards[0];
  const nextCard = cards[1];

  return (
    <View style={styles.root}>
      {/* Budget header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Swipe to Eat</Text>
          <Text style={styles.headerSub}>
            {remaining.calories} kcal left · P {remaining.protein}g · C {remaining.carbs}g · F {remaining.fat}g
          </Text>
        </View>
        <View style={[styles.swipePill, swipesLeft === 0 && styles.swipePillEmpty]}>
          <Text style={styles.swipePillText}>
            {hasPremium ? '∞ swipes' : `${swipesLeft}/${FREE_DAILY_SWIPES} matches`}
          </Text>
        </View>
      </View>

      {/* Card stack */}
      <View style={styles.deck}>
        {nextCard && (
          <View style={[styles.card, styles.cardBehind]}>
            <Text style={styles.cardEmoji}>{nextCard.emoji}</Text>
          </View>
        )}

        {topCard ? (
          <Animated.View
            {...panResponder.panHandlers}
            style={[
              styles.card,
              {
                transform: [
                  { translateX: position.x },
                  { translateY: position.y },
                  { rotate },
                ],
              },
            ]}
          >
            <Animated.View style={[styles.stamp, styles.stampEat, { opacity: eatOpacity }]}>
              <Text style={styles.stampText}>EAT IT 😋</Text>
            </Animated.View>
            <Animated.View style={[styles.stamp, styles.stampSkip, { opacity: skipOpacity }]}>
              <Text style={styles.stampText}>SKIP 🙅</Text>
            </Animated.View>

            <Text style={styles.cardEmoji}>{topCard.emoji}</Text>
            <Text style={styles.cardName}>{topCard.name}</Text>
            <Text style={styles.cardPortion}>{topCard.portion}x portion · fits your budget</Text>

            <View style={styles.macroRow}>
              <MacroChip label="kcal" value={topCard.calories} color={COLORS.accent} />
              <MacroChip label="protein" value={`${topCard.protein}g`} color={COLORS.primary} />
              <MacroChip label="carbs" value={`${topCard.carbs}g`} color={COLORS.gold} />
              <MacroChip label="fat" value={`${topCard.fat}g`} color={COLORS.warning} />
            </View>

            <View style={styles.tagRow}>
              {topCard.tags.map((t) => (
                <Text key={t} style={styles.tag}>
                  {t}
                </Text>
              ))}
            </View>
          </Animated.View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardEmoji}>🍽️</Text>
            <Text style={styles.cardName}>Cooking up meals...</Text>
            <Pressable android_ripple={RIPPLE} style={styles.refreshBtn} onPress={refillCards}>
              <Text style={styles.refreshText}>Refresh feed</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Manual buttons (Android Material-style FAB row) */}
      <View style={styles.actionRow}>
        <Pressable
          android_ripple={RIPPLE_LIGHT}
          style={[styles.fab, styles.fabSkip]}
          onPress={() => topCard && completeSwipe(-1)}
        >
          <Text style={styles.fabText}>✕</Text>
        </Pressable>
        <Pressable
          android_ripple={RIPPLE_LIGHT}
          style={[styles.fab, styles.fabEat]}
          onPress={() => {
            if (!topCard) return;
            if (swipesLeft > 0) completeSwipe(1);
            else navigation.navigate('Paywall');
          }}
        >
          <Text style={styles.fabText}>🍴</Text>
        </Pressable>
      </View>

      {/* Out-of-swipes banner */}
      {!hasPremium && swipesLeft === 0 && (
        <Pressable
          android_ripple={RIPPLE_LIGHT}
          style={styles.upsell}
          onPress={() => navigation.navigate('Paywall')}
        >
          <Text style={styles.upsellText}>
            😿 Out of free matches today — go Premium for unlimited swipes!
          </Text>
        </Pressable>
      )}

      <AdBanner />
    </View>
  );
}

function MacroChip({ label, value, color }) {
  return (
    <View style={[chipStyles.chip, { borderColor: color }]}>
      <Text style={[chipStyles.value, { color }]}>{value}</Text>
      <Text style={chipStyles.label}>{label}</Text>
    </View>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
    minWidth: 64,
  },
  value: { fontWeight: 'bold', fontSize: 15 },
  label: { color: COLORS.textDim, fontSize: 10 },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  headerTitle: { color: COLORS.text, fontSize: 22, fontWeight: 'bold' },
  headerSub: { color: COLORS.textDim, fontSize: 12, marginTop: 2 },
  swipePill: {
    backgroundColor: COLORS.primaryDark,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  swipePillEmpty: { backgroundColor: COLORS.danger },
  swipePillText: { color: COLORS.text, fontWeight: 'bold', fontSize: 12 },
  deck: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: {
    position: 'absolute',
    width: SCREEN_W - 48,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    elevation: 10,
    borderWidth: 1,
    borderColor: COLORS.outline,
  },
  cardBehind: { transform: [{ scale: 0.94 }, { translateY: 14 }], opacity: 0.5 },
  cardEmoji: { fontSize: 84, marginVertical: 8 },
  cardName: { color: COLORS.text, fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
  cardPortion: { color: COLORS.textDim, fontSize: 12, marginTop: 4, marginBottom: 14 },
  macroRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  tagRow: { flexDirection: 'row', gap: 6, marginTop: 14, flexWrap: 'wrap', justifyContent: 'center' },
  tag: {
    color: COLORS.textDim,
    fontSize: 11,
    backgroundColor: COLORS.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: 'hidden',
  },
  stamp: {
    position: 'absolute',
    top: 18,
    borderWidth: 3,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    zIndex: 5,
  },
  stampEat: { left: 18, borderColor: COLORS.accent, transform: [{ rotate: '-14deg' }] },
  stampSkip: { right: 18, borderColor: COLORS.danger, transform: [{ rotate: '14deg' }] },
  stampText: { color: COLORS.text, fontWeight: 'bold', fontSize: 16 },
  refreshBtn: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 10,
    overflow: 'hidden',
  },
  refreshText: { color: COLORS.text, fontWeight: 'bold' },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 36,
    paddingVertical: 14,
  },
  fab: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    overflow: 'hidden',
  },
  fabSkip: { backgroundColor: COLORS.surface, borderWidth: 2, borderColor: COLORS.danger },
  fabEat: { backgroundColor: COLORS.accent },
  fabText: { fontSize: 24, color: COLORS.text },
  upsell: {
    backgroundColor: COLORS.primaryDark,
    margin: 12,
    marginTop: 0,
    borderRadius: 14,
    padding: 14,
    overflow: 'hidden',
  },
  upsellText: { color: COLORS.text, textAlign: 'center', fontWeight: '600', fontSize: 13 },
});
