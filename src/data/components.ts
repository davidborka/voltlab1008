import type { ScoreCategory } from '../domain/electrical-types';

/**
 * Készülékkönyvtár: mit csinál a készülék, hogyan van számozva a kapcsa, és mi
 * az a hiba, amit a vizsgán a legtöbben elkövetnek vele. A rajzjelek egyszerű,
 * IEC-szerű vonalas ábrák, ugyanabban a 0 0 80 80 keretben.
 *
 * Fontos: a tábla mindig feszültségmentes, amikor kötsz rajta. Bekötni, majd
 * ellenőrizni, és csak a vizsgáztató engedélyével, kész bekötésen szabad
 * feszültséget adni.
 */

/** A könyvtár tételeinek kérdései a készülékismeret pontokba számítanak. */
export const LIBRARY_SCORE_CATEGORY: ScoreCategory = 'keszulekismeret';

export interface LibraryEntry {
  /** kebab-case azonosító */
  id: string;
  nameHu: string;
  /** tervjel a kapcsolási rajzon */
  designation: string;
  purposeHu: string;
  /** a kapocsszámozás magyarázata */
  terminalsHu: string;
  /** záró/bontó viselkedés, ahol van értelme */
  behaviourHu?: string;
  /** mely feladatokban fordul elő: A-G */
  appearsIn: string[];
  /** egy tipikus vizsgahiba */
  mistakeHu: string;
  /** IEC-szerű rajzjel a 0 0 80 80 viewBoxban, <svg> tag nélkül */
  symbol: string;
}

