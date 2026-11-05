import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { TrialBanner } from '@/components/TrialBanner';
import { Button, Card, H2, Muted, Screen } from '@/components/ui';
import { useAppState } from '@/state/AppStateProvider';
import { colors, radius, space } from '@/theme';

export default function ProfileScreen() {
  const { state, access, updateProfile, eraseAllData, dev } = useAppState();
  const [name, setName] = useState(state.profile.displayName);
  const [weight, setWeight] = useState(state.profile.bodyweightKg?.toString() ?? '');
  const [confirmErase, setConfirmErase] = useState(false);

  const saveWeight = () => {
    const kg = parseFloat(weight.replace(',', '.'));
    updateProfile({ bodyweightKg: Number.isFinite(kg) && kg > 0 ? kg : undefined });
  };

  return (
    <Screen>
      <Card>
        <H2>You</H2>
        <Muted>Name</Muted>
        <TextInput
          style={s.input}
          value={name}
          onChangeText={setName}
          onBlur={() => updateProfile({ displayName: name.trim() })}
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

      <TrialBanner />
      {access.status !== 'pro' && <Button label="See Founder Pass" variant="gold" onPress={() => router.push('/paywall')} />}

      <Card>
        <H2>Your data</H2>
        <Muted>Everything is stored on this phone. Erasing removes all workouts, skills and your profile.</Muted>
        <Button
          label={confirmErase ? 'Tap again to erase everything' : 'Erase all my data'}
          variant="danger"
          onPress={() => {
            if (!confirmErase) return setConfirmErase(true);
            eraseAllData();
            setName('');
            setWeight('');
            setConfirmErase(false);
          }}
        />
      </Card>

      {__DEV__ && (
        <Card style={{ borderColor: colors.blue }}>
          <H2 style={{ color: colors.blue }}>Developer tools</H2>
          <Muted>Only visible in development builds. Use these to test the trial and Pro states.</Muted>
          <View style={{ gap: space.sm }}>
            <Button label={state.isPro ? 'Turn Pro off' : 'Simulate Pro'} variant="secondary" onPress={() => dev.setPro(!state.isPro)} />
            <Button label="Age trial by 30 days" variant="secondary" onPress={() => dev.ageTrial(30)} />
            <Button label="Restart trial" variant="secondary" onPress={dev.restartTrial} />
          </View>
        </Card>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  input: {
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
