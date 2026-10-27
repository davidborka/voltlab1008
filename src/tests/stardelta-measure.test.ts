/** Csillag-delta (H) állapotgép és a mérések. */
import { describe, expect, it } from 'vitest';
import { solve } from '../domain/netlist';
import { PARTS, TIMER_MS, motor6State } from '../data/parts';
import { TASKS } from '../data/tasks';
import { measure, newScenario, orderErrors, type Scenario } from '../domain/measurement';
import type { Board, PartInstance, Wire } from '../domain/electrical-types';

function build(id: string, drop: string[][] = []): Board {
  const t = TASKS[id];
  return {
    parts: t.parts.map((p) => ({ ...p, st: PARTS[p.type].init ? PARTS[p.type].init!() : {} }) as PartInstance),
    wires: t.solution
      .filter((s) => !drop.some((d) => d[0] === s[0] && d[1] === s[1]))
      .map((s, i) => ({ id: 'w' + i, a: s[0], b: s[1], color: s[2] })) as Wire[],
  };
}
const get = (b: Board, id: string) => b.parts.find((p) => p.id === id)!;
const SC: Scenario = { ze: 0.52, riso: 999, rcdT: 22, rcdT5: 12, u: 229.4, loosePe: null };

function start(b: Board, t0: number) {
  get(b, 'SUP').st.on = true;
  get(b, 'HK').st.on = true;
  solve(b, t0);
  get(b, 'S1').st.p = true;
  solve(b, t0);
  get(b, 'S1').st.p = false;
  return solve(b, t0 + 10);
}

describe('csillag-delta indítás', () => {
  it('csillagban indul, az idő lejártakor deltára vált, a STOP leállítja', () => {
    const b = build('H');
    const t0 = 1_000_000;
    let s = start(b, t0);
    const m = get(b, 'M');
    expect(get(b, 'K1').st.on).toBe(true);
    expect(get(b, 'K2').st.on).toBe(true);
    expect(get(b, 'K3').st.on).toBe(false);
    expect(motor6State(m, s.ctxFor(m))).toEqual({ dir: 1, mode: 'star' });

    s = solve(b, t0 + TIMER_MS + 50);
    expect(get(b, 'K2').st.on).toBe(false);
    expect(get(b, 'K3').st.on).toBe(true);
    expect(s.shorts.size).toBe(0);
    expect(motor6State(m, s.ctxFor(m))).toEqual({ dir: 1, mode: 'delta' });

    get(b, 'S0').st.p = true;
    s = solve(b, t0 + TIMER_MS + 100);
    get(b, 'S0').st.p = false;
    s = solve(b, t0 + TIMER_MS + 150);
    expect(get(b, 'K1').st.on).toBe(false);
    expect(motor6State(m, s.ctxFor(m)).mode).toBe('none');
  });

  it('a hőkioldó túlterheléskor leejti a vezérlést', () => {
    const b = build('H');
    const t0 = 5_000_000;
    start(b, t0);
    expect(get(b, 'K1').st.on).toBe(true);
    PARTS.olr.tap!(get(b, 'F3').st);
    const s = solve(b, t0 + 50);
    expect(get(b, 'K1').st.on).toBe(false);
    expect(motor6State(get(b, 'M'), s.ctxFor(get(b, 'M'))).mode).toBe('none');
  });

  it('a motorvédő lekapcsolása leállítja a motort', () => {
    const b = build('H');
    const t0 = 6_000_000;
    start(b, t0);
    PARTS.mprot.tap!(get(b, 'HK').st);
    solve(b, t0 + 50);
    expect(get(b, 'K1').st.on).toBe(false);
  });

  it('K2 és K3 soha nem húz meg egyszerre', () => {
    const b = build('H');
    const t0 = 2_000_000;
    start(b, t0);
    for (let t = 0; t < TIMER_MS + 1000; t += 97) {
      solve(b, t0 + t);
      expect(get(b, 'K2').st.on && get(b, 'K3').st.on).toBe(false);
    }
  });

  it('a rossz deltakötést hibásnak látja', () => {
    const b = build('H');
    b.wires = b.wires.map((w) => (w.a === 'K3.2' ? { ...w, b: 'M.U2' } : w.a === 'K3.4' ? { ...w, b: 'M.W2' } : w));
    const t0 = 3_000_000;
    start(b, t0);
    const s = solve(b, t0 + TIMER_MS + 50);
    const m = get(b, 'M');
    expect(motor6State(m, s.ctxFor(m)).mode).not.toBe('delta');
  });
});

describe('mérések', () => {
  it('szigetelést feszültség alatt nem enged mérni', () => {
    const b = build('A');
    const r = measure('riso', TASKS.A, b, null, SC, true);
    expect('refused' in r && r.safety).toBe(true);
  });

  it('helyes bekötésen a PE és a szigetelés megfelel', () => {
    for (const id of ['A', 'C', 'G', 'H']) {
      const b = build(id);
      const pe = measure('pe', TASKS[id], b, null, SC, false);
      const ri = measure('riso', TASKS[id], b, null, SC, false);
      expect({ id, pe: 'pass' in pe && pe.pass, ri: 'pass' in ri && ri.pass }).toEqual({ id, pe: true, ri: true });
    }
  });

  it('hiányzó PE-t szakadásnak mér', () => {
    const b = build('H', [['PB.b1', 'M.PE']]);
    const r = measure('pe', TASKS.H, b, null, SC, false);
    expect('pass' in r && r.pass).toBe(false);
  });

  it('nagy hálózati impedanciánál a hurokimpedancia nem felel meg', () => {
    const b = build('H');
    const t0 = 4_000_000;
    const s = start(b, t0);
    const ok = measure('zs', TASKS.H, b, s, SC, true);
    const bad = measure('zs', TASKS.H, b, s, { ...SC, ze: 4.9 }, true);
    expect('pass' in ok && ok.pass).toBe(true);
    expect('pass' in bad && bad.pass).toBe(false);
  });

  it('a Fi-próba lekapcsolja a Fi-relét', () => {
    const b = build('A');
    get(b, 'SUP').st.on = true;
    for (const p of b.parts) if (p.type === 'socket') p.st.plug = true;
    const s = solve(b, Date.now());
    const r = measure('rcd', TASKS.A, b, s, SC, true);
    expect('pass' in r && r.pass).toBe(true);
    expect(b.parts.find((p) => p.type === 'rcd')!.st.tripped).toBe(true);
  });

  it('a mérési sorrendet ellenőrzi', () => {
    expect(orderErrors(['pe', 'riso', 'zs', 'rcd'])).toEqual([]);
    expect(orderErrors(['zs', 'pe']).length).toBeGreaterThan(0);
  });

  it('a vizsgahelyzet determinisztikusan generálható', () => {
    let seed = 1;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    expect(newScenario(TASKS.H, rnd).ze).toBeGreaterThan(0);
  });
});
