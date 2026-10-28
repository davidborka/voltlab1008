import type { TaskDef } from '../../domain/electrical-types';
import { bySteps, part } from './helpers';
import { contentJ } from './contentJ';

/* A „3”-as szerelési vizsgafeladat (4 0713 04 07 Villanyszerelő,
   Épületvillamosság) alapján: lakossági 1 fázisú fogyasztásmérő hely és lakás
   főelosztó, TN-C-S. Két szekrény van a táblán: a mérőszekrényben a méretlen
   fővezeték, a főbiztosító, a Qoltec mérő, a PEN-szétválasztás a fő
   földelősínnel és a két SPD; a lakás főelosztóban az FM, a Fi-relé, a B16-os
   dugalj- és a B10-es világítási kör. A kettő között a mért fővezeték (L, N, PE). */
export const taskJ: TaskDef = {
    id: 'J',
    title: '3-as vizsgafeladat: lakossági 1 fázisú mérőhely + főelosztó',
    subtitle: 'TN-C-S · mérőszekrény · Qoltec mérő · 2× SPD · EPH · lakás főelosztó · dugalj és világítás',
    category: 'merohely',
    complexity: 5,
    briefHu:
      'Lakossági 1 fázisú fogyasztásmérő hely és főelosztó kialakítása, 400/230 V 50 Hz, ' +
      'TN-C-S (önálló védővezetővel kialakított nullázás). A méretlen fővezeték (L + PEN) a ' +
      'mérőszekrénybe érkezik: főbiztosító, Qoltec 50888 mérő (L: 1 → 2, PEN: 3 → 4). A mérő ' +
      'után a PEN ELŐSZÖR a PE-sínre (fő földelősín) megy, onnan a híd viszi az N-sínre - ' +
      'ettől kezdve a PE és az N soha többé nem érhet össze. A fő földelősínre kerül a ' +
      'földelő és az EPH (víz-, gáz-, fűtési fővezeték). A mért oldalon két ELMARK SPD-C10 ' +
      'véd (L-PE és N-PE). A mért fővezeték (L, N, PE) a lakás főelosztóba megy: FM, ' +
      'IDEAL Fi-relé, B16 dugaljkör és B10 világítási kör kapcsolóval. Áramütés elleni ' +
      'védelemben elkövetett hiba érvénytelen vizsgának minősül.',
    stepsHu: [
      'Mérőszekrény: a méretlen fővezeték fázisa az F-0 főbiztosítóra, onnan a Qoltec mérő 1-es kapcsára; a PEN a mérő 3-as kapcsára.',
      'PEN-szétválasztás: a mérő 4-es kapcsa (PEN) ELŐSZÖR a PE-sínre, onnan a fő földelősínre (EPH-sín); a földelő (RE) is ide kerül. A híd viszi át a nullát az N-sínre.',
      'Túlfeszültség-védelem a mért oldalon, a Fi ELŐTT: SP1 L/N kapcsa a mérő 2-es kapcsára (L-PE), SP2 L/N kapcsa az N-sínre (N-PE), mindkét ⏚ kapocs rövid úton a PE-sínre.',
      'Mért fővezeték a lakás főelosztóba: L a mérő 2-es kapcsáról az FM-re, N az N-sínről a Fi N bemenetére, PE a PE-sínről a főelosztó PE-sínjére.',
      'Főelosztó: FM kimenete a Fi-relé 1-es kapcsára; a Fi 2-es kimenete az F-1 (B16) és F-2 (B10) kismegszakítóra, N kimenete a Fi utáni N-sínre.',
      'Dugaljkör: F-1 a dugalj L kapcsára, N a Fi utáni N-sínről, PE a főelosztó PE-sínjéről.',
      'Világítás: F-2 az S1 kapcsoló L kapcsára, S1 1-es kapcsa az E1 lámpára, a lámpa N-je a Fi utáni N-sínről.',
      'EPH: a víz-, gáz- és fűtési fővezeték fém csöve külön zöld-sárga vezetővel a fő földelősínre (EPH-sín).',
      'Ellenőrzés: feszültségmentesen PE-folytonosság (főáramkör és EPH), szigetelés (híd bontva, SPD-betétek kihúzva), majd engedéllyel L-N, L-PE, N-PE feszültség, Fi-próba és működési próba - dokumentálva.'
    ],
    world: [1560, 1300],
    parts: [
      /* mérőszekrény */
      part('SUP', 'feedpen', 40, 60, 'Méretlen fővezeték'),
      part('F0', 'mcb', 300, 60, 'F-0', null, 'legrand-rx3-1p'),
      part('KWH', 'meter1', 250, 300, 'kWh', null, 'qoltec-50888'),
      part('SP1', 'spd1', 530, 300, 'SP1', null, 'elmark-spd-c10'),
      part('SP2', 'spd1', 620, 300, 'SP2', null, 'elmark-spd-c10'),
      part('PEN', 'penbar', 40, 620, 'PEN-sín'),
      part('EPH', 'busbar', 40, 820, 'Fő földelősín (EPH)', { role: 'PE' }),
      part('RE', 'earthrod', 450, 820, 'RE'),
      part('EV', 'bond', 40, 1020, 'Víz'),
      part('EG', 'bond', 180, 1020, 'Gáz'),
      part('EF', 'bond', 320, 1020, 'Fűtés'),

      /* lakás főelosztó */
      part('FM', 'mcb', 820, 60, 'FM', null, 'legrand-rx3-1p'),
      part('FI', 'rcd', 930, 60, 'Fi-1', null, 'ideal-krd10'),
      part('F1', 'mcb', 1120, 60, 'F-1', null, 'legrand-rx3-b16'),
      part('F2', 'mcb', 1220, 60, 'F-2', null, 'legrand-rx3-b10'),
      part('NB', 'busbar', 820, 330, 'N-sín (Fi után)', { role: 'N' }),
      part('PB', 'busbar', 820, 460, 'PE-sín (főelosztó)', { role: 'PE' }),
      part('X1', 'socket', 860, 660, 'X1'),
      part('S1', 'sw1', 1120, 640, 'S1', null, 'legrand-niloe-valto'),
      part('E1', 'lamp', 1320, 820, 'E1')
    ],
    ...bySteps([
      [
        ['SUP.L1', 'F0.1', 'br'],
        ['F0.2', 'KWH.1', 'br'],
        ['SUP.PEN', 'KWH.3', 'gy']
      ],
      [
        ['KWH.4', 'PEN.p0', 'gy'],
        ['PEN.p1', 'EPH.b0', 'gy'],
        ['RE.E', 'EPH.b1', 'gy']
      ],
      [
        ['KWH.2', 'SP1.L/N', 'br'],
        ['PEN.n2', 'SP2.L/N', 'bl'],
        ['SP1.PE', 'PEN.p2', 'gy'],
        ['SP2.PE', 'PEN.p3', 'gy']
      ],
      [
        ['KWH.2', 'FM.1', 'br'],
        ['PEN.n1', 'FI.N1', 'bl'],
        ['PEN.p4', 'PB.b0', 'gy']
      ],
      [
        ['FM.2', 'FI.L1', 'br'],
        ['FI.L2', 'F1.1', 'br'],
        ['F1.1', 'F2.1', 'br'],
        ['FI.N2', 'NB.b0', 'bl']
      ],
      [
        ['F1.2', 'X1.L', 'br'],
        ['NB.b1', 'X1.N', 'bl'],
        ['PB.b1', 'X1.PE', 'gy']
      ],
      [
        ['F2.2', 'S1.L', 'br'],
        ['S1.1', 'E1.1', 'br'],
        ['NB.b2', 'E1.2', 'bl']
      ],
      [
        ['EV.E', 'EPH.b2', 'gy'],
        ['EG.E', 'EPH.b3', 'gy'],
        ['EF.E', 'EPH.b4', 'gy']
      ],
      []
    ]),
  objectivesHu: contentJ.objectivesHu,
  commonMistakesHu: contentJ.commonMistakesHu,
  guided: contentJ.guided,
  exam: contentJ.exam,
  unresolved: contentJ.unresolved,
};
