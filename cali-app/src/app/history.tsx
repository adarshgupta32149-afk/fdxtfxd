import { FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Backdrop, H1, Muted, styles } from '@/components/ui';
import { WorkoutCard } from '@/components/WorkoutCard';
import { useAppState } from '@/state/AppStateProvider';
import { space } from '@/theme';

export default function HistoryScreen() {
  const { state } = useAppState();
  const insets = useSafeAreaInsets();
  const workouts = [...state.workouts].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <Backdrop>
      <FlatList
        style={styles.fill}
        contentContainerStyle={[styles.screenContent, { paddingTop: insets.top + 60, gap: 10 }]}
        data={workouts}
        keyExtractor={(w) => w.id}
        ListHeaderComponent={
          <View style={{ gap: 4, marginBottom: space.md }}>
            <H1>History</H1>
            <Muted>
              {workouts.length} {workouts.length === 1 ? 'workout' : 'workouts'} logged
            </Muted>
          </View>
        }
        renderItem={({ item }) => <WorkoutCard workout={item} />}
        ListEmptyComponent={<Muted>Your workouts will show up here.</Muted>}
        showsVerticalScrollIndicator={false}
      />
    </Backdrop>
  );
}
