# Forráselemzés

## Bevezető

Ez a dokumentum azt írja le, hogy a vizsgafelkészítő alkalmazás hét feladata (A-G) honnan származik, és hogy a forrásrajzokból pontosan mit olvastunk ki.
Azért készült, hogy bárki visszakereshesse: egy adott kötés, kapocsszám vagy szimulációs viselkedés a rajzon látható tény, oktatói döntés, vagy a modell egyszerűsítése.
A dokumentum három szintet választ szét mindenhol: **ami a rajzon van**, **amit ebből következtettünk**, és **amit a szimuláció miatt hozzátettünk**.

A négy eredeti forrás négy vizsgarajz PDF-je, mindegyik ugyanazzal a fejléccel:
"Komplex szakmai vizsga feladat. Épületvillamossági vagy villamos berendezés szerelési", képzőintézmény: MESTO CSOPORT Kft., dátum: 2021. 11. 22., méretarány: M 1 : X.
Ezekből készült az A, B, C és D feladat.
Az E, F és G feladat **nem a PDF-ekből származik**: ezek az oktató kérésére készült kiegészítések, hogy a tananyag lefedje az egyfázisú motorindítást és a mérőhely-kialakítást is.
A kiegészítő feladatoknak nincs forrásrajzuk, ezért ott a "rajzon látszik" rovat helyett a megrendelt tartalom szerepel.

Fontos keretfeltétel: az alkalmazás **de-energizált vizsgatábla** gyakorlását modellezi.
A tábla feszültségmentes, a betáplálást csak a szimuláció kapcsolja be, a tanuló sehol nem kap arra biztatást, hogy feszültség alatt dolgozzon.
A "feszültség alá helyezés" a szimulációban egy gombnyomás, a valóságban külön eljárás, felelősség és ellenőrzési sorrend tartozik hozzá.

## Áttekintő táblázat

| Feladat | Cím | Kategória | Forrás | Mit gyakoroltat |
| --- | --- | --- | --- | --- |
| A | Épületvillamossági szerelés | épületvillamosság | A jelű vizsgarajz PDF (MESTO CSOPORT Kft., 2021. 11. 22.) | Lépcsőházi automata három indítóhelyről, váltókapcsolás, védőérintkezős dugalj |
| B | Épületvillamossági szerelés | épületvillamosság | B jelű vizsgarajz PDF (MESTO CSOPORT Kft., 2021. 11. 22.) | Lépcsőházi automata két nyomógombról, keresztkapcsolás három helyről, dugalj |
| C | Motorindítás frekvenciaváltóval | motorvezérlés | C jelű vizsgarajz PDF (MESTO CSOPORT Kft., 2021. 11. 22.) | Öntartás, két leállító és két indító nyomógomb, motorvédő kapcsoló, üzemállapot-visszajelzés |
| D | Irányváltós motorvezérlés | motorvezérlés | D jelű vizsgarajz PDF (MESTO CSOPORT Kft., 2021. 11. 22.) | Két mágneskapcsoló, fáziscsere, kölcsönös reteszelés, irányonkénti visszajelzés |
| E | Egyfázisú motorindítás | motorvezérlés | Oktatói kiegészítés, nem PDF-forrás | Ugyanaz a vezérlési logika egyfázisú motorral, frekvenciaváltó nélkül |
| F | Háromfázisú mérőhely | mérőhely | Oktatói kiegészítés, nem PDF-forrás | Közvetlen mérésű fogyasztásmérő, főkapcsoló, 4 pólusú Fi-relé, terheléselosztás |
| G | Egyfázisú mérőhely | mérőhely | Oktatói kiegészítés, nem PDF-forrás | Egyfázisú mérőhely, főkismegszakító, Fi-relé, mérő előtti és utáni nulla |

## Közös modellezési döntések

Ezek minden feladatra érvényesek, ezért a feladatonkénti szakaszokban nem ismételjük meg őket.

### Csomópont és hálózatszámítás

A szimuláció csomópontja mindig `alkatreszAzonosito.sorkapocs` alakú, például `K1.A1` vagy `LA.3`.
A huzalok és az alkatrészek belső kötései egy union-find hálózatot alkotnak, a betáplálás pedig síneket (L1, L2, L3, N, PE) injektál a hálózatba.
A fogyasztók (izzó, jelzőlámpa, mágneskapcsoló-tekercs) **nem** kötik össze a saját kapcsaikat, ezért az a háló, amelyben fázis és nulla is megjelenik, valódi zárlat.

### A zárlatfelismerés topológiai, nem áramszámításos

A szimulátor nem modellez valós áramerősséget, impedanciát, hurokellenállást vagy kioldási karakterisztikát.
A zárlatot topológiailag ismeri fel: akkor van zárlat, ha egy csomópontban fázis és nulla, vagy két különböző fázis jelenik meg egyszerre.
Ha egy csomópontban fázis és PE találkozik, az testzárlat, és a Fi-relét oldja ki.

### A kioldás szelektivitása

Zárlatkor az a védelem old ki, amelyiknek a bontása megszünteti a zárlatot, és közben a legtöbb kapcsot hagyja feszültség alatt.
Ez adja a szelektivitást: nem a névleges áram, nem a karakterisztika és nem az idő dönt, hanem az, hogy melyik bontás oldja meg a hibát a legkisebb kieséssel.
Ha egyetlen készülék bontása sem szünteti meg a zárlatot, akkor minden érintett védelem kiold.
Ez tanulási célra jó közelítés, de vizsgán a szelektivitást névleges áram, karakterisztika és zárlati áram alapján kell indokolni.

### A fogyasztásmérő nem mér

A fogyasztásmérő kWh-számlálója mindig nullán áll, mert a szimuláció energiát nem mér.
A mérőn látható fázis- és nulla-visszajelzés viszont valós információ: abból derül ki, hogy a mérő átmenő kötése helyes-e.
Kitalált fogyasztási adatot sehol nem írunk ki.

### Nem találunk ki adatot

Ha egy érték a rajzból önmagában nem határozható meg, akkor az a feladat `unresolved` listájába kerül, és a felület megnevezi, mi hiányzik a meghatározásához.
Tipikus oktatási példát csak kifejezetten megjelölve adunk, és soha nem megoldásként.
A készülékrajzokon szereplő feliratok (például "B10" a kismegszakítón, "30 mA / 40 A" a Fi-relén, "1x63 A" az egyfázisú mérőn) csak grafikai illusztrációk.
Ezek nem a feladat megoldásai, és nem írják felül a feloldatlan értékek listáját.

---

## A feladat - Épületvillamossági szerelés

### Mi látszik közvetlenül a rajzon

A rajz bal oldalán egy szaggatott vonallal jelölt elosztótábla van, benne felül egy fázissín.
A táblában balról jobbra: Fi-1 jelű Fi-relé, majd F-1, F-2, F-3 jelű kismegszakító, mindegyik 1-es és 2-es kapoccsal.
A Fi-relé mellett "... mA, ... A" felirat áll, a kismegszakítók mellett "... ... A" felirat.
A tábla alsó részén vízszintes N-sín (szaggatott vonal) és PE-sín (pont-vonal) fut végig.
Az F-1 ága alatt egy négykapcsos készülékdoboz látszik N, L, 3 és 4 jelölésű kapcsokkal - ez a lépcsőházi automata.
A tábla alatt négy függőleges ág indul, feliratozva: "Betáplálás", "1-es világítási áramkör", "2-es világítási áramkör", "Dugaszoló aljzat áramkör".
Az 1-es világítási áramkör ágán fentről lefelé: egy kapcsoló, majd két nyomógomb, végül egy lámpa.
A 2-es világítási áramkör ágán két váltókapcsoló és egy lámpa.
A dugaszoló aljzat áramkörén egyetlen dugalj.
Minden vezetékszakasz mellett ".... db" felirat áll, ami az érszámot jelöli, és üresen van hagyva.
A rajz jobb oldalán készülékkép: egy Schrack elosztószekrény és a beépítendő szerelvények (kapcsolók, nyomógombok, dugalj, lámpahelyek), egymáshoz nem bekötve.

### Hogyan értelmeztük a rajzot

A betáplálás a Fi-relére megy, a Fi mögül indul mind a három áramkör, tehát a Fi-relé az egész fogyasztói oldalt védi.
Az F-1 kimenete két dolgot csinál egyszerre: ellátja a lépcsőházi automata L kapcsát, és állandó fázist ad a három indítóhelynek.
Az 1-es világítási kör tehát nem közvetlen kapcsolás, hanem impulzusvezérlés: a nyomógombok és a kapcsoló csak indítanak, a lámpát a lépcsőházi automata kapcsolja.

**Az ág legfontosabb értelmezési döntése:** a rajzon az 1-es világítási áramkör ágán egy váltókapcsoló és két nyomógomb szerepel egy lámpával, a táblában pedig egy lépcsőházi automata N, L, 3, 4 kapcsokkal.
Az oktató döntése alapján mindhárom eszköz kimenete az automata 3-as kapcsára megy, tehát **három indítóhely** van.
Ez értelmezés, nem a rajzból kiolvasható tény: a rajz a három eszköz és az automata közötti erek pontos útját nem rögzíti.
A modell ezt az oktatói döntést követi.

