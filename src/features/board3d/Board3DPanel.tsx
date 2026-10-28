/** A 3D bekötés oldalpanelje: lépések és a feladat valós készülékei.
 *  Nem tölt be three.js-t - a fő csomagban marad. */
import { Panel, Tag, cx } from '../../components/ui';
import type { TaskDef, WireColor } from '../../domain/electrical-types';
import { GENERIC_PARTS, deviceOf } from '../../data/realDevices';
import { termsOf } from '../../data/parts';

const WIRE_HU: Array<[WireColor, string, string]> = [
  ['br', 'barna', '#7a4521'],
  ['bk', 'fekete', '#1c1c1c'],
  ['gr', 'szürke', '#8c9196'],
  ['bl', 'kék (N)', '#1f5fd0'],
  ['gy', 'zöld-sárga (PE)', 'repeating-linear-gradient(135deg,#3aa63f 0 6px,#f2cf1f 6px 12px)'],
];

export function Board3DPanel({ task, step, onStep }: { task: TaskDef; step: number; onStep(s: number): void }) {
  const counts = task.stepsHu.map((_, i) => (task.wireStep || []).filter((s) => s === i).length);
  return (
    <div className="space-y-3">
      <Panel
        eyebrow="3D bekötés"
        title="Lépésenként"
        right={
          <button
            onClick={() => onStep(-1)}
            aria-pressed={step < 0}
            className={cx(
              'rounded-[9px] border px-2.5 py-1 text-[12px] font-semibold',
              step < 0 ? 'border-amber/50 bg-amber/15 text-amber' : 'border-line text-ink-dim hover:text-ink'
            )}
          >
            összes
          </button>
        }
      >
        <ol className="space-y-1.5">
          {task.stepsHu.map((s, i) => (
            <li key={i}>
              <button
                onClick={() => onStep(i)}
                aria-current={step === i ? 'step' : undefined}
                className={cx(
                  'flex w-full gap-2 rounded-[10px] border px-2.5 py-2 text-left text-[12.5px] leading-snug transition-colors',
                  step === i ? 'border-amber/50 bg-amber/10 text-ink' : 'border-line text-ink-dim hover:border-arc/40 hover:text-ink'
                )}
              >
                <span className="mono mt-px w-5 flex-none font-bold text-arc">{i + 1}.</span>
                <span className="flex-1">{s}</span>
                <span className="mono flex-none text-[11px] text-ink-faint">{counts[i] ? `${counts[i]} ér` : '-'}</span>
              </button>
            </li>
          ))}
        </ol>
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 text-[11.5px] text-ink-dim">
          {WIRE_HU.map(([c, name, css]) => (
            <span key={c} className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-6 rounded-full" style={{ background: css }} />
              {name}
            </span>
          ))}
        </div>
      </Panel>

      <Panel eyebrow="A vizsgatábla készülékei" title="Mi van a táblán">
        <ul className="space-y-2 text-[12.5px]">
          {task.parts.map((p) => {
            const d = deviceOf(p);
            const labels = termsOf({ ...p, st: {} })
              .map((t) => t.t || t.id)
              .filter((x, i, a) => x && a.indexOf(x) === i);
            return (
              <li key={p.id} className="rounded-[10px] border border-line px-2.5 py-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="mono font-bold text-arc">{p.label || p.id}</span>
                  {d ? (
                    <span className="font-semibold text-ink">
                      {d.brand} {d.model}
                    </span>
                  ) : (
                    <Tag>általános</Tag>
                  )}
                </div>
                <div className="mt-0.5 text-[11.5px] text-ink-faint">
                  {d ? d.ratingsHu.slice(0, 3).join(' · ') : GENERIC_PARTS[p.type]}
                </div>
                {!!labels.length && <div className="mono mt-0.5 text-[11px] text-ink-dim">kapcsok: {labels.join(' · ')}</div>}
              </li>
            );
          })}
        </ul>
      </Panel>
    </div>
  );
}
