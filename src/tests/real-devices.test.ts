/** A vizsgatábla valós készülékei: katalógus, kapocsjelölések, SPD, mérő. */
import { describe, expect, it } from 'vitest';
import { solve } from '../domain/netlist';
import { checkWiring } from '../domain/netlist-validation';
import { measure, type Scenario } from '../domain/measurement';
import { PARTS, termsOf } from '../data/parts';
import { TASKS, TASK_ORDER } from '../data/tasks';
import { GENERIC_PARTS, REAL_DEVICES } from '../data/realDevices';
import type { Board, PartInstance, Wire } from '../domain/electrical-types';

function build(id: string): Board {
  const t = TASKS[id];
  return {
    parts: t.parts.map((p) => ({ ...p, st: PARTS[p.type].init ? PARTS[p.type].init!() : {} }) as PartInstance),
    wires: t.solution.map((s, i) => ({ id: 'w' + i, a: s[0], b: s[1], color: s[2] })) as Wire[],
  };
}
const get = (b: Board, id: string) => b.parts.find((p) => p.id === id)!;
const SC: Scenario = { ze: 0.52, riso: 999, rcdT: 22, rcdT5: 12, u: 229.4, ra: 7.5, loosePe: null };

describe('valós készülékek katalógusa', () => {
  it('minden feladat minden alkatrésze a katalógusban van, vagy kifejezetten általános', () => {
    for (const id of TASK_ORDER) {
      for (const p of TASKS[id].parts) {
        if (p.dev) {
          const d = REAL_DEVICES[p.dev];
          expect(d, `${id}/${p.id}: ismeretlen készülék ${p.dev}`).toBeTruthy();
          expect(d.partTypes, `${id}/${p.id}`).toContain(p.type);
        } else {
          expect(GENERIC_PARTS[p.type], `${id}/${p.id} (${p.type}) se nem valós, se nem általános`).toMatch(
            /nem a fotókon szereplő eszköz/
          );
        }
      }
    }
  });

  it('a valós típusok soha nem maradnak készülék nélkül', () => {
    const realOnly = ['meter1', 'spd4', 'spd1', 'contactor', 'mprot', 'timer', 'stair', 'mcb', 'mcb3', 'rcd', 'sw1', 'sw2', 'swx', 'push'];
    for (const id of TASK_ORDER) {
      for (const p of TASKS[id].parts) {
        if (realOnly.includes(p.type)) expect(p.dev, `${id}/${p.id}`).toBeTruthy();
      }
    }
  });

  it('minden katalógustételnek van fotója és mérete; a forrás nélküliek indokolva vannak', () => {
    for (const d of Object.values(REAL_DEVICES)) {
      expect(d.photos.length, d.id).toBeGreaterThan(0);
      expect(d.dimsMm.w, d.id).toBeGreaterThan(0);
      if (!d.sourceUrls.length) expect(d.notesHu.join(' '), d.id).toMatch(/nem|NEM/);
    }
  });

  it('a kapocsazonosítók a nyomtatott jelöléssel egyeznek', () => {
    const ids = (type: string, opt: PartInstance['opt'] = null) =>
      termsOf({ id: 'x', type, x: 0, y: 0, opt, st: {} }).map((t) => t.id);
    expect(ids('contactor')).toEqual(expect.arrayContaining(['1L1', '3L2', '5L3', '2T1', '4T2', '6T3', 'A1', 'A2']));
    expect(ids('mprot')).toEqual(expect.arrayContaining(['1L1', '3L2', '5L3', '2T1', '4T2', '6T3']));
    expect(ids('mcb3')).toEqual(['1', '3', '5', '2', '4', '6']);
    expect(ids('timer')).toEqual(expect.arrayContaining(['A1', 'A2', 'B1', '15', '16', '18']));
    expect(ids('swx')).toEqual(['L1', 'L2', '3', '4']);
    expect(ids('sw2')).toEqual(['L', '1', '2']);
    expect(ids('push')).toEqual(['L', '1']);
    expect(ids('spd4')).toEqual(['L1', 'L2', 'L3', 'N', 'PE']);
    expect(ids('spd1')).toEqual(['L/N', 'PE']);
    /* Easy9 4P: a nulla a bal szélen */
    const fi4 = termsOf({ id: 'x', type: 'rcd', x: 0, y: 0, opt: { poles: 4 }, st: {} });
    const top = fi4.filter((t) => t.dir === 'n').sort((a, b) => a.x - b.x).map((t) => t.t);
    expect(top).toEqual(['N', '1', '3', '5']);
  });
});

