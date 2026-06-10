import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { COLORS } from './src/theme/colors';
import DashboardScreen from './src/screens/DashboardScreen';
import SwipeFeedScreen from './src/screens/SwipeFeedScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import PaywallScreen from './src/screens/PaywallScreen';
import ScannerScreen from './src/screens/ScannerScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: COLORS.bg,
    card: COLORS.surfaceAlt,
    text: COLORS.text,
    primary: COLORS.primary,
    border: COLORS.outline,
  },
};

const TAB_ICONS = {
  Dashboard: '🐾',
  Discover: '🍴',
  Settings: '⚙️',
};

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textDim,
        tabBarStyle: {
          backgroundColor: COLORS.surfaceAlt,
          borderTopColor: COLORS.outline,
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        // Material-style ripple on Android tab presses.
        tabBarButtonTestID: `tab-${route.name}`,
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>
            {TAB_ICONS[route.name]}
          </Text>
        ),
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'My Pet' }} />
      <Tab.Screen name="Discover" component={SwipeFeedScreen} options={{ title: 'Swipe to Eat' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navTheme}>
        <StatusBar style="light" backgroundColor={COLORS.bg} />
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: COLORS.surfaceAlt },
            headerTintColor: COLORS.text,
            animation: 'slide_from_bottom', // snappy Material-style modal transition
          }}
        >
          <Stack.Screen name="Main" component={Tabs} options={{ headerShown: false }} />
          <Stack.Screen
            name="Paywall"
            component={PaywallScreen}
            options={{ presentation: 'modal', title: 'FitPet Premium' }}
          />
          <Stack.Screen
            name="Scanner"
            component={ScannerScreen}
            options={{ presentation: 'modal', title: 'Plate Scanner' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
