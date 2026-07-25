import type { TaskDef } from '../../domain/electrical-types';
import { part } from './helpers';
import { contentD } from './contentD';

export const taskD: TaskDef = {
    id: 'D',
    title: 'Irányváltós motorvezérlés',
    subtitle: 'Két mágneskapcsoló · fáziscsere · kölcsönös reteszelés',
    category: 'motorvezerles',
    complexity: 5,
    sourcePreview: 'D.png',
    briefHu:
      'K-1 előre, K-2 hátra forgatja a motort - a K-2 két fázist cserél. ' +
      'A két mágneskapcsoló kölcsönösen reteszőli egymást a 81/82 bontó ' +
      'érintkezőkkel, így egyszerre soha nem húzhatnak meg.',
    stepsHu: [
      'Betáplálás a frekvenciaváltóra, onnan F-1, majd a K-1 és K-2 főérintkezőire.',
      'A K-2-n L1 és L3 fel van cserélve (1 ↔ 5), ez adja az ellenkező forgásirányt.',
      'Mindkét mágneskapcsoló kimenete a HK-1 motorvédőre, onnan a motorra.',
      'Vezérlés: L1 az F-2-re, onnan a HK-1 13/14 segédérintkezőjére, majd az S1 leállítóra.',
      'S2 indító és K-1 13/14 öntartás párhuzamosan, onnan a K-2 81/82 reteszen át a K-1 tekercsre.',
      'S3 indító és K-2 13/14 öntartás párhuzamosan, onnan a K-1 81/82 reteszen át a K-2 tekercsre.',
      'P a K-1 és K-2 51/52 bontó érintkezőin sorosan jelzi az álló állapotot; Z1 és Z2 az irányokat.'
    ],
    world: [1260, 1440],
    parts: [
      part('SUP', 'feed', 40, 40, 'Betáplálás'),
      part('Q1', 'vfd', 330, 40, 'Q-1'),
      part('F1', 'mcb3', 40, 300, 'F-1'),
      part('K1', 'contactor', 40, 520, 'K-1', {
        aux: [['13', '14', 'no'], ['51', '52', 'nc'], ['81', '82', 'nc']]
      }),
      part('K2', 'contactor', 40, 840, 'K-2', {
        aux: [['13', '14', 'no'], ['51', '52', 'nc'], ['81', '82', 'nc']]
      }),
      part('HK', 'mprot', 420, 840, 'HK-1'),
      part('M', 'motor', 425, 1120, 'M1'),

      part('F2', 'mcb', 780, 40, 'F-2'),
      part('S1', 'btnNC', 700, 230, 'S1'),
      part('S2', 'btn', 860, 230, 'S2'),
      part('S3', 'btn', 1020, 230, 'S3'),
      part('P', 'pilot', 700, 410, 'P', { color: 'red' }),
      part('Z1', 'pilot', 840, 410, 'Z1', { color: 'green' }),
      part('Z2', 'pilot', 980, 410, 'Z2', { color: 'green' }),
      part('NB', 'busbar', 700, 580, 'N-sín', { role: 'N' }),
      part('PB', 'busbar', 700, 720, 'PE-sín', { role: 'PE' })
    ],
    solution: [
      ['SUP.L1', 'Q1.L1', 'br'],
      ['SUP.N', 'Q1.N', 'bl'],
      ['SUP.PE', 'Q1.PE', 'gy'],
      ['SUP.N', 'NB.b0', 'bl'],
      ['SUP.PE', 'PB.b0', 'gy'],

      ['Q1.T1', 'F1.1a', 'br'],
      ['Q1.T2', 'F1.1b', 'bk'],
      ['Q1.T3', 'F1.1c', 'gr'],
      ['F1.2a', 'K1.1', 'br'],
      ['F1.2b', 'K1.3', 'bk'],
      ['F1.2c', 'K1.5', 'gr'],
      ['F1.2a', 'K2.5', 'br'],
      ['F1.2b', 'K2.3', 'bk'],
      ['F1.2c', 'K2.1', 'gr'],
      ['K1.2', 'HK.L1', 'br'],
      ['K1.4', 'HK.L2', 'bk'],
      ['K1.6', 'HK.L3', 'gr'],
      ['K2.2', 'HK.L1', 'br'],
      ['K2.4', 'HK.L2', 'bk'],
      ['K2.6', 'HK.L3', 'gr'],
      ['HK.T1', 'M.U1', 'br'],
      ['HK.T2', 'M.V1', 'bk'],
      ['HK.T3', 'M.W1', 'gr'],
      ['PB.b1', 'M.PE', 'gy'],

      ['SUP.L1', 'F2.1', 'br'],
      ['F2.2', 'HK.13', 'br'],
      ['HK.14', 'S1.1', 'br'],
      ['S1.2', 'S2.3', 'br'],
      ['S1.2', 'S3.3', 'br'],
      ['S1.2', 'K1.13', 'br'],
      ['S1.2', 'K2.13', 'br'],
      ['S2.4', 'K2.81', 'br'],
      ['K1.14', 'K2.81', 'br'],
      ['K2.82', 'K1.A1', 'br'],
      ['K1.A2', 'NB.b2', 'bl'],
      ['K1.A1', 'Z1.X1', 'br'],
      ['Z1.X2', 'NB.b3', 'bl'],
      ['S3.4', 'K1.81', 'br'],
      ['K2.14', 'K1.81', 'br'],
      ['K1.82', 'K2.A1', 'br'],
      ['K2.A2', 'NB.b4', 'bl'],
      ['K2.A1', 'Z2.X1', 'br'],
      ['Z2.X2', 'NB.b5', 'bl'],
      ['HK.14', 'K1.51', 'br'],
      ['K1.52', 'K2.52', 'br'],
      ['K2.51', 'P.X1', 'br'],
      ['P.X2', 'NB.b6', 'bl']
    ],
  objectivesHu: contentD.objectivesHu,
  commonMistakesHu: contentD.commonMistakesHu,
  guided: contentD.guided,
  exam: contentD.exam,
  unresolved: contentD.unresolved,
};
