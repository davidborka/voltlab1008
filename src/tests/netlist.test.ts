/** A szimulációs motor és a bekötés-ellenőrző tesztjei. */
import { describe, expect, it } from 'vitest';
import { hasPhase, phaseOf, solve } from '../domain/netlist';
import { checkWiring, revealOne } from '../domain/netlist-validation';
import { PARTS, termsOf } from '../data/parts';
import { TASKS, TASK_ORDER } from '../data/tasks';
import type { Board, PartInstance, Rail, TaskDef, Wire } from '../domain/electrical-types';

function build(id: string, wires?: Array<[string, string]>): Board {
  const t = TASKS[id];
  return {
    parts: t.parts.map((p) => ({ ...p, st: PARTS[p.type].init ? PARTS[p.type].init!() : {} }) as PartInstance),
    wires: (wires ?? t.solution.map((s) => [s[0], s[1]] as [string, string])).map((w, i) => ({
      id: 'w' + i,
      a: w[0],
      b: w[1],
      color: 'br',
    })) as Wire[],
  };
}
const get = (b: Board, id: string) => b.parts.find((p) => p.id === id)!;
const run = (b: Board) => solve(b, Date.now());
const lit = (s: ReturnType<typeof solve>, k: string) => !!s.live[k];
const dir = (b: Board, s: ReturnType<typeof solve>, id = 'M') => {
  const m = get(b, id);
  return PARTS[m.type].run!(m, s.ctxFor(m));
};

/* ------------------------------------------------------------- adatépség */

