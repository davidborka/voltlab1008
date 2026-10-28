# VOLT LAB 1008

**Interaktív villanyszerelő gyakorlati vizsgafelkészítő.**
Böngészőben futó gyakorlófelület a komplex szakmai vizsga (1008) gyakorlati feladataihoz:
kapcsolási rajz olvasása, készülékismeret, bekötés, működési szimuláció, vizsgamód és
ellenőrzési lista - szerver, adatbázis és regisztráció nélkül.

> **Ez gyakorlófelület feszültségmentes vizsgatáblához.**
> A szimuláció nem helyettesíti az oktatót, a szabványt és a hivatalos vizsgautasítást.
> Valós berendezésen munkát csak feszültségmentesített, a visszakapcsolás ellen biztosított
> állapotban, szakképzett felügyelettel szabad végezni.

## Feladatok

| | Feladat | Kategória | Miről szól |
|---|---|---|---|
| **A** | Épületvillamossági szerelés | Épületvillamosság | Fi-relé, lépcsőházi automata három indítóhelyről, váltókapcsolás, dugalj |
| **B** | Épületvillamossági szerelés | Épületvillamosság | Lépcsőházi automata két nyomógombról, keresztkapcsolás három helyről, dugalj |
| **C** | Motorindítás frekvenciaváltóval | Motorvezérlés | Öntartás, két leállító és két indító nyomógomb, üzemállapot-visszajelzés |
| **D** | Irányváltós motorvezérlés | Motorvezérlés | Két mágneskapcsoló, fáziscsere, kölcsönös villamos reteszelés |
| **E** | Egyfázisú motorindítás | Motorvezérlés | Mágneskapcsoló, öntartás, háromsarkú TM2-E08 motorvédő (a fázis sorosan mindhárom pólusán), egyfázisú motor |
| **F** | Háromfázisú mérőhely | Mérőhely | Főbiztosító, fogyasztásmérő, főkapcsoló, 4P túlfeszültség-védő (Schelinger), 4 pólusú Fi-relé, fázisonként egy kör |
| **G** | Egyfázisú mérőhely | Mérőhely | Qoltec mérő (L 1 → 2, N 3 → 4), főkismegszakító, 2× ELMARK SPD (L-PE, N-PE), Fi-relé, dugalj és lámpa |
| **H** | Csillag-delta indítás | Motorvezérlés | F2 motorvédő, Q11 fő, Q13 csillag, Q15 delta, K1 időrelé, P1-P3 állapotjelzés, 6 kivezetésű motor |
| **I** | Elosztó PEN-szétválasztással | Épületvillamosság | TN-C-S: mérő, PEN → PE-sín → híd → N-sín, földelő, 2× SPD, Fi-relé, lámpa kapcsolóval, dugalj; szigeteléshez bontható híd |
| **J** | 3-as vizsgafeladat: lakossági 1 fázisú mérőhely + főelosztó | Mérőhely | Mérőszekrény (főbiztosító, Qoltec mérő, PEN-szétválasztás, fő földelősín, EPH, 2× SPD) és lakás főelosztó (FM, IDEAL Fi-relé, B16 dugaljkör, B10 világítás); L-N, L-PE, N-PE mérés, PE-folytonosság |

Az A-D és a H feladat a vizsga gyakorlati feladatlapjainak rajzaiból készült (H: „Csillag-delta.pdf”).
Az E, F és G kiegészítés, az I egy vizsgabeszámoló alapján készült (PEN-szétválasztás, földelési rendszerek), nem azokból származik - lásd [`docs/source-analysis.md`](docs/source-analysis.md).
A J a „3”-as szerelési vizsgafeladat lapja alapján készült (Villanyszerelő, Épületvillamosság); az EPH-kérdések
válaszai nyilvános, hivatkozott forrásokra épülnek, a bizonytalan részek a feladat Áttekintésében jelölve vannak.

## A vizsgatábla valós készülékei

Minden feladat pontosan azokból a készülékekből épül, amelyek a vizsgatáblán vannak - a kapcsok
azonosítója a készülékre nyomtatott jelölés:

