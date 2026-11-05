import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, H2, Muted, ProgressBar, Screen } from '@/components/ui';
import { completedStepIds, skillProgress } from '@/lib/records';
import { SKILLS } from '@/lib/skills';
import type { SkillStep } from '@/lib/types';
import { useAppState } from '@/state/AppStateProvider';
import { colors, space } from '@/theme';

export default function SkillsScreen() {
  const { state, access, toggleStep } = useAppState();
  const [open, setOpen] = useState<string | null>(SKILLS[0].id);
  const completed = useMemo(() => completedStepIds(state), [state]);
  // Steps done only because of logged sets (not ticked by hand) can't be unticked.
  const autoDone = useMemo(() => completedStepIds({ workouts: state.workouts, manualSteps: {} }), [state.workouts]);

  return (
    <Screen>
      {!access.canLog && <Muted>Your trial has ended. You can still view your progress; go Pro to tick off new steps.</Muted>}
      {SKILLS.map((skill) => {
        const p = skillProgress(skill, completed);
        const isOpen = open === skill.id;
        return (
          <Card key={skill.id}>
            <Pressable onPress={() => setOpen(isOpen ? null : skill.id)} style={{ gap: space.sm }}>
              <View style={s.header}>
                <View style={{ flex: 1 }}>
                  <H2>{skill.name}</H2>
                  <Muted>{skill.tagline}</Muted>
                </View>
                <Text style={s.count}>
                  {p.done}/{p.total}
                </Text>
                <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} />
              </View>
              <ProgressBar value={p.done / p.total} />
            </Pressable>
            {isOpen &&
              skill.steps.map((step, i) => (
                <StepRow
                  key={step.id}
                  index={i + 1}
                  step={step}
                  done={completed.has(step.id)}
                  auto={autoDone.has(step.id)}
                  canToggle={access.canLog && !autoDone.has(step.id)}
                  onToggle={() => toggleStep(step.id)}
                />
              ))}
          </Card>
        );
      })}
    </Screen>
  );
}

function StepRow({
  index,
  step,
  done,
  auto,
  canToggle,
  onToggle,
}: {
  index: number;
  step: SkillStep;
  done: boolean;
  auto: boolean;
  canToggle: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable onPress={canToggle ? onToggle : undefined} style={({ pressed }) => [s.step, pressed && canToggle && { opacity: 0.7 }]}>
      <Ionicons name={done ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={done ? colors.accent : colors.muted} />
      <View style={{ flex: 1 }}>
        <Text style={[s.stepName, done && { color: colors.accent }]}>
          {index}. {step.name}
        </Text>
        <Muted>
          {auto ? 'Unlocked from your logs' : step.target ? `${step.description} Log it to unlock, or tap to tick off.` : `${step.description} Tap to tick off.`}
        </Muted>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  count: { color: colors.text, fontWeight: '800', fontSize: 16 },
  step: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start', paddingVertical: space.sm, borderTopWidth: 1, borderTopColor: colors.border },
  stepName: { color: colors.text, fontSize: 15, fontWeight: '600' },
});