A 2-es világítási kör klasszikus váltókapcsolás: az F-2 fázisa a K2 váltókapcsoló közös kapcsára megy, a két váltóér a K3 váltókapcsolóra, K3 közös kapcsáról indul a lámpa.
A 3-as kör egyszerű dugaljkör: fázis a kismegszakítóról, nulla az N-sínről, védőföld a PE-sínről.

### Alkatrész- és kapocs-hozzárendelés

| Azonosító | Készülék | Kapcsok | Megjegyzés |
| --- | --- | --- | --- |
| `SUP` | Betáplálás | `L1`, `N`, `PE` | A szimuláció feszültségforrása |
| `FI` | Fi-relé, 2 pólusú | be: `L1`, `N1`; ki: `L2`, `N2` | A rajzon Fi-1 |
| `F1`, `F2`, `F3` | Kismegszakító 1P | `1` be, `2` ki | A rajzon F-1, F-2, F-3 |
| `LA` | Lépcsőházi automata | `L`, `N`, `3`, `4` | A rajzi kapocsjelölés változatlanul átvéve |
| `NB` | N-sín | `b0`-`b6` | Minden kapocs belsőleg összekötve |
| `PB` | PE-sín | `b0`-`b6` | Minden kapocs belsőleg összekötve |
| `K1` | Kapcsoló (indítóhely) | `1`, `2` | A rajzon váltókapcsoló-jel, indítóhelyként egy záró érintkező kell |
| `S1`, `S2` | Nyomógomb, záró (NO) | `3`, `4` | Indítóhelyek |
| `E1` | Lámpatest | `1`, `2` | Az 1-es kör lámpája |
| `K2`, `K3` | Váltókapcsoló | `P` közös, `1`, `2` | A 2-es kör váltókapcsolása |
| `E2` | Lámpatest | `1`, `2` | A 2-es kör lámpája |
| `X1` | Dugaszolóaljzat | `L`, `N`, `PE` | Védőérintkezős |

### A validátor által használt csomópontok

A csomópont-azonosítók elnevezése tájékoztató; a kötelező tartalom a kapocslista.

| Csomópont | Kapcsok | Szerep | Kör |
| --- | --- | --- | --- |
| betap-l | `SUP.L1`, `FI.L1` | Hálózati fázis a Fi-relé bemenetére | főáramkör |
| betap-n | `SUP.N`, `FI.N1` | Hálózati nulla a Fi-relé bemenetére | nulla |
| pe-sin | `SUP.PE`, `PB.b0` | Védőföld a PE-sínre | PE |
| fi-fazis | `FI.L2`, `F1.1`, `F2.1`, `F3.1` | Fi utáni fázis a három kismegszakítóra | főáramkör |
| fi-nulla | `FI.N2`, `NB.b0` | Fi utáni nulla az N-sínre | nulla |
| kor1-fazis | `F1.2`, `LA.L`, `K1.1`, `S1.3`, `S2.3` | Az 1-es kör állandó fázisa: automata tápja és a három indítóhely | főáramkör |
| la-nulla | `NB.b1`, `LA.N` | Az automata nullája | nulla |
| la-inditas | `K1.2`, `S1.4`, `S2.4`, `LA.3` | A három indítóhely közös indítóere az automata 3-as kapcsán | vezérlőáramkör |
| la-kimenet | `LA.4`, `E1.1` | Az automata kapcsolt kimenete a lámpára | főáramkör |
| e1-nulla | `NB.b2`, `E1.2` | Az E1 lámpa nullája | nulla |
| kor2-fazis | `F2.2`, `K2.P` | A 2-es kör fázisa az első váltókapcsolóra | főáramkör |
| valto-er1 | `K2.1`, `K3.1` | Első váltóér | főáramkör |
| valto-er2 | `K2.2`, `K3.2` | Második váltóér | főáramkör |
| e2-fazis | `K3.P`, `E2.1` | Kapcsolt fázis az E2 lámpára | főáramkör |
| e2-nulla | `NB.b3`, `E2.2` | Az E2 lámpa nullája | nulla |
| x1-fazis | `F3.2`, `X1.L` | Dugalj fázisa | főáramkör |
| x1-nulla | `NB.b4`, `X1.N` | Dugalj nullája | nulla |
| x1-pe | `PB.b1`, `X1.PE` | Dugalj védőföldje | PE |

### Bizonytalanságok

Az 1-es világítási kör három eszközének bekötése a rajzból nem egyértelmű, ezt oktatói döntés alapján oldottuk fel (lásd fent).
A rajzon az első indítóhely váltókapcsoló-jellel szerepel, de indítóhelyként csak egy záró érintkezőre van szükség, ezért a modellben egysarkú kapcsolóként viselkedik.
A rajz nem mondja meg, hogy melyik nyomógomb melyik helyiségben van, tehát a fizikai sorrend és a kötődobozok helye szabadon választható.
A rajz jobb oldali készülékképe csak a beépítendő szerelvényeket sorolja fel, kötési információt nem tartalmaz.
A táblán belüli sorrend (Fi-relé, majd kismegszakítók) a rajzból egyértelmű, de a sorkapocsléc kiosztása nem.

### Szándékosan feloldatlanul hagyott értékek

| Feloldatlan érték | Miért nem határozható meg |
| --- | --- |
| F-1, F-2, F-3 kismegszakító névleges árama | A rajzon "... ... A" áll. Hiányzik: a vezeték keresztmetszete, a kör terhelése, a fektetési mód, az egyidejűségi tényező és a környezeti hőmérséklet. |
| A Fi-relé érzékenysége és névleges árama | A rajzon "... mA, ... A" áll. Hiányzik: a védendő körök besorolása, a mögöttes terhelés, az érintésvédelmi kioldási feltétel és a hálózati rendszer (TN-S, TN-C-S, TT). |
| A kábelek érszáma minden szakaszon | A rajzon ".... db" áll. Hiányzik: a kapcsolási mód pontos kiosztása, a kötődobozok helye és az, hogy a védőföld melyik szakaszon fut végig. |

Ezek az értékek a rajzból önmagában nem határozhatók meg, ezért nem is találunk ki helyettük semmit.

### Az interaktív modellben használt feltételezések

A lépcsőházi automata beállított időtartamát 7 másodpercre vettük, hogy a gyakorlásban látható legyen a lejárat; a rajz időt nem ad meg.
Az automata a 3-as kapcson megjelenő fázisra indul, és amíg ott tartósan fázis van (például bennragadt kapcsoló), a modell folyamatos újraindulást és tartós fényt jelez.
A váltókapcsoló és a keresztkapcsoló pillanatállapota a szimulációban kattintással váltható, a valóságos szerelvény mechanikáját nem modellezzük.
A sínek hét kapcsot kínálnak, mind belsőleg összekötve; a valóságos sorkapocsléc kiosztása ennél kötöttebb.
A Fi-relé a modellben akkor old ki, ha fázis és PE ugyanabba a csomópontba kerül; differenciáláramot nem számol.

---

## B feladat - Épületvillamossági szerelés

### Mi látszik közvetlenül a rajzon

A táblarész teljesen megegyezik az A rajzéval: Fi-1 Fi-relé, F-1, F-2, F-3 kismegszakító, lépcsőházi automata N, L, 3, 4 kapcsokkal, alul N-sín és PE-sín.
A négy ág felirata is ugyanaz: "Betáplálás", "1-es világítási áramkör", "2-es világítási áramkör", "Dugaszoló aljzat áramkör".
Az 1-es világítási áramkör ágán **két nyomógomb** és egy lámpa van, kapcsoló nélkül.
A 2-es világítási áramkör ágán fentről lefelé: váltókapcsoló, keresztkapcsoló (X alakú jel), váltókapcsoló, végül lámpa.
A dugaljkör egy dugaljból áll.
A kismegszakítók mellett itt is "... ... A", a Fi-relé mellett "... mA, ... A", a vezetékszakaszok mellett ".... db" áll.
A rajz jobb oldalán az A-tól eltérően nem csak készüléklista van, hanem elrendezési rajz is: a Schrack elosztóból kiinduló vezetékhurok, kötődobozok és a szerelvények helye, két lámpahellyel.

### Hogyan értelmeztük a rajzot

A B feladat ugyanaz a tábla, mint az A, de a világítási körök nehezebbek.
Az 1-es kör itt tiszta lépcsőházi automatás kapcsolás két indítóhelyről: mindkét nyomógomb az automata 3-as kapcsára megy.
Ez a rajzból közvetlenül következik, mert az ágon csak nyomógombok vannak, más kapcsolóeszköz nincs.
A 2-es kör keresztkapcsolás három helyről: a két szélső eszköz váltókapcsoló, a középső keresztkapcsoló.
A keresztkapcsoló a két váltóért cseréli fel, ezért a két váltókapcsoló közé, a váltóerek útjába kerül.
A dugaljkör azonos az A feladatéval.

### Alkatrész- és kapocs-hozzárendelés