| Készülék | Kapcsok | Hol |
|---|---|---|
| Qoltec 50888 fogyasztásmérő (nem DIN, lapra csavarozható) | 1 L be → 2 L ki, 3 N be → 4 N ki, 5-6 impulzus | G, I, J |
| Schelinger SPD01-4P-B+C (T1+T2) | L1 L2 L3 N fent, ⏚ lent | F |
| ELMARK SPD-C10 (T2), kettő: L-PE és N-PE | L/N fent, ⏚ lent | G, I, J |
| Schneider TeSys LC1D18 | 1L1 3L2 5L3 / 2T1 4T2 6T3, 13-14 NO, 21-22 NC, A1/A2 | C, D, E, H |
| ELMARK TM2-E08 motorvédő | 1L1 3L2 5L3 / 2T1 4T2 6T3 (+13-14 oldalblokk) | C, D, E, H |
| Finder 82.01 időrelé | A1 B1 15 / 16 18 A2 | H |
| Schneider MIN 15363 lépcsőházi automata | L, N, 3, 4 (mind alul) | A, B |
| Legrand RX³ 1P (B6/B10/B16), Schneider Easy9 3P C16 | 1 / 2, illetve 1-3-5 / 2-4-6 | minden feladat |
| IDEAL KRD10, Legrand RX³ 2P, Schneider Easy9 4P Fi-relé | 1 N / 2 N, illetve N 1 3 5 / N 2 4 6 | A, B, F, G, I, J |
| Legrand Niloé váltó és keresztkapcsoló 7 645 04, Schneider nyomó | L 1 2; L1 L2 / 3 4; L 1 | A, B, I, J |

A teljes katalógus - méretek, források, eltérések és a nem olvasható jelölések - a
[`docs/real-devices/README.md`](docs/real-devices/README.md)-ben és az alkalmazás **Készülékek →
A vizsgatábla** lapján van. Ami nem szerepel a fotókon (motor, lámpa, dugalj, sínek, frekvenciaváltó),
az általános modell, és így is van jelölve. A túlfeszültség-védő mindig a mérő és a
főkapcsoló/főkismegszakító után, a Fi-relé előtt van, és normál üzemben nem vezet - a hálózatszámításban
soha nem okoz zárlatot.

## Hat tanulási mód feladatonként

- **Áttekintés** - mit csinál a kapcsolás, miből áll, hogyan folyik benne az energia és a vezérlés,
  mi a tipikus vizsgahiba, és mi az, ami a rajzból önmagában nem határozható meg.
- **Vezetett megoldás** - kis lépések, mindegyik végén egy ellenőrző kérdés. A magyarázat csak
  válasz után jelenik meg, és minden lépés kiemelhető a rajzon.
- **Gyakorlás** - kábelt húzol a sorkapcsok közé, és a tábla közben élő: feszültség alatt a
  kapcsolók, nyomógombok bekötés közben is működnek. Visszavonás, újra, egy kötés felfedése,
  teljes megoldás, huzallista és magyarázó hibaüzenetek.
- **Mérés · jegyzőkönyv** - műszerek a táblán: PE-folytonosság, szigetelés (500 V DC), hurokimpedancia
  (Zs ≤ U0/Ia), Fi-relé (IΔn, 5×IΔn), hálózati feszültség (L-N, L-PE, N-PE), forgásirány, működési próba. Minden
  „vizsgahelyzet” véletlen hálózati értékeket ad, így jó bekötés mellett is lehet nem megfelelő
  eredmény. A jegyzőkönyvbe átírod a mért értéket és értékelsz; az ellenőrzés a sorrendet
  (PE → szigetelés feszültségmentesen → feszültség alatti mérések) és a tiltott, feszültség
  alatti szigetelésmérést is pontozza.
