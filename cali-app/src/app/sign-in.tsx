import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, TextInput } from 'react-native';

import { Body, Button, H1, Muted, Screen } from '@/components/ui';
import { friendlyAuthError, supabase } from '@/lib/supabase';
import { colors, radius, space } from '@/theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!supabase) {
    return (
      <Screen>
        <Muted>{"Accounts aren't available in this build."}</Muted>
      </Screen>
    );
  }
  const client = supabase;

  const sendCode = async () => {
    const address = email.trim().toLowerCase();
    if (!EMAIL_RE.test(address)) return setError('That email address looks wrong.');
    setBusy(true);
    setError(null);
    const { error: err } = await client.auth.signInWithOtp({ email: address, options: { shouldCreateUser: true } });
    setBusy(false);
    if (err) return setError(friendlyAuthError(err));
    setEmail(address);
    setStep('code');
  };

  const verify = async () => {
    const token = code.replace(/\D/g, '');
    if (token.length < 6) return setError('Enter the code from the email.');
    setBusy(true);
    setError(null);
    const { error: err } = await client.auth.verifyOtp({ email, token, type: 'email' });
    setBusy(false);
    if (err) return setError(friendlyAuthError(err));
    router.back();
  };

  return (
    <Screen>
      <H1>{step === 'email' ? 'Sign in' : 'Check your email'}</H1>
      {step === 'email' ? (
        <>
          <Body>Back up your workouts, keep your progress across phones, and get on the leaderboards.</Body>
          <TextInput
            style={s.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@email.com"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            inputMode="email"
            onSubmitEditing={sendCode}
          />
          <Button label="Send me a code" onPress={sendCode} disabled={busy} />
          <Muted>No password needed. New here? This creates your account.</Muted>
        </>
      ) : (
        <>
          <Body>We sent a 6-digit code to {email}.</Body>
          <TextInput
            style={[s.input, s.code]}
            value={code}
            onChangeText={setCode}
            placeholder="123456"
            placeholderTextColor={colors.muted}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            maxLength={10}
            onSubmitEditing={verify}
          />
          <Button label="Sign in" onPress={verify} disabled={busy} />
          <Button
            label="Use a different email"
            variant="secondary"
            onPress={() => {
              setStep('email');
              setCode('');
              setError(null);
            }}
          />
        </>
      )}
      {busy && <ActivityIndicator color={colors.accent} />}
      {error && <Body style={{ color: colors.danger }}>{error}</Body>}
    </Screen>
  );
}

const s = StyleSheet.create({
  input: {
    backgroundColor: colors.cardRaised,
    color: colors.text,
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    paddingVertical: 12,
    fontSize: 17,
    borderWidth: 1,
    borderColor: colors.border,
  },
  code: { fontSize: 28, letterSpacing: 8, textAlign: 'center' },
});
