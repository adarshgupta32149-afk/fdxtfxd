import { Redirect } from 'expo-router';
import { TabList, Tabs, TabSlot, TabTrigger } from 'expo-router/ui';

import { FloatingTabBar, TABS } from '@/components/FloatingTabBar';
import { useAppState } from '@/state/AppStateProvider';

export default function TabLayout() {
  const { state } = useAppState();
  // New users land on the welcome flow first.
  if (!state.onboardedAt) return <Redirect href="/welcome" />;

  return (
    <Tabs style={{ flex: 1 }}>
      <TabSlot />
      <FloatingTabBar />
      {/* The hidden list defines the routes; the floating bar above is what people see and tap. */}
      <TabList style={{ display: 'none' }}>
        {TABS.map((t) => (
          <TabTrigger key={t.name} name={t.name} href={t.href} />
        ))}
      </TabList>
    </Tabs>
  );
}
