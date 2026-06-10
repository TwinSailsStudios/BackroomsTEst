import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../theme/colors';

const moodFor = (health, energy) => {
  const vitality = (health + energy) / 2;
  if (vitality >= 75) return { face: '😸', label: 'Thriving!' };
  if (vitality >= 50) return { face: '😺', label: 'Doing okay' };
  if (vitality >= 30) return { face: '😿', label: 'Hungry & tired...' };
  return { face: '🙀', label: 'Needs you badly!' };
};

/**
 * The Fitness Pet. Idle-bounces when healthy, droops when neglected.
 * Pass `scanning` to give it the AI scanner goggles (premium feature).
 */
export default function PetAvatar({ health, energy, scanning = false, size = 120 }) {
  const bounce = useRef(new Animated.Value(0)).current;
  const mood = moodFor(health, energy);
  const happy = (health + energy) / 2 >= 50;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, {
          toValue: 1,
          duration: happy ? 600 : 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(bounce, {
          toValue: 0,
          duration: happy ? 600 : 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [happy, bounce]);

  const translateY = bounce.interpolate({
    inputRange: [0, 1],
    outputRange: [0, happy ? -12 : -4],
  });

  return (
    <View style={styles.wrap}>
      <Animated.View style={{ transform: [{ translateY }] }}>
        <View style={[styles.petCircle, { width: size + 40, height: size + 40 }]}>
          <Text style={{ fontSize: size }}>{scanning ? '😼' : mood.face}</Text>
          {scanning && (
            <View style={styles.goggles}>
              <Text style={{ fontSize: size * 0.45 }}>🥽</Text>
            </View>
          )}
        </View>
      </Animated.View>
      <View style={styles.shadow} />
      <Text style={styles.moodLabel}>{scanning ? 'Scanning your plate...' : mood.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  petCircle: {
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.primary,
    elevation: 8,
  },
  goggles: {
    position: 'absolute',
    top: '18%',
  },
  shadow: {
    width: 90,
    height: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.45)',
    marginTop: 6,
  },
  moodLabel: {
    color: COLORS.textDim,
    marginTop: 8,
    fontSize: 14,
    fontStyle: 'italic',
  },
});
