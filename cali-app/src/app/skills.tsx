import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, H1, Muted, ProgressBar, Screen } from '@/components/ui';
import { completedStepIds, skillProgress } from '@/lib/records';
import { SKILLS } from '@/lib/skills';
import type { SkillStep } from '@/lib/types';
import { useAppState } from '@/state/AppStateProvider';
import { colors, font, space } from '@/theme';

export default function SkillsScreen() {
  const { state, access, toggleStep } = useAppState();
  const [open, setOpen] = useState<string | null>(SKILLS[0].id);
  const completed = useMemo(() => completedStepIds(state), [state]);
  // Steps done only because of logged sets (not ticked by hand) can't be unticked.
  const autoDone = useMemo(() => completedStepIds({ workouts: state.workouts, manualSteps: {} }), [state.workouts]);

  return (
    <Screen headerInset>
      <View style={{ gap: 4 }}>
        <H1>Skills</H1>
        <Muted>{access.canLog ? 'Steps tick themselves off when you log them.' : 'Trial ended. Your progress stays visible; go Pro to tick off new steps.'}</Muted>
      </View>

      {SKILLS.map((skill) => {
        const p = skillProgress(skill, completed);
        const isOpen = open === skill.id;
        return (
          <Card key={skill.id}>
            <Pressable onPress={() => setOpen(isOpen ? null : skill.id)} style={{ gap: space.md }}>
              <View style={s.header}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={s.name}>{skill.name}</Text>
                  <Muted>{skill.tagline}</Muted>
                </View>
                <Text style={s.count}>
                  {p.done}/{p.total}
                </Text>
                <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.faint} />
              </View>
              <ProgressBar value={p.done / p.total} />
            </Pressable>
            {isOpen && (
              <View>
                {skill.steps.map((step, i) => (
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
              </View>
            )}
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
  const hint = auto ? 'Unlocked from your logs' : step.target ? 'Log it to unlock, or tap to tick off' : 'Tap to tick off';
  return (
    <Pressable onPress={canToggle ? onToggle : undefined} style={({ pressed }) => [s.step, pressed && canToggle && { opacity: 0.7 }]}>
      <Ionicons name={done ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={done ? colors.frost : colors.faint} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[s.stepName, !done && { color: colors.muted }]}>
          {index}. {step.name}
        </Text>
        <Text style={s.stepHint}>{done && !auto ? step.description : hint}</Text>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  name: { fontFamily: font, color: colors.text, fontSize: 17, fontWeight: '600' },
  count: { fontFamily: font, color: colors.text, fontWeight: '600', fontSize: 15 },
  step: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start', paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.border },
  stepName: { fontFamily: font, color: colors.text, fontSize: 15, fontWeight: '500' },
  stepHint: { fontFamily: font, color: colors.faint, fontSize: 12 },
});
