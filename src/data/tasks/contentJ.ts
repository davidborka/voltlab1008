import type { TaskContent } from '../../domain/electrical-types';

/* Nyilvános, hivatkozható források az EPH kérdésekhez (másodlagos források: a
   szabvány hivatalos szövegét az MSZ HD kiadvány adja, lásd unresolved):
   - MSZ HD 60364-4-41:2007, 411.3.1.2 összefoglalója (szakcikk, 2008):
     https://hobbielektronika.hu/forum/getfile.php?id=75085
   - MSZ HD 60364-5-54 - Földelőberendezések, védővezetők, EPH (villanyszerelő
     tanfolyami anyag): https://hobbielektronika.hu/forum/getfile.php?id=410112 */
export const EPH_SOURCES = [
  'https://hobbielektronika.hu/forum/getfile.php?id=75085',
  'https://hobbielektronika.hu/forum/getfile.php?id=410112',
];

export const contentJ: TaskContent = {
  objectivesHu: [
    'A lakossági 1 fázisú mérőhely energiaútja: méretlen fővezeték, főbiztosító, Qoltec mérő (L 1 → 2, PEN 3 → 4), mért fővezeték, lakás főelosztó.',
    'TN-C-S kialakítás: a PEN szétválasztása a mérő után, ELŐSZÖR a PE-sínre (fő földelősín), onnan híddal az N-sínre; utána N és PE soha nem érhet össze.',
    'A fő földelősín (EPH-sín) bekötése: földelő, védővezető, valamint a víz-, gáz- és fűtési fővezeték egyenpotenciálú összekötése.',
    'A két ELMARK SPD-C10 túlfeszültség-védő helyes elhelyezése (mért oldal, Fi ELŐTT) és bekötése (L-PE, N-PE).',
    'A lakás főelosztó: FM, IDEAL Fi-relé, B16 dugaljkör és B10 világítási kör kapcsolóval.',
    'A hálózati feszültség (L-N, L-PE, N-PE) és a védővezető folytonosságának mérése és dokumentálása.',
    'Az EPH-ba kötendő vezetőképes részek és az EPH fő szabályának ismerete.',
  ],
  commonMistakesHu: [
    'ÉRVÉNYTELEN VIZSGA - PE kapcsolóérintkezőn: a védővezetőt kismegszakítón, Fi-relén vagy kapcsolón vezetik át. A védővezetőbe kapcsolóeszközt beiktatni tilos.',
    'ÉRVÉNYTELEN VIZSGA - N és PE újra összekötve a szétválasztás után: a fogyasztói oldalon (pl. a főelosztóban vagy a dugaljban) az N és a PE összeér. Ilyenkor a Fi-relé nem véd, a PE-n üzemi áram folyik.',
    'ÉRVÉNYTELEN VIZSGA - SPD PE nélkül: a túlfeszültség-védő ⏚ kapcsa nincs a PE-sínre kötve, így a levezetett impulzusnak nincs útja.',
    'ÉRVÉNYTELEN VIZSGA - a Fi-relé megkerülve: valamelyik fogyasztó fázisa vagy nullája a Fi előtti oldalról jön (pl. a lámpa nullája a mérőszekrény N-sínjéről). A Fi kiold, vagy nem véd.',
    'SPD a Fi után / PE nélkül: a túlfeszültség-védőt a Fi-relé mögé kötik, ezért a levezetett impulzus kioldja a Fi-t, vagy a PE hiányzik.',
    'A PEN először az N-sínre megy, nem a PE-sínre: szakadásnál a PE-re kötött testek feszültség alá kerülhetnek.',
    'A mérő be- és kimenetét felcserélik: a méretlen fázist a 2-es kapocsra kötik az 1-es helyett, vagy a PEN-t a 4-esre a 3-as helyett.',
    'Az EPH-vezetőt láncszerűen, egyik csőről a másikra fűzik, vagy csak a vízvezetéket kötik be; minden idegen vezetőképes rész külön vezetővel a fő földelősínre kerül.',
    'Szigetelésmérés zárt PEN-híddal és bent hagyott SPD-betétekkel: a mérés hamis eredményt ad, az 500 V DC a varisztort is igénybe veszi.',
  ],
  guided: [
    {
      id: 'j-s1',
      titleHu: 'Méretlen fővezeték, főbiztosító, mérő',
      goalHu: 'A méretlen fővezeték fázisát az F-0 főbiztosítón át a Qoltec mérő 1-es kapcsára, a PEN-t a mérő 3-as kapcsára kötni.',
      focus: ['SUP', 'F0', 'KWH'],
      reasoningHu:
        'A mérőszekrénybe a szolgáltatói hálózatról a méretlen fővezeték érkezik: fázis és PEN (TN-C). A fázis a főbiztosítón át jut a mérőre, mert a mérő elé túláramvédelem kell. A Qoltec 50888-ra nyomtatott rajz szerint az 1-es kapocs a fázis bemenete, a 2-es a kimenete, a 3-as a nulla (itt még PEN) bemenete, a 4-es a kimenete. Az 5-6 az impulzuskimenet, azt nem kötjük be.',
      questionHu: 'Melyik kapocsra megy a méretlen PEN a Qoltec 50888 mérőn?',
      options: ['Az 1-es kapcsára', 'A 2-es kapcsára', 'A 3-as kapcsára', 'Az 5-ös kapcsára'],
      correct: 2,
      hintHu: 'A készülékre nyomtatott rajzon a bal oldali N vezeték a harmadik kapocsba fut.',
      explanationHu:
        'A PEN (a mérő szempontjából a nulla) a 3-as kapocsra érkezik és a 4-esen távozik. Az 1-2 a fázis útja, az 5-6 az impulzuskimenet.',
    },
    {
      id: 'j-s2',
      titleHu: 'PEN-szétválasztás és fő földelősín',
      goalHu: 'A mérő 4-es kapcsáról a PEN-t a PE-sínre, onnan a fő földelősínre (EPH-sín) vinni, a földelőt a fő földelősínre kötni.',
      focus: ['KWH', 'PEN', 'EPH', 'RE'],
      reasoningHu:
        'TN-C-S rendszerben a PEN-t egy ponton szétválasztjuk védővezetőre és nullára. A PEN először a PE-sínre megy: ha később a híd vagy az N-ág szakad, a védővezető akkor is a hálózat PEN-jén marad. A híd viszi át a nullát az N-sínre. A szétválasztás után az N és a PE soha többé nem köthető össze. A PE-sínhez kapcsolódik a fő földelősín, erre jön a földelő és az EPH.',
      questionHu: 'Hova kell kötni a mérőből kijövő PEN-t elsőként?',
      options: [
        'Az N-sínre, onnan híddal a PE-sínre',
        'A PE-sínre, onnan híddal az N-sínre',
        'Közvetlenül a Fi-relé N kapcsára',
        'A földelőre, a sínek kihagyásával',
      ],
      correct: 1,
      hintHu: 'Melyik vezető folytonossága fontosabb az életvédelem szempontjából?',
      explanationHu:
        'A PEN ELŐSZÖR a PE-sínre kerül, onnan a híd viszi át az N-sínre. Így a védővezető a lehető legbiztosabban kapcsolódik a hálózat PEN-jéhez.',
    },
    {
      id: 'j-s3',
      titleHu: 'Túlfeszültség-védelem a mérőszekrényben',
      goalHu: 'Két ELMARK SPD-C10-et bekötni: SP1 L/N kapcsát a mérő 2-es kapcsára (L-PE), SP2 L/N kapcsát az N-sínre (N-PE), mindkét ⏚ kapcsot a PE-sínre.',
      focus: ['SP1', 'SP2', 'KWH', 'PEN'],
      reasoningHu:
        'Az SPD a mért oldalon, a Fi-relé ELŐTT van, így a levezetett túlfeszültség-impulzus nem folyik át a Fi összegző áramváltóján, és nem okoz hamis kioldást. Egyfázisú TN-S oldalon két 1 pólusú T2 modul kell: egy a fázis és a PE, egy a nulla és a PE között. Az SPD normál üzemben nem vezet, ezért a bekötése nem zárlat. A PE-csatlakozás nélkül hatástalan, a vezetékeket röviden kell tartani.',
      questionHu: 'Miért kerül az SPD a Fi-relé ELÉ?',
      options: [
        'Mert a Fi-relé mögött nem fér el',
        'Mert a levezetett impulzus különben átfolyna a Fi-n és kioldaná',
        'Mert a Fi-relé véd a túlfeszültség ellen',
        'Mert az SPD csak fázist kapcsol',
      ],
      correct: 1,
      hintHu: 'Merre folyik a levezetett áram, ha az SPD a Fi mögött van?',
      explanationHu:
        'A Fi mögé kötött SPD az impulzusáramot a PE-re vezeti - ezt a Fi hibaáramnak látja és kiold. Ezért az SPD a Fi előtt, a mért oldalon van. A pontos helyet a vizsgáztatóval egyeztesd.',
    },
    {
      id: 'j-s4',
      titleHu: 'Mért fővezeték a lakás főelosztóba',
      goalHu: 'A mérő 2-es kapcsáról a fázist az FM-re, az N-sínről a nullát a Fi N bemenetére, a PE-sínről a védővezetőt a főelosztó PE-sínjére vezetni.',
      focus: ['KWH', 'PEN', 'FM', 'FI', 'PB'],
      reasoningHu:
        'A szétválasztás után a mért fővezeték már háromerű: L, N és PE (TN-S szakasz). A PE nem megy át semmilyen kapcsolókészüléken, egyenesen a főelosztó PE-sínjére kerül. A nulla a Fi-relén halad át, a fázis előbb az FM főkismegszakítón.',
      questionHu: 'Hány ér megy a mérőszekrényből a lakás főelosztóba ebben a feladatban?',
      options: ['Kettő: L és PEN', 'Három: L, N és PE', 'Négy: L, N, PE és EPH', 'Egy: csak L'],
      correct: 1,
      hintHu: 'A szétválasztás a mérőszekrényben történt.',
      explanationHu:
        'A szétválasztás után L, N és PE megy tovább külön vezetőként. EPH-vezető nem megy a főelosztóba, az a fő földelősínre fut.',
    },
    {
      id: 'j-s5',
      titleHu: 'Főelosztó: FM, Fi-relé, kismegszakítók',
      goalHu: 'Az FM kimenetét a Fi 1-es kapcsára, a Fi 2-es kimenetét az F-1 (B16) és F-2 (B10) bemenetére, a Fi N kimenetét a Fi utáni N-sínre kötni.',
      focus: ['FM', 'FI', 'F1', 'F2', 'NB'],
      reasoningHu:
        'Az IDEAL KRD10 Fi-relé felső kapcsai az 1 és az N (bemenet), az alsók a 2 és az N (kimenet). A Fi mögött ágazik szét a két áramkör: a B16-os dugaljkör és a B10-es világítási kör. A fogyasztói nulla kizárólag a Fi utáni N-sínről jöhet.',
      questionHu: 'Honnan kapja a nulláját a dugalj és a lámpa?',
      options: [
        'A mérőszekrény N-sínjéről',
        'A Fi-relé N kimenetéről táplált N-sínről',
        'A PE-sínről',
        'A mérő 4-es kapcsáról',
      ],
      correct: 1,
      hintHu: 'A fázisáramnak és a visszatérő áramnak is át kell mennie a Fi-n.',
      explanationHu:
        'A Fi utáni N-sín adja a fogyasztói nullát. Ha a nulla a Fi előtti oldalról jönne, a Fi megkerülése érvénytelen vizsgát jelent.',
    },
    {
      id: 'j-s6',
      titleHu: 'Dugaljkör és világítás',
      goalHu: 'F-1 → X1 dugalj (L, N, PE); F-2 → S1 kapcsoló (L → 1) → E1 lámpa, a lámpa N-je a Fi utáni N-sínről.',
      focus: ['F1', 'F2', 'X1', 'S1', 'E1', 'NB', 'PB'],
      reasoningHu:
        'A kapcsoló mindig a fázist szakítja: az F-2 kimenete a Niloé kapcsoló L kapcsára megy, az 1-es kapocs a lámpára. A dugalj védőérintkezője a főelosztó PE-sínjéről kapja a védővezetőt, kapcsolón vagy megszakítón át soha.',
      questionHu: 'Melyik vezetőt kapcsolja az S1 kapcsoló?',
      options: ['A nullát', 'A fázist', 'A védővezetőt', 'A fázist és a védővezetőt'],
      correct: 1,
      hintHu: 'Kikapcsolt állapotban mi marad feszültség alatt a foglalatban?',
      explanationHu:
        'A fázist kapcsoljuk, így kikapcsolt állapotban a foglalat feszültségmentes. A védővezetőt kapcsolni érvénytelen vizsgát jelent.',
    },
    {
      id: 'j-s7',
      titleHu: 'EPH: egyenpotenciálú összekötés',
      goalHu: 'A víz-, gáz- és fűtési fővezeték fém csövét külön zöld-sárga vezetővel a fő földelősínre kötni.',
      focus: ['EPH', 'EV', 'EG', 'EF', 'RE'],
      reasoningHu:
        'Az MSZ HD 60364-4-41 411.3.1.2 szerint minden épületben a földelővezetőt, a fő földelőkapcsot és az épületbe belépő vezetőképes részeket (közüzemi csővezetékek: víz, gáz; hozzáférhető szerkezeti idegen vezetőképes részek; fémes központi fűtés és légkondicionálás; a vasbeton fémrészei, ha hozzáférhetők; távközlési kábelek fémköpenye) be kell kötni az egyenpotenciálú összekötésbe, a belépési ponthoz a lehető legközelebb. A fő földelősínhez csatlakozó EPH-vezető legalább 6 mm² réz.',
      questionHu: 'Mekkora a fő földelősínhez csatlakozó védő egyenpotenciálra hozó vezető legkisebb keresztmetszete rézből?',
      options: ['1,5 mm²', '2,5 mm²', '6 mm²', '50 mm²'],
      correct: 2,
      hintHu: 'MSZ HD 60364-5-54: réz, alumínium, acél - három különböző minimum.',
      explanationHu:
        'Réz esetén 6 mm², alumínium esetén 16 mm², acél esetén 50 mm² a minimum (MSZ HD 60364-5-54 szerinti tananyag, forrás a feladat leírásában).',
    },
    {
      id: 'j-s8',
      titleHu: 'Mérés és dokumentálás',
      goalHu: 'Feszültségmentesen PE-folytonosságot és szigetelést, engedéllyel feszültség alatt L-N, L-PE, N-PE feszültséget mérni, Fi-próbát végezni, és mindent jegyzőkönyvezni.',
      focus: ['PEN', 'EPH', 'PB', 'X1', 'FI'],
      reasoningHu:
        'A sorrend kötött: szemrevételezés, PE-folytonosság (a főáramkörre és az EPH-ra), szigetelési ellenállás bontott PEN-híddal és kihúzott SPD-betétekkel, majd feszültség alatt a hálózati feszültség három értéke, a Fi-próba és a működési próba a vizsgabizottság tagja előtt. TN-C-S rendszerben L-N és L-PE közel azonos (≈ 230 V), N-PE közel 0 V.',
      questionHu: 'Mit jelez, ha a dugaljon L-PE ≈ 0 V, miközben L-N ≈ 230 V?',
      options: [
        'Mindent rendben',
        'A PE nem jut el a dugaljig (szakadt védővezető)',
        'A nulla szakadt',
        'Az SPD kioldott',
      ],
      correct: 1,
      hintHu: 'Melyik vezető hiányzik a mérési körből?',
      explanationHu:
        'Ha a fázis és a PE között nincs feszültség, a PE nem kapcsolódik a hálózathoz: szakadt vagy bekötetlen védővezető. Ez súlyos érintésvédelmi hiba, a berendezés nem helyezhető üzembe.',
    },
  ],
  exam: [
    {
      id: 'j-q1',
      promptHu: 'Sorolja fel az EPH-hálózatba a szabvány szerint bekötendő vezetőképes részeket! Melyik felsorolás helyes?',
      options: [
        'Csak a vízvezeték és a gázvezeték',
        'Földelővezető, fő földelőkapocs; közüzemi csővezetékek (víz, gáz); hozzáférhető szerkezeti idegen vezetőképes részek; fémes központi fűtés és légkondicionálás; a vasbeton hozzáférhető, összekötött fémrészei; a távközlési kábelek fémköpenye',
        'Minden villamos készülék teste és a nullavezető',
        'A dugaljak védőérintkezői és a lámpatestek',
      ],
      correct: 1,
      category: 'biztonsagi-szemlelet',
      explanationHu:
        'MSZ HD 60364-4-41:2007, 411.3.1.2 (összefoglaló: hobbielektronika.hu/forum/getfile.php?id=75085). Az épületbe kívülről bevezetett részeket a belépési ponthoz a lehető legközelebb kell bekötni.',
    },
    {
      id: 'j-q2',
      promptHu: 'A kialakított hálózatról milyen fő szabály mondható el (EPH)?',
      options: [
        'Az EPH-vezető kapcsolóval leválasztható karbantartáshoz',
        'Az EPH-ba kötött vezetőképes részek és a védővezető azonos potenciálon vannak, ezért közöttük hiba esetén sem léphet fel veszélyes érintési feszültség; az összekötés a táplálás önműködő lekapcsolásával működő védelem elhagyhatatlan része, és nem szakítható meg',
        'Az EPH a nullavezetőt helyettesíti',
        'Az EPH-vezetőt a gázcsövön keresztül is lehet folytatni',
      ],
      correct: 1,
      category: 'biztonsagi-szemlelet',
      explanationHu:
        'Az egyenpotenciálú összekötés az önműködő lekapcsolással működő áramütés elleni védelem szerves, elhagyhatatlan része; a védővezetőbe kapcsolóeszközt beiktatni tilos, csak szerszámmal bontható vizsgálati csatlakozás megengedett. Fém víz- és gázcső nem használható védővezetőként. (Források: hobbielektronika.hu/forum/getfile.php?id=75085 és id=410112.)',
    },
    {
      id: 'j-q3',
      promptHu: 'A Qoltec 50888 mérőn melyik kapocspáron halad a fázis és melyiken a nulla (PEN)?',
      options: ['L: 1 → 3, N: 4 → 6', 'L: 1 → 2, N: 3 → 4', 'L: 2 → 1, N: 4 → 3', 'L: 5 → 6, N: 1 → 2'],
      correct: 1,
      category: 'keszulekismeret',
      explanationHu: 'A készülékre nyomtatott rajz szerint 1 = L be, 2 = L ki, 3 = N be, 4 = N ki; az 5-6 az impulzuskimenet.',
    },
    {
      id: 'j-q4',
      promptHu: 'Hol a helye a túlfeszültség-védőnek (SPD) ebben a feladatban?',
      options: [
        'A Fi-relé után, a dugaljkörben',
        'A mért oldalon, a mérő és a főbiztosító után, a Fi-relé ELŐTT; L-PE és N-PE között',
        'A mérő előtt, a méretlen oldalon, PE nélkül',
        'A lámpa és a kapcsoló között',
      ],
      correct: 1,
      category: 'bekotesi-pontossag',
      explanationHu: 'A Fi előtt, hogy a levezetett impulzus ne oldja ki a Fi-t; PE nélkül hatástalan. A pontos helyet és a TN-C-S bekötést egyeztesd a vizsgáztatóval.',
    },
    {
      id: 'j-q5',
      promptHu: 'Miért minősül érvénytelen vizsgának, ha a szétválasztás után az N és a PE újra összeér?',
      options: [
        'Mert a mérő többet mér',
        'Mert a PE-n üzemi áram folyik, a Fi-relé nem tud hibaáramot érzékelni, és a testek feszültség alá kerülhetnek',
        'Mert a lámpa nem világít',
        'Nem érvénytelen, csak esztétikai hiba',
      ],
      correct: 1,
      category: 'biztonsagi-szemlelet',
      explanationHu: 'A TN-C-S rendszerben a szétválasztás után az N és a PE soha nem köthető össze - ez áramütés elleni védelmi hiba.',
    },
    {
      id: 'j-q6',
      promptHu: 'Mivel ellenőrzi a főáramkör érintésvédelmét a feladatlap szerint?',
      options: [
        'A mérő számlálójával',
        'A védővezető folytonosságának mérésével (< 1 Ω), dokumentálva',
        'A Fi tesztgombjával feszültségmentesen',
        'Szemrevételezéssel, mérés nélkül',
      ],
      correct: 1,
      category: 'ellenorzesi-sorrend',
      explanationHu: 'PE-folytonosság-mérés feszültségmentesen, legalább 0,2 A mérőárammal; az eredményt jegyzőkönyvbe kell írni.',
    },
    {
      id: 'j-q7',
      promptHu: 'TN-C-S rendszerben mit vársz a dugaljon mért N-PE feszültségre?',
      options: ['≈ 230 V', '≈ 400 V', 'Közel 0 V (néhány V alatt)', 'Pontosan 115 V'],
      correct: 2,
      category: 'mukodes-megertese',
      explanationHu: 'Az N és a PE ugyanabból a PEN-ből ered, ezért közöttük csak a nulla feszültségesése mérhető. Nagy N-PE feszültség szakadt vagy felcserélt vezetőre utal.',
    },
    {
      id: 'j-q8',
      promptHu: 'Melyik a helyes ellenőrzési sorrend?',
      options: [
        'Feszültség alá helyezés, Fi-próba, majd PE-folytonosság',
        'Szemrevételezés, PE-folytonosság, szigetelés (híd bontva, SPD-betétek kihúzva), majd engedéllyel feszültség alatt L-N/L-PE/N-PE, Fi-próba, működési próba',
        'Szigetelésmérés feszültség alatt, majd PE-folytonosság',
        'Csak a működési próba a bizottság előtt',
      ],
      correct: 1,
      category: 'ellenorzesi-sorrend',
      explanationHu: 'A feszültségmentes mérések mindig megelőzik a feszültség alá helyezést (MSZ HD 60364-6 sorrend).',
    },
  ],
  unresolved: [
    {
      id: 'j-u1',
      labelHu: 'Az SPD pontos helye és a TN-C-S bekötés (hol válik szét a PEN: mérőszekrényben vagy főelosztóban) - az SPD pontos helyét és a TN-C-S bekötést egyeztesd a vizsgáztatóval.',
      missingHu: [
        'A szolgáltató (áramszolgáltatói műszaki előírás) és a vizsgaközpont gyakorlata',
        'A feladatlap nem rajzolja meg a szétválasztás helyét',
        'A mérőszekrény és a főelosztó gyártói kialakítása',
      ],
      typicalExampleHu:
        'Oktatási példa, nem a megoldás: a modell a mérő után, a mérőszekrényben választja szét a PEN-t, és ott köti be az SPD-ket.',
    },
    {
      id: 'j-u2',
      labelHu: 'A főbiztosító (F-0) és az FM főkismegszakító névleges értéke - a feladatlapból nem következik.',
      missingHu: ['A csatlakozási teljesítmény és a szolgáltatói előírás', 'A fővezeték keresztmetszete'],
    },
    {
      id: 'j-u3',
      labelHu: 'Az EPH-kérdések pontos, elvárt megfogalmazása - a modell válaszai másodlagos forrásokra épülnek (szakcikk és tanfolyami anyag), a hivatalos szabványszöveget az MSZ HD 60364-4-41:2007 és MSZ HD 60364-5-54 kiadvány adja.',
      missingHu: [
        'Az MSZ HD 60364-4-41:2007 411.3.1.2 és az MSZ HD 60364-5-54 544.1 hivatalos szövege',
        'A vizsgabizottság által elfogadott válaszminta',
      ],
    },
    {
      id: 'j-u4',
      labelHu: 'Az épületben ténylegesen bekötendő EPH-elemek - a táblán csak jelképes víz-, gáz- és fűtési csatlakozás van.',
      missingHu: ['A valós épület gépészeti kialakítása (fém vagy műanyag cső, fűtés, klíma, vasbeton)'],
    },
  ],
};
