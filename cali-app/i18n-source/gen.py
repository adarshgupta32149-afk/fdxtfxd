"""Writes src/i18n/en.ts from keys.json, and src/i18n/locales/index.ts from the locale files present."""
import json, pathlib, re
root = pathlib.Path(__file__).resolve().parent.parent / 'src' / 'i18n'
store = json.loads(pathlib.Path(__file__).with_name('keys.json').read_text())
keys = dict(sorted(store.items()))
base = sorted({re.sub(r'_(zero|one|two|few|many|other)$', '', k) for k in keys})
lines = ['// Generated from the app’s English strings. English is the default language and the fallback.',
         '// Plural keys end in _one / _other (other languages may add _few, _many, _two, _zero).',
         "import type { Dict } from './core';", '',
         'export const en: Dict = {']
for k, v in keys.items():
    lines.append(f'  {json.dumps(k)}: {json.dumps(v, ensure_ascii=False)},')
lines += ['};', '', '/** Every translation key the app uses (plural keys without their suffix). */', 'export type Key =']
lines += [f'  | {json.dumps(b)}' for b in base]
lines[-1] += ';'
(root / 'en.ts').write_text('\n'.join(lines) + '\n')
locs = sorted(p.stem for p in (root / 'locales').glob('*.ts') if p.stem != 'index')
ident = lambda c: 'l_' + c.replace('-', '_')
out = ['// Generated: one dictionary per language. Missing keys fall back to English.', "import type { Dict } from '../core';", '']
out += [f"import {ident(c)} from './{c}';" for c in locs]
out += ['', 'export const LOCALES: Record<string, Dict> = {'] + [f"  {json.dumps(c)}: {ident(c)}," for c in locs] + ['};']
(root / 'locales' / 'index.ts').write_text('\n'.join(out) + '\n')
print(f'en.ts: {len(keys)} strings, {len(base)} keys; locales: {len(locs)}')
