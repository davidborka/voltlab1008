/** Áttekintés: mit csinál a kapcsolás, miből áll, mi a gyakori hiba, és mi az,
 *  ami a rajzból önmagában nem dönthető el. */
import { useMemo, useState } from 'react';
import { AlertTriangle, Calculator, Crosshair, HelpCircle, Layers, Lightbulb } from 'lucide-react';
import { Button, Panel, Tag, cx } from '../../components/ui';
import { PARTS } from '../../data/parts';
import type { SolveResult, TaskDef } from '../../domain/electrical-types';

export function OverviewPanel({
  task,
  sim,
  onFocus,
}: {
  task: TaskDef;
  sim: SolveResult | null;
  onFocus(ids: string[], dim?: boolean): void;
}) {
  const counts = useMemo(() => {
    const m = new Map<string, { name: string; n: number; ids: string[] }>();
    for (const p of task.parts) {
      const name = PARTS[p.type]?.name || p.type;
      const e = m.get(p.type) || { name, n: 0, ids: [] };
      e.n++;
      e.ids.push(p.id);
      m.set(p.type, e);
    }
    return [...m.values()].sort((a, b) => b.n - a.n);
  }, [task]);

  const live = useMemo(() => {
    if (!sim) return [];
    return Object.keys(sim.live).filter((k) => sim.live[k]);
  }, [sim]);

  return (
    <div className="space-y-3">
      <Panel eyebrow={`${task.id} feladat`} title="Mit csinál ez a kapcsolás?">
        <p className="text-[13.5px] leading-relaxed text-ink-dim">{task.briefHu}</p>
        {!!task.objectivesHu?.length && (
          <ul className="mt-3 space-y-1.5">
            {task.objectivesHu.map((o, i) => (
              <li key={i} className="flex gap-2 text-[13px] leading-snug">
                <Lightbulb size={14} className="mt-0.5 shrink-0 text-arc" />
                <span className="text-ink-dim">{o}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel eyebrow="Energia és vezérlés útja" title="Javasolt bekötési sorrend">
        <p className="mb-3 rounded-[10px] border border-line bg-surface/60 px-3 py-2 text-[12.5px] leading-relaxed text-ink-faint">
          Ez javaslat, nem előírás. Bármilyen sorrendben köthetsz - az ellenőrzés csak a
          végeredményt nézi, és villamosan hasonlít, nem kábelenként.
        </p>
        <ol className="space-y-2">
          {task.stepsHu.map((s, i) => (
            <li key={i} className="flex gap-2.5 text-[13px] leading-relaxed">
              <span className="mono mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border border-line text-[10px] font-bold text-ink-faint">
                {i + 1}
              </span>
              <span className="text-ink-dim">{s}</span>
            </li>
          ))}
        </ol>
      </Panel>

      <Panel
        eyebrow="Készülékek"
        title="Mi kell hozzá?"
        right={<Tag>{task.parts.length} db</Tag>}
      >
        <ul className="divide-y divide-line">
          {counts.map((c) => (
            <li key={c.name} className="flex items-center gap-2 py-1.5">
              <span className="mono w-7 shrink-0 text-[12px] font-bold text-arc">{c.n}×</span>
              <span className="flex-1 text-[13px]">{c.name}</span>
              <Button size="sm" tone="ghost" icon={Crosshair} onClick={() => onFocus(c.ids)} aria-label={`${c.name} kiemelése`}>
                <span className="hidden sm:inline">Mutasd</span>
              </Button>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel eyebrow="Élő állapot" title="Mi kapcsol mit?">
        <p className="mb-2 text-[12.5px] leading-relaxed text-ink-faint">
          Kapcsold be a feszültséget, majd működtesd a kapcsolókat és a nyomógombokat a táblán. Itt
          látod, éppen mi kap feszültséget.
        </p>
        {live.length ? (
          <ul className="flex flex-wrap gap-1.5">
            {live.map((k) => (
              <li key={k}>
                <Tag tone="amber">{prettyLive(task, k)}</Tag>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-[10px] border border-dashed border-line px-3 py-4 text-center text-[12.5px] text-ink-faint">
            Most semmi nem működik. Ez üres táblánál vagy kikapcsolt feszültségnél normális.
          </div>
        )}
        {sim?.earthFault && (
          <Callout tone="bad" icon={AlertTriangle} title="Testzárlat">
            Fázis és védővezető került egy csomópontba. Valóságban ez a Fi-relét kiveri, itt is ez
            történik.
          </Callout>
        )}
        {!!sim?.shorts.size && !sim.earthFault && (
          <Callout tone="bad" icon={AlertTriangle} title="Zárlat">
            Egy csomópontban fázis és nulla, vagy két különböző fázis találkozik. Nézd meg, melyik
            védelem oldott ki.
          </Callout>
        )}
      </Panel>

      {!!task.commonMistakesHu?.length && (
        <Panel eyebrow="Vizsgán gyakori" title="Tipikus hibák">
          <ul className="space-y-2">
            {task.commonMistakesHu.map((m, i) => (
              <li key={i} className="flex gap-2 text-[13px] leading-relaxed">
                <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber" />
                <span className="text-ink-dim">{m}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {!!task.unresolved?.length && <UnresolvedPanel task={task} />}
    </div>
  );
}

function prettyLive(task: TaskDef, key: string) {
  const [pid, what] = key.split('.');
  const p = task.parts.find((q) => q.id === pid);
  const name = p?.label || pid;
  const suffix =
    what === 'coil' ? 'tekercs meghúzva' : what === 'run' ? 'forog' : what === 'on' ? 'világít' : what;
  return `${name} · ${suffix}`;
}

function Callout({
  tone,
  icon: Icon,
  title,
  children,
}: {
  tone: 'bad' | 'amber' | 'arc';
  icon: typeof AlertTriangle;
  title: string;
  children: React.ReactNode;
}) {
  const map = {
    bad: 'border-bad/35 bg-bad/[0.07] text-bad',
    amber: 'border-amber/35 bg-amber/[0.07] text-amber',
    arc: 'border-arc/35 bg-arc/[0.07] text-arc',
  };
  return (
    <div className={cx('mt-3 rounded-[10px] border px-3 py-2.5', map[tone])}>
      <div className="mb-1 flex items-center gap-1.5 text-[12px] font-bold">
        <Icon size={13} />
        {title}
      </div>
      <p className="text-[12.5px] leading-relaxed text-ink-dim">{children}</p>
    </div>
  );
}

/* ------------------------------------------------ feloldatlan értékek + kalkulátor */

const CAPACITY: Record<string, { mm2: number; a: number }[]> = {
  /* Oktatási példaértékek, NEM szabványhivatkozás. A tanuló saját feltételezését
     írja be; a program csak megmutatja, mi következne belőle. */
  'falon kívül, védőcsőben': [
    { mm2: 1.5, a: 16 },
    { mm2: 2.5, a: 21 },
    { mm2: 4, a: 28 },
    { mm2: 6, a: 36 },
  ],
  'falba süllyesztve': [
    { mm2: 1.5, a: 14 },
    { mm2: 2.5, a: 19 },
    { mm2: 4, a: 25 },
    { mm2: 6, a: 32 },
  ],
};
const BREAKERS = [6, 10, 13, 16, 20, 25, 32, 40];

function UnresolvedPanel({ task }: { task: TaskDef }) {
  const [open, setOpen] = useState(false);
  const [mm2, setMm2] = useState(1.5);
  const [method, setMethod] = useState(Object.keys(CAPACITY)[0]);

  const iz = CAPACITY[method].find((r) => r.mm2 === mm2)?.a ?? null;
  const suggestion = iz ? [...BREAKERS].reverse().find((b) => b <= iz) ?? null : null;

  return (
    <Panel
      eyebrow="A forrás nem adja meg"
      title="Feloldatlan értékek"
      right={
        <Button size="sm" tone="ghost" icon={Calculator} onClick={() => setOpen((v) => !v)}>
          {open ? 'Bezár' : 'Feltételezés'}
        </Button>
      }
    >
      <ul className="space-y-3">
        {task.unresolved!.map((u) => (
          <li key={u.id} className="rounded-[10px] border border-line bg-surface/60 p-3">
            <div className="mb-1 flex items-start gap-2">
              <HelpCircle size={14} className="mt-0.5 shrink-0 text-ink-faint" />
              <div className="min-w-0">
                <div className="text-[13px] font-semibold">{u.labelHu}</div>
                <div className="mt-1 rounded-md bg-surface-3/70 px-2 py-1 text-[12px] italic text-ink-dim">
                  A rajz alapján önmagában nem határozható meg.
                </div>
              </div>
            </div>
            <div className="mt-2 pl-6">
              <div className="eyebrow mb-1">Ehhez tudni kellene</div>
              <ul className="space-y-0.5">
                {u.missingHu.map((m, i) => (
                  <li key={i} className="flex gap-1.5 text-[12.5px] text-ink-dim">
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-ink-faint" />
                    {m}
                  </li>
                ))}
              </ul>
              {u.typicalExampleHu && (
                <p className="mt-2 text-[12px] text-ink-faint">
                  <Tag>oktatási példa</Tag> <span className="ml-1">{u.typicalExampleHu}</span>
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>

      {open && (
        <div className="mt-4 rounded-[10px] border border-arc/30 bg-arc/[0.05] p-3">
          <div className="eyebrow mb-2">Feltételezés-kalkulátor</div>
          <p className="mb-3 text-[12px] leading-relaxed text-ink-dim">
            Írd be a saját feltételezésedet. Az eredmény <strong>a te adatodból</strong> következik,
            nem a vizsgarajzból, és nem helyettesíti a hivatalos megoldókulcsot vagy az oktató
            megerősítését.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block">
              <span className="eyebrow">Keresztmetszet</span>
              <select
                value={mm2}
                onChange={(e) => setMm2(Number(e.target.value))}
                className="mt-1 h-9 w-full rounded-[9px] border border-line bg-surface px-2 text-[13px]"
              >
                {CAPACITY[method].map((r) => (
                  <option key={r.mm2} value={r.mm2}>
                    {r.mm2} mm²
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="eyebrow">Fektetési mód</span>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="mt-1 h-9 w-full rounded-[9px] border border-line bg-surface px-2 text-[13px]"
              >
                {Object.keys(CAPACITY).map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-3 space-y-1.5 text-[12.5px]">
            <Row label="Feltételezett terhelhetőség (Iz)" value={iz ? `${iz} A` : '-'} kind="assumed" />
            <Row
              label="Ebből következő kismegszakító (In ≤ Iz)"
              value={suggestion ? `B ${suggestion} A` : '-'}
              kind="assumed"
            />
            <Row label="A vizsgarajzon szereplő érték" value="nincs megadva" kind="source" />
          </div>
          <p className="mt-3 text-[11.5px] leading-relaxed text-ink-faint">
            A fenti terhelhetőségi számok oktatási példaértékek a kalkulátor működésének
            bemutatására. A tényleges méretezéshez az érvényes szabvány táblázatai, a csoportosítási
            és hőmérsékleti tényezők, valamint az oktató iránymutatása szükséges.
          </p>
        </div>
      )}
    </Panel>
  );
}

function Row({ label, value, kind }: { label: string; value: string; kind: 'assumed' | 'source' }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md bg-surface/70 px-2 py-1.5">
      <span className="text-ink-dim">{label}</span>
      <span className="flex items-center gap-1.5">
        <Tag tone={kind === 'assumed' ? 'arc' : 'neutral'}>{kind === 'assumed' ? 'feltételezésből' : 'forrásból'}</Tag>
        <span className="mono font-bold">{value}</span>
      </span>
    </div>
  );
}

export { Layers };
