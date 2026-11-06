import { useCallback } from 'react';

import { agoParts } from '@/lib/social';

import { useT } from './index';

/** "5m", "3h"… in the app language, e.g. "5 मि." in Hindi or "5分" in Japanese. */
export function useAgo() {
  const { t, lang } = useT();
  return useCallback(
    (iso: string, now: Date) => {
      const { unit, n } = agoParts(iso, now);
      if (unit === 'now') return t('ago.now');
      if (unit === 'date') return new Date(iso).toLocaleDateString(lang, { day: 'numeric', month: 'short' });
      return t(`ago.${unit}`, { n });
    },
    [t, lang],
  );
}
