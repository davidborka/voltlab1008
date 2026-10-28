import type { TaskDef } from '../../domain/electrical-types';
import { bySteps, part } from './helpers';
import { contentB } from './contentB';

export const taskB: TaskDef = {
    id: 'B',
    title: 'Épületvillamossági szerelés',
    subtitle: 'Lépcsőházi automata · keresztkapcsolás · dugalj',
    category: 'epuletvillamossag',
    complexity: 3,
    sourcePreview: 'B.png',
    world: [1420, 1080],
    briefHu:
      'Ugyanaz a tábla, nehezebb világítással. Az 1-es kört lépcsőházi automata ' +
      'kapcsolja két nyomógombról. A 2-es kör keresztkapcsolás: két váltó- és egy ' +
      'keresztkapcsoló, három helyről. A 3-as kör dugalj.',
    stepsHu: [
      'Betáplálás a Fi-relére, onnan a három kismegszakítóra. Nulla az N-sínre, védőföld a PE-sínre.',
      'F-1 kimenete az automata L kapcsára, az N-sínről a nulla az N kapcsára.',
      'Ugyanez az F-1 kimenet adja az állandó fázist az S1 és S2 nyomó L kapcsára.',
      'A két nyomó 1-es kapcsa az automata 3-as kapcsára, az automata 4-es kapcsa az E1 lámpára.',
      'F-2 a K1 váltó L kapcsára. K1 1-es és 2-es kapcsa a K2 keresztkapcsoló piros L1, L2 bemenetére.',
      'A K2 szürke 3-as és 4-es kimenete a K3 váltó 1-es és 2-es kapcsára, K3 L kapcsa az E2 lámpára.',
      'F-3 a dugalj L kapcsára, mellé a nulla és a védőföld a sínekről.'
    ],
    parts: [
      part('SUP', 'feed', 40, 60, 'Betáplálás'),
      part('FI', 'rcd', 250, 90, 'Fi-1', null, 'ideal-krd10'),
      part('F1', 'mcb', 450, 90, 'F-1', null, 'legrand-rx3-1p'),
      part('F2', 'mcb', 550, 90, 'F-2', null, 'legrand-rx3-1p'),
      part('F3', 'mcb', 650, 90, 'F-3', null, 'legrand-rx3-1p'),
      part('LA', 'stair', 770, 90, 'LA-1', null, 'schneider-min-15363'),
      part('NB', 'busbar', 1000, 90, 'N-sín', { role: 'N' }),
      part('PB', 'busbar', 1000, 230, 'PE-sín', { role: 'PE' }),

      part('S1', 'push', 80, 420, 'S1', null, 'schneider-nyomo'),
      part('S2', 'push', 300, 420, 'S2', null, 'schneider-nyomo'),
      part('E1', 'lamp', 560, 410, 'E1'),

      part('K1', 'sw2', 80, 650, 'K1', null, 'legrand-niloe-valto'),
      part('K2', 'swx', 300, 650, 'K2', null, 'legrand-niloe-764504'),
      part('K3', 'sw2', 520, 650, 'K3', null, 'legrand-niloe-valto'),
      part('E2', 'lamp', 760, 640, 'E2'),

      part('X1', 'socket', 80, 870, 'X1')
    ],
    ...bySteps([
      [
        ['SUP.L1', 'FI.L1', 'br'],
        ['SUP.N', 'FI.N1', 'bl'],
        ['SUP.PE', 'PB.b0', 'gy'],
        ['FI.L2', 'F1.1', 'br'],
        ['F1.1', 'F2.1', 'br'],
        ['F2.1', 'F3.1', 'br'],
        ['FI.N2', 'NB.b0', 'bl']
      ],
      [
        ['F1.2', 'LA.L', 'br'],
        ['NB.b1', 'LA.N', 'bl']
      ],
      [
        ['F1.2', 'S1.L', 'br'],
        ['F1.2', 'S2.L', 'br']
      ],
      [
        ['S1.1', 'LA.3', 'bk'],
        ['S2.1', 'LA.3', 'bk'],
        ['LA.4', 'E1.1', 'gr'],
        ['NB.b2', 'E1.2', 'bl']
      ],
      [
        ['F2.2', 'K1.L', 'br'],
        ['K1.1', 'K2.L1', 'bk'],
        ['K1.2', 'K2.L2', 'gr']
      ],
      [
        ['K2.3', 'K3.1', 'bk'],
        ['K2.4', 'K3.2', 'gr'],
        ['K3.L', 'E2.1', 'br'],
        ['NB.b3', 'E2.2', 'bl']
      ],
      [
        ['F3.2', 'X1.L', 'br'],
        ['NB.b4', 'X1.N', 'bl'],
        ['PB.b1', 'X1.PE', 'gy']
      ]
    ]),
  objectivesHu: contentB.objectivesHu,
  commonMistakesHu: contentB.commonMistakesHu,
  guided: contentB.guided,
  exam: contentB.exam,
  unresolved: contentB.unresolved,
};