| Azonosító | Készülék | Kapcsok | Megjegyzés |
| --- | --- | --- | --- |
| `SUP` | Betáplálás | `L1`, `N`, `PE` | |
| `FI` | Fi-relé, 2 pólusú | be: `L1`, `N1`; ki: `L2`, `N2` | |
| `F1`, `F2`, `F3` | Kismegszakító 1P | `1` be, `2` ki | |
| `LA` | Lépcsőházi automata | `L`, `N`, `3`, `4` | |
| `NB`, `PB` | N-sín, PE-sín | `b0`-`b6` | |
| `S1`, `S2` | Nyomógomb, záró (NO) | `3`, `4` | Két indítóhely |
| `E1` | Lámpatest | `1`, `2` | Az 1-es kör lámpája |
| `K1`, `K3` | Váltókapcsoló | `P` közös, `1`, `2` | A keresztkapcsolás két szélső eszköze |
| `K2` | Keresztkapcsoló | be: `1`, `2`; ki: `3`, `4` | A középső eszköz |
| `E2` | Lámpatest | `1`, `2` | A 2-es kör lámpája |
| `X1` | Dugaszolóaljzat | `L`, `N`, `PE` | |

### A validátor által használt csomópontok

| Csomópont | Kapcsok | Szerep | Kör |
| --- | --- | --- | --- |
| betap-l | `SUP.L1`, `FI.L1` | Hálózati fázis a Fi-relére | főáramkör |
| betap-n | `SUP.N`, `FI.N1` | Hálózati nulla a Fi-relére | nulla |
| pe-sin | `SUP.PE`, `PB.b0` | Védőföld a PE-sínre | PE |
| fi-fazis | `FI.L2`, `F1.1`, `F2.1`, `F3.1` | Fi utáni fázis a kismegszakítókra | főáramkör |
| fi-nulla | `FI.N2`, `NB.b0` | Fi utáni nulla az N-sínre | nulla |
| kor1-fazis | `F1.2`, `LA.L`, `S1.3`, `S2.3` | Az automata tápja és a két indítóhely állandó fázisa | főáramkör |
| la-nulla | `NB.b1`, `LA.N` | Az automata nullája | nulla |
| la-inditas | `S1.4`, `S2.4`, `LA.3` | A két nyomógomb közös indítóere | vezérlőáramkör |
| la-kimenet | `LA.4`, `E1.1` | Az automata kapcsolt kimenete | főáramkör |
| e1-nulla | `NB.b2`, `E1.2` | Az E1 lámpa nullája | nulla |
| kor2-fazis | `F2.2`, `K1.P` | A keresztkapcsolás bemeneti fázisa | főáramkör |
| valto-er1 | `K1.1`, `K2.1` | Első váltóér a keresztkapcsolóig | főáramkör |
| valto-er2 | `K1.2`, `K2.2` | Második váltóér a keresztkapcsolóig | főáramkör |
| valto-er3 | `K2.3`, `K3.1` | Első váltóér a keresztkapcsolótól | főáramkör |
| valto-er4 | `K2.4`, `K3.2` | Második váltóér a keresztkapcsolótól | főáramkör |
| e2-fazis | `K3.P`, `E2.1` | Kapcsolt fázis az E2 lámpára | főáramkör |
| e2-nulla | `NB.b3`, `E2.2` | Az E2 lámpa nullája | nulla |
| x1-fazis | `F3.2`, `X1.L` | Dugalj fázisa | főáramkör |
| x1-nulla | `NB.b4`, `X1.N` | Dugalj nullája | nulla |
| x1-pe | `PB.b1`, `X1.PE` | Dugalj védőföldje | PE |

### Bizonytalanságok

A keresztkapcsoló bemeneti és kimeneti oldalának megnevezése (1-2, illetve 3-4) készülékfüggő, a rajz csak a jelet mutatja.
A modell az 1-2 kapcsot bemenetnek, a 3-4 kapcsot kimenetnek veszi; ez a szerelési logikát nem befolyásolja, mert a keresztkapcsoló szimmetrikus.
A rajz elrendezési része megadja a kötődobozok helyét, de nem adja meg, hogy melyik dobozban hány ér kötődik össze.
A két nyomógomb közötti fizikai sorrend szabadon választható, mert mindkettő ugyanarra a csomópontra megy.
A jobb oldali elrendezési rajzon a hurok vezetékvastagsága rajzi kiemelés, nem keresztmetszet-adat.

### Szándékosan feloldatlanul hagyott értékek

| Feloldatlan érték | Miért nem határozható meg |
| --- | --- |
| F-1, F-2, F-3 kismegszakító névleges árama | A rajzon "... ... A" áll. Hiányzik: a vezeték keresztmetszete, a kör terhelése, a fektetési mód, az egyidejűségi tényező és a környezeti hőmérséklet. |
| A Fi-relé érzékenysége és névleges árama | A rajzon "... mA, ... A" áll. Hiányzik: a védendő körök besorolása, a mögöttes terhelés, az érintésvédelmi kioldási feltétel és a hálózati rendszer típusa. |
| A kábelek érszáma minden szakaszon | A rajzon ".... db" áll. Hiányzik: a kötődobozok tényleges helye, a keresztkapcsolás erei szakaszonként, és a védőföld nyomvonala. |

### Az interaktív modellben használt feltételezések

A lépcsőházi automata itt is 7 másodperces beállítással működik.
A keresztkapcsoló alaphelyzetben egyenesen köt (1-3 és 2-4), átkapcsolva keresztez (1-4 és 2-3).
A váltókapcsolók alaphelyzete a `P`-`1` kötés.
A sínek belsőleg összekötött hétkapcsos sorkapcsok.
A tábla jobb oldali elrendezési rajzát a szimuláció nem modellezi, csak a kapcsolási logikát.

---

## C feladat - Motorindítás frekvenciaváltóval

### Mi látszik közvetlenül a rajzon

A rajz bal oldalán a főáramkör fut fentről lefelé.
Fent PE, N és L1 jelölés, alatta a Q-1 jelű frekvenciaváltó, bemeneti oldalán PE, L1 és N kapoccsal, kimeneti oldalán T1, T2 és T3 kapoccsal.
A készülék jelében "f1~" és "f2≈" felirat áll, ami frekvenciaátalakítást jelöl.
A T1, T2, T3 kimenet az F-1 jelű háromszoros kismegszakítóra megy (1-es és 2-es kapcsok, mellette "... ... A").
Onnan a K-1 mágneskapcsoló főérintkezőire (1-2, 3-4, 5-6), majd a HK-1 motorvédő kapcsolóra (L1, L2, L3 be, T1, T2, T3 ki).
A motorvédő kimenete a háromfázisú motor U1, V1, W1 kapcsára megy, a motor teste PE-re.
A rajz jobb oldalán a vezérlőáramkör: L1-ről az F-2 kismegszakító, onnan a HK-1 13-14 segédérintkezője.
Két szaggatott keretben "Terepi eszköz 1" és "Terepi eszköz 2" felirat van.
Az 1-es terepi eszközben S1 (1-2 kapocs) és S2 (3-4 kapocs), a 2-esben S3 (1-2 kapocs) és S4 (3-4 kapocs).
Alul a K-1 tekercs (A1, A2), mellette a P jelű piros és a Z jelű zöld jelzőlámpa.
A P lámpa a K-1 21-22 bontó érintkezőjén keresztül kap fázist, a K-1 13-14 záró érintkezője a tekerccsel párhuzamosan van bekötve.
A rajz jobb szélén "Hozzárendelési lista" táblázat van, benne: Q-1 frekvenciaváltó J-1000, 1,5 A; F-1 főáramköri zárlatvédelem B 10 A, 3x 1P; F-2 vezérlő áramköri zárlatvédelem B 10 A, 1P; HK-1 motorvédő kapcsoló B 10 A, 3P, 0,8-1,2 A; K-1 főáramköri mágneskapcsoló AC3 20 A; P és Z üzemállapot-visszajelzés 10 mA (piros, illetve zöld); S1 és S3 leállítás nyomógomb (piros); S2 és S4 indítás nyomógomb (zöld).

### Hogyan értelmeztük a rajzot

A frekvenciaváltó a rajzon **egyfázisú bemenettel és háromfázisú kimenettel** szerepel: bemenetén L1 és N, kimenetén T1, T2, T3.
Ez a kisebb, háztartási hálózatra köthető frekvenciaváltók tipikus felépítése, és a szimuláció pontosan így modellezi.
A frekvenciaváltó tehát nem csak fordulatszámot szabályoz, hanem fázisszámot is növel: a motor háromfázisú, a betáplálás egyfázisú.
A vezérlőáramkör nem a frekvenciaváltó kimenetéről, hanem a hálózati L1-ről kap fázist az F-2 kismegszakítón át.
A HK-1 motorvédő 13-14 segédérintkezője a vezérlés első eleme, tehát a motorvédő kioldása azonnal leállítja a vezérlést.
A két terepi eszköz egy-egy kezelőhely: mindkettőn van egy leállító és egy indító nyomógomb.
A leállító nyomógombok bontó (NC) érintkezők, ezért **sorba** kerülnek: bármelyik megnyomása leállít, és a vezeték szakadása is leállít.
Az indító nyomógombok záró (NO) érintkezők, ezért **párhuzamosan** kerülnek: bármelyikkel indítható a motor.
Az öntartást a K-1 saját 13-14 záró érintkezője adja: az indítógomb elengedése után ez tartja meg a tekercset.
A Z zöld lámpa a tekerccsel párhuzamos, tehát üzemet jelez; a P piros lámpa a 21-22 bontón át kap fázist, tehát álló állapotot jelez.

