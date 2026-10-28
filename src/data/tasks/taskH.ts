import type { TaskDef } from '../../domain/electrical-types';
import { bySteps, part } from './helpers';
import { contentH } from './contentH';

/* A „Csillag-delta.pdf” feladatlap alapján (2 oldal: vezérlés és főáramkör).
   A rajzon a motor az X1 sorkapcson át csatlakozik (X1 6-8: U1 V1 W1,
   X1 9-11: a tekercsek másik végei, X1 12: PE) - a táblán közvetlenül a motor
   kapcsaira kötünk, az X1 számozás a lépésekben szerepel. */
export const taskH: TaskDef = {
    id: 'H',
    title: 'Csillag-delta indítás időrelével',
    subtitle: 'F2 motorvédő · Q11 fő · Q13 csillag · Q15 delta · K1 időrelé',
    category: 'motorvezerles',
    complexity: 5,
    sourcePreview: 'H.png',
    briefHu:
      'A motor csillagban indul (1/3 indítóáram), majd a K1 időrelé lejártakor ' +
      'deltára vált. START-ra először a Q13 csillag-mágneskapcsoló húz meg, ' +
      'a záró érintkezője hozza be a Q11 fő mágneskapcsolót és a K1 időrelét. ' +
      'Az idő lejártakor Q13 elenged, és a Q15 delta-mágneskapcsoló húz meg. ' +
      'Q13 és Q15 kölcsönösen reteszelt. P1 álló, P2 csillag, P3 delta állapotot jelez.',
    stepsHu: [
      'Betáplálás (X1 1-5): L1, L2, L3 az F2 motorvédő kapcsoló 1L1 3L2 5L3 kapcsára, N és PE a sínekre.',
      'F2 2T1 4T2 6T3 kimenete a Q11 1L1 3L2 5L3 bemenetére, és ugyanonnan a Q15 1L1 3L2 5L3 bemenetére.',
      'Q11 2-4-6 a motor U1, V1, W1 kapcsára (X1 6-7-8).',
      'Q15 2-4-6 a motor W2, U2, V2 kapcsára (X1 9-10-11) - ez a delta kötés. Ugyanezek a Q13 2-4-6 kapcsára mennek.',
      'Q13 1-3-5 áthidalva: ez a csillagpont. A motor teste a PE-sínre (X1 12).',
      'Vezérlés: L1 → F1 → S1 (STOP, bontó) → S2 (START, záró) ∥ Q11 53-54 → Q11 13-14 ∥ Q13 53-54 → Q11 tekercs és K1 időrelé tekercs.',
      'Csillag ág: a START utáni pontról K1 15-16 (késleltetve bontó) → Q15 21-22 → Q13 tekercs.',
      'Delta ág: K1 15-18 (késleltetve záró) → Q13 21-22 → Q15 tekercs. Minden A2 a nullára.',
      'Jelzés: F1 után Q11 61-62 → P1 (áll), Q13 83-84 → P2 (csillag), Q15 83-84 → P3 (delta).'
    ],
    world: [1700, 1320],
    parts: [
      part('SUP', 'feed3', 40, 40, 'X1 betáplálás'),
      part('F2', 'mprot', 330, 40, 'F2', null, 'elmark-tm2-e08'),
      part('Q11', 'contactor', 40, 380, 'Q11 (fő)', {
        aux: [['13', '14', 'no'], ['53', '54', 'no'], ['61', '62', 'nc']]
      }, 'schneider-lc1d18'),
      part('Q15', 'contactor', 420, 380, 'Q15 (Δ)', {
        aux: [['21', '22', 'nc'], ['83', '84', 'no']]
      }, 'schneider-lc1d18'),
      part('Q13', 'contactor', 800, 380, 'Q13 (Y)', {
        aux: [['53', '54', 'no'], ['21', '22', 'nc'], ['83', '84', 'no']]
      }, 'schneider-lc1d18'),
      part('M', 'motor6', 380, 820, 'M1'),

      part('F1', 'mcb', 1200, 40, 'F1', null, 'legrand-rx3-1p'),
      part('S1', 'btnNC', 1200, 240, 'S1'),
      part('S2', 'btn', 1380, 240, 'S2'),
      part('K1', 'timer', 1220, 420, 'K1', null, 'finder-82-01'),
      part('P1', 'pilot', 1200, 720, 'P1', { color: 'red' }),
      part('P2', 'pilot', 1350, 720, 'P2', { color: 'green' }),
      part('P3', 'pilot', 1500, 720, 'P3', { color: 'green' }),
      part('NB', 'busbar', 1200, 960, 'N-sín', { role: 'N' }),
      part('PB', 'busbar', 1200, 1110, 'PE-sín', { role: 'PE' })
    ],
    ...bySteps([
      [
        ['SUP.L1', 'F2.1L1', 'br'],
        ['SUP.L2', 'F2.3L2', 'bk'],
        ['SUP.L3', 'F2.5L3', 'gr'],
        ['SUP.N', 'NB.b0', 'bl'],
        ['SUP.PE', 'PB.b0', 'gy']
      ],
      [
        ['F2.2T1', 'Q11.1L1', 'br'],
        ['F2.4T2', 'Q11.3L2', 'bk'],
        ['F2.6T3', 'Q11.5L3', 'gr'],
        ['F2.2T1', 'Q15.1L1', 'br'],
        ['F2.4T2', 'Q15.3L2', 'bk'],
        ['F2.6T3', 'Q15.5L3', 'gr']
      ],
      [
        ['Q11.2T1', 'M.U1', 'br'],
        ['Q11.4T2', 'M.V1', 'bk'],
        ['Q11.6T3', 'M.W1', 'gr']
      ],
      [
        ['Q15.2T1', 'M.W2', 'br'],
        ['Q15.4T2', 'M.U2', 'bk'],
        ['Q15.6T3', 'M.V2', 'gr'],
        ['Q15.2T1', 'Q13.2T1', 'br'],
        ['Q15.4T2', 'Q13.4T2', 'bk'],
        ['Q15.6T3', 'Q13.6T3', 'gr']
      ],
      [
        ['Q13.1L1', 'Q13.3L2', 'bk'],
        ['Q13.3L2', 'Q13.5L3', 'bk'],
        ['PB.b1', 'M.PE', 'gy']
      ],
      [
        ['SUP.L1', 'F1.1', 'br'],
        ['F1.2', 'S1.1', 'br'],
        ['S1.2', 'S2.3', 'br'],
        ['S1.2', 'Q11.53', 'br'],
        ['S2.4', 'Q11.54', 'br'],
        ['S2.4', 'Q11.13', 'br'],
        ['S2.4', 'Q13.53', 'br'],
        ['Q11.14', 'Q13.54', 'br'],
        ['Q11.14', 'Q11.A1', 'br'],
        ['Q11.A1', 'K1.A1', 'br'],
        ['Q11.A2', 'NB.b1', 'bl'],
        ['K1.A2', 'NB.b2', 'bl']
      ],
      [
        ['Q11.54', 'K1.15', 'br'],
        ['K1.16', 'Q15.21', 'br'],
        ['Q15.22', 'Q13.A1', 'br'],
        ['Q13.A2', 'NB.b3', 'bl']
      ],
      [
        ['K1.18', 'Q13.21', 'br'],
        ['Q13.22', 'Q15.A1', 'br'],
        ['Q15.A2', 'NB.b4', 'bl']
      ],
      [
        ['F1.2', 'Q11.61', 'br'],
        ['Q11.62', 'P1.X1', 'br'],
        ['F1.2', 'Q13.83', 'br'],
        ['Q13.84', 'P2.X1', 'br'],
        ['F1.2', 'Q15.83', 'br'],
        ['Q15.84', 'P3.X1', 'br'],
        ['P1.X2', 'NB.b5', 'bl'],
        ['P2.X2', 'NB.b6', 'bl'],
        ['P3.X2', 'P2.X2', 'bl']
      ]
    ]),
  objectivesHu: contentH.objectivesHu,
  commonMistakesHu: contentH.commonMistakesHu,
  guided: contentH.guided,
  exam: contentH.exam,
  unresolved: contentH.unresolved,
};
