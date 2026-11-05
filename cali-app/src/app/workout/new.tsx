import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Body, Button, Card, Chip, H2, Muted, Screen } from '@/components/ui';
import { CATEGORY_LABELS, EXERCISES, getExercise } from '@/lib/exercises';
import { newId } from '@/lib/state';
import type { ExerciseCategory, ExerciseEntry, SetEntry } from '@/lib/types';
import { useAppState } from '@/state/AppStateProvider';
import { colors, radius, space } from '@/theme';

interface DraftSet {
  /** Reps or seconds, depending on the exercise. */
  amount: string;
  kg: string;
}
interface DraftEntry {
  key: string;
  exerciseId: string;
  sets: DraftSet[];
}

const toNumber = (v: string) => {
  const n = parseFloat(v.replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

/** Converts the form into saved sets, dropping empty rows and empty exercises. */
function toEntries(drafts: DraftEntry[]): ExerciseEntry[] {
  return drafts
    .map((d) => {
      const ex = getExercise(d.exerciseId);
      const sets: SetEntry[] = d.sets.flatMap((s) => {
        const amount = toNumber(s.amount);
        if (!amount || !ex) return [];
        const kg = ex.allowsWeight ? toNumber(s.kg) : undefined;
        const set: SetEntry = ex.kind === 'hold' ? { holdSec: Math.round(amount) } : { reps: Math.round(amount) };
        if (kg) set.kg = kg;
        return [set];
      });
      return { exerciseId: d.exerciseId, sets };
    })
    .filter((e) => e.sets.length > 0);
}

export default function NewWorkoutScreen() {
  const { access, addWorkout } = useAppState();
  const [drafts, setDrafts] = useState<DraftEntry[]>([]);
  const [picking, setPicking] = useState(true);
  const [category, setCategory] = useState<ExerciseCategory | 'all'>('all');
  const [query, setQuery] = useState('');

  const options = useMemo(
    () =>
      EXERCISES.filter((e) => (category === 'all' || e.category === category) && e.name.toLowerCase().includes(query.trim().toLowerCase())),
    [category, query],
  );
  const entries = useMemo(() => toEntries(drafts), [drafts]);

  if (!access.canLog) {
    return (
      <Screen>
        <H2>Logging is locked</H2>
        <Muted>Your free trial has ended. Your history is safe and still viewable.</Muted>
        <Button label="See Founder Pass" variant="gold" onPress={() => router.replace('/paywall')} />
      </Screen>
    );
  }

  const update = (key: string, fn: (d: DraftEntry) => DraftEntry) => setDrafts((all) => all.map((d) => (d.key === key ? fn(d) : d)));

  const addExercise = (exerciseId: string) => {
    setDrafts((all) => [...all, { key: newId(), exerciseId, sets: [{ amount: '', kg: '' }] }]);
    setPicking(false);
    setQuery('');
  };

  const save = () => {
    const id = addWorkout({ date: new Date().toISOString(), entries });
    if (id) router.replace(`/workout/${id}`);
  };

  return (
    <Screen>
      {drafts.map((d) => {
        const ex = getExercise(d.exerciseId)!;
        const unit = ex.kind === 'hold' ? 'sec' : 'reps';
        return (
          <Card key={d.key}>
            <View style={s.entryHeader}>
              <H2 style={{ flex: 1 }}>{ex.name}</H2>
              <Pressable accessibilityLabel={`Remove ${ex.name}`} onPress={() => setDrafts((all) => all.filter((x) => x.key !== d.key))}>
                <Ionicons name="trash-outline" size={20} color={colors.muted} />
              </Pressable>
            </View>
            {d.sets.map((set, i) => (
              <View key={i} style={s.setRow}>
                <Text style={s.setIndex}>{i + 1}</Text>
                <TextInput
                  style={s.input}
                  value={set.amount}
                  onChangeText={(amount) => update(d.key, (x) => ({ ...x, sets: x.sets.map((y, j) => (j === i ? { ...y, amount } : y)) }))}
                  keyboardType="number-pad"
                  placeholder={unit}
                  placeholderTextColor={colors.muted}
                />
                {ex.allowsWeight && (
                  <TextInput
                    style={s.input}
                    value={set.kg}
                    onChangeText={(kg) => update(d.key, (x) => ({ ...x, sets: x.sets.map((y, j) => (j === i ? { ...y, kg } : y)) }))}
                    keyboardType="decimal-pad"
                    placeholder={ex.category === 'lift' ? 'kg' : '+kg'}
                    placeholderTextColor={colors.muted}
                  />
                )}
                <Pressable
                  accessibilityLabel="Remove set"
                  disabled={d.sets.length === 1}
                  onPress={() => update(d.key, (x) => ({ ...x, sets: x.sets.filter((_, j) => j !== i) }))}
                >
                  <Ionicons name="close" size={20} color={d.sets.length === 1 ? colors.border : colors.muted} />
                </Pressable>
              </View>
            ))}
            <Pressable
              onPress={() => update(d.key, (x) => ({ ...x, sets: [...x.sets, { ...x.sets[x.sets.length - 1] }] }))}
              style={s.addSet}
            >
              <Ionicons name="add" size={18} color={colors.accent} />
              <Text style={s.addSetText}>Add set</Text>
            </Pressable>
          </Card>
        );
      })}

      {picking ? (
        <Card>
          <H2>Add exercise</H2>
          <TextInput style={s.search} value={query} onChangeText={setQuery} placeholder="Search…" placeholderTextColor={colors.muted} />
          <View style={s.chips}>
            <Chip label="All" active={category === 'all'} onPress={() => setCategory('all')} />
            {(Object.keys(CATEGORY_LABELS) as ExerciseCategory[]).map((c) => (
              <Chip key={c} label={CATEGORY_LABELS[c]} active={category === c} onPress={() => setCategory(c)} />
            ))}
          </View>
          {options.map((e) => (
            <Pressable key={e.id} onPress={() => addExercise(e.id)} style={({ pressed }) => [s.option, pressed && { opacity: 0.7 }]}>
              <Body style={{ flex: 1 }}>{e.name}</Body>
              <Muted>{e.kind === 'hold' ? 'hold' : 'reps'}</Muted>
            </Pressable>
          ))}
          {options.length === 0 && <Muted>{`No exercise matches "${query}".`}</Muted>}
        </Card>
      ) : (
        <Button label="+ Add exercise" variant="secondary" onPress={() => setPicking(true)} />
      )}

      <Button label={entries.length ? `Save workout (${entries.reduce((n, e) => n + e.sets.length, 0)} sets)` : 'Save workout'} onPress={save} disabled={entries.length === 0} />
    </Screen>
  );
}

const s = StyleSheet.create({
  entryHeader: { flexDirection: 'row', alignItems: 'center' },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  setIndex: { color: colors.muted, width: 18, fontWeight: '700' },
  input: {
    flex: 1,
    // Text inputs have an intrinsic minimum width; without this they overflow the card on narrow phones.
    minWidth: 0,
    flexBasis: 0,
    backgroundColor: colors.cardRaised,
    color: colors.text,
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addSet: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingTop: space.xs },
  addSetText: { color: colors.accent, fontWeight: '700' },
  search: {
    backgroundColor: colors.cardRaised,
    color: colors.text,
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    paddingVertical: 10,
    fontSize: 16,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  option: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border },
});
