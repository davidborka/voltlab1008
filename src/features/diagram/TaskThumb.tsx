/**
 * Miniatűr vektoros előnézet a feladatkártyán. Nem képfájl és nem általános
 * illusztráció: a feladat valódi alkatrész-elrendezéséből és a referenciamegoldás
 * kábeleiből rajzolódik, ezért minden kártya más.
 */
import { useMemo } from 'react';
import type { PartInstance, TaskDef } from '../../domain/electrical-types';
import { PARTS, termsOf, widthOf } from '../../data/parts';

const WIRE_STROKE: Record<string, string> = {
  br: '#a86a3d',
  bl: '#3f82db',
  gy: '#5fb356',
  bk: '#5b6470',
  gr: '#8b95a2',
};

export function TaskThumb({ task }: { task: TaskDef }) {
  const { boxes, paths, vb } = useMemo(() => {
    const inst = task.parts.map((p) => ({ ...p, st: {} }) as PartInstance);
    const boxes = inst.map((p) => ({
      id: p.id,
      x: p.x,
      y: p.y,
      w: widthOf(p),
      h: PARTS[p.type].h,
      dark: p.type === 'feed' || p.type === 'feed3' || p.type === 'vfd',
    }));

    const pos = new Map<string, { x: number; y: number }>();
    for (const p of inst) {
      for (const t of termsOf(p)) pos.set(`${p.id}.${t.id}`, { x: p.x + t.x, y: p.y + t.y });
    }
    const paths = task.solution
      .map(([a, b, c]) => {
        const pa = pos.get(a);
        const pb = pos.get(b);
        if (!pa || !pb) return null;
        const mx = (pa.x + pb.x) / 2;
        const my = (pa.y + pb.y) / 2 + Math.min(26, Math.hypot(pb.x - pa.x, pb.y - pa.y) * 0.07);
        return { d: `M${pa.x},${pa.y} Q${mx},${my} ${pb.x},${pb.y}`, c: WIRE_STROKE[c] || '#666' };
      })
      .filter(Boolean) as Array<{ d: string; c: string }>;

    /* a tényleges tartalomra vágunk, hogy ne maradjon üres perem */
    const pad = 40;
    const x0 = Math.min(...boxes.map((b) => b.x)) - pad;
    const y0 = Math.min(...boxes.map((b) => b.y)) - pad;
    const x1 = Math.max(...boxes.map((b) => b.x + b.w)) + pad;
    const y1 = Math.max(...boxes.map((b) => b.y + b.h)) + pad;
    return { boxes, paths, vb: `${x0} ${y0} ${x1 - x0} ${y1 - y0}` };
  }, [task]);

  return (
    <svg viewBox={vb} className="h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden focusable="false">
      <rect width="100%" height="100%" fill="#11151c" />
      {paths.map((p, i) => (
        <path key={i} d={p.d} fill="none" stroke={p.c} strokeWidth={7} strokeLinecap="round" opacity={0.55} />
      ))}
      {boxes.map((b) => (
        <g key={b.id}>
          <rect x={b.x + 5} y={b.y + 9} width={b.w} height={b.h} rx={13} fill="#0a0d12" opacity={0.75} />
          <rect
            x={b.x}
            y={b.y}
            width={b.w}
            height={b.h}
            rx={12}
            fill={b.dark ? '#2b323c' : '#e7e5df'}
            stroke={b.dark ? '#161b22' : '#9a978e'}
            strokeWidth={3}
          />
        </g>
      ))}
    </svg>
  );
}
