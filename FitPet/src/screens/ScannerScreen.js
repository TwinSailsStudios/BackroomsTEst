import React, { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  ToastAndroid,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, RIPPLE_LIGHT } from '../theme/colors';
import { useAppStore } from '../state/useAppStore';
import { SCANNER_RESULTS } from '../data/meals';
import PetAvatar from '../components/PetAvatar';

/**
 * AI Photo Plate Scanner (Premium).
 * Picks a photo, the pet "scans" it for 2.5s, then returns a simulated
 * macro estimate. Swap the setTimeout for a real vision-model API call
 * (e.g. the Claude API with an image block) when you're ready.
 */
export default function ScannerScreen({ navigation }) {
  const pet = useAppStore((s) => s.pet);
  const logMeal = useAppStore((s) => s.logMeal);
  const [photo, setPhoto] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      ToastAndroid.show('Photo permission is needed to scan meals', ToastAndroid.SHORT);
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.6,
    });
    if (picked.canceled) return;

    setPhoto(picked.assets[0].uri);
    setResult(null);
    setScanning(true);
    setTimeout(() => {
      const guess = SCANNER_RESULTS[Math.floor(Math.random() * SCANNER_RESULTS.length)];
      setResult(guess);
      setScanning(false);
    }, 2500);
  };

  const logResult = () => {
    logMeal(result);
    ToastAndroid.show(`✅ ${result.name} logged from photo!`, ToastAndroid.SHORT);
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>
      <Text style={styles.title}>AI Plate Scanner 🥽</Text>
      <Text style={styles.subtitle}>
        {scanning
          ? `${pet.name} is analyzing every pixel...`
          : `${pet.name} puts on the goggles. Show us your plate!`}
      </Text>

      <PetAvatar health={pet.health} energy={pet.energy} scanning size={90} />

      {photo && (
        <View style={styles.photoWrap}>
          <Image source={{ uri: photo }} style={styles.photo} />
          {scanning && (
            <View style={styles.scanOverlay}>
              <Text style={styles.scanText}>SCANNING ▒▒▒▒</Text>
            </View>
          )}
        </View>
      )}

      {result && !scanning && (
        <View style={styles.resultCard}>
          <Text style={styles.resultEmoji}>{result.emoji}</Text>
          <Text style={styles.resultName}>{result.name}</Text>
          <Text style={styles.resultMacros}>
            {result.calories} kcal · P {result.protein}g · C {result.carbs}g · F {result.fat}g
          </Text>
          <Pressable android_ripple={RIPPLE_LIGHT} style={styles.logBtn} onPress={logResult}>
            <Text style={styles.logText}>Log it & feed {pet.name} 🍴</Text>
          </Pressable>
        </View>
      )}

      <Pressable
        android_ripple={RIPPLE_LIGHT}
        style={[styles.pickBtn, scanning && { opacity: 0.5 }]}
        onPress={pickPhoto}
        disabled={scanning}
      >
        <Text style={styles.pickText}>{photo ? '📷 Scan another plate' : '📷 Pick a meal photo'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 20, alignItems: 'center', paddingBottom: 40 },
  title: { color: COLORS.text, fontSize: 26, fontWeight: 'bold' },
  subtitle: { color: COLORS.textDim, fontSize: 13, marginVertical: 8, textAlign: 'center' },
  photoWrap: { marginTop: 16, borderRadius: 18, overflow: 'hidden', elevation: 6 },
  photo: { width: 260, height: 200 },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(124, 92, 255, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanText: { color: COLORS.text, fontWeight: 'bold', letterSpacing: 3 },
  resultCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    marginTop: 18,
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  resultEmoji: { fontSize: 44 },
  resultName: { color: COLORS.text, fontSize: 19, fontWeight: 'bold', marginTop: 4 },
  resultMacros: { color: COLORS.textDim, fontSize: 13, marginTop: 4 },
  logBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 24,
    marginTop: 14,
    overflow: 'hidden',
  },
  logText: { color: '#0E0F1A', fontWeight: 'bold' },
  pickBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 30,
    marginTop: 22,
    overflow: 'hidden',
    elevation: 5,
  },
  pickText: { color: COLORS.text, fontWeight: 'bold', fontSize: 15 },
});
