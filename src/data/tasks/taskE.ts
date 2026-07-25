import type { TaskDef } from '../../domain/electrical-types';
import { part } from './helpers';
import { contentE } from './contentE';

export const taskE: TaskDef = {
    id: 'E',
    title: 'Egyfázisú motorindítás',
    subtitle: 'Mágneskapcsoló · öntartás · motorvédő · üzemjelzés',
    category: 'motorvezerles',
    complexity: 3,
    world: [1240, 1270],
    briefHu:
      'Ugyanaz a vezérlési logika, mint a C feladatban, de egyfázisú motorral és ' +
      'frekvenciaváltó nélkül. A motort mágneskapcsoló kapcsolja, öntartással: az ' +
      'indítógomb elengedése után a K-1 saját záró érintkezője tartja meg magát. ' +
      'A leállító nyomógomb nyugalmi helyzetben zárt, ezért a megszakadása is leállít.',
    stepsHu: [
      'Betáplálás L a főáramköri F-1 megszakítóra, a nulla az N-sínre, a védőföld a PE-sínre.',
      'F-1 kimenete a K-1 főérintkezőjére (1), onnan a 2-es kapocs a HK-1 motorvédőre.',
      'HK-1 kimenete a motor U1 kapcsára, a motor U2 kapcsa az N-sínre, a test a PE-sínre.',
      'Vezérlés: F-1 bemenetéről a fázis az F-2 megszakítóra, onnan a HK-1 13/14 segédérintkezőjére.',
      'HK-1 14 az S1 leállító bontó gombjára, onnan az S2 indító záró gombra.',
      'Az S2 kimenete és a K-1 13/14 záró érintkezője párhuzamosan megy a K-1 tekercs A1 kapcsára.',
      'K-1 A2 a nullára. A Z zöld lámpa a tekerccsel párhuzamosan, a P piros a K-1 21/22 bontóján át.'
    ],
    parts: [
      part('SUP', 'feed', 40, 60, 'Betáplálás'),
      part('F1', 'mcb', 300, 120, 'F-1'),
      part('K1', 'contactor', 220, 380, 'K-1', {
        aux: [['13', '14', 'no'], ['21', '22', 'nc']]
      }),
      part('HK', 'mprot', 240, 740, 'HK-1', { poles: 1 }),
      part('M', 'motor1', 245, 1000, 'M1'),

      part('F2', 'mcb', 700, 120, 'F-2'),
      part('S1', 'btnNC', 660, 320, 'S1'),
      part('S2', 'btn', 830, 320, 'S2'),
      part('P', 'pilot', 660, 500, 'P', { color: 'red' }),
      part('Z', 'pilot', 800, 500, 'Z', { color: 'green' }),
      part('NB', 'busbar', 660, 680, 'N-sín', { role: 'N' }),
      part('PB', 'busbar', 660, 820, 'PE-sín', { role: 'PE' })
    ],
    solution: [
      ['SUP.L1', 'F1.1', 'br'],
      ['SUP.N', 'NB.b0', 'bl'],
      ['SUP.PE', 'PB.b0', 'gy'],
      ['F1.1', 'F2.1', 'br'],

      ['F1.2', 'K1.1', 'br'],
      ['K1.2', 'HK.L1', 'br'],
      ['HK.T1', 'M.U1', 'br'],
      ['NB.b1', 'M.U2', 'bl'],
      ['PB.b1', 'M.PE', 'gy'],

      ['F2.2', 'HK.13', 'br'],
      ['HK.14', 'S1.1', 'br'],
      ['S1.2', 'S2.3', 'br'],
      ['S1.2', 'K1.13', 'br'],
      ['S2.4', 'K1.A1', 'br'],
      ['K1.14', 'K1.A1', 'br'],
      ['K1.A2', 'NB.b2', 'bl'],
      ['K1.A1', 'Z.X1', 'br'],
      ['Z.X2', 'NB.b3', 'bl'],
      ['HK.14', 'K1.21', 'br'],
      ['K1.22', 'P.X1', 'br'],
      ['P.X2', 'NB.b4', 'bl']
    ],
  objectivesHu: contentE.objectivesHu,
  commonMistakesHu: contentE.commonMistakesHu,
  guided: contentE.guided,
  exam: contentE.exam,
  unresolved: contentE.unresolved,
};