describe('Qoltec 50888 fogyasztásmérő', () => {
  it('a fázis 1 → 2, a nulla 3 → 4 megy át', () => {
    const p = { id: 'KWH', type: 'meter1', x: 0, y: 0, st: {} } as PartInstance;
    expect(PARTS.meter1.links!({}, p, {} as never)).toEqual([
      ['1', '2'],
      ['3', '4'],
    ]);
    expect(termsOf(p).map((t) => t.id).sort()).toEqual(['1', '2', '3', '4', '5', '6']);
  });

  it('a G, I és J megoldás a 1-2 / 3-4 kapcsokat használja, a régi 6-ost nem', () => {
    for (const id of ['G', 'I', 'J']) {
      const keys = TASKS[id].solution.flatMap(([a, b]) => [a, b]).filter((k) => k.startsWith('KWH.'));
      expect(new Set(keys), id).toEqual(new Set(['KWH.1', 'KWH.2', 'KWH.3', 'KWH.4']));
    }
  });

  it('G: feszültség alatt a mérő 2-es kapcsán fázis, 4-esén nulla van, a lámpa világít', () => {
    const b = build('G');
    get(b, 'SUP').st.on = true;
    const s = solve(b, Date.now());
    const c = s.ctxFor(get(b, 'KWH'));
    expect([...c.rails('2')]).toContain('L1');
    expect(c.rails('4').has('N')).toBe(true);
    expect(s.live['E1.on']).toBe(true);
  });
});

describe('túlfeszültség-védők (SPD)', () => {
  it('normál állapotban nincs belső kötésük és fogyasztójuk', () => {
    for (const type of ['spd4', 'spd1']) {
      const d = PARTS[type];
      expect(d.links, type).toBeUndefined();
      expect(d.loads, type).toBeUndefined();
      expect(d.sources, type).toBeUndefined();
      expect(d.protect, type).toBeUndefined();
    }
  });

  it('L-N-PE közé kötve sem okoznak zárlatot vagy testzárlatot', () => {
    const b: Board = {
      parts: [
        { id: 'SUP', type: 'feed', x: 0, y: 0, st: { on: true } },
        { id: 'A', type: 'spd1', x: 0, y: 0, st: {} },
        { id: 'B', type: 'spd1', x: 0, y: 0, st: {} },
      ],
      wires: [
        { id: '1', a: 'SUP.L1', b: 'A.L/N', color: 'br' },
        { id: '2', a: 'SUP.N', b: 'B.L/N', color: 'bl' },
        { id: '3', a: 'SUP.PE', b: 'A.PE', color: 'gy' },
        { id: '4', a: 'SUP.PE', b: 'B.PE', color: 'gy' },
      ],
    };
    const s = solve(b, Date.now());
    expect(s.shorts.size).toBe(0);
    expect(s.earthFault).toBe(false);
  });

  it('F, G, I és J: a bekötött SPD-vel a tábla működik, a Fi nem old ki', () => {
    for (const id of ['F', 'G', 'I', 'J']) {
      const b = build(id);
      for (const p of b.parts) {
        if (PARTS[p.type].supply) p.st.on = true;
        if (p.type === 'mainsw' || p.type === 'sw1') p.st.on = true;
        if (p.type === 'socket') p.st.plug = true;
      }
      const s = solve(b, Date.now());
      expect({ id, shorts: s.shorts.size, earth: s.earthFault }).toEqual({ id, shorts: 0, earth: false });
      const fi = b.parts.find((p) => p.type === 'rcd')!;
      expect(fi.st.tripped, id).toBe(false);
      expect(Object.keys(s.live).length, `${id}: nincs működő fogyasztó`).toBeGreaterThan(0);
    }
  });

  it('az SPD mindig a Fi-relé előtt van (a Fi bemeneti csomópontján)', () => {
    for (const id of ['F', 'G', 'I', 'J']) {
      const t = TASKS[id];
      const b = build(id);
      for (const p of b.parts) if (p.type === 'mainsw') p.st.on = true;
      const fi = t.parts.find((p) => p.type === 'rcd')!;
      for (const spd of t.parts.filter((p) => p.type === 'spd1' || p.type === 'spd4')) {
        const live = termsOf({ ...spd, st: {} }).filter((x) => x.id !== 'PE');
        for (const term of live) {
          const key = `${spd.id}.${term.id}`;
          /* a Fi-t kikapcsolva is a betáplálás oldalán kell maradnia */
          get(b, fi.id).st.on = false;
          for (const p of b.parts) if (PARTS[p.type].supply) p.st.on = true;
          const s = solve(b, Date.now());
          expect(s.railsAt(key).size, `${id} ${key}`).toBeGreaterThan(0);
        }
        const pe = t.solution.some(([a, b2]) => a === `${spd.id}.PE` || b2 === `${spd.id}.PE`);
        expect(pe, `${id} ${spd.id} PE nélkül`).toBe(true);
      }
    }
  });
});

