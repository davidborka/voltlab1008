# Wave 2: real-exam-style questions

Feedback: the learner scores ~82 % but finds the bank very hard. Evidence about the real 2024-05 KRÉTA
interaktív exam shows it is SIMPLER than our bank: short one-line questions that check one fact or one
formula, 3–5 options, mostly single choice, multi choice and true/false, and single-step calculations.
Typical shapes (our own paraphrases, write your own):
- definition: "Mit nevezünk vonali feszültségnek?" / "Mi az áramütés?"
- colour / marking: "Milyen színű a PE vezető?", "Mit jelent az X a H05VV-F 3X1,5 jelölésben?"
- limit values: "Melyik érték számít törpefeszültségnek?" (multi), "Mekkora a lakóépület … ?"
- device choice: "Hol alkalmazunk D karakterisztikájú kismegszakítót?", "Mit véd a kismegszakító?" (multi)
- formula choice: "Melyik képlettel számolja a háromfázisú hatásos teljesítményt?"
- one-step calc with unit-trap distractors: I = P/(U·cosφ) with options like 9,2 A / 7,82 A / 7,82 Ω
- procedure: "Válassza ki a feszültségmentesítés lépéseit" (multi) or order the steps
- product knowledge: "Melyik a legvékonyabb falú védőcső?" (Mü I/II/III, MG)

Rules for this wave (on top of AUTHORING.md + SCHEMA.md + MATH.md §3):
- Difficulty mix: ~55 % level 1, ~40 % level 2, ~5 % level 3. Points 1–2 (calc 2–3).
- Types: single ~45 %, multi ~20 %, truefalse ~15 %, rest order/match/group/dropdown/number.
- One fact per question; plain wording; no trick double negatives. Every wrong option gets a wrongWhy.
- Do NOT duplicate facts already asked in the same way in content/interaktiv/parts/*.json (read your
  topics' existing questions first); prefer gaps listed in your brief.
- Original wording only, from our sources (~/Documents/villanyszerelo-text) and standard knowledge.
  Never copy any third-party question bank.
- ids: continue the topic's prefix with numbers from 101 (e.g. I-kab-101). File: parts/<your file>.
- Worked steps (MATH.md §3) for every number question and every Part III question, in
  steps/<topic>-b.json (new files; do not edit existing steps files). Verify numbers with node.
- Validate: node content/interaktiv/validate.mjs --no-write (ignore missing-steps errors from other
  authors' new files while they work) — your own file must be clean.
