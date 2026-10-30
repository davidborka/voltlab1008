# Kérdésbank séma

Each part file `content/interaktiv/parts/<name>.json` is a JSON array of question objects.
Validate with `npm run interaktiv`.

Common fields (all required unless marked optional):

| field | value |
|---|---|
| `id` | unique, e.g. `IV-ev-012` |
| `part` | `"I"`, `"II"`, `"III"` or `"IV"` (vizsgarész) |
| `topic` | a topic id from `data/topics.json` belonging to that part |
| `type` | `single`, `multi`, `truefalse`, `order`, `match`, `group`, `dropdown`, `number` |
| `difficulty` | 1 (easy), 2, 3 (hard) |
| `points` | integer 1–6 (single = 1–2; others ≈ number of scorable elements, max 6) |
| `q` | question text in Hungarian. Light HTML allowed: `<b> <i> <sub> <sup> <br>` |
| `svg` | optional inline `<svg ...>` drawing (black strokes, no fixed background, `viewBox` set, no scripts) |
| `explanation` | required, Hungarian, 2–6 sentences: why the right answer is right, the rule/formula behind it, the typical mistake. For calculations: the full worked solution with units. |
| `source` | where the fact comes from (standard number, textbook file, past exam) |

Type-specific fields:

- `single`: `options` (2–6 strings), `answer` = `[index]`, optional `wrongWhy` (array same length as options; `null` at the correct index, a short reason at each wrong one).
- `multi`: `options` (3–8), `answer` = indices (at least 1 correct AND at least 1 wrong), optional `wrongWhy`.
- `truefalse`: `statements` = `[{ "text": "...", "answer": true|false }]` (1–6). One statement = classic igaz/hamis.
- `order`: `items` = strings in the CORRECT order (3–7). The app shuffles. `q` must say the ordering rule.
- `match`: `pairs` = `[[left, right], ...]` (3–6), optional `distractors` = extra right-side strings that match nothing.
- `group`: `groups` = group names (2–4), `items` = `[{ "text": "...", "group": groupIndex }]` (4–10), every group gets ≥1 item.
- `dropdown`: `text` = sentence(s) with placeholders `{0}`, `{1}` …; `blanks` = `[{ "options": [...], "answer": index }]`, one per placeholder.
- `number`: `fields` = `[{ "label": "...", "unit": "V", "answer": 3.45, "tol": 0.02 }]`. `tol` is relative (0.02 = ±2 %); use `"tolAbs"` instead for absolute tolerance. Answers are what a careful student gets with the given data and rounding stated in `q`.

Rules: the question must be answerable from `q` (+`svg`) alone. Use current terminology (hibavédelem, alapvédelem, MSZ HD 60364, MSZ EN 62305, MSZ 1585:2016), mentioning old names (közvetett/közvetlen érintés elleni védelem, MSZ 2364, MSZ 274) only in explanations. Write original wording, never paste textbook paragraphs.
