import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState, type ComponentProps } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { PressScale, Rise } from '@/components/motion';
import { skillIcon } from '@/components/skillIcons';
import { TrialBanner } from '@/components/TrialBanner';
import { Card, H1, Muted, Screen, SectionHead } from '@/components/ui';
import { useT } from '@/i18n';
import { languageByCode } from '@/i18n/languages';
import { BRAND } from '@/lib/brand';
import { completedStepIds } from '@/lib/records';
import { SKILLS } from '@/lib/skills';
import { useAppState, type SyncState } from '@/state/AppStateProvider';
import { colors, display, font, radius } from '@/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

function syncLabel(sync: SyncState, t: ReturnType<typeof useT>['t'], lang: string): string {
  if (sync.status === 'syncing') return t('profile.syncing');
  if (sync.status === 'error') return t('profile.syncProblem');
  if (sync.lastSyncedAt) return t('profile.backedUpAt', { time: new Date(sync.lastSyncedAt).toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' }) });
  return t('profile.backedUp');
}

/** One tappable settings row: icon, label, optional detail, chevron. */
function Row({ icon, label, detail, onPress, tone }: { icon: IconName; label: string; detail?: string; onPress?: () => void; tone?: 'danger' }) {
  const color = tone === 'danger' ? colors.danger : colors.text;
  return (
    <PressScale onPress={onPress} disabled={!onPress} scaleTo={0.98} style={s.row} accessibilityLabel={label}>
      <View style={[s.rowIcon, tone === 'danger' && { backgroundColor: colors.dangerFill }]}>
        <Ionicons name={icon} size={17} color={color} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[s.rowLabel, { color }]}>{label}</Text>
        {detail ? (
          <Text style={s.rowDetail} numberOfLines={2}>
            {detail}
          </Text>
        ) : null}
      </View>
      {onPress && <Ionicons name="chevron-forward" size={16} color={colors.faint} />}
    </PressScale>
  );
}

export default function ProfileScreen() {
  const { state, account, backendAvailable, sync, updateProfile, eraseAllData, syncNow, signOut, deleteAccount, resetOnboarding, dev } = useAppState();
  const { t, lang } = useT();
  const language = languageByCode(lang);
  const [name, setName] = useState(state.profile.displayName);
  const [weight, setWeight] = useState(state.profile.bodyweightKg?.toString() ?? '');
  const [confirm, setConfirm] = useState<'erase' | 'delete' | null>(null);
  const [busy, setBusy] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);

  const steps = useMemo(() => completedStepIds(state).size, [state]);
  const since = new Date(state.onboardedAt ?? state.trialStartedAt).toLocaleDateString(lang, { month: 'short', year: 'numeric' });
  const focus = state.focusSkills.map((id) => SKILLS.find((x) => x.id === id)).filter((x) => x !== undefined);
  const initial = (name.trim()[0] ?? 'C').toUpperCase();

  const saveWeight = () => {
    const kg = parseFloat(weight.replace(',', '.'));
    updateProfile({ bodyweightKg: Number.isFinite(kg) && kg > 0 && kg < 400 ? Math.round(kg * 10) / 10 : undefined });
  };
  const clearLocal = () => {
    setName('');
    setWeight('');
    setConfirm(null);
  };

  return (
    <Screen headerInset contentStyle={{ gap: 22 }}>
      <Rise style={s.hero}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{initial}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <H1 numberOfLines={1}>{name.trim() || t('profile.you')}</H1>
          <Muted>
            {t('profile.since', { date: since })} · {t('count.sessions', { count: state.workouts.length })} · {t('count.steps', { count: steps })}
          </Muted>
        </View>
      </Rise>

      {focus.length > 0 && (
        <Rise delay={60} style={s.focusRow}>
          {focus.map((sk) => (
            <PressScale key={sk.id} onPress={() => router.push({ pathname: '/skills', params: { id: sk.id } })} style={s.focusChip} accessibilityLabel={sk.name}>
              <Ionicons name={skillIcon(sk.id)} size={14} color={colors.text} />
              <Text style={s.focusText}>{sk.name}</Text>
            </PressScale>
          ))}
        </Rise>
      )}

      <Rise delay={110}>
        <TrialBanner />
      </Rise>

      <Rise delay={160} style={{ gap: 10 }}>
        <SectionHead label={t('profile.you')} />
        <Card style={{ gap: 14 }}>
          <View style={s.field}>
            <Text style={s.fieldLabel}>{t('profile.name')}</Text>
            <TextInput
              style={s.input}
              value={name}
              onChangeText={setName}
              onBlur={() => updateProfile({ displayName: name.trim().slice(0, 30) })}
              maxLength={30}
              placeholder={t('profile.namePh')}
              placeholderTextColor={colors.faint}
            />
          </View>
          <View style={s.sep} />
          <View style={s.field}>
            <Text style={s.fieldLabel}>{t('profile.bodyweight')}</Text>
            <TextInput
              style={s.input}
              value={weight}
              onChangeText={setWeight}
              onBlur={saveWeight}
              keyboardType="decimal-pad"
              placeholder="kg"
              placeholderTextColor={colors.faint}
            />
          </View>
        </Card>
      </Rise>

      <Rise delay={185} style={{ gap: 10 }}>
        <SectionHead label={t('profile.settings')} />
        <Card style={{ gap: 4, paddingVertical: 8 }}>
          <Row icon="globe-outline" label={t('menu.language')} detail={language ? (language.code === 'en' ? language.native : `${language.native} · ${language.english}`) : undefined} onPress={() => router.push('/language')} />
        </Card>
      </Rise>

      {backendAvailable && (
        <Rise delay={210} style={{ gap: 10 }}>
          <SectionHead label={t('profile.account')} />
          <Card style={{ gap: 4, paddingVertical: 8 }}>
            {account ? (
              <>
                <Row icon="mail-outline" label={account.email ?? t('profile.signedIn')} detail={syncLabel(sync, t, lang)} />
                <Row icon="sync-outline" label={sync.status === 'syncing' ? t('profile.syncing') : t('profile.syncNow')} onPress={sync.status === 'syncing' ? undefined : () => void syncNow()} />
                <Row
                  icon="log-out-outline"
                  label={t('profile.signOut')}
                  onPress={
                    busy
                      ? undefined
                      : async () => {
                          setBusy(true);
                          await signOut();
                          setBusy(false);
                          clearLocal();
                        }
                  }
                />
              </>
            ) : (
              <Row
                icon="cloud-upload-outline"
                label={t('profile.signInBackup')}
                detail={t('profile.signInBackupText')}
                onPress={() => router.push('/sign-in')}
              />
            )}
          </Card>
        </Rise>
      )}

      <Rise delay={260} style={{ gap: 10 }}>
        <SectionHead label={t('profile.yourData')} />
        <Card style={{ gap: 4, paddingVertical: 8 }}>
          <Row icon="time-outline" label={t('menu.history')} detail={t('menu.history.hint')} onPress={() => router.push('/history')} />
          {account ? (
            <Row
              icon="trash-outline"
              tone="danger"
              label={confirm === 'delete' ? t('profile.deleteConfirm') : t('profile.delete')}
              detail={t('profile.deleteText')}
              onPress={
                busy
                  ? undefined
                  : async () => {
                      if (confirm !== 'delete') return setConfirm('delete');
                      setBusy(true);
                      setAccountError(await deleteAccount());
                      setBusy(false);
                      clearLocal();
                    }
              }
            />
          ) : (
            <Row
              icon="trash-outline"
              tone="danger"
              label={confirm === 'erase' ? t('profile.eraseConfirm') : t('profile.erase')}
              detail={t('profile.eraseText')}
              onPress={() => {
                if (confirm !== 'erase') return setConfirm('erase');
                eraseAllData();
                clearLocal();
              }}
            />
          )}
        </Card>
        {accountError && <Text style={s.error}>{accountError}</Text>}
      </Rise>

      {__DEV__ && (
        <Rise delay={300} style={{ gap: 10 }}>
          <SectionHead label="Developer" />
          <Card style={{ gap: 4, paddingVertical: 8, borderColor: 'rgba(122,162,255,0.3)' }}>
            <Row icon="sparkles-outline" label={state.isPro ? 'Turn Pro off' : 'Simulate Pro'} onPress={() => dev.setPro(!state.isPro)} />
            <Row icon="hourglass-outline" label="Age trial by 30 days" onPress={() => dev.ageTrial(30)} />
            <Row icon="refresh-outline" label="Restart trial" onPress={dev.restartTrial} />
            <Row
              icon="play-back-outline"
              label="Show welcome again"
              onPress={() => {
                resetOnboarding();
                router.replace('/welcome');
              }}
            />
          </Card>
          <Muted style={{ fontSize: 12 }}>{"Only in development builds. When signed in, the next sync resets Pro to the server's value."}</Muted>
        </Rise>
      )}

      <Text style={s.footer}>
        {BRAND.name} · {t('brand.tagline')}
      </Text>
    </Screen>
  );
}

const s = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.frost },
  avatarText: { fontFamily: display, color: colors.onFrost, fontSize: 38, fontWeight: '700' },
  focusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: -6 },
  focusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  focusText: { fontFamily: font, color: colors.text, fontSize: 13, fontWeight: '700' },
  field: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  fieldLabel: { width: 96, fontFamily: font, color: colors.muted, fontSize: 14, fontWeight: '700' },
  input: { flex: 1, minWidth: 0, fontFamily: font, color: colors.text, fontSize: 16, fontWeight: '700', paddingVertical: 6, textAlign: 'right' },
  sep: { height: 1, backgroundColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  rowIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cardRaised },
  rowLabel: { fontFamily: font, fontSize: 15, fontWeight: '700' },
  rowDetail: { fontFamily: font, color: colors.faint, fontSize: 12, fontWeight: '600' },
  error: { fontFamily: font, color: colors.danger, fontSize: 13, fontWeight: '600' },
  footer: { fontFamily: font, color: colors.faint, fontSize: 12, fontWeight: '600', textAlign: 'center', marginTop: 8 },
});
