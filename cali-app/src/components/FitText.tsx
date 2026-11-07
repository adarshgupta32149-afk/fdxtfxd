import { useState } from 'react';
import { Platform, StyleSheet, Text, type LayoutChangeEvent, type StyleProp, type TextLayoutEvent, type TextStyle, type TextProps } from 'react-native';

/**
 * A big heading that shrinks just enough that no word is split across two lines.
 * Display headings are sized for short English words; "képességeidet", "திறன்களைக்" or
 * "Προπόνησε" would otherwise break mid-word. Lines without spaces (Japanese, Chinese) are
 * kept whole, so put the line breaks you want in the text with \n.
 *
 * Web measures the words with a canvas. iOS and Android shrink in small steps until the
 * laid-out lines only break where the text has a space or a \n.
 */
type Props = Omit<TextProps, 'children' | 'style'> & {
  children: string;
  style: StyleProp<TextStyle>;
  /** Never go below this share of the original size. */
  minScale?: number;
};

const NO_SPACES = /^[^\s]*[぀-ヿ㐀-鿿豈-﫿][^\s]*$/;

/** The pieces that must each stay on one line: words, or whole lines in scripts without spaces. */
export function unbreakableUnits(text: string): string[] {
  return text
    .split('\n')
    .flatMap((line) => (NO_SPACES.test(line.trim()) ? [line.trim()] : line.split(/\s+/)))
    .filter(Boolean);
}

/** Largest scale (≤ 1, ≥ minScale) at which the widest unit fits the width. */
export function fitScale(widest: number, available: number, minScale: number): number {
  if (widest <= 0 || available <= 0 || widest <= available) return 1;
  return Math.max(minScale, Math.floor((available / widest) * 100) / 100);
}

/** True when a line ends somewhere the text has no space or line break, i.e. a word was split. */
export function brokeMidWord(lines: string[]): boolean {
  return lines.slice(0, -1).some((line) => line.length > 0 && !/[\s\n]$/.test(line));
}

let canvas: CanvasRenderingContext2D | null = null;
function measureWeb(units: string[], style: TextStyle): number {
  if (typeof document === 'undefined') return 0;
  canvas ??= document.createElement('canvas').getContext('2d');
  if (!canvas) return 0;
  canvas.font = `${style.fontStyle ?? 'normal'} ${style.fontWeight ?? '400'} ${style.fontSize ?? 16}px "${style.fontFamily ?? 'sans-serif'}", sans-serif`;
  const spacing = style.letterSpacing ?? 0;
  return Math.max(...units.map((u) => canvas!.measureText(u).width + spacing * Array.from(u).length));
}

export function FitText({ children, style, minScale = 0.5, ...rest }: Props) {
  const flat = StyleSheet.flatten(style) ?? {};
  const base = flat.fontSize ?? 16;
  const [webScale, setWebScale] = useState(1);
  const [nativeScale, setNativeScale] = useState(1);
  const scale = Platform.OS === 'web' ? webScale : nativeScale;

  const onLayout = (e: LayoutChangeEvent) => {
    rest.onLayout?.(e);
    if (Platform.OS !== 'web') return;
    const widest = measureWeb(unbreakableUnits(children), { ...flat, fontSize: base });
    setWebScale(fitScale(widest, e.nativeEvent.layout.width - 2, minScale));
  };
  const onTextLayout = (e: TextLayoutEvent) => {
    rest.onTextLayout?.(e);
    if (Platform.OS === 'web') return;
    if (brokeMidWord(e.nativeEvent.lines.map((l) => l.text))) setNativeScale((s) => Math.max(minScale, Math.round(s * 92) / 100));
  };

  const sized: TextStyle = { fontSize: Math.floor(base * scale), ...(flat.lineHeight ? { lineHeight: Math.round(flat.lineHeight * scale) } : null) };
  return (
    <Text {...rest} style={[style, sized]} onLayout={onLayout} onTextLayout={onTextLayout}>
      {children}
    </Text>
  );
}
