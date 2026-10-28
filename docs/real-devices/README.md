# A vizsgatábla valós készülékei

A VOLT LAB 1008 feladatai (A-J) pontosan azokból a készülékekből épülnek, amelyek a vizsgatáblán
vannak. A kapocsazonosítók a készülékre nyomtatott jelölések, a 3D bekötés méretei a gyártói
adatlapokból valók. A gépi forrás: [`src/data/realDevices.ts`](../../src/data/realDevices.ts);
az alkalmazásban: **Készülékek → A vizsgatábla**.

A fotók (`photos/01.jpg … 14.jpg`, `photos/15-feladatlap-3.jpg`) **nincsenek a repóban**
(`.gitignore`), a repó nyilvános. A táblázat a fájlnevekre csak hivatkozik.

Szabály: ahol az adatlap és a fotó eltér, **a fotó nyer**, az eltérés lent fel van sorolva. Ahol egy
jelölés nem olvasható, nem találtunk ki helyette semmit.

> Ez gyakorlófelület feszültségmentes vizsgatáblához. A szimuláció nem helyettesíti az oktatót, a
> szabványt és a hivatalos vizsgautasítást.

## Katalógus

| Készülék | Rendelési szám | Fotó | Méret Sz × M × M (mm) | Nyomtatott kapcsok | Fő adatok | Típus az appban | Forrás |
|---|---|---|---|---|---|---|---|
| Qoltec 50888 egyfázisú fogyasztásmérő | 50888 | 01 | 103 × 114 × 48, **nem DIN** (lapra csavarozható) | alul: 1 L be, 2 L ki, 3 N be, 4 N ki; 5(+) 6(−) impulzus | 230 V, 5(60) A, 1600 imp/kWh | `meter1` | [kézikönyv](https://www.qoltec.pl/files/help_files/file-50888-instrukcja-pl-en.pdf) |
| Schelinger SPD01-4P-B+C túlfeszültség-védő | A51-SPD01-4P-B+C | 05, 02 | 72 × 90 × 68, 4 modul | fent L1 L2 L3 N, lent ⏚ (a 3. modul alatt) | T1+T2, Uc 275 V, Iimp 5 kA, In 20 kA, Imax 50 kA, Up ≤ 1,5 kV | `spd4` | [termék](https://bemko.pl/en/product/surge-protector-4p-5ka-10-350-class-t1-t2-b-c-schelinger-3257), [kézikönyv](https://bemko.pl/files/19d/manual-spd-4p.pdf) |
| ELMARK SPD-C10 túlfeszültség-védő | SPD-C10/1P (64102) | 04 | 18 × 90 × 58, 1 modul | fent L/N, lent ⏚ | T2, Uc 275 V, In 10 kA, Imax 20 kA, Up ≤ 1,2 kV | `spd1` | [termék](https://en.elmarkstore.eu/surge-arrester-spd-c10-1p-in-10ka-product4521), [adatlap](https://en.elmarkstore.eu/data/uploads/product3D/64102/64102%20-%20Technical%20specification%20EN.pdf) |
| Schneider TeSys D LC1D18 mágneskapcsoló | LC1D18 | 03 | 45 × 77 × 86 | fent hátul 1L1 3L2 5L3, fent elöl 13 NO, 21 NC, A1; lent elöl 14, 22, A2; lent hátul 2T1 4T2 6T3 | AC-3 18 A, 1 NO + 1 NC | `contactor` | [se.com](https://www.se.com/uk/en/product/download-pdf/LC1D18M7), [RS adatlap](https://docs.rs-online.com/15db/0900766b81680385.pdf) |
| ELMARK TM2-E08 motorvédő kapcsoló | TM2-E08 | 02, 04 | 44,5 × 89 × ~66 (**becsült**) | fent 1L1 3L2 5L3, lent 2T1 4T2 6T3; 13-14 oldalblokk | 2,5-4 A (**következtetett**), STOP piros, START fekete | `mprot` | [ELMARK kategória](https://en.elmarkstore.eu/motor-and-thermal-protection-category117) (a típus nincs listázva) |
| Finder 82.01 multifunkciós időrelé | 82.01 | 02 | 17,5 × 88,8 × 61 (a 80.01 adatlapjából) | fent A1 B1 15, lent 16 18 A2 | kék időállító, 2 kék választó, Power on LED | `timer` | [Finder 80 sorozat](https://cdn.findernet.com/app/uploads/S80EN.pdf) (a 82-es nem volt elérhető) |
| Schneider MIN lépcsőházi automata | 15363 | 06, 02 | 18 × 83 × 68 | mind alul: felső lépcső L, 3; alsó sor N, 4 | 1-7 perc, 16 A 230 V~, auto / állandó | `stair` | [se.com](https://www.se.com/uk/en/product/download-pdf/15363) |
| Legrand RX³ 1P kismegszakító B6 / B10 / B16 | 4 191 33 / 4 191 34 / 4 191 36 | 02, 12, 13 | 17,7 × 83 × 71,6 (váll 43,9, homlok ≈ 60) | fent 1, lent 2 | 6000 A, 230/400 V~ | `mcb` | [Legrand adatlap](https://assets.legrand.com/pim/NP-FT-GT/F01909EN-02.pdf) |
| Schneider Easy9 3P C16 kismegszakító | EZ9F56316 | 02 | 54 × 81 × 66,5 | fent 1 3 5, lent 2 4 6 | C16, 6 kA | `mcb3` | [se.com](https://www.se.com/tr/tr/product/download-pdf/EZ9F56316) |
| IDEAL KRD10-2/25/30-AC Fi-relé | KRD10-2/25/30-AC (Kanlux 38724) | 02, 04 | 36 × 81 × 75, 2 modul | fent 1, N; lent 2, N | 25 A, 30 mA, AC, narancs T gomb | `rcd` (2P) | [Kanlux adatlap](https://www.kanlux.com/storage/products/techniczna/en/38724.pdf) |
| Legrand RX³ 2P 25 A 30 mA AC Fi-relé | 4 020 24 | 02 | 35,6 × 83 × 71,65 | fent 1 · N, lent 2 · N (**nem megerősített**) | 25 A, 30 mA, AC | `rcd` (2P) | [Legrand adatlap (azonos ház)](https://assets.legrand.com/pim/NP-FT-GT/F01534EN-04.pdf) |
| Schneider Easy9 4P 25 A 30 mA AC Fi-relé | EZ9R34425 | 02 | 72 × 82 × 72, 4 modul | fent N 1 3 5, lent N 2 4 6 (**N a bal szélen**) | 25 A, 30 mA, AC | `rcd` (4P) | [se.com](https://www.se.com/tr/tr/product/download-pdf/EZ9R34425) |
| Legrand Niloé keresztkapcsoló | 7 645 04 | 11, 14 | 76 × 76, mélység 45,5 | piros push-in L1 L2, szürke 3 4 (kapcsonként 2 nyílás) | 10 AX 250 V~ | `swx` | [Legrand adatlap](https://assets.legrand.com/pim/NP-FT-GT/F02186FR-02.pdf) |
| Legrand Niloé váltókapcsoló (egysarkúként is) | 7 645 01 | 07 | 76 × 76, mélység 45,5 | felül 1 és L, alul 2 (push-in) | 10 AX 250 V~ | `sw2`, `sw1` | [e-katalógus](https://www.legrand.com/ecatalogue/en/catalog/products/niloe-two-way-switch-1-gang-10-ax-250-v-automatic-terminals-white-764501) |
| Schneider nyomó, csengő jellel (lépcsőházi indító) | EPH0800121 (**valószínű**) | 08, 09 | 83 × 83 × 43 (**nem megerősített**) | 1 (fent), L (lent) | 10 A 250 V~ | `push` | - |
| Legrand nyomó 6 A (sötét szerkezet) | - | 10 | - | L, 1, 2 | 6 A 250 V~ | (nem használt) | - |
| Prysmian H07V vezeték | - | 12 | Ø ≈ 2,8 mm (1,5 mm²) | - | barna, kék, zöld-sárga, fekete, szürke | 3D huzalok | - |

### Nem a fotókon szereplő eszközök (általános modell)

Betáplálás (`feed`, `feed3`, `feedpen`), lámpatest (`lamp`), jelzőlámpa (`pilot`), dugalj (`socket`),
N- és PE-sín (`busbar`), PEN-szétválasztó (`penbar`), földelő (`earthrod`), EPH bekötési pont (`bond`),
motorok (`motor`, `motor1`, `motor6`), frekvenciaváltó (`vfd`), háromfázisú mérő (`meter3`),
főkapcsoló (`mainsw`), vezérlő nyomógombok (`btn`, `btnNC`), hőkioldó (`olr`). Az alkalmazásban
mindegyik „nem a fotókon szereplő eszköz” jelölést kap; a 3D nézet általános formát mutat.

A TeSys LC1D18-on a 13-14 és a 21-22 beépített. A D és H feladat további segédérintkezői
(51-52, 81-82, 53-54, 61-62, 83-84) homlokra pattintható segédérintkező-blokkot igényelnek - ez nem
szerepel a fotókon, a 3D nézet sötét blokként mutatja.

## Feladatonként

| Feladat | Valós készülékek | Változás |
|---|---|---|
| A, B | IDEAL Fi, RX³ 1P, MIN 15363, Niloé váltó (egysarkúként is), Niloé 7 645 04, Schneider nyomó | váltó `P`→`L`, kereszt `1/2`→`L1/L2`, nyomó `3/4`→`L/1` |
| C, D | Easy9 3P C16, LC1D18, TM2-E08, RX³ 1P | `1a..2c`→`1..6`, `1..6`→`1L1..6T3`, `L1..T3`→`1L1..6T3` |
| E | LC1D18, TM2-E08, RX³ 1P | a fázis sorosan a TM2-E08 mindhárom pólusán (2T1→3L2, 4T2→5L3) |
| F | Easy9 3P C16, Easy9 4P Fi, **Schelinger SPD01-4P-B+C**, RX³ 1P | SPD a főkapcsoló után, a Fi előtt |
| G | Qoltec 50888, RX³ 1P, Legrand RX³ 2P Fi, **2× ELMARK SPD-C10** | mérő 1-3/4-6 → 1→2 / 3→4; SPD az FM után, a Fi előtt |
| H | TM2-E08, 3× LC1D18, Finder 82.01, RX³ 1P | főkapcsok `1L1..6T3`, Finder `B1` |
| I | Qoltec 50888, Legrand RX³ 2P Fi, RX³ 1P, Niloé váltó, **2× ELMARK SPD-C10** | mérő 3→4 a PEN; SPD a szétválasztás után, a Fi előtt |
| J | Qoltec 50888, **2× ELMARK SPD-C10**, IDEAL Fi, RX³ B16 és B10, Niloé váltó | új: „3”-as vizsgafeladat, két szekrény, EPH |

Minden feladatban: az SPD pontos helyét és a TN-C-S bekötést egyeztesd a vizsgáztatóval (a feladat
Áttekintésében feloldatlan értékként szerepel).

## Eltérések: fotó ↔ adatlap ↔ megbízás

- **Qoltec 50888**: a megbízás DIN-sínes mérőt feltételezett - az adatlap szerint 103 × 114 × 48 mm-es, falra/lapra
  csavarozható doboz. A régi alkalmazás 1-3 / 4-6 számozást használt; a nyomtatott rajz szerint 1 → 2 (L), 3 → 4 (N).
- **Finder**: a megbízás 80.01-et írt, a fotón „TYPE 82.01” olvasható (elmosódott). A 80.01 kapocselrendezése más
  (fent A1 A2 / B1, lent 15 18 / 16); a fotón fent A1 B1 15, lent 16 18 A2 - a modell a fotót követi.
- **Schelinger SPD**: előtét-biztosító a fotón 160 A gG, a gyártói kézikönyvben 125 A gL/gG.
- **ELMARK SPD-C10**: az adatlap színkódja szerint a zöld betét a 20 kA-es SPD-C20; a fotón zöld betéten SPD-C10,
  In 10 kA olvasható.
- **TM2-E08**: a START gomb a fotón fekete (egyes képeken zöld).
- **MIN 15363**: az időtartomány 1-7 perc (a megbízás 0,5-7 percet írt). A szimuláció rövidített, 7 s-os időt használ.
- **Easy9 3P**: a fotón EZ9F5?316 és „6000” - ez a 6 kA-es EZ9F56316 (a 4,5 kA-es EZ9F34316 helyett).
- **Legrand RX³ B10**: a rendelési szám 4 191 34 (nem 4 191 35).
- **Motorvédő beállítás**: a C feladatlap 0,8-1,2 A-es, a H feladat 11 A-es motorvédőt ír; a tábla TM2-E08-a 2,5-4 A-es.

## Nem olvasható vagy nem megerősített jelölések, méretek

- Qoltec 50888: a fotón P/N 511SPU06, a gyártói képeken más P/N - sorozatfüggő. Az 5-6 kapocs pontos helye
  (alul bal oldalt) a gyártói alsó nézetből, a fotón a fedél alatt nem látszik.
- Legrand Niloé váltó (07.jpg): a felső jobb kapocs jelölése elmosódott, „L”-nek olvasható (lehet fordított „1” is);
  a sötét Legrand szerkezeten (10.jpg) ugyanez egyértelműen L. A rendelési szám (7 645 01) a fotón nem olvasható.
  A felirat a szerkezet tetején („10 AX 250V~”, egy rendelési kód és „NS008”?) csak részben olvasható.
- Legrand Niloé 7 645 04: a kapocsjelöléseket az adatlap nem adja meg - a fotóról olvastuk (L1 L2 / 3 4).
  Gyártási kód: „A003039 A 25W15”? - részben olvasható.
- Schneider nyomó (08-09.jpg): a termékcsalád és a rendelési szám nem olvasható (az Asfora EPH0800121 csak
  valószínű); a hátoldal nyílásainak kapcsonkénti kiosztása (fent 4, lent 4 nyílás) nem dönthető el.
  A méretek nem megerősítettek. A „P162”, „EAC” jelölés olvasható.
- Legrand nyomó 6 A (10.jpg): a termékcsalád és a „2” kapocs szerepe nem azonosítható; „8 63X 10B”, „A02777…”,
  „19 25W…” kód olvasható.
- Legrand RX³ 2P Fi-relé: a kapocsjelölés sem a fotón, sem az adatlapon nem éles; a modell a szokásos 1 N / 2 N-t
  használja. A magyar rendelési szám (4 020 24) keresési találatból, az adatlap a spanyol, azonos házú típusoké.
- Schneider MIN 15363: a kapcsok helyét az adatlap nem adja meg; a modell a készülék tetejére nyomtatott rajzot
  követi (L-N egy oszlopban, 3-4 egy oszlopban).
- ELMARK TM2-E08: adatlapot nem találtunk; a 2,5-4 A tartomány a GV2-ME08 névadásból következtetett, a méretek
  becsültek. A 13-14 oldalblokk a fotókon nem látszik.
- Finder 82.01: a 82-es sorozat adatlapja nem volt elérhető; a méretek a 80.01-ből vett közelítések.
- ELMARK SPD-C10: a szélességet az adatlap nem adja meg (1 modul feltételezve).
- Prysmian vezeték: gyártói adatlapot nem kerestünk; az átmérő tipikus érték.
- A TeSys LC1D18 kapcsainak szintjét (hátsó sor / első lépcső) az adatlap nem mutatja, a fotó és a gyártói
  termékkép igen.

## A J feladat forrásai

A „3”-as szerelési vizsgafeladat lapja (`photos/15-feladatlap-3.jpg`, nem publikus) alapján. A vizsgaközpont
nevét és logóját az alkalmazás nem tartalmazza. Az EPH-kérdések válaszai nyilvános, másodlagos forrásokra
épülnek (a hivatalos szöveget az MSZ HD 60364-4-41:2007 és az MSZ HD 60364-5-54 kiadvány adja):

- MSZ HD 60364-4-41:2007, 411.3.1.2 összefoglaló (szakcikk, 2008): <https://hobbielektronika.hu/forum/getfile.php?id=75085>
- MSZ HD 60364-5-54 - Földelőberendezések, védővezetők, EPH (tanfolyami anyag): <https://hobbielektronika.hu/forum/getfile.php?id=410112>

## 3D képernyőképek

A `screenshots/` mappában (a fejlesztői szerverről, headless Chrome-mal, 1440 × 900):

- `G-osszes.png` (sötét), `G-lepes5-spd.png` (világos, 5. lépés közelről) - G: Qoltec mérő, 2× ELMARK SPD-C10, Legrand RX³ Fi
- `F-osszes.png`, `F-lepes4-spd.png` (sötét) - F: Schelinger SPD01-4P-B+C, Easy9 4P Fi (N a bal szélen)
- `J-osszes.png` (világos), `J-lepes2-pen.png` (sötét) - J: mérőszekrény és lakás főelosztó, PEN-szétválasztás, EPH
- `H-kozeli.png` (sötét) - H: TeSys LC1D18 homlokra pattintott segédérintkező-blokkal, TM2-E08
- `G-telefon.png` - 390 px széles telefon, világos téma, lépésenként
