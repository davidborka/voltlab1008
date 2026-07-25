/** Bekötési gyakorlat: huzallista, ellenőrzés magyarázatokkal, felfedés. */
import { useMemo, useState } from 'react';
import { CheckCircle2, Eraser, Eye, Lightbulb, Redo2, Trash2, Undo2, Wand2 } from 'lucide-react';
import { Button, Meter, Panel, SeverityMark, Tag, cx } from '../../components/ui';
import { checkWiring, revealOne, termName } from '../../domain/netlist-validation';
import type { TaskDef, Wire, WireColor } from '../../domain/electrical-types';

const COLOR_NAME: Record<WireColor, string> = {
  br: 'barna · fázis',
  bl: 'kék · nulla',
  gy: 'zöld-sárga · védőföld',
  bk: 'fekete',
  gr: 'szürke',
};
const COLOR_HEX: Record<WireColor, string> = {
  br: '#a86a3d',
  bl: '#3f82db',
  gy: '#5fb356',
  bk: '#5b6470',
  gr: '#8b95a2',
};

export function WiringPanel({
  task,
  wires,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClear,
  onRemove,
  onRevealOne,
  onRevealAll,
  onFocus,
  onSolved,
  toast,
}: {
  task: TaskDef;
  wires: Wire[];
  canUndo: boolean;
  canRedo: boolean;
  onUndo(): void;
  onRedo(): void;
  onClear(): void;
  onRemove(id: string): void;
  onRevealOne(s: [string, string, WireColor]): void;
  onRevealAll(): void;
  onFocus(ids: string[], dim?: boolean): void;
  onSolved(): void;
  toast(text: string, bad?: boolean): void;
}) {
  const [checked, setChecked] = useState(false);

  const result = useMemo(() => checkWiring(task, wires), [task, wires]);
  const total = task.solution.length;
  const connected = total - result.missing.length;

  const runCheck = () => {
    setChecked(true);
    if (result.ok) {
      onSolved();
      toast('A bekötés villamosan megegyezik a referenciamegoldással.');
    }
  };

  return (
    <div className="space-y-3">
      <Panel
        eyebrow="Bekötési gyakorlat"
        title="Húzd össze a kapcsokat"
        right={<Tag tone={result.ok ? 'good' : 'neutral'}>{connected}/{total} csomópont</Tag>}
      >
        <p className="text-[12.5px] leading-relaxed text-ink-dim">
          Húzd a kábelt az egyik sorkapocsról a másikra. Húzás közben a legközelebbi kapocs
          mágnesesen magához rántja a véget, zöld gyűrű mutatja, hova fog kötni. Kábelre koppintva
          jön a törlés és a rendező fogantyú. Billentyűzettel: Tabbal a kapcsok között, Enterrel
          kijelölés és összekötés.
        </p>
        <div className="mt-3">
          <Meter value={(connected / Math.max(1, total)) * 100} />
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <Button size="sm" tone="primary" icon={CheckCircle2} onClick={runCheck}>
            Ellenőrzés
          </Button>
          <Button size="sm" icon={Undo2} disabled={!canUndo} onClick={onUndo}>
            Vissza
          </Button>
          <Button size="sm" icon={Redo2} disabled={!canRedo} onClick={onRedo}>
            Újra
          </Button>
          <Button
            size="sm"
            icon={Lightbulb}
            onClick={() => {
              const s = revealOne(task, wires);
              if (!s) return toast('Nincs hiányzó kötés.', true);
              onRevealOne(s);
              onFocus([s[0], s[1]]);
              toast(`Felfedve: ${termName(task, s[0])} - ${termName(task, s[1])}`);
            }}
          >
            Egy kötés
          </Button>
          <Button
            size="sm"
            icon={Wand2}
            onClick={() => {
              if (wires.length && !confirm('A teljes megoldás felülírja a mostani bekötésedet. Folytatod?')) return;
              onRevealAll();
              setChecked(false);
            }}
          >
            Teljes megoldás
          </Button>
          <Button size="sm" tone="danger" icon={Eraser} onClick={() => wires.length && onClear()}>
            Törlés
          </Button>
        </div>
      </Panel>

      {checked && (
        <Panel
          eyebrow="Visszajelzés"
          title={result.ok ? 'A bekötés helyes' : `${result.missing.length} hiányzó, ${result.extra.length} felesleges`}
          right={<Tag tone={result.ok ? 'good' : result.score > 60 ? 'amber' : 'bad'}>{result.score}%</Tag>}
        >
          {result.ok ? (
            <p className="text-[13px] leading-relaxed text-good">
              Minden csomópont a helyén van. A tábla működésre kész - válts Áttekintés módba, kapcsold
              be a feszültséget, és próbáld ki.
            </p>
          ) : (
            <ul className="space-y-2">
              {result.findings.slice(0, 12).map((f, i) => (
                <li key={i} className="rounded-[10px] border border-line bg-surface/60 p-2.5">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <SeverityMark severity={f.severity} />
                    <span className="text-[12.5px] font-semibold">{f.messageHu}</span>
                    {!!f.highlightIds.length && (
                      <Button
                        size="sm"
                        tone="ghost"
                        icon={Eye}
                        className="ml-auto"
                        onClick={() => onFocus(f.highlightIds)}
                      >
                        Mutasd
                      </Button>
                    )}
                  </div>
                  <p className="text-[12.5px] leading-relaxed text-ink-dim">{f.explanationHu}</p>
                </li>
              ))}
              {result.findings.length > 12 && (
                <li className="text-[12px] text-ink-faint">… és még {result.findings.length - 12} megjegyzés.</li>
              )}
            </ul>
          )}
        </Panel>
      )}

      <Panel eyebrow="Huzallista" title={`${wires.length} kábel`}>
        {wires.length ? (
          <ul className="divide-y divide-line">
            {wires.map((w) => (
              <li key={w.id} className="flex items-center gap-2 py-1.5">
                <span
                  className="h-3 w-3 shrink-0 rounded-full border border-black/20"
                  style={{ background: COLOR_HEX[w.color] }}
                  title={COLOR_NAME[w.color]}
                />
                <span className="mono min-w-0 flex-1 truncate text-[11.5px]">
                  {termName(task, w.a)} <span className="text-ink-faint">→</span> {termName(task, w.b)}
                </span>
                <button
                  onClick={() => onFocus([w.a, w.b])}
                  className="rounded p-1 text-ink-faint hover:text-arc"
                  aria-label="Mutasd a rajzon"
                >
                  <Eye size={13} />
                </button>
                <button
                  onClick={() => onRemove(w.id)}
                  className="rounded p-1 text-ink-faint hover:text-bad"
                  aria-label="Kábel törlése"
                >
                  <Trash2 size={13} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-[10px] border border-dashed border-line px-3 py-6 text-center">
            <p className="text-[13px] font-semibold">Üres a tábla.</p>
            <p className="mt-1 text-[12.5px] text-ink-dim">
              Kezdd a betáplálásnál: fázis a védelemre, nulla és védőföld a sínekre.
            </p>
          </div>
        )}
      </Panel>

      <div className={cx('rounded-[10px] border border-line px-3 py-2.5 text-[11.5px] leading-relaxed text-ink-faint')}>
        Az ellenőrzés villamosan hasonlít: nem kábelenként, hanem csomópontonként. Ha más útvonalon
        vezetted, de ugyanabba a csomópontba, akkor is jó.
      </div>
    </div>
  );
}
