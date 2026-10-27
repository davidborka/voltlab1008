import type { TaskDef } from '../../domain/electrical-types';
import { part } from './helpers';
import { contentI } from './contentI';

/* Vizsgabeszámoló alapján: elosztó PEN-szétválasztással, mérővel, Fi-relével,
   kismegszakítókkal, lámpával és dugaljjal. Nem feladatlapból készült. */
export const taskI: TaskDef = {
    id: 'I',
    title: 'Elosztó PEN-szétválasztással',
    subtitle: 'TN-C-S · mérő · PEN → PE + N · földelő · Fi-relé · lámpa és dugalj',
    category: 'epuletvillamossag',
    complexity: 4,
    briefHu:
      'A hálózat TN-C: fázis és PEN érkezik. A PEN a mérőn (4-6) át az elosztóba ' +
      'jön, ahol szétválasztod: a PEN ELŐSZÖR a PE-sínre megy, onnan a híd ' +
      'viszi át az N-sínre. A PE-sínre kerül a földelő is. A szétválasztás után ' +
      'az N és a PE soha többé nem érhet össze. A Fi-relé a szétválasztás után ' +
      'jön, mögötte egy lámpakör (kapcsolóval) és egy dugaljkör.',
    stepsHu: [
      'Betáplálás: a fázis az F-0 főbiztosítóra, onnan a mérő 1-es kapcsára; a PEN a mérő 4-es kapcsára.',
      'A mérő 6-os kimenete (PEN) a PEN-szétválasztó PE-sínjének PEN kapcsára - ELŐSZÖR a PE-sínre!',
      'A PE-sín és az N-sín közötti híd ettől kezdve választja szét a PEN-t: innen PE és N külön vezető.',
      'A földelőt (RE) a PE-sínre kötöd.',
      'A mérő 3-as kimenete a Fi-relé fázis bemenetére, az N-sínről a nulla a Fi N bemenetére.',
      'A Fi fázis kimenete az F-1 (lámpa) és F-2 (dugalj) kismegszakítóra, a nulla kimenete a Fi utáni N-sínre.',
      'F-1 → S1 kapcsoló → E1 lámpa; F-2 → X1 dugalj. A nulla a Fi utáni sínről, a PE a PE-sínről a dugaljra.',
      'Szigetelésméréshez a hidat bontani kell (koppints rá), utána visszazárni.'
    ],
    world: [1300, 1260],
    parts: [
      part('SUP', 'feedpen', 40, 60, 'Hálózat'),
      part('F0', 'mcb', 300, 60, 'F-0'),
      part('KWH', 'meter1', 250, 300, 'kWh'),
      part('PEN', 'penbar', 620, 60, 'PEN-sín'),
      part('RE', 'earthrod', 700, 300, 'RE'),
      part('FI', 'rcd', 250, 640, 'Fi-1'),
      part('F1', 'mcb', 620, 640, 'F-1'),
      part('F2', 'mcb', 740, 640, 'F-2'),
      part('S1', 'sw1', 980, 300, 'S1'),
      part('E1', 'lamp', 960, 500, 'E1'),
      part('X1', 'socket', 960, 740, 'X1'),
      part('NB', 'busbar', 620, 1030, 'N-sín (Fi után)', { role: 'N' })
    ],
    solution: [
      ['SUP.L1', 'F0.1', 'br'],
      ['F0.2', 'KWH.1', 'br'],
      ['SUP.PEN', 'KWH.4', 'gy'],
      ['KWH.6', 'PEN.p0', 'gy'],
      ['RE.E', 'PEN.p1', 'gy'],

      ['KWH.3', 'FI.L1', 'br'],
      ['PEN.n1', 'FI.N1', 'bl'],

      ['FI.L2', 'F1.1', 'br'],
      ['F1.1', 'F2.1', 'br'],
      ['FI.N2', 'NB.b0', 'bl'],

      ['F1.2', 'S1.1', 'br'],
      ['S1.2', 'E1.1', 'br'],
      ['NB.b1', 'E1.2', 'bl'],

      ['F2.2', 'X1.L', 'br'],
      ['NB.b2', 'X1.N', 'bl'],
      ['PEN.p2', 'X1.PE', 'gy']
    ],
  objectivesHu: contentI.objectivesHu,
  commonMistakesHu: contentI.commonMistakesHu,
  guided: contentI.guided,
  exam: contentI.exam,
  unresolved: contentI.unresolved,
};
