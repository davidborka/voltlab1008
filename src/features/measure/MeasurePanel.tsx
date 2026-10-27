/** Mérés és jegyzőkönyv: műszerek a táblán, kitöltendő mérési jegyzőkönyv,
 *  ellenőrzés (átírt érték, értékelés, mérési sorrend, biztonság). */
import { useEffect, useMemo, useState } from 'react';
import { ClipboardCheck, Gauge, RotateCcw, ShieldAlert, Zap, ZapOff } from 'lucide-react';
import { Button, Panel, SeverityMark, Tag, cx } from '../../components/ui';
import {
  MEASURES,
  measure,
  measurePoint,
  newScenario,
  orderErrors,
  pointName,
  type MeasureId,
  type Reading,
} from '../../domain/measurement';
import type { Board, SolveResult, TaskDef } from '../../domain/electrical-types';

type Eval = '' | 'm' | 'n' | 'na';
interface Row {
  value: string;
  ev: Eval;
}
export interface ProtocolScore {
  good: number;
  all: number;
}

/** Az első szám a szövegben, tizedesvesszővel vagy ponttal. */
const firstNum = (s: string) => {
  const m = s.replace(',', '.').match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
};
const EMPTY_ROWS = () => Object.fromEntries(MEASURES.map((m) => [m.id, { value: '', ev: '' as Eval }])) as Record<MeasureId, Row>;

