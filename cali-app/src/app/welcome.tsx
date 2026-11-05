import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState, type ComponentProps } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressScale, Rise } from '@/components/motion';
import { skillIcon } from '@/components/skillIcons';
import { Backdrop, Button, Chip, FrostCard, Muted } from '@/components/ui';
import { BRAND } from '@/lib/brand';
import * as haptics from '@/lib/haptics';
import { HANDSTAND_OPTIONS, placementSteps, PULL_UP_OPTIONS, type HandstandLevel, type PullUpLevel } from '@/lib/onboarding';
import { SKILLS } from '@/lib/skills';
import { TRIAL_DAYS } from '@/lib/trial';
import { useAppState } from '@/state/AppStateProvider';
import { colors, display, font, radius } from '@/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

const PROMISES: { icon: IconName; text: string }[] = [
  { icon: 'list-outline', text: 'Log sessions in seconds' },
  { icon: 'ribbon-outline', text: 'Skill steps that tick themselves off' },
  { icon: 'podium-outline', text: 'Video-verified world rankings' },
];

const MAX_FOCUS = 3;

function pairs<T>(items: readonly T[]): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += 2) out.push(items.slice(i, i + 2));
  return out;
}

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useAppState();
  const [step, setStep] = useState(0);
  const [focus, setFocus] = useState<string[]>([]);
  const [pullUps, setPullUps] = useState<PullUpLevel | null>(null);
  const [handstand, setHandstand] = useState<HandstandLevel | null>(null);
  const [name, setName] = useState('');
  const [weight, setWeight] = useState('');

  const go = (to: number) => {
    haptics.tap();
    setStep(to);
  };

  const toggleSkill = (id: string) => {
    haptics.tap();
    setFocus((f) => (f.includes(id) ? f.filter((x) => x !== id) : f.length < MAX_FOCUS ? [...f, id] : f));
  };

  const finish = () => {
    haptics.success();
    const kg = parseFloat(weight.replace(',', '.'));
    completeOnboarding({
      profile: { displayName: name.trim().slice(0, 30), bodyweightKg: Number.isFinite(kg) && kg > 0 && kg < 400 ? Math.round(kg * 10) / 10 : undefined },
      focusSkills: focus,
      placementSteps: placementSteps({ pullUps: pullUps ?? 'none', handstand: handstand ?? 'none' }),
    });
    router.replace('/');
  };

  return (
    <Backdrop>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {step > 0 && (
          <View style={[s.top, { paddingTop: insets.top + 12 }]}>
            <Pressable onPress={() => go(step - 1)} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back" style={s.back}>
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </Pressable>
            <View style={s.progress}>
              {[1, 2, 3].map((i) => (
                <View key={i} style={[s.seg, i <= step && s.segOn]} />
              ))}
            </View>
            <View style={{ width: 36 }} />
          </View>
        )}

        <ScrollView
          contentContainerStyle={[s.content, { paddingTop: step === 0 ? insets.top + 48 : 24, paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 0 && (
            <View key="hero" style={{ flex: 1, gap: 28 }}>
              <Rise>
                <Text style={s.brand}>{BRAND.name.toUpperCase()}</Text>
              </Rise>
              <Rise delay={90}>
                <Text style={s.hero}>{'Train skills.\nEarn your\nrank.'}</Text>
              </Rise>
              <Rise delay={180}>
                <Muted style={{ fontSize: 16, lineHeight: 23 }}>
                  From your first pull-up to a clean muscle-up. Track every rep, unlock every step, and see where you stand.
                </Muted>
              </Rise>
              <Rise delay={260} style={{ gap: 12 }}>
                {PROMISES.map((p) => (
                  <View key={p.text} style={s.promise}>
                    <View style={s.promiseIcon}>
                      <Ionicons name={p.icon} size={17} color={colors.text} />
                    </View>
                    <Text style={s.promiseText}>{p.text}</Text>
                  </View>
                ))}
              </Rise>
              <Rise delay={340} style={{ gap: 14, marginTop: 'auto' }}>
                <Button label="Get started" onPress={() => go(1)} icon={<Ionicons name="arrow-forward" size={16} color={colors.onFrost} />} />
                <Text style={s.small}>
                  {TRIAL_DAYS} days free. No card needed.{'  '}
                  <Text style={s.link} onPress={() => router.push('/sign-in')}>
                    I have an account
                  </Text>
                </Text>
              </Rise>
            </View>
          )}

          {step === 1 && (
            <View key="skills" style={{ gap: 22 }}>
              <Rise>
                <Text style={s.q}>What do you want to unlock?</Text>
                <Muted style={{ marginTop: 6 }}>Pick up to {MAX_FOCUS}. Home will lead with these.</Muted>
              </Rise>
              <Rise delay={80}>
                <View style={s.grid}>
                  {pairs(SKILLS).map((row) => (
                    <View key={row[0].id} style={s.gridRow}>
                      {row.map((skill) => {
                        const on = focus.includes(skill.id);
                        return (
                          <View key={skill.id} style={s.cell}>
                            <PressScale onPress={() => toggleSkill(skill.id)} containerStyle={{ flex: 1 }} style={[s.tile, on && s.tileOn]} haptic="none" accessibilityLabel={skill.name}>
                              <View style={s.tileTop}>
                                <Ionicons name={skillIcon(skill.id)} size={22} color={on ? colors.onFrost : colors.text} />
                                <Ionicons name={on ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={on ? colors.onFrost : colors.faint} />
                              </View>
                              <Text style={[s.tileName, on && { color: colors.onFrost }]} numberOfLines={1} adjustsFontSizeToFit>
                                {skill.name}
                              </Text>
                              <Text style={[s.tileSub, on && { color: colors.onFrostMuted }]} numberOfLines={2}>
                                {skill.tagline}
                              </Text>
                            </PressScale>
                          </View>
                        );
                      })}
                      {row.length === 1 && <View style={s.cell} />}
                    </View>
                  ))}
                </View>
              </Rise>
              <Button label={focus.length ? 'Continue' : 'Pick at least one'} disabled={!focus.length} onPress={() => go(2)} />
            </View>
          )}

          {step === 2 && (
            <View key="level" style={{ gap: 24 }}>
              <Rise>
                <Text style={s.q}>Where are you now?</Text>
                <Muted style={{ marginTop: 6 }}>Be honest. We use this to skip the steps you already own.</Muted>
              </Rise>
              <Rise delay={80} style={{ gap: 12 }}>
                <Text style={s.label}>Strict pull-ups in one set</Text>
                <View style={s.chips}>
                  {PULL_UP_OPTIONS.map((o) => (
                    <Chip key={o.value} label={o.label} active={pullUps === o.value} onPress={() => setPullUps(o.value)} />
                  ))}
                </View>
              </Rise>
              <Rise delay={150} style={{ gap: 12 }}>
                <Text style={s.label}>Handstand</Text>
                <View style={s.chips}>
                  {HANDSTAND_OPTIONS.map((o) => (
                    <Chip key={o.value} label={o.label} active={handstand === o.value} onPress={() => setHandstand(o.value)} />
                  ))}
                </View>
              </Rise>
              <Button label="Continue" disabled={!pullUps || !handstand} onPress={() => go(3)} />
            </View>
          )}

          {step === 3 && (
            <View key="you" style={{ gap: 22 }}>
              <Rise>
                <Text style={s.q}>What should we call you?</Text>
                <Muted style={{ marginTop: 6 }}>This name shows on leaderboards. You can change it anytime.</Muted>
              </Rise>
              <Rise delay={80} style={{ gap: 12 }}>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Your name"
                  placeholderTextColor={colors.faint}
                  style={s.input}
                  maxLength={30}
                  autoCapitalize="words"
                  autoFocus={Platform.OS !== 'web'}
                />
                <TextInput
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="Bodyweight in kg (optional)"
                  placeholderTextColor={colors.faint}
                  style={s.input}
                  keyboardType="decimal-pad"
                />
              </Rise>
              <Rise delay={150}>
                <FrostCard style={{ gap: 6, padding: 18 }}>
                  <Text style={s.trialKicker}>Starts today</Text>
                  <Text style={s.trialTitle}>{TRIAL_DAYS}-day free trial</Text>
                  <Text style={s.trialSub}>Everything unlocked. Your history stays yours, whatever you decide after.</Text>
                </FrostCard>
              </Rise>
              <Button label="Start training" disabled={!name.trim()} onPress={finish} icon={<Ionicons name="flash" size={15} color={colors.onFrost} />} />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Backdrop>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18 },
  back: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card },
  progress: { flexDirection: 'row', gap: 6 },
  seg: { width: 34, height: 4, borderRadius: 2, backgroundColor: 'rgba(228,228,230,0.15)' },
  segOn: { backgroundColor: colors.frost },
  content: { flexGrow: 1, paddingHorizontal: 24 },
  brand: { fontFamily: display, color: colors.muted, fontSize: 20, fontWeight: '700', letterSpacing: 6 },
  hero: { fontFamily: display, color: colors.text, fontSize: 72, lineHeight: 68, fontWeight: '700', letterSpacing: -0.5 },
  promise: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  promiseIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  promiseText: { fontFamily: font, color: colors.text, fontSize: 15, fontWeight: '600' },
  small: { fontFamily: font, color: colors.muted, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  link: { color: colors.text, fontWeight: '800' },
  q: { fontFamily: display, color: colors.text, fontSize: 44, lineHeight: 44, fontWeight: '700' },
  grid: { gap: 10 },
  gridRow: { flexDirection: 'row', gap: 10 },
  cell: { flex: 1, minWidth: 0 },
  tile: {
    flex: 1,
    minHeight: 128,
    padding: 14,
    gap: 6,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tileOn: { backgroundColor: colors.frost, borderColor: colors.frost },
  tileTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  tileName: { fontFamily: display, color: colors.text, fontSize: 24, fontWeight: '700' },
  tileSub: { fontFamily: font, color: colors.muted, fontSize: 12, fontWeight: '600' },
  label: { fontFamily: font, color: colors.text, fontSize: 15, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  input: {
    fontFamily: font,
    color: colors.text,
    fontSize: 17,
    fontWeight: '600',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  trialKicker: { fontFamily: font, color: colors.onFrostMuted, fontSize: 12, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  trialTitle: { fontFamily: display, color: colors.onFrost, fontSize: 30, fontWeight: '700' },
  trialSub: { fontFamily: font, color: colors.onFrostMuted, fontSize: 13, fontWeight: '600', lineHeight: 18 },
});
