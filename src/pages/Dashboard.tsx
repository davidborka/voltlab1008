/** Nyitóképernyő: a feladatok, mindegyik saját vektoros előnézettel. */
import { ArrowRight, CheckCircle2, Dices, ListChecks, ShieldAlert } from 'lucide-react';
import { go } from '../app/App';
import { Button, Tag, cx } from '../components/ui';
import { CATEGORY_LABELS, TASKS, TASK_ORDER } from '../data/tasks';
import { TaskThumb } from '../features/diagram/TaskThumb';
import type { TaskDef } from '../domain/electrical-types';

export function Dashboard({ done, last }: { done: string[]; last: string | null }) {
  const lastTask = last && TASKS[last] ? TASKS[last] : null;

  return (
    <div className="tech-grid flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-9 max-w-2xl">
          <div className="eyebrow mb-2">1008 · épületvillamossági és villamos berendezés szerelési gyakorlat</div>
          <h1 className="text-[28px] font-extrabold leading-[1.15] tracking-[-0.025em] sm:text-[34px]">
            Gyakorold a vizsgafeladatokat egy működő táblán.
          </h1>
          <p className="mt-3 text-[14.5px] leading-relaxed text-ink-dim">
            Minden feladathoz tartozik áttekintés, lépésenkénti vezetett megoldás, valódi bekötési
            gyakorlat és vizsgamód. A tábla ténylegesen működik: világít a lámpa, meghúz a
            mágneskapcsoló, forog a motor, zárlatnál pedig kiold a megfelelő védelem.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {lastTask && (
              <Button tone="primary" icon={ArrowRight} onClick={() => go({ name: 'task', id: lastTask.id })}>
                Folytatás: {lastTask.id} feladat
              </Button>
            )}
            <Button onClick={() => go({ name: 'task', id: 'A' })}>Kezdés az A feladattal</Button>
            <Button icon={ListChecks} onClick={() => go({ name: 'interactive' })}>
              Interaktív (KRÉTA) tesztvizsga
            </Button>
            <Button
              icon={Dices}
              onClick={() => {
                /* mint a vizsgán: feladatot húzol, és rögtön segítség nélkül csinálod */
                const id = TASK_ORDER[Math.floor(Math.random() * TASK_ORDER.length)];
                go({ name: 'task', id, exam: true });
              }}
            >
              Vizsgafeladat húzása
            </Button>
          </div>
        </div>

        <div className="mb-6 flex items-start gap-3 rounded-[12px] border border-amber/30 bg-amber/[0.07] px-4 py-3">
          <ShieldAlert size={17} className="mt-0.5 shrink-0 text-amber" />
          <p className="text-[12.5px] leading-relaxed text-ink-dim">
            <strong className="text-ink">Ez gyakorlófelület feszültségmentes vizsgatáblához.</strong> A
            szimuláció nem helyettesíti az oktatót, a szabványt és a hivatalos vizsgautasítást. Valós
            berendezésen munkát csak feszültségmentesített, biztosított állapotban, szakképzett
            felügyelettel szabad végezni.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {TASK_ORDER.map((id) => (
            <TaskCard key={id} task={TASKS[id]} done={done.includes(id)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TaskCard({ task, done }: { task: TaskDef; done: boolean }) {
  return (
    <button
      onClick={() => go({ name: 'task', id: task.id })}
      className={cx(
        'group flex flex-col overflow-hidden rounded-[14px] border border-line bg-surface-2 text-left shadow-panel',
        'transition-[transform,border-color,box-shadow] duration-200 ease-snap',
        'hover:-translate-y-0.5 hover:border-arc/45 hover:shadow-lift focus-visible:-translate-y-0.5'
      )}
    >
      <div className="relative h-[132px] overflow-hidden border-b border-line bg-[#11151c]">
        <TaskThumb task={task} />
        <span className="mono absolute left-3 top-3 grid h-8 w-8 place-items-center rounded-[9px] border border-arc/40 bg-surface/85 text-[15px] font-extrabold text-arc">
          {task.id}
        </span>
        {done && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-md border border-good/40 bg-surface/85 px-1.5 py-1 text-[10px] font-bold text-good">
            <CheckCircle2 size={12} /> KÉSZ
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div className="flex items-center gap-2">
          <Tag tone={task.category === 'motorvezerles' ? 'amber' : task.category === 'merohely' ? 'arc' : 'neutral'}>
            {CATEGORY_LABELS[task.category]}
          </Tag>
          <span className="mono ml-auto flex items-center gap-[3px] text-[10px] text-ink-faint" title={`Nehézség ${task.complexity}/5`}>
            {[1, 2, 3, 4, 5].map((n) => (
              <span
                key={n}
                className={cx('h-2.5 w-[3px] rounded-sm', n <= task.complexity ? 'bg-arc' : 'bg-line')}
              />
            ))}
          </span>
        </div>

        <h3 className="text-[15px] font-bold leading-tight tracking-[-0.01em]">{task.title}</h3>
        <p className="text-[12.5px] leading-relaxed text-ink-dim">{task.subtitle}</p>

        <ul className="mt-auto space-y-1 pt-2">
          {(task.objectivesHu || []).slice(0, 3).map((o, i) => (
            <li key={i} className="flex gap-2 text-[12px] leading-snug text-ink-faint">
              <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-arc/70" />
              <span className="line-clamp-2">{o}</span>
            </li>
          ))}
        </ul>

        <span className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-arc">
          Feladat megnyitása
          <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5" />
        </span>
      </div>
    </button>
  );
}
