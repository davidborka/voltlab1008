/**
 * A vizsgatábla valós készülékei - a fotókról (docs/real-devices/photos, nem
 * kerül a repóba) leolvasott jelölésekkel és a gyártói adatlapok méreteivel.
 *
 * Szabály: ahol az adatlap és a fotó eltér, a fotó nyer, és az eltérés a
 * notesHu-ba kerül. Ahol egy jelölés nem olvasható, nem találunk ki helyette
 * semmit - ezt is a notesHu írja le.
 *
 * A feladatok alkatrészei a `dev` mezővel hivatkoznak ide. Az a típus, amelyik
 * nem szerepel a fotókon, a GENERIC_PARTS listában van, indoklással.
 */

export interface RealTerminal {
  /** a készülékre nyomtatott jelölés */
  label: string;
  /** hol van fizikailag (elölnézetből) */
  posHu: string;
  meaningHu: string;
}

export interface RealDevice {
  id: string;
  brand: string;
  model: string;
  orderCode: string | null;
  /** fotófájl(ok) a docs/real-devices/photos mappában */
  photos: string[];
  kindHu: string;
  /** DIN modulszélesség (17,5-18 mm); null, ha nem sínre szerelhető */
  modules: number | null;
  /** szélesség × magasság × mélység, mm (adatlap) */
  dimsMm: { w: number; h: number; d: number };
  terminalTypeHu: string;
  terminals: RealTerminal[];
  ratingsHu: string[];
  sourceUrls: string[];
  /** mely alkalmazásbeli alkatrésztípus(ok) ezt a készüléket modellezik */
  partTypes: string[];
  /** rövid felirat a 2D táblára */
  short: string;
  /** eltérések, nem olvasható jelölések, bizonytalanságok */
  notesHu: string[];
}

const D = (d: RealDevice) => d;

