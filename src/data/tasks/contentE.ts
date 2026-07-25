import type { TaskContent } from '../../domain/electrical-types';

export const contentE: TaskContent = {
  objectivesHu: [
    'Egyfázisú motor mágneskapcsolós indítása: a főáramkör és a vezérlőáramkör tudatos szétválasztása.',
    'Az öntartás felépítése a K1 mágneskapcsoló 13-14 záró segédérintkezőjével.',
    'Az egypólusú motorvédő kapcsoló helye a főáramkörben, és a 13-14 segédérintkezőjének szerepe a vezérlésben.',
    'A nullavezető helyes kezelése: a motor U2 kapcsa és a vezérlés visszatérő ága közvetlenül az N-sínre megy.',
    'Üzemállapot-visszajelzés kialakítása zöld és piros lámpával.',
    'A feszültségmentes ellenőrzés sorrendjének begyakorlása a bekötés befejezése után.',
  ],
  commonMistakesHu: [
    'Az S1 leállítót záró, az S2 indítót bontó érintkezővel kötik be; a leállítónak bontó (NC), az indítónak záró (NO) érintkezővel kell szerepelnie.',
    'Az öntartó érintkezőt a leállító gomb elé kötik, így az S1 megnyomása nem szakítja meg a tekercs áramkörét.',
    'A K1 13-14 öntartó érintkezőt az indítóval sorba kötik párhuzamos helyett, ezért öntartás helyett semmi nem történik.',
    'A motor U2 kapcsát a mágneskapcsolón vagy a motorvédőn keresztül vezetik vissza, pedig az közvetlenül az N-sínre megy.',
    'A K1 tekercs A2 kapcsát fázisra kötik nulla helyett, így a tekercs a leállító után is feszültség alatt maradna.',
    'A HK motorvédő 13-14 segédérintkezőjét kihagyják a vezérlésből, ezért kioldás után a mágneskapcsoló húzva maradna.',
    'A védőföldet nem külön vezetővel viszik a PE-sínre, hanem a fém szerelőlaptól várják a folytonosságot.',
    'Feszültség alatt kezdenek szerelni vagy hibát keresni; a vizsgatábla kizárólag feszültségmentes állapotban köthető be.',
  ],
  guided: [
    {
      id: 'e-s1',
      titleHu: 'Betáplálás, védelem és a sínek',
      goalHu: 'A SUP betáplálás három erét a helyére vinni: a fázist a főáramkör kismegszakítójára, a nullát az N-sínre, a védőföldet a PE-sínre.',
      focus: ['SUP', 'F1', 'NB', 'PB'],
      reasoningHu:
        'Minden bekötés a betáplálásnál kezdődik, mert innen kapja a feszültséget a teljes tábla. A SUP L1 kapcsa az F1 kismegszakító bemenetére megy, mert a főáramkört ez a készülék védi zárlat és túlterhelés ellen. A nullavezető nem kap túláramvédelmet, ezért a SUP N közvetlenül az NB N-sínre kerül, ahonnan a fogyasztók visszatérő ága táplálkozik. A védőföld sehol nincs kapcsolva vagy megszakítva: a SUP PE egyenesen a PB PE-sínre megy.',
      questionHu: 'Hova kell kötni a betáplálás nullavezetőjét ezen a táblán?',
      options: [
        'Az F1 kismegszakító bemenetére, hogy a nulla is védve legyen',
        'Közvetlenül az NB N-sínre, kismegszakító nélkül',
        'A K1 mágneskapcsoló egyik főérintkezőjére',
        'A PB PE-sínre, mert a nulla és a védőföld azonos szerepű',
      ],
      correct: 1,
      hintHu: 'Gondolj arra, mely vezetőt tilos megszakítani vagy túláramvédelemmel ellátni egy ilyen egyfázisú fogyasztói körben.',
      explanationHu:
        'A nulla az N-sínre megy közvetlenül. Az egypólusú kismegszakító csak a fázist szakítja meg, a nulla folytonos marad. A PE-t pedig soha nem szabad a nullával közös sínre kötni ezen a táblán, mert a védőföld külön, sosem kapcsolt vezető.',
    },
    {
      id: 'e-s2',
      titleHu: 'Főáramkör: a kismegszakítótól a mágneskapcsolóig',
      goalHu: 'Az F1 kimenetét a K1 mágneskapcsoló főérintkezőjének bemenetére kötni.',
      focus: ['F1', 'K1'],
      reasoningHu:
        'A védelem mindig a kapcsolókészülék előtt van, mert a zárlati áramot a lehető legközelebb kell megfogni a betápláláshoz. Az F1 kimenetéről a fázis a K1 mágneskapcsoló 1-es főérintkező kapcsára megy. Egyfázisú motorról van szó, ezért a K1-ből csak az egyik főérintkező-pár, az 1-2 kerül használatba, a többi kapcsot üresen hagyjuk.',
      questionHu: 'Miért az F1 kismegszakító után következik a K1 mágneskapcsoló, és nem fordítva?',
      options: [
        'Mert a mágneskapcsoló tekercse csak védett hálózatról működik',
        'Mert a mágneskapcsoló így kevesebb áramot kapcsol',
        'Mert a túláramvédelemnek a kapcsolókészülék előtt kell lennie, hogy zárlat esetén az egész ágat lekapcsolja',
        'Mert a rajzon így néz ki jobban, a sorrend szabadon választható',
      ],
      correct: 2,
      hintHu: 'Kérdezd meg magadtól: zárlat esetén mit kell lekapcsolnia a védelemnek?',
      explanationHu:
        'A kismegszakító a betáplálás felőli oldalon van, így zárlat vagy túlterhelés esetén a mágneskapcsolóval együtt a teljes utána következő ágat feszültségmentesíti. Fordított sorrendben a mágneskapcsoló nyitott állapotában a védelem használhatatlan lenne.',
    },
    {
      id: 'e-s3',
      titleHu: 'Főáramkör: mágneskapcsolótól a motorvédőn át a motorig',
      goalHu: 'A K1 2-es kapcsát a HK motorvédő L1 bemenetére, a HK T1 kimenetét a motor U1 kapcsára kötni.',
      focus: ['K1', 'HK', 'M'],
      reasoningHu:
        'A motorvédő kapcsoló a motor túlterhelését figyeli, ezért a motorral sorba, közvetlenül elé kerül. Itt egypólusú motorvédőről van szó, tehát csak az L1-T1 pólusa van a főáramkörben. A K1 2-es kapcsáról a fázis a HK L1 bemenetére megy, a HK T1 kimenete pedig a motor U1 kapcsára. Így a motor akkor kap fázist, ha a kismegszakító be van kapcsolva, a mágneskapcsoló húz, és a motorvédő sem oldott ki.',
      questionHu: 'Mi a HK motorvédő kapcsoló feladata a főáramkörben?',
      options: [
        'A motor tartós túlterhelésének érzékelése és a főáram megszakítása',
        'A motor fordulatszámának szabályozása',
        'Az érintésvédelmi hiba, azaz a hibaáram érzékelése',
        'A motor forgásirányának megfordítása',
      ],
      correct: 0,
      hintHu: 'A készülék nevében benne van, mit véd, és milyen jellegű hiba ellen.',
      explanationHu:
        'A motorvédő kapcsoló a beállított névleges áramot meghaladó tartós terhelést érzékeli, és megszakítja a motor áramkörét. Fordulatszámot nem szabályoz, hibaáramot nem érzékel, azt a Fi-relé teszi.',
    },
    {
      id: 'e-s4',
      titleHu: 'A motor visszatérő ága és a védőföld',
      goalHu: 'A motor U2 kapcsát az NB N-sínre, a motor PE kapcsát a PB PE-sínre kötni.',
      focus: ['M', 'NB', 'PB'],
      reasoningHu:
        'Az egyfázisú motor a fázis és a nulla közé kapcsolódik. Az U1 kapja a kapcsolt fázist, az U2 pedig közvetlenül az N-sínre megy: a nullát sem a mágneskapcsoló, sem a motorvédő nem szakítja meg ebben a feladatban. A motor fém háza védőföldet kap, ezért a PE kapocs külön zöld-sárga vezetővel a PB PE-sínre kerül. A védőföld sehol nincs kapcsolva, és semmilyen üzemi áramot nem visz.',
      questionHu: 'Hova kell kötni az egyfázisú motor U2 kapcsát?',
      options: [
        'A K1 mágneskapcsoló szabadon maradt főérintkezőjére',
        'A HK motorvédő T1 kimenetére',
        'Közvetlenül az NB N-sínre',
        'A PB PE-sínre, mert a motor háza is oda megy',
      ],
      correct: 2,
      hintHu: 'A motor a fázis és a nulla között üzemel; melyik sín adja a visszatérő ágat?',
      explanationHu:
        'Az U2 az NB N-sínre megy. Ha a nullát a PE-sínre kötnénk, a védővezetőn üzemi áram folyna, ami súlyos érintésvédelmi hiba. Ha kapcsolókészüléken vezetnénk át, az felesleges hibalehetőség lenne ebben a kapcsolásban.',
    },
    {
      id: 'e-s5',
      titleHu: 'A vezérlőáramkör táplálása és a motorvédő segédérintkezője',
      goalHu: 'Az F2 vezérlési kismegszakítót a fázisra kötni, kimenetét a HK 13 kapcsára, a HK 14 kapcsát pedig az S1 leállító 1-es kapcsára vezetni.',
      focus: ['F2', 'HK', 'S1'],
      reasoningHu:
        'A vezérlőáramkör saját kismegszakítót kap, hogy a főáramkörtől függetlenül védhető és feszültségmentesíthető legyen. Az F2 kimenetéről a fázis először a HK motorvédő 13-14 záró segédérintkezőjén megy át. Ez a lényeg: ha a motorvédő kiold, a 13-14 nyit, a vezérlés áramtalan lesz, és a mágneskapcsoló biztosan elenged. Innen halad tovább a fázis az S1 leállító nyomógomb 1-es kapcsára.',
      questionHu: 'Mi történik a vezérlőáramkörrel, ha a HK motorvédő kiold?',
      options: [
        'Semmi, a vezérlés a motorvédőtől függetlenül tovább működik',
        'A 13-14 záró segédérintkező nyit, a K1 tekercse áramtalan lesz, a mágneskapcsoló elenged',
        'A 13-14 érintkező zár, ezért a mágneskapcsoló behúz',
        'A vezérlés zárlatba kerül, és az F2 kismegszakító old ki',
      ],
      correct: 1,
      hintHu: 'A 13-14 záró érintkező alaphelyzetben nyitott, és a motorvédő bekapcsolt állapotában zár.',
      explanationHu:
        'A 13-14 záró segédérintkező a motorvédő bekapcsolt állapotát adja tovább a vezérlésnek. Kioldáskor nyit, így a tekercs kikapcsol, a K1 elenged, és a motor leáll. Az újraindításhoz a motorvédőt vissza kell kapcsolni, majd az indítógombot megnyomni.',
    },
    {
      id: 'e-s6',
      titleHu: 'Leállítás, indítás és az öntartás',
      goalHu: 'Az S1 bontó után az S2 záró gombot és vele párhuzamosan a K1 13-14 öntartó érintkezőt bekötni, majd a tekercs A1 kapcsára menni.',
      focus: ['S1', 'S2', 'K1'],
      reasoningHu:
        'A leállító gomb bontó (NC) érintkezővel, sorosan kerül a körbe, mert megnyomva meg kell szakítania a tekercs áramkörét. Az indító gomb záró (NO) érintkezővel csak addig ad utat, amíg nyomva tartják, ezért kell mellé az öntartás. Az S1 2-es kapcsáról tehát egyszerre megyünk az S2 3-as kapcsára és a K1 13-as segédkapcsára, az S2 4-es és a K1 14-es kapcsát pedig összekötve visszük a K1 tekercs A1 kapcsára. A tekercs A2 kapcsa az NB N-sínre megy.',
      questionHu: 'Hova kell kötni a K1 13-14 záró segédérintkezőt, hogy öntartást adjon?',
      options: [
        'Az S2 indító nyomógombbal párhuzamosan',
        'Az S1 leállító nyomógombbal párhuzamosan',
        'Az S2 indító nyomógombbal sorba',
        'A K1 tekerccsel sorba, az A2 kapocs után',
      ],
      correct: 0,
      hintHu: 'Az öntartásnak azt a nyomógombot kell kiváltania, amelyet elengedve megszakadna az áramkör.',
      explanationHu:
        'Az öntartó érintkező az indítógombbal párhuzamos, így behúzás után az S2 elengedhető: az áram a 13-14 érintkezőn keresztül folyik tovább. Az S1 leállítóval párhuzamosan kötve az öntartás áthidalná a leállítót, és a motort nem lehetne megállítani. Az indítóval sorba kötve pedig soha nem húzna be a mágneskapcsoló.',
    },
    {
      id: 'e-s7',
      titleHu: 'Üzemállapot-visszajelzés: zöld és piros lámpa',
      goalHu: 'A Z zöld lámpát a K1 tekerccsel párhuzamosan, a P piros lámpát a K1 21-22 bontó segédérintkezőjén keresztül bekötni, mindkettő visszatérő ágát az N-sínre vinni.',
      focus: ['Z', 'P', 'K1', 'NB'],
      reasoningHu:
        'A zöld lámpa a járó állapotot jelzi, ezért a tekercs A1 pontjáról kap fázist, azaz a tekerccsel párhuzamosan világít, amikor a mágneskapcsoló húz. A piros lámpa az alaphelyzetet jelzi: fázist a vezérlés táppontjáról, a HK 14 kapcsa felől kap, a K1 21-22 bontó segédérintkezőn keresztül. Amíg a mágneskapcsoló nincs behúzva, a 21-22 zárva van, tehát a piros lámpa ég. Behúzáskor a 21-22 nyit, a piros elalszik, és a zöld gyullad ki. Mindkét lámpa második kapcsa az NB N-sínre megy.',
      questionHu: 'Mikor világít a P piros lámpa ebben a kapcsolásban?',
      options: [
        'Akkor, amikor a motor jár, mert a piros a veszélyt jelzi',
        'Akkor, amikor a K1 nincs behúzva, mert a 21-22 bontó érintkező ilyenkor zárt',
        'Csak akkor, ha a motorvédő kioldott',
        'Folyamatosan, amíg a tábla feszültség alatt van',
      ],
      correct: 1,
      hintHu: 'Nézd meg, mi a bontó (NC) segédérintkező alaphelyzete elengedett mágneskapcsolónál.',
      explanationHu:
        'A bontó segédérintkező elengedett mágneskapcsolónál zárt, ezért a piros lámpa az álló, alaphelyzetű állapotot jelzi. Behúzáskor a 21-22 nyit, a piros kialszik, és a tekerccsel párhuzamos zöld lámpa mutatja az üzemet.',
    },
    {
      id: 'e-s8',
      titleHu: 'Ellenőrzés feszültségmentes állapotban',
      goalHu: 'A kész bekötést szemrevételezéssel és méréssel ellenőrizni, még mielőtt bárki feszültséget adna a táblára.',
      focus: ['SUP', 'F1', 'F2', 'K1', 'HK', 'M', 'PB', 'NB'],
      reasoningHu:
        'A bekötés akkor kész, ha ellenőrizve is van. A sorrend: szemrevételezés a rajz alapján, a kapocsszorítások megnézése, a vezetékszínek ellenőrzése, majd feszültségmentes állapotban folytonosságmérés. Ellenőrizni kell a PE folytonosságát a PE-sín és a motor háza között, hogy a fázis és a nulla között nincs zárlat, és hogy a vezérlőkör a nyomógombok működtetésével a várt módon zár és bont. Feszültséget csak az oktató jelenlétében, engedéllyel szabad adni. Feszültség alatti szerelés vagy hibakeresés ezen a táblán nem megengedett.',
      questionHu: 'Mi a helyes sorrend a bekötés befejezése után?',
      options: [
        'Azonnal feszültség alá helyezés, hiba esetén majd javítunk',
        'Szemrevételezés, majd feszültségmentes folytonosság- és PE-ellenőrzés, és csak ezután, engedéllyel próba',
        'Először próba a nyomógombokkal feszültség alatt, majd szemrevételezés',
        'Elég a rajzot még egyszer átnézni, mérés nem szükséges',
      ],
      correct: 1,
      hintHu: 'A mérés mindig megelőzi a feszültség alá helyezést.',
      explanationHu:
        'Először szemrevételezünk, majd feszültségmentes állapotban mérünk folytonosságot, ellenőrizzük a védővezető folytonosságát és a zárlatmentességet. Feszültség alá helyezés csak ezután, felügyelet mellett történhet. Ez a sorrend védi a személyeket és a készülékeket is.',
    },
  ],
  exam: [
    {
      id: 'e-q1',
      promptHu: 'A rajzon az S1 nyomógomb kapcsai 1-2 jelölésűek, az S2 gombé 3-4. Mit jelent ez a jelölés?',
      options: [
        'Az S1 bontó (NC) érintkezős leállító, az S2 záró (NO) érintkezős indító',
        'Az S1 záró (NO) érintkezős indító, az S2 bontó (NC) érintkezős leállító',
        'Mindkettő váltóérintkezős gomb',
        'A számozás csak sorszám, az érintkező típusáról nem árul el semmit',
      ],
      correct: 0,
      category: 'rajzolvasas',
      explanationHu:
        'A szabvány szerinti kapocsjelölésben az 1-2 bontó, a 3-4 záró érintkező. Ezért az S1 a leállító, az S2 az indító nyomógomb.',
    },
    {
      id: 'e-q2',
      promptHu: 'Mi a K1 mágneskapcsoló A1 és A2 kapcsainak szerepe?',
      options: [
        'A főáramkör be- és kimenete',
        'A működtető tekercs két csatlakozója',
        'A záró segédérintkező kapcsai',
        'A motorvédő beállító kapcsai',
      ],
      correct: 1,
      category: 'keszulekismeret',
      explanationHu:
        'Az A1 és A2 a mágneskapcsoló működtető tekercsének csatlakozói. Ha a tekercs feszültséget kap, a készülék behúz, és a fő- és segédérintkezők együtt váltanak.',
    },
    {
      id: 'e-q3',
      promptHu: 'A vezérlőáramkörben hova kerül a K1 tekercs A2 kapcsa?',
      options: [
        'Az F2 kismegszakító kimenetére',
        'A HK motorvédő 13-as kapcsára',
        'Az NB N-sínre',
        'A PB PE-sínre',
      ],
      correct: 2,
      category: 'bekotesi-pontossag',
      explanationHu:
        'A tekercs egyik oldala a kapcsolt fázist kapja az A1 kapcson, a másik oldal, az A2 közvetlenül az N-sínre megy. Ha az A2 fázison lenne, a leállító gomb nem tudná feszültségmentesíteni a tekercset.',
    },
    {
      id: 'e-q4',
      promptHu: 'Mi történik, ha az öntartó érintkezőt kihagyjuk a vezérlésből?',
      options: [
        'A motor be sem indul',
        'A motor csak addig jár, amíg az indítógombot nyomva tartják',
        'A motor indítás után nem állítható le',
        'A motorvédő azonnal kiold',
      ],
      correct: 1,
      category: 'mukodes-megertese',
      explanationHu:
        'Öntartás nélkül az áramkör csak a záró nyomógombon keresztül zárt, tehát a gomb elengedésekor a tekercs áramtalan lesz. Ez a nyomvatartásos, azaz léptető üzem, nem a kívánt öntartó indítás.',
    },
    {
      id: 'e-q5',
      promptHu: 'A motor üzem közben túlterhelődik, és a HK motorvédő kiold. Mi történik, és hogyan indul újra?',
      options: [
        'A motor leáll, és a hiba megszűnése után magától újraindul',
        'A motor tovább jár, csak a jelzőlámpa vált',
        'A motor leáll, a K1 elenged, és az újraindításhoz a motorvédőt vissza kell kapcsolni, majd az indítógombot megnyomni',
        'A motor leáll, és csak az F1 kismegszakító visszakapcsolásával indul újra',
      ],
      correct: 2,
      category: 'mukodes-megertese',
      explanationHu:
        'Kioldáskor a főáramkör megszakad, és a 13-14 segédérintkező nyitása miatt az öntartás is megszűnik. Ezért nincs önindulás: a kezelőnek vissza kell kapcsolnia a motorvédőt, és újra kell indítania a gombbal.',
    },
    {
      id: 'e-q6',
      promptHu: 'Melyik állítás igaz a védőföldre ezen a táblán?',
      options: [
        'A PE a motorvédőn keresztül megy a motorhoz',
        'A PE külön, sehol nem kapcsolt vezető, a PB PE-sínről megy a motor házához',
        'A PE és az N ugyanarra a sínre köthető',
        'A PE a mágneskapcsoló szabad főérintkezőjén megy át',
      ],
      correct: 1,
      category: 'biztonsagi-szemlelet',
      explanationHu:
        'A védővezető soha nincs kapcsolva, megszakítva vagy terhelve. A PB PE-sínről folytonos zöld-sárga vezetővel megy a motor PE kapcsára.',
    },
    {
      id: 'e-q7',
      promptHu: 'A bekötés kész. Mi az elvégzendő lépések helyes sorrendje?',
      options: [
        'Feszültség alá helyezés, próba, majd szemrevételezés',
        'Szemrevételezés, feszültségmentes folytonosság- és PE-ellenőrzés, majd engedéllyel próba',
        'Folytonosságmérés feszültség alatt, majd szemrevételezés',
        'Csak a rajz átnézése, mérés nélkül',
      ],
      correct: 1,
      category: 'ellenorzesi-sorrend',
      explanationHu:
        'A vizsgatábla feszültségmentes állapotban kerül bekötésre és ellenőrzésre. A mérések mindig megelőzik a feszültség alá helyezést, amely csak felügyelet mellett történhet.',
    },
    {
      id: 'e-q8',
      promptHu: 'Miért kap a vezérlőáramkör külön kismegszakítót (F2) a főáramköri F1 mellé?',
      options: [
        'Mert a vezérlés nagyobb áramot vesz fel, mint a motor',
        'Mert így a vezérlés a főáramkörtől függetlenül védhető és feszültségmentesíthető, a vezérlőkör hibája pedig nem oldja ki a főáramkört',
        'Mert a mágneskapcsoló tekercse csak két kismegszakítóval működik',
        'Mert a szabvány szerint minden nyomógombhoz külön kismegszakító tartozik',
      ],
      correct: 1,
      category: 'keszulekismeret',
      explanationHu:
        'A vezérlés kis áramú, vékonyabb keresztmetszetű vezetékekkel épül, ezért saját, kisebb védelmet kap. Így a vezérlőkör hibája elkülöníthető, és a vezérlés a motorágtól függetlenül feszültségmentesíthető.',
    },
  ],
  unresolved: [
    {
      id: 'e-u1',
      labelHu: 'Az F1 főáramköri kismegszakító névleges árama és jelleggörbéje - a rajzból nem következik, a hiányzó paramétereket lásd a missingHu listában.',
      missingHu: [
        'A motor adattábláján szereplő névleges áram és teljesítmény',
        'A motor indítási árama és a kívánt jelleggörbe (B vagy C)',
        'A főáramköri vezeték keresztmetszete és fektetési módja',
        'A tervezői vagy vizsgafeladat-kiírásban megadott érték',
      ],
    },
    {
      id: 'e-u2',
      labelHu: 'A HK motorvédő kapcsoló beállítási árama - a rajzból nem következik, a hiányzó paramétereket lásd a missingHu listában.',
      missingHu: [
        'A motor adattábláján szereplő névleges áram',
        'A motor üzemi terhelése és bekapcsolási ideje',
        'A motorvédő beállítási tartománya a készülék adattábláján',
      ],
    },
    {
      id: 'e-u3',
      labelHu: 'Az F2 vezérlési kismegszakító névleges árama - a rajzból nem következik, a hiányzó paramétereket lásd a missingHu listában.',
      missingHu: [
        'A mágneskapcsoló tekercsének behúzási és tartási teljesítménye',
        'A jelzőlámpák felvett teljesítménye',
        'A vezérlővezeték keresztmetszete',
      ],
    },
  ],
};