### Alkatrész- és kapocs-hozzárendelés

| Azonosító | Készülék | Kapcsok | Megjegyzés |
| --- | --- | --- | --- |
| `SUP` | Betáplálás | `L1`, `N`, `PE` | Egyfázisú hálózat |
| `Q1` | Frekvenciaváltó | be: `PE`, `L1`, `N`; ki: `T1`, `T2`, `T3` | A rajzon Q-1, J-1000 |
| `F1` | Kismegszakító 3x1P | be: `1a`, `1b`, `1c`; ki: `2a`, `2b`, `2c` | A rajzon F-1 |
| `K1` | Mágneskapcsoló | fő: `1`-`2`, `3`-`4`, `5`-`6`; tekercs: `A1`, `A2`; segéd: `13`-`14` (záró), `21`-`22` (bontó) | A rajzon K-1 |
| `HK` | Motorvédő kapcsoló, 3 pólusú | be: `L1`, `L2`, `L3`; ki: `T1`, `T2`, `T3`; segéd: `13`-`14` | A rajzon HK-1 |
| `M` | Motor 3~ | `U1`, `V1`, `W1`, `PE` | |
| `F2` | Kismegszakító 1P | `1`, `2` | Vezérlőáramköri zárlatvédelem |
| `S1`, `S3` | Nyomógomb, bontó (NC) | `1`, `2` | Leállítás, két helyről |
| `S2`, `S4` | Nyomógomb, záró (NO) | `3`, `4` | Indítás, két helyről |
| `P` | Jelzőlámpa, piros | `X1`, `X2` | Üzemállapot-visszajelzés: ÁLL |
| `Z` | Jelzőlámpa, zöld | `X1`, `X2` | Üzemállapot-visszajelzés: ÜZEM |
| `NB`, `PB` | N-sín, PE-sín | `b0`-`b6` | Vezérlési nulla és védőföld |

### A validátor által használt csomópontok

| Csomópont | Kapcsok | Szerep | Kör |
| --- | --- | --- | --- |
| betap-l | `SUP.L1`, `Q1.L1`, `F2.1` | Hálózati fázis a frekvenciaváltóra és a vezérlés védelmére | főáramkör |
| betap-n | `SUP.N`, `Q1.N`, `NB.b0` | Hálózati nulla a frekvenciaváltóra és az N-sínre | nulla |
| betap-pe | `SUP.PE`, `Q1.PE`, `PB.b0` | Védőföld a frekvenciaváltóra és a PE-sínre | PE |
| fv-ki-1 | `Q1.T1`, `F1.1a` | A frekvenciaváltó első kimeneti fázisa | főáramkör |
| fv-ki-2 | `Q1.T2`, `F1.1b` | Második kimeneti fázis | főáramkör |
| fv-ki-3 | `Q1.T3`, `F1.1c` | Harmadik kimeneti fázis | főáramkör |
| f1-k1-1 | `F1.2a`, `K1.1` | Zárlatvédelem után a mágneskapcsolóra | főáramkör |
| f1-k1-2 | `F1.2b`, `K1.3` | | főáramkör |
| f1-k1-3 | `F1.2c`, `K1.5` | | főáramkör |
| k1-hk-1 | `K1.2`, `HK.L1` | Mágneskapcsoló kimenete a motorvédőre | főáramkör |
| k1-hk-2 | `K1.4`, `HK.L2` | | főáramkör |
| k1-hk-3 | `K1.6`, `HK.L3` | | főáramkör |
| hk-motor-u | `HK.T1`, `M.U1` | Motorvédő kimenete a motorra | főáramkör |
| hk-motor-v | `HK.T2`, `M.V1` | | főáramkör |
| hk-motor-w | `HK.T3`, `M.W1` | | főáramkör |
| motor-pe | `PB.b1`, `M.PE` | A motor testének védőföldje | PE |
| vez-fazis | `F2.2`, `HK.13` | Vezérlési fázis a motorvédő segédérintkezőjére | vezérlőáramkör |
| vez-leallitas-1 | `HK.14`, `S1.1`, `K1.21` | A motorvédő után: első leállító gomb és az ÁLL-visszajelzés ága | vezérlőáramkör |
| vez-leallitas-2 | `S1.2`, `S3.1` | A két leállító gomb sorba kötése | vezérlőáramkör |
| vez-inditas | `S3.2`, `S2.3`, `S4.3`, `K1.13` | A leállító lánc után: két indítógomb és az öntartó érintkező bemenete | vezérlőáramkör |
| vez-tekercs | `S2.4`, `S4.4`, `K1.14`, `K1.A1`, `Z.X1` | Az indítógombok, az öntartás és a tekercs, valamint az ÜZEM-lámpa közös pontja | vezérlőáramkör |
| tekercs-nulla | `K1.A2`, `NB.b2` | A tekercs nullája | nulla |
| z-nulla | `Z.X2`, `NB.b3` | Az ÜZEM-lámpa nullája | nulla |
| p-fazis | `K1.22`, `P.X1` | Az ÁLL-lámpa a bontó érintkezőn át | vezérlőáramkör |
| p-nulla | `P.X2`, `NB.b4` | Az ÁLL-lámpa nullája | nulla |

### Bizonytalanságok

A rajz nem rögzíti, hogy a két leállító nyomógomb közül melyik van elöl a sorban, és hogy a két indító nyomógomb milyen sorrendben ágazik el.
Ez villamosan közömbös: a bontók sorba, a zárók párhuzamosan vannak, a sorrend a működést nem változtatja meg.
A vezérlőáramkör nullája a rajzon szaggatott vonalként érkezik vissza; ezt a modell a hálózati nulláról, az N-sínen keresztül vezeti.
A hozzárendelési listában az S1 sor áramértéke "10 mA", ami nyomógombhoz nem illik, és a lista többi nyomógombjánál 10 A szerepel.
Ezt a forrás elírásának tekintjük, és a modell nem használ belőle adatot.
A "Terepi eszköz 1" és "Terepi eszköz 2" keret azt jelzi, hogy a nyomógombok külön dobozban, a táblán kívül vannak, de a dobozok közti kábelezés érszámát a rajz nem adja meg.
A frekvenciaváltó paraméterezése (rámpa, frekvencia, motoradatok) nem tárgya a rajznak.

### Szándékosan feloldatlanul hagyott értékek

A C feladatnál a hozzárendelési lista a legtöbb készülékadatot megadja, ezért itt jóval kevesebb a feloldatlan érték, mint az A és B feladatnál.

| Feloldatlan érték | Miért nem határozható meg |
| --- | --- |
| A HK-1 motorvédő beállítási értéke a 0,8-1,2 A tartományon belül | Hiányzik a motor névleges árama és a motoradattábla. |
| A főáramkör és a vezérlőáramkör vezeték-keresztmetszete | Hiányzik a terhelés, a hossz, a fektetési mód és a megengedett feszültségesés. |
| A terepi eszközökhöz menő kábelek érszáma | Hiányzik a dobozok tényleges helye és az, hogy hány ér közös nyomvonalon fut. |

### Az interaktív modellben használt feltételezések

A frekvenciaváltó kimenetén a modell akkor ad három fázist (L1, L2, L3), ha a bemenetén fázis és nulla is van; közbenső állapotot, felfutást és hibakódot nem modellez.
A mágneskapcsoló meghúzott állapota állapotváltozó, nem minden számításnál újraszámolt érték - az öntartás csak így éli túl a következő számolási kört.
A motorvédő kapcsoló a modellben kézzel be- és kikapcsolható, és zárlatra kiold, de termikus túlterhelést idő és áram alapján nem modellez.
A motor forgásirányát a modell a T1, T2, T3 fázissorrendből olvassa ki, nyomatékot és fordulatszámot nem számol.
A nyomógombok nyomva tarthatók, és elengedéskor visszaállnak alaphelyzetbe.

---

## D feladat - Irányváltós motorvezérlés

### Mi látszik közvetlenül a rajzon

A felépítés a C rajzéhoz hasonló: bal oldalon főáramkör, jobb oldalon vezérlőáramkör, jobb szélen hozzárendelési lista.
A Q-1 frekvenciaváltó itt is egyfázisú bemenettel (PE, L1, N) és háromfázisú kimenettel (T1, T2, T3) szerepel.
A kimenet az F-1 háromszoros kismegszakítóra megy, onnan **két** mágneskapcsolóra: K-1 és K-2.
A K-1 főérintkezőin a fázisok egyenes sorrendben mennek át, a K-2 főérintkezőin a rajz a szélső két fázist felcseréli.
Mindkét mágneskapcsoló kimenete ugyanarra a HK-1 motorvédőre megy, onnan a motor U1, V1, W1 kapcsára.
A vezérlőáramkörben az F-2 kismegszakító után a HK-1 13-14 segédérintkezője következik.
A "Terepi eszköz 1" keretben három nyomógomb van: S2 (3-4), S1 (1-2) és S3 (4-3).
A vezérlés alsó részén balról jobbra: K-1 51-52 és K-2 52-51 bontó érintkezők sorban a P piros lámpához; középen K-1 13-14 záró és K-2 82-81 bontó a K-1 tekercséhez és a Z1 zöld lámpához; jobbra K-2 13-14 záró és K-1 82-81 bontó a K-2 tekercséhez és a Z2 zöld lámpához.
A hozzárendelési lista a C-hez képest kiegészül a K-2 mágneskapcsolóval (AC3 20 A) és a Z2 visszajelzővel, és három nyomógombot sorol fel: S1 leállítás (piros), S2 és S3 indítás (zöld).

