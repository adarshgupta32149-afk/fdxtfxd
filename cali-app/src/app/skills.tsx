import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { LiveDot, PressScale, Rise } from '@/components/motion';
import { skillIcon } from '@/components/skillIcons';
import { Button, FrostCard, H1, Muted, Screen } from '@/components/ui';
import { getExercise } from '@/lib/exercises';
import * as haptics from '@/lib/haptics';
import { completedStepIds, skillProgress } from '@/lib/records';
import { SKILLS, targetLabel } from '@/lib/skills';
import type { SkillStep } from '@/lib/types';
import { useAppState } from '@/state/AppStateProvider';
import { colors, display, font, radius } from '@/theme';

type StepState = 'done' | 'next' | 'locked';

const exerciseName = (id: string) => getExercise(id)?.name;

export default function SkillsScreen() {
  const { state, access, toggleStep } = useAppState();
  const params = useLocalSearchParams<{ id?: string }>();
  // Open on the skill Home linked to, else the user's first focus skill, else the first one.
  const initial = SKILLS.find((x) => x.id === params.id) ?? SKILLS.find((x) => x.id === state.focusSkills[0]) ?? SKILLS[0];
  const [selected, setSelected] = useState(initial.id);
  const skill = SKILLS.find((x) => x.id === selected) ?? SKILLS[0];

  const completed = useMemo(() => completedStepIds(state), [state]);
  // Steps done because of logged sets (not ticked by hand) can't be unticked.
  const autoDone = useMemo(() => completedStepIds({ workouts: state.workouts, manualSteps: {} }), [state.workouts]);
  const p = skillProgress(skill, completed);

  // Focus skills first, in the order the user picked them.
  const ordered = useMemo(() => {
    const rank = (id: string) => {
      const i = state.focusSkills.indexOf(id);
      return i === -1 ? 99 : i;
    };
    return [...SKILLS].sort((a, b) => rank(a.id) - rank(b.id));
  }, [state.focusSkills]);

  const stateOf = (step: SkillStep): StepState => (completed.has(step.id) ? 'done' : step.id === p.nextStep?.id ? 'next' : 'locked');

  return (
    <Screen headerInset contentStyle={{ gap: 20 }}>
      <Rise>
        <H1>Skills</H1>
        <Muted style={{ marginTop: 4 }}>
          {access.canLog ? 'Steps tick themselves off when you log them.' : 'Trial ended. Your progress stays; go Pro to tick off new steps.'}
        </Muted>
      </Rise>

      <Rise delay={60}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabs} style={s.tabsWrap}>
          {ordered.map((sk) => {
            const on = sk.id === selected;
            const sp = skillProgress(sk, completed);
            return (
              <PressScale
                key={sk.id}
                onPress={() => setSelected(sk.id)}
                style={[s.tab, on && s.tabOn]}
                accessibilityLabel={sk.name}
                accessibilityRole="tab"
              >
                <Ionicons name={skillIcon(sk.id)} size={16} color={on ? colors.onFrost : colors.text} />
                <Text style={[s.tabText, on && { color: colors.onFrost }]}>{sk.name}</Text>
                <Text style={[s.tabCount, on && { color: colors.onFrostMuted }]}>
                  {sp.done}/{sp.total}
                </Text>
              </PressScale>
            );
          })}
        </ScrollView>
      </Rise>

      {/* Keyed by skill so the summary and ladder replay their entrance on every switch. */}
      <View key={skill.id} style={{ gap: 20 }}>
        <Rise delay={100}>
          <FrostCard sheen>
            <View style={s.sumTop}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={s.sumKicker}>{state.focusSkills.includes(skill.id) ? 'Your focus' : skill.tagline}</Text>
                <Text style={s.sumName}>{skill.name}</Text>
              </View>
              <Text style={s.sumFrac}>
                {p.done}
                <Text style={s.sumTotal}>/{p.total}</Text>
              </Text>
            </View>
            <View style={s.track}>
              <View style={[s.fill, { width: `${(p.done / p.total) * 100}%` }]} />
            </View>
            <Text style={s.sumNext}>
              {p.nextStep ? `Next up: ${p.nextStep.name}` : 'Every step done. You own this skill.'}
            </Text>
          </FrostCard>
        </Rise>

        <View>
          {skill.steps.map((step, i) => {
            const st = stateOf(step);
            const auto = autoDone.has(step.id);
            return (
              <Rise key={step.id} delay={160 + i * 55} distance={10}>
                <LadderRow
                  index={i + 1}
                  step={step}
                  state={st}
                  last={i === skill.steps.length - 1}
                  nextDone={i < skill.steps.length - 1 && completed.has(skill.steps[i + 1].id)}
                  auto={auto}
                  canLog={access.canLog}
                  onToggle={() => {
                    haptics.press();
                    toggleStep(step.id);
                  }}
                />
              </Rise>
            );
          })}
        </View>
      </View>
    </Screen>
  );
}

