"""Turns tr/<code>.txt ("n|text", or "n.few|text" for extra plural forms) into src/i18n/locales/<code>.ts.
Checks every line: known number, same {placeholders} as English, nothing missing. Usage: build.py <code>..."""
import json, pathlib, re, sys
HERE = pathlib.Path(__file__).parent
OUT = pathlib.Path(__file__).resolve().parent.parent / 'src' / 'i18n' / 'locales'
rows = [l.rstrip('\n').split('\t') for l in open(HERE / 'manifest.tsv', encoding='utf-8')]
num = {int(r[0]): r[1] for r in rows}
en = json.load(open(HERE / 'keys.json', encoding='utf-8'))
ph = lambda s: sorted(set(re.findall(r'\{(\w+)\}', s)))
ok = True
for code in sys.argv[1:]:
    src = HERE / 'tr' / f'{code}.txt'
    out, problems, seen = {}, [], set()
    for ln, line in enumerate(open(src, encoding='utf-8'), 1):
        line = line.rstrip('\n')
        if not line.strip() or line.startswith('#'):
            continue
        if '|' not in line:
            problems.append(f'line {ln}: no "|"'); continue
        ref, text = line.split('|', 1)
        m = re.fullmatch(r'(\d+)(?:\.(zero|one|two|few|many|other))?', ref.strip())
        if not m or int(m.group(1)) not in num:
            problems.append(f'line {ln}: bad ref {ref!r}'); continue
        key = num[int(m.group(1))]
        if m.group(2):
            key = re.sub(r'_(zero|one|two|few|many|other)$', '', key) + '_' + m.group(2)
        text = text.strip().replace('\\n', '\n')
        base_en = en.get(key) or en[num[int(m.group(1))]]
        if ph(text) != ph(base_en):
            problems.append(f'{ref}: placeholders {ph(text)} != {ph(base_en)} ({text!r})')
        if not text:
            problems.append(f'{ref}: empty')
        out[key] = text
        seen.add(int(m.group(1)))
    missing = sorted(set(num) - seen)
    if missing:
        problems.append(f'missing {len(missing)}: {missing[:30]}')
    lines = ['// Generated from the translation table. Missing keys fall back to English.', "import type { Dict } from '../core';", '', 'const dict: Dict = {']
    lines += [f'  {json.dumps(k)}: {json.dumps(v, ensure_ascii=False)},' for k, v in sorted(out.items())]
    lines += ['};', '', 'export default dict;', '']
    (OUT / f'{code}.ts').write_text('\n'.join(lines), encoding='utf-8')
    status = 'OK' if not problems else 'PROBLEMS'
    if problems: ok = False
    print(f'{code}: {len(out)} strings, {status}')
    for p in problems[:20]: print('   ', p)
sys.exit(0 if ok else 1)
