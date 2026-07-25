import type { TaskContent } from '../../domain/electrical-types';

export const contentG: TaskContent = {
  objectivesHu: [
    'Az egyfázisú mérőhely energiaútjának felépítése: hálózat, főbiztosító, fogyasztásmérő, főkismegszakító, Fi-relé, fogyasztói áramkörök.',
    'A közvetlen mérésű egyfázisú fogyasztásmérő kapcsainak helyes értelmezése: a fázis és a nulla is átmegy a mérőn.',
    'A mérő előtti (NB0) és a Fi utáni (NB) N-sín tudatos szétválasztása.',
    'A 2 pólusú Fi-relé bekötése úgy, hogy a fázis és a nulla is a védelmen keresztül jusson a fogyasztókhoz.',
    'A dugalj és a lámpa áramkörének külön kismegszakítós kialakítása.',
    'A védőföld folytonos, sehol nem kapcsolt és nem mért vezetőként kezelése.',
    'A kész mérőhely ellenőrzése feszültségmentes állapotban, helyes sorrendben.',
  ],
  commonMistakesHu: [
    'A fogyasztói nullát a mérő előtti NB0 sínről viszik el, ezért a Fi-relé kiold vagy nem véd.',
    'A nullát nem vezetik át a fogyasztásmérőn, hanem a betáplálásról közvetlenül a Fi-relére vagy a fogyasztói sínre kötik.',
    'A mérő be- és kimeneti kapcsait felcserélik: a hálózati fázist a 3-as kapocsra kötik az 1-es helyett.',
    'A nullát a FM főkismegszakítón próbálják átvezetni, pedig az egypólusú, tehát csak a fázist kapcsolja.',
    'A védőföldet átvezetik a mérőn vagy a Fi-relén, pedig a PE sehol nincs kapcsolva és nem megy át a mérőn.',
    'Az N-sínt és a PE-sínt összekötik a fogyasztói oldalon, ami a Fi-relé működését tönkreteszi.',
    'A lámpa nulla oldalát kapcsolják a fázis helyett, így a lámpafoglalat kikapcsolt állapotban is feszültség alatt marad.',
    'Feszültség alatt kezdenek szerelni vagy hibát keresni; a vizsgatábla csak feszültségmentesen köthető be.',
  ],
  guided: [
    {
      id: 'g-s1',
      titleHu: 'Betáplálás, főbiztosító és a sínek',
      goalHu: 'A SUP L1 kapcsát az F0 főbiztosító bemenetére, a nullát az NB0 mérő előtti N-sínre, a védőföldet a PB PE-sínre kötni.',
      focus: ['SUP', 'F0', 'NB0', 'PB'],
      reasoningHu:
        'Az egyfázisú mérőhely is a betáplálással kezdődik. A fázis az F0 főbiztosító bemenetére megy, mert a mérő elé túláramvédelem kell. A nulla nem kap túláramvédelmet, ezért közvetlenül az NB0 mérő előtti N-sínre kerül. A védőföld a PB PE-sínre megy, és onnan folytonos zöld-sárga vezetővel a fogyasztókhoz: sehol nincs kapcsolva, és nem halad át sem a mérőn, sem a Fi-relén.',
      questionHu: 'Melyik vezető nem kap túláramvédelmet ebben a mérőhelyben?',
      options: [
        'A fázis, mert azt a Fi-relé védi',
        'A nulla és a védőföld',
        'Csak a védőföld, a nullát az F0 védi',
        'Egyik sem, mindhárom vezetőt védeni kell',
      ],
      correct: 1,
      hintHu: 'Melyik két vezetőt tilos túláramvédelemmel megszakítani egy ilyen fogyasztói mérőhelyen?',
      explanationHu:
        'A nulla és a védőföld nem kap túláramvédelmet. Az egypólusú F0 és a kismegszakítók csak a fázist szakítják meg. A védőföld ráadásul sehol nem kapcsolható, a nullát pedig csak a Fi-relé és a kapcsolókészülékek erre alkalmas pólusai szakíthatják meg.',
    },
    {
      id: 'g-s2',
      titleHu: 'A fogyasztásmérő fázisága',
      goalHu: 'Az F0 kimenetét a KWH 1-es kapcsára, a KWH 3-as kimenetét pedig az FM főkismegszakító bemenetére kötni.',
      focus: ['F0', 'KWH', 'FM'],
      reasoningHu:
        'A közvetlen mérésű egyfázisú fogyasztásmérőnél a fázis az 1-3 kapocspáron megy át: az 1-es a hálózat felőli bemenet, a 3-as a fogyasztó felé menő kimenet. A mért fázis innen a főkismegszakítóra megy, amely a fogyasztói hálózat kézi lekapcsolására és túláramvédelmére szolgál. A be- és kimenet felcserélése azt jelentené, hogy a mérőn fordítva folyik át az áram.',
      questionHu: 'Melyik a fogyasztásmérő fázis bemeneti kapcsa?',
      options: ['A 3-as kapocs', 'Az 1-es kapocs', 'A 4-es kapocs', 'A 6-os kapocs'],
      correct: 1,
      hintHu: 'A fázis az 1-3 pároshoz tartozik, a pár első tagja a hálózat felőli oldal.',
      explanationHu:
        'A fázis bemenete az 1-es, kimenete a 3-as kapocs. A 4-6 páros a nulla be- és kimenete, azt nem szabad a fázissal összekeverni.',
    },
    {
      id: 'g-s3',
      titleHu: 'A nulla átvezetése a mérőn',
      goalHu: 'Az NB0 sínről a KWH 4-es kapcsára menni, a 6-os kimenetet pedig a FI Fi-relé N1 bemenetére vinni.',
      focus: ['NB0', 'KWH', 'FI'],
      reasoningHu:
        'A mérő a fázisáram mellett a fázis-nulla feszültséget is méri, ezért a nullát is át kell vezetni rajta. Az NB0 sínről a 4-es bemeneti kapocsra megy a kék vezető, a 6-os kimenetről pedig tovább a Fi-relé N1 bemeneti nulla kapcsára. A nulla nem megy át az FM főkismegszakítón, mert az egypólusú, tehát csak a fázist kapcsolja.',
      questionHu: 'Hova megy a fogyasztásmérő 6-os kapcsáról induló nullavezető?',
      options: [
        'Az FM főkismegszakító bemenetére',
        'A FI Fi-relé N1 bemeneti nulla kapcsára',
        'Közvetlenül az NB fogyasztói N-sínre',
        'A PB PE-sínre',
      ],
      correct: 1,
      hintHu: 'A nullának a Fi-relén kell átmennie, mielőtt a fogyasztói sínre kerül.',
      explanationHu:
        'A mért nulla a Fi-relé N1 bemenetére megy. Az egypólusú főkismegszakítón nem vezethető át, a fogyasztói NB sínre pedig csak a Fi-relé N2 kimenete felől kerülhet, különben a védelem nem működne.',
    },
    {
      id: 'g-s4',
      titleHu: 'A főkismegszakítótól a Fi-reléig',
      goalHu: 'Az FM kimenetét a FI Fi-relé L1 bemenetére kötni.',
      focus: ['FM', 'FI'],
      reasoningHu:
        'A főkismegszakító a mérő után, a fogyasztói hálózat elején áll: ezzel lehet az egész lakáselosztót egy mozdulattal lekapcsolni, és ez adja a fogyasztói fővédelmet. A kimenetéről a fázis a Fi-relé L1 bemenetére megy. A Fi-relé nem túláramvédelem, ezért mindig kell elé olyan készülék, amely a zárlati és túlterhelési áramtól megvédi.',
      questionHu: 'Miért kell a Fi-relé elé túláramvédelmi készülék?',
      options: [
        'Mert a Fi-relé maga nem véd túláram és zárlat ellen, csak hibaáram ellen',
        'Mert a Fi-relé így pontosabban mér',
        'Mert a Fi-relé csak védett hálózaton hitelesíthető',
        'Nem kell, a Fi-relé minden hiba ellen véd',
      ],
      correct: 0,
      hintHu: 'Gondold végig, milyen hibát érzékel a Fi-relé, és milyet nem.',
      explanationHu:
        'A Fi-relé kizárólag hibaáramot érzékel, túláramot és zárlatot nem. Ezért a névleges áramát meg nem haladó túláramvédelmet mindig elé kell tenni, itt ezt az F0 és az FM látja el.',
    },
    {
      id: 'g-s5',
      titleHu: 'A Fi-relé kimenete és a fogyasztói nulla',
      goalHu: 'A FI L2 kimenetét az F1 és F2 kismegszakítók bemenetére, az N2 kimenetet pedig az NB fogyasztói N-sínre kötni.',
      focus: ['FI', 'F1', 'F2', 'NB'],
      reasoningHu:
        'Ez a mérőhely legkritikusabb pontja. A Fi-relé L2 kimenete adja a fogyasztói fázist, amelyről mindkét kismegszakító táplálkozik, az N2 kimenet pedig az NB fogyasztói N-sínt. Minden fogyasztó nullája innen jön. Ha bármelyik fogyasztói nulla a mérő előtti NB0 sínről indulna, annak árama nem menne át a Fi-relén, ezért a készülék hibaáramot érzékelne és kioldana, az adott áramkör pedig védelem nélkül maradna.',
      questionHu: 'Melyik sínről kapja a nulláját az X1 dugalj és az E1 lámpa?',
      options: [
        'Az NB0 sínről, mert az van közelebb a betápláláshoz',
        'A KWH 6-os kapcsáról közvetlenül',
        'Az NB sínről, amelyet a Fi-relé N2 kimenete táplál',
        'A PB PE-sínről',
      ],
      correct: 2,
      hintHu: 'Az oda- és a visszatérő áramnak egyaránt át kell haladnia a Fi-relén.',
      explanationHu:
        'A fogyasztói nulla a Fi-relé utáni NB sínről jön. Így hibamentes üzemben a fázis- és a nullaáram különbsége nulla, és a Fi nem old ki feleslegesen, hiba esetén viszont biztosan lekapcsol.',
    },
    {
      id: 'g-s6',
      titleHu: 'A dugalj és a lámpa áramköre',
      goalHu: 'Az F1 kimenetét az X1 dugalj fázisára, az F2 kimenetét az E1 lámpára kötni, a nullákat az NB sínről, a dugalj védőföldjét a PB sínről.',
      focus: ['F1', 'F2', 'X1', 'E1', 'NB', 'PB'],
      reasoningHu:
        'A dugalj és a világítás külön kismegszakítót kap, hogy egy hiba ne feszültségmentesítse az egész lakást, és hogy az áramkörök terhelésüknek megfelelő védelmet kapjanak. A dugalj három vezetőt igényel: fázis az F1 felől, nulla az NB sínről, védőföld a PB sínről. A lámpa a fázist az F2 felől kapja, a nullát az NB sínről, és a nulla oldala soha nincs kapcsolva.',
      questionHu: 'Miért mindig a fázist kell kapcsolni a lámpa áramkörében, és soha nem a nullát?',
      options: [
        'Mert a nulla kapcsolása nagyobb ívhúzást okoz',
        'Mert kapcsolt nulla mellett a foglalat kikapcsolt állapotban is fázison, tehát feszültség alatt maradna',
        'Mert a lámpa csak így világít teljes fényerővel',
        'Mert a Fi-relé különben nem érzékel hibaáramot',
      ],
      correct: 1,
      hintHu: 'Gondold végig, mi marad feszültség alatt, ha a nullát szakítjuk meg.',
      explanationHu:
        'Ha a nullát kapcsolnánk, a lámpafoglalat kikapcsolt állapotban is a fázison maradna, ami izzócserénél áramütés-veszélyt jelent. Ezért a kapcsolókészülék mindig a fázisba kerül.',
    },
    {
      id: 'g-s7',
      titleHu: 'Ellenőrzés feszültségmentes állapotban',
      goalHu: 'A kész mérőhelyet szemrevételezéssel és feszültségmentes méréssel ellenőrizni a feszültség alá helyezés előtt.',
      focus: ['SUP', 'F0', 'KWH', 'FM', 'FI', 'NB0', 'NB', 'PB'],
      reasoningHu:
        'A sorrend itt is kötött: szemrevételezés a rajz alapján, a kapocsszorítások és a vezetékszínek ellenőrzése, majd feszültségmentes állapotban mérés. Ellenőrizni kell a PE folytonosságát a PE-sín és a dugalj védőérintkezője között, hogy az NB és az NB0 sín a Fi-relén kívül sehol nincs összekötve, hogy az N és a PE a fogyasztói oldalon nincs összekötve, és hogy a fázis és a nulla között nincs zárlat. A Fi tesztgombjának próbája feszültség alatti művelet, ezért csak oktatói engedéllyel és felügyelettel végezhető. Szerelni és hibát keresni kizárólag feszültségmentes állapotban szabad.',
      questionHu: 'Mit kell mérni ahhoz, hogy kiderüljön: a fogyasztói nulla nem a mérő előtti sínről jön?',
      options: [
        'A fázis és a nulla közötti feszültséget üzem közben',
        'Kikapcsolt Fi-relé mellett az NB és az NB0 sín közötti folytonosságot, amely nem lehet zárt',
        'A fogyasztásmérő állását két időpontban',
        'A dugalj és a lámpa közötti ellenállást',
      ],
      correct: 1,
      hintHu: 'Kikapcsolt Fi-relénél a két N-sín között nem lehet összeköttetés.',
      explanationHu:
        'Kikapcsolt Fi-relé mellett a mérő előtti és a Fi utáni N-sín között nem szabad folytonosságnak lennie. Ha mégis van, valamelyik fogyasztói nulla rossz sínről indul, vagy a két sín valahol össze van kötve. Ez a leggyakoribb, és a legveszélyesebb következményekkel járó mérőhelyi hiba.',
    },
  ],
  exam: [
    {
      id: 'g-q1',
      promptHu: 'Mi a helyes energiaút az egyfázisú mérőhelyen a hálózattól a fogyasztóig?',
      options: [
        'Hálózat, főkismegszakító, mérő, főbiztosító, Fi-relé, fogyasztói áramkörök',
        'Hálózat, főbiztosító, mérő, főkismegszakító, Fi-relé, fogyasztói áramkörök',
        'Hálózat, Fi-relé, főbiztosító, mérő, főkismegszakító, fogyasztói áramkörök',
        'Hálózat, mérő, főbiztosító, főkismegszakító, Fi-relé, fogyasztói áramkörök',
      ],
      correct: 1,
      category: 'rajzolvasas',
      explanationHu:
        'A mérő elé túláramvédelem kell, ezért a főbiztosító az első. Utána jön a mérő, a főkismegszakító, majd a Fi-relé, és csak ezután ágazik szét a fogyasztói hálózat.',
    },
    {
      id: 'g-q2',
      promptHu: 'A közvetlen mérésű egyfázisú fogyasztásmérőnél melyik kapocspáron megy át a nullavezető?',
      options: ['Az 1-3 páron', 'A 4-6 páron', 'A 3-6 páron', 'A nulla nem megy át a mérőn'],
      correct: 1,
      category: 'keszulekismeret',
      explanationHu:
        'A fázis az 1-3, a nulla a 4-6 kapocspáron halad át. A nullát is át kell vezetni a mérőn, mert a készülék a fázis-nulla feszültséget is méri.',
    },
    {
      id: 'g-q3',
      promptHu: 'Honnan kell elvinni a dugalj és a lámpa nullavezetőjét?',
      options: [
        'Az NB0 mérő előtti sínről',
        'A KWH 6-os kapcsáról közvetlenül',
        'Az NB sínről, amelyet a Fi-relé N2 kimenete táplál',
        'A PB PE-sínről',
      ],
      correct: 2,
      category: 'bekotesi-pontossag',
      explanationHu:
        'A fogyasztói nulla mindig a Fi-relé után van. Így a visszatérő áram is átmegy a védelmen, ami a helyes működés feltétele.',
    },
    {
      id: 'g-q4',
      promptHu: 'Mi történik, ha a lámpa nulláját tévedésből a mérő előtti NB0 sínre kötik?',
      options: [
        'Semmi, a lámpa rendben világít, a Fi nem érzékel eltérést',
        'A lámpa bekapcsolásakor a Fi-relé kiold, mert a visszatérő áram nem megy át rajta',
        'A lámpa nem világít, mert nincs zárt áramkör',
        'A fogyasztásmérő nem méri a lámpa fogyasztását',
      ],
      correct: 1,
      category: 'mukodes-megertese',
      explanationHu:
        'A Fi az átmenő áramok különbségét figyeli. Ha a nulla megkerüli, a lámpa terhelőárama hibaáramként jelenik meg, és a készülék kiold.',
    },
    {
      id: 'g-q5',
      promptHu: 'Melyik állítás igaz a védőföldre ezen a mérőhelyen?',
      options: [
        'A PE átmegy a mérőn, hogy mérhető legyen',
        'A PE a főkismegszakítón keresztül kapcsolható',
        'A PE sehol nincs kapcsolva, nem megy át a mérőn és a Fi-relén, és a fogyasztói oldalon nem köthető össze a nullával',
        'A PE a Fi-relé N1 kapcsára megy',
      ],
      correct: 2,
      category: 'biztonsagi-szemlelet',
      explanationHu:
        'A védővezető folytonos, sehol nem kapcsolt és nem mért. Ha a fogyasztói oldalon összekötnék a nullával, a Fi-relé nem védene, és a védővezetőn üzemi áram folyhatna.',
    },
    {
      id: 'g-q6',
      promptHu: 'Miért nem elég önmagában a Fi-relé a fogyasztói hálózat védelmére?',
      options: [
        'Mert a Fi-relé csak hibaáramot érzékel, túláramot és zárlatot nem, ezért kismegszakítókra is szükség van',
        'Mert a Fi-relé csak világítási áramkörnél működik',
        'Mert a Fi-relé csak háromfázisú hálózatban véd',
        'Mert a Fi-relé a mérő nélkül nem működik',
      ],
      correct: 0,
      category: 'keszulekismeret',
      explanationHu:
        'A Fi-relé hibaáram-védőkapcsoló: az áramütés és a tűz elleni kiegészítő védelem. Túláram és zárlat ellen a főbiztosító, a főkismegszakító és az áramköri kismegszakítók védenek.',
    },
    {
      id: 'g-q7',
      promptHu: 'A bekötés kész, a tábla feszültségmentes. Mi a helyes ellenőrzési sorrend?',
      options: [
        'Feszültség alá helyezés, majd a Fi tesztgombja, végül szemrevételezés',
        'Szemrevételezés és a kötések ellenőrzése, majd feszültségmentes PE-folytonosság, N-sín szétválasztás és zárlatvizsgálat, végül engedéllyel feszültség alá helyezés és Fi-próba',
        'Először a Fi tesztgombját nyomjuk meg feszültségmentesen',
        'Elég a mérő számlálójának figyelése terhelés mellett',
      ],
      correct: 1,
      category: 'ellenorzesi-sorrend',
      explanationHu:
        'A mérések mindig megelőzik a feszültség alá helyezést. A Fi tesztgombjának próbája feszültség alatti művelet, ezért csak felügyelettel és engedéllyel végezhető.',
    },
    {
      id: 'g-q8',
      promptHu: 'A rajzon az FM főkismegszakító egypólusú. Mi következik ebből a nullavezetőre nézve?',
      options: [
        'A nullát is át kell vezetni rajta, csak nem kapcsolja',
        'A nulla nem megy át az FM-en, hanem a mérő 6-os kapcsáról közvetlenül a Fi-relé N1 bemenetére megy',
        'A nulla az FM-et megkerülve közvetlenül a fogyasztói NB sínre megy',
        'A nulla a PE-sínen keresztül folytatódik',
      ],
      correct: 1,
      category: 'rajzolvasas',
      explanationHu:
        'Az egypólusú főkismegszakító csak a fázist kapcsolja, ezért a nulla a mérő 6-os kimenetéről a Fi-relé N1 bemenetére megy. A fogyasztói NB sínre csak a Fi N2 kimenete felől kerülhet nulla.',
    },
  ],
  unresolved: [
    {
      id: 'g-u1',
      labelHu: 'Az F0 főbiztosító, az FM főkismegszakító és az F1, F2 kismegszakítók névleges árama és jelleggörbéje - a rajzból nem következik, a hiányzó paramétereket lásd a missingHu listában.',
      missingHu: [
        'A csatlakozási teljesítmény és a szolgáltatói előírás',
        'A dugalj és a világítási áramkör tervezett terhelése',
        'A vezetékek keresztmetszete és fektetési módja',
        'A tervrajzon vagy a vizsgafeladat kiírásában megadott értékek',
      ],
    },
    {
      id: 'g-u2',
      labelHu: 'A FI Fi-relé névleges árama és névleges hibaárama - a rajzból nem következik, a hiányzó paramétereket lásd a missingHu listában.',
      missingHu: [
        'A védendő áramkörök jellege (dugalj, világítás)',
        'Az érintésvédelmi terv és a vonatkozó előírás',
        'A mérőhely csatlakozási teljesítménye',
      ],
    },
    {
      id: 'g-u3',
      labelHu: 'A fogyasztói vezetékek keresztmetszete - a rajzból nem következik, a hiányzó paramétereket lásd a missingHu listában.',
      missingHu: [
        'A terhelőáram és az egyidejűségi tényező',
        'A vezetékhossz és a megengedett feszültségesés',
        'A fektetési mód és a környezeti hőmérséklet',
      ],
    },
  ],
};