### Hogyan értelmeztük a rajzot

Ez irányváltós motorvezérlés két mágneskapcsolóval.
A **fáziscsere** a rajzon egyértelműen látszik: a K-2 főérintkezőin a szélső két fázis fel van cserélve a K-1-hez képest, ezért a K-2 meghúzásakor a motor ellenkező irányba forog.
A modell ezt pontosan követi: az `F1.2a` fázis a `K1.1` és a `K2.5` kapocsra megy, az `F1.2c` fázis a `K1.5` és a `K2.1` kapocsra, a középső fázis mindkettőnél a 3-as kapcson marad.
A **kölcsönös reteszelés** szintén egyértelműen látszik: a 81-82 bontó érintkezők keresztbe vannak kötve.
A K-1 tekercs köre a K-2 82-81 bontóján keresztül megy, a K-2 tekercs köre a K-1 82-81 bontóján keresztül.
Így egyszerre soha nem húzhat meg mindkét mágneskapcsoló, tehát a fáziscsere nem okozhat kétfázisú zárlatot.
Ez a rajz legfontosabb biztonsági tartalma, és a modell pontosan ezt valósítja meg.
Az öntartást irányonként a saját 13-14 záró érintkező adja.
A P piros lámpa két bontó érintkezőn (K-1 51-52 és K-2 52-51) keresztül kap fázist, tehát csak akkor világít, ha mindkét mágneskapcsoló elengedett állapotban van: ez az ÁLL-visszajelzés.
A Z1 és Z2 zöld lámpa irányonkénti ÜZEM-visszajelzés, a saját tekerccsel párhuzamosan.
Az egyetlen S1 leállító nyomógomb bontó érintkező, és mindkét irány vezérlési ágának közös bemenetén van, ezért bármelyik irányból leállít.

### Alkatrész- és kapocs-hozzárendelés

| Azonosító | Készülék | Kapcsok | Megjegyzés |
| --- | --- | --- | --- |
| `SUP` | Betáplálás | `L1`, `N`, `PE` | Egyfázisú hálózat |
| `Q1` | Frekvenciaváltó | be: `PE`, `L1`, `N`; ki: `T1`, `T2`, `T3` | A rajzon Q-1 |
| `F1` | Kismegszakító 3x1P | be: `1a`, `1b`, `1c`; ki: `2a`, `2b`, `2c` | |
| `K1` | Mágneskapcsoló (előre) | fő: `1`-`2`, `3`-`4`, `5`-`6`; tekercs: `A1`, `A2`; segéd: `13`-`14` (záró), `51`-`52` (bontó), `81`-`82` (bontó) | |
| `K2` | Mágneskapcsoló (hátra) | ugyanaz a kiosztás | A főáramkörben fáziscserével kötve |
| `HK` | Motorvédő kapcsoló, 3 pólusú | be: `L1`, `L2`, `L3`; ki: `T1`, `T2`, `T3`; segéd: `13`-`14` | |
| `M` | Motor 3~ | `U1`, `V1`, `W1`, `PE` | |
| `F2` | Kismegszakító 1P | `1`, `2` | Vezérlőáramköri zárlatvédelem |
| `S1` | Nyomógomb, bontó (NC) | `1`, `2` | Közös leállítás |
| `S2`, `S3` | Nyomógomb, záró (NO) | `3`, `4` | Indítás irányonként |
| `P` | Jelzőlámpa, piros | `X1`, `X2` | ÁLL-visszajelzés |
| `Z1`, `Z2` | Jelzőlámpa, zöld | `X1`, `X2` | Irányonkénti ÜZEM-visszajelzés |
| `NB`, `PB` | N-sín, PE-sín | `b0`-`b6` | |

### A validátor által használt csomópontok

| Csomópont | Kapcsok | Szerep | Kör |
| --- | --- | --- | --- |
| betap-l | `SUP.L1`, `Q1.L1`, `F2.1` | Hálózati fázis a frekvenciaváltóra és a vezérlés védelmére | főáramkör |
| betap-n | `SUP.N`, `Q1.N`, `NB.b0` | Hálózati nulla | nulla |
| betap-pe | `SUP.PE`, `Q1.PE`, `PB.b0` | Védőföld | PE |
| fv-ki-1 | `Q1.T1`, `F1.1a` | A frekvenciaváltó kimenete a zárlatvédelemre | főáramkör |
| fv-ki-2 | `Q1.T2`, `F1.1b` | | főáramkör |
| fv-ki-3 | `Q1.T3`, `F1.1c` | | főáramkör |
| faz-a | `F1.2a`, `K1.1`, `K2.5` | Első fázis: K-1-nél egyenesen, K-2-nél cserélve | főáramkör |
| faz-b | `F1.2b`, `K1.3`, `K2.3` | Középső fázis: mindkét irányban ugyanaz | főáramkör |
| faz-c | `F1.2c`, `K1.5`, `K2.1` | Harmadik fázis: K-2-nél cserélve - ez a fáziscsere | főáramkör |
| ki-hk-1 | `K1.2`, `K2.2`, `HK.L1` | Mindkét mágneskapcsoló kimenete a motorvédőre | főáramkör |
| ki-hk-2 | `K1.4`, `K2.4`, `HK.L2` | | főáramkör |
| ki-hk-3 | `K1.6`, `K2.6`, `HK.L3` | | főáramkör |
| hk-motor-u | `HK.T1`, `M.U1` | Motorvédő kimenete a motorra | főáramkör |
| hk-motor-v | `HK.T2`, `M.V1` | | főáramkör |
| hk-motor-w | `HK.T3`, `M.W1` | | főáramkör |
| motor-pe | `PB.b1`, `M.PE` | A motor testének védőföldje | PE |
| vez-fazis | `F2.2`, `HK.13` | Vezérlési fázis a motorvédő segédérintkezőjére | vezérlőáramkör |
| vez-leallitas | `HK.14`, `S1.1`, `K1.51` | A motorvédő után a leállító gomb és az ÁLL-ág | vezérlőáramkör |
| vez-kozos | `S1.2`, `S2.3`, `S3.3`, `K1.13`, `K2.13` | A leállítás után közös pont: mindkét indítógomb és mindkét öntartó érintkező | vezérlőáramkör |
| elore-inditas | `S2.4`, `K1.14`, `K2.81` | Az előre indítás és az öntartás a K-2 reteszelő bontójára | vezérlőáramkör |
| elore-tekercs | `K2.82`, `K1.A1`, `Z1.X1` | A reteszelés után a K-1 tekercs és a Z1 lámpa | vezérlőáramkör |
| elore-nulla | `K1.A2`, `NB.b2` | A K-1 tekercs nullája | nulla |
| z1-nulla | `Z1.X2`, `NB.b3` | A Z1 lámpa nullája | nulla |
| hatra-inditas | `S3.4`, `K2.14`, `K1.81` | A hátra indítás és az öntartás a K-1 reteszelő bontójára | vezérlőáramkör |
| hatra-tekercs | `K1.82`, `K2.A1`, `Z2.X1` | A reteszelés után a K-2 tekercs és a Z2 lámpa | vezérlőáramkör |
| hatra-nulla | `K2.A2`, `NB.b4` | A K-2 tekercs nullája | nulla |
| z2-nulla | `Z2.X2`, `NB.b5` | A Z2 lámpa nullája | nulla |
| all-lanc | `K1.52`, `K2.52` | A két bontó érintkező sorba kötése az ÁLL-visszajelzéshez | vezérlőáramkör |
| p-fazis | `K2.51`, `P.X1` | Az ÁLL-lámpa fázisa | vezérlőáramkör |
| p-nulla | `P.X2`, `NB.b6` | Az ÁLL-lámpa nullája | nulla |

### Bizonytalanságok

A rajzon a nyomógombok sorrendje a terepi dobozban S2, S1, S3, ami a szerelési elrendezés kérdése, nem villamos kötés.
A rajz nem mondja meg, hogy melyik irány számít "előre" iránynak; a modell a K-1 ágat nevezi előre iránynak.
Az irányváltás előtti kötelező megállási idő (visszakapcsolási késleltetés) a rajzon nem szerepel, és a modell sem valósítja meg.
A vezérlési nulla útja a rajzon szaggatott visszatérő vonal, a modellben az N-sínen keresztül fut.
A hozzárendelési lista áramértékei a készülékválasztásra vonatkoznak, nem a bekötés ellenőrzésére.

### Szándékosan feloldatlanul hagyott értékek

| Feloldatlan érték | Miért nem határozható meg |
| --- | --- |
| A HK-1 motorvédő beállítási értéke a 0,8-1,2 A tartományon belül | Hiányzik a motor névleges árama és a motoradattábla. |
| A vezetékek keresztmetszete a fő- és a vezérlőáramkörben | Hiányzik a terhelés, a hossz, a fektetési mód és a megengedett feszültségesés. |
| Az irányváltás közti megállási idő | A rajz nem tartalmaz időadatot, és a hajtás tehetetlensége sem ismert. |

### Az interaktív modellben használt feltételezések