export const REAL_DEVICES: Record<string, RealDevice> = {
  'qoltec-50888': D({
    id: 'qoltec-50888',
    brand: 'Qoltec',
    model: '50888 egyfázisú fogyasztásmérő',
    orderCode: '50888',
    photos: ['01.jpg'],
    kindHu: 'Közvetlen mérésű 1 fázisú fogyasztásmérő, falra/lapra szerelhető doboz',
    modules: null,
    dimsMm: { w: 103, h: 114, d: 48 },
    terminalTypeHu: 'Csavaros kapcsok alul, plombálható átlátszó fedél alatt; az 5-6 kisebb impulzuskapocs',
    terminals: [
      { label: '1', posHu: 'alul, 1. nagy kapocs', meaningHu: 'L be (hálózat)' },
      { label: '2', posHu: 'alul, 2. nagy kapocs', meaningHu: 'L ki (fogyasztó)' },
      { label: '3', posHu: 'alul, 3. nagy kapocs', meaningHu: 'N be (TN-C-nél PEN be)' },
      { label: '4', posHu: 'alul, 4. nagy kapocs', meaningHu: 'N ki (TN-C-nél PEN ki)' },
      { label: '5 (+)', posHu: 'alul bal oldalt, kis kapocs', meaningHu: 'impulzuskimenet (S0) +, nincs bekötve' },
      { label: '6 (−)', posHu: 'alul bal oldalt, kis kapocs', meaningHu: 'impulzuskimenet (S0) −, nincs bekötve' },
    ],
    ratingsHu: ['230 V', '5(60) A', '50 Hz', '1600 imp/kWh', 'LCD 6+1 számjegy, piros Pulse LED'],
    sourceUrls: ['https://www.qoltec.pl/files/help_files/file-50888-instrukcja-pl-en.pdf'],
    partTypes: ['meter1'],
    short: 'Qoltec 50888',
    notesHu: [
      'A megbízás DIN-sínes mérőt feltételezett; az adatlap szerint falra/lapra csavarozható doboz (kulcslyuk + 2 csavar). A 3D nézet a szerelőlapra csavarozva mutatja.',
      'A régi alkalmazás 1-3 / 4-6 számozást használt; a készülékre nyomtatott rajz szerint 1 → 2 a fázis, 3 → 4 a nulla.',
      'A fotón P/N 511SPU06 olvasható, a gyártói képeken más P/N - sorozatfüggő.',
    ],
  }),
  'schelinger-spd01-4p': D({
    id: 'schelinger-spd01-4p',
    brand: 'Schelinger',
    model: 'SPD01-4P-B+C túlfeszültség-védő',
    orderCode: 'A51-SPD01-4P-B+C',
    photos: ['05.jpg', '02.jpg'],
    kindHu: '4 pólusú T1+T2 (B+C) túlfeszültség-védő, kihúzható narancs betétekkel',
    modules: 4,
    dimsMm: { w: 72, h: 90, d: 68 },
    terminalTypeHu: 'Csavaros dobozkapcsok, max. 35 mm², 10 mm csupaszolás, 3,5 Nm',
    terminals: [
      { label: 'L1', posHu: 'fent, 1. modul', meaningHu: 'fázis L1' },
      { label: 'L2', posHu: 'fent, 2. modul', meaningHu: 'fázis L2' },
      { label: 'L3', posHu: 'fent, 3. modul', meaningHu: 'fázis L3' },
      { label: 'N', posHu: 'fent, 4. modul', meaningHu: 'nulla' },
      { label: '⏚', posHu: 'alul, a 3. modul alatt', meaningHu: 'PE (az alkalmazásban PE)' },
    ],
    ratingsHu: [
      'T1+T2', 'Uc 275 V AC', 'Iimp 5 kA (10/350 µs)', 'In 20 kA (8/20 µs)', 'Imax 50 kA (8/20 µs)',
      'Up ≤ 1,5 kV', 'IP20', 'előtét-biztosító 160 A gG', 'EN 61643-11', 'ablak: zöld = rendben, piros = csere',
    ],
    sourceUrls: [
      'https://bemko.pl/en/product/surge-protector-4p-5ka-10-350-class-t1-t2-b-c-schelinger-3257',
      'https://bemko.pl/files/19d/manual-spd-4p.pdf',
    ],
    partTypes: ['spd4'],
    short: 'SPD01-4P T1+T2',
    notesHu: [
      'Előtét-biztosító: a fotón 160 A gG, a gyártói kézikönyvben 125 A gL/gG - a fotó nyer, de bekötés előtt egyeztesd.',
      'Az adatlap méretei „szélesség 72, hossz 90, magasság 68”; a modell ezt 72 széles, 90 magas (a sínen), 68 mély értékként értelmezi.',
    ],
  }),
  'elmark-spd-c10': D({
    id: 'elmark-spd-c10',
    brand: 'ELMARK',
    model: 'SPD-C10 túlfeszültség-védő',
    orderCode: 'SPD-C10/1P (64102)',
    photos: ['04.jpg'],
    kindHu: '1 pólusú T2 (C) túlfeszültség-védő, zöld kihúzható betéttel',
    modules: 1,
    dimsMm: { w: 18, h: 90, d: 58 },
    terminalTypeHu: 'Lapos (alagút) csavaros kapocs, 14 mm csupaszolás, PZ2',
    terminals: [
      { label: 'L/N', posHu: 'fent', meaningHu: 'fázisra vagy nullára (egyfázisú táblán: SP1 L-PE, SP2 N-PE)' },
      { label: '⏚', posHu: 'alul', meaningHu: 'PE (az alkalmazásban PE)' },
    ],
    ratingsHu: ['T2', 'Uc ~275 V', 'In 10 kA', 'Imax 20 kA', 'Up ≤ 1,2 kV', 'EN 61643-11'],
    sourceUrls: [
      'https://en.elmarkstore.eu/surge-arrester-spd-c10-1p-in-10ka-product4521',
      'https://en.elmarkstore.eu/data/uploads/product3D/64102/64102%20-%20Technical%20specification%20EN.pdf',
    ],
    partTypes: ['spd1'],
    short: 'SPD-C10 T2',
    notesHu: [
      'Az adatlap színkódja szerint a fehér betét 10 kA, a zöld 20 kA (SPD-C20); a fotón a zöld betéten SPD-C10 / In 10 kA / Imax 20 kA olvasható - a fotó nyer.',
      'Az adatlap a szélességet nem adja meg (1 modul, 18 mm feltételezve); mélység: váll 43,5 mm, teljes 58 mm, homloklap 45 mm.',
    ],
  }),
  'schneider-lc1d18': D({
    id: 'schneider-lc1d18',
    brand: 'Schneider Electric',
    model: 'TeSys D LC1D18 mágneskapcsoló',
    orderCode: 'LC1D18',
    photos: ['03.jpg', '06.jpg'],
    kindHu: '3 pólusú mágneskapcsoló, 1 NO + 1 NC beépített segédérintkezővel',
    modules: null,
    dimsMm: { w: 45, h: 77, d: 86 },
    terminalTypeHu: 'Csavaros kapcsok két lépcsőben; fő 1,5-6 mm², vezérlő 1-4 mm², 1,7 Nm',
    terminals: [
      { label: '1L1 3L2 5L3', posHu: 'fent, hátsó (külső) sor', meaningHu: 'főérintkezők bemenete' },
      { label: '13 NO · 21 NC · A1', posHu: 'fent, első (belső) lépcső', meaningHu: 'záró és bontó segédérintkező, tekercs' },
      { label: '14 NO · 22 NC · A2', posHu: 'alul, első (belső) lépcső', meaningHu: 'segédérintkezők másik vége, tekercs' },
      { label: '2T1 4T2 6T3', posHu: 'alul, hátsó (külső) sor', meaningHu: 'főérintkezők kimenete' },
    ],
    ratingsHu: ['AC-3 18 A (400 V)', 'AC-1 32 A', '1 NO + 1 NC', 'zöld „TeSys” sáv, fekete ház', '0,33 kg'],
    sourceUrls: [
      'https://www.se.com/uk/en/product/download-pdf/LC1D18M7',
      'https://docs.rs-online.com/15db/0900766b81680385.pdf',
    ],
    partTypes: ['contactor'],
    short: 'LC1D18 · AC-3 18 A',
    notesHu: [
      'Az adatlap csak a logikai rajzot adja; a kapcsok szintjét (hátsó sor / első lépcső) a fotó és a gyártói termékkép mutatja.',
      'A 13-14 és 21-22 beépített. A D és H feladat további segédérintkezői (51-52, 81-82, 53-54, 61-62, 83-84) homlokra pattintható segédérintkező-blokkot (pl. LADN11/22) igényelnek - ez nem szerepel a fotókon.',
    ],
  }),
  'elmark-tm2-e08': D({
    id: 'elmark-tm2-e08',
    brand: 'ELMARK',
    model: 'TM2-E08 motorvédő kapcsoló',
    orderCode: 'TM2-E08',
    photos: ['02.jpg', '04.jpg'],
    kindHu: '3 pólusú motorvédő kapcsoló (hő- és zárlati kioldó), START/STOP nyomógombbal',
    modules: null,
    dimsMm: { w: 44.5, h: 89, d: 66 },
    terminalTypeHu: 'Csavaros kapcsok',
    terminals: [
      { label: '1L1 3L2 5L3', posHu: 'fent', meaningHu: 'betáplálás' },
      { label: '2T1 4T2 6T3', posHu: 'alul', meaningHu: 'motor felé' },
      { label: '13 14', posHu: 'oldalra szerelt segédérintkező-blokk', meaningHu: 'záró segédérintkező (C, D, E feladat)' },
    ],
    ratingsHu: ['beállítási tartomány 2,5-4 A', 'IEC 60947-2, IEC 60947-4-1', 'piros STOP, fekete START gomb, áramállító tárcsa'],
    sourceUrls: [
      'https://en.elmarkstore.eu/motor-and-thermal-protection-category117',
    ],
    partTypes: ['mprot'],
    short: 'TM2-E08 · 2,5-4 A',
    notesHu: [
      'A START gomb a fotón fekete (egyes adatlapképeken zöld) - a fotó nyer.',
      'A 13-14 segédérintkező oldalra szerelhető blokk; a fotókon nem látszik.',
      'A C feladatlap 0,8-1,2 A-es, a H feladat 11 A-es motorvédőt ír; a tábla TM2-E08-a 2,5-4 A-es. A beállítási értéket a vizsgáztatóval egyeztesd.',
      'Az ELMARK adatlapját nem találtuk; a 2,5-4 A tartomány a GV2-ME08 névadásból következtetett, a méretek (44,5 × 89 × 66 mm) egy hasonló TM2-E05 listázásából és a fotóból becsültek - NEM megerősített.',
    ],
  }),
  'finder-82-01': D({
    id: 'finder-82-01',
    brand: 'Finder',
    model: '82.01 multifunkciós időrelé',
    orderCode: '82.01',
    photos: ['02.jpg'],
    kindHu: 'Moduláris multifunkciós időrelé, 1 váltóérintkező',
    modules: 1,
    dimsMm: { w: 17.5, h: 88.8, d: 61 },
    terminalTypeHu: 'Csavaros dobozkapcsok, fent és lent 3-3',
    terminals: [
      { label: 'A1', posHu: 'fent bal', meaningHu: 'táp' },
      { label: 'B1', posHu: 'fent közép', meaningHu: 'vezérlőbemenet (a H feladatban nincs bekötve)' },
      { label: '15', posHu: 'fent jobb', meaningHu: 'váltóérintkező közös pontja' },
      { label: '16', posHu: 'lent bal', meaningHu: 'nyugalmi (NC) - késleltetve bont' },
      { label: '18', posHu: 'lent közép', meaningHu: 'munka (NO) - késleltetve zár' },
      { label: 'A2', posHu: 'lent jobb', meaningHu: 'táp' },
    ],
    ratingsHu: ['nagy kék időállító tárcsa, két kis kék választó (időtartomány, funkció)', 'Power on LED'],
    sourceUrls: [
      'https://cdn.findernet.com/app/uploads/S80EN.pdf',
    ],
    partTypes: ['timer'],
    short: 'Finder 82.01',
    notesHu: [
      'A megbízás Finder 80.01-et írt, a fotón a típusjel „TYPE 82.01”-nek olvasható (elmosódott) - a fotó nyer. A 80.01 kapocselrendezése más (A1 A2 / B1 fent, 15 18 / 16 lent); a fotón fent A1 B1 15, lent 16 18 A2 látszik.',
      'A 82-es sorozat adatlapja nem volt elérhető; a méretek a 80.01 adatlapjából (17,5 × 88,8 × 56,5 + 4,3 mm) vett közelítések.',
    ],
  }),
  'schneider-min-15363': D({
    id: 'schneider-min-15363',
    brand: 'Schneider Electric',
    model: 'MIN lépcsőházi automata',
    orderCode: '15363',
    photos: ['06.jpg', '02.jpg'],
    kindHu: 'Lépcsőházi időkapcsoló (automata), auto/állandó kapcsolóval',
    modules: 1,
    dimsMm: { w: 18, h: 83, d: 68 },
    terminalTypeHu: 'Csavaros kapcsok, mind a négy alul, két szinten',
    terminals: [
      { label: 'L', posHu: 'alul, felső lépcső bal', meaningHu: 'fázis (táp)' },
      { label: '3', posHu: 'alul, felső lépcső jobb', meaningHu: 'nyomógomb-bemenet' },
      { label: 'N', posHu: 'alul, alsó sor bal', meaningHu: 'nulla (táp)' },
      { label: '4', posHu: 'alul, alsó sor jobb', meaningHu: 'kapcsolt kimenet a lámpák felé' },
    ],
    ratingsHu: ['230 V~', '16 A 230 V~ kimenet', 'időtartomány 1-7 perc', 'auto / állandó fény kapcsoló'],
    sourceUrls: [
      'https://www.se.com/uk/en/product/download-pdf/15363',
    ],
    partTypes: ['stair'],
    short: 'MIN 15363',
    notesHu: [
      'Az időtartomány az adatlap szerint 1-7 perc (a megbízás 0,5-7 percet írt). A szimuláció rövidített, 7 s-os időt használ.',
      'A kapcsok helyét az adatlap nem adja meg. A készülék tetejére nyomtatott rajz (fotó) L-N egy oszlopban, 3-4 egy oszlopban mutatja - a modell ezt követi: felső lépcső L, 3; alsó sor N, 4.',
    ],
  }),
  'legrand-rx3-1p': D({
    id: 'legrand-rx3-1p',
    brand: 'Legrand',
    model: 'RX³ 1P kismegszakító (B6 / B10 / B16)',
    orderCode: '4 191 33 (B6), 4 191 34 (B10), 4 191 36 (B16)',
    photos: ['02.jpg', '12.jpg', '13.jpg'],
    kindHu: '1 pólusú kismegszakító, 6000 A',
    modules: 1,
    dimsMm: { w: 17.7, h: 83, d: 71.6 },
    terminalTypeHu: 'Csavaros dobozkapocs',
    terminals: [
      { label: '1', posHu: 'fent', meaningHu: 'betáplálás' },
      { label: '2', posHu: 'alul', meaningHu: 'fogyasztói oldal' },
    ],
    ratingsHu: ['B karakterisztika', '6000 A zárlati képesség', '230/400 V~', 'fekete kar, fehér ház'],
    sourceUrls: [
      'https://assets.legrand.com/pim/NP-FT-GT/F01909EN-02.pdf',
    ],
    partTypes: ['mcb'],
    short: 'RX³ 1P',
    notesHu: [
      'A táblán B6, B10 és B16 van. Az A-I feladatlap nem adja meg, melyik áramkörbe melyik kell - ezt a feladat Áttekintése feloldatlan értékként jelöli, a modell nem talál ki értéket.',
      'A B10 rendelési számát (4 191 34) a dobozokon nem láttuk, a Legrand adatlapjából származik.',
      'Mélység: a vállrész 43,9 mm a sín síkjától, a homloklap ≈ 60 mm, a kar csúcsa 71,6 mm (a pattintóval 77,8 mm).',
    ],
  }),
  'legrand-rx3-b16': D({
    id: 'legrand-rx3-b16',
    brand: 'Legrand',
    model: 'RX³ 1P B16 kismegszakító',
    orderCode: '4 191 36',
    photos: ['13.jpg'],
    kindHu: '1 pólusú kismegszakító, B16, 6000 A',
    modules: 1,
    dimsMm: { w: 17.7, h: 83, d: 71.6 },
    terminalTypeHu: 'Csavaros dobozkapocs',
    terminals: [
      { label: '1', posHu: 'fent', meaningHu: 'betáplálás' },
      { label: '2', posHu: 'alul', meaningHu: 'fogyasztói oldal' },
    ],
    ratingsHu: ['B16', '6000 A', '230/400 V~'],
    sourceUrls: [
      'https://assets.legrand.com/pim/NP-FT-GT/F01909EN-02.pdf',
    ],
    partTypes: ['mcb'],
    short: 'RX³ B16',
    notesHu: ['A J feladatban a dugaljkör védelme.'],
  }),
  'legrand-rx3-b10': D({
    id: 'legrand-rx3-b10',
    brand: 'Legrand',
    model: 'RX³ 1P B10 kismegszakító',
    orderCode: '4 191 34',
    photos: ['02.jpg'],
    kindHu: '1 pólusú kismegszakító, B10, 6000 A',
    modules: 1,
    dimsMm: { w: 17.7, h: 83, d: 71.6 },
    terminalTypeHu: 'Csavaros dobozkapocs',
    terminals: [
      { label: '1', posHu: 'fent', meaningHu: 'betáplálás' },
      { label: '2', posHu: 'alul', meaningHu: 'fogyasztói oldal' },
    ],
    ratingsHu: ['B10', '6000 A', '230/400 V~'],
    sourceUrls: [
      'https://assets.legrand.com/pim/NP-FT-GT/F01909EN-02.pdf',
    ],
    partTypes: ['mcb'],
    short: 'RX³ B10',
    notesHu: ['A J feladatban a világítási kör védelme. A rendelési szám a Legrand adatlapjából, a fotón nem olvasható.'],
  }),
  'schneider-easy9-3p-c16': D({
    id: 'schneider-easy9-3p-c16',
    brand: 'Schneider Electric',
    model: 'Easy9 3P C16 kismegszakító',
    orderCode: 'EZ9F56316',
    photos: ['02.jpg'],
    kindHu: '3 pólusú kismegszakító, C16, 6000 A',
    modules: 3,
    dimsMm: { w: 54, h: 81, d: 66.5 },
    terminalTypeHu: 'Csavaros dobozkapocs',
    terminals: [
      { label: '1 3 5', posHu: 'fent', meaningHu: 'betáplálás L1 L2 L3' },
      { label: '2 4 6', posHu: 'alul', meaningHu: 'kimenet' },
    ],
    ratingsHu: ['C16', '3P', 'zöld sáv, sötétszürke közös kar'],
    sourceUrls: [
      'https://www.se.com/tr/tr/product/download-pdf/EZ9F56316',
    ],
    partTypes: ['mcb3'],
    short: 'Easy9 3P C16',
    notesHu: [
      'A fotón a rendelési szám csak részben olvasható (EZ9F5?316), mellette „6000” - ez a 6 kA-es EZ9F56316 (a 4,5 kA-es változat EZ9F34316).',
      'A feladatlapok nem adnak névleges értéket; a vizsgatáblán ez az egyetlen 3P kismegszakító (C16).',
    ],
  }),
  'ideal-krd10': D({
    id: 'ideal-krd10',
    brand: 'IDEAL',
    model: 'KRD10-2/25/30-AC Fi-relé',
    orderCode: 'KRD10-2/25/30-AC',
    photos: ['02.jpg', '04.jpg'],
    kindHu: '2 pólusú áram-védőkapcsoló, AC típus',
    modules: 2,
    dimsMm: { w: 36, h: 81, d: 75 },
    terminalTypeHu: 'Csavaros dobozkapocs',
    terminals: [
      { label: '1', posHu: 'fent bal', meaningHu: 'fázis be' },
      { label: 'N', posHu: 'fent jobb', meaningHu: 'nulla be' },
      { label: '2', posHu: 'lent bal', meaningHu: 'fázis ki' },
      { label: 'N', posHu: 'lent jobb', meaningHu: 'nulla ki' },
    ],
    ratingsHu: ['In = 25 A', 'IΔn = 30 mA', 'AC típus', '10 kA', 'narancs T tesztgomb fent bal'],
    sourceUrls: [
      'https://www.kanlux.com/storage/products/techniczna/en/38724.pdf',
    ],
    partTypes: ['rcd'],
    short: 'KRD10 25 A 30 mA',
    notesHu: ['Az IDEAL a Kanlux márkája (katalógusszám 38724). A kapcsok jelölése (1, N / 2, N) a fotóról, az adatlap nem adja meg.'],
  }),
  'legrand-rx3-rcd-2p': D({
    id: 'legrand-rx3-rcd-2p',
    brand: 'Legrand',
    model: 'RX³ 2P 25 A 30 mA AC Fi-relé',
    orderCode: '4 020 24',
    photos: ['02.jpg'],
    kindHu: '2 pólusú áram-védőkapcsoló, AC típus',
    modules: 2,
    dimsMm: { w: 35.6, h: 83, d: 71.65 },
    terminalTypeHu: 'Csavaros dobozkapocs',
    terminals: [
      { label: '1 · N', posHu: 'fent', meaningHu: 'betáplálás' },
      { label: '2 · N', posHu: 'lent', meaningHu: 'fogyasztói oldal' },
    ],
    ratingsHu: ['In = 25 A', 'IΔn = 30 mA', 'AC típus', 'T tesztgomb jobbra lent'],
    sourceUrls: [
      'https://assets.legrand.com/pim/NP-FT-GT/F01534EN-04.pdf',
    ],
    partTypes: ['rcd'],
    short: 'RX³ 25 A 30 mA',
    notesHu: [
      'A kapcsok jelölését sem a fotó, sem az adatlap nem mutatja élesen; a modell a 2P Fi-relék szokásos 1/N - 2/N jelölését használja.',
      'A magyar 2P 25 A 30 mA AC kód (4 020 24) keresési találatból; az adatlap a spanyol 4 020 56-60 típusoké, azonos házzal feltételezve. Magasság 83 mm (pattintóval 88,9).',
    ],
  }),
  'schneider-easy9-rcd-4p': D({
    id: 'schneider-easy9-rcd-4p',
    brand: 'Schneider Electric',
    model: 'Easy9 4P 25 A 30 mA AC Fi-relé',
    orderCode: 'EZ9R34425',
    photos: ['02.jpg'],
    kindHu: '4 pólusú áram-védőkapcsoló, AC típus',
    modules: 4,
    dimsMm: { w: 72, h: 82, d: 72 },
    terminalTypeHu: 'Csavaros dobozkapocs',
    terminals: [
      { label: 'N 1 3 5', posHu: 'fent, a nulla a BAL szélen', meaningHu: 'betáplálás' },
      { label: 'N 2 4 6', posHu: 'lent, a nulla a BAL szélen', meaningHu: 'fogyasztói oldal' },
    ],
    ratingsHu: ['In = 25 A', 'IΔn = 30 mA', 'AC típus'],
    sourceUrls: [
      'https://www.se.com/tr/tr/product/download-pdf/EZ9R34425',
    ],
    partTypes: ['rcd'],
    short: 'Easy9 4P 25 A 30 mA',
    notesHu: ['A régi alkalmazás a nullát jobbra rajzolta; az Easy9 4P-n a nulla bal oldalt van.'],
  }),
  'legrand-niloe-764504': D({
    id: 'legrand-niloe-764504',
    brand: 'Legrand',
    model: 'Niloé keresztkapcsoló (permutateur)',
    orderCode: '7 645 04',
    photos: ['11.jpg', '14.jpg'],
    kindHu: 'Süllyesztett keresztkapcsoló, fehér',
    modules: null,
    dimsMm: { w: 76, h: 76, d: 45.5 },
    terminalTypeHu: 'Csavar nélküli (push-in) kapcsok, kapcsonként 2 nyílás, 13 mm csupaszolás',
    terminals: [
      { label: 'L1', posHu: 'hátoldal, piros blokk bal', meaningHu: 'bemenő pár 1' },
      { label: 'L2', posHu: 'hátoldal, piros blokk jobb', meaningHu: 'bemenő pár 2' },
      { label: '3', posHu: 'hátoldal, szürke blokk bal', meaningHu: 'kimenő pár 1' },
      { label: '4', posHu: 'hátoldal, szürke blokk jobb', meaningHu: 'kimenő pár 2' },
    ],
    ratingsHu: ['10 AX 250 V~'],
    sourceUrls: [
      'https://assets.legrand.com/pim/NP-FT-GT/F02186FR-02.pdf',
    ],
    partTypes: ['swx'],
    short: 'Niloé 7 645 04',
    notesHu: [
      'A kapcsok jelölését (L1 L2 / 3 4) az adatlap nem adja meg - a fotóról olvastuk.',
      'Méret: 76 × 76 mm tartólap, teljes mélység 45,5 mm, ebből 14,5 mm a fal előtt.',
      'A szerkezeten a „Made in Hungary” mellett egy gyártási kód (A003039 A 25W15?) részben olvasható.',
    ],
  }),
  'legrand-niloe-valto': D({
    id: 'legrand-niloe-valto',
    brand: 'Legrand',
    model: 'Niloé váltókapcsoló (va-et-vient)',
    orderCode: '7 645 01',
    photos: ['07.jpg'],
    kindHu: 'Süllyesztett váltókapcsoló; egysarkú kapcsolóként az L-1 kapcsot használjuk',
    modules: null,
    dimsMm: { w: 76, h: 76, d: 45.5 },
    terminalTypeHu: 'Csavar nélküli (push-in) kapcsok, kapcsonként 2 nyílás',
    terminals: [
      { label: '1', posHu: 'hátoldal, felső blokk bal', meaningHu: 'váltóvezeték 1 (egysarkúként a kimenet)' },
      { label: 'L', posHu: 'hátoldal, felső blokk jobb', meaningHu: 'közös kapocs (fázis be)' },
      { label: '2', posHu: 'hátoldal, alsó blokk', meaningHu: 'váltóvezeték 2 (egysarkúként szabad)' },
    ],
    ratingsHu: ['10 AX 250 V~'],
    sourceUrls: [
      'https://www.legrand.com/ecatalogue/en/catalog/products/niloe-two-way-switch-1-gang-10-ax-250-v-automatic-terminals-white-764501',
      'https://assets.legrand.com/pim/NP-FT-GT/F02186FR-02.pdf',
    ],
    partTypes: ['sw2', 'sw1'],
    short: 'Niloé váltó',
    notesHu: [
      'A felső jobb kapocs jelölése a fotón elmosódott: „L”-nek olvasható (lehet fordított „1” is); a sötét Legrand szerkezeten (10.jpg) ugyanez egyértelműen L.',
      'A rendelési szám (7 645 01) a fotón nem olvasható; a doboz a 14.jpg-n csak a 7 645 04-et mutatja. A kapocsjelölést az adatlap nem adja meg.',
    ],
  }),
  'schneider-nyomo': D({
    id: 'schneider-nyomo',
    brand: 'Schneider Electric',
    model: 'Nyomó csengő jellel (valószínűleg Asfora)',
    orderCode: 'EPH0800121 (valószínű)',
    photos: ['08.jpg', '09.jpg'],
    kindHu: 'Süllyesztett nyomó, záró érintkező - a lépcsőházi automata indítója',
    modules: null,
    dimsMm: { w: 83, h: 83, d: 43 },
    terminalTypeHu: 'Csavar nélküli (push-in) kapcsok fémlapon',
    terminals: [
      { label: '1', posHu: 'hátoldal, fent', meaningHu: 'kimenet (az automata 3-as kapcsára)' },
      { label: 'L', posHu: 'hátoldal, lent', meaningHu: 'fázis be' },
    ],
    ratingsHu: ['10 A 250 V~', 'EAC jelölés'],
    sourceUrls: [],
    partTypes: ['push'],
    short: 'Schneider nyomó',
    notesHu: [
      'A hátlapon a kapcsonkénti nyílások pontos kiosztása (felül 4, alul 4 nyílás) a fotóból nem dönthető el; a modell kapcsonként 2 nyílást mutat.',
      'A termékcsaládot és a rendelési számot nem sikerült forrással megerősíteni (Asfora EPH0800121 csak valószínű); a méretek (83 × 83 × 43 mm) ezért NEM megerősítettek.',
    ],
  }),
  'legrand-nyomo-6a': D({
    id: 'legrand-nyomo-6a',
    brand: 'Legrand',
    model: 'Nyomó 6 A (sötét szerkezet)',
    orderCode: null,
    photos: ['10.jpg'],
    kindHu: 'Süllyesztett nyomó - a feladatokban nem használjuk',
    modules: null,
    dimsMm: { w: 76, h: 76, d: 45.5 },
    terminalTypeHu: 'Csavar nélküli (push-in), 13 mm csupaszolás',
    terminals: [
      { label: 'L', posHu: 'hátoldal, felső blokk jobb', meaningHu: 'fázis be' },
      { label: '2', posHu: 'hátoldal, felső blokk bal', meaningHu: 'nem azonosított (váltó nyomó?)' },
      { label: '1', posHu: 'hátoldal, alsó blokk', meaningHu: 'kimenet' },
    ],
    ratingsHu: ['6 A 250 V~', 'Made in Hungary'],
    sourceUrls: [],
    partTypes: [],
    short: 'Legrand nyomó 6 A',
    notesHu: ['A termékcsalád és a „2” kapocs szerepe nem azonosítható; a fotón „8 63X 10B” és „A02777…” kód olvasható.'],
  }),
  'prysmian-h07v': D({
    id: 'prysmian-h07v',
    brand: 'Prysmian',
    model: 'H07V-U / H07V-K vezeték',
    orderCode: null,
    photos: ['12.jpg'],
    kindHu: 'Egyerű PVC szigetelésű vezeték',
    modules: null,
    dimsMm: { w: 2.8, h: 2.8, d: 0 },
    terminalTypeHu: '-',
    terminals: [],
    ratingsHu: ['barna fázis, kék nulla, zöld-sárga PE, fekete és szürke ér', 'külső átmérő ≈ 2,8 mm (1,5 mm²), ≈ 3,4 mm (2,5 mm²) - forrással nem megerősítve'],
    sourceUrls: [],
    partTypes: [],
    short: 'Prysmian H07V',
    notesHu: [
      'Gyártói adatlapot nem kerestünk ki (nem megerősített); a fotón csak a Prysmian doboz és a zöld-sárga vezeték látszik.',
      'A 3D nézet csöveinek átmérője ehhez igazodik (2,8 mm).',
    ],
  }),
};

