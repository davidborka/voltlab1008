# Levezetések és alapok (math & physics authoring)

Goal: a learner who only knows primary-school arithmetic understands **every** calculation. No step may
rely on something "you just know". Every formula traces back, in a few plain steps, to a basic idea that
is explained in the foundations explainer `explainers/alapok.json`.

## 1. The foundations explainer — `explainers/alapok.json` (topic id `alapok`)

Same schema as the other explainers (EXPLAINERS.md), but it is not an exam topic. Its sections are the
concept ladder below, in this order, and **with these exact headings** so other files can point to them
as "(Alapok: M2 Képlet átrendezése)":

Matek
- M1 Mértékegységek és előtagok — m, k, M, µ; mm² ↔ m²; W ↔ kW; Wh ↔ kWh; perc ↔ óra; °C ↔ K különbség
- M2 Képlet átrendezése — mindkét oldalon ugyanazt csináljuk; a keresett mennyiség maradjon egyedül
- M3 Tört, reciprok, arány — mit jelent az 1/R; egyenes és fordított arányosság
- M4 Százalék — rész/egész·100; százalékos esés, hatásfok, veszteség
- M5 Négyzet, gyök, π és a kör területe — d²·π/4 honnan jön; √3 ≈ 1,732
- M6 Kerekítés és szabványos sorok — mikor felfelé (keresztmetszet, védelem), tizedesjegyek

Fizika
- F1 Töltés és áram — áram = mennyi töltés folyik át 1 s alatt (vízcső-hasonlat: liter/s)
- F2 Feszültség — a „nyomás”, ami hajtja az áramot; mindig két pont között mérjük
- F3 Ellenállás és Ohm-törvény — U = I·R; miért R = ρ·l/A (hosszabb cső nehezebb, vastagabb könnyebb)
- F4 Soros és párhuzamos kapcsolás — az áram nem vész el (csomópont), a feszültség körben összegződik
- F5 Munka, teljesítmény, energia, hő — P = U·I, W = P·t, veszteség I²·R, hatásfok
- F6 Váltakozó áram — szinusz, 50 Hz, effektív érték (230 V) vs. csúcsérték (≈ 325 V)
- F7 Fáziseltolás és cosφ — hatásos, meddő, látszólagos teljesítmény (P–Q–S háromszög)
- F8 Háromfázisú rendszer — 120°, fázis- és vonali feszültség (230/400 V), honnan a √3, csillag/delta
- F9 Mágnesesség, indukció, transzformátor, motor — forgómező, n = 60·f/p, szlip
- F10 Melegedés és hőmérsékletfüggés — R nő a hővel, ezért van terhelhetőség és korrekciós tényező
- F11 Hibaáram útja és érintésvédelem fizikája — hurok, Zs, Ia, U0, miért old ki a védelem

Every section: 1) everyday intuition (hasonlat), 2) the definition in one sentence, 3) the formula
with every letter and unit named, 4) a tiny worked example with numbers, 5) "hol jön elő a vizsgán".
Formulas in `formulas` each get `derive`. Up to 2 SVGs total are allowed only in `svg`
(e.g. the P–Q–S triangle, or star connection with 230/400 V). 11+6 sections is fine for this file.

## 2. Formula derivations — `formulas[].derive`

Every formula in every explainer gets `"derive": ["step", "step", ...]` (2–6 steps). Each step is one
plain sentence, may contain a tiny calculation, and the chain must end at Alapok concepts, named like
"(Alapok: F3 Ellenállás és Ohm-törvény)". Example for ΔU = 2·I·l·cosφ/(γ·A):

1. A vezeték egy darab ellenállás: R = l/(γ·A) (Alapok: F3).
2. Egyfázisú körben az áram a fázison oda, a nullán vissza megy, tehát a vezető hossza 2·l → R = 2·l/(γ·A).
3. Ohm-törvény: a vezetéken eső feszültség ΔU = I·R = 2·I·l/(γ·A) (Alapok: F3).
4. Váltakozó áramnál csak az áram hatásos része (I·cosφ) okoz a terheléssel egy fázisban lévő esést, ezért szorzunk cosφ-vel (Alapok: F7).

## 3. Worked solutions — `steps/<topic>.json`

One file per topic: `{ "<question id>": { "given": [...], "steps": [...], "check": "..." } }`.
Required for every `number` question and every Part III question (the validator enforces it).

```json
"III-alap-003": {
  "given": ["l = 1,2 m (a vezeték hossza)", "A = 1,5 mm²", "ρ = 0,0175 Ω·mm²/m (réz)"],
  "steps": [
    { "do": "Mit keresünk? Az áramkör ellenállását, vagyis azt az utat, amin az áram ténylegesen végigmegy.",
      "why": "Az áram körben folyik: a fázison oda, a nullán vissza; a PE üzemszerűen nem vezet (Alapok: F4)." },
    { "do": "Az áram útja tehát kétszer olyan hosszú, mint a vezeték.", "calc": "l<sub>út</sub> = 2·1,2 m = 2,4 m" },
    { "do": "Vezeték ellenállása: fajlagos ellenállás × hossz / keresztmetszet.", "calc": "R = 0,0175·2,4 / 1,5 = 0,028 Ω",
      "why": "A mm² számlálóban és nevezőben kiesik, a m is, Ω marad (Alapok: M1, F3)." }
  ],
  "check": "Nagyságrend: 1 m 1,5 mm² réz ≈ 0,012 Ω, 2,4 m ≈ 0,028 Ω – stimmel."
}
```

Rules
- Hungarian, decimal comma, units on every number in `calc`. Light HTML only (`<b> <i> <sub> <sup>`).
- 3–7 steps. Step 1 always says in plain words what we are looking for and what it means physically.
- `why` on every non-trivial step: which basic rule allows it, pointing to an Alapok concept.
  No "ezt tudni kell". If a standard value (e.g. 4 % limit, correction factor) is used, say where it comes from.
- Rounding: say when and why (and round up for cross-sections / protective devices).
- `check`: a sanity check (reverse calculation, units, order of magnitude, or limit comparison).
- The final value must equal the question's answer (`fields[].answer` within `tol`, or the correct option).
  **Verify every number with node** (`node -e "console.log(0.0175*2.4/1.5)"`). If a question itself is wrong,
  do not change it — report it.
- For non-number Part III questions (single/multi/...) the steps compute the value that picks the correct option.
- Validate: `node content/interaktiv/validate.mjs --no-write` (only look at errors for your topics) and
  `node content/interaktiv/validate-explainers.mjs --no-write`.
