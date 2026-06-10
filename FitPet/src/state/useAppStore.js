import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const FREE_DAILY_SWIPES = 3;
export const ADS_FOR_FREE_WEEK = 50;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

export const todayKey = () => {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};

// XP needed to go from `level` to `level + 1`.
export const xpForLevel = (level) => 100 + (level - 1) * 50;

const freshDay = () => ({
  dateKey: todayKey(),
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  waterCups: 0,
  swipesUsed: 0,
  mealsLogged: [],
});

const initialState = {
  // --- Monetization ---
  isPremium: false, // permanent premium (purchase or debug toggle)
  premiumUntil: 0, // timestamp; temporary premium from the rewarded-ad loop
  adsWatched: 0, // progress toward ADS_FOR_FREE_WEEK

  // --- Pet ---
  pet: {
    name: 'Munchie',
    level: 1,
    xp: 0,
    health: 80, // 0-100, driven by food logging
    energy: 60, // 0-100, driven by water logging
    lastSeenDateKey: todayKey(),
  },

  // --- Daily goals ---
  goals: {
    calories: 2200,
    protein: 140,
    carbs: 230,
    fat: 70,
    waterCups: 8,
  },

  // --- Today's progress ---
  daily: freshDay(),
};

export const useAppStore = create(
  persist(
    (set, get) => ({
      ...initialState,

      hasPremium: () => {
        const s = get();
        return s.isPremium || s.premiumUntil > Date.now();
      },

      swipesLeft: () => {
        const s = get();
        if (s.hasPremium()) return Infinity;
        return Math.max(0, FREE_DAILY_SWIPES - s.daily.swipesUsed);
      },

      remainingMacros: () => {
        const { goals, daily } = get();
        return {
          calories: Math.max(0, goals.calories - daily.calories),
          protein: Math.max(0, goals.protein - daily.protein),
          carbs: Math.max(0, goals.carbs - daily.carbs),
          fat: Math.max(0, goals.fat - daily.fat),
        };
      },

      // Called on app start / focus. Rolls the day over and applies
      // overnight pet decay so neglecting the pet has consequences.
      syncDay: () =>
        set((s) => {
          if (s.daily.dateKey === todayKey()) return s;
          const missedMeals = s.daily.mealsLogged.length === 0;
          const missedWater = s.daily.waterCups < Math.ceil(s.goals.waterCups / 2);
          return {
            daily: freshDay(),
            pet: {
              ...s.pet,
              health: clamp(s.pet.health - (missedMeals ? 25 : 10), 5, 100),
              energy: clamp(s.pet.energy - (missedWater ? 30 : 15), 5, 100),
              lastSeenDateKey: todayKey(),
            },
          };
        }),

      logMeal: (meal, { countsAsSwipe = false } = {}) =>
        set((s) => {
          const gainedXp = 15;
          let { level, xp } = s.pet;
          xp += gainedXp;
          while (xp >= xpForLevel(level)) {
            xp -= xpForLevel(level);
            level += 1;
          }
          return {
            daily: {
              ...s.daily,
              calories: s.daily.calories + meal.calories,
              protein: s.daily.protein + meal.protein,
              carbs: s.daily.carbs + meal.carbs,
              fat: s.daily.fat + meal.fat,
              swipesUsed: countsAsSwipe ? s.daily.swipesUsed + 1 : s.daily.swipesUsed,
              mealsLogged: [
                ...s.daily.mealsLogged,
                { ...meal, loggedAt: Date.now() },
              ],
            },
            pet: {
              ...s.pet,
              level,
              xp,
              health: clamp(s.pet.health + 8, 0, 100),
              energy: clamp(s.pet.energy + 3, 0, 100),
            },
          };
        }),

      logWater: () =>
        set((s) => {
          let { level, xp } = s.pet;
          xp += 5;
          while (xp >= xpForLevel(level)) {
            xp -= xpForLevel(level);
            level += 1;
          }
          return {
            daily: { ...s.daily, waterCups: s.daily.waterCups + 1 },
            pet: {
              ...s.pet,
              level,
              xp,
              energy: clamp(s.pet.energy + 6, 0, 100),
              health: clamp(s.pet.health + 1, 0, 100),
            },
          };
        }),

      // Rewarded-ad loop: each simulated ad ticks the counter; at
      // ADS_FOR_FREE_WEEK the user gets 7 days of premium.
      registerAdWatched: () => {
        let unlocked = false;
        set((s) => {
          const adsWatched = s.adsWatched + 1;
          if (adsWatched >= ADS_FOR_FREE_WEEK) {
            unlocked = true;
            return { adsWatched: 0, premiumUntil: Date.now() + WEEK_MS };
          }
          return { adsWatched };
        });
        return unlocked;
      },

      purchasePremium: () => set({ isPremium: true }),

      // Hidden debug switch (Settings screen) for testing both UI states.
      debugTogglePremium: () =>
        set((s) => ({ isPremium: !s.isPremium, premiumUntil: 0 })),

      debugResetDay: () => set({ daily: freshDay() }),

      debugResetAll: () => set({ ...initialState, daily: freshDay() }),
    }),
    {
      name: 'fitpet-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
