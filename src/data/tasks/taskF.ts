import type { TaskDef } from '../../domain/electrical-types';
import { bySteps, part } from './helpers';
import { contentF } from './contentF';

export const taskF: TaskDef = {
    id: 'F',
    title: 'Háromfázisú mérőhely',
    subtitle: 'Fogyasztásmérő · főkapcsoló · 4P túlfeszültség-védő · 4 pólusú Fi-relé',
    category: 'merohely',
    complexity: 4,
    world: [1500, 1560],
    briefHu:
      'Mérőhely kialakítása: a hálózat a főbiztosítón át a közvetlen mérésű ' +
      'háromfázisú fogyasztásmérőre megy, onnan a főkapcsolóra, majd a 4 pólusú ' +
      'Fi-relére. A Fi mögül indul a három egyfázisú áramkör - fázisonként egy, ' +
      'hogy a terhelés elosztott legyen. A nullát a mérőn át kell vezetni, és a ' +
      'fogyasztói nulla már a Fi-relé után lévő sínről jön. A főkapcsoló és a Fi ' +
      'közé 4 pólusú T1+T2 túlfeszültség-védő (SPD) kerül.',
    stepsHu: [
      'A hálózat három fázisa az F-0 főbiztosító bemenetére, a nulla a mérő előtti N-sínre, a PE a PE-sínre.',
      'F-0 kimenete a mérő 1, 4, 7 kapcsára, a nulla a mérő 10-es kapcsára.',
      'A mérő 3, 6, 9 kimenete a főkapcsolóra, a 11-es kapocs a főkapcsoló N kapcsára.',
      'Túlfeszültség-védő: a Schelinger SPD01-4P-B+C a főkapcsoló UTÁN, a Fi-relé ELŐTT. L1, L2, L3, N a főkapcsoló kimenetéről, az alsó ⏚ (PE) kapocs rövid úton a PE-sínre.',
      'A főkapcsoló kimenete a 4 pólusú Fi-relé bemenetére - a nulla is a Fi-n megy át.',
      'A Fi kimenetéről a három fázis az F-1, F-2, F-3 megszakítóra, a nulla a Fi utáni N-sínre.',
      'F-1 a dugaljra, F-2 és F-3 egy-egy lámpára. A nulla mindegyikhez a Fi utáni sínről.',
      'A védőföld végig a PE-sínről megy, sehol nincs kapcsolva.'
    ],
    parts: [
      part('SUP', 'feed3', 40, 60, 'Betáplálás'),
      part('F0', 'mcb3', 300, 60, 'F-0', null, 'schneider-easy9-3p-c16'),
      part('KWH', 'meter3', 300, 320, 'kWh'),
      part('FK', 'mainsw', 320, 680, 'FK'),
      part('FI', 'rcd', 320, 980, 'Fi-1', { poles: 4 }, 'schneider-easy9-rcd-4p'),
      part('SPD', 'spd4', 650, 700, 'F-SPD', null, 'schelinger-spd01-4p'),

      part('NB0', 'busbar', 700, 60, 'N-sín (mérő előtt)', { role: 'N' }),
      part('PB', 'busbar', 700, 200, 'PE-sín', { role: 'PE' }),
      part('NB', 'busbar', 700, 1280, 'N-sín (Fi után)', { role: 'N' }),

      part('F1', 'mcb', 700, 1080, 'F-1', null, 'legrand-rx3-1p'),
      part('F2', 'mcb', 810, 1080, 'F-2', null, 'legrand-rx3-1p'),
      part('F3', 'mcb', 920, 1080, 'F-3', null, 'legrand-rx3-1p'),

      part('X1', 'socket', 1080, 500, 'X1'),
      part('E1', 'lamp', 1080, 700, 'E1'),
      part('E2', 'lamp', 1080, 900, 'E2')
    ],
    ...bySteps([
      [
        ['SUP.L1', 'F0.1', 'br'],
        ['SUP.L2', 'F0.3', 'bk'],
        ['SUP.L3', 'F0.5', 'gr'],
        ['SUP.N', 'NB0.b0', 'bl'],
        ['SUP.PE', 'PB.b0', 'gy']
      ],
      [
        ['F0.2', 'KWH.1', 'br'],
        ['F0.4', 'KWH.4', 'bk'],
        ['F0.6', 'KWH.7', 'gr'],
        ['NB0.b1', 'KWH.10', 'bl']
      ],
      [
        ['KWH.3', 'FK.L1', 'br'],
        ['KWH.6', 'FK.L2', 'bk'],
        ['KWH.9', 'FK.L3', 'gr'],
        ['KWH.11', 'FK.N', 'bl']
      ],
      [
        ['FK.T1', 'SPD.L1', 'br'],
        ['FK.T2', 'SPD.L2', 'bk'],
        ['FK.T3', 'SPD.L3', 'gr'],
        ['FK.TN', 'SPD.N', 'bl'],
        ['SPD.PE', 'PB.b2', 'gy']
      ],
      [
        ['FK.T1', 'FI.L1', 'br'],
        ['FK.T2', 'FI.L2', 'bk'],
        ['FK.T3', 'FI.L3', 'gr'],
        ['FK.TN', 'FI.N1', 'bl']
      ],
      [
        ['FI.T1', 'F1.1', 'br'],
        ['FI.T2', 'F2.1', 'bk'],
        ['FI.T3', 'F3.1', 'gr'],
        ['FI.N2', 'NB.b0', 'bl']
      ],
      [
        ['F1.2', 'X1.L', 'br'],
        ['NB.b1', 'X1.N', 'bl'],
        ['F2.2', 'E1.1', 'bk'],
        ['NB.b2', 'E1.2', 'bl'],
        ['F3.2', 'E2.1', 'gr'],
        ['NB.b3', 'E2.2', 'bl']
      ],
      [
        ['PB.b1', 'X1.PE', 'gy']
      ]
    ]),
  objectivesHu: contentF.objectivesHu,
  commonMistakesHu: contentF.commonMistakesHu,
  guided: contentF.guided,
  exam: contentF.exam,
  unresolved: contentF.unresolved,
};
