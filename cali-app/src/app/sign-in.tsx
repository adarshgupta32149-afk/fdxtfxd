import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';

import { Rise } from '@/components/motion';
import { Button, H1, Muted, Screen } from '@/components/ui';
import { useT } from '@/i18n';
import { friendlyAuthError, supabase } from '@/lib/supabase';
import { colors, display, font, radius } from '@/theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignInScreen() {
  const { t } = useT();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!supabase) {
    return (
      <Screen headerInset>
        <H1>{t('signin.title')}</H1>
        <Muted>{t('signin.unavailable')}</Muted>
      </Screen>
    );
  }
  const client = supabase;

  const sendCode = async () => {
    const address = email.trim().toLowerCase();
    if (!EMAIL_RE.test(address)) return setError(t('signin.badEmail'));
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
    if (token.length < 6) return setError(t('signin.enterCode'));
    setBusy(true);
    setError(null);
    const { error: err } = await client.auth.verifyOtp({ email, token, type: 'email' });
    setBusy(false);
    if (err) return setError(friendlyAuthError(err));
    router.back();
  };

  const digits = code.replace(/\D/g, '').slice(0, 6);

  return (
    <Screen headerInset contentStyle={{ gap: 18 }}>
      <Rise>
        <View style={s.icon}>
          <Ionicons name={step === 'email' ? 'mail-outline' : 'key-outline'} size={22} color={colors.onFrost} />
        </View>
        <H1 style={{ marginTop: 16 }}>{step === 'email' ? t('signin.title') : t('signin.checkEmail')}</H1>
        <Muted style={{ marginTop: 6 }}>
          {step === 'email' ? t('signin.intro') : t('signin.sentCode', { email })}
        </Muted>
      </Rise>
      {step === 'email' ? (
        <Rise delay={80} style={{ gap: 14 }}>
          <TextInput
            style={s.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@email.com"
            placeholderTextColor={colors.faint}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            inputMode="email"
            onSubmitEditing={sendCode}
            autoFocus
          />
          <Button label={busy ? t('signin.sending') : t('signin.sendCode')} onPress={sendCode} disabled={busy} icon={<Ionicons name="arrow-forward" size={16} color={colors.onFrost} />} />
          <Muted style={{ textAlign: 'center', fontSize: 13 }}>{t('signin.noPassword')}</Muted>
        </Rise>
      ) : (
        <Rise delay={80} style={{ gap: 14 }}>
          {/* Six boxes drawn over one invisible input, so paste and one-time-code autofill still work. */}
          <View>
            <View style={s.boxes}>
              {Array.from({ length: 6 }, (_, i) => (
                <View key={i} style={[s.box, i === digits.length && s.boxActive, i < digits.length && s.boxFilled]}>
                  <Text style={s.boxText}>{digits[i] ?? ''}</Text>
                </View>
              ))}
            </View>
            <TextInput
              style={s.hiddenInput}
              value={digits}
              onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              maxLength={6}
              onSubmitEditing={verify}
              autoFocus
              caretHidden
              accessibilityLabel={t('signin.code')}
            />
          </View>
          <Button label={busy ? t('upload.checking') : t('signin.title')} onPress={verify} disabled={busy || digits.length < 6} />
          <Button
            label={t('signin.otherEmail')}
            variant="glass"
            onPress={() => {
              setStep('email');
              setCode('');
              setError(null);
            }}
          />
        </Rise>
      )}
      {busy && <ActivityIndicator color={colors.frost} />}
      {error && (
        <View style={s.error}>
          <Ionicons name="alert-circle" size={16} color={colors.danger} />
          <Text style={s.errorText}>{error}</Text>
        </View>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  icon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.frost },
  input: {
    fontFamily: font,
    backgroundColor: colors.card,
    color: colors.text,
    borderRadius: radius.md,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 17,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: colors.border,
  },
  boxes: { flexDirection: 'row', gap: 8 },
  box: {
    flex: 1,
    aspectRatio: 0.82,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  boxActive: { borderColor: colors.frost, borderWidth: 1.5 },
  boxFilled: { backgroundColor: colors.cardRaised },
  boxText: { fontFamily: display, color: colors.text, fontSize: 30, fontWeight: '700' },
  hiddenInput: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.02, color: 'transparent' },
  error: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, backgroundColor: colors.dangerFill },
  errorText: { flex: 1, fontFamily: font, color: colors.danger, fontSize: 13, fontWeight: '700' },
});