describe('megoldások és lépések', () => {
  it('minden megoldás-huzal mindkét vége létező kapocs a saját alkatrészén', () => {
    for (const id of TASK_ORDER) {
      const t = TASKS[id];
      for (const [a, b] of t.solution) {
        for (const k of [a, b]) {
          const [pid, term] = [k.slice(0, k.indexOf('.')), k.slice(k.indexOf('.') + 1)];
          const p = t.parts.find((q) => q.id === pid);
          expect(p, `${id}: ${k} alkatrésze`).toBeTruthy();
          expect(termsOf({ ...p!, st: {} }).map((x) => x.id), `${id}: ${k}`).toContain(term);
        }
      }
    }
  });

  it('minden huzal egy létező lépéshez tartozik (3D lépésenként)', () => {
    for (const id of TASK_ORDER) {
      const t = TASKS[id];
      expect(t.wireStep?.length, id).toBe(t.solution.length);
      for (const s of t.wireStep!) {
        expect(s, id).toBeGreaterThanOrEqual(0);
        expect(s, id).toBeLessThan(t.stepsHu.length);
      }
    }
  });
});

describe('J: 3-as vizsgafeladat (mérőhely + főelosztó)', () => {
  it('a referenciamegoldás hibátlan', () => {
    const t = TASKS.J;
    const w = t.solution.map((s, i) => ({ id: 'w' + i, a: s[0], b: s[1], color: s[2] })) as Wire[];
    expect(checkWiring(t, w).ok).toBe(true);
  });

  it('a PEN először a PE-sínre megy, az EPH elemek a fő földelősínen vannak', () => {
    const sol = TASKS.J.solution;
    expect(sol.some(([a, b]) => a === 'KWH.4' && b === 'PEN.p0')).toBe(true);
    for (const e of ['EV', 'EG', 'EF', 'RE']) {
      expect(sol.some(([a, b]) => a.startsWith(e + '.') && b.startsWith('EPH.')), e).toBe(true);
    }
  });

  it('a PE-folytonosság és a hálózati feszültség (L-N, L-PE, N-PE) mérhető', () => {
    const b = build('J');
    const pe = measure('pe', TASKS.J, b, null, SC, false);
    expect('pass' in pe && pe.pass).toBe(true);
    get(b, 'SUP').st.on = true;
    get(b, 'X1').st.plug = true;
    const s = solve(b, Date.now());
    const u = measure('u', TASKS.J, b, s, SC, true);
    expect('valueHu' in u && u.valueHu).toMatch(/L-N .*L-PE .*N-PE/);
    expect('pass' in u && u.pass).toBe(true);
  });

  it('PE nélküli dugaljon az L-PE feszültség hibát jelez', () => {
    const b = build('J');
    b.wires = b.wires.filter((w) => !(w.a === 'PB.b1' && w.b === 'X1.PE'));
    get(b, 'SUP').st.on = true;
    get(b, 'X1').st.plug = true;
    const s = solve(b, Date.now());
    const u = measure('u', TASKS.J, b, s, SC, true);
    expect('pass' in u && u.pass).toBe(false);
  });

  it('ha a lámpa nullája a mérőszekrény N-sínjére megy (Fi megkerülve), a Fi kiold', () => {
    const b = build('J');
    b.wires = b.wires.map((w) => (w.a === 'NB.b2' && w.b === 'E1.2' ? { ...w, a: 'PEN.n4' } : w));
    get(b, 'SUP').st.on = true;
    get(b, 'S1').st.on = true;
    solve(b, Date.now());
    expect(get(b, 'FI').st.tripped).toBe(true);
  });
});

