import type { TaskDef } from '../../domain/electrical-types';
import { bySteps, part } from './helpers';
import { contentI } from './contentI';

/* Vizsgabeszámoló alapján: elosztó PEN-szétválasztással, mérővel, Fi-relével,
   kismegszakítókkal, lámpával és dugaljjal. Nem feladatlapból készült. */
export const taskI: TaskDef = {
    id: 'I',
    title: 'Elosztó PEN-szétválasztással',
    subtitle: 'TN-C-S · Qoltec mérő · PEN → PE + N · földelő · 2× SPD · Fi-relé · lámpa és dugalj',
    category: 'epuletvillamossag',
    complexity: 4,
    briefHu:
      'A hálózat TN-C: fázis és PEN érkezik. A PEN a mérőn (Qoltec 50888, 3 → 4) át az elosztóba ' +
      'jön, ahol szétválasztod: a PEN ELŐSZÖR a PE-sínre megy, onnan a híd ' +
      'viszi át az N-sínre. A PE-sínre kerül a földelő is. A szétválasztás után ' +
      'az N és a PE soha többé nem érhet össze. A Fi-relé a szétválasztás után ' +
      'jön, mögötte egy lámpakör (kapcsolóval) és egy dugaljkör. A mérő után, a ' +
      'Fi ELŐTT két 1 pólusú túlfeszültség-védő (L-PE és N-PE) kerül.',
    stepsHu: [
      'Betáplálás: a fázis az F-0 főbiztosítóra, onnan a Qoltec mérő 1-es kapcsára; a PEN a mérő 3-as kapcsára.',
      'A mérő 4-es kapcsa (PEN) a PEN-szétválasztó PE-sínjének PEN kapcsára - ELŐSZÖR a PE-sínre!',
      'A PE-sín és az N-sín közötti híd ettől kezdve választja szét a PEN-t: innen PE és N külön vezető.',
      'A földelőt (RE) a PE-sínre kötöd.',
      'A mérő 2-es kapcsa (L ki) a Fi-relé fázis bemenetére, az N-sínről a nulla a Fi N bemenetére.',
      'Túlfeszültség-védelem a mérő után, a Fi ELŐTT: SP1 L/N kapcsa a mérő 2-es kapcsára (L-PE), SP2 L/N kapcsa az N-sínre (N-PE), mindkét ⏚ kapocs a PE-sínre.',
      'A Fi fázis kimenete az F-1 (lámpa) és F-2 (dugalj) kismegszakítóra, a nulla kimenete a Fi utáni N-sínre.',
      'F-1 → S1 kapcsoló (L → 1) → E1 lámpa; F-2 → X1 dugalj. A nulla a Fi utáni sínről, a PE a PE-sínről a dugaljra.',
      'Szigetelésméréshez a hidat bontani kell (koppints rá), az SPD-betéteket ki kell húzni, utána mindent visszaállítani.'
    ],
    world: [1300, 1260],
    parts: [
      part('SUP', 'feedpen', 40, 60, 'Hálózat'),
      part('F0', 'mcb', 300, 60, 'F-0', null, 'legrand-rx3-1p'),
      part('KWH', 'meter1', 250, 300, 'kWh', null, 'qoltec-50888'),
      part('PEN', 'penbar', 620, 60, 'PEN-sín'),
      part('RE', 'earthrod', 700, 300, 'RE'),
      part('FI', 'rcd', 250, 640, 'Fi-1', null, 'legrand-rx3-rcd-2p'),
      part('SP1', 'spd1', 430, 640, 'SP1', null, 'elmark-spd-c10'),
      part('SP2', 'spd1', 520, 640, 'SP2', null, 'elmark-spd-c10'),
      part('F1', 'mcb', 620, 640, 'F-1', null, 'legrand-rx3-1p'),
      part('F2', 'mcb', 740, 640, 'F-2', null, 'legrand-rx3-1p'),
      part('S1', 'sw1', 980, 300, 'S1', null, 'legrand-niloe-valto'),
      part('E1', 'lamp', 960, 500, 'E1'),
      part('X1', 'socket', 960, 740, 'X1'),
      part('NB', 'busbar', 620, 1030, 'N-sín (Fi után)', { role: 'N' })
    ],
    ...bySteps([
      [
        ['SUP.L1', 'F0.1', 'br'],
        ['F0.2', 'KWH.1', 'br'],
        ['SUP.PEN', 'KWH.3', 'gy']
      ],
      [
        ['KWH.4', 'PEN.p0', 'gy']
      ],
      [],
      [
        ['RE.E', 'PEN.p1', 'gy']
      ],
      [
        ['KWH.2', 'FI.L1', 'br'],
        ['PEN.n1', 'FI.N1', 'bl']
      ],
      [
        ['KWH.2', 'SP1.L/N', 'br'],
        ['PEN.n3', 'SP2.L/N', 'bl'],
        ['SP1.PE', 'PEN.p3', 'gy'],
        ['SP2.PE', 'PEN.p4', 'gy']
      ],
      [
        ['FI.L2', 'F1.1', 'br'],
        ['F1.1', 'F2.1', 'br'],
        ['FI.N2', 'NB.b0', 'bl']
      ],
      [
        ['F1.2', 'S1.L', 'br'],
        ['S1.1', 'E1.1', 'br'],
        ['NB.b1', 'E1.2', 'bl'],
        ['F2.2', 'X1.L', 'br'],
        ['NB.b2', 'X1.N', 'bl'],
        ['PEN.p2', 'X1.PE', 'gy']
      ],
      []
    ]),
  objectivesHu: contentI.objectivesHu,
  commonMistakesHu: contentI.commonMistakesHu,
  guided: contentI.guided,
  exam: contentI.exam,
  unresolved: contentI.unresolved,
};
