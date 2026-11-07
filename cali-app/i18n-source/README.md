# Translation sources

English is the default and fallback. Every other language is generated from here.

- `manifest.tsv` — numbered list of every UI string key and its English text.
- `keys.json` — the English strings, keyed.
- `tr/<code>.txt` — one translation per line: `n|text`. Extra plural forms go on the
  `_other` line's number: `47.few|...`, `47.many|...`, `47.two|...`. `\n` is a line break.
  Placeholders such as `{count}` must match the English exactly.
- `python3 build.py <code> [...]` checks a language (missing lines, placeholders) and writes
  `src/i18n/locales/<code>.ts`.
- `python3 gen.py` rewrites `src/i18n/en.ts` and `src/i18n/locales/index.ts`.

Translations were written by AI (Claude) and have not yet been reviewed by
native speakers. Please send corrections.