export const LIBRARY: LibraryEntry[] = [
  {
    id: 'fi-rele',
    nameHu: 'Fi-relé (áram-védőkapcsoló)',
    designation: 'FI',
    purposeHu:
      'Összehasonlítja a fázison beérkező és a nullán visszatérő áramot. Ha a kettő ' +
      'különbsége eléri a névleges hibaáramot (lakásban jellemzően 30 mA), lekapcsol. ' +
      'Az érintésvédelem kiegészítő védelme, nem zárlatvédelem.',
    terminalsHu:
      'Egyfázisú (1P+N) kivitelben a felső 1 és N a betáplálás, az alsó 2 és N a fogyasztói ' +
      'oldal. Négypólusú kivitelben felül L1, L2, L3, N, alul T1, T2, T3, N. A TEST gomb ' +
      'a beépített ellenállással mesterséges hibaáramot hoz létre.',
    behaviourHu:
      'Bekapcsolt állapotban minden pólusa átvezet, kioldás után minden pólusa - a nulla is - ' +
      'bontott. A nullát tehát nem szabad a Fi-relé mellett elvezetni.',
    appearsIn: ['A', 'B', 'F', 'G'],
    mistakeHu:
      'A Fi-relé utáni nullát a mérő előtti (Fi előtti) N-sínről veszik. Ilyenkor a visszatérő ' +
      'áram kikerüli az összegző átalakítót, és a Fi azonnal kiold, vagy éppen nem véd.',
    symbol: `<line x1="16" y1="6" x2="16" y2="24"/>
<line x1="32" y1="6" x2="32" y2="24"/>
<line x1="48" y1="6" x2="48" y2="24"/>
<line x1="64" y1="6" x2="64" y2="24"/>
<line x1="16" y1="40" x2="25" y2="24"/>
<line x1="32" y1="40" x2="41" y2="24"/>
<line x1="48" y1="40" x2="57" y2="24"/>
<line x1="64" y1="40" x2="73" y2="24"/>
<line x1="21" y1="32" x2="69" y2="32" stroke-dasharray="4 3"/>
<line x1="16" y1="40" x2="16" y2="74"/>
<line x1="32" y1="40" x2="32" y2="74"/>
<line x1="48" y1="40" x2="48" y2="74"/>
<line x1="64" y1="40" x2="64" y2="74"/>
<path d="M6 58 a 34 9 0 1 0 68 0 a 34 9 0 1 0 -68 0"/>`,
  },
  {
    id: 'kismegszakito',
    nameHu: 'Kismegszakító',
    designation: 'Q (régebbi rajzokon F)',
    purposeHu:
      'A vezetéket védi túlterhelés és zárlat ellen. Két kioldója van: a bimetál lassan, ' +
      'túlterhelésre, az elektromágneses azonnal, zárlatra bont.',
    terminalsHu:
      'Az 1-es kapocs a betáplálás (felül), a 2-es a fogyasztói oldal (alul). Háromfázisú ' +
      'kivitelnél pólusonként 1-2, 3-4, 5-6 vagy L1-T1, L2-T2, L3-T3 a jelölés.',
    behaviourHu:
      'Bekapcsolva átvezet, kioldás után a karja középállásba ugrik. Csak a fázist bontja, ' +
      'a nullát nem, ezért a bontott kismegszakító után is lehet nulla a vezetéken.',
    appearsIn: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
    mistakeHu:
      'A betáplálást alulról, a 2-es kapocsra kötik. Működni működik, de a bekötés nem ' +
      'szabványos, és a bontott készülék felső kapcsa így feszültség alatt marad.',
    symbol: `<line x1="40" y1="6" x2="40" y2="26"/>
<line x1="34" y1="20" x2="46" y2="32"/>
<line x1="46" y1="20" x2="34" y2="32"/>
<line x1="40" y1="52" x2="54" y2="28"/>
<line x1="40" y1="52" x2="40" y2="74"/>`,
  },
  {
    id: 'frekvenciavalto',
    nameHu: 'Frekvenciaváltó',
    designation: 'U (a rajzokon gyakran Q)',
    purposeHu:
      'A bemenő hálózati feszültséget egyenirányítja, majd változtatható frekvenciájú ' +
      'háromfázisú feszültséget állít elő. Ezzel a motor fordulatszáma és indítási rámpája ' +
      'szabályozható, az indítási áramlökés pedig kicsi marad.',
    terminalsHu:
      'A bemeneti oldal L1, N (vagy L1, L2, L3) és PE, a kimeneti oldal T1, T2, T3 a motor felé. ' +
      'A vezérlőjelek külön, kisfeszültségű kapocssoron vannak.',
    behaviourHu:
      'A kimenetén akkor is lehet feszültség, ha a főkapcsoló bontott, mert a köztes körben ' +
      'a kondenzátorok kisülési ideje néhány perc. A gyártó által előírt várakozási időt be kell tartani.',
    appearsIn: ['C', 'D'],
    mistakeHu:
      'A motort a bemeneti kapcsokra, vagy a hálózatot a T1-T2-T3 kimenetre kötik. A felcserélt ' +
      'be- és kimenet a készüléket azonnal tönkreteszi.',
    symbol: `<rect x="14" y="16" width="52" height="48"/>
<line x1="14" y1="64" x2="66" y2="16"/>
<line x1="4" y1="26" x2="14" y2="26"/>
<line x1="4" y1="34" x2="14" y2="34"/>
<line x1="4" y1="42" x2="14" y2="42"/>
<line x1="66" y1="46" x2="76" y2="46"/>
<line x1="66" y1="54" x2="76" y2="54"/>
<line x1="66" y1="62" x2="76" y2="62"/>
<path d="M20 30 q 4 -8 8 0 q 4 8 8 0"/>
<path d="M38 54 q 3 -7 6 0 q 3 7 6 0 q 3 -7 6 0 q 3 7 6 0"/>`,
  },
  {
    id: 'motorvedo-kapcsolo',
    nameHu: 'Motorvédő kapcsoló',
    designation: 'Q (a rajzokon gyakran HK)',
    purposeHu:
      'Motorra méretezett védőkapcsoló: állítható bimetál kioldója a motor névleges áramára ' +
      'állítható be, a gyorskioldója zárlatra bont. Fáziskiesésre is érzékeny, ezért a motor ' +
      'kétfázisú járását megakadályozza.',
    terminalsHu:
      'Főáramkör: L1, L2, L3 a betáplálás, T1, T2, T3 a motor felé (egyfázisú kivitelnél L1-T1). ' +
      'Segédérintkező: 13-14 záró, sok típuson 95-96 bontó riasztásra.',
    behaviourHu:
      'Kioldás után a kart kézzel vissza kell állítani. A 13-14 záró segédérintkező csak ' +
      'bekapcsolt, ki nem oldott állapotban vezet, ezért a vezérlés ezen keresztül reteszelhető.',
    appearsIn: ['C', 'D', 'E'],
    mistakeHu:
      'A motorvédőt a mágneskapcsoló elé teszik és a vezérlést róla veszik, közben a beállító ' +
      'tárcsát a motor adattábláján szereplő áram helyett a maximumra állítják. Így nincs valódi védelem.',
    symbol: `<line x1="18" y1="6" x2="18" y2="22"/>
<line x1="38" y1="6" x2="38" y2="22"/>
<line x1="58" y1="6" x2="58" y2="22"/>
<line x1="18" y1="38" x2="26" y2="22"/>
<line x1="38" y1="38" x2="46" y2="22"/>
<line x1="58" y1="38" x2="66" y2="22"/>
<line x1="22" y1="30" x2="62" y2="30" stroke-dasharray="4 3"/>
<line x1="18" y1="38" x2="18" y2="50"/>
<line x1="38" y1="38" x2="38" y2="50"/>
<line x1="58" y1="38" x2="58" y2="50"/>
<rect x="10" y="50" width="56" height="16"/>
<path d="M16 62 h 8 v -8 h 8 v 8 h 8 v -8 h 8 v 8 h 8"/>
<line x1="18" y1="66" x2="18" y2="76"/>
<line x1="38" y1="66" x2="38" y2="76"/>
<line x1="58" y1="66" x2="58" y2="76"/>`,
  },
  {
    id: 'magneskapcsolo',
    nameHu: 'Mágneskapcsoló',
    designation: 'K',
    purposeHu:
      'Távműködtetett kapcsoló: a tekercse behúzza a mozgó érintkezőket, így a kis áramú ' +
      'vezérlőáramkörről nagy teljesítményű főáramkör kapcsolható. Feszültségkimaradáskor ' +
      'magától elenged, ezért a motor nem indul újra magától.',
    terminalsHu:
      'Főérintkezők: 1-2, 3-4, 5-6 (egyes típusokon L1-T1, L2-T2, L3-T3). Tekercs: A1 és A2. ' +
      'A segédérintkezők kétjegyű számot kapnak: az első számjegy a sorszám, a második a funkció ' +
      '(1-2 bontó, 3-4 záró), például 13-14 záró, 21-22 bontó.',
    behaviourHu:
      'Amíg a tekercs feszültség alatt van, minden zárója zárt és minden bontója nyitott. ' +
      'A tekercs elengedésekor az összes érintkező egyszerre visszatér alaphelyzetbe.',
    appearsIn: ['C', 'D', 'E'],
    mistakeHu:
      'A főáramkör bekötése után a segédérintkezőt is a főáramkörből táplálják, vagy a ' +
      'két mágneskapcsolót irányváltásnál reteszelés nélkül hagyják. Egyszerre behúzva ez fázisok közti zárlat.',
    symbol: `<line x1="20" y1="6" x2="20" y2="26"/>
<line x1="40" y1="6" x2="40" y2="26"/>
<line x1="60" y1="6" x2="60" y2="26"/>
<line x1="20" y1="46" x2="9" y2="28"/>
<line x1="40" y1="46" x2="29" y2="28"/>
<line x1="60" y1="46" x2="49" y2="28"/>
<path d="M2 28 a 7 7 0 0 0 14 0"/>
<path d="M22 28 a 7 7 0 0 0 14 0"/>
<path d="M42 28 a 7 7 0 0 0 14 0"/>
<line x1="9" y1="38" x2="53" y2="38" stroke-dasharray="4 3"/>
<line x1="20" y1="46" x2="20" y2="74"/>
<line x1="40" y1="46" x2="40" y2="74"/>
<line x1="60" y1="46" x2="60" y2="74"/>`,
  },
  {
    id: 'magneskapcsolo-tekercs',
    nameHu: 'Mágneskapcsoló tekercs (A1-A2)',
    designation: 'K (A1-A2)',
    purposeHu:
      'A mágneskapcsoló működtető tekercse. Ha a két kapcsa között megjelenik a névleges ' +
      'vezérlőfeszültség, a készülék behúz. A vezérlőáramkör minden nyomógombja és ' +
      'segédérintkezője végül ezt a tekercset kapcsolja.',
    terminalsHu:
      'A1 a vezérlőfázis felőli kapocs, A2 a nulla (vagy a vezérlőfeszültség másik pólusa) felőli. ' +
      'A vezérlőáramkör kapcsolóelemei az A1 elé kerülnek, az A2 közvetlenül a nullára megy.',
    behaviourHu:
      'A tekercs fogyasztó: a saját két kapcsát nem köti össze. Ha A1-et és A2-t közvetlenül ' +
      'a fázis és a nulla közé kötve összekötöd egy vezetékkel, az zárlat.',
    appearsIn: ['C', 'D', 'E'],
    mistakeHu:
      'A leállító gombot az A2 és a nulla közé teszik, a tekercs A1 oldalát pedig állandó ' +
      'fázison hagyják. Így a tekercs egyik kapcsa mindig feszültség alatt van, ami hibás és veszélyes vezérlés.',
    symbol: `<rect x="22" y="28" width="36" height="24"/>
<line x1="6" y1="40" x2="22" y2="40"/>
<line x1="58" y1="40" x2="74" y2="40"/>`,
  },
  {
    id: 'zaro-erintkezo',
    nameHu: 'Záró (NO) segédérintkező',
    designation: 'K 13-14',
    purposeHu:
      'Alaphelyzetben nyitott érintkező, amely a készülék behúzásakor zár. Az öntartás ' +
      'ezzel készül: a behúzott mágneskapcsoló a saját záró érintkezőjén keresztül tartja ' +
      'feszültség alatt a tekercsét, miután az indító nyomógombot elengedted.',
    terminalsHu:
      'Két számjegyű jelölés, a második számjegy 3 és 4: 13-14, 33-34, 43-44. A 3-4 páros ' +
      'mindig zárót jelent, a sorszám csak megkülönböztet.',
    behaviourHu:
      'Nyugalmi állapotban szakadás, behúzva vezet. Feszültségkimaradáskor azonnal nyit, ' +
      'ezért az öntartás magától megszűnik, és a gép nem indul újra a feszültség visszatértével.',
    appearsIn: ['C', 'D', 'E'],
    mistakeHu:
      'Az öntartó érintkezőt nem az indító nyomógombbal párhuzamosan, hanem vele sorba kötik. ' +
      'Ilyenkor a gép csak addig jár, amíg a gombot nyomva tartod.',
    symbol: `<line x1="34" y1="8" x2="34" y2="30"/>
<line x1="34" y1="54" x2="48" y2="30"/>
<line x1="34" y1="54" x2="34" y2="72"/>`,
  },
  {
    id: 'bonto-erintkezo',
    nameHu: 'Bontó (NC) segédérintkező',
    designation: 'K 21-22',
    purposeHu:
      'Alaphelyzetben zárt érintkező, amely a készülék behúzásakor nyit. Kölcsönös ' +
      'reteszeléshez használjuk: az egyik mágneskapcsoló bontója a másik tekercsének ' +
      'körében van, így a kettő soha nem húzhat be egyszerre.',
    terminalsHu:
      'Két számjegyű jelölés, a második számjegy 1 és 2: 21-22, 31-32, 51-52, 81-82. ' +
      'Az 1-2 páros mindig bontót jelent.',
    behaviourHu:
      'Nyugalmi állapotban vezet, behúzva szakadás. A bontó előbb nyit, mint ahogy a záró ' +
      'zárna, ezért a reteszelés akkor is működik, ha mindkét indítógombot egyszerre nyomják.',
    appearsIn: ['C', 'D', 'E'],
    mistakeHu:
      'Irányváltásnál a reteszelést a saját mágneskapcsoló bontójáról veszik a másiké helyett. ' +
      'Így a készülék önmagát reteszeli ki, és be sem húz.',
    symbol: `<line x1="48" y1="8" x2="48" y2="28"/>
<line x1="36" y1="28" x2="58" y2="28"/>
<line x1="34" y1="54" x2="48" y2="28"/>
<line x1="34" y1="54" x2="34" y2="72"/>`,
  },
  {
    id: 'indito-nyomogomb',
    nameHu: 'Indító nyomógomb',
    designation: 'S (zöld)',
    purposeHu:
      'Visszatérő működésű, alaphelyzetben nyitott (záró) nyomógomb. Megnyomva rövid időre ' +
      'feszültséget ad a mágneskapcsoló tekercsére, az öntartás pedig utána tartja a kört.',
    terminalsHu:
      'A záró érintkező kapcsai 3 és 4. Több indítóhely esetén a gombok egymással ' +
      'párhuzamosan kerülnek a körbe, mert bármelyikkel indítani kell tudni.',
    behaviourHu:
      'Csak addig zár, amíg nyomva tartod, elengedve visszaugrik. Ezért kell mellé öntartás, ' +
      'különben a motor csak a gomb nyomva tartása alatt járna.',
    appearsIn: ['A', 'B', 'C', 'D', 'E'],
    mistakeHu:
      'Két indítógombot sorba kötnek. Ilyenkor csak akkor indul a gép, ha mindkettőt ' +
      'egyszerre nyomják, ami nem a kiírt működés.',
    symbol: `<line x1="34" y1="8" x2="34" y2="28"/>
<line x1="34" y1="58" x2="48" y2="32"/>
<line x1="34" y1="58" x2="34" y2="74"/>
<line x1="41" y1="45" x2="16" y2="45" stroke-dasharray="4 3"/>
<line x1="16" y1="36" x2="16" y2="54"/>
<line x1="8" y1="45" x2="16" y2="45"/>`,
  },
  {
    id: 'leallito-nyomogomb',
    nameHu: 'Leállító nyomógomb',
    designation: 'S (piros)',
    purposeHu:
      'Visszatérő működésű, alaphelyzetben zárt (bontó) nyomógomb. Megnyomva megszakítja ' +
      'a vezérlőáramkört, a mágneskapcsoló tekercse feszültség nélkül marad, és az öntartás megszűnik.',
    terminalsHu:
      'A bontó érintkező kapcsai 1 és 2. Több leállítóhely esetén a gombok egymással ' +
      'sorba kerülnek, mert bármelyikkel le kell tudni állítani.',
    behaviourHu:
      'Nyugalmi állapotban vezet, megnyomva bont. A vezérlés akkor helyes, ha a leállító ' +
      'gomb a tekercs A1 oldala előtt, a fázis felőli ágban van.',
    appearsIn: ['C', 'D', 'E'],
    mistakeHu:
      'Két leállító gombot párhuzamosan kötnek. Ilyenkor a másik gomb áthidalja a megnyomottat, ' +
      'és a gép nem áll le - ez a vizsgán azonnali hiba.',
    symbol: `<line x1="48" y1="8" x2="48" y2="28"/>
<line x1="36" y1="28" x2="58" y2="28"/>
<line x1="34" y1="58" x2="48" y2="28"/>
<line x1="34" y1="58" x2="34" y2="74"/>
<line x1="40" y1="45" x2="16" y2="45" stroke-dasharray="4 3"/>
<line x1="16" y1="36" x2="16" y2="54"/>
<line x1="8" y1="45" x2="16" y2="45"/>`,
  },
  {
    id: 'jelzolampa',
    nameHu: 'Jelzőlámpa',
    designation: 'H',
    purposeHu:
      'Üzemállapot-visszajelzés. A zöld lámpa jellemzően a járó gépet, a piros a hibát vagy ' +
      'a kioldott védelmet jelzi. Fogyasztó, tehát fázis és nulla közé kerül.',
    terminalsHu:
      'Két kapcsa X1 és X2. Az X1 a kapcsolt fázis felől jön, az X2 a nullára megy. ' +
      'Az üzemjelzést a mágneskapcsoló egy szabad záró érintkezőjéről vesszük, nem a motor kapcsáról.',
    behaviourHu:
      'A lámpa nem köti össze a saját két kapcsát, ezért ha az X1 és X2 közé vezetéket kötsz, ' +
      'az fázis-nulla zárlat.',
    appearsIn: ['C', 'D', 'E'],
    mistakeHu:
      'Az üzemjelzőt a motor egyik fázisa és a PE közé kötik. Ez testzárlat: a Fi-relé kiold, ' +
      'a védővezető pedig üzemi áramot vinne.',
    symbol: `<circle cx="40" cy="40" r="18"/>
<line x1="27" y1="27" x2="53" y2="53"/>
<line x1="53" y1="27" x2="27" y2="53"/>
<line x1="8" y1="40" x2="22" y2="40"/>
<line x1="58" y1="40" x2="72" y2="40"/>`,
  },
  {
    id: 'lampatest',
    nameHu: 'Lámpatest',
    designation: 'E',
    purposeHu:
      'A világítási áramkör fogyasztója. A kapcsolt fázis és a nulla közé kerül, a fémházát ' +
      'pedig védővezetővel kell ellátni, ha I. érintésvédelmi osztályú.',
    terminalsHu:
      'Az 1-es kapcsára a kapcsolóról vagy a lépcsőházi automatáról érkező kapcsolt fázis megy, ' +
      'a másik kapcsára a nulla az N-sínről. A PE a testére köt.',
    appearsIn: ['A', 'B', 'F', 'G'],
    mistakeHu:
      'A nullát kapcsolják a fázis helyett. A lámpa így is működik, de bontott kapcsoló mellett ' +
      'a foglalat feszültség alatt marad, ami tilos.',
    symbol: `<rect x="14" y="32" width="52" height="16"/>
<line x1="14" y1="26" x2="14" y2="54"/>
<line x1="66" y1="26" x2="66" y2="54"/>
<line x1="2" y1="40" x2="14" y2="40"/>
<line x1="66" y1="40" x2="78" y2="40"/>`,
  },
  {
    id: 'dugaszoloaljzat',
    nameHu: 'Dugaszolóaljzat (védőérintkezős)',
    designation: 'X',
    purposeHu:
      'Csatlakozási pont a hordozható fogyasztóknak. Védőérintkezős kivitelben három vezetőt ' +
      'kap: fázist, nullát és védővezetőt.',
    terminalsHu:
      'L a fázis, N a nulla, PE a védővezető. Az L és N felcserélhetetlen sorrendje a ' +
      'szabvány szerint kötelező, a PE mindig a védőérintkezőre megy.',
    appearsIn: ['A', 'B', 'F', 'G'],
    mistakeHu:
      'A PE-t nem kötik be, vagy a nullával kötik össze az aljzatnál. A védővezető és a nulla ' +
      'összekötése a fogyasztói oldalon tilos, és a Fi-relét is működésképtelenné teszi.',
    symbol: `<line x1="12" y1="52" x2="68" y2="52"/>
<path d="M18 52 A 22 22 0 0 1 62 52"/>
<line x1="24" y1="40" x2="56" y2="40"/>
<line x1="40" y1="52" x2="40" y2="72"/>`,
  },
  {
    id: 'egysarku-kapcsolo',
    nameHu: 'Egysarkú kapcsoló',
    designation: 'S',
    purposeHu:
      'Egy helyről kapcsolt világítási áramkör kapcsolója. Egyetlen érintkezője van, ' +
      'amely a fázist szakítja meg.',
    terminalsHu:
      'Az 1-es kapocs a betáplálás felőli állandó fázis, a 2-es a lámpa felé menő kapcsolt fázis.',
    behaviourHu:
      'Két stabil állása van: bekapcsolva vezet, kikapcsolva bont. Nyomógombbal ellentétben ' +
      'nem tér vissza magától alaphelyzetbe.',
    appearsIn: ['A'],
    mistakeHu:
      'A nullát vezetik rajta keresztül. Ilyenkor kikapcsolt állapotban is fázison marad a lámpa.',
    symbol: `<line x1="8" y1="52" x2="28" y2="52"/>
<line x1="28" y1="52" x2="50" y2="34"/>
<line x1="52" y1="52" x2="72" y2="52"/>`,
  },
  {
    id: 'valtokapcsolo',
    nameHu: 'Váltókapcsoló',
    designation: 'S',
    purposeHu:
      'Két helyről kapcsolt világításhoz. Egy közös kapcsát két kimenet között váltogatja, ' +
      'így két váltókapcsolóval bármelyik helyről fel- és lekapcsolható a lámpa.',
    terminalsHu:
      'A közös kapocs jele P (egyes rajzokon 1 vagy L), a két váltott érintkező 1 és 2. ' +
      'A két váltókapcsoló 1-1 és 2-2 kapcsait két érrel, az úgynevezett váltóvezetékekkel kötjük össze.',
    behaviourHu:
      'A közös kapocs mindig pontosan az egyik érintkezővel áll kapcsolatban, szakadás nincs. ' +
      'A lámpa akkor világít, ha a két kapcsoló ugyanazt a váltóvezetéket választja.',
    appearsIn: ['A', 'B'],
    mistakeHu:
      'A két váltóvezeték közé bekötik a lámpát, vagy a közös kapcsot cserélik fel az egyik ' +
      'érintkezővel. Ilyenkor csak az egyik helyről működik a kapcsolás.',
    symbol: `<line x1="8" y1="44" x2="26" y2="44"/>
<line x1="26" y1="44" x2="50" y2="30"/>
<line x1="52" y1="28" x2="72" y2="28"/>
<line x1="52" y1="58" x2="72" y2="58"/>`,
  },
  {
    id: 'keresztkapcsolo',
    nameHu: 'Keresztkapcsoló',
    designation: 'S',
    purposeHu:
      'Három vagy több helyről kapcsolt világításhoz. Mindig két váltókapcsoló közé kerül, ' +
      'és a két váltóvezetéket cseréli fel egymással.',
    terminalsHu:
      'Négy kapcsa van: 1 és 2 a bemenet, 3 és 4 a kimenet. Egyik állásában 1-3 és 2-4, ' +
      'a másikban 1-4 és 2-3 kapcsolódik össze.',
    behaviourHu:
      'Soha nem szakít áramkört, csak keresztezi az ereket. Ezért a lámpa állapota minden ' +
      'kapcsolóhelyről megfordítható.',
    appearsIn: ['B'],
    mistakeHu:
      'A keresztkapcsolót a sor végére, a váltókapcsoló helyére teszik, vagy a bemenetét és ' +
      'a kimenetét egy oldalon kötik be. Ilyenkor a kapcsolás egy vagy több helyről nem működik.',
    symbol: `<line x1="6" y1="26" x2="24" y2="26"/>
<line x1="6" y1="54" x2="24" y2="54"/>
<line x1="56" y1="26" x2="74" y2="26"/>
<line x1="56" y1="54" x2="74" y2="54"/>
<line x1="24" y1="26" x2="56" y2="54"/>
<line x1="24" y1="54" x2="56" y2="26"/>
<rect x="22" y="20" width="36" height="40" stroke-dasharray="4 3"/>`,
  },
  {
    id: 'lepcsohazi-automata',
    nameHu: 'Lépcsőházi automata',
    designation: 'K (a rajzokon LA)',
    purposeHu:
      'Időzítő készülék: egy rövid indítójelre beállított ideig (jellemzően néhány perc) ' +
      'bekapcsolva tartja a világítást, majd magától lekapcsol. Tetszőleges számú nyomógombról indítható.',
    terminalsHu:
      'Az L és N kapocs a készülék saját tápellátása, a 3-as kapocs az indítójel a nyomógombokról, ' +
      'a 4-es kapocs a kapcsolt fázis a lámpák felé. Régebbi rajzokon 1, 2, 3, 4 a számozás.',
    behaviourHu:
      'Az indítójel minden megnyomásra újraindítja az időzítést. Ha a 3-as kapcson tartósan ' +
      'feszültség marad (például bent felejtett kapcsoló miatt), az automata folyamatosan újraindul és nem jár le.',
    appearsIn: ['A', 'B'],
    mistakeHu:
      'A készülék tápellátását nem kötik be (csak az indítójelet és a lámpát), vagy a nullát ' +
      'hagyják el az N kapocsról. Az automata így meg sem szólal.',
    symbol: `<rect x="10" y="16" width="60" height="48"/>
<circle cx="40" cy="40" r="13"/>
<line x1="40" y1="40" x2="40" y2="30"/>
<line x1="40" y1="40" x2="48" y2="44"/>
<line x1="2" y1="28" x2="10" y2="28"/>
<line x1="2" y1="52" x2="10" y2="52"/>
<line x1="70" y1="28" x2="78" y2="28"/>
<line x1="70" y1="52" x2="78" y2="52"/>`,
  },
  {
    id: 'kotodoboz',
    nameHu: 'Kötődoboz',
    designation: 'X',
    purposeHu:
      'A vezetékek elágazási és kötési pontja a szerelésben. Minden kötésnek hozzáférhető ' +
      'helyen, dobozban kell lennie, falba vagy vakolat alá kötés nem maradhat.',
    terminalsHu:
      'Nincs saját kapocsszámozása: benne sorkapoccsal vagy kötőelemmel kapcsoljuk össze az ' +
      'azonos csomópontba tartozó ereket. A vizsgatáblán ezt a szerepet a sorkapocs sínek veszik át.',
    appearsIn: [],
    mistakeHu:
      'Sodrott eret csavaros kötésbe érvéghüvely nélkül tesznek, vagy a PE-t megszakítják a ' +
      'dobozban. A védővezető átkötése soha nem függhet egyetlen fogyasztó bekötésétől.',
    symbol: `<circle cx="40" cy="40" r="18"/>
<line x1="40" y1="22" x2="40" y2="6"/>
<line x1="58" y1="40" x2="74" y2="40"/>
<line x1="40" y1="58" x2="40" y2="74"/>
<line x1="22" y1="40" x2="6" y2="40"/>`,
  },
  {
    id: 'haromfazisu-motor',
    nameHu: 'Háromfázisú motor',
    designation: 'M',
    purposeHu:
      'Háromfázisú aszinkron motor, a motorvezérlési feladatok fogyasztója. A forgásirányát ' +
      'a rá jutó fázissorrend adja, ezért két fázis felcserélése megfordítja a forgásirányt.',
    terminalsHu:
      'A kapocsdobozban U1, V1, W1 és U2, V2, W2. Csillag kapcsolásnál az U2-V2-W2 van összekötve, ' +
      'delta kapcsolásnál U1-W2, V1-U2, W1-V2. A motor testére kötelező a PE.',
    behaviourHu:
      'Fáziskiesés esetén a motor kétfázisúan jár: erősen felmelegszik, de forog tovább. ' +
      'Ezt csak a motorvédő kapcsoló veszi észre, a kismegszakító nem feltétlenül.',
    appearsIn: ['C', 'D'],
    mistakeHu:
      'Az adattábla feszültségét nem nézik meg, és a motort rossz kapcsolásban (csillag helyett ' +
      'delta) kötik be, vagy a PE-t a kapocsdobozban kihagyják.',
    symbol: `<circle cx="40" cy="46" r="22"/>
<line x1="30" y1="27" x2="30" y2="8"/>
<line x1="40" y1="24" x2="40" y2="6"/>
<line x1="50" y1="27" x2="50" y2="8"/>
<path d="M32 46 q 4 -9 8 0 q 4 9 8 0"/>`,
  },
  {
    id: 'egyfazisu-motor',
    nameHu: 'Egyfázisú motor',
    designation: 'M',
    purposeHu:
      'Egyfázisú, jellemzően segédfázisú (kondenzátoros) motor. Fázis, nulla és védővezető ' +
      'kell hozzá, a forgásirányát a segédtekercs bekötése szabja meg.',
    terminalsHu:
      'A kapocsdobozban a főtekercs U1-U2, a segédtekercs Z1-Z2 (típustól függően más jelöléssel), ' +
      'közéjük kerül az üzemi kondenzátor. A test kapcsára a PE megy.',
    behaviourHu:
      'A fázis felcserélése a nullával nem fordítja meg a forgásirányt, ahhoz a segédtekercs ' +
      'bekötését kell megcserélni.',
    appearsIn: ['E'],
    mistakeHu:
      'A motor bekötésénél a nullát a védővezetőre kötik. Ez testzárlat, a Fi-relé azonnal kiold.',
    symbol: `<circle cx="40" cy="46" r="22"/>
<line x1="32" y1="26" x2="32" y2="8"/>
<line x1="48" y1="26" x2="48" y2="8"/>
<path d="M32 46 q 4 -9 8 0 q 4 9 8 0"/>`,
  },
  {
    id: 'fogyasztasmero',
    nameHu: 'Fogyasztásmérő',
    designation: 'P (kWh)',
    purposeHu:
      'A szolgáltató elszámolási mérője: a fogyasztott villamos energiát méri. Közvetlen ' +
      'mérésű kivitelben a teljes fogyasztói áram átfolyik rajta, áramváltó nélkül.',
    terminalsHu:
      'Egyfázisú mérőnél a fázis az 1-3, a nulla a 4-6 kapcson megy át. Háromfázisúnál a ' +
      'fázisok 1-3, 4-6, 7-9, a nulla 10-11. Minden kapocspár első tagja a betáplálás, a második a fogyasztói oldal.',
    behaviourHu:
      'A mérő nem védelem: nem kapcsol és nem old ki. Nulla nélkül nem mér helyesen, ezért ' +
      'a nulla átvezetése kötelező.',
    appearsIn: ['F', 'G'],
    mistakeHu:
      'A be- és kimenő oldalt felcserélik, vagy a nullát megkerülve viszik a fogyasztóhoz. ' +
      'A mérő ilyenkor hibásan vagy egyáltalán nem mér, a mérőhely pedig nem plombálható.',
    symbol: `<rect x="8" y="22" width="64" height="36"/>
<circle cx="40" cy="40" r="11"/>
<line x1="29" y1="40" x2="51" y2="40"/>
<line x1="28" y1="22" x2="28" y2="10"/>
<line x1="52" y1="22" x2="52" y2="10"/>
<line x1="28" y1="58" x2="28" y2="70"/>
<line x1="52" y1="58" x2="52" y2="70"/>`,
  },
  {
    id: 'fokapcsolo',
    nameHu: 'Főkapcsoló',
    designation: 'Q (a rajzokon FK)',
    purposeHu:
      'A fogyasztói berendezés egészét feszültségmentesíti egy mozdulattal. A mérőhelyen a ' +
      'mérő után, a Fi-relé és az áramkörök előtt van a helye.',
    terminalsHu:
      'Betáplálás felül L1, L2, L3 és N, fogyasztói oldal alul T1, T2, T3 és TN. ' +
      'A nulla pólusa a többivel együtt, egyszerre kapcsol.',
    behaviourHu:
      'Terhelés alatt is bontható, de nem védelmi készülék: túlterhelésre és zárlatra nem old ki. ' +
      'A PE-t soha nem szabad rajta átvezetni.',
    appearsIn: ['F'],
    mistakeHu:
      'A védővezetőt is átvezetik a főkapcsolón, vagy a nullát a főkapcsoló mellett viszik el. ' +
      'A PE megszakítása súlyos hiba, a megkerült nulla pedig hamis feszültségmentességet mutat.',
    symbol: `<line x1="14" y1="6" x2="14" y2="24"/>
<line x1="32" y1="6" x2="32" y2="24"/>
<line x1="50" y1="6" x2="50" y2="24"/>
<line x1="68" y1="6" x2="68" y2="24"/>
<line x1="14" y1="40" x2="5" y2="24"/>
<line x1="32" y1="40" x2="23" y2="24"/>
<line x1="50" y1="40" x2="41" y2="24"/>
<line x1="68" y1="40" x2="59" y2="24"/>
<line x1="5" y1="32" x2="59" y2="32" stroke-dasharray="4 3"/>
<line x1="14" y1="40" x2="14" y2="74"/>
<line x1="32" y1="40" x2="32" y2="74"/>
<line x1="50" y1="40" x2="50" y2="74"/>
<line x1="68" y1="40" x2="68" y2="74"/>`,
  },
  {
    id: 'sorkapocs-sin',
    nameHu: 'Sorkapocs sín',
    designation: 'X',
    purposeHu:
      'Gyűjtő- és elosztópont: az azonos csomópontba tartozó ereket köti össze rendezetten. ' +
      'A táblán külön N-sín és külön PE-sín van, ezeket összekötni tilos.',
    terminalsHu:
      'A sín minden kapcsa villamosan ugyanaz a pont, tehát mindegy, melyik szabad kapocsra kötsz. ' +
      'Egy kapocsba egy eret teszünk, hogy a kötés bontható és ellenőrizhető maradjon.',
    appearsIn: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
    mistakeHu:
      'Az N-sínt és a PE-sínt összekötik a fogyasztói oldalon. TN-S rendszerben ez tilos, ' +
      'és a Fi-relé védelmét is kiiktatja.',
    symbol: `<rect x="6" y="48" width="68" height="12"/>
<circle cx="16" cy="34" r="6"/>
<circle cx="32" cy="34" r="6"/>
<circle cx="48" cy="34" r="6"/>
<circle cx="64" cy="34" r="6"/>
<line x1="16" y1="40" x2="16" y2="48"/>
<line x1="32" y1="40" x2="32" y2="48"/>
<line x1="48" y1="40" x2="48" y2="48"/>
<line x1="64" y1="40" x2="64" y2="48"/>
<line x1="16" y1="28" x2="16" y2="10"/>
<line x1="32" y1="28" x2="32" y2="10"/>
<line x1="48" y1="28" x2="48" y2="10"/>
<line x1="64" y1="28" x2="64" y2="10"/>`,
  },
  {
    id: 'vedovezeto-pe',
    nameHu: 'Védővezető (PE)',
    designation: 'PE',
    purposeHu:
      'A fogyasztók érinthető fémrészeit köti a földelt pontra. Hiba esetén ezen folyik el a ' +
      'hibaáram, ami kioldásra készteti a védelmet, és megakadályozza a veszélyes érintési feszültséget.',
    terminalsHu:
      'Színe zöld-sárga, ezt a színt más célra használni tilos. A PE-sínen keresztül jut el ' +
      'minden fogyasztóhoz, a dugaljak PE kapcsára és a fémházak testkapcsára.',
    behaviourHu:
      'Üzemi áramot nem visz, kapcsolóelemet nem tartalmazhat: sem kapcsoló, sem biztosító, ' +
      'sem kismegszakító nem szakíthatja meg.',
    appearsIn: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
    mistakeHu:
      'A PE-t a nullával helyettesítik vagy összekötik a fogyasztónál. Nullaszakadás esetén ' +
      'így a készülékház feszültség alá kerül.',
    symbol: `<line x1="40" y1="8" x2="40" y2="34"/>
<line x1="14" y1="34" x2="66" y2="34"/>
<line x1="22" y1="46" x2="58" y2="46"/>
<line x1="30" y1="58" x2="50" y2="58"/>`,
  },
  {
    id: 'nullavezeto-n',
    nameHu: 'Nullavezető (N)',
    designation: 'N',
    purposeHu:
      'Az egyfázisú fogyasztók visszatérő üzemi vezetője, a transzformátor csillagpontjához ' +
      'kötött pont. TN-S rendszerben végig külön vezető, a védővezetőtől elválasztva.',
    terminalsHu:
      'Színe kék. A táblán az N-sínre fut össze, onnan megy a fogyasztókhoz. A Fi-relé előtti ' +
      'és utáni N-sín két külön csomópont, összekötni tilos.',
    behaviourHu:
      'Üzemi áramot visz, ezért nem tekinthető feszültségmentesnek. Csak olyan készülék ' +
      'kapcsolhatja, amely a fázissal együtt, egyszerre bontja (például Fi-relé vagy 3P+N főkapcsoló).',
    appearsIn: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
    mistakeHu:
      'A nullát a legközelebbi elérhető sínről veszik, nem abból az áramkörből, amelyikbe tartozik. ' +
      'A Fi-relé utáni fogyasztó nullája csak a Fi utáni N-sínről jöhet.',
    symbol: `<path d="M28 46 L 28 18 L 52 46 L 52 18"/>
<line x1="6" y1="64" x2="74" y2="64"/>`,
  },
  {
    id: 'fazisvezeto-l',
    nameHu: 'Fázisvezető (L)',
    designation: 'L (L1, L2, L3)',
    purposeHu:
      'A feszültség alatt álló üzemi vezető, amely a fogyasztó felé viszi az energiát. ' +
      'Háromfázisú hálózaton L1, L2, L3 jelöléssel, egymáshoz képest 120 fokos eltolással.',
    terminalsHu:
      'Színe barna, fekete vagy szürke. A kapcsolt fázist (kapcsoló és lámpa között) a ' +
      'szerelésben megkülönböztető színnel, jellemzően feketével vagy szürkével húzzuk.',
    behaviourHu:
      'Minden kapcsoló-, védelmi és bontóelem a fázisba kerül, soha nem a nullába. ' +
      'A vizsgatáblán a fázis akkor is veszélyes lehet, ha a lámpa nem világít, ezért csak feszültségmentes táblán szerelünk.',
    appearsIn: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
    mistakeHu:
      'Háromfázisú elosztásnál a három áramkört ugyanarról a fázisról kötik, ahelyett hogy ' +
      'fázisonként osztanák el a terhelést.',
    symbol: `<path d="M32 18 L 32 46 L 54 46"/>
<line x1="6" y1="64" x2="74" y2="64"/>`,
  },
];
