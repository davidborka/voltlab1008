import type { TaskDef } from '../../domain/electrical-types';
import { bySteps, part } from './helpers';
import { contentG } from './contentG';

export const taskG: TaskDef = {
    id: 'G',
    title: 'Egyfázisú mérőhely',
    subtitle: 'Qoltec mérő · főkismegszakító · 2× SPD · Fi-relé',
    category: 'merohely',
    complexity: 2,
    world: [1240, 1300],
    briefHu:
      'Az F feladat egyfázisú párja. A hálózat a főbiztosítón át a közvetlen ' +
      'mérésű egyfázisú fogyasztásmérőre (Qoltec 50888) megy, onnan a ' +
      'főkismegszakítóra, majd a Fi-relére. A mérőn a fázis és a nulla is átmegy ' +
      '(L: 1 → 2, N: 3 → 4), a fogyasztói nulla viszont már a Fi-relé utáni sínről ' +
      'jön. A főkismegszakító és a Fi közé két 1 pólusú túlfeszültség-védő (SPD) ' +
      'kerül: egy L-PE és egy N-PE között. A védőföld sehol nincs kapcsolva és nem ' +
      'megy át a mérőn.',
    stepsHu: [
      'A hálózat fázisa az F-0 főbiztosítóra, a nulla a mérő előtti N-sínre, a PE a PE-sínre.',
      'F-0 kimenete a Qoltec mérő 1-es kapcsára (L be), a mérő előtti nulla a 3-as kapcsára (N be).',
      'A mérő 2-es kapcsa (L ki) a főkismegszakítóra (FM), a 4-es kapcsa (N ki) a Fi-relé N bemenetére.',
      'FM kimenete a Fi-relé fázis bemenetére - innentől minden fogyasztó a Fi mögött van.',
      'Túlfeszültség-védelem az FM UTÁN, a Fi ELŐTT: két ELMARK SPD-C10. SP1 L/N kapcsa az FM kimenetére (L-PE), SP2 L/N kapcsa a mérő 4-es kapcsára (N-PE), mindkét alsó ⏚ kapocs rövid úton a PE-sínre.',
      'A Fi fázis kimenete az F-1 és F-2 megszakítóra, a nulla kimenete a Fi utáni N-sínre.',
      'F-1 a dugaljra, F-2 a lámpára; a nulla mindkettőhöz a Fi utáni sínről.',
      'A védőföld a PE-sínről a dugalj PE kapcsára - a mérőt és a Fi-t kikerülve.'
    ],
    parts: [
      part('SUP', 'feed', 40, 60, 'Betáplálás'),
      part('F0', 'mcb', 300, 80, 'F-0', null, 'legrand-rx3-1p'),
      part('KWH', 'meter1', 250, 330, 'kWh', null, 'qoltec-50888'),
      part('FM', 'mcb', 300, 660, 'FM', null, 'legrand-rx3-1p'),
      part('SP1', 'spd1', 420, 650, 'SP1', null, 'elmark-spd-c10'),
      part('SP2', 'spd1', 520, 650, 'SP2', null, 'elmark-spd-c10'),
      part('FI', 'rcd', 250, 910, 'Fi-1', null, 'legrand-rx3-rcd-2p'),

      part('NB0', 'busbar', 620, 60, 'N-sín (mérő előtt)', { role: 'N' }),
      part('PB', 'busbar', 620, 200, 'PE-sín', { role: 'PE' }),
      part('NB', 'busbar', 620, 1130, 'N-sín (Fi után)', { role: 'N' }),

      part('F1', 'mcb', 620, 910, 'F-1', null, 'legrand-rx3-1p'),
      part('F2', 'mcb', 730, 910, 'F-2', null, 'legrand-rx3-1p'),

      part('X1', 'socket', 900, 420, 'X1'),
      part('E1', 'lamp', 900, 660, 'E1')
    ],
    ...bySteps([
      [
        ['SUP.L1', 'F0.1', 'br'],
        ['SUP.N', 'NB0.b0', 'bl'],
        ['SUP.PE', 'PB.b0', 'gy']
      ],
      [
        ['F0.2', 'KWH.1', 'br'],
        ['NB0.b1', 'KWH.3', 'bl']
      ],
      [
        ['KWH.2', 'FM.1', 'br'],
        ['KWH.4', 'FI.N1', 'bl']
      ],
      [
        ['FM.2', 'FI.L1', 'br']
      ],
      [
        ['FM.2', 'SP1.L/N', 'br'],
        ['KWH.4', 'SP2.L/N', 'bl'],
        ['SP1.PE', 'PB.b2', 'gy'],
        ['SP2.PE', 'PB.b3', 'gy']
      ],
      [
        ['FI.L2', 'F1.1', 'br'],
        ['F1.1', 'F2.1', 'br'],
        ['FI.N2', 'NB.b0', 'bl']
      ],
      [
        ['F1.2', 'X1.L', 'br'],
        ['NB.b1', 'X1.N', 'bl'],
        ['F2.2', 'E1.1', 'br'],
        ['NB.b2', 'E1.2', 'bl']
      ],
      [
        ['PB.b1', 'X1.PE', 'gy']
      ]
    ]),
  objectivesHu: contentG.objectivesHu,
  commonMistakesHu: contentG.commonMistakesHu,
  guided: contentG.guided,
  exam: contentG.exam,
  unresolved: contentG.unresolved,
};
