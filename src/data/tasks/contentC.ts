import type { TaskContent } from '../../domain/electrical-types';

export const contentC: TaskContent = {
  objectivesHu: [
    'A vizsgázó feszültségmentes gyakorlótáblán, kapcsolási rajz alapján be tudja kötni a frekvenciaváltós háromfázisú motorindítást.',
    'Szét tudja választani a főáramkört és a vezérlőáramkört, és meg tudja mutatni, hol találkozik a kettő (K1 tekercs, HK segédérintkező).',
    'Helyesen köti a két leállító nyomógombot sorosan, a két indító nyomógombot párhuzamosan.',
    'Meg tudja valósítani az öntartást a K1 mágneskapcsoló 13-14 záró segédérintkezőjével.',
    'Be tudja kötni az üzemállapot-visszajelzést: a Z zöld lámpa a tekerccsel párhuzamosan, a P piros lámpa a K1 21-22 bontó érintkezőjén keresztül.',
    'Minden fémházas készüléket és a motort a PE-sínre (PB) köti, a nullát az N-sínre (NB).',
    'A kész bekötést feszültségmentes állapotban, szemrevételezéssel és folytonosságméréssel ellenőrzi, mielőtt bárki feszültség alá helyezné.',
  ],
  commonMistakesHu: [
    'A két leállító nyomógombot párhuzamosan kötik, így az egyik gombbal nem lehet leállítani a motort.',
    'A két indító nyomógombot sorosan kötik, ezért a motor csak akkor indul, ha mindkettőt egyszerre nyomják.',
    'Az öntartást a K1 21-22 bontó érintkezőjéről veszik a 13-14 záró helyett, ezért a mágneskapcsoló berezeg vagy azonnal visszaejt.',
    'Az öntartó érintkezőt a leállító gombok elé kötik, így a leállítás nem szakítja meg a tekercs áramkörét.',
    'A K1 tekercs A2 kapcsát nem az N-sínre kötik, hanem fázisra, így a tekercs nem kap zárt kört.',
    'A P piros lámpát is a tekerccsel párhuzamosan kötik, ezért az álló és az üzemi állapot nem különböztethető meg.',
    'A frekvenciaváltó bemenetét (L1, N) és kimenetét (T1, T2, T3) felcserélik.',
    'A motorvédő kapcsoló 13-14 segédérintkezőjét kihagyják a vezérlésből, ezért kioldás után a mágneskapcsoló meghúzva maradna.',
    'A védővezetőt csak a motorra kötik, a frekvenciaváltó házára nem.',
    'A bekötést nem ellenőrzik végig feszültségmentes állapotban, hanem egyből kapcsolni akarnak.',
  ],
  guided: [
    {
      id: 'c1',
      titleHu: 'Feszültségmentes állapot és a védővezető bekötése',
      goalHu: 'A tábla feszültségmentes, a PE-sín (PB) és minden fémházas készülék védővezetője a helyén van.',
      focus: ['SUP', 'PB', 'Q1', 'M'],
      reasoningHu:
        'A gyakorlótáblán minden munka feszültségmentes állapotban zajlik. A védővezető az első és az utolsó bekötött ér: elsőnek kötjük be, hogy a szerelés alatt is meglegyen, és utoljára bontjuk. A SUP betáplálás PE kapcsa a PB sínre megy, onnan ág visz a Q1 frekvenciaváltó PE kapcsára és a motor PE kapcsára.',
      questionHu: 'Mivel kezdjük a tábla bekötését?',
      options: [
        'Előbb a fázisvezetőket húzzuk be, a védővezetőt a végén tesszük fel, ha marad idő.',
        'Meggyőződünk a feszültségmentességről, majd a SUP PE kapcsát a PB sínre, onnan a Q1 és az M védőföldelését kötjük be.',
        'Mindegy a sorrend, mert a védővezető úgyis csak jelzés.',
        'Először a vezérlőáramkört kötjük be, mert az kisfeszültségű.',
      ],
      correct: 1,
      hintHu: 'A védővezető zöld-sárga, és a bekötés első lépése. A tábla ilyenkor feszültségmentes.',
      explanationHu:
        'Feszültségmentes állapotban dolgozunk. A PE a SUP betáplálásból a PB sínre fut, és onnan kap ágat a Q1 frekvenciaváltó fémháza és a motor PE kapcsa. A védővezetőt kötjük be elsőnek, mert ez marad meg akkor is, ha a szerelés félbeszakad.',
    },
    {
      id: 'c2',
      titleHu: 'A frekvenciaváltó betáplálása',
      goalHu: 'A SUP L1 és N kapcsa a Q1 frekvenciaváltó bemeneti kapcsaira kerül, a nulla az NB sínen keresztül.',
      focus: ['SUP', 'Q1', 'NB', 'PB'],
      reasoningHu:
        'A J-1000 típusú frekvenciaváltó bemenete egyfázisú: PE, L1 és N. A kimenete háromfázisú: T1, T2, T3. A bemenetre a betáplálás fázisa és nullája kerül, a nullát az NB sínről vezetjük, hogy a többi nullapontnak is legyen közös gyűjtője.',
      questionHu: 'Melyik kapocscsoport a Q1 frekvenciaváltó bemenete?',
      options: ['T1, T2, T3', 'L1, N és PE', '1a, 1b, 1c', 'A1 és A2'],
      correct: 1,
      hintHu: 'A frekvenciaváltó egyfázisról kap táplálást, és háromfázisú feszültséget állít elő a motornak.',
      explanationHu:
        'A bemenet a PE, L1 és N hármas, ide jön a hálózati betáplálás. A T1, T2, T3 a motor felé menő kimenet. Az 1a, 1b, 1c az F1 kismegszakító bemeneti kapcsai, az A1-A2 pedig a K1 mágneskapcsoló tekercse.',
    },
    {
      id: 'c3',
      titleHu: 'A főáramkör első szakasza: kimenet, kismegszakító, mágneskapcsoló',
      goalHu: 'A Q1 T1, T2, T3 kimenete az F1 3x1P kismegszakító 1a, 1b, 1c kapcsaira, az F1 2a, 2b, 2c kapcsa a K1 főérintkezőinek 1, 3, 5 kapcsaira megy.',
      focus: ['Q1', 'F1', 'K1'],
      reasoningHu:
        'A háromfázisú ág a frekvenciaváltó kimenetén kezdődik. Az F1 három egypólusú kismegszakítója a három fázist védi, bemenete fent (1a, 1b, 1c), kimenete lent (2a, 2b, 2c). A kismegszakító után következik a K1 mágneskapcsoló főérintkezőinek bemeneti oldala: 1, 3, 5.',
      questionHu: 'Hová kötjük az F1 kismegszakító 2a, 2b, 2c kimeneti kapcsait?',
      options: [
        'Közvetlenül a motor U1, V1, W1 kapcsaira.',
        'A K1 mágneskapcsoló 1, 3, 5 főérintkező-kapcsaira.',
        'A HK motorvédő kapcsoló T1, T2, T3 kapcsaira.',
        'Vissza a Q1 frekvenciaváltó L1 és N kapcsaira.',
      ],
      correct: 1,
      hintHu: 'A mágneskapcsoló főérintkezőinek páratlan számú kapcsai a bemenetek.',
      explanationHu:
        'A sorrend: Q1 kimenet, F1 kismegszakító, K1 főérintkezők. A K1 főérintkezőinél az 1, 3, 5 a bemenet, a 2, 4, 6 a kimenet. Ha a motorra vagy a motorvédő kimenetére kötnénk, kihagynánk egy készüléket a sorból.',
    },
    {
      id: 'c4',
      titleHu: 'A főáramkör második szakasza: motorvédő és motor',
      goalHu: 'A K1 2, 4, 6 kapcsai a HK motorvédő kapcsoló L1, L2, L3 kapcsaira, a HK T1, T2, T3 kapcsai a motor U1, V1, W1 kapcsaira kerülnek.',
      focus: ['K1', 'HK', 'M', 'PB'],
      reasoningHu:
        'A motorvédő kapcsoló a motor közvetlen közelében, a mágneskapcsoló után van a sorban, mert a motor tényleges áramát kell figyelnie. A HK bemenete az L1, L2, L3, kimenete a T1, T2, T3. Innen már csak a motor jön, aminek a PE kapcsa a PB sínre megy.',
      questionHu: 'Mi a helyes haladási irány a K1 főérintkezői után?',
      options: [
        'K1 2, 4, 6 - HK L1, L2, L3 - HK T1, T2, T3 - M U1, V1, W1',
        'K1 2, 4, 6 - M U1, V1, W1 - HK L1, L2, L3',
        'K1 1, 3, 5 - HK T1, T2, T3 - M U1, V1, W1',
        'K1 2, 4, 6 - F1 1a, 1b, 1c - M U1, V1, W1',
      ],
      correct: 0,
      hintHu: 'A motorvédő kapcsolónak a motor áramát kell mérnie, tehát közvetlenül a motor elé kerül.',
      explanationHu:
        'A főáramkör iránya: frekvenciaváltó kimenet, F1, K1 főérintkezők, HK motorvédő, motor. A motorvédőn az L1, L2, L3 a bemenet és a T1, T2, T3 a kimenet, ezt felcserélni tipikus hiba. A motor PE kapcsa mindig a PE-sínre megy.',
    },
    {
      id: 'c5',
      titleHu: 'A vezérlőáramkör betáplálása és a soros leállítók',
      goalHu: 'Az F2 vezérlési kismegszakítóról induló ág az S1 és S3 leállító nyomógomb bontó érintkezőin, valamint a HK 13-14 segédérintkezőjén keresztül halad tovább.',
      focus: ['F2', 'S1', 'S3', 'HK'],
      reasoningHu:
        'A leállító nyomógombok bontó (NC) érintkezőt tartalmaznak, kapcsaik az 1 és 2. Sorosan kötve bármelyik megnyomása megszakítja a vezérlőáramkört, tehát bármelyikkel le lehet állítani a motort. A HK motorvédő 13-14 záró segédérintkezője szintén az ágban van, így a motorvédő kioldása is elveszi a tekercs feszültségét.',
      questionHu: 'Miért kell a két leállító nyomógombot sorosan kötni?',
      options: [
        'Mert így csak akkor áll le a motor, ha mindkét gombot egyszerre nyomják.',
        'Mert a bontó érintkezők sorba kötve azt adják, hogy bármelyik gomb megnyomása megszakítja a vezérlőáramkört.',
        'Mert párhuzamosan kötve a nyomógombok tönkremennének.',
        'Mert a soros kötés csökkenti a vezérlőáramkör feszültségét.',
      ],
      correct: 1,
      hintHu: 'Gondold végig, mi történik a soros és mi a párhuzamos kötésnél, ha csak az egyik bontót nyitjuk ki.',
      explanationHu:
        'Két bontó érintkező sorosan azt jelenti, hogy elég az egyiket kinyitni, és az áramkör megszakad. Párhuzamosan kötve a másik gomb áthidalná a megnyomottat, tehát a leállítás nem működne. Ez biztonsági alapelv: a leállítás mindig bontó érintkezővel és mindig sorosan.',
    },
    {
      id: 'c6',
      titleHu: 'Párhuzamos indítógombok és az öntartás',
      goalHu: 'Az S2 és S4 indító záró érintkezői párhuzamosan, velük párhuzamosan a K1 13-14 záró segédérintkezője, majd innen a K1 tekercs A1 kapcsa, az A2 az N-sínre.',
      focus: ['S2', 'S4', 'K1', 'NB'],
      reasoningHu:
        'Az indító nyomógombok záró (NO) érintkezőt tartalmaznak, kapcsaik a 3 és 4. Párhuzamosan kötve bármelyikkel indítható a motor. A gomb elengedése után a K1 saját 13-14 záró segédérintkezője tartja fenn a tekercs áramkörét, ez az öntartás. A tekercs A2 kapcsa az NB nulla-sínre megy, különben nincs zárt kör.',
      questionHu: 'Melyik K1 érintkező adja az öntartást, és hogyan kötjük?',
      options: [
        'A 21-22 bontó érintkező, a leállító gombokkal sorosan.',
        'A 13-14 záró érintkező, az indító nyomógombokkal párhuzamosan.',
        'A 2, 4, 6 főérintkező, a tekerccsel sorosan.',
        'Az A1-A2 tekercs önmagával párhuzamosan.',
      ],
      correct: 1,
      hintHu: 'Az öntartásnak akkor kell áramot vezetnie, amikor a mágneskapcsoló már meghúzott, és a gombot elengedték.',
      explanationHu:
        'A meghúzott K1 zárja a 13-14 érintkezőjét, ez hidalja át az indítógombokat, ezért a gomb elengedése után is marad feszültség a tekercsen. Bontó érintkezővel ez nem működne, mert meghúzás után éppen kinyitna, és a mágneskapcsoló berezegne. Fontos, hogy az öntartó ág a leállítók után csatlakozzon, különben a leállítás nem szakítaná meg a kört.',
    },
    {
      id: 'c7',
      titleHu: 'Üzemállapot-visszajelzés: zöld és piros lámpa',
      goalHu: 'A Z zöld lámpa a K1 tekerccsel párhuzamosan, a P piros lámpa a K1 21-22 bontó érintkezőjén keresztül kap feszültséget, mindkettő másik pontja az N-sínre megy.',
      focus: ['Z', 'P', 'K1', 'NB'],
      reasoningHu:
        'A zöld lámpa az üzemet jelzi, ezért pontosan akkor kell világítania, amikor a tekercs feszültség alatt van: emiatt a tekerccsel párhuzamos. A piros lámpa az álló állapotot jelzi, ezért a K1 21-22 bontó érintkezőjéről kapja a feszültséget, ami csak nyugalmi helyzetben zárt. Meghúzáskor a 21-22 kinyit, a piros elalszik, a 13-14 zár, a zöld világít.',
      questionHu: 'Mi történik a két lámpával a motor indításakor?',
      options: [
        'Mindkét lámpa világít, mert közös nullán vannak.',
        'A piros elalszik, mert a K1 21-22 bontója kinyit, és a zöld felgyullad a tekerccsel párhuzamosan.',
        'A zöld elalszik, a piros felgyullad, mert a 13-14 bontó.',
        'Egyik lámpa sem változik, mert a jelzés a főáramkörről jön.',
      ],
      correct: 1,
      hintHu: 'A 21-22 bontó nyugalmi helyzetben zárt, meghúzáskor nyit. A 13-14 záró éppen fordítva viselkedik.',
      explanationHu:
        'Álló állapotban a zárt 21-22 bontón át a piros lámpa világít. Meghúzáskor a 21-22 kinyit, így a piros elalszik, a tekerccsel párhuzamos zöld pedig világítani kezd. Ha a pirosat is a tekerccsel párhuzamosan kötnénk, mindkettő egyszerre égne, és a visszajelzés értelmetlen lenne.',
    },
    {
      id: 'c8',
      titleHu: 'Ellenőrzés feszültségmentes állapotban',
      goalHu: 'A kész bekötés szemrevételezéssel, kapocsszorítás-vizsgálattal és folytonosságméréssel ellenőrizve van, még mindig feszültségmentesen.',
      focus: ['SUP', 'F1', 'F2', 'K1', 'HK', 'M', 'PB', 'NB'],
      reasoningHu:
        'Az ellenőrzés sorrendje: szemrevételezés a rajzhoz hasonlítva, a védővezető folytonossága, a kapcsok meghúzása és húzópróba, a szigetelés épsége, végül a vezérlőáramkör logikájának végigkövetése műszerrel. Feszültség alá helyezésről a vizsgán a vizsgáztató dönt, a bekötő nem tesz ilyet önállóan.',
      questionHu: 'Melyik a helyes ellenőrzési sorrend a bekötés befejezése után?',
      options: [
        'Feszültség alá helyezés, majd ha működik, szemrevételezés.',
        'Szemrevételezés a rajz alapján, PE-folytonosság, kapocsszorítás és húzópróba, majd folytonosságmérés az áramkörökön, mindvégig feszültségmentesen.',
        'Csak a nyomógombokat próbáljuk ki, a többi látszik.',
        'Elég megmérni a motor ellenállását, a vezérlést nem kell nézni.',
      ],
      correct: 1,
      hintHu: 'Minden mérés feszültségmentes táblán történik, és a védővezető ellenőrzése előrébb van, mint bármi más.',
      explanationHu:
        'Először a rajzzal vetjük össze a bekötést, utána a védővezető folytonosságát mérjük, majd minden kapcsot meghúzunk és húzópróbával ellenőrzünk. Ezt követi az áramkörök folytonosságmérése, például a leállítók soros és az indítók párhuzamos kötésének igazolása. A tábla ezalatt végig feszültségmentes.',
    },
  ],
  exam: [
    {
      id: 'cq1',
      promptHu: 'A rajz szerint hol helyezkedik el a HK motorvédő kapcsoló a főáramkörben?',
      options: [
        'A frekvenciaváltó bemenete előtt.',
        'A K1 mágneskapcsoló főérintkezői után, közvetlenül a motor előtt.',
        'Az F1 kismegszakító és a frekvenciaváltó között.',
        'A vezérlőáramkörben, az F2 után.',
      ],
      correct: 1,
      category: 'rajzolvasas',
      explanationHu:
        'A főáramkör sorrendje: Q1 kimenet, F1, K1 főérintkezők, HK, motor. A motorvédő azért van közvetlenül a motor előtt, hogy a motor tényleges áramát figyelje.',
    },
    {
      id: 'cq2',
      promptHu: 'Melyik állítás igaz a mágneskapcsoló 13-14 és 21-22 segédérintkezőire?',
      options: [
        'Mindkettő záró, csak eltérő terhelhetőségű.',
        'A 13-14 záró (NO), a 21-22 bontó (NC).',
        'A 13-14 bontó (NC), a 21-22 záró (NO).',
        'Mindkettő bontó, a különbség csak a kapocsjelölés.',
      ],
      correct: 1,
      category: 'keszulekismeret',
      explanationHu:
        'A segédérintkezők kapocsjelölésének második számjegye árulkodik: a 3-4 végződés zárót, az 1-2 végződés bontót jelent. Ezért a 13-14 záró, a 21-22 bontó.',
    },
    {
      id: 'cq3',
      promptHu: 'Hová kell kötni a K1 tekercs A2 kapcsát?',
      options: ['Az NB nulla-sínre.', 'A PB védőföld-sínre.', 'Az F1 kismegszakító 2a kapcsára.', 'A motor W1 kapcsára.'],
      correct: 0,
      category: 'bekotesi-pontossag',
      explanationHu:
        'A tekercs egyik oldala a vezérlőáramkör fázisáról kap feszültséget a leállítókon és az indítókon át, a másik oldalának (A2) a nullára kell mennie, hogy zárt kör legyen. A PE soha nem használható üzemi áramút részeként.',
    },
    {
      id: 'cq4',
      promptHu: 'Mi történik, ha az indító nyomógombokat sorosan kötik be a párhuzamos helyett?',
      options: [
        'Semmi, a működés azonos.',
        'A motor csak akkor indul, ha mindkét gombot egyszerre nyomják.',
        'A motor önmagától elindul, amint az F2 bekapcsol.',
        'A mágneskapcsoló tekercse zárlatot kap.',
      ],
      correct: 1,
      category: 'mukodes-megertese',
      explanationHu:
        'Két záró érintkező sorosan csak akkor vezet, ha mindkettő zárt, tehát kétkezes indítás lenne belőle. A feladat kiírása szerint bármelyik gombbal indíthatónak kell lennie, ezért párhuzamos kötés kell.',
    },
    {
      id: 'cq5',
      promptHu: 'Az öntartó érintkezőt a leállító gombok elé kötik, azaz közvetlenül az F2 utáni pontra. Mi lesz a következmény?',
      options: [
        'A motor a leállító gombokkal nem állítható le, mert az öntartás áthidalja azokat.',
        'A motor nem indul el.',
        'A zöld lámpa nem világít.',
        'A motorvédő azonnal kiold.',
      ],
      correct: 0,
      category: 'biztonsagi-szemlelet',
      explanationHu:
        'Ha az öntartó ág a leállítók előttről kap feszültséget, akkor a leállítók nyitása nem szakítja meg a tekercs áramkörét. Ez súlyos biztonsági hiba, mert a berendezés nem állítható le a kezelőszervekkel.',
    },
    {
      id: 'cq6',
      promptHu: 'Mikor világít a P piros jelzőlámpa?',
      options: [
        'Amikor a motor jár, mert a K1 13-14 zárva van.',
        'Amikor a motor áll, mert a K1 21-22 bontó nyugalmi helyzetben zárt.',
        'Folyamatosan, amíg az F2 be van kapcsolva.',
        'Csak a motorvédő kioldásakor.',
      ],
      correct: 1,
      category: 'mukodes-megertese',
      explanationHu:
        'A piros lámpa a K1 21-22 bontó érintkezőjén át kap feszültséget. Ez nyugalmi helyzetben zárt, meghúzáskor nyit, ezért a lámpa pontosan álló állapotban világít.',
    },
    {
      id: 'cq7',
      promptHu: 'Melyik lépéssel kezdődik és melyikkel zárul a védővezető kezelése a szerelés során?',
      options: [
        'Utoljára kötjük be és elsőnek bontjuk.',
        'Elsőnek kötjük be és utoljára bontjuk.',
        'Nincs jelentősége a sorrendnek.',
        'Csak akkor kötjük be, ha a motor fémházas.',
      ],
      correct: 1,
      category: 'biztonsagi-szemlelet',
      explanationHu:
        'A védővezető az első bekötött és az utolsó bontott ér, hogy a szerelés minden szakaszában meglegyen a védelem. A tábla ettől függetlenül végig feszültségmentes marad.',
    },
    {
      id: 'cq8',
      promptHu: 'A bekötés kész. Mi a helyes első lépés az ellenőrzésben?',
      options: [
        'A tábla feszültség alá helyezése és próbaindítás.',
        'A bekötés összevetése a kapcsolási rajzzal, még feszültségmentes állapotban.',
        'A motorvédő kapcsoló skálájának átállítása.',
        'A jelzőlámpák cseréje próbaizzóra.',
      ],
      correct: 1,
      category: 'ellenorzesi-sorrend',
      explanationHu:
        'Az ellenőrzés mindig a rajzzal való összevetéssel indul feszültségmentes állapotban, ezt követi a védővezető folytonossága, a kapocsszorítás és a folytonosságmérés. Feszültség alá helyezés csak a vizsgáztató utasítására, minden ellenőrzés után jöhet szóba.',
    },
  ],
  unresolved: [
    {
      id: 'c-f1-nevleges',
      labelHu: 'Az F1 kismegszakító névleges árama és karakterisztikája - a rajzból nem határozható meg, a hiányzó paramétereket lásd a felsorolásban',
      missingHu: [
        'a motor adattábláján szereplő névleges áram',
        'a frekvenciaváltó adattáblája szerinti kimeneti áram',
        'a bekötött vezeték keresztmetszete és fektetési módja',
        'a frekvenciaváltó gyártójának előírása a kimeneti oldali védelemre',
      ],
      typicalExampleHu: 'Oktatási példa, nem a feladat megoldása: kisteljesítményű motornál gyakran B vagy C karakterisztikájú, néhány amperes kismegszakító szerepel.',
    },
    {
      id: 'c-f2-nevleges',
      labelHu: 'Az F2 vezérlési kismegszakító névleges árama és karakterisztikája - a rajzból nem határozható meg, a hiányzó paramétereket lásd a felsorolásban',
      missingHu: [
        'a vezérlőáramkör tervezett terhelése (tekercs meghúzási és tartási teljesítménye, jelzőlámpák)',
        'a vezérlővezeték keresztmetszete',
        'a vezérlési feszültségszint',
      ],
    },
    {
      id: 'c-hk-beallitas',
      labelHu: 'A HK motorvédő kapcsoló pontos beállítási értéke a 0,8-1,2 A skálán - a rajzból nem határozható meg, a hiányzó paramétereket lásd a felsorolásban',
      missingHu: [
        'a motor adattábláján szereplő névleges áram',
        'a motor kapcsolási módja (csillag vagy delta)',
        'a frekvenciaváltós üzemre vonatkozó gyártói ajánlás',
      ],
    },
    {
      id: 'c-fc-parameter',
      labelHu: 'A Q1 frekvenciaváltó paraméterezése (kimeneti frekvencia, gyorsítási és lassítási idő) - a rajzból nem határozható meg, a hiányzó paramétereket lásd a felsorolásban',
      missingHu: [
        'a J-1000 típus kezelési kézikönyve és paraméterlistája',
        'a motor adattáblája (feszültség, frekvencia, fordulatszám)',
        'a hajtott gép által megkívánt indítási jelleg',
      ],
    },
  ],
};