- **Vizsgamód** - egy képernyőn: bekötés a táblán, mérés, jegyzőkönyv és kérdések, opcionális
  időzítővel. Beadáskor a bekötés, a jegyzőkönyv és a hat kérdéskategória (rajzolvasás,
  készülékismeret, bekötési pontosság, működés megértése, biztonsági szemlélet, ellenőrzési
  sorrend) együtt adja az eredményt.
- **3D bekötés** - a feladat referenciamegoldása a vizsgatábla valós készülékein, valós méretben
  (mm): szerelőlap, DIN-sínek, kábelcsatornák, N- és PE-sínek. Minden huzal színes cső, amely a
  csatornában rendezetten fut, és pontosan a fizikai kapocsba - a csavaros kapocs nyílásába,
  illetve a Niloé push-in nyílásába - lép be. Forgatás és nagyítás (egér, két ujj), **lépésenként**
  a feladat lépései szerint kiemelt huzalok, **összes** nézet; egy kapocsra állva vagy koppintva
  megjelenik a készülék és a nyomtatott jelölés. A J feladatban két szekrény (mérőszekrény és
  lakás főelosztó) és köztük a mért fővezeték védőcsöve látszik. A three.js csak a 3D nézet
  megnyitásakor töltődik le (külön darab), a fő csomag nem nő tőle.

## Mit tud a szimuláció

- Csomóponti (union-find) hálózatszámítás L1/L2/L3, N és PE sínekkel.
- A fogyasztók nem kötik össze a saját kapcsaikat, ezért a fázis-nulla összekötés valódi
  **zárlat**, a fázis-PE pedig **testzárlat**.
- **Szelektív kioldás**: az a védelem old ki, amelyiknek a bontása megszünteti a zárlatot, és
  közben a legtöbb kapcsot hagyja feszültség alatt. A Fi-relé testzárlatra old.
- A mágneskapcsoló meghúzott állapota tárolt állapot, ezért az **öntartás** és a **kölcsönös
  reteszelés** úgy viselkedik, mint a valóságban: K1 és K2 helyes bekötés mellett soha nem
  húzhat meg egyszerre.
- A motor forgásiránya a rá jutó **fázissorrendből** jön - a K-2 fáziscseréje tényleg
  visszafelé forgatja.
- A lépcsőházi automata valós időben jár le. Ha a 3-as kapcson tartósan feszültség van,
  folyamatosan újraindul; a készülék ezt jelzi.

## Bekötés-ellenőrzés

Az ellenőrző **villamosan** hasonlít: nem kábelenként, hanem csomópontonként.

- A **bekötés sorrendje sosem számít** - ezt nem csak állítjuk, tesztek bizonyítják: minden
  feladatra 20 összekevert sorrendet és 10 véletlen sín-átkötést ellenőrzünk.
- A **sorkapocs sínen mindegy, melyik csavart** használod: a sín minden kapcsa egy csomópont.
- Ha más útvonalon vezetted, de ugyanabba a csomópontba, elfogadja, és külön kiírja, hogy
  eltérés van, de helyes.

Hiba marad viszont, ami villamosan tényleg más: N-sín helyett PE-sín, védővezető
kapcsolóérintkezőn át, N és PE összekötése, hiányzó öntartás vagy retesz. A visszajelzés magyarázó, például:

- „A K-1 öntartó ága hiányzik.”
- „A K-1 és K-2 közötti villamos reteszelés hiányzik.”
- „A védővezetőt nem szabad kapcsolóérintkezőn átvezetni.”
- „Ez a csatlakozás ugyanabba a hálózati csomópontba tartozik, ezért elfogadható.”

## Fejlesztés

```bash
npm install
npm run dev      # fejlesztői szerver
npm run test     # Vitest: hálózatszámítás, állapotgépek, ellenőrző
npm run build    # production build a dist/ mappába
npm run preview  # a build kipróbálása
```

Nincs szükség környezeti változóra és titokra.

## Közzététel GitHub Pages-re

A `.github/workflows/deploy.yml` minden `main` ágra tolt változásnál lefuttatja a teszteket,
buildel, majd telepít. Egyszeri beállítás: **Settings → Pages → Source: GitHub Actions**.