function LadderRow({
  index,
  step,
  state,
  last,
  nextDone,
  auto,
  canLog,
  onToggle,
}: {
  index: number;
  step: SkillStep;
  state: StepState;
  last: boolean;
  nextDone: boolean;
  auto: boolean;
  canLog: boolean;
  onToggle: () => void;
}) {
  const target = targetLabel(step.target, exerciseName);
  const done = state === 'done';
  const next = state === 'next';
  // A step ticked by hand can be unticked; one earned from logs can't.
  const canUntick = done && !auto && canLog;

  return (
    <View style={s.row}>
      <View style={s.rail}>
        <PressScale
          onPress={canUntick ? onToggle : undefined}
          disabled={!canUntick}
          haptic="none"
          style={[s.node, done && s.nodeDone, next && s.nodeNext]}
          accessibilityLabel={canUntick ? `Untick ${step.name}` : step.name}
        >
          {done ? (
            <Ionicons name="checkmark" size={16} color={colors.onFrost} />
          ) : next ? (
            <LiveDot color={colors.ember} size={8} />
          ) : (
            <Text style={s.nodeNum}>{index}</Text>
          )}
        </PressScale>
        {!last && <View style={[s.line, done && nextDone && s.lineDone, done && !nextDone && s.lineHalf]} />}
      </View>

      <View style={[s.body, next && s.bodyNext]}>
        <View style={s.bodyTop}>
          <Text style={[s.stepName, state === 'locked' && { color: colors.muted }]}>{step.name}</Text>
          {done && <Text style={s.tag}>{auto ? 'From your logs' : 'Ticked'}</Text>}
          {state === 'locked' && <Ionicons name="lock-closed" size={13} color={colors.faint} />}
        </View>
        {state !== 'locked' && <Text style={s.desc}>{step.description}</Text>}
        {target ? (
          <View style={s.targetRow}>
            <Ionicons name="flag-outline" size={13} color={next ? colors.ember : colors.faint} />
            <Text style={[s.target, next && { color: colors.text }]}>{target}</Text>
          </View>
        ) : null}

        {next && canLog && (
          <View style={s.actions}>
            {step.target ? (
              <Button compact variant="ember" label="Log it" icon={<Ionicons name="add" size={16} color="#2A1408" />} onPress={() => router.push('/workout/new')} />
            ) : null}
            <Button compact variant="glass" label="Mark done" onPress={onToggle} />
          </View>
        )}
      </View>
    </View>
  );
}

const NODE = 30;

const s = StyleSheet.create({
  tabsWrap: { marginHorizontal: -22 },
  tabs: { gap: 8, paddingHorizontal: 22 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabOn: { backgroundColor: colors.frost, borderColor: colors.frost },
  tabText: { fontFamily: font, color: colors.text, fontSize: 14, fontWeight: '700' },
  tabCount: { fontFamily: font, color: colors.faint, fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },

  sumTop: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  sumKicker: { fontFamily: font, color: colors.onFrostMuted, fontSize: 12, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
  sumName: { fontFamily: display, color: colors.onFrost, fontSize: 38, lineHeight: 40, fontWeight: '700' },
  sumFrac: { fontFamily: display, color: colors.onFrost, fontSize: 46, lineHeight: 46, fontWeight: '700', fontVariant: ['tabular-nums'] },
  sumTotal: { color: colors.onFrostMuted, fontSize: 26 },
  track: { height: 6, borderRadius: 3, backgroundColor: 'rgba(11,19,36,0.12)', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3, backgroundColor: colors.onFrost },
  sumNext: { fontFamily: font, color: colors.onFrost, fontSize: 14, fontWeight: '700' },

  row: { flexDirection: 'row', gap: 14 },
  rail: { width: NODE, alignItems: 'center' },
  node: {
    width: NODE,
    height: NODE,
    borderRadius: NODE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  nodeDone: { backgroundColor: colors.frost, borderColor: colors.frost },
  nodeNext: { backgroundColor: colors.emberSoft, borderColor: colors.ember, borderWidth: 1.5 },
  nodeNum: { fontFamily: display, color: colors.faint, fontSize: 15, fontWeight: '700' },
  line: { flex: 1, width: 2, minHeight: 14, marginVertical: 4, borderRadius: 1, backgroundColor: colors.border },
  lineDone: { backgroundColor: colors.frostLo },
  lineHalf: { backgroundColor: 'rgba(217,217,217,0.35)' },

  body: { flex: 1, minWidth: 0, paddingTop: 4, paddingBottom: 22, gap: 4 },
  bodyNext: {
    paddingTop: 12,
    paddingHorizontal: 14,
    paddingBottom: 14,
    marginTop: -8,
    marginBottom: 18,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: 'rgba(255,154,98,0.35)',
    gap: 6,
  },
  bodyTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepName: { flexShrink: 1, fontFamily: font, color: colors.text, fontSize: 16, fontWeight: '700' },
  tag: { fontFamily: font, color: colors.faint, fontSize: 11, fontWeight: '700', marginLeft: 'auto' },
  desc: { fontFamily: font, color: colors.muted, fontSize: 13, lineHeight: 18, fontWeight: '500' },
  targetRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  target: { fontFamily: font, color: colors.faint, fontSize: 12, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 6, flexWrap: 'wrap' },
});
