# FitPet 🐾 — Fitness Pet RPG (Android)

A gamified calorie tracker where a digital pet's health, energy, and level
are tied to your real eating habits, plus a Tinder-style "Swipe-to-Eat"
feed that generates meals fitting exactly into your remaining macros.

Built with **React Native + Expo (SDK 53)**, Android-only.

## Run it on your phone

1. Install **Expo Go** from the Google Play Store on your Android phone.
2. On your computer:

   ```bash
   cd FitPet
   npm install
   npx expo start
   ```

3. Scan the QR code in the terminal with the Expo Go app
   (phone and computer must be on the same Wi-Fi; if not, run
   `npx expo start --tunnel` instead).

To launch on a connected Android emulator/device with ADB:

```bash
npx expo start --android
```

## Features

| Tier | Features |
| --- | --- |
| Free | Pet RPG dashboard, manual food/water logger, 3 daily Swipe Matches, AdMob banner placeholder |
| Premium | Unlimited swipes, AI Photo Plate Scanner (pet wears goggles 🥽), zero ads |

- **Rewarded Ad Loop** — Paywall screen has a "Watch 50 Ads → Free Premium
  Week" counter. Each simulated ad ticks it up; hitting 50 grants 7 days of
  premium (stored as a timestamp).
- **Hidden debug menu** — Settings → tap the **Version** row 5 times to
  reveal Developer Tools: Toggle Premium, Reset Today, Factory Reset.

## Project structure

```
FitPet/
├── App.js                     # Navigation root (stack + bottom tabs)
├── index.js                   # Expo entry point
├── app.json                   # Android-only Expo config
└── src/
    ├── components/
    │   ├── AdBanner.js        # AdMob 320×50 banner placeholder
    │   ├── PetAvatar.js       # Animated pet w/ moods + scanner goggles
    │   └── StatBar.js         # Animated RPG stat bars
    ├── data/meals.js          # Meal templates + budget-fitting generator
    ├── screens/
    │   ├── DashboardScreen.js # Pet RPG home + manual logger
    │   ├── SwipeFeedScreen.js # Swipe-to-Eat card feed (PanResponder)
    │   ├── PaywallScreen.js   # Premium upsell + rewarded ad loop
    │   ├── ScannerScreen.js   # AI Plate Scanner (simulated, premium)
    │   └── SettingsScreen.js  # Goals + hidden debug toggles
    ├── state/useAppStore.js   # Zustand store, persisted to AsyncStorage
    └── theme/colors.js        # Dark game theme + Android ripple configs
```

## Going to production later

- **Ads**: swap `AdBanner` / the simulated rewarded ad for
  `react-native-google-mobile-ads` (requires an Expo dev build, not Expo Go).
- **Purchases**: wire the mock "Unlock Premium" button to Google Play
  Billing (`react-native-iap`).
- **AI Scanner**: replace the `setTimeout` in `ScannerScreen.js` with a
  real vision API call.
