/**
 * Fogalomtár a vizsgafelkészítéshez. Rövid, pontos meghatározások abban a
 * nyelvezetben, ahogyan a vizsgán is kérdezik. A definíciók nem tartalmaznak
 * kitalált határértéket vagy előírást; a konkrét számokat mindig a méretezés,
 * a szabvány és a hivatalos vizsgautasítás adja meg.
 */

export interface GlossaryEntry {
  termHu: string;
  defHu: string;
}

export const GLOSSARY: GlossaryEntry[] = [
  {
    termHu: 'Öntartás',
    defHu:
      'A mágneskapcsoló saját záró (NO) segédérintkezője a hozzá tartozó indítás nyomógombbal párhuzamosan van kötve, így a gomb elengedése után a tekercs áramköre zárva marad, és a kapcsoló behúzva marad a leállításig.',
  },
  {
    termHu: 'Reteszelés',
    defHu:
      'Olyan bekötés, amely megakadályozza két üzemállapot egyidejű létrejöttét. Villamos reteszelésnél a másik mágneskapcsoló bontó (NC) érintkezője van sorba kötve a tekerccsel, mechanikus reteszelésnél a készülékek fizikailag akadályozzák egymást.',
  },
  {
    termHu: 'Záró (NO) érintkező',
    defHu:
      'Alapállapotban nyitott érintkező, amely működtetéskor zár. Kapocsjelölése tipikusan 13-14 vagy 3-4. Indítás nyomógombként és öntartó érintkezőként ezt használjuk.',
  },
  {
    termHu: 'Bontó (NC) érintkező',
    defHu:
      'Alapállapotban zárt érintkező, amely működtetéskor nyit. Kapocsjelölése tipikusan 21-22 vagy 1-2. Leállítás nyomógombként, reteszelésben és hőkioldó jelzésére ezt használjuk.',
  },
  {
    termHu: 'Nyomógomb',
    defHu:
      'Kézzel működtetett, önmagától alapállapotba visszatérő kapcsolóelem a vezérlőáramkörben. Lehet záró (indítás) vagy bontó (leállítás), és a kettő egy készülékben is szerepelhet.',
  },
  {
    termHu: 'Mágneskapcsoló',
    defHu:
      'Elektromágnessel működtetett kapcsolókészülék. Az A1-A2 kapcsokra kapcsolt tekercs behúzza a főérintkezőket (például 1-2, 3-4, 5-6), és mozgatja a segédérintkezőket is. Kisáramú vezérléssel nagy teljesítményű főáramkör kapcsolható vele.',
  },
  {
    termHu: 'Motorvédő kapcsoló',
    defHu:
      'A motor túlterhelés és zárlat elleni védelmét ellátó készülék, állítható áramtartománnyal. A beállított értéket a motor adattáblája szerinti névleges áramhoz igazítjuk; bontó segédérintkezője a vezérlőáramkört szakítja meg kioldáskor.',
  },
  {
    termHu: 'Főáramkör',
    defHu:
      'Az az áramköri rész, amely a fogyasztó munkaáramát vezeti: betáplálás, védelmi készülékek, mágneskapcsoló főérintkezői és a motor vagy más terhelés. Nagyobb keresztmetszet és nagyobb áram jellemzi.',
  },
  {
    termHu: 'Vezérlőáramkör',
    defHu:
      'A működtetés logikáját megvalósító, kis áramú áramkör: nyomógombok, segédérintkezők, mágneskapcsoló-tekercs, jelzőlámpák. Külön védelemmel készül, és a rajzon is elkülönül a főáramkörtől.',
  },
  {
    termHu: 'Üzemállapot-visszajelzés',
    defHu:
      'Jelzőlámpás vagy kijelzős visszajelzés a berendezés tényleges állapotáról. Helyesen a mágneskapcsoló segédérintkezőjéről vezérelt, nem a nyomógombról, így a valós behúzott vagy elengedett állapotot mutatja.',
  },
  {
    termHu: 'Fáziscsere',
    defHu:
      'Két fázisvezető felcserélése a háromfázisú motor betáplálásában, aminek hatására a forgó mágneses mező iránya, tehát a motor forgásiránya megfordul. A nullavezetőt és a védővezetőt sohasem cseréljük.',
  },
  {
    termHu: 'Lépcsőházi automata',
    defHu:
      'Időzítő készülék, amely nyomógombos jelre bekapcsolja a világítást, majd a beállított idő letelte után automatikusan lekapcsolja. Több helyről működtethető, mert a nyomógombok párhuzamosan vannak kötve.',
  },
  {
    termHu: 'Fi-relé (áram-védőkapcsoló)',
    defHu:
      'A be- és kimenő áramok különbségét figyelő védelmi készülék. Ha a hibaáram eléri a készülék érzékenységét, lekapcsolja a védett áramkört. Feltétele, hogy a védett áramkör nullavezetője átmenjen a készüléken, és ne keveredjen más áramkör nullájával.',
  },
  {
    termHu: 'Érintésvédelem',
    defHu:
      'Intézkedések összessége, amelyek megakadályozzák, hogy hiba esetén az érinthető fém részek veszélyes feszültség alá kerüljenek. Része a védővezető, a védőkapcsolás, a védelmi készülékek és a szigetelés épsége.',
  },
  {
    termHu: 'TN-S rendszer',
    defHu:
      'Olyan hálózati rendszer, amelyben a nullavezető (N) és a védővezető (PE) a betáplálástól kezdve végig külön vezetőként fut, és sehol nincs összekötve a fogyasztói oldalon.',
  },
  {
    termHu: 'Szelektivitás',
    defHu:
      'A védelmi készülékek olyan összehangolása, hogy hiba esetén csak a hibához legközelebbi készülék kapcsoljon le, a fölötte lévő pedig üzemben maradjon. Így a hiba nem érinti a hálózat egészét.',
  },
  {
    termHu: 'Zárlati áram',
    defHu:
      'A fázisvezető és egy másik vezető (nulla, védővezető vagy másik fázis) közötti, elhanyagolható ellenállású összeköttetés esetén folyó nagy áram. Nagysága a hálózat impedanciájától függ, és ehhez kell megválasztani a védelmi készülékek zárlati kapcsolóképességét.',
  },
  {
    termHu: 'Kioldási karakterisztika',
    defHu:
      'A kismegszakító működését leíró jelleggörbe, amely megmutatja, mekkora áramnál mennyi idő alatt kapcsol le. A betűjel (például B, C, D) a gyors, mágneses kioldás áramtartományára utal, a termikus rész pedig a tartós túlterhelést kezeli.',
  },
  {
    termHu: 'Kismegszakító',
    defHu:
      'Túlterhelés és zárlat ellen védő, visszakapcsolható készülék. Két kioldója van: a termikus a tartós túláramra, a mágneses a zárlati áramra reagál. Jellemzői a névleges áram, a karakterisztika és a zárlati kapcsolóképesség.',
  },
  {
    termHu: 'Közvetlen mérésű fogyasztásmérő',
    defHu:
      'Olyan fogyasztásmérő, amelyen a fogyasztó teljes árama átfolyik, mérőváltó közbeiktatása nélkül. Bekötésekor a betáplálási és a fogyasztói oldal nem cserélhető fel, és a nullavezetőnek is át kell mennie a készüléken.',
  },
  {
    termHu: 'Váltókapcsolás',
    defHu:
      'Két váltókapcsolóval megvalósított világításvezérlés, amelynél a lámpa mindkét helyről, egymástól függetlenül fel- és lekapcsolható. A két kapcsoló között a két váltóvezeték teremti meg a kapcsolatot.',
  },
  {
    termHu: 'Keresztkapcsolás',
    defHu:
      'Kettőnél több kapcsolási helyet biztosító megoldás: a két végponton váltókapcsoló, közöttük egy vagy több keresztkapcsoló van, amely a két váltóvezeték kapcsolatát cseréli fel.',
  },
  {
    termHu: 'Csomópont',
    defHu:
      'Azonos potenciálú, egymással közvetlenül összekötött kapcsok halmaza az áramkörben. A rajzon a bekötött vezetékek találkozási pontja jelöli; ellenőrzéskor azt vizsgáljuk, hogy a valóságban ugyanazok a kapcsok tartoznak-e egy csomópontba.',
  },
  {
    termHu: 'Potenciál',
    defHu:
      'Egy pont villamos szintje egy megállapodás szerinti vonatkoztatási ponthoz, jellemzően a földhöz képest. Két pont potenciáljának különbsége a feszültség, amely az áramot hajtja.',
  },
  {
    termHu: 'Terhelés',
    defHu:
      'Az az áramköri elem vagy elemek összessége, amely a villamos energiát felveszi és más energiává alakítja: motor, izzó, fűtőtest, tekercs. A terhelés árama határozza meg a vezeték keresztmetszetét és a védelem méretezését.',
  },
  {
    termHu: 'Névleges áram',
    defHu:
      'A készülék vagy vezeték olyan áramértéke, amelyre tervezték, és amelyet tartósan üzemszerűen elvisel. Készülékeknél a típusjelzésen szerepel; a helyes érték kiválasztása méretezés kérdése, nem olvasható le pusztán a kapcsolási rajzról.',
  },
  {
    termHu: 'Frekvenciaváltó',
    defHu:
      'Elektronikus készülék, amely a motor tápfeszültségének frekvenciáját és nagyságát változtatva szabályozza a fordulatszámot és a nyomatékot. Lágy indítást és irányváltást is lehetővé tesz, de szigetelésmérés előtt le kell választani.',
  },
  {
    termHu: 'Csillag-delta indítás',
    defHu:
      'Indítási mód, amelynél a motor tekercsei előbb csillagba, majd átkapcsolás után deltába kerülnek. A csillag fokozat csökkenti az indítási áramot; a két állapotot reteszelt mágneskapcsolók és időrelé kapcsolja.',
  },
  {
    termHu: 'Védővezető (PE)',
    defHu:
      'Zöld-sárga jelölésű vezető, amely a berendezés érinthető fém részeit köti össze a földelési rendszerrel. Hiba esetén ezen folyik a hibaáram a védelem működéséhez. A védővezetőbe soha nem kerülhet kapcsoló vagy biztosító.',
  },
  {
    termHu: 'Nullavezető (N)',
    defHu:
      'Kék jelölésű üzemi vezető, amely az egyfázisú fogyasztók áramát viszi vissza a betáplálás csillagpontjához. Nem azonos a védővezetővel, és nem használható annak helyettesítésére.',
  },
  {
    termHu: 'Fázisvezető (L)',
    defHu:
      'Az üzemi feszültséget vivő vezető, jellemzően barna, fekete vagy szürke színnel jelölve. Háromfázisú rendszerben L1, L2, L3 jelöléssel. A kapcsolókat és a védelmeket mindig a fázisvezetőbe kötjük.',
  },
  {
    termHu: 'Feszültségmentesítés',
    defHu:
      'A munkavégzés előtti eljárás: lekapcsolás, visszakapcsolás elleni biztosítás, a feszültségmentes állapot ellenőrzése megfelelő műszerrel, valamint a szükséges földelés és a szomszédos feszültség alatti részek határolása.',
  },
  {
    termHu: 'Szigetelési ellenállás',
    defHu:
      'Az áramvezető részek egymástól és a védővezetőtől való elszigeteltségét jellemző mennyiség, amelyet szigetelésvizsgáló műszerrel, feszültségmentesített berendezésen mérünk. Az elvárt értéket az oktató, a szabvány és a vizsgautasítás adja meg.',
  },
  {
    termHu: 'Szerelési útvonal',
    defHu:
      'A vezetékek táblán vagy falon belüli, tervezett és követhető nyomvonala. Rendezett, párhuzamos vezetés, megengedett irányváltások és megfelelő rögzítés jellemzi, hogy a bekötés később is ellenőrizhető legyen.',
  },
  {
    termHu: 'Kötéspont',
    defHu:
      'Az a hely, ahol a vezeték egy készülék kapcsához vagy egy másik vezetékhez csatlakozik. Csak arra való kapoccsal, megfelelő csupaszítási hosszal és érvéghüvellyel készül, hozzáférhető és ellenőrizhető módon; a szigetelés nem kerülhet a szorító alá.',
  },
];
