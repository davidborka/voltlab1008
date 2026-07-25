import type { TaskContent } from '../../domain/electrical-types';

export const contentB: TaskContent = {
  objectivesHu: [
    'A tanuló el tudja olvasni az egyfázisú, 230 V-os épületvillamossági rajzot, és fel tudja bontani három önálló körre: F-1 lépcsőházi automata, F-2 keresztkapcsolás, F-3 dugalj.',
    'Helyes sorrendben építi ki a betáplálást és a védelmet: SUP, Fi-relé (FI), kismegszakítók (F1, F2, F3), N-sín (NB) a Fi-relé kimeneti nullájáról, PE-sín (PB) közvetlenül a betáplálásból.',
    'Két nyomógombról (S1, S2) indítható vezérlést épít a lépcsőházi automata (LA) 3-as kapcsára, és be tudja kötni az E1 lámpát a 4-es kapocsról.',
    'Meg tudja tervezni és be tudja kötni a három helyről működő keresztkapcsolást a K1 váltó - K2 keresztkapcsoló - K3 váltó - E2 lámpa útvonalon.',
    'Meg tudja mondani, hogy az egyes szakaszokra hány eres kábel kell, és hol vannak a kötéspontok (kötődobozok, sínek, készülékdobozok).',
    'Be tudja kötni a védőérintkezős dugaljat (X1) az F3 körére, a PE-t a PE-sínről.',
    'A teljes szerelést feszültségmentes vizsgatáblán végzi, és a végén rendezett, ellenőrizhető, jelölés szerinti munkát ad át.',
    'A rajzon üresen hagyott adatokat (kismegszakító névleges áram, Fi-relé adatai) nem pótolja találgatással, hanem hiányzó paraméterként kezeli.',
  ],
  commonMistakesHu: [
    'A keresztkapcsoló bemeneti (1, 2) és kimeneti (3, 4) kapocspárját összekeverik, ezért a kapcsolás csak részben vagy egyáltalán nem működik, és zárlat is keletkezhet.',
    'A keresztkapcsolót a hálózat fázisa és a lámpa közé, végponti helyzetbe teszik, holott annak a két váltókapcsoló közé, a váltóvezetékek útjába kell kerülnie.',
    'A K1 vagy K3 váltókapcsoló közös (P) kapcsát felcserélik az 1-es vagy 2-es váltókapoccsal.',
    'A K1 és K2, illetve a K2 és K3 közötti szakaszra kevesebb eret húznak be, mint amennyi kell, ezért utólag újra kell kábelezni.',
    'A lámpa nulláját a kapcsoló felől próbálják megoldani ahelyett, hogy közvetlenül az N-sínről vinnék.',
    'Az S1 és S2 nyomógombot sorba kötik párhuzamos helyett, így csak egyszerre nyomva indul a lépcsőházi automata.',
    'A lépcsőházi automata 3-as vezérlő és 4-es lámpakimeneti kapcsát felcserélik.',
    'Az N-sínt a Fi-relé elől táplálják meg, ezzel hatástalanná teszik a hibaáramvédelmet.',
    'A PE vezetőt átfűzik a Fi-relén, vagy a dugalj PE kapcsát bekötetlenül hagyják.',
    'A kötéspontokat rendezetlenül, jelölés nélkül hagyják, így a hibakeresés és az ellenőrzés utólag nehézkes.',
    'A rajzon üresen hagyott áramértékeket kitalálják, ahelyett hogy hiányzó adatként jeleznék.',
  ],
  guided: [
    {
      id: 'b-1',
      titleHu: 'Betáplálás, Fi-relé, N-sín és PE-sín',
      goalHu: 'A SUP betáplálás bekötése a Fi-relé bemenetére, a védett hálózat indítása a kimenetről, a sínek helyes megtáplálása.',
      focus: ['SUP', 'FI', 'NB', 'PB'],
      reasoningHu:
        'A betáplálás fázisa a Fi-relé L1, nullája az N1 bemeneti kapcsára megy. A kimeneti oldalon az L2 adja a fázist a kismegszakítóknak, az N2 pedig az N-sínt (NB) táplálja. A védővezető a betáplálásból közvetlenül a PE-sínre (PB) megy, a Fi-relét megkerülve. Ez a rész adja a teljes tábla védelmi alapját, ezért ezzel kezdünk, és csak utána nyúlunk a fogyasztói körökhöz.',
      questionHu: 'Melyik kapcsokra érkezik a betáplálás a Fi-relén, és melyekről indul a védett hálózat?',
      options: [
        'Be: L2, N2 - ki: L1, N1',
        'Be: L1, N1 - ki: L2, N2',
        'Be: L1, PE - ki: N1, N2',
        'Mindegy, a Fi-relé mindkét irányban ugyanúgy működik',
      ],
      correct: 1,
      hintHu: 'A készülék kapocsjelölése a rajzon egyértelműen megmondja a be- és kimeneti oldalt.',
      explanationHu:
        'A betáplálás az L1 és N1 bemeneti kapcsokra kerül, a védett hálózat pedig az L2 és N2 kimeneti kapcsokról indul. Az L2 a kismegszakítókhoz, az N2 az N-sínhez megy. A védővezető nem halad át a készüléken, azt közvetlenül a PE-sínre kell kötni.',
    },
    {
      id: 'b-2',
      titleHu: 'A három kör szétosztása a kismegszakítókra',
      goalHu: 'Az F1, F2, F3 kismegszakító táplálása és a három fogyasztói kör kiindulási pontjának meghatározása.',
      focus: ['FI', 'F1', 'F2', 'F3'],
      reasoningHu:
        'A Fi-relé L2 kimenetéről mindhárom kismegszakító 1-es kapcsára el kell juttatni a fázist. Innen indul a három kör: F1 a lépcsőházi automatához, F2 a keresztkapcsoláshoz, F3 a dugaljhoz. Fontos, hogy a körök fázisai szétváljanak, de a nulla mindhárom körnél az N-sínről érkezzen. Ha most gondosan végiggondoljuk, melyik kör merre indul, a későbbi kábelezésnél nem kell visszabontani.',
      questionHu: 'Honnan indul a keresztkapcsolás (F-2 kör) fázisa?',
      options: [
        'Az F2 kismegszakító 2-es kapcsáról',
        'Az F2 kismegszakító 1-es kapcsáról',
        'Közvetlenül a Fi-relé L2 kapcsáról',
        'Az N-sínről',
      ],
      correct: 0,
      hintHu: 'A kismegszakító 1-es kapcsa a betáplálás, a 2-es a fogyasztó felé néz.',
      explanationHu:
        'A fázis a Fi-relé L2 kapcsáról az F2 kismegszakító 1-es kapcsára, majd a kismegszakítón át a 2-es kapocsról indul tovább a keresztkapcsolás felé. Így a kör a kismegszakító túláram- és zárlatvédelme mögött van.',
    },
    {
      id: 'b-3',
      titleHu: 'A lépcsőházi automata táplálása (F-1 kör)',
      goalHu: 'Az LA készülék L és N kapcsának bekötése, a vezérlő és a kimeneti kapcsok elkülönítése.',
      focus: ['F1', 'LA', 'NB'],
      reasoningHu:
        'Az F1 kismegszakító 2-es kapcsáról a fázis az automata L kapcsára, az N-sínről a nulla az N kapcsára megy. Az automata négy kapcsa négy különböző feladatot lát el: L és N a saját tápellátás, 3 a vezérlő bemenet, 4 a lámpakimenet. Ha ezt a négy szerepet a szerelés elején tisztázzuk, a vezérlés és a lámpakör bekötése már nem keverhető össze.',
      questionHu: 'Melyik kapocspár adja a lépcsőházi automata saját tápellátását?',
      options: ['A 3 és 4', 'Az L és a 3', 'Az L és az N', 'A 4 és az N'],
      correct: 2,
      hintHu: 'Az elektronikának állandó feszültség kell, függetlenül attól, hogy ég-e a lámpa.',
      explanationHu:
        'Az L és N kapocs a készülék üzemi táplálása. A 3-as kapocs a nyomógombok felől érkező vezérlő jelet fogadja, a 4-es kapocs pedig a kapcsolt fázist adja a lámpára.',
    },
    {
      id: 'b-4',
      titleHu: 'Két nyomógomb párhuzamos bekötése a vezérlő kapocsra',
      goalHu: 'Az S1 és S2 nyomógomb záró (NO) érintkezőjének párhuzamos bekötése az LA 3-as kapcsára.',
      focus: ['S1', 'S2', 'LA', 'F1'],
      reasoningHu:
        'Az F1 kör fázisát el kell vinni mindkét nyomógomb 3-as kapcsára, a nyomógombok 4-es kapcsa pedig összekötve megy az automata 3-as kapcsára. Ez párhuzamos kötés: bármelyik gomb megnyomása önmagában elegendő az indításhoz. A vezérlő áramkör kis áramot visz, de ugyanúgy fázisos, tehát ugyanolyan gondossággal kell szerelni, mint a főáramkört. Ha a két gombot sorba kötnénk, csak egyidejű nyomásra indulna a világítás.',
      questionHu: 'Az S1 és S2 nyomógomb 4-es kapcsai hova kerülnek?',
      options: [
        'Külön-külön az automata 3-as és 4-es kapcsára',
        'Összekötve az automata 3-as kapcsára',
        'Összekötve az automata 4-es kapcsára',
        'Az N-sínre',
      ],
      correct: 1,
      hintHu: 'Az indítás vagylagos: elég az egyik gomb.',
      explanationHu:
        'Mindkét nyomógomb kimenete, a 4-es kapocs, közösen az automata 3-as vezérlő kapcsára megy. Ez a párhuzamos kötés teszi lehetővé, hogy bármelyik helyről el lehessen indítani a világítást. A 4-es kapocs az automata kimenete, oda vezérlőjelet vinni hibás bekötés.',
    },
    {
      id: 'b-5',
      titleHu: 'Az E1 lámpa bekötése és a nulla útja',
      goalHu: 'Az E1 lámpa fázisának bekötése az LA 4-es kapcsáról, a nulla bekötése az N-sínről.',
      focus: ['LA', 'E1', 'NB'],
      reasoningHu:
        'Az automata 4-es kapcsáról a kapcsolt fázis megy az E1 lámpa 1-es kapcsára, a lámpa 2-es kapcsa pedig az N-sínre. A lámpa nulláját mindig közvetlenül az N-sínről vezetjük, nem valamelyik szomszédos körről leágazva, mert a körök keveredése zavart okoz, és a hibakeresést is megnehezíti. A nyomógombos indítás után az automata a beállított időzítés végéig tartja bekapcsolva a kimenetet.',
      questionHu: 'Honnan kapja az E1 lámpa a nullát?',
      options: [
        'Az automata N kapcsáról leágazva',
        'Közvetlenül az N-sínről (NB)',
        'Az S1 nyomógomb 3-as kapcsáról',
        'A PE-sínről',
      ],
      correct: 1,
      hintHu: 'A nullák gyűjtőhelye a táblában egyetlen sín.',
      explanationHu:
        'A lámpa nullája közvetlenül az N-sínről érkezik, amelyet a Fi-relé N2 kimenete táplál. Az automata N kapcsa a készülék saját tápellátása, arra nem szabad fogyasztót felfűzni. A PE kizárólag védővezető, üzemi áramot nem szállíthat.',
    },
    {
      id: 'b-6',
      titleHu: 'A keresztkapcsolás első szakasza: K1 váltó és a keresztkapcsoló bemenete',
      goalHu: 'Az F2 fázisának bekötése a K1 váltókapcsoló P kapcsára, majd a két váltóvezeték továbbvitele a K2 keresztkapcsoló 1-es és 2-es kapcsára.',
      focus: ['F2', 'K1', 'K2'],
      reasoningHu:
        'A keresztkapcsolás mindig váltó - kereszt - váltó sorrendben épül fel. Az F2 kismegszakító 2-es kapcsáról a fázis a K1 váltókapcsoló P (közös) kapcsára megy. A K1 1-es és 2-es kapcsáról két váltóvezeték indul a K2 keresztkapcsoló bemeneti oldalára, az 1-es és 2-es kapocsra. Erre a szakaszra tehát két eret kell behúzni, plusz a szerelési mód szerint szükséges védővezetőt. A kötéspontok a készülékdobozokban vannak, a szakaszokat érdemes már behúzáskor megjelölni, hogy a két váltóvezeték ne cserélődjön össze a P vezetékkel.',
      questionHu: 'Hány eret kell behúzni a K1 és a K2 közötti szakaszra a kapcsolás működéséhez?',
      options: [
        'Egyet, a kapcsolt fázist',
        'Kettőt, a két váltóvezetéket',
        'Hármat: fázist, nullát és kapcsolt fázist',
        'Négyet, mert a keresztkapcsolónak négy kapcsa van',
      ],
      correct: 1,
      hintHu: 'A keresztkapcsoló négy kapcsa két bemeneti és két kimeneti kapocsra oszlik.',
      explanationHu:
        'A K1 és K2 közötti szakaszon két váltóvezeték fut: a K1 1-es kapcsáról a K2 1-es kapcsára, és a K1 2-es kapcsáról a K2 2-es kapcsára. A keresztkapcsoló négy kapcsából kettő a bemeneti, kettő a kimeneti oldal, ezért a szakaszonként szükséges vezetékszám kettő. A védővezetőt a szerelési mód és a készülékek igénye szerint kell külön vinni.',
    },
    {
      id: 'b-7',
      titleHu: 'A keresztkapcsolás második szakasza: K2 kimenete, K3 váltó és az E2 lámpa',
      goalHu: 'A K2 keresztkapcsoló 3-as és 4-es kapcsának bekötése a K3 váltókapcsoló 1-es és 2-es kapcsára, majd a K3 P kapcsáról a lámpa megtáplálása.',
      focus: ['K2', 'K3', 'E2', 'NB'],
      reasoningHu:
        'A K2 keresztkapcsoló 3-as és 4-es kapcsáról ismét két váltóvezeték indul, ezek a K3 váltókapcsoló 1-es és 2-es kapcsára mennek. A K3 P (közös) kapcsáról egyetlen kapcsolt fázisvezeték megy az E2 lámpa 1-es kapcsára, a lámpa 2-es kapcsa pedig az N-sínre. A keresztkapcsoló működése az, hogy átbillentve felcseréli a két váltóvezeték útját, ezért a középső helyről is át lehet kapcsolni a lámpa állapotát. Ha a bemeneti és kimeneti kapocspárt összekeverjük, a kapcsolás vagy nem működik, vagy a két váltóvezeték összezárásával zárlatot okozunk.',
      questionHu: 'Mit csinál a K2 keresztkapcsoló átbillentéskor?',
      options: [
        'Megszakítja a lámpa áramkörét, mint egy egysarkú kapcsoló',
        'Felcseréli a két váltóvezeték útját a bemeneti és a kimeneti oldal között',
        'Átkapcsolja a lámpa nulláját a fázisra',
        'Csak akkor hat, ha a K1 és K3 azonos állásban van',
      ],
      correct: 1,
      hintHu: 'Ezért hívják keresztkapcsolónak: a két útvonal keresztezi egymást.',
      explanationHu:
        'A keresztkapcsoló egyenes állásban átvezeti, keresztezett állásban felcseréli a két váltóvezetéket. Ezzel a K1 és K3 váltókapcsoló közé beiktatva egy harmadik kapcsolási helyet ad, és bármelyik három hely bármikor megváltoztathatja az E2 lámpa állapotát. Több kapcsolási helyhez több keresztkapcsolót lehet a váltóvezetékek útjába sorolni.',
    },
    {
      id: 'b-8',
      titleHu: 'Dugalj bekötése és záró ellenőrzés',
      goalHu: 'Az X1 dugalj L, N, PE bekötése az F3 körén, majd a teljes tábla feszültségmentes ellenőrzése.',
      focus: ['F3', 'X1', 'NB', 'PB', 'K1', 'K2', 'K3', 'LA'],
      reasoningHu:
        'Az F3 kismegszakító 2-es kapcsáról a fázis az X1 dugalj L kapcsára, az N-sínről a nulla az N kapcsára, a PE-sínről a védővezető a PE kapocsra megy. Ezután következik az ellenőrzés, végig feszültségmentes állapotban: szemrevételezés a rajz alapján kör körönként, a kötéspontok és a kapcsok szorításának ellenőrzése, a keresztkapcsolás útvonalának végigkövetése K1 - K2 - K3 - E2 sorrendben, majd a védővezető folytonosságának mérése és szigetelésvizsgálat. Feszültség alá helyezés és működési próba csak a vizsgáztató engedélyével, minden más ellenőrzés után jöhet szóba.',
      questionHu: 'A tábla kész, de a K1, K2 és K3 közötti bekötés helyessége kérdéses. Hogyan ellenőrizd feszültségmentes állapotban?',
      options: [
        'Feszültség alá kell helyezni, mert másképp nem dönthető el',
        'A rajz alapján végig kell követni az útvonalat, majd folytonosságméréssel ellenőrizni a szakaszokat a kapcsolók különböző állásaiban',
        'Elég megnézni, hogy minden vezeték be van-e kötve',
        'Meg kell mérni a szigetelési ellenállást feszültség alatt',
      ],
      correct: 1,
      hintHu: 'A folytonosságmérés feszültségmentes állapotban is megmutatja, hol zár és hol nyit egy útvonal.',
      explanationHu:
        'A keresztkapcsolás feszültségmentesen is teljesen ellenőrizhető: a rajz alapján végigkövetjük az útvonalat, majd folytonosságméréssel megnézzük, hogy a kapcsolók különböző állásaiban a K1 P kapcsa és az E2 felőli pont között megfelelően záródik és nyílik-e az áramkör. Bekapcsolásra ehhez nincs szükség, és a vizsgatáblán a szerelés végig feszültségmentes marad.',
    },
  ],
  exam: [
    {
      id: 'b-e1',
      promptHu: 'A rajz szerint milyen sorrendben követik egymást a készülékek az F-2 körön?',
      options: [
        'F2 - K2 keresztkapcsoló - K1 váltó - K3 váltó - E2',
        'F2 - K1 váltó - K2 keresztkapcsoló - K3 váltó - E2',
        'F2 - K1 váltó - K3 váltó - K2 keresztkapcsoló - E2',
        'F2 - E2 - K1 - K2 - K3',
      ],
      correct: 1,
      category: 'rajzolvasas',
      explanationHu:
        'A keresztkapcsolás felépítése mindig váltó - kereszt - váltó, a lámpa pedig a második váltókapcsoló közös kapcsa után következik. A keresztkapcsoló a két váltókapcsoló közé, a váltóvezetékek útjába kerül, nem a kör végére vagy elejére.',
    },
    {
      id: 'b-e2',
      promptHu: 'Melyik kapocspár a keresztkapcsoló bemeneti oldala ebben a kapcsolásban?',
      options: ['Az 1 és 2', 'A 3 és 4', 'Az 1 és 3', 'A P és az 1'],
      correct: 0,
      category: 'keszulekismeret',
      explanationHu:
        'A K2 keresztkapcsoló 1-es és 2-es kapcsa fogadja a K1 váltókapcsoló felől érkező két váltóvezetéket, a 3-as és 4-es kapocs pedig a K3 váltókapcsoló felé adja tovább. A keresztkapcsolónak nincs közös (P) kapcsa, az csak a váltókapcsolókon van.',
    },
    {
      id: 'b-e3',
      promptHu: 'Hány eres kábelt kell behúzni a K2 keresztkapcsoló és a K3 váltókapcsoló közötti szakaszra, ha a védővezetőt is figyelembe vesszük?',
      options: [
        'Egy eret, a kapcsolt fázist',
        'Két eret a két váltóvezetéknek, plusz a szerelési mód szerinti védővezetőt',
        'Négy eret, mert a keresztkapcsolónak négy kapcsa van',
        'Két eret: fázist és nullát',
      ],
      correct: 1,
      category: 'bekotesi-pontossag',
      explanationHu:
        'A két készülék között a két váltóvezeték fut, tehát két érre van szükség a működéshez, mellé pedig a szerelési mód és a készülékek igénye szerinti védővezető. A keresztkapcsoló négy kapcsa két bemeneti és két kimeneti kapocsra oszlik, nem négy külön útvonalra.',
    },
    {
      id: 'b-e4',
      promptHu: 'Hol van az E2 lámpa nullájának kötéspontja?',
      options: [
        'A K3 váltókapcsoló 2-es kapcsán',
        'Az N-sínen (NB), ahonnan közvetlen vezeték megy a lámpához',
        'A K2 keresztkapcsoló 4-es kapcsán',
        'A PE-sínen (PB)',
      ],
      correct: 1,
      category: 'bekotesi-pontossag',
      explanationHu:
        'A kapcsolók csak a fázist kapcsolják, a lámpa nullája közvetlenül az N-sínről érkezik. A PE kizárólag védővezető, azon üzemi áram nem folyhat, ezért lámpa nullájaként semmilyen körülmények között nem használható.',
    },
    {
      id: 'b-e5',
      promptHu: 'Mi történik, ha a K2 keresztkapcsolón a 2-es és a 3-as kapcsot használjuk bemenetnek?',
      options: [
        'Semmi, a keresztkapcsoló szimmetrikus',
        'A kapcsolás csak az egyik helyről fog működni, vagy a két váltóvezeték összezárásakor zárlat keletkezik',
        'A lámpa félfényen fog világítani',
        'Csak a K3 kapcsoló válik hatástalanná, a K1 rendben marad',
      ],
      correct: 1,
      category: 'mukodes-megertese',
      explanationHu:
        'A keresztkapcsolónál a kapocspárok kötöttek: az 1 és 2 a bemenet, a 3 és 4 a kimenet. Ha egy bemeneti és egy kimeneti kapcsot használunk azonos oldalon, a készülék nem tudja felcserélni a két útvonalat, a kapcsolás hibásan működik, és a két váltóvezeték összezárásával zárlat is létrejöhet.',
    },
    {
      id: 'b-e6',
      promptHu: 'Miért nem szabad a PE vezetőt a Fi-relén átvezetni?',
      options: [
        'Mert a Fi-relé kapcsai nem bírják a védővezető keresztmetszetét',
        'Mert a védővezető nem üzemi vezető, és átvezetése meghamisítaná a hibaáram érzékelését',
        'Mert így a Fi-relé lassabban oldana ki',
        'Nincs ilyen tiltás, a PE is átvezethető',
      ],
      correct: 1,
      category: 'biztonsagi-szemlelet',
      explanationHu:
        'A Fi-relé a fázis és a nulla áramának különbségét méri. A védővezető éppen a hibaáram visszavezetésére szolgál, ezért azt a készüléken kívül, közvetlenül a betáplálásból a PE-sínre kell vezetni. Az átvezetés hatástalanná tenné az érintésvédelmet.',
    },
    {
      id: 'b-e7',
      promptHu: 'A rajzon a lépcsőházi automata melyik kapcsára fut az S1 és S2 nyomógomb kimenete?',
      options: ['Az L kapocsra', 'A 3-as kapocsra', 'A 4-es kapocsra', 'Az N kapocsra'],
      correct: 1,
      category: 'rajzolvasas',
      explanationHu:
        'A két nyomógomb 4-es kapcsa párhuzamosan az automata 3-as vezérlő kapcsára megy. A 4-es kapocs az automata kimenete, onnan indul a kapcsolt fázis az E1 lámpára, az L és N pedig a készülék saját táplálása.',
    },
    {
      id: 'b-e8',
      promptHu: 'A kész, feszültségmentes táblán mi a helyes ellenőrzési sorrend?',
      options: [
        'Feszültség alá helyezés, működési próba, majd szemrevételezés',
        'Szemrevételezés a rajz alapján, kötéspontok és kapcsok ellenőrzése, folytonosságmérés a keresztkapcsolás útvonalán, védővezető folytonossága, szigetelésvizsgálat',
        'Szigetelésvizsgálat, majd a hibás szakaszok próbálgatása bekapcsolt állapotban',
        'Csak a kismegszakítók kikapcsolása, mérésre nincs szükség',
      ],
      correct: 1,
      category: 'ellenorzesi-sorrend',
      explanationHu:
        'Az ellenőrzés a kockázatmentes lépésekkel kezdődik: szemrevételezés a kapcsolási rajz szerint, a kötéspontok és a kapocsszorítások vizsgálata, majd a feszültségmentesen is elvégezhető folytonosság- és szigetelésmérések. Feszültség alá helyezés csak minden más ellenőrzés után, a vizsgáztató engedélyével és felügyeletével jöhet szóba.',
    },
  ],
  unresolved: [
    {
      id: 'b-u1',
      labelHu: 'F1, F2 és F3 kismegszakító névleges árama - a rajzból nem határozható meg, a hiányzó paramétereket lásd a felsorolásban',
      missingHu: [
        'a kismegszakítók névleges árama (A), a rajzon csak "... A" szerepel',
        'a kioldási jelleggörbe (B vagy C karakterisztika)',
        'a körök vezeték-keresztmetszete és fektetési módja',
        'a dugaljas kör tervezett terhelése',
      ],
      typicalExampleHu:
        'A világítási és a dugaljas körökhöz eltérő névleges áramú kismegszakító tartozik, de a konkrét értéket a tervdokumentáció vagy a vizsgafeladat kiírása adja meg. A rajzról leolvasni vagy kitalálni nem szabad.',
    },
    {
      id: 'b-u2',
      labelHu: 'FI Fi-relé adatai - a rajzból nem határozhatók meg, a hiányzó paramétereket lásd a felsorolásban',
      missingHu: [
        'a névleges hibaáram (mA), a rajzon csak "... mA" szerepel',
        'a Fi-relé névleges terhelhetősége (A)',
        'a készülék típusa (AC, A vagy más típusjel)',
        'a hálózat földelési rendszere',
      ],
      typicalExampleHu:
        'A beépített Fi-relé adatait a készülék adattáblájáról kell leolvasni, a rajz ezeket üresen hagyja. Vizsgán a hiányzó adatra rá kell kérdezni, nem szabad feltételezéssel pótolni.',
    },
    {
      id: 'b-u3',
      labelHu: 'A szerelési szakaszok kábeltípusa és érszáma - a rajzból nem határozható meg, a hiányzó paramétereket lásd a felsorolásban',
      missingHu: [
        'a szakaszonként előírt kábeltípus és keresztmetszet',
        'a fektetési mód (falon kívül, vakolat alatt, csőben)',
        'a kötéspontok helye és a kötődobozok kiosztása',
        'hogy a kapcsolókhoz kell-e védővezetőt vinni a felhasznált készülékek anyaga szerint',
      ],
      typicalExampleHu:
        'A működéshez szükséges érszám a kapcsolásból következik (a váltó- és keresztkapcsolók között két váltóvezeték), a ténylegesen behúzandó kábel típusát és érszámát azonban a fektetési mód és a védővezető igénye határozza meg, ezt a feladatkiírásnak kell megadnia.',
    },
  ],
};
