# Brief for question-bank authors

Goal: a practice bank for the Hungarian **Villanyszerelő (4 0713 04 07), Épületvillamosság szakmairány — Központi interaktív vizsga** ("Villanyszerelési alapismeretek / szakmai ismeret"). The learner wants to score 70–80 % on the real exam. Questions must be at, or slightly above, real-exam level, technically correct by current Hungarian practice, and teach on every wrong answer.

Official exam blueprint (KKK kivonat, `~/Documents/villanyszerelo-text/kkk/kivonat.txt` and `kecs.txt`): 90 minutes, 30 % of the szakmai vizsga, pass ≥ 40 %.
- I. Alkatrész és anyagismeret 20 %: kábelszerkezetek és szerkezeti elemek szerepe; épületvillamos kiviteli dokumentáció alapján alkatrész- és anyagjegyzék; adott feladathoz kéziszerszám, munkaeszköz kiválasztása listából.
- II. Technológiai ismeret 20 %: kábelfektetési technológia; háromfázisú motorindítás, forgásirányváltás mágneskapcsolós rajzainak kiegészítése; alapszerelési technológiák és kialakítási lehetőségeik; rekonstrukciós vagy megszüntetési munka (added 2024).
- III. Számítási feladatok 20 %: szabványos keresztmetszetű csatlakozó vezeték kiválasztása feszültségesés, terhelhetőség és befolyásoló tényezők alapján; fogyasztók teljesítmény- és energiaigénye, jellemzői. "Simple calculation, answered by choosing/entering a value."
- IV. Villamos biztonsági ismeret 40 %: feszültségmentesítés és lakóépület szerelői ellenőrzésének lépései; rajz alapján villámvédelem főbb részei, túlfeszültség-védelmi megoldások és fokozatok; rajz alapján áramütés elleni védelmi megoldások és eszközök azonosítása; fotovoltaikus rendszerek kialakítása.

The real exam (KRÉTA interaktív vizsga) uses these task types: egyszeres választás, többszörös választás (wrong marks cost points), sorba rendezés, párosítás, csoportosítás, listából választás, szám beírása, plus igaz-hamis. Use all of them, roughly: single 35 %, multi 15 %, truefalse 12 %, number (part III mostly) , dropdown 10 %, match 10 %, order 8 %, group 10 %.

## How to work
1. Read `content/interaktiv/SCHEMA.md` and `content/interaktiv/topics.json` in `~/Code/davidborka/voltlab1008/`. Output must validate: `node content/interaktiv/validate.mjs <your file>`.
2. Digest the source texts listed in your task (all under `~/Documents/villanyszerelo-text/`, extracted from the learner's course Drive; OCR files may have typos). Also read the old exam papers in `vizsga feladat sorok/` (2017, 2021, 2022 Feladatsor + Megoldás, `34_522_04_1_*T`, `6313-11`, `6314-11`, `ocr/2022.01.10 Villanyszerelő T/M`) to calibrate level and typical topics; adapt their content into interactive formats. `kkk/fva_megoldo.txt` is an official IKK practice collection for the sector basic exam: good for question style.
3. Write ORIGINAL wording (no pasted textbook paragraphs). Hungarian, correct technical terms, ékezetek.
4. Correctness beats volume. When standards changed, use the current rule (MSZ HD 60364 series, MSZ 1585:2016, MSZ EN 62305, MSZ EN 61439, OTSZ 54/2014 BM) and say in the explanation what the old rule was if students meet it in older notes. If a fact is uncertain or differs between sources, leave it out.
5. Each question needs a real `explanation` that teaches: the rule, why the distractors are wrong (use `wrongWhy` for single/multi), and a memory hook where useful. For calculations show the full worked solution with formula, substitution, units, rounding.
6. Distractors must be plausible (typical student errors), not silly.
7. About 10–15 % of your questions should be "rajz alapján" with an inline `svg` (simple, clean schematic: black `stroke`, `fill="none"` or black text, `font-family="sans-serif"`, a `viewBox`, width ≤ 640 units). Label everything the question refers to. Make sure the drawing is actually correct.
8. Spread difficulty: ~30 % level 1, 50 % level 2, 20 % level 3. Spread across all your topics in proportion to exam weight.
9. ids: `<part>-<short topic>-<nnn>`, unique within your file.
10. Run the validator until 0 errors. For calculation questions, verify every numeric answer with a quick script (python or node) before writing it.

Finish by reporting: file path, count by topic and type, which sources you used most, and any facts you deliberately left out as uncertain.
