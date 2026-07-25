/** Készülékkönyvtár: kereshető, szimbólummal, kapcsokkal, tipikus hibával. */
import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Panel, Tag, cx } from '../components/ui';
import { LIBRARY } from '../data/components';
import { GLOSSARY } from '../data/glossary';
import { go } from '../app/App';

export function Library() {
  const [q, setQ] = useState('');
  const [tab, setTab] = useState<'keszulekek' | 'fogalmak'>('keszulekek');

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
            {(['keszulekek', 'fogalmak'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                aria-pressed={tab === t}
                className={cx(
                  'h-8 rounded-[8px] px-3 text-[12.5px] font-semibold transition-colors',
                  tab === t ? 'bg-surface-3 text-ink' : 'text-ink-faint hover:text-ink'
                )}
              >
                {t === 'keszulekek' ? `Készülékek (${LIBRARY.length})` : `Fogalmak (${GLOSSARY.length})`}
              </button>
            ))}
          </div>
        </div>

        {tab === 'keszulekek' ? (
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