export function MeasurePanel({
  task,
  getBoard,
  sim,
  powered,
  refresh,
  exam = false,
  locked = false,
  onScore,
  toast,
}: {
  task: TaskDef;
  getBoard(): Board | null;
  sim: SolveResult | null;
  powered: boolean;
  refresh(): void;
  /** vizsgában nincs magyarázat a műszer mellett */
  exam?: boolean;
  /** a vizsga beadásakor zárul és kiértékelődik */
  locked?: boolean;
  onScore?(s: ProtocolScore): void;
  toast(text: string, bad?: boolean): void;
}) {
  const [sc, setSc] = useState(() => newScenario(task));
  const [readings, setReadings] = useState<Partial<Record<MeasureId, Reading>>>({});
  const [order, setOrder] = useState<MeasureId[]>([]);
  const [safety, setSafety] = useState<string[]>([]);
  const [last, setLast] = useState<{ title: string; text: string; bad?: boolean } | null>(null);
  const [rows, setRows] = useState(EMPTY_ROWS);
  const [head, setHead] = useState({ name: '', date: new Date().toISOString().slice(0, 10) });
  const [checked, setChecked] = useState(false);

  const reset = () => {
    setSc(newScenario(task));
    setReadings({});
    setOrder([]);
    setSafety([]);
    setLast(null);
    setRows(EMPTY_ROWS());
    setChecked(false);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(reset, [task.id]);

  const run = (id: MeasureId) => {
    const b = getBoard();
    if (!b || checked) return;
    const def = MEASURES.find((m) => m.id === id)!;
    const r = measure(id, task, b, sim, sc, powered);
    if ('refused' in r) {
      if (r.safety) setSafety((s) => [...s, r.messageHu]);
      setLast({ title: def.titleHu, text: r.messageHu, bad: true });
      toast(r.messageHu, true);
      return;
    }
    refresh(); /* a Fi-próba kiold */
    setReadings((x) => ({ ...x, [id]: r }));
    if (!order.includes(id)) setOrder((o) => [...o, id]);
    setLast({ title: def.titleHu, text: r.valueHu + (!exam && r.noteHu ? ` - ${r.noteHu}` : '') });
  };

  const result = useMemo(() => {
    const perRow = MEASURES.map((m) => {
      const r = readings[m.id];
      const row = rows[m.id];
      if (!r) return { id: m.id, valueOk: false, evalOk: false, why: 'nem mérted meg' };
      const want = r.num ?? null;
      const got = firstNum(row.value);
      const valueOk =
        want === null ? row.value.trim().length > 0 : got !== null && Math.abs(got - want) <= Math.max(0.01, Math.abs(want) * 0.02);
      const truth: Eval = r.pass === null ? 'na' : r.pass ? 'm' : 'n';
      const evalOk = row.ev === truth;
      return {
        id: m.id,
        valueOk,
        evalOk,
        why: !valueOk ? `a műszer ezt mutatta: ${r.valueHu}` : !evalOk ? `helyes értékelés: ${truth === 'm' ? 'megfelel' : truth === 'n' ? 'nem felel meg' : 'nem értelmezhető'}` : '',
      };
    });
    const oe = orderErrors(order);
    const all = MEASURES.length * 2 + 2;
    const good =
      perRow.reduce((n, r) => n + (r.valueOk ? 1 : 0) + (r.evalOk ? 1 : 0), 0) +
      (oe.length ? 0 : 1) +
      (safety.length ? 0 : 1);
    return { perRow, oe, good, all };
  }, [readings, rows, order, safety]);

  const check = () => {
    setChecked(true);
    onScore?.({ good: result.good, all: result.all });
  };
  useEffect(() => {
    if (locked && !checked) check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked]);

  const pt = measurePoint(getBoard() || { parts: task.parts.map((p) => ({ ...p, st: {} })), wires: [] });
  const setRow = (id: MeasureId, patch: Partial<Row>) => setRows((r) => ({ ...r, [id]: { ...r[id], ...patch } }));

  return (
    <div className="space-y-3">
      <Panel
        eyebrow="Mérőműszerek"
        title="Mérj a táblán"
        right={<Tag tone={powered ? 'amber' : 'neutral'}>{powered ? 'feszültség alatt' : 'feszültségmentes'}</Tag>}
      >
        {!exam && (
          <p className="text-[12.5px] leading-relaxed text-ink-dim">
            Sorrend (MSZ HD 60364-6): szemrevételezés → PE-folytonosság → szigetelés, ezek
            feszültségmentesen. Utána feszültség alá helyezés → hurokimpedancia → Fi-relé →
            feszültség → működési próba. Minden vizsgahelyzet más hálózati értékeket ad.
          </p>
        )}
        <p className="mt-1 text-[12px] text-ink-faint">
          Mérési pont: {pt ? pointName(pt) : 'nincs védővezetős végpont'}
        </p>
        <div className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {MEASURES.map((m) => (
            <button
              key={m.id}
              disabled={checked}
              onClick={() => run(m.id)}
              className={cx(
                'flex items-center gap-2 rounded-[10px] border px-2.5 py-2 text-left text-[12.5px] transition-colors',
                readings[m.id] ? 'border-good/40 bg-good/[0.06]' : 'border-line hover:border-arc/40',
                checked && 'opacity-60'
              )}
            >
              {m.power === 'on' ? <Zap size={14} className="shrink-0 text-amber" /> : <ZapOff size={14} className="shrink-0 text-ink-faint" />}
              <span className="min-w-0">
                <span className="block font-semibold leading-tight">{m.titleHu}</span>
                <span className="block text-[11px] text-ink-faint">{m.instrumentHu}</span>
              </span>
            </button>
          ))}
        </div>
        {last && (
          <div
            className={cx(
              'mono mt-3 rounded-[10px] border px-3 py-2.5 text-[12.5px]',
              last.bad ? 'border-bad/40 bg-bad/[0.07] text-bad' : 'border-arc/40 bg-[#0b1a14] text-[#7dffb2]'
            )}
          >
            <div className="mb-0.5 flex items-center gap-1.5 text-[10.5px] uppercase tracking-wide opacity-75">
              <Gauge size={12} /> {last.title}
            </div>
            {last.text}
          </div>
        )}
        {!!safety.length && (
          <div className="mt-2 flex items-start gap-2 text-[12px] text-bad">
            <ShieldAlert size={14} className="mt-0.5 shrink-0" /> {safety.length} biztonsági hiba (feszültség alatti tiltott mérés).
          </div>
        )}
      </Panel>

      <Panel
        eyebrow="Mérési jegyzőkönyv"
        title={`${task.id} · ${task.title}`}
        right={checked ? <Tag tone={result.good / result.all >= 0.7 ? 'good' : 'bad'}>{result.good}/{result.all}</Tag> : null}
      >
        <div className="grid grid-cols-2 gap-2 text-[12px]">
          <label className="block">
            <span className="text-ink-faint">Név</span>
            <input
              value={head.name}
              onChange={(e) => setHead({ ...head, name: e.target.value })}
              className="mt-0.5 w-full rounded-[8px] border border-line bg-surface px-2 py-1.5"
              placeholder="vizsgázó neve"
            />
          </label>
          <label className="block">
            <span className="text-ink-faint">Dátum</span>
            <input
              type="date"
              value={head.date}
              onChange={(e) => setHead({ ...head, date: e.target.value })}
              className="mt-0.5 w-full rounded-[8px] border border-line bg-surface px-2 py-1.5"
            />
          </label>
        </div>
        <p className="mt-2 text-[11.5px] leading-relaxed text-ink-faint">
          Mérés tárgya: a szerelt tábla üzembe helyezés előtti szerelői ellenőrzése. Mérési pont:{' '}
          {pt ? pointName(pt) : '-'}. Hálózat: TN-S, 230/400 V, 50 Hz.
        </p>

        <ol className="mt-3 space-y-2">
          {MEASURES.map((m, i) => {
            const res = result.perRow[i];
            const row = rows[m.id];
            return (
              <li key={m.id} className="rounded-[10px] border border-line bg-surface/60 p-2.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[12.5px] font-semibold">
                    {i + 1}. {m.titleHu}
                  </span>
                  {checked && <SeverityMark severity={res.valueOk && res.evalOk ? 'info' : 'error'} />}
                </div>
                <div className="text-[11px] text-ink-faint">
                  {m.instrumentHu} · határérték: {m.limitHu}
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <input
                    value={row.value}
                    disabled={checked}
                    onChange={(e) => setRow(m.id, { value: e.target.value })}
                    placeholder="mért érték"
                    className="mono min-w-0 flex-1 rounded-[8px] border border-line bg-surface px-2 py-1.5 text-[12px]"
                  />
                  <select
                    value={row.ev}
                    disabled={checked}
                    onChange={(e) => setRow(m.id, { ev: e.target.value as Eval })}
                    className="rounded-[8px] border border-line bg-surface px-2 py-1.5 text-[12px]"
                  >
                    <option value="">értékelés…</option>
                    <option value="m">megfelel</option>
                    <option value="n">nem felel meg</option>
                    <option value="na">nem értelmezhető</option>
                  </select>
                </div>
                {checked && res.why && <p className="mt-1.5 text-[11.5px] text-bad">{res.why}</p>}
                {checked && readings[m.id]?.noteHu && (
                  <p className="mt-1 text-[11.5px] leading-relaxed text-ink-dim">{readings[m.id]!.noteHu}</p>
                )}
              </li>
            );
          })}
        </ol>

        {checked && (
          <div className="mt-3 space-y-1 text-[12px]">
            {result.oe.length ? (
              result.oe.map((e, i) => (
                <p key={i} className="text-bad">
                  Sorrend: {e}
                </p>
              ))
            ) : (
              <p className="text-good">A mérési sorrend helyes.</p>
            )}
            {safety.length ? (
              <p className="text-bad">Biztonság: {safety.length} tiltott mérés feszültség alatt.</p>
            ) : (
              <p className="text-good">Nem volt tiltott mérés feszültség alatt.</p>
            )}
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-1.5">
          {!locked && !checked && (
            <Button size="sm" tone="primary" icon={ClipboardCheck} onClick={check}>
              Jegyzőkönyv ellenőrzése
            </Button>
          )}
          {!locked && (
            <Button size="sm" icon={RotateCcw} onClick={reset}>
              Új vizsgahelyzet
            </Button>
          )}
        </div>
      </Panel>
    </div>
  );
}
