# Tananyag-magyarázók (explainers)

One file per topic: `content/interaktiv/explainers/<topic-id>.json` (topic ids from `topics.json`).
Shown in the app when a learner is weak in that topic, after a wrong answer ("Tanuld meg"), and in the
weak-spot elimination program. Purpose: fix the misunderstanding fast, in exam-relevant depth.

```json
{
  "topic": "feszultsegeses",
  "title": "Feszültségesés számítása",
  "summary": "2–4 mondat: miről szól, mit kérdez belőle a vizsga.",
  "sections": [
    { "h": "Alcím", "body": "Bekezdés (light HTML: <b> <i> <sub> <sup> <br>).", "bullets": ["opcionális", "felsorolás"] }
  ],
  "keyFacts": [ { "k": "Megengedett esés a csatlakozóvezetéken", "v": "1 %" } ],
  "formulas": [ { "f": "ΔU = 2·I·l·cosφ / (γ·A)", "note": "egyfázisú, oda-vissza vezeték" } ],
  "mistakes": [ "Tipikus hiba és hogy miért rossz." ],
  "hooks": [ "Memóriatrükk / szabály egy mondatban." ],
  "svg": "<svg ...>…</svg> (optional, same rules as questions)",
  "sources": [ "MSZ 447:2019", "villanyszerelo-jegyzet.pdf 3.2" ]
}
```

Rules
- Hungarian, current terminology; old names only as "régen: …".
- 3–6 sections, 6–15 keyFacts, 4–8 mistakes, 2–5 hooks. `formulas` only where relevant.
- Every fact must agree with the question bank (`content/interaktiv/parts/*.json`) for that topic — read those questions and their explanations first; the explainer must make every question of the topic answerable. If you find a question you believe is WRONG, do not edit it — list it in your final report with the reason.
- Original wording, no pasted textbook paragraphs. If sources conflict or a fact is uncertain, leave it out.
- Validate: `node content/interaktiv/validate-explainers.mjs` (0 errors).
