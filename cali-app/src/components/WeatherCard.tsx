import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';

import { PressScale } from '@/components/motion';
import type { LocalWeather } from '@/components/useLocalWeather';
import { describeWeather, localTimeAt, to12h, trainingTip } from '@/lib/weather';
import { colors, display, font, panelGradient, radius } from '@/theme';

// Background tint by sky: warm for sun, cool for rain, deep for night.
function skyGradient(code: number, isDay: boolean): readonly [string, string, string] {
  if (!isDay) return ['#1A2347', '#111936', '#0B1124'];
  if (code === 0 || code <= 2) return ['#3A3354', '#22264A', '#121A34'];
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95) return ['#1C3150', '#142540', '#0D1830'];
  return panelGradient;
}

function Chip({ icon, text }: { icon: React.ComponentProps<typeof Ionicons>['name']; text: string }) {
  return (
    <View style={s.chip}>
      <Ionicons name={icon} size={13} color={colors.muted} />
      <Text style={s.chipText}>{text}</Text>
    </View>
  );
}

export function WeatherCard({ data, now }: { data: LocalWeather; now: Date }) {
  const { status, place, weather, weatherError, enable } = data;

  if (status === 'idle' || status === 'denied' || status === 'unavailable') {
    const denied = status === 'denied';
    return (
      <LinearGradient colors={panelGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.card}>
        <View style={s.askRow}>
          <View style={s.askIcon}>
            <Ionicons name={denied ? 'location-outline' : 'partly-sunny'} size={22} color={colors.onFrost} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.askTitle}>{denied ? 'Location is off' : 'Weather where you train'}</Text>
            <Text style={s.askText}>
              {denied
                ? Platform.OS === 'web'
                  ? 'Allow location for this site in your browser to see local weather and time.'
                  : 'Turn on location for Cali in Settings to see local weather and time.'
                : status === 'unavailable'
                  ? 'We could not find your location. Check that location services are on.'
                  : 'Live temperature, conditions and the local time, with a tip for today’s session.'}
            </Text>
          </View>
        </View>
        {!denied && (
          <PressScale onPress={enable} style={s.askBtn} accessibilityLabel="Use my location">
            <Ionicons name="navigate" size={14} color={colors.onFrost} />
            <Text style={s.askBtnText}>{status === 'unavailable' ? 'Try again' : 'Use my location'}</Text>
          </PressScale>
        )}
      </LinearGradient>
    );
  }

  if (status === 'locating' && !weather) {
    return (
      <LinearGradient colors={panelGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.card, s.loading]}>
        <ActivityIndicator color={colors.glow} />
        <Text style={s.askText}>Finding you and checking the sky…</Text>
      </LinearGradient>
    );
  }

  const d = weather ? describeWeather(weather.code, weather.isDay) : null;
  const time = weather ? localTimeAt(now, weather.utcOffsetSec) : now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const sunset = to12h(weather?.sunset ?? null);
  const sunrise = to12h(weather?.sunrise ?? null);
  const afterSunset = weather?.sunset ? time.endsWith('pm') && !weather.isDay : false;

  return (
    <LinearGradient colors={weather ? skyGradient(weather.code, weather.isDay) : panelGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.card}>
      <View style={s.top}>
        <View style={s.placeRow}>
          <Ionicons name="location" size={14} color={colors.ember} />
          <Text style={s.place} numberOfLines={1}>
            {place ?? 'Your location'}
          </Text>
        </View>
        <Text style={s.time}>{time}</Text>
      </View>

      {weather && d ? (
        <>
          <View style={s.main}>
            <Text style={s.temp}>{Math.round(weather.tempC)}°</Text>
            <View style={{ flex: 1, gap: 2 }}>
              <View style={s.condRow}>
                <Ionicons name={d.icon} size={22} color={d.icon === 'sunny' || d.icon === 'partly-sunny' ? colors.gold : colors.glow} />
                <Text style={s.cond}>{d.label}</Text>
              </View>
              <Text style={s.feels}>Feels like {Math.round(weather.feelsC)}°</Text>
            </View>
          </View>
          <View style={s.chips}>
            <Chip icon="water-outline" text={`${Math.round(weather.humidity)}%`} />
            <Chip icon="flag-outline" text={`${Math.round(weather.windKmh)} km/h`} />
            {weather.uvMax != null && <Chip icon="sunny-outline" text={`UV ${Math.round(weather.uvMax)}`} />}
            {(afterSunset ? sunrise : sunset) && <Chip icon={afterSunset ? 'sunny' : 'moon-outline'} text={afterSunset ? `Rise ${sunrise}` : `Set ${sunset}`} />}
          </View>
          <View style={s.tip}>
            <Ionicons name="flash" size={13} color={colors.ember} />
            <Text style={s.tipText}>{trainingTip(weather)}</Text>
          </View>
        </>
      ) : (
        <Text style={s.askText}>{weatherError ?? 'Weather is unavailable right now.'}</Text>
      )}
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: 16, gap: 12, borderWidth: 1, borderColor: 'rgba(158,194,255,0.18)' },
  loading: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 22 },
  askRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  askIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.gold },
  askTitle: { fontFamily: font, color: colors.text, fontSize: 15, fontWeight: '800' },
  askText: { fontFamily: font, color: colors.muted, fontSize: 13, lineHeight: 18, fontWeight: '600' },
  askBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 9, paddingHorizontal: 14, borderRadius: 12, backgroundColor: colors.frost },
  askBtnText: { fontFamily: font, color: colors.onFrost, fontSize: 13, fontWeight: '800' },

  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  placeRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 1 },
  place: { fontFamily: font, color: colors.text, fontSize: 14, fontWeight: '800', flexShrink: 1 },
  time: { fontFamily: font, color: colors.muted, fontSize: 13, fontWeight: '800', fontVariant: ['tabular-nums'] },
  main: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  temp: { fontFamily: display, color: colors.text, fontSize: 64, lineHeight: 66, fontWeight: '600' },
  condRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cond: { fontFamily: font, color: colors.text, fontSize: 17, fontWeight: '800' },
  feels: { fontFamily: font, color: colors.muted, fontSize: 13, fontWeight: '600' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 5, paddingHorizontal: 10, borderRadius: radius.pill, backgroundColor: 'rgba(228,228,230,0.08)' },
  chipText: { fontFamily: font, color: colors.text, fontSize: 12, fontWeight: '700' },
  tip: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(228,228,230,0.1)' },
  tipText: { flex: 1, fontFamily: font, color: colors.text, fontSize: 13, lineHeight: 18, fontWeight: '700' },
});
