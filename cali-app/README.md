# Cali (working title)

A calisthenics training app: log workouts, track skill progressions (muscle-up,
handstand, front lever, planche, pistol, L-sit), see personal records, and,
from launch, compete on video-verified leaderboards.

Built with Expo SDK 58, Expo Router and TypeScript. Android and iOS share one codebase.

## What works now
- **Log workouts**: 27 exercises (calisthenics + main barbell lifts), reps or timed holds, optional added weight.
- **Skills**: 6 progressions, 32 steps. Steps with a measurable target unlock automatically from your logs; others are ticked off by hand.
- **Records**: max reps, longest holds, heaviest load, estimated 1-rep max for lifts.
- **60-day free trial**: after it ends, logging locks but all history stays viewable. Moving the phone clock back does not extend it.
- **Founder Pass screen**: ₹500/yr (India), $10/yr (worldwide). Checkout is not wired up yet.
- **Accounts (optional)**: sign in with an emailed 6-digit code. The app works fully offline without an account.
- **Sync**: workouts, hand-ticked skills and profile back up to the account and merge across phones. Changes made offline sync later.
- **Server-side trial**: once signed in, the trial start lives on the server. Reinstalling or switching phones can't reset it, and the server itself refuses new workouts after the trial (unless Pro).
- **World leaderboards (read-only)**: four boards showing the top video-verified scores.
- **Delete account** inside the app (an App Store requirement).

Data lives on the phone (AsyncStorage) and, when signed in, in Supabase.

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

## Backend (Supabase)
- Project: `cali-app` (`baiiqrpizllmkufvltrn`), region Mumbai (ap-south-1), free plan.
- Public settings are in `.env` (project URL + **publishable** key). These are safe to ship in the app.
  **Never** put the secret/service_role key in the app or this repo.
- Database changes live in `supabase/migrations/`. Tables: `profiles`, `workouts`, `skill_steps`,
  `leaderboard_entries`. Row-level security is on for every table:
  - users read and write only their own rows;
  - users can't change their own trial date or Pro status;
  - new workouts, steps and leaderboard entries are refused after the trial unless Pro;
  - leaderboard entries always start as `pending`; only verified ones appear publicly, via `get_leaderboard()`.
- `src/lib/database.types.ts` is generated from the live schema. Regenerate it after changing the database.

### Setup you need to do in the Supabase dashboard
1. **Make the email contain a code.** Authentication → Emails → Templates → **Magic Link**: add `{{ .Token }}`
   to the email body, e.g. `<p>Your Cali code: <strong>{{ .Token }}</strong></p>`. Without this, the email only has a link.
2. **Let testers sign in.** Until you add your own email sender (Authentication → Emails → SMTP, e.g. Resend),
   Supabase only emails addresses on your Supabase team, and only a few per hour.
3. Free projects **pause after ~7 days without activity**. Restore from the dashboard if that happens.

## Not built yet
- Submitting leaderboard scores with video proof (the database side is ready; the app UI isn't)
- Phone / WhatsApp sign-in and Google sign-in
- Making sign-in required (needed so the trial can't be reset by simply never signing in)
- Real payments (Google Play / App Store subscriptions via RevenueCat) and setting Pro on the server
- City leaderboards, yearly challenges, AI coach

## Code map
- `src/lib/`: pure logic with no React Native imports (types, exercises, skills, records, trial, state, sync).
  Unit-tested in `src/lib/__tests__/`.
- `src/lib/supabase.ts`: Supabase client (null when `.env` is missing, so the app still runs offline).
- `src/state/AppStateProvider.tsx`: loads and saves app state, tracks the signed-in account, runs sync; exposes actions.
- `src/app/`: screens (Expo Router). `(tabs)/` holds the five tabs; `sign-in.tsx` is the email-code sign-in.
- `src/components/`: shared UI.