describe('feladatadatok', () => {
  it('minden megoldás-kapocs létezik', () => {
    for (const id of TASK_ORDER) {
      const t: TaskDef = TASKS[id];
      const known = new Set<string>();
      for (const p of t.parts) {
        for (const term of termsOf({ ...p, st: {} } as PartInstance)) known.add(`${p.id}.${term.id}`);
      }
      const missing = t.solution.flatMap(([a, b]) => [a, b]).filter((k) => !known.has(k));
      expect({ id, missing }).toEqual({ id, missing: [] });
    }
  });

  it('nincs két alkatrész ugyanazzal az azonosítóval', () => {
    for (const id of TASK_ORDER) {
      const ids = TASKS[id].parts.map((p) => p.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('minden feladatnak van vezetett és vizsga tartalma', () => {
    for (const id of TASK_ORDER) {
      expect(TASKS[id].guided?.length, `${id} vezetett`).toBeGreaterThan(0);
      expect(TASKS[id].exam?.length, `${id} vizsga`).toBeGreaterThan(0);
    }
  });

  it('a helyes válasz indexe létező opcióra mutat', () => {
    for (const id of TASK_ORDER) {
      for (const s of TASKS[id].guided || []) {
        expect(s.correct, `${id}/${s.id}`).toBeGreaterThanOrEqual(0);
        expect(s.correct, `${id}/${s.id}`).toBeLessThan(s.options.length);
      }
      for (const q of TASKS[id].exam || []) {
        expect(q.correct, `${id}/${q.id}`).toBeGreaterThanOrEqual(0);
        expect(q.correct, `${id}/${q.id}`).toBeLessThan(q.options.length);
      }
    }
  });

  it('az A és B feladat feloldatlan értékei jelölve maradnak', () => {
    for (const id of ['A', 'B']) {
      const u = TASKS[id].unresolved || [];
      expect(u.length, `${id} feloldatlan`).toBeGreaterThan(0);
      for (const v of u) expect(v.missingHu.length).toBeGreaterThan(0);
    }
  });
});

/* ----------------------------------------------------- A: világítás, zárlat */

describe('A feladat', () => {
  it('feszültségmentesen semmi nem világít', () => {
    const b = build('A');
    const s = run(b);
    expect(lit(s, 'E1.on')).toBe(false);
    expect(lit(s, 'E2.on')).toBe(false);
  });

  it('a lépcsőházi automatát mindhárom helyről el lehet indítani', () => {
    for (const trigger of ['S1', 'S2', 'K1']) {
      const b = build('A');
      get(b, 'SUP').st.on = true;
      if (trigger === 'K1') get(b, 'K1').st.on = true;
      else get(b, trigger).st.p = true;
      const s = run(b);
      expect(lit(s, 'E1.on'), trigger).toBe(true);
    }
  });

  it('az automata lejárta után elalszik a lámpa', () => {
    const b = build('A');
    get(b, 'SUP').st.on = true;
    get(b, 'S1').st.p = true;
    run(b);
    get(b, 'S1').st.p = false;
    get(b, 'LA').st.until = 0;
    expect(lit(run(b), 'E1.on')).toBe(false);
  });

  it('a váltókapcsolás mindkét helyről kapcsol', () => {
    const b = build('A');
    get(b, 'SUP').st.on = true;
    expect(lit(run(b), 'E2.on')).toBe(true);
    get(b, 'K3').st.pos = 1;
    expect(lit(run(b), 'E2.on')).toBe(false);
    get(b, 'K2').st.pos = 1;
    expect(lit(run(b), 'E2.on')).toBe(true);
  });

  it('fázis-nulla zárlat szelektíven old ki', () => {
    const b = build('A');
    get(b, 'SUP').st.on = true;
    b.wires.push({ id: 'zz', a: 'F3.2', b: 'NB.b5', color: 'bk' });
    run(b);
    expect(get(b, 'F3').st.tripped).toBe(true);
    expect(get(b, 'F1').st.tripped).toBeFalsy();
    expect(get(b, 'F2').st.tripped).toBeFalsy();
  });

  it('fázis a védővezetőn kiveri a Fi-relét', () => {
    const b = build('A');
    get(b, 'SUP').st.on = true;
    b.wires.push({ id: 'ee', a: 'F2.2', b: 'PB.b3', color: 'bk' });
    run(b);
    expect(get(b, 'FI').st.tripped).toBe(true);
  });
});

/* ------------------------------------------------- B: keresztkapcsolás */

describe('B feladat', () => {
  it('a keresztkapcsolás mindhárom helyről működik', () => {
    const b = build('B');
    get(b, 'SUP').st.on = true;
    expect(lit(run(b), 'E2.on')).toBe(true);
    get(b, 'K2').st.pos = 1;
    expect(lit(run(b), 'E2.on')).toBe(false);
    get(b, 'K1').st.pos = 1;
    expect(lit(run(b), 'E2.on')).toBe(true);
    get(b, 'K3').st.pos = 1;
    expect(lit(run(b), 'E2.on')).toBe(false);
  });
});

/* ------------------------------------------------------ C: öntartás */

describe('C feladat állapotátmenetei', () => {
  it('motorvédő nélkül nincs vezérlés', () => {
    const b = build('C');
    get(b, 'SUP').st.on = true;
    expect(lit(run(b), 'K1.coil')).toBe(false);
  });

  it('indítás, öntartás, leállítás', () => {
    const b = build('C');
    get(b, 'SUP').st.on = true;
    get(b, 'HK').st.on = true;
    let s = run(b);
    expect(lit(s, 'P.on'), 'álló jelzés').toBe(true);
    expect(dir(b, s)).toBe(0);

    get(b, 'S2').st.p = true;
    s = run(b);
    expect(lit(s, 'K1.coil')).toBe(true);
    expect(dir(b, s)).toBe(1);
    expect(lit(s, 'Z.on')).toBe(true);
    expect(lit(s, 'P.on')).toBe(false);

    get(b, 'S2').st.p = false;
    s = run(b);
    expect(lit(s, 'K1.coil'), 'öntartás').toBe(true);

    get(b, 'S1').st.p = true;
    s = run(b);
    expect(lit(s, 'K1.coil')).toBe(false);
    get(b, 'S1').st.p = false;
    expect(lit(run(b), 'K1.coil'), 'nem indul újra magától').toBe(false);
  });

  it('mindkét indító és mindkét leállító gomb működik', () => {
    const b = build('C');
    get(b, 'SUP').st.on = true;
    get(b, 'HK').st.on = true;
    get(b, 'S4').st.p = true;
    expect(lit(run(b), 'K1.coil')).toBe(true);
    get(b, 'S4').st.p = false;
    get(b, 'S3').st.p = true;
    expect(lit(run(b), 'K1.coil')).toBe(false);
  });

  it('motorvédő kioldása leállítja a motort', () => {
    const b = build('C');
    get(b, 'SUP').st.on = true;
    get(b, 'HK').st.on = true;
    get(b, 'S2').st.p = true;
    run(b);
    get(b, 'S2').st.p = false;
    get(b, 'HK').st.on = false;
    const s = run(b);
    expect(lit(s, 'K1.coil')).toBe(false);
    expect(dir(b, s)).toBe(0);
  });

  it('az öntartó ág hiánya felismerhető', () => {
    const t = TASKS.C;
    const without = t.solution
      .filter(([a, b]) => !(a === 'K1.14' && b === 'K1.A1') && !(a === 'S3.2' && b === 'K1.13'))
      .map((s) => ({ id: s[0], a: s[0], b: s[1], color: s[2] })) as Wire[];
    const r = checkWiring(t, without);
    expect(r.findings.some((f) => f.messageHu.includes('öntartó'))).toBe(true);
  });

  it('a leállító ág hiánya felismerhető', () => {
    const t = TASKS.C;
    const without = t.solution
      .filter(([a, b]) => !a.startsWith('S1.') && !b.startsWith('S1.'))
      .map((s) => ({ id: s[0], a: s[0], b: s[1], color: s[2] })) as Wire[];
    const r = checkWiring(t, without);
    expect(r.findings.some((f) => f.messageHu.includes('leállító'))).toBe(true);
  });
});

/* ------------------------------------------------ D: irányváltás, retesz */

describe('D feladat állapotátmenetei és reteszelése', () => {
  it('a két irány kizárja egymást', () => {
    const b = build('D');
    get(b, 'SUP').st.on = true;
    get(b, 'HK').st.on = true;
    let s = run(b);
    expect(lit(s, 'P.on')).toBe(true);

    get(b, 'S2').st.p = true;
    s = run(b);
    get(b, 'S2').st.p = false;
    s = run(b);
    expect(lit(s, 'K1.coil')).toBe(true);
    expect(dir(b, s)).toBe(1);
    expect(lit(s, 'Z1.on')).toBe(true);
    expect(lit(s, 'Z2.on')).toBe(false);

    get(b, 'S3').st.p = true;
    s = run(b);
    expect(lit(s, 'K2.coil'), 'retesz alatt nem húzhat meg').toBe(false);
    expect(s.shorts.size, 'retesz alatt nincs zárlat').toBe(0);
    get(b, 'S3').st.p = false;

    get(b, 'S1').st.p = true;
    s = run(b);
    get(b, 'S1').st.p = false;
    s = run(b);
    expect(lit(s, 'K1.coil')).toBe(false);

    get(b, 'S3').st.p = true;
    s = run(b);
    get(b, 'S3').st.p = false;
    s = run(b);
    expect(lit(s, 'K2.coil')).toBe(true);
    expect(dir(b, s), 'ellenkező forgásirány').toBe(-1);
    expect(lit(s, 'Z2.on')).toBe(true);
  });

  it('K1 és K2 sosem lehet egyszerre meghúzva helyes reteszeléssel', () => {
    const b = build('D');
    get(b, 'SUP').st.on = true;
    get(b, 'HK').st.on = true;
    get(b, 'S2').st.p = true;
    get(b, 'S3').st.p = true;
    const s = run(b);
    expect(lit(s, 'K1.coil') && lit(s, 'K2.coil')).toBe(false);
  });

  it('reteszelés nélkül a két kapcsoló zárlatot okoz', () => {
    const t = TASKS.D;
    const wires = t.solution
      .filter(([a, b]) => !(a === 'K2.82' && b === 'K1.A1') && !(a === 'K1.82' && b === 'K2.A1'))
      .map((s, i) => ({ id: 'w' + i, a: s[0], b: s[1], color: s[2] })) as Wire[];
    wires.push(
      { id: 'x1', a: 'K1.14', b: 'K1.A1', color: 'br' },
      { id: 'x2', a: 'K2.14', b: 'K2.A1', color: 'br' },
      { id: 'x3', a: 'S2.4', b: 'K1.A1', color: 'br' },
      { id: 'x4', a: 'S3.4', b: 'K2.A1', color: 'br' }
    );
    const b: Board = {
      parts: t.parts.map((p) => ({ ...p, st: PARTS[p.type].init ? PARTS[p.type].init!() : {} }) as PartInstance),
      wires,
    };
    get(b, 'SUP').st.on = true;
    get(b, 'HK').st.on = true;
    get(b, 'S2').st.p = true;
    get(b, 'S3').st.p = true;
    const s = run(b);
    expect(s.shorts.size > 0 || get(b, 'F1').st.tripped).toBeTruthy();
  });

  it('a hiányzó reteszelést az ellenőrző jelzi', () => {
    const t = TASKS.D;
    const wires = t.solution
      .filter(([a, b]) => !a.startsWith('K1.8') && !b.startsWith('K1.8') && !a.startsWith('K2.8') && !b.startsWith('K2.8'))
      .map((s, i) => ({ id: 'w' + i, a: s[0], b: s[1], color: s[2] })) as Wire[];
    const r = checkWiring(t, wires);
    expect(r.findings.some((f) => f.messageHu.includes('reteszelés'))).toBe(true);
  });
});

/* --------------------------------------------------- E, F, G */

describe('E feladat', () => {
  it('egyfázisú motor indul, tart és leáll', () => {
    const b = build('E');
    get(b, 'SUP').st.on = true;
    get(b, 'HK').st.on = true;
    expect(lit(run(b), 'P.on')).toBe(true);
    get(b, 'S2').st.p = true;
    let s = run(b);
    expect(lit(s, 'M.run')).toBe(true);
    expect(lit(s, 'Z.on')).toBe(true);
    get(b, 'S2').st.p = false;
    expect(lit(run(b), 'M.run')).toBe(true);
    get(b, 'S1').st.p = true;
    s = run(b);
    expect(lit(s, 'M.run')).toBe(false);
  });

  it('a motor nullája nélkül nem forog', () => {
    const t = TASKS.E;
    const wires = t.solution
      .filter(([a, b]) => !(a === 'NB.b1' && b === 'M.U2'))
      .map((s, i) => ({ id: 'w' + i, a: s[0], b: s[1], color: s[2] })) as Wire[];
    const b: Board = {
      parts: t.parts.map((p) => ({ ...p, st: PARTS[p.type].init ? PARTS[p.type].init!() : {} }) as PartInstance),
      wires,
    };
    get(b, 'SUP').st.on = true;
    get(b, 'HK').st.on = true;
    get(b, 'S2').st.p = true;
    expect(lit(run(b), 'M.run')).toBe(false);
  });
});

describe('F és G mérőhely', () => {
  it('F: a mérő mindhárom fázist és a nullát átengedi', () => {
    const b = build('F');
    get(b, 'SUP').st.on = true;
    get(b, 'FK').st.on = true;
    const s = run(b);
    const m = get(b, 'KWH');
    const c = s.ctxFor(m);
    expect(['3', '6', '9'].map((t) => phaseOf(c.rails(t) as ReadonlySet<Rail>))).toEqual(['L1', 'L2', 'L3']);
    expect(c.rails('11').has('N')).toBe(true);
    expect(lit(s, 'E1.on') && lit(s, 'E2.on')).toBe(true);
  });

  it('F: a fogyasztói nulla a Fi mögül jön', () => {
    const b = build('F');
    get(b, 'SUP').st.on = true;
    get(b, 'FK').st.on = true;
    get(b, 'FI').st.on = false;
    const s = run(b);
    expect(lit(s, 'E1.on') || lit(s, 'E2.on')).toBe(false);
  });

  it('G: a mérő nullája nélkül nincs fogyasztói nulla', () => {
    const t = TASKS.G;
    const wires = t.solution
      .filter(([a, b]) => !(a === 'NB0.b1' && b === 'KWH.3'))
      .map((s, i) => ({ id: 'w' + i, a: s[0], b: s[1], color: s[2] })) as Wire[];
    const b: Board = {
      parts: t.parts.map((p) => ({ ...p, st: PARTS[p.type].init ? PARTS[p.type].init!() : {} }) as PartInstance),
      wires,
    };
    get(b, 'SUP').st.on = true;
    expect(lit(run(b), 'E1.on')).toBe(false);
  });
});

/* ------------------------------------------------ ellenőrző függvény */

describe('bekötés-ellenőrzés', () => {
  it('a teljes megoldás hibátlan', () => {
    for (const id of TASK_ORDER) {
      const t = TASKS[id];
      const w = t.solution.map((s, i) => ({ id: 'w' + i, a: s[0], b: s[1], color: s[2] })) as Wire[];
      const r = checkWiring(t, w);
      expect({ id, ok: r.ok, missing: r.missing.length, extra: r.extra.length }).toEqual({
        id,
        ok: true,
        missing: 0,
        extra: 0,
      });
    }
  });

  it('hiányzó kötést jelez', () => {
    const t = TASKS.A;
    const w = t.solution.slice(0, -3).map((s, i) => ({ id: 'w' + i, a: s[0], b: s[1], color: s[2] })) as Wire[];
    const r = checkWiring(t, w);
    expect(r.ok).toBe(false);
    expect(r.missing.length).toBe(3);
  });

  it('kettős kábelt jelez', () => {
    const t = TASKS.A;
    const w = t.solution.map((s, i) => ({ id: 'w' + i, a: s[0], b: s[1], color: s[2] })) as Wire[];
    w.push({ id: 'dup', a: t.solution[0][0], b: t.solution[0][1], color: 'br' });
    const r = checkWiring(t, w);
    expect(r.findings.some((f) => f.messageHu.startsWith('Kettős'))).toBe(true);
  });

  it('érvénytelen kapcsot felesleges kötésként jelöl', () => {
    const t = TASKS.A;
    const w = t.solution.map((s, i) => ({ id: 'w' + i, a: s[0], b: s[1], color: s[2] })) as Wire[];
    w.push({ id: 'x', a: 'F1.2', b: 'E2.2', color: 'bk' });
    const r = checkWiring(t, w);
    expect(r.extra.length).toBe(1);
  });

  it('a más útvonalon vezetett, de azonos csomópontú kötést elfogadja', () => {
    const t = TASKS.A;
    /* F1.1, F2.1 és F3.1 egy csomópont: kössük másképp ugyanoda */
    const w = t.solution
      .filter(([a, b]) => !(a === 'F2.1' && b === 'F3.1'))
      .map((s, i) => ({ id: 'w' + i, a: s[0], b: s[1], color: s[2] })) as Wire[];
    w.push({ id: 'alt', a: 'F1.1', b: 'F3.1', color: 'br' });
    const r = checkWiring(t, w);
    expect(r.missing.length).toBe(0);
    expect(r.findings.some((f) => f.severity === 'info')).toBe(true);
  });

  it('a védővezető kapcsolón átvezetését hibaként jelzi', () => {
    const t = TASKS.A;
    const w = t.solution.map((s, i) => ({ id: 'w' + i, a: s[0], b: s[1], color: s[2] })) as Wire[];
    w.push({ id: 'pe', a: 'PB.b2', b: 'K1.1', color: 'gy' });
    const r = checkWiring(t, w);
    expect(r.findings.some((f) => f.messageHu.includes('védővezetőt'))).toBe(true);
  });

  it('a sorkapocs sín bármelyik csavarját elfogadja', () => {
    const t = TASKS.A;
    /* ugyanaz a bekötés, csak más csavarokon a nulla- és a PE-sínen */
    const swap = (k: string) =>
      k === 'NB.b1' ? 'NB.b6' : k === 'NB.b2' ? 'NB.b5' : k === 'PB.b1' ? 'PB.b4' : k;
    const w = t.solution.map((s, i) => ({ id: 'w' + i, a: swap(s[0]), b: swap(s[1]), color: s[2] })) as Wire[];
    const r = checkWiring(t, w);
    expect({ missing: r.missing.length, extra: r.extra.length }).toEqual({ missing: 0, extra: 0 });
    expect(r.ok).toBe(true);
  });

  it('a sínen belüli áthidalás nem hiba', () => {
    const t = TASKS.A;
    const w = t.solution.map((s, i) => ({ id: 'w' + i, a: s[0], b: s[1], color: s[2] })) as Wire[];
    w.push({ id: 'br', a: 'NB.b5', b: 'NB.b6', color: 'bl' });
    const r = checkWiring(t, w);
    expect(r.extra.length).toBe(0);
  });

  it('a sín cseréje viszont továbbra is hiba', () => {
    const t = TASKS.A;
    /* nulla helyett a PE-sínre kötött lámpa nem lehet elfogadható */
    const w = t.solution
      .map((s, i) => ({ id: 'w' + i, a: s[0], b: s[1], color: s[2] }))
      .map((x) => (x.a === 'NB.b2' ? { ...x, a: 'PB.b3' } : x)) as Wire[];
    const r = checkWiring(t, w);
    expect(r.ok).toBe(false);
  });

  /* A bekötés sorrendje javaslat, nem előírás. Ezt nem elég állítani: minden
     feladatra összekeverjük a huzalokat és átkötjük a síneken, és elvárjuk,
     hogy az ellenőrzés hibátlannak lássa. */
  it('a bekötés sorrendje sosem befolyásolja az eredményt', () => {
    let seed = 20260725;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    for (const id of TASK_ORDER) {
      const t = TASKS[id];
      for (let round = 0; round < 20; round++) {
        const shuffled = [...t.solution];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(rnd() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        const w = shuffled.map((s, i) => ({
          /* a kapocspár sorrendje is felcserélhető */
          id: 'w' + i,
          a: rnd() < 0.5 ? s[0] : s[1],
          b: rnd() < 0.5 ? s[1] : s[0],
          color: s[2],
        })) as Wire[];
        /* ha a csere miatt a két vég azonos lett, állítsuk vissza */
        w.forEach((x, i) => {
          if (x.a === x.b) {
            x.a = shuffled[i][0];
            x.b = shuffled[i][1];
          }
        });
        const r = checkWiring(t, w);
        expect({ id, round, ok: r.ok }).toEqual({ id, round, ok: true });
      }
    }
  });

  it('a sorkapocs síneken tetszőleges csavarra köthetsz', () => {
    let seed = 7;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    for (const id of TASK_ORDER) {
      const t = TASKS[id];
      const bars = t.parts.filter((p) => p.type === 'busbar').map((p) => p.id);
      if (!bars.length) continue;
      const reroute = (k: string) => {
        const bar = bars.find((b) => k.startsWith(b + '.'));
        return bar ? `${bar}.b${Math.floor(rnd() * 7)}` : k;
      };
      for (let round = 0; round < 10; round++) {
        const w = t.solution.map((s, i) => ({
          id: 'w' + i,
          a: reroute(s[0]),
          b: reroute(s[1]),
          color: s[2],
        })) as Wire[];
        const r = checkWiring(t, w);
        expect({ id, round, ok: r.ok }).toEqual({ id, round, ok: true });
      }
    }
  });

  it('a felfedés a következő hiányzó kötést adja', () => {
    const t = TASKS.A;
    expect(revealOne(t, [])).toEqual(t.solution[0]);
    const all = t.solution.map((s, i) => ({ id: 'w' + i, a: s[0], b: s[1], color: s[2] })) as Wire[];
    expect(revealOne(t, all)).toBeNull();
  });
});

describe('segédfüggvények', () => {
  it('hasPhase és phaseOf', () => {
    expect(hasPhase(new Set<Rail>(['N']))).toBe(false);
    expect(hasPhase(new Set<Rail>(['L2']))).toBe(true);
    expect(phaseOf(new Set<Rail>(['N', 'L3']))).toBe('L3');
  });
});