/** Nem a fotókon szereplő eszközök - általános modell, indoklással. */
export const GENERIC_PARTS: Record<string, string> = {
  feed: 'nem a fotókon szereplő eszköz: betáplálás (sorkapocs a tábla szélén)',
  feed3: 'nem a fotókon szereplő eszköz: háromfázisú betáplálás (sorkapocs)',
  feedpen: 'nem a fotókon szereplő eszköz: TN-C betáplálás (méretlen fővezeték)',
  lamp: 'nem a fotókon szereplő eszköz: lámpatest',
  pilot: 'nem a fotókon szereplő eszköz: jelzőlámpa',
  socket: 'nem a fotókon szereplő eszköz: dugalj',
  busbar: 'nem a fotókon szereplő eszköz: N- vagy PE-sín (sorkapocs sín)',
  motor: 'nem a fotókon szereplő eszköz: háromfázisú motor',
  motor1: 'nem a fotókon szereplő eszköz: egyfázisú motor',
  motor6: 'nem a fotókon szereplő eszköz: motor 6 kivezetéssel',
  vfd: 'nem a fotókon szereplő eszköz: frekvenciaváltó',
  meter3: 'nem a fotókon szereplő eszköz: háromfázisú fogyasztásmérő',
  mainsw: 'nem a fotókon szereplő eszköz: 3P+N főkapcsoló',
  penbar: 'nem a fotókon szereplő eszköz: PEN-szétválasztó PE- és N-sín',
  earthrod: 'nem a fotókon szereplő eszköz: földelő',
  bond: 'nem a fotókon szereplő eszköz: EPH bekötési pont (víz, gáz, fűtés)',
  btn: 'nem a fotókon szereplő eszköz: vezérlő nyomógomb (záró, 3-4)',
  btnNC: 'nem a fotókon szereplő eszköz: vezérlő nyomógomb (bontó, 1-2)',
  olr: 'nem a fotókon szereplő eszköz: hőkioldó relé',
};

export function deviceOf(p: { dev?: string }): RealDevice | null {
  return (p.dev && REAL_DEVICES[p.dev]) || null;
}

/** Rövid típusfelirat a 2D táblára, ha a részhez valós készülék tartozik. */
export function shortOf(p: { dev?: string }): string | null {
  return deviceOf(p)?.short || null;
}

/** „Q1 · Schneider Electric LC1D18” - címke és valós típus együtt. */
export function modelLabel(p: { id: string; label?: string; dev?: string }): string {
  const d = deviceOf(p);
  const name = p.label || p.id;
  return d ? `${name} · ${d.brand} ${d.model}` : name;
}
