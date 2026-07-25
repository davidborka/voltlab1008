import type { TaskDef } from '../../domain/electrical-types';
import { part } from './helpers';
import { contentA } from './contentA';

export const taskA: TaskDef = {
    id: 'A',
    title: 'Épületvillamossági szerelés',
    subtitle: 'Lépcsőházi automata · váltókapcsolás · dugalj',
    category: 'epuletvillamossag',
    complexity: 2,
    sourcePreview: 'A.png',
    world: [1420, 1080],
    briefHu:
      'Három áramkör egy Fi-relé mögött. Az 1-es világítási kört lépcsőházi ' +
      'automata kapcsolja, három helyről indítva: egy kapcsoló és két nyomógomb. ' +
      'A 2-es kör váltókapcsolás két helyről. A 3-as kör egy védőérintkezős dugalj.',
    stepsHu: [
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
      part('NB', 'busbar', 1000, 90, 'N-sín', { role: 'N' }),
      part('PB', 'busbar', 1000, 230, 'PE-sín', { role: 'PE' }),

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
    ],
  objectivesHu: contentA.objectivesHu,
  commonMistakesHu: contentA.commonMistakesHu,
  guided: contentA.guided,
  exam: contentA.exam,
  unresolved: contentA.unresolved,
};
