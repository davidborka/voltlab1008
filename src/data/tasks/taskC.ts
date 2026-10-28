import type { TaskDef } from '../../domain/electrical-types';
import { bySteps, part } from './helpers';
import { contentC } from './contentC';

export const taskC: TaskDef = {
    id: 'C',
    title: 'Motorindítás frekvenciaváltóval',
    subtitle: 'Öntartás · két leállító és két indító nyomógomb',
    category: 'motorvezerles',
    complexity: 4,
    sourcePreview: 'C.png',
    briefHu:
      'A motort egy mágneskapcsoló indítja, öntartással. Két helyről lehet ' +
      'indítani (S2, S4 záró gombok párhuzamosan) és két helyről leállítani ' +
      '(S1, S3 bontó gombok sorosan). P a nyugalmi, Z az üzemi állapotot jelzi.',
    stepsHu: [
      'Betáplálás a frekvenciaváltóra: L1, N és PE a Q-1 bemenetére.',
      'A Q-1 kimenete (T1-T3) az F-1 3P kismegszakító 1-3-5 kapcsára, a 2-4-6 kimenet a K-1 1L1 3L2 5L3 főérintkezőire.',
      'K-1 2T1 4T2 6T3 kimenete a HK-1 motorvédő 1L1 3L2 5L3 bemenetére, a 2T1 4T2 6T3 a motor U1, V1, W1 kapcsára, a test a PE-sínre.',
      'Vezérlés: L1 az F-2 megszakítóra, onnan a HK-1 13/14 segédérintkezőjére.',
      'A két leállító nyomógomb sorosan: HK-1 14 az S1-re, S1 kimenete az S3-ra.',
      'A két indító gomb és a K-1 13/14 öntartás párhuzamosan a tekercs A1 kapcsára.',
      'K-1 A2 a nullára. Z a tekerccsel párhuzamosan, P a K-1 21/22 bontóján keresztül.'
    ],
    world: [1160, 1260],
    parts: [
      part('SUP', 'feed', 40, 40, 'Betáplálás'),
      part('Q1', 'vfd', 320, 40, 'Q-1'),
      part('F1', 'mcb3', 40, 330, 'F-1', null, 'schneider-easy9-3p-c16'),
      part('K1', 'contactor', 40, 550, 'K-1', {
        aux: [['13', '14', 'no'], ['21', '22', 'nc']]
      }, 'schneider-lc1d18'),
      part('HK', 'mprot', 40, 900, 'HK-1', null, 'elmark-tm2-e08'),
      part('M', 'motor', 300, 910, 'M1'),

      part('F2', 'mcb', 730, 40, 'F-2', null, 'legrand-rx3-1p'),
      part('S1', 'btnNC', 670, 220, 'S1'),
      part('S3', 'btnNC', 830, 220, 'S3'),
      part('S2', 'btn', 670, 400, 'S2'),
      part('S4', 'btn', 830, 400, 'S4'),
      part('P', 'pilot', 670, 580, 'P', { color: 'red' }),
      part('Z', 'pilot', 810, 580, 'Z', { color: 'green' }),
      part('NB', 'busbar', 670, 750, 'N-sín', { role: 'N' }),
      part('PB', 'busbar', 670, 890, 'PE-sín', { role: 'PE' })
    ],
    ...bySteps([
      [
        ['SUP.L1', 'Q1.L1', 'br'],
        ['SUP.N', 'Q1.N', 'bl'],
        ['SUP.PE', 'Q1.PE', 'gy'],
        ['SUP.N', 'NB.b0', 'bl'],
        ['SUP.PE', 'PB.b0', 'gy']
      ],
      [
        ['Q1.T1', 'F1.1', 'br'],
        ['Q1.T2', 'F1.3', 'bk'],
        ['Q1.T3', 'F1.5', 'gr'],
        ['F1.2', 'K1.1L1', 'br'],
        ['F1.4', 'K1.3L2', 'bk'],
        ['F1.6', 'K1.5L3', 'gr']
      ],
      [
        ['K1.2T1', 'HK.1L1', 'br'],
        ['K1.4T2', 'HK.3L2', 'bk'],
        ['K1.6T3', 'HK.5L3', 'gr'],
        ['HK.2T1', 'M.U1', 'br'],
        ['HK.4T2', 'M.V1', 'bk'],
        ['HK.6T3', 'M.W1', 'gr'],
        ['PB.b1', 'M.PE', 'gy']
      ],
      [
        ['SUP.L1', 'F2.1', 'br'],
        ['F2.2', 'HK.13', 'br']
      ],
      [
        ['HK.14', 'S1.1', 'br'],
        ['S1.2', 'S3.1', 'br']
      ],
      [
        ['S3.2', 'S2.3', 'br'],
        ['S3.2', 'S4.3', 'br'],
        ['S3.2', 'K1.13', 'br'],
        ['S2.4', 'K1.A1', 'br'],
        ['S4.4', 'K1.A1', 'br'],
        ['K1.14', 'K1.A1', 'br']
      ],
      [
        ['K1.A2', 'NB.b2', 'bl'],
        ['K1.A1', 'Z.X1', 'br'],
        ['Z.X2', 'NB.b3', 'bl'],
        ['HK.14', 'K1.21', 'br'],
        ['K1.22', 'P.X1', 'br'],
        ['P.X2', 'NB.b4', 'bl']
      ]
    ]),
  objectivesHu: contentC.objectivesHu,
  commonMistakesHu: contentC.commonMistakesHu,
  guided: contentC.guided,
  exam: contentC.exam,
  unresolved: contentC.unresolved,
};
