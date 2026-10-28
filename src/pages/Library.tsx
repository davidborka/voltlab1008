/** Készülékkönyvtár: kereshető, szimbólummal, kapcsokkal, tipikus hibával. */
import { useMemo, useState } from 'react';
import { ExternalLink, Search } from 'lucide-react';
import { Panel, Tag, cx } from '../components/ui';
import { LIBRARY } from '../data/components';
import { GLOSSARY } from '../data/glossary';
import { GENERIC_PARTS, REAL_DEVICES } from '../data/realDevices';
import { TASKS, TASK_ORDER } from '../data/tasks';
import { go } from '../app/App';

const REAL = Object.values(REAL_DEVICES);

/** Mely feladatokban szerepel a valós készülék. */
function tasksUsing(devId: string): string[] {
  return TASK_ORDER.filter((id) => TASKS[id].parts.some((p) => p.dev === devId));
}

export function Library() {
  const [q, setQ] = useState('');
  const [tab, setTab] = useState<'tabla' | 'keszulekek' | 'fogalmak'>('tabla');

  const items = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return LIBRARY;
    return LIBRARY.filter((e) =>
      [e.nameHu, e.designation, e.purposeHu, e.terminalsHu, e.behaviourHu, e.mistakeHu]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(s)
    );
  }, [q]);

  const real = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return REAL;
    return REAL.filter((d) =>
      [d.brand, d.model, d.orderCode, d.kindHu, d.terminals.map((t) => t.label + ' ' + t.meaningHu).join(' '), d.ratingsHu.join(' ')]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(s)
    );
  }, [q]);

  const terms = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return GLOSSARY;
    return GLOSSARY.filter((g) => (g.termHu + g.defHu).toLowerCase().includes(s));
  }, [q]);

  return (
    <div className="tech-grid flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6">
        <div className="eyebrow mb-2">Segédlet</div>
        <h1 className="text-[26px] font-extrabold tracking-[-0.02em]">Készülékek és fogalmak</h1>
        <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-ink-dim">
          Minden készülékhez ott a tervjel, az egyszerűsített szimbólum, a kapocsszámozás, és hogy
          melyik feladatban fordul elő. A vizsgán a leggyakoribb hibát is jelöltük.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <div className="flex h-10 flex-1 min-w-[220px] items-center gap-2 rounded-[11px] border border-line bg-surface-2 px-3">
            <Search size={15} className="text-ink-faint" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Keresés név, tervjel vagy kapocs szerint"
              aria-label="Keresés a könyvtárban"
              className="h-full flex-1 bg-transparent text-[13.5px] outline-none placeholder:text-ink-faint"
            />
          </div>
          <div className="flex gap-1 rounded-[11px] border border-line bg-surface-2 p-1">
            {(['tabla', 'keszulekek', 'fogalmak'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                aria-pressed={tab === t}
                className={cx(
                  'h-8 rounded-[8px] px-3 text-[12.5px] font-semibold transition-colors',
                  tab === t ? 'bg-surface-3 text-ink' : 'text-ink-faint hover:text-ink'
                )}
              >
                {t === 'tabla'
                  ? `A vizsgatábla (${REAL.length})`
                  : t === 'keszulekek'
                    ? `Készülékek (${LIBRARY.length})`
                    : `Fogalmak (${GLOSSARY.length})`}
              </button>
            ))}
          </div>
        </div>

        {tab === 'tabla' ? (
          <div className="mt-5 space-y-3">
            <p className="max-w-3xl text-[12.5px] leading-relaxed text-ink-dim">
              Pontosan ezek a készülékek vannak a vizsgatáblán. A jelölések a fotókról (a fotók nem
              publikusak), a méretek a gyártói adatlapokból. Ahol a kettő eltér, a fotó nyer - ezt és a nem
              olvasható jelöléseket az „Eltérések” sor mutatja. A 3D bekötés ezekből a méretekből épül.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {real.map((d) => (
                <Panel key={d.id} className="h-full">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[14px] font-bold leading-tight">
                      {d.brand} {d.model}
                    </h3>
                    {d.orderCode && <Tag tone="arc">{d.orderCode}</Tag>}
                  </div>
                  <p className="mt-1 text-[12.5px] text-ink-dim">{d.kindHu}</p>
                  <dl className="mt-3 space-y-2 text-[12.5px]">
                    <div>
                      <dt className="eyebrow">Méret</dt>
                      <dd className="mono mt-0.5 text-ink-dim">
                        {d.dimsMm.w} × {d.dimsMm.h} × {d.dimsMm.d} mm
                        {d.modules ? ` · ${d.modules} modul` : d.dimsMm.d ? ' · nem DIN-sínes' : ''}
                      </dd>
                    </div>
                    {!!d.terminals.length && (
                      <div>
                        <dt className="eyebrow">Kapcsok · {d.terminalTypeHu}</dt>
                        <dd className="mt-1 space-y-0.5">
                          {d.terminals.map((t) => (
                            <div key={t.label + t.posHu} className="flex gap-2 text-ink-dim">
                              <span className="mono w-[86px] flex-none font-bold text-arc">{t.label}</span>
                              <span>
                                {t.meaningHu} <span className="text-ink-faint">({t.posHu})</span>
                              </span>
                            </div>
                          ))}
                        </dd>
                      </div>
                    )}
                    <div>
                      <dt className="eyebrow">Adatok</dt>
                      <dd className="mt-0.5 text-ink-dim">{d.ratingsHu.join(' · ')}</dd>
                    </div>
                    {!!d.notesHu.length && (
                      <div>
                        <dt className="eyebrow">Eltérések, bizonytalanságok</dt>
                        <dd className="mt-0.5 space-y-1 rounded-md border border-amber/30 bg-amber/[0.07] px-2 py-1.5 text-ink-dim">
                          {d.notesHu.map((n) => (
                            <p key={n}>{n}</p>
                          ))}
                        </dd>
                      </div>
                    )}
                  </dl>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
                    {tasksUsing(d.id).map((t) => (
                      <button
                        key={t}
                        onClick={() => go({ name: 'task', id: t })}
                        className="mono rounded-md border border-line px-1.5 py-0.5 font-bold text-ink-dim hover:border-arc/50 hover:text-arc"
                      >
                        {t}
                      </button>
                    ))}
                    <span className="text-ink-faint">fotó: {d.photos.join(', ')}</span>
                    {d.sourceUrls.map((u) => (
                      <a
                        key={u}
                        href={u}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1 text-arc hover:underline"
                      >
                        adatlap <ExternalLink size={11} />
                      </a>
                    ))}
                    {!d.sourceUrls.length && <span className="text-amber">nincs megerősített forrás</span>}
                  </div>
                </Panel>
              ))}
            </div>
            <Panel eyebrow="Általános modellek" title="Nem a fotókon szereplő eszközök">
              <ul className="grid gap-1 text-[12.5px] text-ink-dim sm:grid-cols-2">
                {Object.entries(GENERIC_PARTS).map(([type, why]) => (
                  <li key={type}>
                    <span className="mono text-ink-faint">{type}</span> - {why.replace('nem a fotókon szereplő eszköz: ', '')}
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        ) : tab === 'keszulekek' ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((e) => (
              <Panel key={e.id} className="h-full">
                <div className="flex items-start gap-3">
                  <span
                    className="grid h-16 w-16 shrink-0 place-items-center rounded-[10px] border border-line bg-surface text-arc"
                    aria-hidden
                  >
                    <svg viewBox="0 0 80 80" className="h-12 w-12" dangerouslySetInnerHTML={{ __html: e.symbol }} />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[14px] font-bold leading-tight">{e.nameHu}</h3>
                      <Tag tone="arc">{e.designation}</Tag>
                    </div>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-ink-dim">{e.purposeHu}</p>
                  </div>
                </div>

                <dl className="mt-3 space-y-2 text-[12.5px]">
                  <div>
                    <dt className="eyebrow">Kapcsok</dt>
                    <dd className="mono mt-0.5 text-ink-dim">{e.terminalsHu}</dd>
                  </div>
                  {e.behaviourHu && (
                    <div>
                      <dt className="eyebrow">Viselkedés</dt>
                      <dd className="mt-0.5 text-ink-dim">{e.behaviourHu}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="eyebrow">Tipikus vizsgahiba</dt>
                    <dd className="mt-0.5 rounded-md border border-amber/30 bg-amber/[0.07] px-2 py-1.5 text-ink-dim">
                      {e.mistakeHu}
                    </dd>
                  </div>
                </dl>

                {!!e.appearsIn.length && (
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <span className="eyebrow">Előfordul</span>
                    {e.appearsIn.map((t) => (
                      <button
                        key={t}
                        onClick={() => go({ name: 'task', id: t })}
                        className="mono rounded-md border border-line px-1.5 py-0.5 text-[11px] font-bold text-ink-dim hover:border-arc/50 hover:text-arc"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </Panel>
            ))}
            {!items.length && (
              <p className="col-span-full py-10 text-center text-[13px] text-ink-faint">
                Nincs találat erre: „{q}”.
              </p>
            )}
          </div>
        ) : (
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {terms.map((g) => (
              <div key={g.termHu} className="rounded-[12px] border border-line bg-surface-2 p-3.5">
                <div className="text-[13.5px] font-bold">{g.termHu}</div>
                <p className="mt-1 text-[12.5px] leading-relaxed text-ink-dim">{g.defHu}</p>
              </div>
            ))}
            {!terms.length && (
              <p className="col-span-full py-10 text-center text-[13px] text-ink-faint">Nincs találat.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
