/**
 * Ellenőrzési lista a de-energizált vizsgatábla gyakorlásához.
 *
 * A sorrend szándékosan a vizsgán megszokott logikát követi: előbb a szemmel
 * látható hibák, utána a védővezető, a szigetelés, végül a működési próbák.
 * Semmilyen tétel nem tartalmaz kitalált megfelelőségi határértéket: a konkrét
 * elvárt értékeket mindig az oktató, az érvényes szabvány és a hivatalos
 * vizsgautasítás adja meg.
 */

export interface CheckItem {
  id: string;
  textHu: string;
}

export interface CheckSection {
  id: string;
  titleHu: string;
  introHu: string;
  safetyHu: string;
  items: CheckItem[];
}

export const INSPECTION: CheckSection[] = [
  {
    id: 'szemrevetelezes',
    titleHu: '1. Szemrevételezés',
    introHu:
      'Mérés előtt mindig szemrevételezés. A hibák nagy része már itt kiderül: rossz helyre kötött ér, meglazult kötéspont, sérült szigetelés. Végigmész a táblán fentről lefelé, és összeveted a látottakat a kapcsolási rajzzal.',
    safetyHu:
      'A szemrevételezést feszültségmentesített, kikapcsolt és visszakapcsolás ellen biztosított táblán végezd. Mérni csak a feladathoz megfelelő, ép és hitelesített műszerrel szabad. Feszültség alatti vizsgálat kizárólag szakképzett felügyelettel és az érvényes eljárás szerint történhet. Ez az alkalmazás nem helyettesíti az oktatót, a szabványt és a hivatalos vizsgautasítást.',
    items: [
      {
        id: 'szem-1',
        textHu:
          'A táblán lévő készülékek megegyeznek a rajzon szereplőkkel: kismegszakító, Fi-relé, mágneskapcsoló, motorvédő kapcsoló, fogyasztásmérő, nyomógombok, jelzőlámpák.',
      },
      {
        id: 'szem-2',
        textHu:
          'Minden vezeték a helyes színnel van szerelve: fázisvezető barna, fekete vagy szürke, nullavezető kék, védővezető zöld-sárga. Színt sohasem használsz más szerepre.',
      },
      {
        id: 'szem-3',
        textHu:
          'A kötéspontok mechanikailag szilárdak: nincs kihúzható ér, nincs a szigetelésre ráharapott csavar, nincs több ér egy kapocsban, ha a kapocs csak egyre való.',
      },
      {
        id: 'szem-4',
        textHu:
          'A szigetelés sehol nem sérült, nem égett, nem nyúlik be csupasz réz a kapocs alól, és az érvéghüvelyek megfelelően vannak préselve.',
      },
      {
        id: 'szem-5',
        textHu:
          'A szerelési útvonal rendezett: a főáramkör és a vezérlőáramkör vezetékei követhetők, nincsenek feszülő vagy éles peremen átvezetett erek.',
      },
      {
        id: 'szem-6',
        textHu:
          'A készülékek feliratozása és a sorkapcsok jelölése olvasható, egyezik a rajz jelöléseivel (például A1, A2, 13, 14, T1, T2).',
      },
    ],
  },
  {
    id: 'pe-folytonossag',
    titleHu: '2. Védővezető folytonossága',
    introHu:
      'A védővezető az érintésvédelem gerince. Azt ellenőrzöd, hogy a PE megszakítás nélkül eljut a betáplálástól minden fémházas készülékig és minden dugaljig, és hogy sehol nincs kapcsolóelem a PE-ben.',
    safetyHu:
      'A folytonosság mérése kizárólag feszültségmentesített, kikapcsolt és visszakapcsolás ellen biztosított állapotban végezhető, erre alkalmas mérőműszerrel (folytonosságvizsgáló vagy erre a célra való méréshatár). Feszültség alatti mérés csak szakképzett felügyelettel és az érvényes eljárás szerint jöhet szóba. Ez az alkalmazás nem helyettesíti az oktatót, a szabványt és a hivatalos vizsgautasítást.',
    items: [
      {
        id: 'pe-1',
        textHu:
          'A betáplálás PE kapcsától a tábla PE sínjéig folytonos az összeköttetés, a mért érték az oktató által megadott elvárásnak megfelelő.',
      },
      {
        id: 'pe-2',
        textHu:
          'A PE sínről minden fémházas készülék, szerelvénydoboz és fémtok külön vezetékkel van bekötve, nem láncolva olyan ponton, ami leszerelhető.',
      },
      {
        id: 'pe-3',
        textHu:
          'A dugaljak védőérintkezője folytonos a PE sínnel, és a bekötés nem cserélődött fel a nullavezetővel.',
      },
      {
        id: 'pe-4',
        textHu:
          'A védővezetőben sehol nincs kismegszakító, biztosító, kapcsoló vagy más bontóelem.',
      },
      {
        id: 'pe-5',
        textHu:
          'A motor kapocsdobozában a PE a kijelölt földelési ponthoz csatlakozik, és a kötés fém-fém érintkezéssel, korrózió nélkül készült.',
      },
    ],
  },
  {
    id: 'szigeteles',
    titleHu: '3. Szigeteléssel kapcsolatos vizsgálatok',
    introHu:
      'A szigetelési ellenállás azt mutatja meg, hogy az áramvezető részek megfelelően el vannak-e választva egymástól és a védővezetőtől. A mérés előtt le kell választani mindent, ami a mérőfeszültséget nem bírja el.',
    safetyHu:
      'A szigetelésmérés feszültségmentesített, kikapcsolt és visszakapcsolás ellen biztosított berendezésen történik, kizárólag erre való szigetelésvizsgáló műszerrel; a műszer maga ad ki mérőfeszültséget, ezért a mérés alatt senki nem érhet a mért részekhez, és mérés után gondoskodni kell a kisütésről. Feszültség alatti mérés itt tilos, ilyen vizsgálat csak szakképzett felügyelettel és az érvényes eljárás szerint végezhető. Ez az alkalmazás nem helyettesíti az oktatót, a szabványt és a hivatalos vizsgautasítást.',
    items: [
      {
        id: 'szig-1',
        textHu:
          'Mérés előtt kikapcsolod vagy leválasztod az érzékeny fogyasztókat és elektronikákat: frekvenciaváltó, elektronikus előtét, túlfeszültség-levezető, jelzőlámpa elektronikus tagja.',
      },
      {
        id: 'szig-2',
        textHu:
          'A mérőműszeren a feladathoz tartozó mérőfeszültséget állítod be az oktató utasítása szerint, és ellenőrzöd a mérővezetékek épségét.',
      },
      {
        id: 'szig-3',
        textHu:
          'Megméred a fázisvezetők és a nullavezető közötti, valamint az összes áramvezető és a védővezető közötti szigetelési ellenállást.',
      },
      {
        id: 'szig-4',
        textHu:
          'A vezérlőáramkört külön is megméred, mert ott gyakori a hibás sorkapocs vagy a bepréselt szigetelés miatti kúszóáram.',
      },
      {
        id: 'szig-5',
        textHu:
          'A mért értékeket felírod, és összeveted az oktató, a szabvány, illetve a vizsgautasítás által megadott elvárással. Az alkalmazásban szereplő számok nem minősülnek követelménynek.',
      },
      {
        id: 'szig-6',
        textHu:
          'Mérés után kisütöd a mért áramköröket, és a leválasztott készülékeket visszakötöd, majd a visszakötést újra szemrevételezed.',
      },
    ],
  },
  {
    id: 'polaritas',
    titleHu: '4. Polaritás és vezetőazonosítás',
    introHu:
      'Itt derül ki, hogy a fázis és a nulla nem cserélődött-e fel, és hogy a kapcsolók a fázisvezetőt bontják-e. Egy felcserélt polaritás a rajz szerint működő, mégis veszélyes táblát eredményez.',
    safetyHu:
      'Az azonosítást és a kiméréseket feszültségmentesített, kikapcsolt és visszakapcsolás ellen biztosított állapotban végezd, folytonosságvizsgálatra alkalmas műszerrel. Ha a feladat kifejezetten feszültség alatti ellenőrzést ír elő, azt csak szakképzett felügyelettel és az érvényes eljárás szerint szabad elvégezni. Ez az alkalmazás nem helyettesíti az oktatót, a szabványt és a hivatalos vizsgautasítást.',
    items: [
      {
        id: 'pol-1',
        textHu:
          'Minden egypólusú kapcsoló, kismegszakító és nyomógomb a fázisvezetőben van, nem a nullavezetőben.',
      },
      {
        id: 'pol-2',
        textHu:
          'A lámpatestek foglalatánál a kapcsolt fázis a középérintkezőre, a nullavezető a menetes részre jut.',
      },
      {
        id: 'pol-3',
        textHu:
          'A dugaljak bekötése egységes, a védőérintkező a PE-n, a nullavezető a kék éren, és nincs összekeverve a nulla a védővezetővel.',
      },
      {
        id: 'pol-4',
        textHu:
          'A fogyasztásmérő betáplálási és fogyasztói oldala nincs felcserélve, a nullavezető a saját kapcsán megy át.',
      },
      {
        id: 'pol-5',
        textHu:
          'A háromfázisú részen az L1, L2, L3 azonosítás végig következetes a betáplálástól a motorvédő kapcsolón át a motorig.',
      },
      {
        id: 'pol-6',
        textHu:
          'A vezérlőáramkör fázisa és nullája ott van, ahol a rajz mutatja, és a nyomógombok nem a nullavezetőt szakítják meg.',
      },
    ],
  },
  {
    id: 'vedelmi-keszulekek',
    titleHu: '5. Védelmi készülékek áttekintése',
    introHu:
      'A védelmi készülékeknél most csak azt nézed, hogy a helyükön vannak-e, jól vannak-e bekötve, és a rajzhoz illő jellemzőkkel szerepelnek-e. A tényleges névleges áramot a méretezés dönti el, nem a rajz ránézésre.',
    safetyHu:
      'A készülékek vizsgálatát és a bekötés kimérését feszültségmentesített, kikapcsolt és visszakapcsolás ellen biztosított táblán végezd, megfelelő műszerrel. A Fi-relé kioldási próbája feszültség alatti művelet, ezért csak szakképzett felügyelettel és az érvényes eljárás szerint hajtható végre. Ez az alkalmazás nem helyettesíti az oktatót, a szabványt és a hivatalos vizsgautasítást.',
    items: [
      {
        id: 'ved-1',
        textHu:
          'Minden áramkörhöz tartozik a rajz szerinti zárlat- és túlterhelésvédelem, és a készülék a betáplálás felől van bekötve.',
      },
      {
        id: 'ved-2',
        textHu:
          'A kismegszakítók névleges árama és kioldási karakterisztikája megegyezik a dokumentációban megadottal. Ha a rajzon nincs feltüntetve, azt nem találod ki, hanem hiányzó adatként jelzed.',
      },
      {
        id: 'ved-3',
        textHu:
          'A Fi-relé bekötése helyes: a betáplálás a jelölt oldalon van, a nullavezető átmegy a készüléken, és a védett áramkörök nullája nem keveredik más áramkör nullájával.',
      },
      {
        id: 'ved-4',
        textHu:
          'A motorvédő kapcsoló áramtartománya a motor adattáblájához igazodik, és a beállított érték megegyezik a feladatban megadottal. Adattábla vagy megadott adat nélkül ez nem eldönthető.',
      },
      {
        id: 'ved-5',
        textHu:
          'A védelmek szelektivitása értelmezhető: a fogyasztóhoz közelebbi készülék old ki előbb, nem a fő védelem.',
      },
      {
        id: 'ved-6',
        textHu:
          'A készülékek segédérintkezői (záró NO, bontó NC) a rajz szerinti kapcsokra vannak kötve, és nem keverednek a főáramköri kapcsokkal.',
      },
    ],
  },
  {
    id: 'vezerlo-proba',
    titleHu: '6. Vezérlőáramkör működési próbája',
    introHu:
      'A vezérlés logikáját először főáramkör nélkül, majd az oktató engedélyével a teljes körön próbálod ki. A cél az öntartás, a leállítás elsőbbsége és a reteszelés bizonyítása.',
    safetyHu:
      'A próbát csak azután indítsd, hogy az előző szakaszok rendben lezárultak, a tábla állapotát ellenőrizted, és minden mérést megfelelő műszerrel végeztél. Ahol a művelethez nem kell feszültség, ott feszültségmentesítve és visszakapcsolás ellen biztosítva dolgozz; a feszültség alatti működési próba kizárólag szakképzett felügyelettel és az érvényes eljárás szerint engedélyezett. Ez az alkalmazás nem helyettesíti az oktatót, a szabványt és a hivatalos vizsgautasítást.',
    items: [
      {
        id: 'vez-1',
        textHu:
          'Az indítás nyomógomb (záró, NO) megnyomására a mágneskapcsoló meghúz, és a nyomógomb elengedése után az öntartó záró érintkezőn keresztül behúzva marad.',
      },
      {
        id: 'vez-2',
        textHu:
          'A leállítás nyomógomb (bontó, NC) megnyomására a mágneskapcsoló elenged, és nyomva tartott indítás mellett sem húz be újra.',
      },
      {
        id: 'vez-3',
        textHu:
          'A motorvédő kapcsoló vagy hőkioldó bontó érintkezője benne van a vezérlőáramkörben, és kioldáskor leállítja a mágneskapcsolót.',
      },
      {
        id: 'vez-4',
        textHu:
          'Irányváltó vagy csillag-delta kapcsolásnál a reteszelés működik: a két mágneskapcsoló egyszerre nem tud behúzva lenni, sem gombbal, sem kézi behúzással.',
      },
      {
        id: 'vez-5',
        textHu:
          'Feszültségkimaradás után a mágneskapcsoló magától nem húz be, csak új indítás hatására.',
      },
      {
        id: 'vez-6',
        textHu:
          'A vezérlőáramkör saját védelme a helyén van, és a vezérlés hibája nem hagyja feszültség alatt a főáramkört.',
      },
    ],
  },
  {
    id: 'visszajelzesek',
    titleHu: '7. Visszajelzések ellenőrzése',
    introHu:
      'Az üzemállapot-visszajelzés akkor jó, ha a valós állapotot mutatja, nem a nyomógomb megnyomását. Ezért a jelzőlámpát mindig a kapcsoló tényleges érintkezőjéről vezéreld, ne a gombról.',
    safetyHu:
      'A visszajelzések bekötését feszültségmentesített, kikapcsolt és visszakapcsolás ellen biztosított állapotban mérd ki megfelelő műszerrel, és csak a működési próba szakaszban, az oktató engedélyével nézd élesben. Feszültség alatti ellenőrzés kizárólag szakképzett felügyelettel és az érvényes eljárás szerint végezhető. Ez az alkalmazás nem helyettesíti az oktatót, a szabványt és a hivatalos vizsgautasítást.',
    items: [
      {
        id: 'vis-1',
        textHu:
          'A zöld üzemi lámpa a mágneskapcsoló záró (NO) segédérintkezőjéről kap feszültséget, tehát a behúzott állapotot jelzi.',
      },
      {
        id: 'vis-2',
        textHu:
          'A piros hibalámpa vagy a leállított állapot jelzése bontó (NC) érintkezőről működik, és nem marad égve behúzott kapcsoló mellett.',
      },
      {
        id: 'vis-3',
        textHu:
          'A jelzőlámpák nullavezetője a vezérlőáramkör nullájára megy, nem valamelyik szomszédos áramkör nullájára.',
      },
      {
        id: 'vis-4',
        textHu:
          'A lámpa meghibásodása nem befolyásolja a vezérlés működését: kiégett izzó mellett is indítható és leállítható a hajtás.',
      },
      {
        id: 'vis-5',
        textHu:
          'A visszajelzés színe és felirata megfelel a rajznak és a szokásos jelentésnek, nincs felcserélve az üzem és a hiba jelzése.',
      },
    ],
  },
  {
    id: 'forgasirany',
    titleHu: '8. Motor forgásirányának ellenőrzése',
    introHu:
      'A forgásirány a fázissorrendből következik. Az irányt lehetőleg még a hajtás összekapcsolása előtt tisztázod, mert egy rossz irányú indítás gépet és munkadarabot is tönkretehet.',
    safetyHu:
      'A fázissorrend és a bekötés kimérése feszültségmentesített, kikapcsolt és visszakapcsolás ellen biztosított állapotban, arra alkalmas műszerrel (fázissorrend-jelző, folytonosságvizsgáló) történik. A rövid próbaindítás feszültség alatti művelet: csak szakképzett felügyelettel, az érvényes eljárás szerint, szabaddá tett forgórész mellett szabad elvégezni. Ez az alkalmazás nem helyettesíti az oktatót, a szabványt és a hivatalos vizsgautasítást.',
    items: [
      {
        id: 'forg-1',
        textHu:
          'A motor kapocsdobozában a rajz szerinti kapcsolás van kialakítva, a hidak a megadott elrendezésben állnak.',
      },
      {
        id: 'forg-2',
        textHu:
          'A motorhoz vezető három fázis végig azonosítható és összhangban van a betáplálás fázissorrendjével.',
      },
      {
        id: 'forg-3',
        textHu:
          'A próba előtt a tengely szabad, nincs rajta munkadarab, szerszám vagy laza tárgy, és senki nem tartózkodik a forgó rész közelében.',
      },
      {
        id: 'forg-4',
        textHu:
          'Rossz irány esetén fáziscserét végzel: két fázisvezetőt cserélsz fel a feszültségmentesített motoron, a nullavezetőt és a védővezetőt soha nem mozgatod.',
      },
      {
        id: 'forg-5',
        textHu:
          'Irányváltó kapcsolásnál mindkét irányt kipróbálod, és ellenőrzöd, hogy irányváltás előtt a hajtás megáll, valamint a reteszelés végig működik.',
      },
    ],
  },
  {
    id: 'dokumentalas',
    titleHu: '9. Dokumentálás',
    introHu:
      'A vizsgán az számít elvégzettnek, amit igazolni is tudsz. A dokumentálás zárja a munkát: mit mértél, mivel, mikor, milyen eredménnyel, és mi maradt nyitva.',
    safetyHu:
      'Csak azt írd le, amit ténylegesen, megfelelő és ellenőrzött műszerrel megmértél; hiányzó adatot nem pótolsz becsléssel. A dokumentálás ideje alatt is feszültségmentesített, kikapcsolt és visszakapcsolás ellen biztosított legyen a tábla, kivéve az oktató által engedélyezett, szakképzett felügyelettel és az érvényes eljárás szerint végzett feszültség alatti méréseket. Ez az alkalmazás nem helyettesíti az oktatót, a szabványt és a hivatalos vizsgautasítást.',
    items: [
      {
        id: 'dok-1',
        textHu:
          'Felírod a mérés tárgyát, a mérés helyét, dátumát és a mérést végző nevét.',
      },
      {
        id: 'dok-2',
        textHu:
          'Rögzíted a használt műszer típusát, azonosítóját és az alkalmazott méréshatárt vagy mérőfeszültséget.',
      },
      {
        id: 'dok-3',
        textHu:
          'Minden mért értéket a mértékegységgel együtt jegyzel fel, áramkörönként külön sorban.',
      },
      {
        id: 'dok-4',
        textHu:
          'A hiányzó vagy a rajzból nem következő adatokat külön felsorolod, és megnevezed, mi kellene a meghatározásukhoz (például motor adattáblája, méretezés, kábelhossz).',
      },
      {
        id: 'dok-5',
        textHu:
          'A talált hibákat és az elvégzett javításokat leírod, és a javítás után megismételt méréseket is dokumentálod.',
      },
      {
        id: 'dok-6',
        textHu:
          'A dokumentumot az oktatóval átnézeted, és az értékelést a hivatalos vizsgautasítás szerinti formában zárod le.',
      },
    ],
  },
];
