import type { TaskContent } from '../../domain/electrical-types';

export const contentD: TaskContent = {
  objectivesHu: [
    'A vizsgázó feszültségmentes gyakorlótáblán, kapcsolási rajz alapján be tudja kötni a két mágneskapcsolós, irányváltós háromfázisú motorvezérlést.',
    'Meg tudja mutatni, hogy a forgásirány megfordítása két fázis felcserélésével történik a K2 főérintkezőin.',
    'Helyesen valósítja meg a kölcsönös villamos reteszelést a K1 és K2 81-82 bontó segédérintkezőivel.',
    'Mindkét irányhoz be tudja kötni az öntartást a saját 13-14 záró segédérintkezővel.',
    'Be tudja kötni az irányonkénti üzemjelzést (Z1, Z2) és a soros 51-52 bontókon át működő P álló állapot jelzést.',
    'Fel tudja sorolni, mi történik zárlatvédelmi szempontból, ha a reteszelés hiányzik és mindkét mágneskapcsoló egyszerre húz meg.',
    'A kész bekötést feszültségmentes állapotban, szemrevételezéssel és folytonosságméréssel ellenőrzi, a reteszelést külön is végigméri.',
  ],
  commonMistakesHu: [
    'A K2 főérintkezőin nem cserélik fel a két fázist, ezért a motor mindkét gombra ugyanabba az irányba forog.',
    'Három fázist cserélnek fel kettő helyett, így a forgásirány nem változik meg.',
    'A reteszelést a másik mágneskapcsoló 13-14 záró érintkezőjével próbálják megoldani a 81-82 bontó helyett, ezért egyik irány sem tud elindulni.',
    'A reteszelő bontót a saját tekercs ágába kötik a másikéba helyett, így a mágneskapcsoló önmagát rezegteti ki.',
    'A reteszelést az öntartó ág után kötik be, ezért az öntartás áthidalja a reteszelést.',
    'A P piros lámpát csak az egyik mágneskapcsoló 51-52 bontóján át kötik, így az egyik irányban tévesen jelez álló állapotot.',
    'A Z1 és Z2 zöld lámpát felcserélik, ezért a visszajelzés nem a tényleges forgásirányt mutatja.',
    'A K1 és K2 kimeneteit nem vezetik közösen a HK motorvédő bemenetére, hanem külön-külön a motorra.',
    'A tekercsek A2 kapcsát nem az NB nulla-sínre kötik.',
    'A bekötést nem ellenőrzik végig feszültségmentes állapotban, hanem próbával akarják kideríteni a hibát.',
  ],
  guided: [
    {
      id: 'd1',
      titleHu: 'Feszültségmentes állapot, védővezető és betáplálás',
      goalHu: 'A tábla feszültségmentes, a SUP PE kapcsa a PB sínen van, onnan ág megy a Q1 frekvenciaváltóra és a motorra, a SUP L1 és N a Q1 bemenetére kerül.',
      focus: ['SUP', 'Q1', 'PB', 'NB', 'M'],
      reasoningHu:
        'A gyakorlótáblán minden munka feszültségmentes állapotban zajlik. A védővezetőt kötjük be elsőnek: a SUP PE kapcsáról a PB sínre, onnan a Q1 fémházára és a motor PE kapcsára. Ezután jön a frekvenciaváltó egyfázisú betáplálása: L1 és N, a nulla az NB sínen keresztül.',
      questionHu: 'Melyik sorrend helyes a munka megkezdésekor?',
      options: [
        'Feszültség alá helyezés, majd bekötés, végül a PE.',
        'Feszültségmentesség ellenőrzése, PE bekötése a PB sínre, majd a frekvenciaváltó betáplálása.',
        'Először a két mágneskapcsoló tekercse, mert az a legfontosabb.',
        'Először a jelzőlámpák, hogy lássuk a működést.',
      ],
      correct: 1,
      hintHu: 'A védővezető az első bekötött és az utolsó bontott ér, a tábla pedig végig feszültségmentes.',
      explanationHu:
        'A munkát a feszültségmentesség ellenőrzésével kezdjük, majd a védővezetőt kötjük be, mert ez marad meg akkor is, ha a szerelés félbeszakad. Csak ezután jön a frekvenciaváltó betáplálása, és utána épül fel a főáramkör.',
    },
    {
      id: 'd2',
      titleHu: 'Fázisvédelem: az F1 kismegszakító',
      goalHu: 'A Q1 T1, T2, T3 kimenete az F1 3P kismegszakító (Schneider Easy9 C16) 1, 3, 5 kapcsaira megy, a kimeneti 2, 4, 6 kapcsok szolgálnak a két mágneskapcsoló táplálására.',
      focus: ['Q1', 'F1'],
      reasoningHu:
        'A frekvenciaváltó háromfázisú kimenete a T1, T2, T3. Az F1 háromsarkú kismegszakító (Easy9 3P) fázisonként véd, bemenete fent (1, 3, 5), kimenete lent (2, 4, 6). Az F1 kimenete közös csomópont: innen ágazik el a K1 és a K2 főérintkezőire menő két ág.',
      questionHu: 'Miért ágazik el az F1 kimenete két irányba?',
      options: [
        'Mert a K1 és a K2 ugyanarról a három fázisról kapja a főáramkörét, csak más kiosztásban.',
        'Mert az egyik ág a vezérlőáramkört táplálja.',
        'Mert a motorvédő két külön bemenetet igényel.',
        'Mert a frekvenciaváltó két külön kimenettel rendelkezik.',
      ],
      correct: 0,
      hintHu: 'Mindkét mágneskapcsoló ugyanazt a motort hajtja, csak eltérő fázissorrenddel.',
      explanationHu:
        'A két mágneskapcsoló ugyanarról a három fázisról dolgozik. A különbség csak a kapcsok kiosztásában van: a K2-nél két fázis fel van cserélve, ettől fordul meg a forgásirány. A vezérlőáramkör külön kismegszakítóról, az F2-ről kap táplálást.',
    },
    {
      id: 'd3',
      titleHu: 'Az egyik irány főáramköre: K1',
      goalHu: 'Az F1 2, 4, 6 kapcsai rendre a K1 főérintkezőinek 1, 3, 5 kapcsaira kerülnek, a K1 2, 4, 6 kimenete a HK motorvédő bemenetére megy.',
      focus: ['F1', 'K1', 'HK'],
      reasoningHu:
        'A K1 adja az alapirányt, itt a fázissorrend változatlan: L1 az 1-es, L2 a 3-as, L3 az 5-ös kapocsra. A főérintkezőknél a páratlan szám a bemenet, a páros a kimenet. A K1 2T1, 4T2, 6T3 kimenete a HK motorvédő 1L1, 3L2, 5L3 kapcsaira fut.',
      questionHu: 'Melyik kapocs a mágneskapcsoló főérintkezőjének bemenete?',
      options: ['A 2, 4, 6.', 'Az 1, 3, 5.', 'Az A1 és A2.', 'A 13 és 14.'],
      correct: 1,
      hintHu: 'A páratlan számú főérintkező-kapcsok felül, a betáplálás felől vannak.',
      explanationHu:
        'A főérintkezőknél az 1, 3, 5 a bemenet és a 2, 4, 6 a kimenet. Az A1-A2 a tekercs, a 13-14 pedig záró segédérintkező, ezek nem a főáramkör részei.',
    },
    {
      id: 'd4',
      titleHu: 'A másik irány főáramköre: K2 fázisfelcseréléssel',
      goalHu: 'Az F1 L1 kimenete a K2 5-ös, az L2 kimenete a K2 3-as, az L3 kimenete a K2 1-es kapcsára kerül, a K2 2, 4, 6 kimenete a K1 kimenetével közösen a HK bemenetére.',
      focus: ['F1', 'K2', 'HK'],
      reasoningHu:
        'A háromfázisú motor forgásiránya a fázissorrendtől függ. Ha két fázist felcserélünk, a forgó mágneses mező iránya megfordul. A K2-nél ezért az L1 az 5-ös, az L3 az 1-es kapocsra megy, a középső fázis a helyén marad. A két mágneskapcsoló kimenete ugyanarra a három pontra, a motorvédő bemenetére csatlakozik.',
      questionHu: 'Hány fázist kell felcserélni a forgásirány megfordításához?',
      options: [
        'Mind a hármat.',
        'Kettőt, a harmadik a helyén marad.',
        'Egyet, a nullával együtt.',
        'Egyet sem, elég a motorvédő átállítása.',
      ],
      correct: 1,
      hintHu: 'Három fázis felcserélése csak eltolja a fázissorrendet, nem fordítja meg.',
      explanationHu:
        'Pontosan két fázis felcserélése fordítja meg a forgó mágneses mezőt, tehát a forgásirányt. Három fázis körbeforgatása ugyanazt a sorrendet adja vissza, így semmi nem változik. A nulla ebben nem játszik szerepet, a motor háromfázisú.',
    },
    {
      id: 'd5',
      titleHu: 'Motorvédő és motor',
      goalHu: 'A HK 1L1, 3L2, 5L3 bemenete a két mágneskapcsoló közös kimenetéről kap táplálást, a HK 2T1, 4T2, 6T3 kimenete a motor U1, V1, W1 kapcsaira megy, a motor PE kapcsa a PB sínre.',
      focus: ['K1', 'K2', 'HK', 'M', 'PB'],
      reasoningHu:
        'A motorvédő kapcsoló mindkét irányban ugyanazt a motort védi, ezért közös, a két mágneskapcsoló után van a sorban. Bemenete az 1L1, 3L2, 5L3, kimenete a 2T1, 4T2, 6T3. A motor védővezetőjét mindig a PE-sínre kötjük, soha nem a nullára.',
      questionHu: 'Miért elég egyetlen motorvédő kapcsoló a két irányhoz?',
      options: [
        'Mert a motorvédő csak az egyik irányt figyeli.',
        'Mert mindkét mágneskapcsoló ugyanazt a motort táplálja, és egyszerre soha nem húznak meg, így a motor teljes árama mindig a HK-n folyik át.',
        'Mert a frekvenciaváltó már megvédi a motort.',
        'Mert irányváltásnál nem folyik áram.',
      ],
      correct: 1,
      hintHu: 'Gondolj arra, hogy a reteszelés miatt egyszerre csak az egyik ág lehet aktív.',
      explanationHu:
        'A reteszelés miatt egyszerre csak az egyik mágneskapcsoló húzhat meg, tehát a motor árama mindig a közös motorvédőn keresztül folyik. Ezért egyetlen, helyesen beállított motorvédő mindkét forgásirányban véd. A frekvenciaváltó nem helyettesíti a motorvédőt ebben a kapcsolásban.',
    },
    {
      id: 'd6',
      titleHu: 'Vezérlőáramkör: leállítás, indítás, öntartás',
      goalHu: 'Az F2 utáni ág az S1 leállító bontó érintkezőjén halad tovább, onnan az S2 és S3 indító záró érintkezőire, mindegyik indítóval párhuzamosan a saját mágneskapcsoló 13-14 záró segédérintkezője.',
      focus: ['F2', 'S1', 'S2', 'S3', 'K1', 'K2', 'NB'],
      reasoningHu:
        'A leállító gomb bontó érintkezője közös, mindkét irány áramkörét megszakítja. Az S2 az egyik irányt, az S3 a másikat indítja, ezek nem párhuzamosak egymással, hanem külön ágban vannak. Minden ágban a saját mágneskapcsoló 13-14 záró segédérintkezője az indítógombbal párhuzamosan adja az öntartást, a tekercs A2 kapcsa pedig az NB nulla-sínre megy.',
      questionHu: 'Hogyan kell bekötni az öntartó érintkezőket ebben a kapcsolásban?',
      options: [
        'A K1 13-14 érintkezőjét az S3 gombbal párhuzamosan, a K2 13-14 érintkezőjét az S2 gombbal párhuzamosan.',
        'A K1 13-14 érintkezőjét az S2 gombbal, a K2 13-14 érintkezőjét az S3 gombbal párhuzamosan, azaz mindegyik a saját indítógombját hidalja át.',
        'Mindkét öntartó érintkezőt az S1 leállító gombbal párhuzamosan.',
        'Az öntartó érintkezőket sorosan az indítógombokkal.',
      ],
      correct: 1,
      hintHu: 'Az öntartás mindig a saját tekercs ágában, a saját indítógombot hidalja át.',
      explanationHu:
        'Minden ág a saját mágneskapcsolójának 13-14 záró érintkezőjével tartja fenn magát, a saját indítógombjával párhuzamosan. Ha felcserélnénk őket, az egyik irány indítása a másikat tartaná meg. Sorosan kötve pedig az öntartás nem tudná áthidalni a gombot, tehát elengedéskor a mágneskapcsoló visszaejtene.',
    },
    {
      id: 'd7',
      titleHu: 'Kölcsönös villamos reteszelés a 81-82 bontókkal',
      goalHu: 'A K1 tekercse a K2 81-82 bontó érintkezőjén át, a K2 tekercse a K1 81-82 bontó érintkezőjén át kap feszültséget, a reteszelő bontó az öntartó ág után, közvetlenül a tekercs előtt van.',
      focus: ['K1', 'K2', 'S2', 'S3'],
      reasoningHu:
        'Ha egyszerre húzna meg a K1 és a K2, két fázis a mágneskapcsolók főérintkezőin keresztül rövidre záródna. Ez zárlat, ezért villamosan is meg kell akadályozni. A megoldás a keresztreteszelés: mindegyik tekercs a másik mágneskapcsoló 81-82 bontó érintkezőjén át kap feszültséget. Amint az egyik meghúz, kinyitja a másik ágában lévő bontót, tehát a másik nem tud meghúzni.',
      questionHu: 'Melyik bekötés valósítja meg helyesen a kölcsönös reteszelést?',
      options: [
        'A K1 tekercse a saját 81-82 bontóján át, a K2 tekercse a saját 81-82 bontóján át.',
        'A K1 tekercse a K2 81-82 bontóján át, a K2 tekercse a K1 81-82 bontóján át.',
        'A K1 tekercse a K2 13-14 zárón át, a K2 tekercse a K1 13-14 zárón át.',
        'Mindkét tekercs a HK 13-14 segédérintkezőjén át.',
      ],
      correct: 1,
      hintHu: 'A reteszelés lényege, hogy a meghúzott mágneskapcsoló vegye el a másik tekercsének a feszültségét.',
      explanationHu:
        'A keresztbe kötött 81-82 bontók adják a reteszelést: a meghúzott K1 kinyitja a K2 tekercsének útjában lévő bontót, és fordítva. A saját bontóján át táplált tekercs önmagát kapcsolná ki, tehát rezegne. A 13-14 záróval kötött változat pedig azt jelentené, hogy egyik irány sem tud elindulni, mert mindegyik a másik meghúzására várna.',
    },
    {
      id: 'd8',
      titleHu: 'Jelzőlámpák és ellenőrzés feszültségmentes állapotban',
      goalHu: 'A Z1 a K1, a Z2 a K2 tekercsével párhuzamos, a P piros lámpa a K1 és a K2 51-52 bontó érintkezőin sorosan át kap feszültséget, majd a teljes bekötés ellenőrizve van.',
      focus: ['Z1', 'Z2', 'P', 'K1', 'K2', 'NB', 'PB'],
      reasoningHu:
        'A két zöld lámpa a két forgásirány üzemjelzése, ezért a saját tekerccsel párhuzamos. A piros lámpa az álló állapotot jelzi, ezért csak akkor világíthat, ha egyik mágneskapcsoló sem húzott meg: emiatt a K1 és a K2 51-52 bontó érintkezője sorosan van az útjában. Az ellenőrzés feszültségmentes táblán történik: rajzzal való összevetés, PE-folytonosság, kapocsszorítás, majd a reteszelés és az öntartás végigmérése folytonossággal.',
      questionHu: 'Miért sorosan kötjük a P lámpa elé a két 51-52 bontót?',
      options: [
        'Mert így csak akkor világít a piros, ha egyik mágneskapcsoló sem húzott meg, tehát a motor valóban áll.',
        'Mert a soros kötés csökkenti a lámpa feszültségét.',
        'Mert párhuzamosan kötve a lámpa tönkremenne.',
        'Mert a piros lámpának mindkét irányban világítania kell.',
      ],
      correct: 0,
      hintHu: 'Két bontó sorosan azt jelenti, hogy elég az egyiknek kinyitnia, és az áramkör megszakad.',
      explanationHu:
        'Ha akár a K1, akár a K2 meghúz, a saját 51-52 bontója kinyit, és a soros kötés miatt a piros lámpa elalszik. Ha csak az egyik bontót építenénk be, a másik irányban a piros tévesen álló állapotot jelezne. Az ellenőrzést végig feszültségmentes táblán, folytonosságméréssel végezzük.',
    },
  ],
  exam: [
    {
      id: 'dq1',
      promptHu: 'A rajz szerint mi a különbség a K1 és a K2 főáramköri bekötése között?',
      options: [
        'A K2 csak két fázist kapcsol.',
        'A K2-nél két fázis fel van cserélve: az F1 L1 kimenete az 5-ös, az L3 kimenete az 1-es kapcsára megy.',
        'A K2 a motorvédő után van a sorban.',
        'A K2 a frekvenciaváltó bemenetéről kap táplálást.',
      ],
      correct: 1,
      category: 'rajzolvasas',
      explanationHu:
        'A K2 ugyanazt a három fázist kapja, csak felcserélt kiosztásban: L1 az 5-ösre, L3 az 1-esre, a középső fázis marad a 3-ason. Ez a felcserélés adja az ellenkező forgásirányt.',
    },
    {
      id: 'dq2',
      promptHu: 'Mit jelentenek a 81-82 és az 51-52 kapocsjelölésű segédérintkezők?',
      options: [
        'Mindkettő záró (NO) érintkező.',
        'Mindkettő bontó (NC) érintkező, a különbség csak a sorszámuk.',
        'A 81-82 záró, az 51-52 bontó.',
        'A 81-82 tekercskapocs, az 51-52 főérintkező.',
      ],
      correct: 1,
      category: 'keszulekismeret',
      explanationHu:
        'A segédérintkező kapocsjelölésének második számjegye adja meg a funkciót: az 1-2 végződés bontó. Az első számjegy csak a sorszám a készüléken belül, ezért a 81-82 és az 51-52 egyaránt bontó.',
    },
    {
      id: 'dq3',
      promptHu: 'Hová kell kötni a K1 tekercs A1 kapcsa elé eső reteszelő érintkezőt?',
      options: [
        'A K1 saját 81-82 bontóját.',
        'A K2 81-82 bontóját.',
        'A K2 13-14 záróját.',
        'A HK 2T1 kapcsát.',
      ],
      correct: 1,
      category: 'bekotesi-pontossag',
      explanationHu:
        'A K1 tekercse a K2 81-82 bontóján át kap feszültséget, így a meghúzott K2 elveszi a K1 tekercsének feszültségét. A saját bontóval a mágneskapcsoló önmagát kapcsolná ki és berezegne.',
    },
    {
      id: 'dq4',
      promptHu: 'Mi történne, ha a K1 és a K2 egyszerre húzna meg?',
      options: [
        'A motor gyorsabban forogna.',
        'Két fázis a főérintkezőkön keresztül rövidre záródna, ami zárlat.',
        'A motor egyszerűen leállna, más következmény nincs.',
        'A motorvédő átkapcsolna a másik irányba.',
      ],
      correct: 1,
      category: 'mukodes-megertese',
      explanationHu:
        'A felcserélt fázisok miatt a két mágneskapcsoló egyidejű meghúzása két fázist köt össze, ez zárlat. Éppen ezt akadályozza meg a kölcsönös villamos reteszelés a keresztbe kötött 81-82 bontókkal.',
    },
    {
      id: 'dq5',
      promptHu: 'A reteszelő bontót tévedésből az öntartó ág elé, közvetlenül az S1 leállító után kötik be. Mi lesz a hatása?',
      options: [
        'Semmi, a működés azonos.',
        'Az öntartó ág megkerüli a reteszelést, ezért a már meghúzott mágneskapcsoló akkor is bent maradna, ha a másik meghúz.',
        'A motor nem indul el egyik irányba sem.',
        'A piros lámpa folyamatosan világítana.',
      ],
      correct: 1,
      category: 'biztonsagi-szemlelet',
      explanationHu:
        'A reteszelő bontónak a tekercs felé eső oldalon, az öntartó ág után kell lennie, hogy minden úton, amin a tekercs feszültséget kaphat, átfusson. Ha az öntartás megkerüli, a reteszelés hatástalanná válik, és fennmarad a kétfázisú zárlat veszélye.',
    },
    {
      id: 'dq6',
      promptHu: 'Mikor világít a P piros jelzőlámpa?',
      options: [
        'Amikor bármelyik irány jár.',
        'Csak akkor, ha sem a K1, sem a K2 nem húzott meg, mert az 51-52 bontók sorosan vannak az útjában.',
        'Csak akkor, ha a K2 húzott meg.',
        'Csak a motorvédő kioldásakor.',
      ],
      correct: 1,
      category: 'mukodes-megertese',
      explanationHu:
        'A két bontó sorosan van, ezért elég az egyik mágneskapcsolónak meghúznia, és a piros elalszik. A lámpa így pontosan az álló állapotot jelzi, a Z1 és Z2 zöld lámpa pedig a két forgásirányt.',
    },
    {
      id: 'dq7',
      promptHu: 'Melyik állítás igaz a leállító és az indító nyomógombok érintkezőire?',
      options: [
        'Az S1 leállító záró, az S2 és S3 indító bontó.',
        'Az S1 leállító bontó (kapcsok 1 és 2), az S2 és S3 indító záró (kapcsok 3 és 4).',
        'Mindhárom gomb záró érintkezőt tartalmaz.',
        'Mindhárom gomb bontó érintkezőt tartalmaz.',
      ],
      correct: 1,
      category: 'keszulekismeret',
      explanationHu:
        'A leállítás mindig bontó érintkezővel készül, hogy vezetékszakadás esetén is leálljon a berendezés, kapcsai az 1 és 2. Az indítógombok zárók, kapcsaik a 3 és 4.',
    },
    {
      id: 'dq8',
      promptHu: 'A bekötés kész, a tábla feszültségmentes. Hogyan ellenőrizzük a reteszelést?',
      options: [
        'Feszültség alá helyezzük és egyszerre nyomjuk mindkét indítógombot.',
        'Folytonossággal végigmérjük mindkét tekercsághoz vezető utat, és kézzel benyomott mágneskapcsolóval igazoljuk, hogy a másik ág megszakad.',
        'Csak szemrevételezzük, mérni nem kell.',
        'Kikötjük az egyik tekercset, hogy biztosan ne húzhasson meg.',
      ],
      correct: 1,
      category: 'ellenorzesi-sorrend',
      explanationHu:
        'A reteszelés feszültségmentes állapotban, folytonosságméréssel ellenőrizhető: a mágneskapcsoló mechanikus benyomásakor a másik ág útjában lévő 81-82 bontónak ki kell nyitnia. Feszültség alatti próbálgatás nem ellenőrzési módszer, tekercs kikötése pedig meghamisítaná a kapcsolást.',
    },
  ],
  unresolved: [
    {
      id: 'd-f1-nevleges',
      labelHu: 'Az F1 kismegszakító névleges árama és karakterisztikája - a rajzból nem határozható meg, a hiányzó paramétereket lásd a felsorolásban',
      missingHu: [
        'a motor adattábláján szereplő névleges áram',
        'a frekvenciaváltó adattáblája szerinti kimeneti áram',
        'a bekötött vezeték keresztmetszete és fektetési módja',
        'a gyártói előírás a kimeneti oldali védelemre',
      ],
      typicalExampleHu: 'Oktatási példa, nem a feladat megoldása: kisteljesítményű motornál gyakran B vagy C karakterisztikájú, néhány amperes kismegszakító szerepel.',
    },
    {
      id: 'd-f2-nevleges',
      labelHu: 'Az F2 vezérlési kismegszakító névleges árama és karakterisztikája - a rajzból nem határozható meg, a hiányzó paramétereket lásd a felsorolásban',
      missingHu: [
        'a vezérlőáramkör terhelése (két tekercs meghúzási és tartási teljesítménye, három jelzőlámpa)',
        'a vezérlővezeték keresztmetszete',
        'a vezérlési feszültségszint',
      ],
    },
    {
      id: 'd-hk-beallitas',
      labelHu: 'A HK motorvédő kapcsoló beállítási értéke - a rajzból nem határozható meg, a hiányzó paramétereket lásd a felsorolásban',
      missingHu: [
        'a motor adattábláján szereplő névleges áram',
        'a motor kapcsolási módja (csillag vagy delta)',
        'a motorvédő skálatartománya a konkrét készüléken',
        'a frekvenciaváltós üzemre vonatkozó gyártói ajánlás',
      ],
    },
    {
      id: 'd-mechanikus-reteszeles',
      labelHu: 'Van-e a K1 és K2 között mechanikus reteszelés is a villamos mellett - a rajzból nem határozható meg, a hiányzó paramétereket lásd a felsorolásban',
      missingHu: [
        'a mágneskapcsolók pontos típusjele',
        'a felszerelt tartozékok listája (mechanikus reteszelő elem rendelési száma)',
        'a tábla szerelési dokumentációja',
      ],
    },
    {
      id: 'd-iranyvaltas-holtido',
      labelHu: 'Az irányváltás előírt holtideje (várakozás a másik irány indítása előtt) - a rajzból nem határozható meg, a hiányzó paramétereket lásd a felsorolásban',
      missingHu: [
        'a hajtott gép tehetetlensége és megengedett igénybevétele',
        'a frekvenciaváltó lassítási paraméterei',
        'a mágneskapcsolók visszaejtési ideje a gyártói adatlapon',
      ],
    },
  ],
};
