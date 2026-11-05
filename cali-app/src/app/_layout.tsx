import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { AppStateProvider } from '@/state/AppStateProvider';
import { colors, font } from '@/theme';

// Keep the splash screen up until Inter has loaded, so text never jumps between fonts.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [loaded, error] = useFonts([
    {
      fontFamily: font,
      fontDefinitions: [
        { path: require('@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf'), weight: 400, style: 'normal' },
        { path: require('@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf'), weight: 500, style: 'normal' },
        { path: require('@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf'), weight: 600, style: 'normal' },
        { path: require('@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf'), weight: 700, style: 'normal' },
      ],
    },
  ]);

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync().catch(() => {});
  }, [loaded, error]);

  // If the font fails to load, carry on with the system font rather than blocking the app.
  if (!loaded && !error) return null;

  return (
    <AppStateProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerTitleStyle: { fontFamily: font, fontWeight: '600', fontSize: 17 },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="workout/new" options={{ title: 'New workout', presentation: 'modal' }} />
        <Stack.Screen name="workout/[id]" options={{ title: 'Workout' }} />
        <Stack.Screen name="paywall" options={{ title: '', presentation: 'modal' }} />
        <Stack.Screen name="sign-in" options={{ title: '', presentation: 'modal' }} />
      </Stack>
    </AppStateProvider>
  );
}
