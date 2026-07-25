import type { TaskDef } from '../../domain/electrical-types';
import { part } from './helpers';
import { contentG } from './contentG';

export const taskG: TaskDef = {
    id: 'G',
    title: 'Egyfázisú mérőhely',
    subtitle: 'Fogyasztásmérő · főkismegszakító · Fi-relé',
    category: 'merohely',
    complexity: 2,
    world: [1240, 1300],
    briefHu:
      'Az F feladat egyfázisú párja. A hálózat a főbiztosítón át a közvetlen ' +
      'mérésű egyfázisú fogyasztásmérőre megy, onnan a főkismegszakítóra, majd ' +
      'a Fi-relére. A mérőn a fázis és a nulla is átmegy (1-3 és 4-6), a ' +
      'fogyasztói nulla viszont már a Fi-relé utáni sínről jön. A védőföld ' +
      'sehol nincs kapcsolva és nem megy át a mérőn.',
    stepsHu: [
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

      part('NB0', 'busbar', 620, 60, 'N-sín (mérő előtt)', { role: 'N' }),
      part('PB', 'busbar', 620, 200, 'PE-sín', { role: 'PE' }),
      part('NB', 'busbar', 620, 1130, 'N-sín (Fi után)', { role: 'N' }),

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
    ],
  objectivesHu: contentG.objectivesHu,
  commonMistakesHu: contentG.commonMistakesHu,
  guided: contentG.guided,
  exam: contentG.exam,
  unresolved: contentG.unresolved,
};
