import type { PartInstance, PartOptions, WireColor } from '../../domain/electrical-types';

/** Rövidítés a feladatok tábla-összeállításához. A dev a valós készülék
 *  azonosítója a realDevices.ts katalógusban. */
export function part(
  id: string,
  type: string,
  x: number,
  y: number,
  label?: string,
  opt?: PartOptions | null,
  dev?: string
): Omit<PartInstance, 'st'> {
  return dev ? { id, type, x, y, label, opt: opt || null, dev } : { id, type, x, y, label, opt: opt || null };
}

type W = [string, string, WireColor];

/** Lépésenként csoportosított huzallista: a solution és a wireStep együtt,
 *  hogy a 3D nézet a stepsHu szerint tudja kiemelni a huzalokat. */
export function bySteps(groups: W[][]): { solution: W[]; wireStep: number[] } {
  return {
    solution: groups.flat(),
    wireStep: groups.flatMap((g, i) => g.map(() => i)),
  };
}