A Vite `base` értékét a workflow a repó nevéből állítja be (`BASE_PATH`), így az alkalmazás
helyben és a Pages alkönyvtárában is működik. A navigáció hash-alapú, ezért a frissítés
sosem ad 404-et.

## Architektúra

```
src/
  domain/
    electrical-types.ts     a tartomány típusai: sorkapocs, csomópont, feladat, tananyag
    netlist.ts              csomóponti megoldó, hibafelismerés, szelektív kioldás
    netlist-validation.ts   bekötés-ellenőrzés magyarázó megállapításokkal
  data/
    parts.ts                készülékkönyvtár: méret, sorkapcsok, belső kötések, SVG rajz
    realDevices.ts          a vizsgatábla valós készülékei: jelölés, méret, forrás, eltérések
    tasks/task[A-J].ts      a tíz tábla és lépésenként csoportosított referenciamegoldása
    tasks/content[A-J].ts   a hozzájuk tartozó magyar tananyag
    components.ts           készülékkönyvtár-oldal tartalma
    inspection.ts           kilenc szakaszos ellenőrzési lista
    glossary.ts             fogalomtár
  features/
    diagram/                a tábla vezérlője és React-burka, kártya-előnézet
    board3d/                3D bekötés: layout.ts (elrendezés, huzalvezetés, three.js nélkül),
                            models.ts (eljárással épített készülékmodellek), Board3D.tsx (lusta)
    guided/ wiring/ exam/ simulation/    a négy tanulási mód panelje
  pages/                    dashboard, munkafelület, könyvtár, ellenőrzés, névjegy
  styles/                   design tokenek, tábla-stílusok, nyomtatás
```

A tábla rajzolása szándékosan imperatív (`features/diagram/boardEngine.ts`): húzás közben
másodpercenként sokszor kell újrarajzolni negyven készüléket, ezt közvetlen DOM-mal lehet
gyorsan megtenni. A React egyetlen konténeren keresztül kezeli, és eseményekkel kapja vissza
az állapotot.

## Új feladat felvétele

1. Hozz létre egy `src/data/tasks/taskK.ts` fájlt: cím, kategória, `world` méret, `parts`
   lista (a valós készülékhez `dev` azonosítóval) és a lépésenként csoportosított huzallista
   (`...bySteps([[ [kapocs, kapocs, szín], … ], …])` - csoportonként egy `stepsHu` lépés).
2. Írd meg a `contentK.ts`-t: célok, tipikus hibák, vezetett lépések, vizsgakérdések, és ha
   van a rajzból nem eldönthető érték, az `unresolved` tömb.
3. Vedd fel a `src/data/tasks/index.ts`-ben a `TASKS` és `TASK_ORDER` listába.
4. Futtasd a teszteket: az adatépségi tesztek automatikusan ellenőrzik az új feladatot is
   (léteznek-e a kapcsok, jó-e a `correct` index, hibátlan-e a referenciamegoldás).

Új készüléktípushoz vegyél fel egy bejegyzést a `src/data/parts.ts`-be: `terms`, `links`,
`loads`, `draw`, és ha védelem, akkor `protect`.

## Forrás

Az A, B, C és D feladat a komplex szakmai vizsga gyakorlati feladatlapjainak rajzai alapján
készült (MESTO CSOPORT Kft., 2021. 11. 22.). A rajzokat nem képként mutatjuk be: a kapcsolási
logikát interaktív modellként építettük újra, az eredeti lap összehasonlításként megnyitható a
munkafelületen (`public/source-previews/`).

Ahol a rajz nem ad egyértelmű adatot - például a kismegszakítók áramértéke az A és B feladatban -,
ott nem találtunk ki értéket. Ezek a feladat Áttekintés paneljén külön jelölve vannak, mellettük
feltételezés-kalkulátorral. A teljes forráselemzés: [`docs/source-analysis.md`](docs/source-analysis.md).

A `public/legacy/` alatt megtalálható az előző, build nélküli szimulátor is.
