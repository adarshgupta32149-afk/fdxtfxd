import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNow } from '@/components/hooks';
import { PressScale, Rise } from '@/components/motion';
import { Button, Card, Chip, H1, Muted, Screen } from '@/components/ui';
import { CATEGORY_LABELS, EXERCISES, getExercise } from '@/lib/exercises';
import * as haptics from '@/lib/haptics';
import { frequentExercises, previousSets, shortSet } from '@/lib/records';
import { newId } from '@/lib/state';
import { pad2 } from '@/lib/time';
import type { ExerciseCategory, ExerciseEntry, SetEntry } from '@/lib/types';
import { useAppState } from '@/state/AppStateProvider';
import { colors, display, font, radius } from '@/theme';

/** Default rest between sets, in seconds. */
const REST_SEC = 90;

interface DraftSet {
  /** Reps or seconds, depending on the exercise. */
  amount: string;
  kg: string;
  done: boolean;
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

/** A rest period starting now. Lives outside the component because it reads the clock. */
const restFromNow = (sec: number) => ({ until: Date.now() + sec * 1000, total: sec });

const clock = (sec: number) => {
  const s = Math.max(0, Math.round(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h ? `${h}:${pad2(m)}:${pad2(s % 60)}` : `${m}:${pad2(s % 60)}`;
};

export default function NewWorkoutScreen() {
  const { state, access, addWorkout } = useAppState();
  const insets = useSafeAreaInsets();
  const now = useNow(1000);
  const [startedAt] = useState(() => Date.now());
  const [drafts, setDrafts] = useState<DraftEntry[]>([]);
  const [picking, setPicking] = useState(true);
  const [category, setCategory] = useState<ExerciseCategory | 'all'>('all');
  const [query, setQuery] = useState('');
  const [rest, setRest] = useState<{ until: number; total: number } | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const options = useMemo(
    () =>
      EXERCISES.filter((e) => (category === 'all' || e.category === category) && e.name.toLowerCase().includes(query.trim().toLowerCase())),
    [category, query],
  );
  const frequent = useMemo(() => frequentExercises(state.workouts), [state.workouts]);
  const entries = useMemo(() => toEntries(drafts), [drafts]);
  const setCount = entries.reduce((n, e) => n + e.sets.length, 0);
  const restLeft = rest ? Math.ceil((rest.until - now.getTime()) / 1000) : 0;

  // When rest runs out, buzz once and clear it.
  const buzzed = useRef(false);
  useEffect(() => {
    if (!rest) {
      buzzed.current = false;
      return;
    }
    if (restLeft <= 0 && !buzzed.current) {
      buzzed.current = true;
      haptics.success();
      const t = setTimeout(() => setRest(null), 900);
      return () => clearTimeout(t);
    }
  }, [rest, restLeft]);

  if (!access.canLog) {
    return (
      <Screen topInset contentStyle={{ gap: 14, paddingTop: insets.top + 80 }}>
        <Ionicons name="lock-closed" size={28} color={colors.frost} />
        <H1>Logging is locked</H1>
        <Muted>Your free trial has ended. Every session you logged is safe and still viewable.</Muted>
        <Button label="See Founder Pass" onPress={() => router.replace('/paywall')} />
        <Button label="Back" variant="glass" onPress={() => router.back()} />
      </Screen>
    );
  }

  const update = (key: string, fn: (d: DraftEntry) => DraftEntry) => setDrafts((all) => all.map((d) => (d.key === key ? fn(d) : d)));
  const updateSet = (key: string, i: number, patch: Partial<DraftSet>) =>
    update(key, (x) => ({ ...x, sets: x.sets.map((y, j) => (j === i ? { ...y, ...patch } : y)) }));

  const addExercise = (exerciseId: string) => {
    haptics.tap();
    setDrafts((all) => [...all, { key: newId(), exerciseId, sets: [{ amount: '', kg: '', done: false }] }]);
    setPicking(false);
    setQuery('');
  };

  const toggleDone = (d: DraftEntry, i: number, prev: SetEntry | undefined) => {
    const set = d.sets[i];
    if (set.done) return updateSet(d.key, i, { done: false });
    // Ticking an empty set repeats what you did last time, like most gym loggers.
    const fill: Partial<DraftSet> = {};
    if (!set.amount && prev) fill.amount = String(prev.holdSec ?? prev.reps ?? '');
    if (!set.kg && prev?.kg) fill.kg = String(prev.kg);
    if (!set.amount && !fill.amount) return haptics.warning();
    haptics.press();
    updateSet(d.key, i, { ...fill, done: true });
    setRest(restFromNow(REST_SEC));
  };

  const save = () => {
    const id = addWorkout({ date: new Date().toISOString(), entries });
    if (!id) return;
    haptics.success();
    router.replace({ pathname: '/workout/[id]', params: { id, fresh: '1' } });
  };

  const discard = () => {
    if (drafts.length && !confirmDiscard) {
      haptics.warning();
      return setConfirmDiscard(true);
    }
    router.back();
  };

  const header = (
    <View style={[s.header, { paddingTop: insets.top + 10 }]}>
      <PressScale onPress={discard} style={s.headerBtn} accessibilityLabel="Discard session">
        {confirmDiscard ? <Text style={s.discardText}>Discard?</Text> : <Ionicons name="close" size={20} color={colors.text} />}
      </PressScale>
      <View style={s.headerMid}>
        <Text style={s.elapsed}>{clock((now.getTime() - startedAt) / 1000)}</Text>
        <Text style={s.headerSub}>
          {drafts.length} {drafts.length === 1 ? 'exercise' : 'exercises'} · {setCount} {setCount === 1 ? 'set' : 'sets'}
        </Text>
      </View>
      <PressScale onPress={save} disabled={!setCount} style={[s.finish, !setCount && { opacity: 0.35 }]} accessibilityLabel="Finish session">
        <Text style={s.finishText}>Finish</Text>
      </PressScale>
    </View>
  );

  const restBar = rest && (
    <View style={[s.restWrap, { bottom: insets.bottom + 18 }]} pointerEvents="box-none">
      <View style={s.rest}>
        <View style={[s.restFill, { width: `${Math.max(0, Math.min(1, restLeft / rest.total)) * 100}%` }]} />
        <Ionicons name={restLeft > 0 ? 'timer-outline' : 'checkmark-circle'} size={20} color={colors.onFrost} />
        <View style={{ flex: 1 }}>
          <Text style={s.restLabel}>{restLeft > 0 ? 'Rest' : 'Go'}</Text>
          <Text style={s.restTime}>{restLeft > 0 ? clock(restLeft) : 'Next set'}</Text>
        </View>
        <PressScale onPress={() => setRest((r) => r && { until: r.until + 15000, total: r.total + 15 })} style={s.restBtn} accessibilityLabel="Add 15 seconds">
          <Text style={s.restBtnText}>+15</Text>
        </PressScale>
        <PressScale onPress={() => setRest(null)} style={s.restBtn} accessibilityLabel="Skip rest">
          <Text style={s.restBtnText}>Skip</Text>
        </PressScale>
      </View>
    </View>
  );

  return (
    <Screen
      contentStyle={{ gap: 14, paddingTop: insets.top + 86, paddingBottom: insets.bottom + (rest ? 130 : 60) }}
      overlay={
        <>
          {header}
          {restBar}
        </>
      }
    >
      {drafts.map((d, di) => {
        const ex = getExercise(d.exerciseId)!;
        const prev = previousSets(state.workouts, d.exerciseId);
        const unit = ex.kind === 'hold' ? 'sec' : 'reps';
        return (
          <Rise key={d.key} distance={10}>
            <Card style={{ gap: 10 }}>
              <View style={s.entryHeader}>
                <View style={s.entryNum}>
                  <Text style={s.entryNumText}>{di + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.exName}>{ex.name}</Text>
                  <Text style={s.exMeta}>
                    {CATEGORY_LABELS[ex.category]}
                    {prev.length ? ` · last time ${prev.map(shortSet).join(' · ')}` : ' · first time'}
                  </Text>
                </View>
                <Pressable hitSlop={10} accessibilityLabel={`Remove ${ex.name}`} onPress={() => setDrafts((all) => all.filter((x) => x.key !== d.key))}>
                  <Ionicons name="trash-outline" size={18} color={colors.faint} />
                </Pressable>
              </View>

              <View style={s.colHead}>
                <Text style={[s.colText, { width: 28 }]}>Set</Text>
                <Text style={[s.colText, s.prevCol]}>Previous</Text>
                <Text style={[s.colText, s.inputCol]}>{unit}</Text>
                {ex.allowsWeight && <Text style={[s.colText, s.inputCol]}>{ex.category === 'lift' ? 'kg' : '+kg'}</Text>}
                <View style={{ width: 36 }} />
              </View>

              {d.sets.map((set, i) => {
                const p = prev[i];
                return (
                  <View key={i} style={[s.setRow, set.done && s.setRowDone]}>
                    <Pressable
                      style={{ width: 28 }}
                      disabled={d.sets.length === 1}
                      onLongPress={() => update(d.key, (x) => ({ ...x, sets: x.sets.filter((_, j) => j !== i) }))}
                      accessibilityLabel={`Set ${i + 1}, long press to remove`}
                    >
                      <Text style={[s.setIndex, set.done && { color: colors.onFrostMuted }]}>{i + 1}</Text>
                    </Pressable>
                    <Text style={[s.prev, s.prevCol, set.done && { color: colors.onFrostMuted }]} numberOfLines={1}>
                      {p ? shortSet(p) : '—'}
                    </Text>
                    <TextInput
                      style={[s.input, set.done && s.inputDone]}
                      value={set.amount}
                      onChangeText={(amount) => updateSet(d.key, i, { amount })}
                      keyboardType="number-pad"
                      placeholder={p ? String(p.holdSec ?? p.reps ?? '') : unit}
                      placeholderTextColor={set.done ? colors.onFrostMuted : colors.faint}
                      accessibilityLabel={`Set ${i + 1} ${unit}`}
                    />
                    {ex.allowsWeight && (
                      <TextInput
                        style={[s.input, set.done && s.inputDone]}
                        value={set.kg}
                        onChangeText={(kg) => updateSet(d.key, i, { kg })}
                        keyboardType="decimal-pad"
                        placeholder={p?.kg ? String(p.kg) : '0'}
                        placeholderTextColor={set.done ? colors.onFrostMuted : colors.faint}
                        accessibilityLabel={`Set ${i + 1} weight`}
                      />
                    )}
                    <PressScale
                      onPress={() => toggleDone(d, i, p)}
                      haptic="none"
                      style={[s.check, set.done && s.checkDone]}
                      accessibilityLabel={set.done ? `Undo set ${i + 1}` : `Complete set ${i + 1}`}
                    >
                      <Ionicons name="checkmark" size={18} color={set.done ? colors.frost : colors.faint} />
                    </PressScale>
                  </View>
                );
              })}

              <PressScale
                onPress={() => update(d.key, (x) => ({ ...x, sets: [...x.sets, { ...x.sets[x.sets.length - 1], done: false }] }))}
                style={s.addSet}
                accessibilityLabel={`Add a set of ${ex.name}`}
              >
                <Ionicons name="add" size={16} color={colors.text} />
                <Text style={s.addSetText}>Add set</Text>
              </PressScale>
            </Card>
          </Rise>
        );
      })}

      {drafts.length === 0 && (
        <Rise>
          <Text style={s.emptyTitle}>{'What are\nwe training?'}</Text>
          <Muted style={{ marginTop: 6 }}>Add exercises as you go. Tick a set and the rest timer starts on its own.</Muted>
        </Rise>
      )}

      {picking ? (
        <Rise delay={drafts.length ? 0 : 80}>
          <Card style={{ gap: 12 }}>
            <View style={s.searchRow}>
              <Ionicons name="search" size={16} color={colors.faint} />
              <TextInput style={s.search} value={query} onChangeText={setQuery} placeholder="Search exercises" placeholderTextColor={colors.faint} />
              {drafts.length > 0 && (
                <Pressable onPress={() => setPicking(false)} hitSlop={10} accessibilityLabel="Close exercise list">
                  <Ionicons name="close-circle" size={18} color={colors.faint} />
                </Pressable>
              )}
            </View>
            {frequent.length > 0 && !query && (
              <View style={{ gap: 8 }}>
                <Text style={s.colText}>Your usuals</Text>
                <View style={s.chips}>
                  {frequent.map((id) => (
                    <Chip key={id} label={`+ ${getExercise(id)?.name ?? id}`} onPress={() => addExercise(id)} />
                  ))}
                </View>
              </View>
            )}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              <Chip label="All" active={category === 'all'} onPress={() => setCategory('all')} />
              {(Object.keys(CATEGORY_LABELS) as ExerciseCategory[]).map((c) => (
                <Chip key={c} label={CATEGORY_LABELS[c]} active={category === c} onPress={() => setCategory(c)} />
              ))}
            </ScrollView>
            <View>
              {options.map((e) => (
                <Pressable key={e.id} onPress={() => addExercise(e.id)} style={({ pressed }) => [s.option, pressed && { opacity: 0.6 }]}>
                  <Text style={s.optionName}>{e.name}</Text>
                  <Text style={s.optionKind}>{e.kind === 'hold' ? 'Hold' : e.allowsWeight ? 'Reps · kg' : 'Reps'}</Text>
                  <Ionicons name="add-circle-outline" size={20} color={colors.muted} />
                </Pressable>
              ))}
              {options.length === 0 && <Muted style={{ paddingVertical: 10 }}>{`No exercise matches "${query}".`}</Muted>}
            </View>
          </Card>
        </Rise>
      ) : (
        <Button label="Add exercise" variant="glass" icon={<Ionicons name="add" size={18} color={colors.text} />} onPress={() => setPicking(true)} />
      )}

      {setCount > 0 && (
        <Button
          label={`Finish session · ${setCount} ${setCount === 1 ? 'set' : 'sets'}`}
          icon={<Ionicons name="flag" size={16} color={colors.onFrost} />}
          onPress={save}
        />
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingBottom: 12,
    backgroundColor: 'rgba(7,11,22,0.92)',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBtn: {
    minWidth: 44,
    height: 40,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  discardText: { fontFamily: font, color: colors.danger, fontSize: 13, fontWeight: '800' },
  headerMid: { flex: 1, alignItems: 'center' },
  elapsed: { fontFamily: display, color: colors.text, fontSize: 26, lineHeight: 28, fontWeight: '700', fontVariant: ['tabular-nums'] },
  headerSub: { fontFamily: font, color: colors.muted, fontSize: 11, fontWeight: '700' },
  finish: { height: 40, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.frost },
  finishText: { fontFamily: font, color: colors.onFrost, fontSize: 14, fontWeight: '800' },

  entryHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  entryNum: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cardRaised },
  entryNumText: { fontFamily: display, color: colors.text, fontSize: 17, fontWeight: '700' },
  exName: { fontFamily: display, color: colors.text, fontSize: 26, lineHeight: 28, fontWeight: '700' },
  exMeta: { fontFamily: font, color: colors.faint, fontSize: 12, fontWeight: '600' },

  colHead: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8, marginTop: 4 },
  colText: { fontFamily: font, color: colors.faint, fontSize: 11, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  prevCol: { width: 58 },
  inputCol: { flex: 1, flexBasis: 0, minWidth: 0, textAlign: 'center' },

  setRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 12 },
  setRowDone: { backgroundColor: colors.frost },
  setIndex: { fontFamily: display, color: colors.muted, fontSize: 17, fontWeight: '700' },
  prev: { fontFamily: font, color: colors.faint, fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
  input: {
    flex: 1,
    // Text inputs have an intrinsic minimum width; without this they overflow the card on narrow phones.
    minWidth: 0,
    flexBasis: 0,
    fontFamily: font,
    backgroundColor: colors.cardRaised,
    color: colors.text,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 9,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  inputDone: { backgroundColor: 'rgba(11,19,36,0.08)', color: colors.onFrost },
  check: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cardRaised },
  checkDone: { backgroundColor: colors.onFrost },
  addSet: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  addSetText: { fontFamily: font, color: colors.text, fontSize: 13, fontWeight: '700' },

  emptyTitle: { fontFamily: display, color: colors.text, fontSize: 44, lineHeight: 44, fontWeight: '700' },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.cardRaised, borderRadius: radius.sm, paddingHorizontal: 14 },
  search: { flex: 1, minWidth: 0, fontFamily: font, color: colors.text, paddingVertical: 12, fontSize: 15, fontWeight: '600' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.border },
  optionName: { flex: 1, fontFamily: font, color: colors.text, fontSize: 15, fontWeight: '700' },
  optionKind: { fontFamily: font, color: colors.faint, fontSize: 12, fontWeight: '600' },

  restWrap: { position: 'absolute', left: 16, right: 16 },
  rest: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingLeft: 16,
    paddingRight: 10,
    borderRadius: 20,
    backgroundColor: colors.frostLo,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  restFill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: colors.frostHi },
  restLabel: { fontFamily: font, color: colors.onFrostMuted, fontSize: 11, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  restTime: { fontFamily: display, color: colors.onFrost, fontSize: 26, lineHeight: 28, fontWeight: '700', fontVariant: ['tabular-nums'] },
  restBtn: { height: 38, paddingHorizontal: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(11,19,36,0.1)' },
  restBtnText: { fontFamily: font, color: colors.onFrost, fontSize: 13, fontWeight: '800' },
});
