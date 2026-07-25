/** Vezetett megoldás: kis lépések, mindegyik végén egy ellenőrző kérdés.
 *  A magyarázat csak válasz után jelenik meg. */
import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Crosshair, HelpCircle, PartyPopper } from 'lucide-react';
import { Button, Meter, Panel, SeverityMark, cx } from '../../components/ui';
import type { TaskDef } from '../../domain/electrical-types';

export function GuidedPanel({
  task,
  onFocus,
  onDone,
}: {
  task: TaskDef;
  onFocus(ids: string[], dim?: boolean): void;
  onDone(): void;
}) {
  const steps = task.guided || [];
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    setI(0);
    setAnswers({});
  }, [task.id]);

  useEffect(() => {
    setShowHint(false);
  }, [i]);

  const step = steps[i];
  const answered = step ? answers[step.id] !== undefined : false;
  const correct = step ? answers[step.id] === step.correct : false;
  const doneCount = Object.keys(answers).filter((k) => {
    const s = steps.find((q) => q.id === k);
    return s && answers[k] === s.correct;
  }).length;

  const allDone = steps.length > 0 && doneCount === steps.length;
  useEffect(() => {
    if (allDone) onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDone]);

  const progress = useMemo(() => (steps.length ? (doneCount / steps.length) * 100 : 0), [doneCount, steps.length]);

  if (!steps.length) {
    return (
      <Panel eyebrow="Vezetett megoldás" title="Készül">
        <p className="text-[13px] text-ink-dim">Ehhez a feladathoz még nincs lépésenkénti útmutató.</p>
      </Panel>
    );
  }

  return (
    <div className="space-y-3">
      <Panel
        eyebrow={`Lépés ${i + 1} / ${steps.length}`}
        title={step.titleHu}
        right={
          <div className="w-24">
            <Meter value={progress} label={`${doneCount}/${steps.length} kész`} />
          </div>
        }
      >
        <p className="text-[13.5px] leading-relaxed text-ink-dim">{step.goalHu}</p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <Button size="sm" icon={Crosshair} onClick={() => onFocus(step.focus, true)}>
            Mutasd a rajzon
          </Button>
          {!!step.focus.length && (
            <span className="mono self-center text-[10.5px] text-ink-faint">{step.focus.join(' · ')}</span>
          )}
        </div>

        <div className="mt-3 rounded-[10px] border border-line bg-surface/60 p-3">
          <div className="eyebrow mb-1.5">Mit kell végiggondolni</div>
          <p className="text-[13px] leading-relaxed text-ink-dim">{step.reasoningHu}</p>
        </div>
      </Panel>

      <Panel eyebrow="Ellenőrző kérdés" title={step.questionHu}>
        <ul className="space-y-1.5">
          {step.options.map((o, idx) => {
            const chosen = answers[step.id] === idx;
            const isRight = idx === step.correct;
            const reveal = answered;
            return (
              <li key={idx}>
                <button
                  disabled={answered}
                  onClick={() => setAnswers({ ...answers, [step.id]: idx })}
                  className={cx(
                    'flex w-full items-start gap-2.5 rounded-[10px] border px-3 py-2.5 text-left text-[13px] transition-colors',
                    !reveal && 'border-line hover:border-arc/50 hover:bg-surface-3/50',
                    reveal && isRight && 'border-good/50 bg-good/10',
                    reveal && chosen && !isRight && 'border-bad/50 bg-bad/10',
                    reveal && !isRight && !chosen && 'border-line opacity-60'
                  )}
                >
                  <span
                    className={cx(
                      'mono mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border text-[10px] font-bold',
                      reveal && isRight ? 'border-good text-good' : 'border-line text-ink-faint'
                    )}
                  >
                    {reveal && isRight ? '✓' : String.fromCharCode(65 + idx)}
                  </span>
                  <span>{o}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {!answered && (
          <div className="mt-3">
            <Button size="sm" tone="ghost" icon={HelpCircle} onClick={() => setShowHint((v) => !v)}>
              {showHint ? 'Tipp elrejtése' : 'Tipp'}
            </Button>
            {showHint && (
              <p className="mt-2 rounded-[10px] border border-amber/30 bg-amber/[0.07] px-3 py-2 text-[12.5px] leading-relaxed text-ink-dim">
                {step.hintHu}
              </p>
            )}
          </div>
        )}

        {answered && (
          <div className="mt-3 rounded-[10px] border border-line bg-surface/60 p-3">
            <div className="mb-1.5 flex items-center gap-2">
              <SeverityMark severity={correct ? 'info' : 'error'} />
              <span className="text-[12.5px] font-bold">{correct ? 'Így van' : 'Nem ez a helyes'}</span>
            </div>
            <p className="text-[13px] leading-relaxed text-ink-dim">{step.explanationHu}</p>
            {!correct && (
              <Button
                size="sm"
                tone="ghost"
                className="mt-2"
                onClick={() => {
                  const next = { ...answers };
                  delete next[step.id];
                  setAnswers(next);
                }}
              >
                Újra próbálom
              </Button>
            )}
          </div>
        )}
      </Panel>

      <div className="flex items-center justify-between gap-2">
        <Button size="sm" icon={ChevronLeft} disabled={i === 0} onClick={() => setI(i - 1)}>
          Előző
        </Button>
        <div className="mono flex gap-1">
          {steps.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setI(idx)}
              aria-label={`${idx + 1}. lépés`}
              className={cx(
                'h-2 w-5 rounded-full transition-colors',
                answers[s.id] === s.correct ? 'bg-good' : idx === i ? 'bg-arc' : 'bg-line'
              )}
            />
          ))}
        </div>
        <Button
          size="sm"
          tone={answered && correct ? 'primary' : 'default'}
          disabled={i >= steps.length - 1}
          onClick={() => setI(i + 1)}
        >
          Következő <ChevronRight size={14} />
        </Button>
      </div>

      {allDone && (
        <Panel>
          <div className="flex items-center gap-3">
            <PartyPopper size={20} className="shrink-0 text-good" />
            <div>
              <div className="text-[13.5px] font-bold">Végigmentél a feladaton.</div>
              <p className="text-[12.5px] text-ink-dim">
                Most próbáld ki a Bekötési gyakorlatot: ott már neked kell összekötnöd a kapcsokat.
              </p>
            </div>
            <Check size={18} className="ml-auto shrink-0 text-good" />
          </div>
        </Panel>
      )}
    </div>
  );
}
