import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../theme/colors';

/**
 * RPG-style stat bar with an animated fill.
 * `value` and `max` are numbers; `color` is the fill color.
 */
export default function StatBar({ label, value, max, color, suffix = '' }) {
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  const anim = useRef(new Animated.Value(pct)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: pct,
      duration: 450,
      useNativeDriver: false, // width animation requires layout driver
    }).start();
  }, [pct, anim]);

  const width = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { width, backgroundColor: color }]} />
      </View>
      <Text style={styles.value}>
        {Math.round(value)}/{max}
        {suffix}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginVertical: 5 },
  label: { color: COLORS.textDim, width: 64, fontSize: 12, fontWeight: '600' },
  track: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.surfaceAlt,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.outline,
  },
  fill: { height: '100%', borderRadius: 6 },
  value: { color: COLORS.text, width: 84, textAlign: 'right', fontSize: 12 },
});
