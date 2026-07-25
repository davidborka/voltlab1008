/** Munkafelület: bal oldalon a tábla, jobb oldalon a tanulási panel. */
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  ArrowLeft,
  BookOpenCheck,
  Cable,
  GraduationCap,
  Image as ImageIcon,
  Layers,
  Power,
  Printer,
} from 'lucide-react';
import { go } from '../app/App';
import { Button, Tag, cx, useToast } from '../components/ui';
import { BoardView, type BoardHandle } from '../features/diagram/BoardView';
import { OverviewPanel } from '../features/simulation/OverviewPanel';
import { GuidedPanel } from '../features/guided/GuidedPanel';
import { WiringPanel } from '../features/wiring/WiringPanel';
import { ExamPanel } from '../features/exam/ExamPanel';
import { PrintSheet } from '../features/exam/PrintSheet';
import { TASKS, TASK_ORDER } from '../data/tasks';
import type { Board, SolveResult, Wire } from '../domain/electrical-types';

export type Mode = 'attekintes' | 'vezetett' | 'bekotes' | 'vizsga';

const MODES: Array<{ id: Mode; label: string; icon: typeof Layers; hint: string }> = [
  { id: 'attekintes', label: 'Áttekintés', icon: Layers, hint: 'mit csinál a kapcsolás' },
  { id: 'vezetett', label: 'Vezetett megoldás', icon: GraduationCap, hint: 'lépésről lépésre' },
  { id: 'bekotes', label: 'Bekötési gyakorlat', icon: Cable, hint: 'kösd be te' },
  { id: 'vizsga', label: 'Vizsgamód', icon: BookOpenCheck, hint: 'segítség nélkül' },
];

/* ------------------------------------------------ huzalok visszavonással */

interface WireState {
  past: Wire[][];
  now: Wire[];
  future: Wire[][];
}
type WireAction =
  | { type: 'set'; wires: Wire[] }
  | { type: 'commit'; wires: Wire[] }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'clear' };

function wireReducer(s: WireState, a: WireAction): WireState {
  switch (a.type) {
    case 'set':
      return { past: [], now: a.wires, future: [] };
    case 'commit':
      if (JSON.stringify(a.wires) === JSON.stringify(s.now)) return s;
      return { past: [...s.past, s.now].slice(-50), now: a.wires, future: [] };
    case 'undo':
      if (!s.past.length) return s;
      return { past: s.past.slice(0, -1), now: s.past[s.past.length - 1], future: [s.now, ...s.future] };
    case 'redo':
      if (!s.future.length) return s;
      return { past: [...s.past, s.now], now: s.future[0], future: s.future.slice(1) };
    case 'clear':
      return { past: [...s.past, s.now].slice(-50), now: [], future: [] };
  }
}

/* ------------------------------------------------------------ munkafelület */

