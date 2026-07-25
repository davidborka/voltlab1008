/** A tábla React-burka: az imperatív vezérlő egyetlen konténerben él. */
import { useEffect, useImperativeHandle, useRef, forwardRef } from 'react';
import { Maximize2, Minus, Plus, RotateCcw } from 'lucide-react';
import type { Board, SolveResult, TaskDef, Wire } from '../../domain/electrical-types';
import { BoardEngine, type BoardMode } from './boardEngine';
import { Button, Tooltip } from '../../components/ui';

export interface BoardHandle {
  engine(): BoardEngine | null;
}

interface Props {
  task: TaskDef;
  mode: BoardMode;
  wires?: Wire[];
  highlight?: string[];
  dimOthers?: boolean;
  flat?: boolean;
  onChange?(board: Board, sim: SolveResult): void;
  className?: string;
}

export const BoardView = forwardRef<BoardHandle, Props>(function BoardView(
  { task, mode, wires, highlight, dimOthers, flat, onChange, className },
  ref
) {
  const hostRef = useRef<HTMLDivElement>(null);
  const engRef = useRef<BoardEngine | null>(null);
  const cbRef = useRef(onChange);
  cbRef.current = onChange;

  useImperativeHandle(ref, () => ({ engine: () => engRef.current }), []);

  useEffect(() => {
    if (!hostRef.current) return;
    const eng = new BoardEngine(hostRef.current, {
      task,
      mode,
      onChange: (b, s) => cbRef.current?.(b, s),
    });
    engRef.current = eng;
    const ro = new ResizeObserver(() => eng.fit());
    ro.observe(hostRef.current);
    return () => {
      ro.disconnect();
      eng.destroy();
      engRef.current = null;
    };
    // szándékosan csak egyszer: a feladatváltást külön effekt kezeli
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    engRef.current?.setTask(task, wires);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task.id]);

  useEffect(() => {
    engRef.current?.setMode(mode);
  }, [mode]);

  useEffect(() => {
    engRef.current?.setHighlight(highlight || []);
  }, [highlight]);

  useEffect(() => {
    engRef.current?.setFlat(!!flat);
  }, [flat]);

  useEffect(() => {
    const host = hostRef.current?.querySelector('.ee-stage');
    host?.classList.toggle('dimmed', !!dimOthers && !!highlight?.length);
  }, [dimOthers, highlight]);

  return (
    <div className={className} style={{ position: 'relative' }}>
      <div ref={hostRef} style={{ position: 'absolute', inset: 0 }} />
      <div className="absolute bottom-3 right-3 z-10 flex flex-col gap-1.5 no-print">
        <Tooltip label="Nagyítás">
          <Button size="sm" onClick={() => engRef.current?.zoomBy(1.25)} aria-label="Nagyítás">
            <Plus size={14} />
          </Button>
        </Tooltip>
        <Tooltip label="Kicsinyítés">
          <Button size="sm" onClick={() => engRef.current?.zoomBy(1 / 1.25)} aria-label="Kicsinyítés">
            <Minus size={14} />
          </Button>
        </Tooltip>
        <Tooltip label="Teljes tábla">
          <Button size="sm" onClick={() => engRef.current?.fit()} aria-label="Teljes tábla">
            <Maximize2 size={14} />
          </Button>
        </Tooltip>
        <Tooltip label="Készülékek alaphelyzetbe">
          <Button size="sm" onClick={() => engRef.current?.resetDevices()} aria-label="Készülékek alaphelyzetbe">
            <RotateCcw size={14} />
          </Button>
        </Tooltip>
      </div>
    </div>
  );
});