describe('3D elrendezés (layout, three.js nélkül)', async () => {
  const { buildLayout, pathLength } = await import('../features/board3d/layout');

  it('minden alkalmazás-kapocsnak van fizikai helye, és minden huzal a saját kapcsába fut', () => {
    for (const id of TASK_ORDER) {
      const t = TASKS[id];
      const L = buildLayout(t);
      for (const p of t.parts) {
        for (const term of termsOf({ ...p, st: {} })) {
          expect(L.terms.has(`${p.id}.${term.id}`), `${id}: ${p.id}.${term.id}`).toBe(true);
        }
      }
      expect(L.wires.length, id).toBe(t.solution.length);
      for (const w of L.wires) {
        const ha = L.terms.get(w.a)!.hole;
        const hb = L.terms.get(w.b)!.hole;
        expect(w.pts[0], `${id} ${w.a}`).toEqual(ha);
        expect(w.pts[w.pts.length - 1], `${id} ${w.b}`).toEqual(hb);
        expect(w.pts.flat().every(Number.isFinite), `${id} ${w.a}-${w.b}`).toBe(true);
        expect(pathLength(w.pts), `${id} ${w.a}-${w.b}`).toBeGreaterThan(10);
      }
    }
  });

  it('a J feladatban két szekrény van, a mért fővezeték védőcsövön megy át', () => {
    const L = buildLayout(TASKS.J);
    expect(L.enclosures.map((e) => e.titleHu)).toEqual(['Mérőszekrény', 'Lakás főelosztó']);
    expect(L.conduits.length).toBeGreaterThan(0);
  });

  it('a készülékek nem lógnak egymásba és a szerelőlapon belül vannak', () => {
    for (const id of TASK_ORDER) {
      const L = buildLayout(TASKS[id]);
      const boxes = L.parts.map((q) => ({ id: q.part.id, x0: q.x - q.w / 2, x1: q.x + q.w / 2, y0: q.y - q.h / 2, y1: q.y + q.h / 2 }));
      for (const b of boxes) {
        expect(b.x0 >= L.plate.x0 && b.x1 <= L.plate.x1, `${id} ${b.id} vízszintesen`).toBe(true);
      }
      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
          const a = boxes[i];
          const b = boxes[j];
          const overlap = a.x0 < b.x1 - 0.5 && b.x0 < a.x1 - 0.5 && a.y0 < b.y1 - 0.5 && b.y0 < a.y1 - 0.5;
          expect(overlap, `${id}: ${a.id} és ${b.id} átfed`).toBe(false);
        }
      }
    }
  });
});
