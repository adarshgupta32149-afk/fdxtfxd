import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { TrialBanner } from '@/components/TrialBanner';
import { Body, Button, Card, H1, H2, Muted, Screen } from '@/components/ui';
import { useAppState, type SyncState } from '@/state/AppStateProvider';
import { colors, font, radius, space } from '@/theme';

function syncLabel(sync: SyncState): string {
  if (sync.status === 'syncing') return 'Syncing…';
  if (sync.status === 'error') return sync.message ?? 'Sync problem. Will retry.';
  if (sync.lastSyncedAt) return `Backed up at ${new Date(sync.lastSyncedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
  return 'Backed up';
}

export default function ProfileScreen() {
  const { state, access, account, backendAvailable, sync, updateProfile, eraseAllData, syncNow, signOut, deleteAccount, dev } = useAppState();
  const [name, setName] = useState(state.profile.displayName);
  const [weight, setWeight] = useState(state.profile.bodyweightKg?.toString() ?? '');
  const [confirm, setConfirm] = useState<'erase' | 'delete' | null>(null);
  const [busy, setBusy] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);

  const saveWeight = () => {
    const kg = parseFloat(weight.replace(',', '.'));
    updateProfile({ bodyweightKg: Number.isFinite(kg) && kg > 0 && kg < 400 ? Math.round(kg * 10) / 10 : undefined });
  };

  return (
    <Screen headerInset>
      <H1>Profile</H1>
      <Card>
        <H2>You</H2>
        <Muted>Name (shown on leaderboards)</Muted>
        <TextInput
          style={s.input}
          value={name}
          onChangeText={setName}
          onBlur={() => updateProfile({ displayName: name.trim().slice(0, 30) })}
          maxLength={30}
          placeholder="What should we call you?"
          placeholderTextColor={colors.muted}
        />
        <Muted>Bodyweight (kg)</Muted>
        <TextInput
          style={s.input}
          value={weight}
          onChangeText={setWeight}
          onBlur={saveWeight}
          keyboardType="decimal-pad"
          placeholder="e.g. 72"
          placeholderTextColor={colors.muted}
        />
      </Card>

      {backendAvailable && (
        <Card>
          <H2>Account</H2>
          {account ? (
            <>
              <Body>{account.email ?? 'Signed in'}</Body>
              <Muted style={sync.status === 'error' ? { color: colors.danger } : undefined}>{syncLabel(sync)}</Muted>
              <View style={{ gap: space.sm }}>
                <Button label="Sync now" variant="glass" onPress={() => void syncNow()} disabled={sync.status === 'syncing'} />
                <Button
                  label="Sign out"
                  variant="glass"
                  disabled={busy}
                  onPress={async () => {
                    setBusy(true);
                    await signOut();
                    setBusy(false);
                    setName('');
                    setWeight('');
                  }}
                />
              </View>
            </>
          ) : (
            <>
              <Muted>Sign in to back up your workouts, keep your trial and progress across phones, and join the leaderboards.</Muted>
              <Button label="Sign in" onPress={() => router.push('/sign-in')} />
            </>
          )}
        </Card>
      )}

      <TrialBanner />
      {access.status !== 'pro' && <Button label="See Founder Pass" variant="primary" onPress={() => router.push('/paywall')} />}

      <Card>
        <H2>Your data</H2>
        {account ? (
          <>
            <Muted>{"Deleting your account permanently removes it and every workout, skill and score stored with it. This can't be undone."}</Muted>
            <Button
              label={confirm === 'delete' ? 'Tap again to delete my account' : 'Delete my account'}
              variant="danger"
              disabled={busy}
              onPress={async () => {
                if (confirm !== 'delete') return setConfirm('delete');
                setBusy(true);
                setAccountError(await deleteAccount());
                setBusy(false);
                setConfirm(null);
                setName('');
                setWeight('');
              }}
            />
          </>
        ) : (
          <>
            <Muted>Everything is stored on this phone. Erasing removes all workouts, skills and your profile.</Muted>
            <Button
              label={confirm === 'erase' ? 'Tap again to erase everything' : 'Erase all my data'}
              variant="danger"
              onPress={() => {
                if (confirm !== 'erase') return setConfirm('erase');
                eraseAllData();
                setName('');
                setWeight('');
                setConfirm(null);
              }}
            />
          </>
        )}
        {accountError && <Body style={{ color: colors.danger }}>{accountError}</Body>}
      </Card>

      {__DEV__ && (
        <Card style={{ borderColor: colors.blue }}>
          <H2 style={{ color: colors.blue }}>Developer tools</H2>
          <Muted>{"Only visible in development builds. When signed in, the next sync resets Pro to the server's value."}</Muted>
          <View style={{ gap: space.sm }}>
            <Button label={state.isPro ? 'Turn Pro off' : 'Simulate Pro'} variant="glass" onPress={() => dev.setPro(!state.isPro)} />
            <Button label="Age trial by 30 days" variant="glass" onPress={() => dev.ageTrial(30)} />
            <Button label="Restart trial" variant="glass" onPress={dev.restartTrial} />
          </View>
        </Card>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  input: {
    fontFamily: font,
    backgroundColor: colors.cardRaised,
    color: colors.text,
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
