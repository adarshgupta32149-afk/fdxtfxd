# Cali (working title)

A calisthenics training app: log workouts, track skill progressions (muscle-up,
handstand, front lever, planche, pistol, L-sit), see personal records, and,
from launch, compete on video-verified leaderboards.

Built with Expo SDK 58, Expo Router and TypeScript. Android and iOS share one codebase.

## What works now (MVP, offline)
- **Log workouts**: 27 exercises (calisthenics + main barbell lifts), reps or timed holds, optional added weight.
- **Skills**: 6 progressions, 32 steps. Steps with a measurable target unlock automatically from your logs; others are ticked off by hand.
- **Records**: max reps, longest holds, heaviest load, estimated 1-rep max for lifts, and a preview of the leaderboard categories.
- **60-day free trial**: after it ends, logging locks but all history stays viewable. Moving the phone clock back does not extend it.
- **Founder Pass screen**: ₹500/yr (India), $10/yr (worldwide). Checkout is not wired up yet.

Everything is stored on the phone (AsyncStorage). There is no backend or account yet.

## Run it on your phone
You need a computer with Node.js 20+ and the **Expo Go** app on your phone.

```bash
cd cali-app
npm install
npx expo start
```

Scan the QR code with Expo Go (Android) or the Camera app (iPhone). Your phone and computer must be on the same Wi-Fi.

In development builds the Profile tab shows **Developer tools** to simulate Pro, age the trial by 30 days, or restart it.

## Checks
```bash
npm test           # unit tests for trial, records, skills, storage
npm run typecheck
npm run lint
npx expo-doctor
```

## Not built yet
- Accounts (phone/WhatsApp verification) and a Supabase backend
- Server-side trial tracking (the local trial resets if the app is reinstalled)
- Real payments (Google Play / App Store subscriptions via RevenueCat)
- Global and city leaderboards with video verification
- AI coach

## Code map
- `src/lib/`: pure logic with no React Native imports (types, exercises, skills, records, trial, state). Unit-tested in `src/lib/__tests__/`.
- `src/state/AppStateProvider.tsx`: loads and saves app state; exposes actions.
- `src/app/`: screens (Expo Router). `(tabs)/` holds the five tabs.
- `src/components/`: shared UI.
