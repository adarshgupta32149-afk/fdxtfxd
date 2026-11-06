import Ionicons from '@expo/vector-icons/Ionicons';
import { getLocales } from 'expo-localization';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { PressScale, Rise } from '@/components/motion';
import { Card, H1, Muted, Screen } from '@/components/ui';
import { useT } from '@/i18n';
import { matchLanguage } from '@/i18n/core';
import { LANGUAGES, languageByCode, type Language } from '@/i18n/languages';
import * as haptics from '@/lib/haptics';
import { colors, font, radius } from '@/theme';

function phoneLanguage(): string | null {
  try {
    return matchLanguage(getLocales()[0]?.languageTag);
  } catch {
    return null;
  }
}

function LanguageRow({ language, selected, onPress }: { language: Language; selected: boolean; onPress: () => void }) {
  return (
    <PressScale onPress={onPress} scaleTo={0.98} style={[s.row, selected && s.rowOn]} accessibilityLabel={`${language.native}, ${language.english}`}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[s.native, selected && { color: colors.onFrost }]}>{language.native}</Text>
        {language.native !== language.english && <Text style={[s.english, selected && { color: colors.onFrostMuted }]}>{language.english}</Text>}
      </View>
      {selected ? <Ionicons name="checkmark-circle" size={22} color={colors.onFrost} /> : <View style={s.radio} />}
    </PressScale>
  );
}

export default function LanguageScreen() {
  const { t, lang, setLanguage, needsRestart } = useT();
  const [query, setQuery] = useState('');
  const [suggested] = useState(phoneLanguage);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return LANGUAGES;
    return LANGUAGES.filter((l) => l.english.toLowerCase().includes(q) || l.native.toLowerCase().includes(q) || l.code.toLowerCase().startsWith(q));
  }, [query]);

  const pick = (code: string) => {
    haptics.tap();
    setLanguage(code);
  };
  const suggestion = suggested && suggested !== lang ? languageByCode(suggested) : undefined;

  return (
    <Screen headerInset contentStyle={{ gap: 16 }}>
      <Rise>
        <H1>{t('lang.title')}</H1>
        <Muted style={{ marginTop: 6 }}>{t('lang.intro')}</Muted>
      </Rise>

      {needsRestart && (
        <View style={s.notice}>
          <Ionicons name="refresh" size={16} color={colors.ember} />
          <Text style={s.noticeText}>{t('lang.restart')}</Text>
        </View>
      )}

      <View style={s.search}>
        <Ionicons name="search" size={16} color={colors.faint} />
        <TextInput style={s.searchInput} value={query} onChangeText={setQuery} placeholder={t('lang.search')} placeholderTextColor={colors.faint} autoCorrect={false} />
      </View>

      {suggestion && !query && (
        <View style={{ gap: 8 }}>
          <Text style={s.label}>{t('lang.suggested')}</Text>
          <LanguageRow language={suggestion} selected={false} onPress={() => pick(suggestion.code)} />
        </View>
      )}

      <View style={{ gap: 8 }}>
        <Text style={s.label}>{t('lang.all', { count: LANGUAGES.length })}</Text>
        {list.map((l) => (
          <LanguageRow key={l.code} language={l} selected={l.code === lang} onPress={() => pick(l.code)} />
        ))}
        {list.length === 0 && <Muted>{t('lang.none', { query })}</Muted>}
      </View>

      <Card style={s.note}>
        <Ionicons name="information-circle-outline" size={18} color={colors.muted} />
        <Text style={s.noteText}>{t('lang.note')}</Text>
      </Card>
    </Screen>
  );
}

const s = StyleSheet.create({
  notice: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, backgroundColor: colors.emberSoft },
  noticeText: { flex: 1, fontFamily: font, color: colors.text, fontSize: 13, fontWeight: '700' },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, borderRadius: radius.md, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  searchInput: { flex: 1, minWidth: 0, fontFamily: font, color: colors.text, fontSize: 15, fontWeight: '600', paddingVertical: 12, outlineWidth: 0 },
  label: { fontFamily: font, color: colors.muted, fontSize: 12, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 16, borderRadius: radius.md, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  rowOn: { backgroundColor: colors.frost, borderColor: colors.frost },
  native: { fontFamily: font, color: colors.text, fontSize: 16, fontWeight: '800' },
  english: { fontFamily: font, color: colors.faint, fontSize: 12, fontWeight: '600', marginTop: 1 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: colors.faint },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  noteText: { flex: 1, fontFamily: font, color: colors.muted, fontSize: 12.5, lineHeight: 18, fontWeight: '600' },
});
