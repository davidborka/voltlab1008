import type { TaskContent } from '../../domain/electrical-types';

export const contentF: TaskContent = {
  objectivesHu: [
    'A háromfázisú mérőhely energiaútjának felépítése: hálózat, főbiztosító, fogyasztásmérő, főkapcsoló, Fi-relé, fogyasztói áramkörök.',
    'A közvetlen mérésű háromfázisú fogyasztásmérő kapcsainak helyes értelmezése és bekötése.',
    'A nullavezető végigvezetése a mérőn, valamint a mérő előtti (NB0) és a Fi utáni (NB) N-sín tudatos szétválasztása.',
    'A 4 pólusú Fi-relé bekötése úgy, hogy a fogyasztói nulla is a védelem után legyen.',
    'Az egyfázisú fogyasztói áramkörök elosztása a három fázis között a kiegyenlített terhelés érdekében.',
    'A védőföld folytonos, sehol nem kapcsolt és nem mért vezetőként kezelése.',
    'A kész mérőhely ellenőrzésének helyes sorrendje feszültségmentes állapotban.',
  ],
  commonMistakesHu: [
    'A fogyasztói nullát a mérő előtti NB0 sínről viszik el, így a Fi-relé folyamatosan kiold vagy egyáltalán nem véd.',
    'A nullát nem vezetik át a fogyasztásmérőn, hanem a betáplálásról közvetlenül a fogyasztói sínre kötik.',
    'A mérő be- és kimeneti kapcsait felcserélik, például a 3-as kapocsra kötik a hálózati fázist az 1-es helyett.',
    'A fázissorrendet elrontják: az L2 a mérő L3 kapocspárjára kerül, így a mérés és a terheléselosztás követhetetlen lesz.',
    'A védőföldet átvezetik a mérőn vagy a Fi-relén, pedig a PE sehol nincs kapcsolva és nem megy át a mérőn.',
    'A PE-sínt és az N-sínt összekötik a fogyasztói oldalon, ami a Fi-relé működését teljesen tönkreteszi.',
    'A három egyfázisú áramkört mind egy fázisra kötik, így a terhelés nem oszlik el a fázisok között.',
    'A Fi-relé N1 bemeneti és N2 kimeneti kapcsát felcserélik, vagy a fogyasztói nullát a bemeneti oldalra kötik.',
    'SPD a Fi után / PE nélkül: a Schelinger túlfeszültség-védőt a Fi-relé mögé kötik (a levezetett impulzus kioldja a Fi-t), vagy az alsó ⏚ kapcsa nincs a PE-sínre kötve (így hatástalan).',
    'Az Easy9 4P Fi-relén a nullát a jobb szélre keresik - ezen a típuson az N a BAL szélen van (N 1 3 5 / N 2 4 6).',
  ],
  guided: [
    {
      id: 'f-s1',
      titleHu: 'Betáplálás, főbiztosító és a sínek',
      goalHu: 'A SUP három fázisát az F0 főbiztosító bemeneteire, a nullát az NB0 mérő előtti N-sínre, a védőföldet a PB PE-sínre kötni.',
      focus: ['SUP', 'F0', 'NB0', 'PB'],
      reasoningHu:
        'A mérőhely a hálózati betáplálással kezdődik. Az L1, L2, L3 a háromsarkú F0 főbiztosító (Schneider Easy9 3P C16) 1, 3, 5 bemeneteire megy, mert a mérő elé túláramvédelem kell. A nulla nem kap túláramvédelmet, ezért a SUP N közvetlenül az NB0 sínre kerül: ez a mérő előtti nulla gyűjtőpont. A védőföld a PB PE-sínre megy, és onnan sehova nem lép be a mérési vagy kapcsolási útvonalba.',
      questionHu: 'Hova köti a betáplálás védőföld vezetőjét, és hol halad tovább?',
      options: [
        'A PB PE-sínre, ahonnan csak a fogyasztók PE kapcsaihoz megy, kapcsolókészülék nélkül',
        'A PB PE-sínre, majd onnan a fogyasztásmérő 10-es kapcsára',
        'Az NB0 N-sínre, mert a nulla és a védőföld a mérő előtt közös',
        'A Fi-relé N1 kapcsára, hogy a védelem érzékelje a hibaáramot',
      ],
      correct: 0,
      hintHu: 'A védőföld soha nem kapcsolt, nem mért és nem terhelt vezető.',
      explanationHu:
        'A PE a PE-sínre megy, és onnan folytonos zöld-sárga vezetővel a fogyasztókhoz. A mérőn nem megy át, a Fi-relén nem halad keresztül, és a nullával sehol nem köthető össze ezen a táblán.',
    },
    {
      id: 'f-s2',
      titleHu: 'A fogyasztásmérő fázisbemenetei',
      goalHu: 'Az F0 három kimenetét a KWH 1, 4 és 7 kapcsaira kötni, a fázissorrend megtartásával.',
      focus: ['F0', 'KWH'],
      reasoningHu:
        'A közvetlen mérésű háromfázisú fogyasztásmérőnél a fázisonként két kapocs tartozik össze: az L1 az 1-3, az L2 a 4-6, az L3 a 7-9 kapocspár. A pár első tagja a hálózat felőli bemenet, a második a fogyasztó felé menő kimenet. Ezért az F0 első kimenete az 1-es, a második a 4-es, a harmadik a 7-es kapocsra megy. A fázissorrend megtartása azért fontos, hogy a mérés és a későbbi terheléselosztás követhető és ellenőrizhető legyen.',
      questionHu: 'A KWH mérő melyik kapcsára kell kötni az L2 fázis hálózat felőli vezetőjét?',
      options: ['Az 1-es kapocsra', 'A 4-es kapocsra', 'A 6-os kapocsra', 'A 10-es kapocsra'],
      correct: 1,
      hintHu: 'Az L2 a 4-6 kapocspárhoz tartozik, és a pár első tagja a bemenet.',
      explanationHu:
        'Az L2 bemenete a 4-es kapocs, a kimenete a 6-os. A 6-osra kötött hálózati vezető azt jelentené, hogy a mérőn fordítva folyik át az áram ezen a fázison. A 10-es kapocs a nulla bemenete.',
    },
    {
      id: 'f-s3',
      titleHu: 'A nulla átvezetése a mérőn',
      goalHu: 'Az NB0 sínről a KWH 10-es kapcsára menni, a 11-es kimenetet pedig a főkapcsoló N kapcsára vinni.',
      focus: ['NB0', 'KWH', 'FK'],
      reasoningHu:
        'A közvetlen mérésű fogyasztásmérő a fázisáramot a nullához viszonyított feszültséggel együtt méri, ezért a nullát is át kell vezetni rajta. Az NB0 mérő előtti sínről a 10-es bemeneti kapocsra megy a kék vezető, a 11-es kimenetről pedig tovább a főkapcsoló N kapcsára. Ha a nullát kihagyjuk a mérőből, a készülék hibásan vagy egyáltalán nem mér.',
      questionHu: 'Miért kell a nullavezetőt is átvezetni a fogyasztásmérőn?',
      options: [
        'Mert a nullát is védeni kell túláram ellen',
        'Mert a mérőnek szüksége van a fázis és a nulla közötti feszültségre a fogyasztás méréséhez',
        'Mert így lesz a nulla folytonos a fogyasztók felé',
        'Nem kell, csak a rajzon szokás így ábrázolni',
      ],
      correct: 1,
      hintHu: 'A fogyasztás áram és feszültség szorzatából adódik; honnan veszi a mérő a feszültséget?',
      explanationHu:
        'A mérő a fázisáram mellett a fázis-nulla feszültséget is méri, ezért a nulla a mérő része az áramkörnek. A nulla folytonossága önmagában más úton is megoldható lenne, de a hiteles méréshez a mérőn keresztül kell vezetni.',
    },
    {
      id: 'f-s4',
      titleHu: 'A mérő kimenetétől a főkapcsolóig',
      goalHu: 'A KWH 3, 6, 9 kimeneteit az FK főkapcsoló L1, L2, L3 kapcsaira kötni.',
      focus: ['KWH', 'FK'],
      reasoningHu:
        'A mért energia a mérő kimeneti kapcsain hagyja el a készüléket: a 3-as az L1, a 6-os az L2, a 9-es az L3 kimenete. Ezek a fogyasztói oldal első pontjai, ezért a 3P+N főkapcsoló azonos jelű bemeneteire mennek. A főkapcsoló feladata, hogy egyetlen mozdulattal az egész fogyasztói hálózatot le lehessen kapcsolni, a nullával együtt.',
      questionHu: 'Miért 3P+N kivitelű a főkapcsoló, és nem csak 3 pólusú?',
      options: [
        'Mert a negyedik pólus a védőföldet kapcsolja',
        'Mert a nullát is meg kell tudni szakítani, hogy a fogyasztói hálózat teljesen leválasztható legyen',
        'Mert a nullán is folyik túláram, amit védeni kell',
        'Mert a Fi-relé csak így tud működni',
      ],
      correct: 1,
      hintHu: 'A védőföld soha nem kapcsolt; melyik marad, amit a negyedik pólus kapcsolhat?',
      explanationHu:
        'A negyedik pólus a nullát kapcsolja, így a fogyasztói hálózat minden üzemi vezetője leválasztható. A védőföldet soha nem szabad kapcsolni, ezért az a főkapcsolón nem megy át.',
    },
    {
      id: 'f-spd',
      titleHu: 'Túlfeszültség-védelem: Schelinger SPD01-4P-B+C',
      goalHu: 'A főkapcsoló kimenetéről L1, L2, L3, N a Schelinger SPD felső kapcsaira, az alsó ⏚ (PE) kapcsot rövid úton a PB PE-sínre kötni - a Fi-relé ELŐTT.',
      focus: ['FK', 'SPD', 'PB', 'FI'],
      reasoningHu:
        'A 4 pólusú T1+T2 SPD a mérő és a főkapcsoló UTÁN, a Fi-relé ELŐTT van: a levezetett túlfeszültség-impulzus így nem folyik át a Fi összegző áramváltóján, és nem okoz hamis kioldást. Felül a három fázis és a nulla csatlakozik (L1 L2 L3 N), alul egyetlen ⏚ kapocs (a 3. modul alatt) megy a PE-sínre. A narancs betétek ablaka zöld = rendben, piros = csere. Normál üzemben az SPD nem vezet, ezért nem zárlat. Az előtét-biztosító a készüléken 160 A gG (a gyártói kézikönyv 125 A-t ír) - itt az F-0 ennél jóval kisebb, tehát megfelel. Szigetelésmérés előtt a betéteket ki kell húzni.',
      questionHu: 'Hová kerül a 4 pólusú SPD a mérőhelyen?',
      options: [
        'A mérő elé, a méretlen oldalra, PE nélkül',
        'A főkapcsoló után, a Fi-relé ELŐTT; a ⏚ kapocs a PE-sínre',
        'A Fi-relé után, a kismegszakítók mellé',
        'A dugalj mellé, csak az L1 fázisra',
      ],
      correct: 1,
      hintHu: 'A Fi-relé ne lássa hibaáramnak a levezetett impulzust.',
      explanationHu:
        'Az SPD a Fi előtt van, és PE nélkül hatástalan. Az SPD pontos helyét és a TN-C-S bekötést egyeztesd a vizsgáztatóval.',
    },
    {
      id: 'f-s5',
      titleHu: 'A főkapcsolótól a Fi-reléig',
      goalHu: 'Az FK T1, T2, T3 és TN kimeneteit a FI Fi-relé L1, L2, L3 és N1 bemeneteire kötni.',
      focus: ['FK', 'FI'],
      reasoningHu:
        'A 4 pólusú Fi-relé mind a három fázist és a nullát figyeli. Csak akkor működik helyesen, ha minden üzemi vezető, tehát a nulla is átmegy rajta. A főkapcsoló T1, T2, T3 kimenetei a Fi L1, L2, L3 bemeneteire, a TN kimenet pedig az N1 bemeneti nulla kapocsra megy. A Fi az odamenő és a visszatérő áramok különbségét méri: ha ez a különbség meghaladja a névleges hibaáramot, a készülék lekapcsol.',
      questionHu: 'Miért kell a nullát is átvezetni a 4 pólusú Fi-relén?',
      options: [
        'Mert a Fi az összes üzemi vezető áramának összegét figyeli, és a nulla nélkül minden normál terhelést hibaáramnak látna',
        'Mert a nulla áramát is meg kell szakítani túláram esetén',
        'Mert a Fi-relé így méri a fogyasztást',
        'Nem kell, a nulla megkerülheti a Fi-relét',
      ],
      correct: 0,
      hintHu: 'A Fi az odamenő és a visszatérő áram különbségét méri.',
      explanationHu:
        'Ha a nulla megkerülné a Fi-relét, a fogyasztók visszatérő árama nem jelenne meg a mérésben, ezért a készülék minden terhelést hibaáramként érzékelne és azonnal kioldana. A Fi nem túláramvédelem és nem mérőműszer, hanem hibaáram-védőkapcsoló.',
    },
    {
      id: 'f-s6',
      titleHu: 'A Fi-relé kimenete és a fogyasztói nulla',
      goalHu: 'A FI T1, T2, T3 kimeneteit az F1, F2, F3 kismegszakítók bemeneteire, az N2 kimenetet pedig az NB fogyasztói N-sínre kötni.',
      focus: ['FI', 'F1', 'F2', 'F3', 'NB'],
      reasoningHu:
        'Ez a mérőhely legkritikusabb pontja. A Fi kimeneti nulla, az N2 kapocs adja az NB fogyasztói N-sínt, és minden fogyasztó innen kapja a nulláját. Ha akár egyetlen fogyasztói nulla a mérő előtti NB0 sínről jönne, annak az árama nem menne át a Fi-relén, ezért a készülék hibaáramot érzékelne, és kioldana, illetve az adott áramkör védelem nélkül maradna. A két N-sínt tehát élesen szét kell tartani: NB0 a Fi előtt, NB a Fi után.',
      questionHu: 'Honnan kapja a nulláját a három fogyasztói áramkör?',
      options: [
        'Az NB0 sínről, mert az van közelebb a betápláláshoz',
        'Az NB sínről, amelyet a Fi-relé N2 kimenete táplál',
        'Közvetlenül a KWH 11-es kapcsáról',
        'A PB PE-sínről, mert a nulla és a védőföld a fogyasztói oldalon összeköthető',
      ],
      correct: 1,
      hintHu: 'Minden fogyasztói áramnak át kell haladnia a Fi-relén, oda és vissza is.',
      explanationHu:
        'A fogyasztói nulla a Fi-relé után lévő NB sínről jön. Így a fázisáram és a visszatérő nullaáram is átmegy a védelmen, tehát hiba nélküli üzemben a különbség nulla. Ez a leggyakoribb hibaforrás a mérőhelyeknél.',
    },
    {
      id: 'f-s7',
      titleHu: 'A három egyfázisú áramkör és a terheléselosztás',
      goalHu: 'Az F1 kimenetét az X1 dugalj fázisára, az F2-t az E1, az F3-at az E2 lámpára kötni, a nullákat az NB sínről, a dugalj PE-jét a PB sínről.',
      focus: ['F1', 'F2', 'F3', 'X1', 'E1', 'E2', 'NB', 'PB'],
      reasoningHu:
        'Minden fogyasztói áramkör másik fázisra kerül, hogy a három fázis terhelése kiegyenlített legyen. Az F1 az L1 ágon az X1 dugaljat, az F2 az L2 ágon az E1 lámpát, az F3 az L3 ágon az E2 lámpát táplálja. A nullák mindegyike az NB sínre megy vissza, a dugalj védőföldje pedig a PB sínről kap folytonos zöld-sárga vezetőt. A lámpák kapcsolt vezetője a kismegszakító felől érkezik, a nulla oldal soha nincs kapcsolva.',
      questionHu: 'Miért kerül a három egyfázisú áramkör három különböző fázisra?',
      options: [
        'Mert egy fázis nem bírná el a terhelést semmilyen esetben',
        'Mert így a fázisok terhelése kiegyenlített lesz, és a nullavezető terhelése is kisebb',
        'Mert a Fi-relé csak így tud kioldani',
        'Mert a fogyasztásmérő különben nem mér',
      ],
      correct: 1,
      hintHu: 'Gondolj arra, mi történik a nullavezető áramával, ha a három fázis terhelése hasonló.',
      explanationHu:
        'Az elosztott terhelés miatt a fázisáramok kiegyenlítettek, és szimmetrikus terhelésnél a nullavezető árama kicsi. Ez a szakszerű kialakítás alapja minden háromfázisú fogyasztói hálózatnál.',
    },
    {
      id: 'f-s8',
      titleHu: 'Ellenőrzés feszültségmentes állapotban',
      goalHu: 'A kész mérőhelyet szemrevételezéssel és feszültségmentes méréssel ellenőrizni a feszültség alá helyezés előtt.',
      focus: ['SUP', 'F0', 'KWH', 'FK', 'FI', 'NB0', 'NB', 'PB'],
      reasoningHu:
        'Az ellenőrzés sorrendje: szemrevételezés a rajz alapján, a kapocsszorítások és a vezetékszínek ellenőrzése, majd feszültségmentes állapotban mérés. Meg kell győződni a PE folytonosságáról a PE-sín és a dugalj védőérintkezője között, arról, hogy az NB és az NB0 sín a Fi-relén kívül sehol nincs összekötve, és arról, hogy az N és a PE sín a fogyasztói oldalon nincs összekötve. A Fi tesztgombjának próbája már feszültség alatti művelet, ezért csak oktatói engedéllyel és felügyelettel végezhető. Szerelni és hibát keresni kizárólag feszültségmentes állapotban szabad.',
      questionHu: 'Melyik mérés árulja el a legbiztosabban, hogy a fogyasztói nullát tévedésből a mérő előtti sínről vették le?',
      options: [
        'A PE-sín és a dugalj védőérintkezője közötti folytonosságmérés',
        'Az NB és az NB0 sín közötti folytonosságmérés kikapcsolt Fi-relé mellett',
        'A fázisvezetők közötti szigetelésmérés',
        'A fogyasztásmérő kijelzőjének leolvasása',
      ],
      correct: 1,
      hintHu: 'Kikapcsolt Fi-relé mellett a két N-sín között nem lehet összeköttetés.',
      explanationHu:
        'Kikapcsolt Fi-relénél a mérő előtti és a Fi utáni N-sín között nem szabad folytonosságnak lennie. Ha mégis van, akkor valamelyik fogyasztói nulla rossz sínről indul, vagy a két sín valahol össze van kötve. Ez pontosan az a hiba, ami miatt a Fi vagy azonnal kiold, vagy nem véd.',
    },
  ],
  exam: [
    {
      id: 'f-q1',
      promptHu: 'Mi a helyes energiaút a rajz szerint a hálózattól a fogyasztóig?',
      options: [
        'Hálózat, főkapcsoló, fogyasztásmérő, főbiztosító, Fi-relé, fogyasztói áramkörök',
        'Hálózat, főbiztosító, fogyasztásmérő, főkapcsoló, Fi-relé, fogyasztói áramkörök',
        'Hálózat, Fi-relé, fogyasztásmérő, főbiztosító, főkapcsoló, fogyasztói áramkörök',
        'Hálózat, fogyasztásmérő, főbiztosító, Fi-relé, főkapcsoló, fogyasztói áramkörök',
      ],
      correct: 1,
      category: 'rajzolvasas',
      explanationHu:
        'A mérő elé túláramvédelem kell, ezért a főbiztosító az első. A mérő után jön a főkapcsoló, majd a Fi-relé, és csak ezután ágazik szét a fogyasztói hálózat kismegszakítókra.',
    },
    {
      id: 'f-q2',
      promptHu: 'A közvetlen mérésű háromfázisú fogyasztásmérőnél melyik kapcsokon lép be és lép ki az L3 fázis?',
      options: [
        'Be a 7-esen, ki a 9-esen',
        'Be a 9-esen, ki a 7-esen',
        'Be a 4-esen, ki a 6-oson',
        'Be a 10-esen, ki a 11-esen',
      ],
      correct: 0,
      category: 'keszulekismeret',
      explanationHu:
        'Az L3 a 7-9 kapocspárhoz tartozik, a pár első tagja a hálózat felőli bemenet. A 4-6 az L2, a 10-11 pedig a nulla be- és kimenete.',
    },
    {
      id: 'f-q3',
      promptHu: 'Honnan kell elvinni a fogyasztói áramkörök nullavezetőit?',
      options: [
        'Az NB0 sínről, közvetlenül a mérő előtti nulláról',
        'A KWH 11-es kapcsáról',
        'Az NB sínről, amelyet a Fi-relé N2 kimenete táplál',
        'A PB PE-sínről',
      ],
      correct: 2,
      category: 'bekotesi-pontossag',
      explanationHu:
        'A fogyasztói nulla mindig a Fi-relé után van. Csak így halad át a visszatérő áram is a védelmen, ami a helyes működés feltétele.',
    },
    {
      id: 'f-q4',
      promptHu: 'Mi történik, ha a dugalj nullavezetőjét a Fi-relé előtti NB0 sínre kötik?',
      options: [
        'Semmi, a dugalj normálisan működik',
        'Terhelés esetén a Fi-relé kiold, mert a visszatérő áram nem megy át rajta',
        'A fogyasztásmérő hibásan mér, de a Fi rendben marad',
        'A dugaljban nem lesz feszültség',
      ],
      correct: 1,
      category: 'mukodes-megertese',
      explanationHu:
        'A Fi az átmenő áramok különbségét figyeli. Ha a nulla megkerüli, a terhelőáram hibaáramként jelenik meg, és a készülék kiold. Ez a mérőhelyek leggyakoribb bekötési hibája.',
    },
    {
      id: 'f-q5',
      promptHu: 'Melyik állítás igaz a védőföldre ezen a mérőhelyen?',
      options: [
        'A PE átmegy a fogyasztásmérőn, hogy mérhető legyen',
        'A PE a főkapcsoló negyedik pólusán kapcsolódik',
        'A PE sehol nincs kapcsolva, nem megy át a mérőn, és a fogyasztói oldalon nem köthető össze a nullával',
        'A PE a Fi-relé N1 kapcsára megy',
      ],
      correct: 2,
      category: 'biztonsagi-szemlelet',
      explanationHu:
        'A védővezető folytonos, sehol nem kapcsolt és nem mért. Ha a fogyasztói oldalon összekötnék a nullával, a Fi-relé védelmi funkciója megszűnne, és a védővezetőn üzemi áram folyhatna.',
    },
    {
      id: 'f-q6',
      promptHu: 'Miért 3P+N kivitelű a főkapcsoló ezen a táblán?',
      options: [
        'Mert a negyedik pólus a védőföldet kapcsolja',
        'Mert a nullát is meg kell tudni szakítani a teljes leválasztáshoz',
        'Mert a mérő csak így hitelesíthető',
        'Mert a kismegszakítók száma ezt írja elő',
      ],
      correct: 1,
      category: 'keszulekismeret',
      explanationHu:
        'A negyedik pólus a nullát kapcsolja, így minden üzemi vezető leválasztható. A védőföldet soha nem szabad kapcsolni.',
    },
    {
      id: 'f-q7',
      promptHu: 'A bekötés kész, a tábla feszültségmentes. Mi a helyes ellenőrzési sorrend?',
      options: [
        'Feszültség alá helyezés, Fi tesztgomb, majd szemrevételezés',
        'Szemrevételezés, kapocsszorítások, majd feszültségmentes folytonosság- és PE-ellenőrzés, végül engedéllyel feszültség alá helyezés és Fi-próba',
        'Fi tesztgomb feszültségmentesen, majd szemrevételezés',
        'Elég a mérő kijelzőjét figyelni terhelés mellett',
      ],
      correct: 1,
      category: 'ellenorzesi-sorrend',
      explanationHu:
        'Először szemrevételezés és a kötések ellenőrzése, majd feszültségmentes mérések: PE-folytonosság, N-sínek szétválasztása, zárlatmentesség. A Fi tesztgombjának próbája feszültség alatti művelet, csak felügyelettel és engedéllyel végezhető.',
    },
    {
      id: 'f-q8',
      promptHu: 'A rajzon két külön N-sín szerepel, NB0 és NB. Mit jelent ez a rajzolvasás szempontjából?',
      options: [
        'Csak helytakarékosság, elektromosan ugyanaz a két sín',
        'Az NB0 a mérő előtti, az NB a Fi-relé utáni nulla; a kettő között csak a mérőn és a Fi-relén át van kapcsolat',
        'Az NB0 a fogyasztói nulla, az NB a hálózati nulla',
        'Az NB a védőföld tartaléksínje',
      ],
      correct: 1,
      category: 'rajzolvasas',
      explanationHu:
        'A két sín szándékosan van elkülönítve. Az NB0 a mérő bemeneti nulláját gyűjti, az NB pedig a Fi-relé N2 kimenetéről táplált fogyasztói nulla. Ha a kettőt bárhol összekötik, a Fi-relé védelme megszűnik.',
    },
  ],
  unresolved: [
    {
      id: 'f-spd',
      labelHu: 'Az SPD pontos helye és bekötése - az SPD pontos helyét és a TN-C-S bekötést egyeztesd a vizsgáztatóval.',
      missingHu: [
        'A szolgáltatói előírás és a vizsgaközpont gyakorlata',
        'A hálózat földelési rendszere (TN-C-S esetén hol válik szét a PEN)',
        'Az előtét-biztosító értéke: a készüléken 160 A gG, a gyártói kézikönyvben 125 A gL/gG',
      ],
      typicalExampleHu: 'Oktatási példa, nem a megoldás: a modell a főkapcsoló és a 4P Fi-relé közé köti a Schelinger SPD01-4P-B+C-t.',
    },
    {
      id: 'f-u1',
      labelHu: 'Az F0 főbiztosító és az F1, F2, F3 kismegszakítók névleges árama és jelleggörbéje - a rajzból nem következik, a hiányzó paramétereket lásd a missingHu listában.',
      missingHu: [
        'A csatlakozási teljesítmény és a szolgáltatói előírás',
        'Az egyes áramkörök tervezett terhelése',
        'A vezetékek keresztmetszete és fektetési módja',
        'A tervrajzon vagy a vizsgafeladat kiírásában megadott értékek',
      ],
    },
    {
      id: 'f-u2',
      labelHu: 'A FI Fi-relé névleges árama és névleges hibaárama - a rajzból nem következik, a hiányzó paramétereket lásd a missingHu listában.',
      missingHu: [
        'A védendő áramkörök jellege (dugalj, világítás, egyéb fogyasztó)',
        'Az érintésvédelmi terv és a vonatkozó előírás',
        'A mérőhely csatlakozási teljesítménye',
      ],
    },
    {
      id: 'f-u3',
      labelHu: 'A fő- és fogyasztói vezetékek keresztmetszete - a rajzból nem következik, a hiányzó paramétereket lásd a missingHu listában.',
      missingHu: [
        'A terhelőáram és az egyidejűségi tényező',
        'A vezetékhossz és a megengedett feszültségesés',
        'A fektetési mód és a környezeti hőmérséklet',
      ],
    },
  ],
};
