/** Ellenőrzési és mérési lista - kizárólag gyakorlási céllal. */
import { useState } from 'react';
import { Printer, ShieldAlert } from 'lucide-react';
import { Button, Panel, cx, useLocal } from '../components/ui';
import { INSPECTION } from '../data/inspection';

export function Inspection() {
  const [ticked, setTicked] = useLocal<string[]>('vl.inspection', []);
  const [open, setOpen] = useState<string | null>(INSPECTION[0]?.id ?? null);

  const toggle = (id: string) =>
    setTicked(ticked.includes(id) ? ticked.filter((x) => x !== id) : [...ticked, id]);

  const all = INSPECTION.reduce((n, s) => n + s.items.length, 0);

  return (
    <div className="tech-grid flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-[900px] px-4 py-8 sm:px-6">
        <div className="eyebrow mb-2">Gyakorlás</div>
        <h1 className="text-[26px] font-extrabold tracking-[-0.02em]">Ellenőrzés és mérés</h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-ink-dim">
          Ez a lista a vizsgára készülés sorrendjét gyakoroltatja. {ticked.length} / {all} pont
          kipipálva - a jelölés csak ebben a böngészőben tárolódik.
        </p>

        <div className="mt-4 flex items-start gap-3 rounded-[12px] border border-bad/35 bg-bad/[0.06] px-4 py-3">
          <ShieldAlert size={18} className="mt-0.5 shrink-0 text-bad" />
          <p className="text-[12.5px] leading-relaxed text-ink-dim">
            <strong className="text-ink">Ez nem mérési utasítás.</strong> Mérést csak megfelelő,
            hitelesített műszerrel szabad végezni. Ahol a vizsgálat megkívánja, a berendezést
            feszültségmentesíteni és a visszakapcsolás ellen biztosítani kell. Feszültség alatti
            mérés kizárólag szakképzett felügyelettel, az érvényes eljárás szerint történhet. Ez az
            alkalmazás nem helyettesíti az oktatót, a szabványt és a hivatalos vizsgautasítást, és
            nem közöl jogszabályi megfelelőségi határértékeket.
          </p>
        </div>

        <div className="mt-4 flex justify-end no-print">
          <Button size="sm" icon={Printer} onClick={() => window.print()}>
            Lista nyomtatása
          </Button>
        </div>

        <ol className="mt-3 space-y-2.5">
          {INSPECTION.map((s, i) => {
            const isOpen = open === s.id;
            const doneIn = s.items.filter((it) => ticked.includes(it.id)).length;
            return (
              <li key={s.id}>
                <Panel className="overflow-hidden">
                  <button
                    onClick={() => setOpen(isOpen ? null : s.id)}
                    aria-expanded={isOpen}
                    className="-m-4 mb-0 flex w-[calc(100%+2rem)] items-center gap-3 p-4 text-left"
                  >
                    <span className="mono grid h-7 w-7 shrink-0 place-items-center rounded-[8px] border border-line text-[12px] font-bold text-ink-faint">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14px] font-bold">{s.titleHu}</span>
                      <span className="block text-[12px] text-ink-faint">
                        {doneIn}/{s.items.length} pont
                      </span>
                    </span>
                    <span className={cx('text-ink-faint transition-transform', isOpen && 'rotate-90')}>›</span>
                  </button>

                  {isOpen && (
                    <div className="mt-4 space-y-3">
                      <p className="text-[13px] leading-relaxed text-ink-dim">{s.introHu}</p>
                      <ul className="space-y-1.5">
                        {s.items.map((it) => (
                          <li key={it.id}>
                            <label className="flex cursor-pointer items-start gap-2.5 rounded-[9px] border border-line px-3 py-2 hover:border-arc/40">
                              <input
                                type="checkbox"
                                checked={ticked.includes(it.id)}
                                onChange={() => toggle(it.id)}
                                className="mt-0.5 h-4 w-4 shrink-0 accent-[rgb(var(--arc))]"
                              />
                              <span className="text-[13px] leading-snug">{it.textHu}</span>
                            </label>
                          </li>
                        ))}
                      </ul>
                      <p className="rounded-[10px] border border-amber/30 bg-amber/[0.07] px-3 py-2 text-[12px] leading-relaxed text-ink-dim">
                        {s.safetyHu}
                      </p>
                    </div>
                  )}
                </Panel>
              </li>
            );
          })}
        </ol>

        <div className="print-only px-2 py-4 text-black">
          <h1 style={{ fontSize: 18, fontWeight: 800 }}>Ellenőrzési lista</h1>
          {INSPECTION.map((s, i) => (
            <div key={s.id} style={{ marginTop: 12 }}>
              <h2 style={{ fontSize: 13, fontWeight: 700 }}>
                {i + 1}. {s.titleHu}
              </h2>
              <ul style={{ fontSize: 12, lineHeight: 1.7, margin: '2px 0 0 18px' }}>
                {s.items.map((it) => (
                  <li key={it.id}>☐ {it.textHu}</li>
                ))}
              </ul>
              <p style={{ fontSize: 11, fontStyle: 'italic', marginTop: 4 }}>{s.safetyHu}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
