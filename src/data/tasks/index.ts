import type { TaskDef } from '../../domain/electrical-types';
import { taskA } from './taskA';
import { taskB } from './taskB';
import { taskC } from './taskC';
import { taskD } from './taskD';
import { taskE } from './taskE';
import { taskF } from './taskF';
import { taskG } from './taskG';
import { taskH } from './taskH';

export const TASKS: Record<string, TaskDef> = {
  A: taskA, B: taskB, C: taskC, D: taskD, E: taskE, F: taskF, G: taskG, H: taskH,
};

export const TASK_ORDER = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const;

export const CATEGORY_LABELS: Record<string, string> = {
  epuletvillamossag: 'Épületvillamosság',
  motorvezerles: 'Motorvezérlés',
  merohely: 'Mérőhely',
};