A kölcsönös reteszelést a modell villamosan valósítja meg, a 81-82 bontó érintkezőkkel; mechanikus reteszelést nem modellez.
Ha mindkét indítógombot egyszerre nyomja meg a tanuló, akkor az a mágneskapcsoló húz meg, amelyik előbb zárja a másik reteszelő érintkezőjét; ez a szimulációban determinisztikus, a valóságban nem az.
A motor forgásirányát a fázissorrendből olvassa ki a modell, ezért a fáziscsere hatása azonnal látszik.
A frekvenciaváltó kimenetén akkor van három fázis, ha a bemenetén fázis és nulla is van.
A P, Z1, Z2 lámpák a szimulációban ideális fogyasztók, áramfelvételük nem befolyásolja a hálózatot.

---

## E feladat - Egyfázisú motorindítás

**Forrás:** nincs PDF-rajz.
Ez a feladat az oktató kérésére készült kiegészítés, mert a négy vizsgarajz egyike sem gyakoroltatja a legegyszerűbb, frekvenciaváltó nélküli egyfázisú motorindítást.

### Mi látszik közvetlenül a rajzon

Nincs forrásrajz, ezért ez a rovat a megrendelt tartalmat írja le.
Az oktatói kérés: ugyanaz a vezérlési logika, mint a C feladatban (öntartás, bontó leállítógomb, motorvédő segédérintkezője, ÁLL és ÜZEM visszajelzés), de egyfázisú motorral és frekvenciaváltó nélkül.
A cél az, hogy a tanuló a vezérlési logikát a főáramkör bonyolultsága nélkül gyakorolhassa, egy leállító és egy indító nyomógombbal.

### Hogyan értelmeztük a kérést

A főáramkör egyfázisú: fázis az F-1 kismegszakítóról a K-1 mágneskapcsoló egyik főérintkezőjén és az egypólusú motorvédőn át a motor U1 kapcsára, a motor U2 kapcsa közvetlenül az N-sínre.
A motor teste a PE-sínre megy, és a védőföld sehol nincs kapcsolva.
A vezérlés fázisa az F-1 bemenetéről ágazik le az F-2 kismegszakítóra, tehát a vezérlés a főáramkör előtti pontról kap tápot, és külön zárlatvédelme van.
A vezérlési lánc: F-2, majd HK-1 13-14 segédérintkező, majd S1 bontó leállítógomb, majd S2 záró indítógomb, majd a K-1 tekercs A1 kapcsa.
Az öntartás a K-1 13-14 záró érintkezője, amely az indítógombbal párhuzamosan van bekötve.
A Z zöld lámpa a tekerccsel párhuzamos (ÜZEM), a P piros lámpa a K-1 21-22 bontóján át kap fázist (ÁLL).

### Alkatrész- és kapocs-hozzárendelés

| Azonosító | Készülék | Kapcsok | Megjegyzés |
| --- | --- | --- | --- |
| `SUP` | Betáplálás | `L1`, `N`, `PE` | |
| `F1` | Kismegszakító 1P | `1`, `2` | Főáramköri zárlatvédelem |
| `K1` | Mágneskapcsoló | fő: `1`-`2`; tekercs: `A1`, `A2`; segéd: `13`-`14` (záró), `21`-`22` (bontó) | Egyfázisú kör, egy főérintkező használatban |
| `HK` | Motorvédő kapcsoló, 1 pólusú | be: `L1`; ki: `T1`; segéd: `13`-`14` | |
| `M` | Motor 1~ | `U1`, `U2`, `PE` | |
| `F2` | Kismegszakító 1P | `1`, `2` | Vezérlőáramköri zárlatvédelem |
| `S1` | Nyomógomb, bontó (NC) | `1`, `2` | Leállítás |
| `S2` | Nyomógomb, záró (NO) | `3`, `4` | Indítás |
| `P` | Jelzőlámpa, piros | `X1`, `X2` | ÁLL-visszajelzés |
| `Z` | Jelzőlámpa, zöld | `X1`, `X2` | ÜZEM-visszajelzés |
| `NB`, `PB` | N-sín, PE-sín | `b0`-`b6` | |

### A validátor által használt csomópontok

| Csomópont | Kapcsok | Szerep | Kör |
| --- | --- | --- | --- |
| betap-l | `SUP.L1`, `F1.1`, `F2.1` | Hálózati fázis a fő- és a vezérlőáramkör védelmére | főáramkör |
| betap-n | `SUP.N`, `NB.b0` | Hálózati nulla az N-sínre | nulla |
| betap-pe | `SUP.PE`, `PB.b0` | Védőföld a PE-sínre | PE |
| fo-fazis | `F1.2`, `K1.1` | Zárlatvédelem után a mágneskapcsolóra | főáramkör |
| k1-hk | `K1.2`, `HK.L1` | Mágneskapcsoló kimenete a motorvédőre | főáramkör |
| hk-motor | `HK.T1`, `M.U1` | Motorvédő kimenete a motorra | főáramkör |
| motor-nulla | `NB.b1`, `M.U2` | A motor nullája | nulla |
| motor-pe | `PB.b1`, `M.PE` | A motor testének védőföldje | PE |
| vez-fazis | `F2.2`, `HK.13` | Vezérlési fázis a motorvédő segédérintkezőjére | vezérlőáramkör |
| vez-leallitas | `HK.14`, `S1.1`, `K1.21` | A motorvédő után a leállítógomb és az ÁLL-ág | vezérlőáramkör |
| vez-inditas | `S1.2`, `S2.3`, `K1.13` | A leállítás után az indítógomb és az öntartó érintkező bemenete | vezérlőáramkör |
| vez-tekercs | `S2.4`, `K1.14`, `K1.A1`, `Z.X1` | Az indítás, az öntartás, a tekercs és az ÜZEM-lámpa közös pontja | vezérlőáramkör |
| tekercs-nulla | `K1.A2`, `NB.b2` | A tekercs nullája | nulla |
| z-nulla | `Z.X2`, `NB.b3` | Az ÜZEM-lámpa nullája | nulla |
| p-fazis | `K1.22`, `P.X1` | Az ÁLL-lámpa a bontó érintkezőn át | vezérlőáramkör |
| p-nulla | `P.X2`, `NB.b4` | Az ÁLL-lámpa nullája | nulla |

### Bizonytalanságok

Nincs forrásrajz, ezért itt minden döntés szerkesztői döntés, nem rajzolvasás.
Az egyfázisú motor belső felépítését (segédtekercs, indítókondenzátor, üzemi kondenzátor) a feladat nem tárgyalja, a motor két kapoccsal és testtel szerepel.
Az egypólusú motorvédő kapcsoló a valóságban ritkább választás, mint a termikus túlterhelésvédelmi relé; a feladat a C feladat logikájának megismételhetősége miatt használja.
A vezérlés leágazása az F-1 **bemenetéről** történik, tehát a vezérlés akkor is feszültség alatt marad, ha az F-1 lekapcsol; ez tudatos oktatási tartalom, nem a rajz következménye.

### Szándékosan feloldatlanul hagyott értékek

| Feloldatlan érték | Miért nem határozható meg |
| --- | --- |
| Az F-1 és az F-2 kismegszakító névleges árama és karakterisztikája | Hiányzik a motor névleges árama, indítási árama, a vezeték keresztmetszete és a fektetési mód. |
| A HK-1 motorvédő beállítási tartománya és beállított értéke | Hiányzik a motor adattáblája. |
| A vezetékek keresztmetszete | Hiányzik a terhelés, a hossz és a megengedett feszültségesés. |

### Az interaktív modellben használt feltételezések

A készülékrajzokon látható feliratok (a mágneskapcsolón "AC3 20 A", a motorvédőn "0,8-1,2 A") a C és D feladat hozzárendelési listájából átvett grafikai elemek, nem az E feladat megoldásai.
Az egyfázisú motor akkor jár, ha az U1 kapcson fázis, az U2 kapcson nulla van; nyomatékot, szlipet és indítási áramlökést nem modellezünk.
A mágneskapcsoló egyfázisú körben is háromfázisú készülékként jelenik meg, ebből egy főérintkezőt használunk.
A motorvédő egypólusú változata a modellben az `L1`-`T1` főutat és a 13-14 segédérintkezőt kapcsolja.
Az öntartás állapotváltozóként él tovább a számítási körök között.

---

## F feladat - Háromfázisú mérőhely

**Forrás:** nincs PDF-rajz.
Ez a feladat az oktató kérésére készült kiegészítés: a négy vizsgarajz egyike sem tartalmaz mérőhely-kialakítást.

### Mi látszik közvetlenül a rajzon

Nincs forrásrajz, ezért ez a rovat a megrendelt tartalmat írja le.
Az oktatói kérés: háromfázisú mérőhely a hálózati csatlakozástól a fogyasztói körökig, közvetlen mérésű fogyasztásmérővel, főkapcsolóval és 4 pólusú Fi-relével.
A mérőhely után három egyfázisú áramkör induljon, fázisonként egy, hogy a terheléselosztás is gyakorolható legyen.

### Hogyan értelmeztük a kérést