export function Workspace({
  taskId,
  onComplete,
  completed,
}: {
  taskId: string;
  onComplete(id: string): void;
  completed: boolean;
}) {
  const task = TASKS[taskId];
  const [mode, setMode] = useState<Mode>('attekintes');
  const [mobileTab, setMobileTab] = useState<'rajz' | 'segedlet'>('segedlet');
  const [highlight, setHighlight] = useState<string[]>([]);
  const [dim, setDim] = useState(false);
  const [flat, setFlat] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const [sim, setSim] = useState<SolveResult | null>(null);
  const [powered, setPowered] = useState(false);
  const [wires, dispatch] = useReducer(wireReducer, { past: [], now: [], future: [] });
  const boardRef = useRef<BoardHandle>(null);
  const { toast, node: toastNode } = useToast();

  const boardMode = mode === 'bekotes' ? 'wire' : 'run';

  /* feladatváltáskor tiszta lap */
  useEffect(() => {
    dispatch({ type: 'set', wires: [] });
    setHighlight([]);
    setMode('attekintes');
    setPowered(false);
  }, [taskId]);

  /* a tábla állapotváltozásai vissza a Reactbe */
  const onBoardChange = useCallback((b: Board, s: SolveResult) => {
    setSim(s);
    setPowered(b.parts.some((p) => p.st.on && (p.type === 'feed' || p.type === 'feed3')));
    dispatch({ type: 'commit', wires: b.wires.map((w) => ({ ...w })) });
  }, []);

  const eng = () => boardRef.current?.engine() || null;

  /* visszavonás/újra a táblára is átvezetve */
  const applyHistory = (act: WireAction) => {
    dispatch(act);
  };
  useEffect(() => {
    const e = eng();
    if (!e) return;
    if (JSON.stringify(e.board.wires) !== JSON.stringify(wires.now)) e.setWires(wires.now);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wires.now]);

  const focusOn = useCallback((ids: string[], dimOthers = true) => {
    setHighlight(ids);
    setDim(dimOthers);
    setMobileTab('rajz');
  }, []);

  const modeNode = useMemo(() => {
    switch (mode) {
      case 'attekintes':
        return <OverviewPanel task={task} sim={sim} onFocus={focusOn} />;
      case 'vezetett':
        return <GuidedPanel task={task} onFocus={focusOn} onDone={() => onComplete(task.id)} />;
      case 'bekotes':
        return (
          <WiringPanel
            task={task}
            wires={wires.now}
            canUndo={wires.past.length > 0}
            canRedo={wires.future.length > 0}
            onUndo={() => applyHistory({ type: 'undo' })}
            onRedo={() => applyHistory({ type: 'redo' })}
            onClear={() => eng()?.clearWires()}
            onRemove={(id) => eng()?.removeWire(id)}
            onRevealOne={(s) => eng()?.addWire(s[0], s[1], s[2])}
            onRevealAll={() => {
              /* A bekötés önmagában halottnak látszik: adjunk rá feszültséget és
                 váltsunk üzemeltethető módba, hogy azonnal ki lehessen próbálni. */
              eng()?.applySolution();
              setMode('attekintes');
              setMobileTab('rajz');
              toast('Referenciamegoldás bekötve. A tábla feszültség alatt - működtesd a kapcsolókat.');
            }}
            onFocus={focusOn}
            onSolved={() => onComplete(task.id)}
            toast={toast}
          />
        );
      case 'vizsga':
        return <ExamPanel task={task} onFinish={() => onComplete(task.id)} />;
    }
  }, [mode, task, sim, wires, focusOn, onComplete, toast]);

  const idx = TASK_ORDER.indexOf(taskId as (typeof TASK_ORDER)[number]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* fejléc sáv */}
      <div className="flex flex-none flex-wrap items-center gap-2 border-b border-line bg-surface-2/70 px-3 py-2 no-print sm:px-5">
        <Button size="sm" tone="ghost" icon={ArrowLeft} onClick={() => go({ name: 'dashboard' })}>
          <span className="hidden sm:inline">Feladatok</span>
        </Button>

        <div className="mono flex items-center gap-1 rounded-[10px] border border-line bg-surface p-0.5">
          {TASK_ORDER.map((id) => (
            <button
              key={id}
              onClick={() => go({ name: 'task', id })}
              aria-current={id === taskId ? 'page' : undefined}
              className={cx(
                'h-7 w-7 rounded-[7px] text-[12px] font-bold transition-colors',
                id === taskId ? 'bg-arc/20 text-arc' : 'text-ink-faint hover:text-ink'
              )}
            >
              {id}
            </button>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-bold leading-tight">{task.title}</div>
          <div className="truncate text-[11px] text-ink-faint">{task.subtitle}</div>
        </div>

        {completed && <Tag tone="good">teljesítve</Tag>}
        <Tag tone={sim?.shorts.size || sim?.earthFault ? 'bad' : powered ? 'amber' : 'neutral'}>
          {sim?.earthFault ? 'testzárlat' : sim?.shorts.size ? 'zárlat' : powered ? 'feszültség alatt' : 'feszültségmentes'}
        </Tag>

        <Button size="sm" icon={Power} tone={powered ? 'live' : 'default'} onClick={() => eng()?.togglePower()}>
          <span className="hidden lg:inline">{powered ? 'Feszültség ki' : 'Feszültség be'}</span>
        </Button>
        {task.sourcePreview && (
          <Button size="sm" icon={ImageIcon} onClick={() => setShowSource((v) => !v)}>
            <span className="hidden lg:inline">Eredeti</span>
          </Button>
        )}
        <Button size="sm" icon={Layers} onClick={() => setFlat((v) => !v)} aria-pressed={flat}>
          <span className="hidden lg:inline">{flat ? '3D' : 'Lapos'}</span>
        </Button>
        <Button size="sm" icon={Printer} onClick={() => window.print()}>
          <span className="hidden lg:inline">Nyomtatás</span>
        </Button>
      </div>

      {/* módváltó */}
      <div className="flex flex-none gap-1 overflow-x-auto border-b border-line bg-surface px-3 py-2 no-print sm:px-5">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => {
              setMode(m.id);
              setHighlight([]);
              setDim(false);
              setMobileTab(m.id === 'attekintes' ? 'segedlet' : 'segedlet');
            }}
            aria-pressed={mode === m.id}
            className={cx(
              'group inline-flex flex-none items-center gap-2 rounded-[10px] border px-3 py-1.5 text-left transition-colors',
              mode === m.id ? 'border-arc/45 bg-arc/10' : 'border-transparent hover:bg-surface-3/60'
            )}
          >
            <m.icon size={15} className={mode === m.id ? 'text-arc' : 'text-ink-faint'} />
            <span className="leading-tight">
              <span className={cx('block text-[12.5px] font-semibold', mode === m.id ? 'text-arc' : 'text-ink')}>
                {m.label}
              </span>
              <span className="hidden text-[10.5px] text-ink-faint sm:block">{m.hint}</span>
            </span>
          </button>
        ))}
      </div>

      {/* mobil fülek */}
      <div className="flex flex-none gap-1 border-b border-line bg-surface px-3 py-1.5 no-print lg:hidden">
        {(['rajz', 'segedlet'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setMobileTab(t)}
            aria-pressed={mobileTab === t}
            className={cx(
              'flex-1 rounded-[9px] px-3 py-2 text-[12.5px] font-semibold transition-colors',
              mobileTab === t ? 'bg-surface-3 text-ink' : 'text-ink-faint'
            )}
          >
            {t === 'rajz' ? 'Rajz' : 'Segédlet'}
          </button>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[minmax(0,1fr)_min(460px,38%)]">
        <div
          className={cx(
            'relative min-h-[52vh] overflow-hidden border-line p-3 lg:min-h-0 lg:border-r',
            mobileTab === 'rajz' ? 'block' : 'hidden lg:block'
          )}
        >
          <BoardView
            ref={boardRef}
            task={task}
            mode={boardMode}
            highlight={highlight}
            dimOthers={dim}
            flat={flat}
            onChange={onBoardChange}
            className="h-full w-full"
          />
          {showSource && task.sourcePreview && (
            <div className="absolute inset-3 z-20 overflow-auto rounded-[14px] border border-line bg-surface-2 p-3 no-print">
              <div className="mb-2 flex items-center justify-between">
                <div className="eyebrow">Eredeti feladatlap · {task.id}</div>
                <Button size="sm" tone="ghost" onClick={() => setShowSource(false)}>
                  Bezár
                </Button>
              </div>
              <img
                src={`${import.meta.env.BASE_URL}source-previews/${task.sourcePreview}`}
                alt={`A ${task.id} feladat eredeti kapcsolási rajza`}
                className="w-full rounded-[10px] bg-white"
                loading="lazy"
              />
            </div>
          )}
        </div>

        <aside
          className={cx(
            'min-h-0 overflow-y-auto bg-surface p-3 sm:p-4',
            mobileTab === 'segedlet' ? 'block' : 'hidden lg:block'
          )}
        >
          {modeNode}
          <div className="mt-4 flex items-center justify-between gap-2 no-print">
            <Button
              size="sm"
              tone="ghost"
              disabled={idx <= 0}
              onClick={() => go({ name: 'task', id: TASK_ORDER[idx - 1] })}
            >
              Előző feladat
            </Button>
            <Button
              size="sm"
              tone="ghost"
              disabled={idx >= TASK_ORDER.length - 1}
              onClick={() => go({ name: 'task', id: TASK_ORDER[idx + 1] })}
            >
              Következő feladat
            </Button>
          </div>
        </aside>
      </div>

      <PrintSheet task={task} wires={wires.now} />
      {toastNode}
    </div>
  );
}
