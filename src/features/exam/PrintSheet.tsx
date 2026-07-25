/** Nyomtatási összefoglaló. Csak nyomtatáskor látszik; szerver nem kell hozzá. */
import { useState } from 'react';
import { Copy } from 'lucide-react';
import { Button } from '../../components/ui';
import { checkWiring, termName } from '../../domain/netlist-validation';
import { INSPECTION } from '../../data/inspection';
import { PARTS } from '../../data/parts';
import type { TaskDef, Wire } from '../../domain/electrical-types';

export function PrintSheet({ task, wires }: { task: TaskDef; wires: Wire[] }) {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const res = checkWiring(task, wires);

  const summary = () => {
    const lines: string[] = [];
    lines.push(`VOLT LAB 1008 - ${task.id} feladat: ${task.title}`);
    if (name) lines.push(`Tanuló: ${name}`);
    if (date) lines.push(`Dátum: ${date}`);
    lines.push('');
    lines.push(`Bekötött kábelek: ${wires.length} db`);
    lines.push(`Helyes csomópontok: ${task.solution.length - res.missing.length} / ${task.solution.length}`);
    lines.push(`Eredmény: ${res.score}%`);
    lines.push('');
    if (res.missing.length) {
      lines.push('Hiányzó kötések:');
      for (const [a, b] of res.missing) lines.push(`  - ${termName(task, a)} - ${termName(task, b)}`);
      lines.push('');
    }
    if (res.extra.length) {
      lines.push('Felesleges kötések:');
      for (const [a, b, why] of res.extra) lines.push(`  - ${termName(task, a)} - ${termName(task, b)} (${why})`);
      lines.push('');
    }
    lines.push('Készüléklista:');
    for (const p of task.parts) lines.push(`  - ${p.label || p.id}: ${PARTS[p.type]?.name || p.type}`);
    lines.push('');
    lines.push('Ez gyakorlófelület feszültségmentes vizsgatáblához. Nem helyettesíti az oktatót,');
    lines.push('a szabványt és a hivatalos vizsgautasítást.');
    return lines.join('\n');
  };

  return (
    <>
      <div className="no-print border-t border-line bg-surface-2/60 px-3 py-2.5 sm:px-5">
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex-1 min-w-[140px]">
            <span className="eyebrow">Tanuló neve (csak helyben tárolódik)</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 h-9 w-full rounded-[9px] border border-line bg-surface px-2 text-[13px]"
            />
          </label>
          <label className="min-w-[130px]">
            <span className="eyebrow">Dátum</span>
            <input
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="2026-07-25"
              className="mt-1 h-9 w-full rounded-[9px] border border-line bg-surface px-2 text-[13px]"
            />
          </label>
          <Button
            size="sm"
            icon={Copy}
            onClick={() => {
              const text = summary();
              navigator.clipboard?.writeText(text).catch(() => {
                /* ha nincs vágólap-jog, legalább kijelöljük */
                const ta = document.createElement('textarea');
                ta.value = text;
                document.body.append(ta);
                ta.select();
                document.execCommand('copy');
                ta.remove();
              });
            }}
          >
            Másolható összefoglaló
          </Button>
        </div>
      </div>

      <div className="print-only px-8 py-6 text-black">
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>
          VOLT LAB 1008 · {task.id} feladat
        </h1>
        <div style={{ fontSize: 13, marginTop: 2 }}>{task.title} - {task.subtitle}</div>
        <div style={{ fontSize: 12, marginTop: 10 }}>
          Tanuló: <strong>{name || '________________________'}</strong> &nbsp;&nbsp; Dátum:{' '}
          <strong>{date || '____________'}</strong>
        </div>

        <h2 style={h2}>Bekötés eredménye</h2>
        <p style={p}>
          Bekötött kábelek: {wires.length} db. Helyes csomópontok:{' '}
          {task.solution.length - res.missing.length} / {task.solution.length}. Eredmény: {res.score}%.
        </p>
        {!!res.missing.length && (
          <>
            <h3 style={h3}>Hiányzó kötések</h3>
            <ul style={ul}>
              {res.missing.map(([a, b], i) => (
                <li key={i}>
                  {termName(task, a)} - {termName(task, b)}
                </li>
              ))}
            </ul>
          </>
        )}
        {!!res.extra.length && (
          <>
            <h3 style={h3}>Felesleges kötések</h3>
            <ul style={ul}>
              {res.extra.map(([a, b, why], i) => (
                <li key={i}>
                  {termName(task, a)} - {termName(task, b)} ({why})
                </li>
              ))}
            </ul>
          </>
        )}

        <h2 style={h2}>Készüléklista</h2>
        <ul style={ul}>
          {task.parts.map((pp) => (
            <li key={pp.id}>
              {pp.label || pp.id}: {PARTS[pp.type]?.name || pp.type}
            </li>
          ))}
        </ul>

        <div className="print-page" />

        <h2 style={h2}>Ellenőrzési lista</h2>
        {INSPECTION.map((s, i) => (
          <div key={s.id} style={{ marginBottom: 10 }}>
            <h3 style={h3}>
              {i + 1}. {s.titleHu}
            </h3>
            <ul style={ul}>
              {s.items.map((it) => (
                <li key={it.id}>☐ {it.textHu}</li>
              ))}
            </ul>
          </div>
        ))}

        <p style={{ ...p, marginTop: 16, fontStyle: 'italic' }}>
          Ez gyakorlófelület feszültségmentes vizsgatáblához. A szimuláció nem helyettesíti az
          oktatót, a szabványt és a hivatalos vizsgautasítást.
        </p>
      </div>
    </>
  );
}

const h2: React.CSSProperties = { fontSize: 14, fontWeight: 700, marginTop: 16, marginBottom: 4 };
const h3: React.CSSProperties = { fontSize: 12.5, fontWeight: 700, marginTop: 8, marginBottom: 2 };
const p: React.CSSProperties = { fontSize: 12, lineHeight: 1.6, margin: 0 };
const ul: React.CSSProperties = { fontSize: 12, lineHeight: 1.65, margin: '2px 0 0 18px', padding: 0 };