A sorrend kötött és tananyagszerű: hálózat, főbiztosító, fogyasztásmérő, főkapcsoló, Fi-relé, fogyasztói kismegszakítók.
A nullát a mérőn át kell vezetni, mert a közvetlen mérésű mérő a fázis és a nulla közötti feszültséget is méri.
A fogyasztói nulla viszont már a Fi-relé **utáni** sínről jön, különben a Fi-relé minden terhelésnél kioldana, hiszen a visszatérő áram nem menne át rajta.
Ezért a feladatban két külön nulla-sín van: egy a mérő előtt, egy a Fi-relé után.
A 4 pólusú Fi-relé a nullát is kapcsolja és méri, ezért a nulla is átmegy rajta.
A védőföld végig a PE-sínről megy, sehol nincs kapcsolva, és nem megy át sem a mérőn, sem a Fi-relén.
A három fogyasztói kör külön fázisra kerül: F-1 a dugaljra, F-2 és F-3 egy-egy lámpára.

### Alkatrész- és kapocs-hozzárendelés

| Azonosító | Készülék | Kapcsok | Megjegyzés |
| --- | --- | --- | --- |
| `SUP` | Betáplálás 3~ | `L1`, `L2`, `L3`, `N`, `PE` | Hálózati csatlakozás |
| `F0` | Kismegszakító 3x1P | be: `1a`, `1b`, `1c`; ki: `2a`, `2b`, `2c` | Főbiztosító a mérő előtt |
| `KWH` | Fogyasztásmérő 3~ | be: `1`, `4`, `7` (fázisok), `10` (nulla); ki: `3`, `6`, `9` (fázisok), `11` (nulla) | Közvetlen mérésű |
| `FK` | Főkapcsoló 3P+N | be: `L1`, `L2`, `L3`, `N`; ki: `T1`, `T2`, `T3`, `TN` | |
| `FI` | Fi-relé, 4 pólusú | be: `L1`, `L2`, `L3`, `N1`; ki: `T1`, `T2`, `T3`, `N2` | |
| `NB0` | N-sín (mérő előtt) | `b0`-`b6` | A mérő előtti nulla |
| `NB` | N-sín (Fi után) | `b0`-`b6` | A fogyasztói nulla |
| `PB` | PE-sín | `b0`-`b6` | |
| `F1`, `F2`, `F3` | Kismegszakító 1P | `1`, `2` | Fogyasztói körök, fázisonként egy |
| `X1` | Dugaszolóaljzat | `L`, `N`, `PE` | |
| `E1`, `E2` | Lámpatest | `1`, `2` | |

### A validátor által használt csomópontok

| Csomópont | Kapcsok | Szerep | Kör |
| --- | --- | --- | --- |
| halozat-l1 | `SUP.L1`, `F0.1a` | Hálózati első fázis a főbiztosítóra | főáramkör |
| halozat-l2 | `SUP.L2`, `F0.1b` | Második fázis | főáramkör |
| halozat-l3 | `SUP.L3`, `F0.1c` | Harmadik fázis | főáramkör |
| halozat-n | `SUP.N`, `NB0.b0` | Hálózati nulla a mérő előtti N-sínre | nulla |
| halozat-pe | `SUP.PE`, `PB.b0` | Védőföld a PE-sínre | PE |
| mero-be-1 | `F0.2a`, `KWH.1` | Főbiztosító után a mérő 1-es kapcsára | főáramkör |
| mero-be-2 | `F0.2b`, `KWH.4` | Mérő 4-es kapocs | főáramkör |
| mero-be-3 | `F0.2c`, `KWH.7` | Mérő 7-es kapocs | főáramkör |
| mero-be-n | `NB0.b1`, `KWH.10` | A mérő előtti nulla a mérő 10-es kapcsára | nulla |
| mero-ki-1 | `KWH.3`, `FK.L1` | Mérő kimenete a főkapcsolóra | főáramkör |
| mero-ki-2 | `KWH.6`, `FK.L2` | | főáramkör |
| mero-ki-3 | `KWH.9`, `FK.L3` | | főáramkör |
| mero-ki-n | `KWH.11`, `FK.N` | A mért nulla a főkapcsolóra | nulla |
| fk-fi-1 | `FK.T1`, `FI.L1` | Főkapcsoló után a Fi-relére | főáramkör |
| fk-fi-2 | `FK.T2`, `FI.L2` | | főáramkör |
| fk-fi-3 | `FK.T3`, `FI.L3` | | főáramkör |
| fk-fi-n | `FK.TN`, `FI.N1` | A nulla is átmegy a Fi-relén | nulla |
| fi-ki-1 | `FI.T1`, `F1.1` | Fi után az első fázis a dugaljkör védelmére | főáramkör |
| fi-ki-2 | `FI.T2`, `F2.1` | Második fázis az első világítási körre | főáramkör |
| fi-ki-3 | `FI.T3`, `F3.1` | Harmadik fázis a második világítási körre | főáramkör |
| fi-ki-n | `FI.N2`, `NB.b0` | Fi utáni nulla a fogyasztói N-sínre | nulla |
| x1-fazis | `F1.2`, `X1.L` | Dugalj fázisa | főáramkör |
| x1-nulla | `NB.b1`, `X1.N` | Dugalj nullája a Fi utáni sínről | nulla |
| x1-pe | `PB.b1`, `X1.PE` | Dugalj védőföldje | PE |
| e1-fazis | `F2.2`, `E1.1` | Az E1 lámpa fázisa | főáramkör |
| e1-nulla | `NB.b2`, `E1.2` | Az E1 lámpa nullája | nulla |
| e2-fazis | `F3.2`, `E2.1` | Az E2 lámpa fázisa | főáramkör |
| e2-nulla | `NB.b3`, `E2.2` | Az E2 lámpa nullája | nulla |

### Bizonytalanságok

Nincs forrásrajz, ezért itt minden döntés szerkesztői döntés.
A mérőhely kialakítását a hálózati engedélyes (áramszolgáltató) csatlakozási előírása szabja meg, és ez szolgáltatónként és időszakonként eltér.
A mérő kapocsszámozása (1, 4, 7 fázis be, 10 nulla be, 3, 6, 9 fázis ki, 11 nulla ki) a legelterjedtebb közvetlen mérésű háromfázisú mérő kiosztása, de nem minden típusnál azonos.
A plombálandó rész határa (a mérő előtti mező) a feladatban nincs külön jelölve.
A főkapcsoló és a Fi-relé sorrendje a valóságban a szolgáltatói előírástól függ; itt a főkapcsoló van elöl, hogy a Fi-relé is feszültségmentesíthető legyen.
A vezérelt (H tarifás) kör, a tarifaváltó és a mérőhöz tartozó vezérlővezeték nem része a feladatnak.

### Szándékosan feloldatlanul hagyott értékek

| Feloldatlan érték | Miért nem határozható meg |
| --- | --- |
| Az F-0 főbiztosító névleges árama | Hiányzik a csatlakozási teljesítmény, a szolgáltatói szerződés és a csatlakozóvezeték keresztmetszete. |
| A mérő névleges árama és mérési tartománya | Hiányzik a szolgáltató által előírt mérőtípus. |
| A Fi-relé érzékenysége és névleges árama | Hiányzik a mögöttes körök besorolása, a hálózati rendszer típusa és az érintésvédelmi kioldási feltétel. |
| Az F-1, F-2, F-3 kismegszakítók névleges árama | Hiányzik a körök terhelése, a vezeték keresztmetszete és a fektetési mód. |
| A csatlakozó- és fogyasztói vezetékek keresztmetszete | Hiányzik a terhelés, a hossz és a megengedett feszültségesés. |

### Az interaktív modellben használt feltételezések

A fogyasztásmérő kWh-számlálója nullán áll, mert a szimuláció energiát nem mér.
A mérő fázis- és nulla-visszajelzése viszont valós: ha valamelyik fázis hiányzik, vagy két fázis össze van kötve, azt a modell jelzi.
Ha a mérő nullája nincs bekötve, a modell "nincs nulla - nem mér" állapotot jelez.
A mérőn látható "3x80 A" felirat grafikai illusztráció, nem a feladat megoldása.
A mérő a modellben átmenő kötés (1-3, 4-6, 7-9, 10-11), belső fogyasztása és mérőköri terhelése nincs.
A főkapcsoló mind a négy pólust egyszerre kapcsolja, késleltetés nélkül.
A 4 pólusú Fi-relé akkor old ki, ha fázis és PE ugyanabba a csomópontba kerül; valós differenciáláramot nem számol.
A terheléselosztás helyességét a modell abból látja, hogy a három fogyasztói kör három különböző fázisról jön, nem áramméréssel.

---

## G feladat - Egyfázisú mérőhely

**Forrás:** nincs PDF-rajz.
Ez a feladat az oktató kérésére készült kiegészítés, az F feladat egyfázisú párja.

### Mi látszik közvetlenül a rajzon

Nincs forrásrajz, ezért ez a rovat a megrendelt tartalmat írja le.
Az oktatói kérés: az F feladat logikája egyfázisú mérőhelyen, közvetlen mérésű egyfázisú fogyasztásmérővel, főkismegszakítóval és Fi-relével, két fogyasztói körrel.

### Hogyan értelmeztük a kérést

