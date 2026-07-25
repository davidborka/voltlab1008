import type { PartInstance, PartOptions } from '../../domain/electrical-types';

/** Rövidítés a feladatok tábla-összeállításához. */
export function part(
  id: string,
  type: string,
  x: number,
  y: number,
  label?: string,
  opt?: PartOptions
): Omit<PartInstance, 'st'> {
  return { id, type, x, y, label, opt: opt || null };
}
