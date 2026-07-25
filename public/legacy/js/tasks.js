/* A negy vizsgafeladat: tabla-osszeallitas + referenciamegoldas.
   A megoldas huzallista: [honnan, hova, szin].
   Szinek: br = barna (fazis), bl = kek (nulla), gy = zold-sarga (PE),
           bk = fekete, gr = szurke (kapcsolt / vezerlo erek). */
(function () {
  'use strict';
  var EE = (window.EE = window.EE || {});

  function part(id, type, x, y, label, opt) {
    return { id: id, type: type, x: x, y: y, label: label, opt: opt || null };
  }

  /* ================= A feladat ========================================= */
  var A = {
    id: 'A',
    title: 'Épületvillamossági szerelés',
    subtitle: 'Lépcsőházi automata · váltókapcsolás · dugalj',
    world: [1420, 1080],
    brief:
      'Három áramkör egy Fi-relé mögött. Az 1-es világítási kört lépcsőházi ' +
      'automata kapcsolja, három helyről indítva: egy kapcsoló és két nyomógomb. ' +
      'A 2-es kör váltókapcsolás két helyről. A 3-as kör egy védőérintkezős dugalj.',
    steps: [
      'Betáplálás a Fi-relére, onnan a három kismegszakítóra. A nulla az N-sínre, a védőföld a PE-sínre.',
      'F-1 kimenete az automata L kapcsára, az N-sínről a nulla az N kapcsára.',
      'Ugyanaz az F-1 kimenet adja az állandó fázist a K1 kapcsolóra és az S1, S2 nyomógombra.',
      'Mindhárom eszköz kimenete az automata 3-as kapcsára megy - innen indul a világítás.',
      'Az automata 4-es kapcsa az E1 lámpára, a lámpa másik oldala az N-sínre.',
      'F-2 a K2 váltóra, két ér a K3 váltóra, K3 közös kapcsa az E2 lámpára.',
      'F-3 a dugalj L kapcsára, mellé a nulla és a védőföld a sínekről.'
    ],
    parts: [
      part('SUP', 'feed', 40, 60, 'Betáplálás'),
      part('FI', 'rcd', 250, 90, 'Fi-1'),
      part('F1', 'mcb', 450, 90, 'F-1'),
      part('F2', 'mcb', 550, 90, 'F-2'),
      part('F3', 'mcb', 650, 90, 'F-3'),
      part('LA', 'stair', 770, 90, 'LA-1'),
      part('NB', 'busbar', 1000, 90, 'N-sín'),
      part('PB', 'busbar', 1000, 230, 'PE-sín'),

      part('K1', 'sw1', 80, 420, 'K1'),
      part('S1', 'btn', 280, 420, 'S1'),
      part('S2', 'btn', 480, 420, 'S2'),
      part('E1', 'lamp', 720, 410, 'E1'),

      part('K2', 'sw2', 80, 650, 'K2'),
      part('K3', 'sw2', 300, 650, 'K3'),
      part('E2', 'lamp', 540, 640, 'E2'),

      part('X1', 'socket', 80, 870, 'X1')
    ],
    solution: [
      ['SUP.L1', 'FI.L1', 'br'],
      ['SUP.N', 'FI.N1', 'bl'],
      ['SUP.PE', 'PB.b0', 'gy'],
      ['FI.L2', 'F1.1', 'br'],
      ['F1.1', 'F2.1', 'br'],
      ['F2.1', 'F3.1', 'br'],
      ['FI.N2', 'NB.b0', 'bl'],

      ['F1.2', 'LA.L', 'br'],
      ['NB.b1', 'LA.N', 'bl'],
      ['F1.2', 'K1.1', 'br'],
      ['F1.2', 'S1.3', 'br'],
      ['F1.2', 'S2.3', 'br'],
      ['K1.2', 'LA.3', 'bk'],
      ['S1.4', 'LA.3', 'bk'],
      ['S2.4', 'LA.3', 'bk'],
      ['LA.4', 'E1.1', 'gr'],
      ['NB.b2', 'E1.2', 'bl'],

      ['F2.2', 'K2.P', 'br'],
      ['K2.1', 'K3.1', 'bk'],
      ['K2.2', 'K3.2', 'gr'],
      ['K3.P', 'E2.1', 'br'],
      ['NB.b3', 'E2.2', 'bl'],

      ['F3.2', 'X1.L', 'br'],
      ['NB.b4', 'X1.N', 'bl'],
      ['PB.b1', 'X1.PE', 'gy']
    ]
  };

  /* ================= B feladat ========================================= */
  var B = {
    id: 'B',
    title: 'Épületvillamossági szerelés',
    subtitle: 'Lépcsőházi automata · keresztkapcsolás · dugalj',
    world: [1420, 1080],
    brief:
      'Ugyanaz a tábla, nehezebb világítással. Az 1-es kört lépcsőházi automata ' +
      'kapcsolja két nyomógombról. A 2-es kör keresztkapcsolás: két váltó- és egy ' +
      'keresztkapcsoló, három helyről. A 3-as kör dugalj.',
    steps: [
      'Betáplálás a Fi-relére, onnan a három kismegszakítóra. Nulla az N-sínre, védőföld a PE-sínre.',
      'F-1 kimenete az automata L kapcsára, az N-sínről a nulla az N kapcsára.',
      'Ugyanez az F-1 kimenet adja az állandó fázist az S1 és S2 nyomógombra.',
      'A két gomb kimenete az automata 3-as kapcsára, az automata 4-es kapcsa az E1 lámpára.',
      'F-2 a K1 váltó közös kapcsára. K1 két érintkezője a K2 keresztkapcsoló bemenetére.',
      'A K2 két kimenete a K3 váltóra, K3 közös kapcsa az E2 lámpára.',
      'F-3 a dugalj L kapcsára, mellé a nulla és a védőföld a sínekről.'
    ],
    parts: [
      part('SUP', 'feed', 40, 60, 'Betáplálás'),
      part('FI', 'rcd', 250, 90, 'Fi-1'),
      part('F1', 'mcb', 450, 90, 'F-1'),
      part('F2', 'mcb', 550, 90, 'F-2'),
      part('F3', 'mcb', 650, 90, 'F-3'),
      part('LA', 'stair', 770, 90, 'LA-1'),
      part('NB', 'busbar', 1000, 90, 'N-sín'),
      part('PB', 'busbar', 1000, 230, 'PE-sín'),

      part('S1', 'btn', 80, 420, 'S1'),
      part('S2', 'btn', 300, 420, 'S2'),
      part('E1', 'lamp', 560, 410, 'E1'),

      part('K1', 'sw2', 80, 650, 'K1'),
      part('K2', 'swx', 300, 650, 'K2'),
      part('K3', 'sw2', 520, 650, 'K3'),
      part('E2', 'lamp', 760, 640, 'E2'),

      part('X1', 'socket', 80, 870, 'X1')
    ],
    solution: [
      ['SUP.L1', 'FI.L1', 'br'],
      ['SUP.N', 'FI.N1', 'bl'],
      ['SUP.PE', 'PB.b0', 'gy'],
      ['FI.L2', 'F1.1', 'br'],
      ['F1.1', 'F2.1', 'br'],
      ['F2.1', 'F3.1', 'br'],
      ['FI.N2', 'NB.b0', 'bl'],

      ['F1.2', 'LA.L', 'br'],
      ['NB.b1', 'LA.N', 'bl'],
      ['F1.2', 'S1.3', 'br'],
      ['F1.2', 'S2.3', 'br'],
      ['S1.4', 'LA.3', 'bk'],
      ['S2.4', 'LA.3', 'bk'],
      ['LA.4', 'E1.1', 'gr'],
      ['NB.b2', 'E1.2', 'bl'],

      ['F2.2', 'K1.P', 'br'],
      ['K1.1', 'K2.1', 'bk'],
      ['K1.2', 'K2.2', 'gr'],
      ['K2.3', 'K3.1', 'bk'],
      ['K2.4', 'K3.2', 'gr'],
      ['K3.P', 'E2.1', 'br'],
      ['NB.b3', 'E2.2', 'bl'],

      ['F3.2', 'X1.L', 'br'],
      ['NB.b4', 'X1.N', 'bl'],
      ['PB.b1', 'X1.PE', 'gy']
    ]
  };

  /* ================= C feladat ========================================= */
  var C = {
    id: 'C',
    title: 'Motorindítás frekvenciaváltóval',
    subtitle: 'Öntartás · két leállító és két indító nyomógomb',
    world: [1160, 1260],
    parts: [
      part('SUP', 'feed', 40, 40, 'Betáplálás'),
      part('Q1', 'vfd', 320, 40, 'Q-1'),
      part('F1', 'mcb3', 40, 330, 'F-1'),
      part('K1', 'contactor', 40, 550, 'K-1', {
        aux: [['13', '14', 'no'], ['21', '22', 'nc']]
      }),
      part('HK', 'mprot', 40, 900, 'HK-1'),
      part('M', 'motor', 300, 910, 'M1'),

      part('F2', 'mcb', 730, 40, 'F-2'),
      part('S1', 'btnNC', 670, 220, 'S1'),
      part('S3', 'btnNC', 830, 220, 'S3'),
      part('S2', 'btn', 670, 400, 'S2'),
      part('S4', 'btn', 830, 400, 'S4'),
      part('P', 'pilot', 670, 580, 'P', { color: 'red' }),
      part('Z', 'pilot', 810, 580, 'Z', { color: 'green' }),
      part('NB', 'busbar', 670, 750, 'N-sín'),
      part('PB', 'busbar', 670, 890, 'PE-sín')
    ],
    solution: [
      ['SUP.L1', 'Q1.L1', 'br'],
      ['SUP.N', 'Q1.N', 'bl'],
      ['SUP.PE', 'Q1.PE', 'gy'],
      ['SUP.N', 'NB.b0', 'bl'],
      ['SUP.PE', 'PB.b0', 'gy'],

      ['Q1.T1', 'F1.1a', 'br'],
      ['Q1.T2', 'F1.1b', 'bk'],
      ['Q1.T3', 'F1.1c', 'gr'],
      ['F1.2a', 'K1.1', 'br'],
      ['F1.2b', 'K1.3', 'bk'],
      ['F1.2c', 'K1.5', 'gr'],
      ['K1.2', 'HK.L1', 'br'],
      ['K1.4', 'HK.L2', 'bk'],
      ['K1.6', 'HK.L3', 'gr'],
      ['HK.T1', 'M.U1', 'br'],
      ['HK.T2', 'M.V1', 'bk'],
      ['HK.T3', 'M.W1', 'gr'],
      ['PB.b1', 'M.PE', 'gy'],

      ['SUP.L1', 'F2.1', 'br'],
      ['F2.2', 'HK.13', 'br'],
      ['HK.14', 'S1.1', 'br'],
      ['S1.2', 'S3.1', 'br'],
      ['S3.2', 'S2.3', 'br'],
      ['S3.2', 'S4.3', 'br'],
      ['S3.2', 'K1.13', 'br'],
      ['S2.4', 'K1.A1', 'br'],
      ['S4.4', 'K1.A1', 'br'],
      ['K1.14', 'K1.A1', 'br'],
      ['K1.A2', 'NB.b2', 'bl'],
      ['K1.A1', 'Z.X1', 'br'],
      ['Z.X2', 'NB.b3', 'bl'],
      ['HK.14', 'K1.21', 'br'],
      ['K1.22', 'P.X1', 'br'],
      ['P.X2', 'NB.b4', 'bl']
    ]
  };

  /* ================= D feladat ========================================= */
  var D = {
    id: 'D',
    title: 'Irányváltós motorvezérlés',
    subtitle: 'Két mágneskapcsoló · fáziscsere · kölcsönös reteszelés',
    world: [1260, 1440],
    parts: [
      part('SUP', 'feed', 40, 40, 'Betáplálás'),
      part('Q1', 'vfd', 330, 40, 'Q-1'),
      part('F1', 'mcb3', 40, 300, 'F-1'),
      part('K1', 'contactor', 40, 520, 'K-1', {
        aux: [['13', '14', 'no'], ['51', '52', 'nc'], ['81', '82', 'nc']]
      }),
      part('K2', 'contactor', 40, 840, 'K-2', {
        aux: [['13', '14', 'no'], ['51', '52', 'nc'], ['81', '82', 'nc']]
      }),
      part('HK', 'mprot', 420, 840, 'HK-1'),
      part('M', 'motor', 425, 1120, 'M1'),

      part('F2', 'mcb', 780, 40, 'F-2'),
      part('S1', 'btnNC', 700, 230, 'S1'),
      part('S2', 'btn', 860, 230, 'S2'),
      part('S3', 'btn', 1020, 230, 'S3'),
      part('P', 'pilot', 700, 410, 'P', { color: 'red' }),
      part('Z1', 'pilot', 840, 410, 'Z1', { color: 'green' }),
      part('Z2', 'pilot', 980, 410, 'Z2', { color: 'green' }),
      part('NB', 'busbar', 700, 580, 'N-sín'),
      part('PB', 'busbar', 700, 720, 'PE-sín')
    ],
    solution: [
      ['SUP.L1', 'Q1.L1', 'br'],
      ['SUP.N', 'Q1.N', 'bl'],
      ['SUP.PE', 'Q1.PE', 'gy'],
      ['SUP.N', 'NB.b0', 'bl'],
      ['SUP.PE', 'PB.b0', 'gy'],

      ['Q1.T1', 'F1.1a', 'br'],
      ['Q1.T2', 'F1.1b', 'bk'],
      ['Q1.T3', 'F1.1c', 'gr'],
      ['F1.2a', 'K1.1', 'br'],
      ['F1.2b', 'K1.3', 'bk'],
      ['F1.2c', 'K1.5', 'gr'],
      ['F1.2a', 'K2.5', 'br'],
      ['F1.2b', 'K2.3', 'bk'],
      ['F1.2c', 'K2.1', 'gr'],
      ['K1.2', 'HK.L1', 'br'],
      ['K1.4', 'HK.L2', 'bk'],
      ['K1.6', 'HK.L3', 'gr'],
      ['K2.2', 'HK.L1', 'br'],
      ['K2.4', 'HK.L2', 'bk'],
      ['K2.6', 'HK.L3', 'gr'],
      ['HK.T1', 'M.U1', 'br'],
      ['HK.T2', 'M.V1', 'bk'],
      ['HK.T3', 'M.W1', 'gr'],
      ['PB.b1', 'M.PE', 'gy'],

      ['SUP.L1', 'F2.1', 'br'],
      ['F2.2', 'HK.13', 'br'],
      ['HK.14', 'S1.1', 'br'],
      ['S1.2', 'S2.3', 'br'],
      ['S1.2', 'S3.3', 'br'],
      ['S1.2', 'K1.13', 'br'],
      ['S1.2', 'K2.13', 'br'],
      ['S2.4', 'K2.81', 'br'],
      ['K1.14', 'K2.81', 'br'],
      ['K2.82', 'K1.A1', 'br'],
      ['K1.A2', 'NB.b2', 'bl'],
      ['K1.A1', 'Z1.X1', 'br'],
      ['Z1.X2', 'NB.b3', 'bl'],
      ['S3.4', 'K1.81', 'br'],
      ['K2.14', 'K1.81', 'br'],
      ['K1.82', 'K2.A1', 'br'],
      ['K2.A2', 'NB.b4', 'bl'],
      ['K2.A1', 'Z2.X1', 'br'],
      ['Z2.X2', 'NB.b5', 'bl'],
      ['HK.14', 'K1.51', 'br'],
      ['K1.52', 'K2.52', 'br'],
      ['K2.51', 'P.X1', 'br'],
      ['P.X2', 'NB.b6', 'bl']
    ]
  };


  /* ================= E feladat ========================================= */
  var E = {
    id: 'E',
    title: 'Egyfázisú motorindítás',
    subtitle: 'Mágneskapcsoló · öntartás · motorvédő · üzemjelzés',
    world: [1240, 1270],
    brief:
      'Ugyanaz a vezérlési logika, mint a C feladatban, de egyfázisú motorral és ' +
      'frekvenciaváltó nélkül. A motort mágneskapcsoló kapcsolja, öntartással: az ' +
      'indítógomb elengedése után a K-1 saját záró érintkezője tartja meg magát. ' +
      'A leállító nyomógomb nyugalmi helyzetben zárt, ezért a megszakadása is leállít.',
    steps: [
      'Betáplálás L a főáramköri F-1 megszakítóra, a nulla az N-sínre, a védőföld a PE-sínre.',
      'F-1 kimenete a K-1 főérintkezőjére (1), onnan a 2-es kapocs a HK-1 motorvédőre.',
      'HK-1 kimenete a motor U1 kapcsára, a motor U2 kapcsa az N-sínre, a test a PE-sínre.',
      'Vezérlés: F-1 bemenetéről a fázis az F-2 megszakítóra, onnan a HK-1 13/14 segédérintkezőjére.',
      'HK-1 14 az S1 leállító bontó gombjára, onnan az S2 indító záró gombra.',
      'Az S2 kimenete és a K-1 13/14 záró érintkezője párhuzamosan megy a K-1 tekercs A1 kapcsára.',
      'K-1 A2 a nullára. A Z zöld lámpa a tekerccsel párhuzamosan, a P piros a K-1 21/22 bontóján át.'
    ],
    parts: [
      part('SUP', 'feed', 40, 60, 'Betáplálás'),
      part('F1', 'mcb', 300, 120, 'F-1'),
      part('K1', 'contactor', 220, 380, 'K-1', {
        aux: [['13', '14', 'no'], ['21', '22', 'nc']]
      }),
      part('HK', 'mprot', 240, 740, 'HK-1', { poles: 1 }),
      part('M', 'motor1', 245, 1000, 'M1'),

      part('F2', 'mcb', 700, 120, 'F-2'),
      part('S1', 'btnNC', 660, 320, 'S1'),
      part('S2', 'btn', 830, 320, 'S2'),
      part('P', 'pilot', 660, 500, 'P', { color: 'red' }),
      part('Z', 'pilot', 800, 500, 'Z', { color: 'green' }),
      part('NB', 'busbar', 660, 680, 'N-sín'),
      part('PB', 'busbar', 660, 820, 'PE-sín')
    ],
    solution: [
      ['SUP.L1', 'F1.1', 'br'],
      ['SUP.N', 'NB.b0', 'bl'],
      ['SUP.PE', 'PB.b0', 'gy'],
      ['F1.1', 'F2.1', 'br'],

      ['F1.2', 'K1.1', 'br'],
      ['K1.2', 'HK.L1', 'br'],
      ['HK.T1', 'M.U1', 'br'],
      ['NB.b1', 'M.U2', 'bl'],
      ['PB.b1', 'M.PE', 'gy'],

      ['F2.2', 'HK.13', 'br'],
      ['HK.14', 'S1.1', 'br'],
      ['S1.2', 'S2.3', 'br'],
      ['S1.2', 'K1.13', 'br'],
      ['S2.4', 'K1.A1', 'br'],
      ['K1.14', 'K1.A1', 'br'],
      ['K1.A2', 'NB.b2', 'bl'],
      ['K1.A1', 'Z.X1', 'br'],
      ['Z.X2', 'NB.b3', 'bl'],
      ['HK.14', 'K1.21', 'br'],
      ['K1.22', 'P.X1', 'br'],
      ['P.X2', 'NB.b4', 'bl']
    ]
  };

  /* ================= F feladat ========================================= */
  var F = {
    id: 'F',
    title: 'Háromfázisú mérőhely',
    subtitle: 'Fogyasztásmérő · főkapcsoló · 4 pólusú Fi-relé',
    world: [1500, 1560],
    brief:
      'Mérőhely kialakítása: a hálózat a főbiztosítón át a közvetlen mérésű ' +
      'háromfázisú fogyasztásmérőre megy, onnan a főkapcsolóra, majd a 4 pólusú ' +
      'Fi-relére. A Fi mögül indul a három egyfázisú áramkör - fázisonként egy, ' +
      'hogy a terhelés elosztott legyen. A nullát a mérőn át kell vezetni, és a ' +
      'fogyasztói nulla már a Fi-relé után lévő sínről jön.',
    steps: [
      'A hálózat három fázisa az F-0 főbiztosító bemenetére, a nulla a mérő előtti N-sínre, a PE a PE-sínre.',
      'F-0 kimenete a mérő 1, 4, 7 kapcsára, a nulla a mérő 10-es kapcsára.',
      'A mérő 3, 6, 9 kimenete a főkapcsolóra, a 11-es kapocs a főkapcsoló N kapcsára.',
      'A főkapcsoló kimenete a 4 pólusú Fi-relé bemenetére - a nulla is a Fi-n megy át.',
      'A Fi kimenetéről a három fázis az F-1, F-2, F-3 megszakítóra, a nulla a Fi utáni N-sínre.',
      'F-1 a dugaljra, F-2 és F-3 egy-egy lámpára. A nulla mindegyikhez a Fi utáni sínről.',
      'A védőföld végig a PE-sínről megy, sehol nincs kapcsolva.'
    ],
    parts: [
      part('SUP', 'feed3', 40, 60, 'Betáplálás'),
      part('F0', 'mcb3', 300, 60, 'F-0'),
      part('KWH', 'meter3', 300, 320, 'kWh'),
      part('FK', 'mainsw', 320, 680, 'FK'),
      part('FI', 'rcd', 320, 980, 'Fi-1', { poles: 4 }),

      part('NB0', 'busbar', 700, 60, 'N-sín (mérő előtt)'),
      part('PB', 'busbar', 700, 200, 'PE-sín'),
      part('NB', 'busbar', 700, 1280, 'N-sín (Fi után)'),

      part('F1', 'mcb', 700, 1080, 'F-1'),
      part('F2', 'mcb', 810, 1080, 'F-2'),
      part('F3', 'mcb', 920, 1080, 'F-3'),

      part('X1', 'socket', 1080, 500, 'X1'),
      part('E1', 'lamp', 1080, 700, 'E1'),
      part('E2', 'lamp', 1080, 900, 'E2')
    ],
    solution: [
      ['SUP.L1', 'F0.1a', 'br'],
      ['SUP.L2', 'F0.1b', 'bk'],
      ['SUP.L3', 'F0.1c', 'gr'],
      ['SUP.N', 'NB0.b0', 'bl'],
      ['SUP.PE', 'PB.b0', 'gy'],

      ['F0.2a', 'KWH.1', 'br'],
      ['F0.2b', 'KWH.4', 'bk'],
      ['F0.2c', 'KWH.7', 'gr'],
      ['NB0.b1', 'KWH.10', 'bl'],

      ['KWH.3', 'FK.L1', 'br'],
      ['KWH.6', 'FK.L2', 'bk'],
      ['KWH.9', 'FK.L3', 'gr'],
      ['KWH.11', 'FK.N', 'bl'],

      ['FK.T1', 'FI.L1', 'br'],
      ['FK.T2', 'FI.L2', 'bk'],
      ['FK.T3', 'FI.L3', 'gr'],
      ['FK.TN', 'FI.N1', 'bl'],

      ['FI.T1', 'F1.1', 'br'],
      ['FI.T2', 'F2.1', 'bk'],
      ['FI.T3', 'F3.1', 'gr'],
      ['FI.N2', 'NB.b0', 'bl'],

      ['F1.2', 'X1.L', 'br'],
      ['NB.b1', 'X1.N', 'bl'],
      ['PB.b1', 'X1.PE', 'gy'],

      ['F2.2', 'E1.1', 'bk'],
      ['NB.b2', 'E1.2', 'bl'],

      ['F3.2', 'E2.1', 'gr'],
      ['NB.b3', 'E2.2', 'bl']
    ]
  };


  /* ================= G feladat ========================================= */
  var G = {
    id: 'G',
    title: 'Egyfázisú mérőhely',
    subtitle: 'Fogyasztásmérő · főkismegszakító · Fi-relé',
    world: [1240, 1300],
    brief:
      'Az F feladat egyfázisú párja. A hálózat a főbiztosítón át a közvetlen ' +
      'mérésű egyfázisú fogyasztásmérőre megy, onnan a főkismegszakítóra, majd ' +
      'a Fi-relére. A mérőn a fázis és a nulla is átmegy (1-3 és 4-6), a ' +
      'fogyasztói nulla viszont már a Fi-relé utáni sínről jön. A védőföld ' +
      'sehol nincs kapcsolva és nem megy át a mérőn.',
    steps: [
      'A hálózat fázisa az F-0 főbiztosítóra, a nulla a mérő előtti N-sínre, a PE a PE-sínre.',
      'F-0 kimenete a mérő 1-es kapcsára, a mérő előtti nulla a 4-es kapcsára.',
      'A mérő 3-as kimenete a főkismegszakítóra (FM), a 6-os kimenete a Fi-relé N bemenetére.',
      'FM kimenete a Fi-relé fázis bemenetére - innentől minden fogyasztó a Fi mögött van.',
      'A Fi fázis kimenete az F-1 és F-2 megszakítóra, a nulla kimenete a Fi utáni N-sínre.',
      'F-1 a dugaljra, F-2 a lámpára; a nulla mindkettőhöz a Fi utáni sínről.',
      'A védőföld a PE-sínről a dugalj PE kapcsára - a mérőt és a Fi-t kikerülve.'
    ],
    parts: [
      part('SUP', 'feed', 40, 60, 'Betáplálás'),
      part('F0', 'mcb', 300, 80, 'F-0'),
      part('KWH', 'meter1', 250, 330, 'kWh'),
      part('FM', 'mcb', 300, 660, 'FM'),
      part('FI', 'rcd', 250, 910, 'Fi-1'),

      part('NB0', 'busbar', 620, 60, 'N-sín (mérő előtt)'),
      part('PB', 'busbar', 620, 200, 'PE-sín'),
      part('NB', 'busbar', 620, 1130, 'N-sín (Fi után)'),

      part('F1', 'mcb', 620, 910, 'F-1'),
      part('F2', 'mcb', 730, 910, 'F-2'),

      part('X1', 'socket', 900, 420, 'X1'),
      part('E1', 'lamp', 900, 660, 'E1')
    ],
    solution: [
      ['SUP.L1', 'F0.1', 'br'],
      ['SUP.N', 'NB0.b0', 'bl'],
      ['SUP.PE', 'PB.b0', 'gy'],

      ['F0.2', 'KWH.1', 'br'],
      ['NB0.b1', 'KWH.4', 'bl'],

      ['KWH.3', 'FM.1', 'br'],
      ['FM.2', 'FI.L1', 'br'],
      ['KWH.6', 'FI.N1', 'bl'],

      ['FI.L2', 'F1.1', 'br'],
      ['F1.1', 'F2.1', 'br'],
      ['FI.N2', 'NB.b0', 'bl'],

      ['F1.2', 'X1.L', 'br'],
      ['NB.b1', 'X1.N', 'bl'],
      ['PB.b1', 'X1.PE', 'gy'],

      ['F2.2', 'E1.1', 'br'],
      ['NB.b2', 'E1.2', 'bl']
    ]
  };

  EE.TASKS = { A: A, B: B, C: C, D: D, E: E, F: F, G: G };
  EE.TASK_ORDER = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

  /* Palettarol hozzaadhato alkatreszek */
  EE.PALETTE = [
    'sw1', 'sw2', 'swx', 'btn', 'btnNC', 'lamp', 'pilot', 'socket',
    'busbar', 'mcb', 'mcb3', 'rcd', 'stair', 'contactor',
    'mprot', 'vfd', 'motor', 'motor1', 'feed', 'feed3', 'meter3', 'meter1', 'mainsw'
  ];
})();