A sorrend: hálózat, F-0 főbiztosító, fogyasztásmérő, FM főkismegszakító, Fi-relé, fogyasztói kismegszakítók.
A mérőn a fázis és a nulla is átmegy: a fázis az 1-3, a nulla a 4-6 kapcson.
A főkismegszakító csak a fázist kapcsolja, ezért a mérő nullája közvetlenül a Fi-relé N bemenetére megy.
A fogyasztói nulla a Fi-relé utáni sínről jön, hogy a visszatérő áram is a Fi-relén keresztül folyjon.
A védőföld sehol nincs kapcsolva, és nem megy át sem a mérőn, sem a Fi-relén.
A két fogyasztói kör: F-1 a dugaljra, F-2 a lámpára; mindkettő ugyanarról a fázisról, mert egyfázisú a mérőhely.

### Alkatrész- és kapocs-hozzárendelés

| Azonosító | Készülék | Kapcsok | Megjegyzés |
| --- | --- | --- | --- |
| `SUP` | Betáplálás | `L1`, `N`, `PE` | Hálózati csatlakozás |
| `F0` | Kismegszakító 1P | `1`, `2` | Főbiztosító a mérő előtt |
| `KWH` | Fogyasztásmérő 1~ | be: `1` (fázis), `4` (nulla); ki: `3` (fázis), `6` (nulla) | Közvetlen mérésű |
| `FM` | Kismegszakító 1P | `1`, `2` | Főkismegszakító |
| `FI` | Fi-relé, 2 pólusú | be: `L1`, `N1`; ki: `L2`, `N2` | |
| `NB0` | N-sín (mérő előtt) | `b0`-`b6` | A mérő előtti nulla |
| `NB` | N-sín (Fi után) | `b0`-`b6` | A fogyasztói nulla |
| `PB` | PE-sín | `b0`-`b6` | |
| `F1`, `F2` | Kismegszakító 1P | `1`, `2` | Fogyasztói körök |
| `X1` | Dugaszolóaljzat | `L`, `N`, `PE` | |
| `E1` | Lámpatest | `1`, `2` | |

### A validátor által használt csomópontok

| Csomópont | Kapcsok | Szerep | Kör |
| --- | --- | --- | --- |
| halozat-l | `SUP.L1`, `F0.1` | Hálózati fázis a főbiztosítóra | főáramkör |
| halozat-n | `SUP.N`, `NB0.b0` | Hálózati nulla a mérő előtti N-sínre | nulla |
| halozat-pe | `SUP.PE`, `PB.b0` | Védőföld a PE-sínre | PE |
| mero-be-l | `F0.2`, `KWH.1` | Főbiztosító után a mérő 1-es kapcsára | főáramkör |
| mero-be-n | `NB0.b1`, `KWH.4` | A mérő előtti nulla a mérő 4-es kapcsára | nulla |
| mero-ki-l | `KWH.3`, `FM.1` | A mért fázis a főkismegszakítóra | főáramkör |
| fm-fi | `FM.2`, `FI.L1` | A főkismegszakító után a Fi-relére | főáramkör |
| mero-ki-n | `KWH.6`, `FI.N1` | A mért nulla közvetlenül a Fi-relé N bemenetére | nulla |
| fi-ki-l | `FI.L2`, `F1.1`, `F2.1` | Fi utáni fázis a két fogyasztói kismegszakítóra | főáramkör |
| fi-ki-n | `FI.N2`, `NB.b0` | Fi utáni nulla a fogyasztói N-sínre | nulla |
| x1-fazis | `F1.2`, `X1.L` | Dugalj fázisa | főáramkör |
| x1-nulla | `NB.b1`, `X1.N` | Dugalj nullája a Fi utáni sínről | nulla |
| x1-pe | `PB.b1`, `X1.PE` | Dugalj védőföldje | PE |
| e1-fazis | `F2.2`, `E1.1` | A lámpa fázisa | főáramkör |
| e1-nulla | `NB.b2`, `E1.2` | A lámpa nullája | nulla |

### Bizonytalanságok

Nincs forrásrajz, ezért itt minden döntés szerkesztői döntés.
Az egyfázisú mérő kapocsszámozása (1 és 4 be, 3 és 6 ki) a legelterjedtebb kiosztás, de típusonként eltérhet.
Az, hogy a főkismegszakító a mérő után és a Fi-relé előtt van, szolgáltatói előírás kérdése.
Az, hogy a mérő nullája a főkismegszakítót megkerülve megy a Fi-relére, következik abból, hogy a főkismegszakító egypólusú; kétpólusú főkapcsolónál ez másképp néz ki.
A plombálandó mérő előtti mező határa a feladatban nincs külön jelölve.

### Szándékosan feloldatlanul hagyott értékek

| Feloldatlan érték | Miért nem határozható meg |
| --- | --- |
| Az F-0 főbiztosító és az FM főkismegszakító névleges árama | Hiányzik a csatlakozási teljesítmény, a szolgáltatói szerződés és a csatlakozóvezeték keresztmetszete. |
| A mérő névleges árama | Hiányzik a szolgáltató által előírt mérőtípus. |
| A Fi-relé érzékenysége és névleges árama | Hiányzik a mögöttes körök besorolása, a hálózati rendszer típusa és az érintésvédelmi kioldási feltétel. |
| Az F-1 és F-2 kismegszakító névleges árama | Hiányzik a körök terhelése, a vezeték keresztmetszete és a fektetési mód. |
| A vezetékek keresztmetszete | Hiányzik a terhelés, a hossz és a megengedett feszültségesés. |

### Az interaktív modellben használt feltételezések

A fogyasztásmérő kWh-számlálója nullán áll, mert a szimuláció energiát nem mér.
A mérő fázis- és nulla-visszajelzése valós információ: ebből látszik, hogy az átmenő kötés (1-3 és 4-6) helyes-e.
A mérőn látható "1x63 A" felirat grafikai illusztráció, nem a feladat megoldása.
A Fi-relé akkor old ki, ha fázis és PE ugyanabba a csomópontba kerül.
A dugalj és a lámpa ideális fogyasztó, áramfelvételük nem befolyásolja a hálózatot.
A mérő előtti és a Fi utáni N-sín két külön alkatrész, hogy a tanuló ne tudja véletlenül összekötni a kettőt; a valóságban ez a hiba a Fi-relé folyamatos kioldását okozná.

---

## Összefoglalás: mit nem tud a modell

Ez a lista tudatos korlát, nem hiányosság, és a tananyagban is így kell megjeleníteni.

A szimulátor nem modellez valós áramerősséget, impedanciát, hurokellenállást, feszültségesést és kioldási karakterisztikát.
A zárlatot topológiailag ismeri fel: fázis és nulla, vagy két fázis egy csomópontban.
A kioldás szelektivitását azzal dönti el, melyik védelem bontása szünteti meg a zárlatot a legtöbb áramkör feszültség alatt hagyása mellett.
A termikus túlterhelés, a késleltetés, az indítási áramlökés és az anyagfáradás nincs modellezve.
A fogyasztásmérő nem mér energiát, a számlálója mindig nullán áll.
A frekvenciaváltó paraméterezése, rámpái és hibakódjai nincsenek modellezve.
A készülékrajzokon látható áram- és érzékenységi feliratok grafikai illusztrációk, nem a feladatok megoldásai.
A mérés, a szemrevételezés és a feszültségmentesítés lépéseit a tananyag szövege tárgyalja, a szimuláció nem helyettesíti őket.
A tábla végig feszültségmentes állapotban szerelendő; a feszültség alá helyezés csak a kész, ellenőrzött bekötés után, a szimulációban egy gombnyomással történik.

## H - Csillag-delta indítás időrelével

**Forrás:** „Csillag-delta.pdf”, 2 oldal (1. oldal vezérlés, 2. oldal főáramkör), az eredeti rajz a `public/source-previews/H.png`.

**Ami a rajzon van:**
- Főáramkör: X1 1-3 (L1-L3) → F2 háromfázisú motorvédő kapcsoló → Q11 1-3-5; az F2 kimenete a Q15 1-3-5 bemenetére is megy. Q11 2-4-6 → X1 6-8; Q15 2-4-6 → X1 9-11 és a Q13 2-4-6; a Q13 1-3-5 áthidalva. X1 12: PE. Külön háromfázisú kismegszakító és hőkioldó nincs.
- Vezérlés: X1-1 (L1) → F1 → S1 (bontó) → S2 (záró) ∥ Q11 53-54 → Q11 13-14 ∥ Q13 53-54 → Q11 és K1 (időrelé) tekercs. A S2 utáni pontról K1 15-16 → Q15 21-22 → Q13 tekercs, illetve K1 15-18 → Q13 21-22 → Q15 tekercs. Az F2 segédérintkezője nincs a vezérlésben.
- Jelzés: F1 után Q11 61-62 → P1, Q13 83-84 → P2, Q15 83-84 → P3; A2 és X2 az X1-4 (N) pontra.

**Amit következtettünk:** a motor kapocstábláját a rajz nem mutatja; a delta helyes fázissorrendje miatt X1 9 = W2, X1 10 = U2, X1 11 = V2. A P1 a Q11 bontóján át az álló állapotot jelzi.

**Amit a szimuláció miatt egyszerűsítettünk:** az X1 sorkapocs elmarad, a vezetékek közvetlenül a motor kapcsaira mennek; az időrelé késleltetése 5 s; az N-sín csavarszáma miatt a P3 nullája a P2-n át csatlakozik (azonos csomópont).
