import type { TaskContent } from '../../domain/electrical-types';

export const contentA: TaskContent = {
  objectivesHu: [
    'A tanuló önállóan el tudja olvasni az egyfázisú, 230 V-os épületvillamossági kapcsolási rajzot, és meg tudja különböztetni a fogyasztói főáramkört a lépcsőházi automata vezérlő áramkörétől.',
    'Helyes sorrendben szereli be a védelmi eszközöket: betáplálás (SUP), Fi-relé (FI), majd a kismegszakítók (F1, F2, F3), és tudja, hogy a nulla vezető az N-sínre (NB) csak a Fi-relé kimenete felől köthető.',
    'Be tudja kötni a lépcsőházi automatát (LA) az L, N, 3 és 4 kapcsain, és meg tudja mutatni, melyik kapocs a vezérlő bemenet, és melyik a lámpa kimenet.',
    'Három helyről indítható vezérlést épít: a K1 egysarkú kapcsoló és az S1, S2 nyomógomb záró (NO) érintkezőit párhuzamosan a lépcsőházi automata 3-as kapcsára köti.',
    'Kiépít egy váltókapcsolást két helyről (K2, K3) az E2 lámpára, és pontosan tudja, melyik a közös (L) kapocs és melyek a váltóvezetékek (1, 2).',
    'Beköti a védőérintkezős dugaljat (X1) az F3 körére úgy, hogy az L, N és PE vezető a helyes kapcsokra kerül, és a PE a PE-sínről (PB) érkezik.',
    'A vizsgatáblán a munkát végig feszültségmentes állapotban végzi, és a végén rendezett, jelölés szerinti, szakszerűen rögzített szerelést ad át.',
    'A rajzon nem szereplő adatokat (kismegszakító névleges áram, Fi-relé adatai) nem találja ki, hanem hiányzó paraméterként kezeli és rákérdez.',
  ],
  commonMistakesHu: [
    'A nulla vezetőt a Fi-relé elől, a betáplálásból viszik az N-sínre, ezért a Fi-relé azonnal kiold vagy egyáltalán nem véd.',
    'A PE vezetőt átvezetik a Fi-relén, holott a védővezető a betáplálásból közvetlenül a PE-sínre (PB) megy.',
    'A lépcsőházi automata 3-as (vezérlő) és 4-es (lámpa) kapcsát felcserélik, így az E1 lámpa a nyomógomb megnyomásáig sem, vagy folyamatosan világít.',
    'A nyomógombok bontó (NC) érintkezőjét használják a záró (NO) helyett, ezért a vezérlés fordítva vagy egyáltalán nem működik.',
    'Az S1 és S2 nyomógombot sorba kötik a párhuzamos kötés helyett, így csak mindkét gomb egyidejű nyomására indul az automata.',
    'A váltókapcsolónál a közös (L) kapcsot összekeverik az 1-es vagy 2-es váltókapoccsal, ezért csak az egyik helyről lehet kapcsolni, vagy zárlat keletkezik.',
    'A dugaljnál a fázist és a nullát felcserélik, vagy a PE kapcsot bekötetlenül hagyják.',
    'Az E1 és E2 lámpa nulláját nem az N-sínről, hanem valamelyik szomszédos kör nullájáról fűzik le.',
    'A vezetékvégeket túl hosszan csupaszítják, a szigetelés becsípődik a kapocs alá, vagy a sodrott eret érvéghüvely nélkül szorítják.',
    'A rajzon üresen hagyott áramértékeket találomra kitöltik, ahelyett hogy hiányzó adatként jeleznék.',
  ],
  guided: [
    {
      id: 'a-1',
      titleHu: 'Betáplálás, Fi-relé és a sínek',
      goalHu: 'A SUP betáplálás L1, N és PE vezetőjének helyes bekötése, a Fi-relé bemeneti és kimeneti oldalának megkülönböztetése, valamint az N-sín és a PE-sín táplálása.',
      focus: ['SUP', 'FI', 'NB', 'PB'],
      reasoningHu:
        'A szerelés mindig a betáplálásnál kezdődik. A SUP fázisa (L1) a Fi-relé L1 bemeneti kapcsára, a nulla az N1 bemeneti kapcsára megy. A Fi-relé kimenetéről (L2, N2) indul a védett hálózat: az L2 a kismegszakítók felé, az N2 pedig az N-sínre (NB). A védővezető nem megy át a Fi-relén, azt a betáplálásból közvetlenül a PE-sínre (PB) kell kötni. Ha a nulla a Fi-relé előttről érkezne az N-sínre, a hibaáram nem a Fi-relén záródna, és a védelem hatástalan lenne.',
      questionHu: 'Honnan kell táplálni az N-sínt (NB) ebben a kapcsolásban?',
      options: [
        'A betáplálás (SUP) nulla vezetőjéről közvetlenül, a Fi-relé megkerülésével',
        'A Fi-relé kimeneti nulla kapcsáról (N2)',
        'A PE-sínről (PB), mert a nulla és a védővezető azonos potenciálon van',
        'Az F1 kismegszakító 2-es kapcsáról',
      ],
      correct: 1,
      hintHu: 'Gondolj arra, hogy a Fi-relé csak akkor tud hibaáramot érzékelni, ha a fogyasztók teljes visszatérő árama áthalad rajta.',
      explanationHu:
        'Az N-sín a Fi-relé kimeneti nulla kapcsáról (N2) kap táplálást. Így a fogyasztók oda- és visszamenő árama egyaránt áthalad a Fi-relén, és eltérés esetén a készülék kiold. A védővezető ezzel szemben a betáplálásból közvetlenül a PE-sínre megy, azt tilos a Fi-relén átvezetni.',
    },
    {
      id: 'a-2',
      titleHu: 'A három kismegszakító és a körök szétosztása',
      goalHu: 'Az F1, F2 és F3 kismegszakító táplálása a Fi-relé kimeneti fázisáról, és a három fogyasztói kör szétválasztása.',
      focus: ['FI', 'F1', 'F2', 'F3'],
      reasoningHu:
        'A Fi-relé L2 kimeneti kapcsáról indul a fázis mindhárom kismegszakító 1-es (felső) kapcsára. Ez a rész a rajzon a védelmi elosztás: a Fi-relé az egész elosztót védi hibaáram ellen, a kismegszakítók pedig körönként adnak túláram- és zárlatvédelmet. A kismegszakítók 2-es kapcsáról indul a három kör: F1 a lépcsőházi automata felé, F2 a váltókapcsolás felé, F3 a dugalj felé. Minden körnek saját fázisvezetője van, a nulla viszont a közös N-sínről érkezik.',
      questionHu: 'Melyik állítás igaz a Fi-relé és a kismegszakítók feladatmegosztására?',
      options: [
        'A Fi-relé véd a túláram ellen, a kismegszakító pedig a hibaáram ellen',
        'A Fi-relé hibaáram (érintésvédelmi) védelmet ad, a kismegszakító túláram- és zárlatvédelmet',
        'Mindkettő ugyanazt a védelmet adja, a kismegszakító csak tartalék',
        'A Fi-relé csak akkor véd, ha a kismegszakító kioldott',
      ],
      correct: 1,
      hintHu: 'Az egyik készülék az áram nagyságát figyeli, a másik az oda- és visszamenő áram különbségét.',
      explanationHu:
        'A Fi-relé a fázis és a nulla áramának különbségét, vagyis a hibaáramot figyeli, és ezzel érintésvédelmi funkciót lát el. A kismegszakító a kör áramának nagyságát figyeli, és túlterhelés vagy zárlat esetén old ki. A kettő nem helyettesíti egymást, mindkettőre szükség van.',
    },
    {
      id: 'a-3',
      titleHu: 'A lépcsőházi automata táplálása (F-1 kör)',
      goalHu: 'A lépcsőházi automata (LA) L és N kapcsának bekötése, az üzemi táplálás kiépítése.',
      focus: ['F1', 'LA', 'NB'],
      reasoningHu:
        'A lépcsőházi automatának saját tápfeszültségre van szüksége ahhoz, hogy az időzítés működjön. Az F1 kismegszakító 2-es kapcsáról a fázis az automata L kapcsára, az N-sínről (NB) a nulla az automata N kapcsára megy. Ez a két vezeték még semmit nem kapcsol, csak működőképessé teszi a készüléket. A vezérlés (3-as kapocs) és a lámpakimenet (4-es kapocs) ezután következik.',
      questionHu: 'Mi a szerepe a lépcsőházi automata L és N kapcsának?',
      options: [
        'Ezek adják a készülék saját tápfeszültségét, ezek nélkül az időzítés nem működik',
        'Ezekre kell kötni a nyomógombokat',
        'Ezek kapcsolják közvetlenül az E1 lámpát',
        'Ezek csak a visszajelző lámpa táplálására szolgálnak',
      ],
      correct: 0,
      hintHu: 'A készülékben elektronika van, aminek folyamatos ellátásra van szüksége.',
      explanationHu:
        'Az L és N kapocs a lépcsőházi automata üzemi táplálása: az L az F1 kismegszakítóról, az N az N-sínről érkezik. Ezek nélkül az automata elektronikája nem működik, a 3-as vezérlő kapocs jele hatástalan marad.',
    },
    {
      id: 'a-4',
      titleHu: 'Három indítóhely a vezérlő áramkörön',
      goalHu: 'A K1 egysarkú kapcsoló, valamint az S1 és S2 nyomógomb záró (NO) érintkezőjének párhuzamos bekötése az automata 3-as kapcsára.',
      focus: ['K1', 'S1', 'S2', 'LA'],
      reasoningHu:
        'A lépcsőházi automata 3-as kapcsa a vezérlő bemenet: ha ide fázis érkezik, az időzítés indul. Az F1 körének fázisát el kell vinni mindhárom indítóhelyre: a K1 kapcsoló (Legrand Niloé) L kapcsára, valamint az S1 és S2 nyomó (Schneider, csengő jellel) L kapcsára. A kapcsoló 1-es kapcsa és a nyomók 1-es kapcsa együtt, párhuzamosan megy az automata 3-as kapcsára. A párhuzamos kötés miatt bármelyik eszköz működtetése önmagában elegendő az indításhoz. A K1 kapcsoló zárt állapotában a vezérlő jel tartósan jelen marad, ezért a bemutató előtt alaphelyzetbe kell kapcsolni.',
      questionHu: 'Hogyan kell összekötni a K1 kapcsolót és az S1, S2 nyomógombot, hogy mindhárom helyről indítható legyen a világítás?',
      options: [
        'Sorba kötve, hogy csak együttes működtetésre induljon',
        'Párhuzamosan, mindhárom kimenete az automata 3-as kapcsára',
        'Párhuzamosan, mindhárom kimenete az automata 4-es kapcsára',
        'A két nyomógombot sorba, a kapcsolót külön a 4-es kapocsra',
      ],
      correct: 1,
      hintHu: 'Az indítóparancsoknak vagylagosnak kell lenniük: elég az egyik.',
      explanationHu:
        'A három indítóhely záró érintkezői párhuzamosan kapcsolódnak, és együtt az automata 3-as vezérlő kapcsára mennek. Így bármelyik nyomógomb megnyomása vagy a kapcsoló zárása önmagában elindítja az időzítést. A 4-es kapocs nem vezérlő bemenet, hanem a lámpa kimenete, oda nem szabad indítójelet vinni.',
    },
    {
      id: 'a-5',
      titleHu: 'Az E1 lámpa bekötése az automata kimenetéről',
      goalHu: 'Az E1 lámpa fázisának bekötése az LA 4-es kapcsáról, a lámpa nullájának bekötése az N-sínről.',
      focus: ['LA', 'E1', 'NB'],
      reasoningHu:
        'A lépcsőházi automata 4-es kapcsa a kapcsolt fázis kimenete. Innen megy a vezeték az E1 lámpa 1-es kapcsára, a lámpa 2-es kapcsa pedig az N-sínre (NB). Amikor bármelyik indítóhelyről jel érkezik a 3-as kapocsra, az automata belső érintkezője zár, a 4-es kapcson megjelenik a fázis, és a lámpa 7 másodpercig világít. Az időzítés letelte után az érintkező bont, a lámpa magától elalszik.',
      questionHu: 'Mi történik az E1 lámpával, ha az S1 nyomógombot megnyomjuk és elengedjük?',
      options: [
        'A lámpa csak a nyomógomb nyomva tartásáig világít',
        'A lámpa 7 másodpercig világít, majd az automata magától lekapcsolja',
        'A lámpa bekapcsol, és csak a K1 kapcsolóval lehet lekapcsolni',
        'A lámpa nem gyullad ki, mert a nyomógomb csak a 4-es kapcsot vezérli',
      ],
      correct: 1,
      hintHu: 'Ezért hívják lépcsőházi automatának: az idő méri a bekapcsolva maradást.',
      explanationHu:
        'A rövid indítójel után a lépcsőházi automata önműködően tartja bekapcsolva a kimenetét a beállított időre, itt 7 másodpercre, majd bont. A nyomógombot nem kell nyomva tartani, mert az öntartást az automata belső időzítése biztosítja.',
    },
    {
      id: 'a-6',
      titleHu: 'Váltókapcsolás két helyről (F-2 kör)',
      goalHu: 'A K2 és K3 váltókapcsoló (Legrand Niloé) bekötése az E2 lámpához, a közös (L) kapocs és a váltóvezetékek (1, 2) helyes azonosítása.',
      focus: ['F2', 'K2', 'K3', 'E2', 'NB'],
      reasoningHu:
        'Az F2 kismegszakító 2-es kapcsáról a fázis a K2 váltókapcsoló L (közös) kapcsára megy. A K2 1-es és 2-es kapcsa a két váltóvezeték, ezek a K3 váltókapcsoló 1-es és 2-es kapcsára mennek. A K3 L kapcsáról indul a kapcsolt fázis az E2 lámpa 1-es kapcsára, a lámpa 2-es kapcsa pedig az N-sínre. Így bármelyik kapcsoló átbillentése megváltoztatja a lámpa állapotát. A két váltóvezetéket tilos felcserélni az L kapoccsal, mert az zárlatot okozhat.',
      questionHu: 'Melyik kapocsra kell kötni az F2 kismegszakító felől érkező fázist a K2 váltókapcsolón?',
      options: [
        'Az 1-es kapocsra',
        'A 2-es kapocsra',
        'Az L (közös) kapocsra',
        'Mindegy, a váltókapcsoló szimmetrikus',
      ],
      correct: 2,
      hintHu: 'A váltókapcsoló egy bemenetet oszt szét két kimenetre.',
      explanationHu:
        'A betáplálás a K2 közös (L) kapcsára megy, onnan a kapcsoló állásától függően az 1-es vagy a 2-es váltóvezetékre jut a fázis. A túloldali K3 kapcsoló ugyanezt a két váltóvezetéket fogadja az 1-es és 2-es kapcsán, és az L kapcsáról adja tovább a lámpára. Ha a fázist váltókapocsra kötnék, a kapcsolás nem működne, és két váltóvezeték összekapcsolásakor zárlat is keletkezhet.',
    },
    {
      id: 'a-7',
      titleHu: 'Védőérintkezős dugalj (F-3 kör)',
      goalHu: 'Az X1 dugalj L, N és PE bekötése, a védővezető helyes útjának ellenőrzése.',
      focus: ['F3', 'X1', 'NB', 'PB'],
      reasoningHu:
        'A dugalj a legegyszerűbb kör, de a legkritikusabb az érintésvédelem szempontjából. Az F3 kismegszakító 2-es kapcsáról a fázis az X1 L kapcsára, az N-sínről a nulla az N kapcsára, a PE-sínről a védővezető a PE kapocsra megy. A PE kapocs bekötése nem elhagyható, és a védővezetőt nem szabad más kör nullájával összekötni. A dugalj a Fi-relé mögött van, így a hibaáramvédelem erre a körre is kiterjed.',
      questionHu: 'Honnan érkezik a védővezető az X1 dugalj PE kapcsára?',
      options: [
        'Az N-sínről (NB), mert a nulla és a védővezető ugyanaz',
        'A PE-sínről (PB), amelyet a betáplálás védővezetője táplál',
        'A Fi-relé N2 kimeneti kapcsáról',
        'Az F3 kismegszakító 2-es kapcsáról',
      ],
      correct: 1,
      hintHu: 'A védővezető sohasem visz üzemi áramot, és nem megy át a Fi-relén.',
      explanationHu:
        'A védővezető a betáplálás PE vezetőjéről a PE-sínre (PB), onnan pedig a dugalj PE kapcsára megy. A nullától elkülönítve kell vezetni, üzemi áramot nem szállíthat, és a Fi-relén nem szabad átvezetni, mert az meghamisítaná a hibaáram érzékelését.',
    },
    {
      id: 'a-8',
      titleHu: 'Záró ellenőrzés feszültségmentes állapotban',
      goalHu: 'A kész szerelés szemrevételezése, a kapcsok szorításának és a vezetékutak helyességének ellenőrzése bekapcsolás előtt.',
      focus: ['SUP', 'FI', 'F1', 'F2', 'F3', 'LA', 'K1', 'S1', 'S2', 'E1', 'K2', 'K3', 'E2', 'X1', 'NB', 'PB'],
      reasoningHu:
        'A vizsgatáblán a szerelés végig feszültségmentes állapotban készül. Az ellenőrzés sorrendje: először szemrevételezés a rajz alapján kör körönként, utána a kapcsok szorításának ellenőrzése és a csupaszítási hossz vizsgálata, majd a védővezető folytonosságának mérése, végül a szigetelési ellenőrzés. Feszültség alá helyezés és működési próba csak akkor jöhet szóba, ha a vizsgahelyzet ezt kifejezetten megengedi, és ezt a vizsgáztató irányítja. A saját munkánkat mindig úgy nézzük át, mintha másé lenne.',
      questionHu: 'Mi a helyes sorrend a kész, még feszültségmentes tábla ellenőrzésénél?',
      options: [
        'Bekapcsolás és működési próba, utána szemrevételezés',
        'Szemrevételezés a rajz alapján, kapocsszorítás ellenőrzése, védővezető folytonossága, majd szigetelésvizsgálat',
        'Először szigetelésvizsgálat, majd a vezetékek átkötése próba alapján',
        'Elég a szemrevételezés, a mérések a felhasználó feladata',
      ],
      correct: 1,
      hintHu: 'A veszélytelen, roncsolásmentes vizsgálatok mennek előre, a feszültség alá helyezés a legvégén jöhet szóba.',
      explanationHu:
        'Az ellenőrzés mindig a legkevésbé kockázatos lépéssel kezdődik: szemrevételezés a rajz szerint, mechanikai ellenőrzés, majd a védővezető folytonosságának és a szigetelésnek a mérése. A feszültség alá helyezés csak minden más ellenőrzés után, a vizsgáztató engedélyével és felügyeletével jöhet szóba, addig a tábla feszültségmentes marad.',
    },
  ],
  exam: [
    {
      id: 'a-e1',
      promptHu: 'A rajz szerint hány helyről indítható az F-1 kör lépcsőházi világítása, és milyen eszközökről?',
      options: [
        'Két helyről: az S1 és S2 nyomógombról',
        'Három helyről: a K1 kapcsolóról, valamint az S1 és S2 nyomógombról',
        'Három helyről: a K1, K2 és K3 kapcsolóról',
        'Egy helyről, a K1 kapcsolóról',
      ],
      correct: 1,
      category: 'rajzolvasas',
      explanationHu:
        'A rajzon a K1 egysarkú kapcsoló és az S1, S2 nyomógomb kimenete egyaránt a lépcsőházi automata 3-as vezérlő kapcsára fut, tehát három indítóhely van. A K2 és K3 nem ehhez a körhöz tartozik, azok az F-2 kör váltókapcsolását alkotják.',
    },
    {
      id: 'a-e2',
      promptHu: 'Melyik kapcson jelenik meg a kapcsolt fázis, amikor a lépcsőházi automata bekapcsol?',
      options: ['Az L kapcson', 'A 3-as kapcson', 'A 4-es kapcson', 'Az N kapcson'],
      correct: 2,
      category: 'keszulekismeret',
      explanationHu:
        'A 4-es kapocs az automata kimenete, innen kapja a fázist az E1 lámpa. Az L és N az üzemi táplálás, a 3-as kapocs a vezérlő bemenet, ahová az indítójel érkezik a nyomógombokról és a kapcsolóról.',
    },
    {
      id: 'a-e3',
      promptHu: 'Az S1 és S2 nyomógombnak melyik érintkezőjét kell használni ebben a kapcsolásban?',
      options: [
        'A bontó (NC) érintkezőt, mert alaphelyzetben zárnia kell',
        'A záró (NO) érintkezőt, mert megnyomásra kell jelet adnia',
        'Mindkettőt párhuzamosan',
        'Mindegy, mert a nyomógomb önmagában nem irányfüggő',
      ],
      correct: 1,
      category: 'bekotesi-pontossag',
      explanationHu:
        'Az indítás záró (NO) érintkezővel történik: alaphelyzetben nyitott, megnyomva zár, és fázist juttat az automata 3-as kapcsára. A bontó (NC) érintkező alaphelyzetben zárt, azt leállításra használják, itt hibás működést okozna.',
    },
    {
      id: 'a-e4',
      promptHu: 'Mi történik, ha a szerelő az N-sínt a Fi-relé bemeneti oldaláról, az N1 kapocs elől táplálja meg?',
      options: [
        'Semmi különös, a kapcsolás ugyanúgy működik és véd',
        'A fogyasztók visszatérő árama nem halad át a Fi-relén, ezért a hibaáramvédelem hatástalan lesz vagy a készülék azonnal kiold',
        'A Fi-relé érzékenyebb lesz, ez előnyös',
        'Csak a dugalj köre marad védelem nélkül, a világítási körök rendben lesznek',
      ],
      correct: 1,
      category: 'biztonsagi-szemlelet',
      explanationHu:
        'A Fi-relé a rajta áthaladó fázis- és nullaáram különbségét méri. Ha a nulla a készülék előttről érkezik, a mérés meghamisul: a védelem vagy nem érzékeli a hibaáramot, vagy üzemszerű terhelésnél is kiold. Az N-sínt kizárólag a Fi-relé kimeneti N2 kapcsáról szabad táplálni.',
    },
    {
      id: 'a-e5',
      promptHu: 'A váltókapcsolásnál a K2 és K3 között hány vezetéket kell húzni, és mi ezek szerepe?',
      options: [
        'Egy vezetéket, a kapcsolt fázist',
        'Kettőt, a két váltóvezetéket a kapcsolók 1-es és 2-es kapcsai között',
        'Hármat: fázis, nulla és védővezető',
        'Kettőt: fázist és nullát',
      ],
      correct: 1,
      category: 'bekotesi-pontossag',
      explanationHu:
        'A két váltókapcsoló közötti szakaszon két váltóvezeték fut, a K2 1-es és 2-es kapcsáról a K3 1-es és 2-es kapcsára. A fázis a K2 L kapcsára érkezik, a kapcsolt fázis pedig a K3 L kapcsáról megy az E2 lámpára, amelynek nullája az N-sínről jön.',
    },
    {
      id: 'a-e6',
      promptHu: 'Melyik vezetőt tilos átvezetni a Fi-relén?',
      options: ['A fázist (L1)', 'A nullát (N)', 'A védővezetőt (PE)', 'A dugalj fázisát'],
      correct: 2,
      category: 'biztonsagi-szemlelet',
      explanationHu:
        'A védővezető a betáplálásból közvetlenül a PE-sínre megy, a Fi-relé csak a fázist és a nullát kapcsolja. A PE átvezetése meghamisítaná a hibaáram érzékelését és veszélyeztetné az érintésvédelmet.',
    },
    {
      id: 'a-e7',
      promptHu: 'Miért nem kell az S1 nyomógombot nyomva tartani ahhoz, hogy az E1 lámpa világítson?',
      options: [
        'Mert a nyomógomb mechanikusan reteszelődik',
        'Mert a K1 kapcsoló tartja a fázist',
        'Mert a lépcsőházi automata a rövid indítójel után önműködően tartja bekapcsolva a kimenetét a beállított 7 másodpercig',
        'Mert a lámpa kondenzátoros késleltetéssel működik',
      ],
      correct: 2,
      category: 'mukodes-megertese',
      explanationHu:
        'A lépcsőházi automata a 3-as kapcsára érkező rövid jelre indítja az időzítést, és a 4-es kapocs kimenetét a beállított időre bekapcsolva tartja. Ez a funkció helyettesíti a klasszikus öntartó kapcsolást, ezért a nyomógomb elengedhető.',
    },
    {
      id: 'a-e8',
      promptHu: 'A tábla elkészült. Mi a helyes első lépés az ellenőrzésnél?',
      options: [
        'Feszültség alá helyezés és működési próba',
        'Szemrevételezés a kapcsolási rajz alapján, körönként végigkövetve a vezetékutakat',
        'Szigetelési ellenállás mérése bekapcsolt állapotban',
        'A kismegszakítók lekapcsolása és a fedelek felszerelése',
      ],
      correct: 1,
      category: 'ellenorzesi-sorrend',
      explanationHu:
        'Az ellenőrzés a feszültségmentes szemrevételezéssel kezdődik: a rajz alapján kör körönként ellenőrizzük a bekötést, a kapcsokat és a jelöléseket. A mérések ezt követik, feszültség alá helyezés pedig csak a végén, a vizsgáztató engedélyével jöhet szóba.',
    },
  ],
  unresolved: [
    {
      id: 'a-u1',
      labelHu: 'F1, F2 és F3 kismegszakító névleges árama - a rajzból nem határozható meg, a hiányzó paramétereket lásd a felsorolásban',
      missingHu: [
        'a kismegszakítók névleges árama (A), a rajzon csak "... A" szerepel',
        'a kioldási jelleggörbe (B vagy C karakterisztika)',
        'a védendő körök vezeték-keresztmetszete, ami az áramértéket meghatározná',
        'a dugaljas kör tervezett terhelése',
      ],
      typicalExampleHu:
        'Gyakorlatban a világítási körökhöz kisebb, a dugaljas körhöz nagyobb névleges áramú kismegszakító szokott tartozni, de a konkrét értéket csak a tervező vagy a vizsgafeladat kiírása adhatja meg. A rajz alapján kitalálni nem szabad.',
    },
    {
      id: 'a-u2',
      labelHu: 'FI Fi-relé adatai - a rajzból nem határozhatók meg, a hiányzó paramétereket lásd a felsorolásban',
      missingHu: [
        'a névleges hibaáram (mA), a rajzon csak "... mA" szerepel',
        'a Fi-relé névleges terhelhetősége (A)',
        'a készülék típusa (AC, A vagy más típusjel)',
        'a hálózat földelési rendszere, ami a védelem kiválasztását befolyásolja',
      ],
      typicalExampleHu:
        'Lakossági, dugaljas köröket is tartalmazó elosztóknál a Fi-relé érzékenysége és terhelhetősége tervezői adat. A vizsgatáblán a ténylegesen beszerelt készülék adattáblájáról kell leolvasni, nem a rajzból következtetni.',
    },
  ],
};
