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
| **E** | Egyfázisú motorindítás | Motorvezérlés | Mágneskapcsoló, öntartás, egypólusú motorvédő, egyfázisú motor |
| **F** | Háromfázisú mérőhely | Mérőhely | Főbiztosító, fogyasztásmérő, főkapcsoló, 4 pólusú Fi-relé, fázisonként egy kör |
| **G** | Egyfázisú mérőhely | Mérőhely | Fogyasztásmérő (1-3 / 4-6), főkismegszakító, Fi-relé, dugalj és lámpa |
| **H** | Csillag-delta indítás | Motorvezérlés | K1 fő, K2 csillag, K3 delta, KT időrelé, 6 kivezetésű motor, kölcsönös reteszelés |

Az A-D feladat a vizsga gyakorlati feladatlapjainak rajzaiból készült.
Az E, F, G és H kiegészítés, nem azokból származik - lásd [`docs/source-analysis.md`](docs/source-analysis.md).

## Öt tanulási mód feladatonként

- **Áttekintés** - mit csinál a kapcsolás, miből áll, hogyan folyik benne az energia és a vezérlés,
  mi a tipikus vizsgahiba, és mi az, ami a rajzból önmagában nem határozható meg.
- **Vezetett megoldás** - kis lépések, mindegyik végén egy ellenőrző kérdés. A magyarázat csak
  válasz után jelenik meg, és minden lépés kiemelhető a rajzon.
- **Gyakorlás** - kábelt húzol a sorkapcsok közé, és a tábla közben élő: feszültség alatt a
  kapcsolók, nyomógombok bekötés közben is működnek. Visszavonás, újra, egy kötés felfedése,
  teljes megoldás, huzallista és magyarázó hibaüzenetek.
- **Mérés · jegyzőkönyv** - műszerek a táblán: PE-folytonosság, szigetelés (500 V DC), hurokimpedancia
  (Zs ≤ U0/Ia), Fi-relé (IΔn, 5×IΔn), L-N feszültség, forgásirány, működési próba. Minden
  „vizsgahelyzet” véletlen hálózati értékeket ad, így jó bekötés mellett is lehet nem megfelelő
  eredmény. A jegyzőkönyvbe átírod a mért értéket és értékelsz; az ellenőrzés a sorrendet
  (PE → szigetelés feszültségmentesen → feszültség alatti mérések) és a tiltott, feszültség
  alatti szigetelésmérést is pontozza.
- **Vizsgamód** - egy képernyőn: bekötés a táblán, mérés, jegyzőkönyv és kérdések, opcionális
  időzítővel. Beadáskor a bekötés, a jegyzőkönyv és a hat kérdéskategória (rajzolvasás,
  készülékismeret, bekötési pontosság, működés megértése, biztonsági szemlélet, ellenőrzési
  sorrend) együtt adja az eredményt.

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
    tasks/task[A-G].ts      a hét tábla és referenciamegoldása
    tasks/content[A-G].ts   a hozzájuk tartozó magyar tananyag
    components.ts           készülékkönyvtár-oldal tartalma
    inspection.ts           kilenc szakaszos ellenőrzési lista
    glossary.ts             fogalomtár
  features/
    diagram/                a tábla vezérlője és React-burka, kártya-előnézet
    guided/ wiring/ exam/ simulation/    a négy tanulási mód panelje
  pages/                    dashboard, munkafelület, könyvtár, ellenőrzés, névjegy
  styles/                   design tokenek, tábla-stílusok, nyomtatás
```

A tábla rajzolása szándékosan imperatív (`features/diagram/boardEngine.ts`): húzás közben
másodpercenként sokszor kell újrarajzolni negyven készüléket, ezt közvetlen DOM-mal lehet
gyorsan megtenni. A React egyetlen konténeren keresztül kezeli, és eseményekkel kapja vissza
az állapotot.

## Új feladat felvétele

1. Hozz létre egy `src/data/tasks/taskH.ts` fájlt: cím, kategória, `world` méret, `parts`
   lista és `solution` huzallista (`[kapocs, kapocs, szín]`).
2. Írd meg a `contentH.ts`-t: célok, tipikus hibák, vezetett lépések, vizsgakérdések, és ha
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
