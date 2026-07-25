import type { TaskDef } from '../../domain/electrical-types';
import { part } from './helpers';
import { contentF } from './contentF';

export const taskF: TaskDef = {
    id: 'F',
    title: 'Háromfázisú mérőhely',
    subtitle: 'Fogyasztásmérő · főkapcsoló · 4 pólusú Fi-relé',
    category: 'merohely',
    complexity: 4,
    world: [1500, 1560],
    briefHu:
      'Mérőhely kialakítása: a hálózat a főbiztosítón át a közvetlen mérésű ' +
      'háromfázisú fogyasztásmérőre megy, onnan a főkapcsolóra, majd a 4 pólusú ' +
      'Fi-relére. A Fi mögül indul a három egyfázisú áramkör - fázisonként egy, ' +
      'hogy a terhelés elosztott legyen. A nullát a mérőn át kell vezetni, és a ' +
      'fogyasztói nulla már a Fi-relé után lévő sínről jön.',
    stepsHu: [
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

      part('NB0', 'busbar', 700, 60, 'N-sín (mérő előtt)', { role: 'N' }),
      part('PB', 'busbar', 700, 200, 'PE-sín', { role: 'PE' }),
      part('NB', 'busbar', 700, 1280, 'N-sín (Fi után)', { role: 'N' }),

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
    ],
  objectivesHu: contentF.objectivesHu,
  commonMistakesHu: contentF.commonMistakesHu,
  guided: contentF.guided,
  exam: contentF.exam,
  unresolved: contentF.unresolved,
};
