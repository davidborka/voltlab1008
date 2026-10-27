/** Vizsgamód: nincs látható megoldás, opcionális időzítő, kategóriánkénti pontozás.
 *  A részletes áttekintés csak beadás után nyílik meg. */
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Flag, Play, RotateCcw, Timer } from 'lucide-react';
import { Button, Meter, Panel, SeverityMark, Tag, cx } from '../../components/ui';
import { SCORE_LABELS, type ScoreCategory, type TaskDef, type Wire } from '../../domain/electrical-types';
import { checkWiring } from '../../domain/netlist-validation';
import type { ProtocolScore } from '../measure/MeasurePanel';

export function ExamPanel({
  task,
  wires,
  measure,
  onFinish,
}: {
  task: TaskDef;
  /** a vizsga egy képernyőn: a táblán kötsz, a jegyzőkönyv itt van */
  wires: Wire[];
  measure(locked: boolean, onScore: (s: ProtocolScore) => void): ReactNode;
  onFinish(): void;
}) {
  const qs = task.exam || [];
  const [protocol, setProtocol] = useState<ProtocolScore | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [started, setStarted] = useState(false);
  const [useTimer, setUseTimer] = useState(true);
  const [left, setLeft] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  /* bekötés + mérés + kérdések: a gyakorlati vizsga ideje */
  const budget = qs.length * 60 + 30 * 60;

  useEffect(() => {
    setStarted(false);
    setAnswers({});
    setSubmitted(false);
    setProtocol(null);
  }, [task.id]);

  useEffect(() => {
    if (!started || submitted || !useTimer) return;
    const t = setInterval(() => setLeft((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(t);
  }, [started, submitted, useTimer]);

  useEffect(() => {
    if (useTimer && started && left === 0 && !submitted) setSubmitted(true);
  }, [left, started, submitted, useTimer]);

  const score = useMemo(() => {
    const byCat = new Map<ScoreCategory, { good: number; all: number }>();
    let good = 0;
    for (const q of qs) {
      const e = byCat.get(q.category) || { good: 0, all: 0 };
      e.all++;
      if (answers[q.id] === q.correct) {
        e.good++;
        good++;
      }
      byCat.set(q.category, e);
    }
    return { good, all: qs.length, byCat: [...byCat.entries()] };
  }, [answers, qs]);

  const wiring = useMemo(() => (submitted ? checkWiring(task, wires) : null), [submitted, task, wires]);
  const total = useMemo(() => {
    const w = wiring ? Math.round(wiring.score / 10) : 0;
    const p = protocol || { good: 0, all: 16 };
    return { good: score.good + w + p.good, all: score.all + 10 + p.all };
  }, [score, wiring, protocol]);

  if (!qs.length) {
    return (
      <Panel eyebrow="Vizsgamód" title="Készül">
        <p className="text-[13px] text-ink-dim">Ehhez a feladathoz még nincsenek vizsgakérdések.</p>
      </Panel>
    );
  }

  if (!started) {
    return (
      <Panel eyebrow="Vizsgamód" title="Segítség nélkül">
        <p className="text-[13.5px] leading-relaxed text-ink-dim">
          Egy képernyőn, mint a vizsgán: <strong className="text-ink">1.</strong> kösd be a
          táblát a rajz szerint, <strong className="text-ink">2.</strong> feszültségmentesen
          mérd a PE-folytonosságot és a szigetelést, <strong className="text-ink">3.</strong>{' '}
          helyezd feszültség alá, próbáld ki a kapcsolókat, mérd a hurokimpedanciát és a
          Fi-relét, <strong className="text-ink">4.</strong> töltsd ki a jegyzőkönyvet,{' '}
          <strong className="text-ink">5.</strong> válaszolj a {qs.length} kérdésre. Nincs tipp,
          az értékelés a beadás után nyílik meg.
        </p>
        <label className="mt-4 flex items-center gap-2 text-[13px]">
          <input
            type="checkbox"
            checked={useTimer}
            onChange={(e) => setUseTimer(e.target.checked)}
            className="h-4 w-4 accent-[rgb(var(--arc))]"
          />
          Időzítő ({Math.round(budget / 60)} perc)
        </label>
        <Button
          tone="primary"
          icon={Play}
          className="mt-4"
          onClick={() => {
            setStarted(true);
            setLeft(budget);
          }}
        >
          Vizsga indítása
        </Button>
      </Panel>
    );
  }

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="space-y-3">
      <Panel
        eyebrow="Vizsgamód"
        title={submitted ? 'Eredmény' : `${answeredCount} / ${qs.length} megválaszolva`}
        right={
          useTimer && !submitted ? (
            <Tag tone={left < 60 ? 'bad' : 'neutral'}>
              <Timer size={11} /> {String(Math.floor(left / 60)).padStart(2, '0')}:
              {String(left % 60).padStart(2, '0')}
            </Tag>
          ) : submitted ? (
            <Tag tone={total.good / total.all >= 0.7 ? 'good' : 'bad'}>
              {Math.round((total.good / total.all) * 100)}%
            </Tag>
          ) : null
        }
      >
        {!submitted && <Meter value={(answeredCount / qs.length) * 100} />}
        {submitted && (
          <div className="space-y-2">
            {wiring && (
              <div>
                <div className="mb-1 flex items-baseline justify-between text-[12.5px]">
                  <span className="font-semibold">Bekötés a táblán</span>
                  <span className="mono text-ink-faint">{wiring.score}%</span>
                </div>
                <Meter value={wiring.score} />
                {!wiring.ok &&
                  wiring.findings
                    .filter((f) => f.severity === 'error')
                    .slice(0, 4)
                    .map((f, i) => (
                      <p key={i} className="mt-1 text-[11.5px] text-bad">
                        {f.messageHu}
                      </p>
                    ))}
              </div>
            )}
            <div>
              <div className="mb-1 flex items-baseline justify-between text-[12.5px]">
                <span className="font-semibold">Mérés és jegyzőkönyv</span>
                <span className="mono text-ink-faint">
                  {protocol ? `${protocol.good}/${protocol.all}` : '-'}
                </span>
              </div>
              <Meter value={protocol ? (protocol.good / protocol.all) * 100 : 0} />
            </div>
            {score.byCat.map(([cat, v]) => (
              <div key={cat}>
                <div className="mb-1 flex items-baseline justify-between text-[12.5px]">
                  <span className="font-semibold">{SCORE_LABELS[cat]}</span>
                  <span className="mono text-ink-faint">
                    {v.good}/{v.all}
                  </span>
                </div>
                <Meter value={(v.good / v.all) * 100} />
              </div>
            ))}
          </div>
        )}
      </Panel>

      <div key={attempt}>{measure(submitted, setProtocol)}</div>

      <ol className="space-y-3">
        {qs.map((q, qi) => {
          const chosen = answers[q.id];
          return (
            <li key={q.id}>
              <Panel eyebrow={`${qi + 1}. kérdés · ${SCORE_LABELS[q.category]}`} title={q.promptHu}>
                <ul className="space-y-1.5">
                  {q.options.map((o, idx) => {
                    const isRight = idx === q.correct;
                    return (
                      <li key={idx}>
                        <button
                          disabled={submitted}
                          onClick={() => setAnswers({ ...answers, [q.id]: idx })}
                          className={cx(
                            'flex w-full items-start gap-2.5 rounded-[10px] border px-3 py-2 text-left text-[13px] transition-colors',
                            !submitted && chosen === idx && 'border-arc/60 bg-arc/10',
                            !submitted && chosen !== idx && 'border-line hover:border-arc/40',
                            submitted && isRight && 'border-good/50 bg-good/10',
                            submitted && chosen === idx && !isRight && 'border-bad/50 bg-bad/10',
                            submitted && !isRight && chosen !== idx && 'border-line opacity-55'
                          )}
                        >
                          <span className="mono mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border border-line text-[10px] font-bold">
                            {submitted && isRight ? '✓' : String.fromCharCode(65 + idx)}
                          </span>
                          <span>{o}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                {submitted && (
                  <div className="mt-2.5 flex gap-2 rounded-[10px] border border-line bg-surface/60 p-2.5">
                    <SeverityMark severity={chosen === q.correct ? 'info' : 'error'} />
                    <p className="text-[12.5px] leading-relaxed text-ink-dim">{q.explanationHu}</p>
                  </div>
                )}
              </Panel>
            </li>
          );
        })}
      </ol>

      {!submitted ? (
        <Button
          tone="primary"
          icon={Flag}
          className="w-full justify-center"
          onClick={() => {
            if (answeredCount < qs.length && !confirm('Nem válaszoltál minden kérdésre. Beadod így?')) return;
            setSubmitted(true);
            onFinish();
          }}
        >
          Beadás és kiértékelés
        </Button>
      ) : (
        <Button
          icon={RotateCcw}
          className="w-full justify-center"
          onClick={() => {
            setAnswers({});
            setSubmitted(false);
            setStarted(false);
            setProtocol(null);
            setAttempt((a) => a + 1);
          }}
        >
          Újra
        </Button>
      )}
    </div>
  );
}
