import { FlatList, View } from 'react-native';

import { Muted, styles } from '@/components/ui';
import { WorkoutCard } from '@/components/WorkoutCard';
import { useAppState } from '@/state/AppStateProvider';

export default function HistoryScreen() {
  const { state } = useAppState();
  const workouts = [...state.workouts].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.screenContent}
      data={workouts}
      keyExtractor={(w) => w.id}
      renderItem={({ item }) => <WorkoutCard workout={item} />}
      ListEmptyComponent={
        <View style={{ paddingTop: 40, alignItems: 'center' }}>
          <Muted>Your workout history will show up here.</Muted>
        </View>
      }
    />
  );
}
