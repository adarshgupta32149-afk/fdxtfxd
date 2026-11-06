import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { MenuShell } from '@/components/SideMenu';
import { I18nProvider } from '@/i18n';
import { AppStateProvider } from '@/state/AppStateProvider';
import { SocialProvider } from '@/state/SocialProvider';
import { colors, display, font } from '@/theme';

// Keep the splash screen up until the fonts have loaded, so text never jumps between fonts.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [loaded, error] = useFonts([
    {
      fontFamily: font,
      fontDefinitions: [
        {
          path: require('@expo-google-fonts/manrope/400Regular/Manrope_400Regular.ttf'),
          weight: 400,
          style: 'normal',
        },
        {
          path: require('@expo-google-fonts/manrope/500Medium/Manrope_500Medium.ttf'),
          weight: 500,
          style: 'normal',
        },
        {
          path: require('@expo-google-fonts/manrope/600SemiBold/Manrope_600SemiBold.ttf'),
          weight: 600,
          style: 'normal',
        },
        {
          path: require('@expo-google-fonts/manrope/700Bold/Manrope_700Bold.ttf'),
          weight: 700,
          style: 'normal',
        },
        {
          path: require('@expo-google-fonts/manrope/800ExtraBold/Manrope_800ExtraBold.ttf'),
          weight: 800,
          style: 'normal',
        },
      ],
    },
    {
      fontFamily: display,
      fontDefinitions: [
        {
          path: require('@expo-google-fonts/barlow-condensed/500Medium/BarlowCondensed_500Medium.ttf'),
          weight: 500,
          style: 'normal',
        },
        {
          path: require('@expo-google-fonts/barlow-condensed/600SemiBold/BarlowCondensed_600SemiBold.ttf'),
          weight: 600,
          style: 'normal',
        },
        {
          path: require('@expo-google-fonts/barlow-condensed/700Bold/BarlowCondensed_700Bold.ttf'),
          weight: 700,
          style: 'normal',
        },
      ],
    },
  ]);

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync().catch(() => {});
  }, [loaded, error]);

  // If a font fails to load, carry on with the system font rather than blocking the app.
  if (!loaded && !error) return null;

  return (
    <I18nProvider>
      <AppStateProvider>
        <StatusBar style="light" />
        <SocialProvider>
          <MenuShell>
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: colors.bg },
                headerTintColor: colors.text,
                headerTitleStyle: {
                  fontFamily: display,
                  fontWeight: '600',
                  fontSize: 22,
                },
                headerShadowVisible: false,
                headerBackButtonDisplayMode: 'minimal',
                contentStyle: { backgroundColor: colors.bg },
                animation: 'slide_from_right',
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="welcome"
                options={{
                  headerShown: false,
                  animation: 'fade',
                  gestureEnabled: false,
                }}
              />
              <Stack.Screen name="history" options={{ title: '', headerTransparent: true }} />
              <Stack.Screen name="skills" options={{ title: '', headerTransparent: true }} />
              <Stack.Screen name="records" options={{ title: '', headerTransparent: true }} />
              <Stack.Screen name="profile" options={{ title: '', headerTransparent: true }} />
              <Stack.Screen
                name="workout/new"
                options={{
                  headerShown: false,
                  presentation: 'modal',
                  animation: 'slide_from_bottom',
                }}
              />
              <Stack.Screen name="workout/[id]" options={{ title: '', headerTransparent: true }} />
              <Stack.Screen name="shorts/new" options={{ title: '', presentation: 'modal', headerTransparent: true, animation: 'slide_from_bottom' }} />
              <Stack.Screen name="feed/new" options={{ title: '', presentation: 'modal', headerTransparent: true, animation: 'slide_from_bottom' }} />
              <Stack.Screen name="feed/[id]" options={{ title: '', headerTransparent: true }} />
              <Stack.Screen name="messages/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="language" options={{ title: '', headerTransparent: true }} />
              <Stack.Screen name="ranking" options={{ title: '', headerTransparent: true }} />
              <Stack.Screen name="compete" options={{ title: '', headerTransparent: true }} />
              <Stack.Screen name="learn/[id]" options={{ title: '', headerTransparent: true }} />
              <Stack.Screen name="learn/video/[id]" options={{ title: '', headerTransparent: true }} />
              <Stack.Screen
                name="paywall"
                options={{
                  title: '',
                  presentation: 'modal',
                  headerTransparent: true,
                  animation: 'slide_from_bottom',
                }}
              />
              <Stack.Screen
                name="sign-in"
                options={{
                  title: '',
                  presentation: 'modal',
                  headerTransparent: true,
                  animation: 'slide_from_bottom',
                }}
              />
            </Stack>
          </MenuShell>
        </SocialProvider>
      </AppStateProvider>
    </I18nProvider>
  );
}
