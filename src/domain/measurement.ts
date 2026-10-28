/**
 * Szerelői mérések a táblán (MSZ HD 60364-6 sorrend szerint).
 *
 * A mért érték két forrásból jön: a bekötésből (van-e PE, van-e zárlat, van-e
 * fázis a mérési ponton) és egy véletlen „vizsgahelyzetből” (hálózati
 * impedancia, Fi-relé kioldási ideje, hálózati feszültség). Így a jó bekötés
 * mellett is előfordul nem megfelelő eredmény - ahogy a vizsgán is, ahol a
 * jegyzőkönyvben ezt kell felismerni és értékelni.
 */
import type { Board, PartInstance, Rail, SolveResult, TaskDef } from './electrical-types';
import { DSU, hasPhase, phaseOf } from './netlist';
import { PARTS, termsOf } from '../data/parts';
import { checkWiring } from './netlist-validation';

export type MeasureId = 'pe' | 'ra' | 'riso' | 'zs' | 'rcd' | 'u' | 'forg' | 'funkcio';

export interface MeasureDef {
  id: MeasureId;
  titleHu: string;
  instrumentHu: string;
  /** feszültségmentesen (off) vagy feszültség alatt (on) mérendő */
  power: 'off' | 'on';
  /** 1: folytonosság, 2: szigetelés, 3: feszültség alatti mérések */
  stage: number;
  limitHu: string;
}

export const MEASURES: MeasureDef[] = [
  {
    id: 'pe',
    titleHu: 'Védővezető folytonossága (R PE)',
    instrumentHu: 'folytonosságmérő, ≥ 0,2 A mérőáram',
    power: 'off',
    stage: 1,
    limitHu: '< 1 Ω',
  },
  {
    id: 'ra',
    titleHu: 'Földelési ellenállás (RA)',
    instrumentHu: 'földelési ellenállásmérő, 3 vezetékes',
    power: 'off',
    stage: 1,
    limitHu: 'TT: RA ≤ 50 V / IΔn → 30 mA-nél ≤ 1666 Ω',
  },
  {
    id: 'riso',
    titleHu: 'Szigetelési ellenállás (L, N - PE)',
    instrumentHu: 'szigetelésmérő, 500 V DC',
    power: 'off',
    stage: 2,
    limitHu: '≥ 1 MΩ',
  },
  {
    id: 'zs',
    titleHu: 'Hurokimpedancia (Zs, L - PE)',
    instrumentHu: 'hurokimpedancia-mérő',
    power: 'on',
    stage: 3,
    limitHu: 'Zs ≤ U0 / Ia = 230 V / 50 A = 4,60 Ω (B10)',
  },
  {
    id: 'rcd',
    titleHu: 'Fi-relé kioldása (IΔn = 30 mA)',
    instrumentHu: 'Fi-relé vizsgáló',
    power: 'on',
    stage: 3,
    limitHu: 'IΔn: ≤ 300 ms · 5×IΔn: ≤ 40 ms',
  },
  {
    id: 'u',
    titleHu: 'Hálózati feszültség (L-N, L-PE, N-PE)',
    instrumentHu: 'multiméter, AC V',
    power: 'on',
    stage: 3,
    limitHu: 'L-N és L-PE: 230 V ± 10 % → 207-253 V · N-PE: néhány V alatt',
  },
  {
    id: 'forg',
    titleHu: 'Fázissorrend / forgásirány',
    instrumentHu: 'fázissorrend-mutató',
    power: 'on',
    stage: 3,
    limitHu: 'jobbos (L1-L2-L3), a rajz szerinti irány',
  },
  {
    id: 'funkcio',
    titleHu: 'Működési próba',
    instrumentHu: 'szemrevételezés, kezelőszervek',
    power: 'on',
    stage: 3,
    limitHu: 'minden üzemállapot a feladat szerint',
  },
];

/** A feladatban értelmes mérések: földelési ellenállás csak földelővel. */
export function measuresFor(task: TaskDef): MeasureDef[] {
  const rod = task.parts.some((p) => p.type === 'earthrod');
  return MEASURES.filter((m) => m.id !== 'ra' || rod);
}

/** A vizsgahelyzet: ezek az értékek nem a bekötésből jönnek. */
export interface Scenario {
  ze: number;
  riso: number;
  rcdT: number;
  rcdT5: number;
  u: number;
  ra: number;
  /** ennél a készüléknél laza a PE-csavar (nagy R PE) - vagy null */
  loosePe: string | null;
}

export function newScenario(task: TaskDef, rnd: () => number = Math.random): Scenario {
  const pick = <T,>(a: T[]): T => a[Math.floor(rnd() * a.length)];
  const peParts = task.parts.filter((p) => peTerm({ ...p, st: {} }) && !PARTS[p.type].supply && !PARTS[p.type].equipotential && !PARTS[p.type].groups);
  return {
    ze: pick([0.38, 0.52, 0.74, 1.1, 1.6, 2.3, 4.9]),
    riso: pick([999, 999, 999, 186, 0.62]),
    rcdT: pick([18, 22, 27, 34, 41, 312]),
    rcdT5: pick([9, 12, 16, 21, 28, 47]),
    u: pick([229.4, 231.8, 226.2, 236.5, 254.6, 203.9]),
    ra: pick([3.8, 7.5, 12.4, 26, 88, 1900]),
    loosePe: peParts.length && rnd() < 0.25 ? pick(peParts).id : null,
  };
}

export interface Reading {
  id: MeasureId;
  /** amit a műszer kijelez */
  valueHu: string;
  /** a jegyzőkönyvbe átírandó szám; ha nincs, elég szövegesen beírni */
  num?: number;
  /** a valós értékelés; null = nem értelmezhető ennél a feladatnál */
  pass: boolean | null;
  noteHu?: string;
}

export interface Refusal {
  refused: true;
  messageHu: string;
  /** biztonsági hiba (pl. szigetelésmérés feszültség alatt) */
  safety: boolean;
}

const hu = (n: number, d = 2) => n.toFixed(d).replace('.', ',');

function peTerm(p: PartInstance): string | null {
  const t = termsOf(p).find((x) => x.role === 'PE');
  return t ? `${p.id}.${t.id}` : null;
}

const supplyOf = (b: Board) => b.parts.find((p) => PARTS[p.type].supply) || null;
/** A betáplálás védővezetője - TN-C-nél a PEN. */
const supplyPe = (sup: PartInstance) => {
  const t = termsOf(sup).find((x) => x.role === 'PE' || x.t === 'PEN');
  return t ? `${sup.id}.${t.id}` : null;
};

/** A végpont, ahol a feszültség alatti méréseket végezzük. */
const POINT_ORDER = ['socket', 'motor1', 'motor', 'motor6', 'vfd'];
const POINT_L: Record<string, string> = { socket: 'L', motor1: 'U1', motor: 'U1', motor6: 'U1', vfd: 'L1' };
const POINT_N: Record<string, string> = { socket: 'N', motor1: 'U2', vfd: 'N' };

export function measurePoint(b: Board): PartInstance | null {
  for (const t of POINT_ORDER) {
    const p = b.parts.find((q) => q.type === t);
    if (p) return p;
  }
  return null;
}

export function pointName(p: PartInstance) {
  return `${p.label || p.id} (${PARTS[p.type].name})`;
}

/** Kábelek, sínek és a fix átvezetések (pl. a mérő 4-6 kapcsa, amin a PEN
 *  átmegy). Kapcsoló, védelem, mágneskapcsoló nem számít: a védővezető sosem
 *  mehet kapcsolón át. */
function staticNets(b: Board) {
  const d = new DSU();
  for (const w of b.wires) d.union(w.a, w.b);
  for (const p of b.parts) {
    const def = PARTS[p.type];
    const fixed = def.links && !def.tap && !def.hold && !def.protect && !def.update && !def.supply;
    if (fixed) for (const [x, y] of def.links!(p.st, p, { now: 0 } as never)) d.union(`${p.id}.${x}`, `${p.id}.${y}`);
    const groups = def.equipotential ? [termsOf(p).map((t) => t.id)] : def.groups || [];
    for (const g of groups) for (const id of g) d.union(`${p.id}.${g[0]}`, `${p.id}.${id}`);
  }
  return d;
}

/** Szigetelésmérés: a kapcsolók mostani állásában, a védelmek zárva, a
 *  betáplálás helyén bejuttatott „próbafeszültséggel”. */
function insulationFault(b: Board): string | null {
  const d = new DSU();
  for (const w of b.wires) d.union(w.a, w.b);
  for (const p of b.parts) {
    const def = PARTS[p.type];
    if (!def.links) continue;
    const st = def.protect || def.supply ? { ...p.st, on: true, tripped: false } : p.st;
    for (const [x, y] of def.links(st, p, { now: Date.now() } as never)) d.union(`${p.id}.${x}`, `${p.id}.${y}`);
  }
  const rails = new Map<string, Set<Rail>>();
  const add = (t: string, r: Rail) => {
    const k = d.find(t);
    if (!rails.has(k)) rails.set(k, new Set());
    rails.get(k)!.add(r);
  };
  for (const p of b.parts) {
    const def = PARTS[p.type];
    /* a PEN a mérés szempontjából védővezető; a PEN-szétválasztó N-sínje nulla */
    if (def.supply) for (const t of termsOf(p)) if (t.t) add(`${p.id}.${t.id}`, (t.t === 'PEN' ? 'PE' : t.t) as Rail);
    if (p.type === 'penbar') add(`${p.id}.n0`, 'N');
    if (p.type === 'busbar' && p.opt?.rail) add(`${p.id}.b0`, p.opt.rail);
  }
  for (const s of rails.values()) {
    const ph = [...s].filter((r) => r === 'L1' || r === 'L2' || r === 'L3').length;
    if (ph && s.has('PE')) return 'fázis és védővezető között (testzárlat)';
    if (ph > 1) return 'két fázis között';
    if (ph && s.has('N')) return 'fázis és nulla között';
    if (s.has('N') && s.has('PE')) {
      return b.parts.some((p) => p.type === 'penbar' && p.st.on)
        ? 'nulla és védővezető között - a PEN-híd zárva van, a mérés idejére bontsd'
        : 'nulla és védővezető összekötve';
    }
  }
  return null;
}

export function measure(
  id: MeasureId,
  task: TaskDef,
  b: Board,
  sim: SolveResult | null,
  sc: Scenario,
  powered: boolean
): Reading | Refusal {
  const def = MEASURES.find((m) => m.id === id)!;
  if (def.power === 'off' && powered) {
    return {
      refused: true,
      safety: true,
      messageHu:
        id === 'riso'
          ? 'Szigetelést feszültség alatt mérni tilos! Kapcsold le a betáplálást, és biztosítsd visszakapcsolás ellen.'
          : 'A folytonosságot feszültségmentes állapotban mérjük. Kapcsold le a betáplálást.',
    };
  }
  if (def.power === 'on' && (!powered || !sim)) {
    return { refused: true, safety: false, messageHu: 'Ehhez a méréshez feszültség kell: kapcsold be a betáplálást.' };
  }

  const sup = supplyOf(b);
  const supPe = sup && supplyPe(sup);
  const nets = staticNets(b);

  if (id === 'pe') {
    const parts = b.parts.filter((p) => peTerm(p) && !PARTS[p.type].supply && !PARTS[p.type].equipotential && !PARTS[p.type].groups);
    if (!parts.length || !supPe) return { id, valueHu: 'nincs védővezetős készülék', pass: null };
    const rows = parts.map((p, i) => {
      const ok = nets.find(peTerm(p)!) === nets.find(supPe);
      const r = !ok ? null : p.id === sc.loosePe ? 1.8 : 0.12 + i * 0.04;
      return { p, r };
    });
    const bad = rows.filter((x) => x.r === null || x.r >= 1);
    const worst = rows.some((x) => x.r === null) ? null : Math.max(...rows.map((x) => x.r!));
    return {
      id,
      num: worst ?? undefined,
      valueHu: (worst === null ? 'OL · ' : `max. ${hu(worst)} Ω · `) + rows.map((x) => `${x.p.label || x.p.id}: ${x.r === null ? 'OL (szakadás)' : hu(x.r) + ' Ω'}`).join(' · '),
      pass: bad.length === 0,
      noteHu: bad.length
        ? `Nem megfelelő: ${bad.map((x) => x.p.label || x.p.id).join(', ')} - ` +
          (bad.some((x) => x.r === null) ? 'a PE nincs bekötve.' : 'laza a PE-kötés, húzd meg a csavart.')
        : undefined,
    };
  }

  if (id === 'ra') {
    const rod = b.parts.find((p) => p.type === 'earthrod');
    if (!rod) return { id, valueHu: 'nincs földelő', pass: null };
    if (!supPe || nets.find(`${rod.id}.E`) !== nets.find(supPe)) {
      return { id, valueHu: 'OL (nincs bekötve)', pass: false, noteHu: 'A földelő nincs a PE-sínre kötve.' };
    }
    return {
      id,
      num: sc.ra,
      valueHu: `${hu(sc.ra, 1)} Ω`,
      pass: sc.ra <= 1666,
      noteHu: sc.ra > 1666 ? 'Túl nagy földelési ellenállás: hosszabb vagy több szonda kell.' : undefined,
    };
  }

  if (id === 'riso') {
    const f = insulationFault(b);
    if (f) return { id, num: 0, valueHu: '0,00 MΩ', pass: false, noteHu: `Zárlat ${f}. Előbb a bekötést javítsd.` };
    return {
      id,
      num: Math.min(sc.riso, 299),
      valueHu: sc.riso > 299 ? '> 299 MΩ' : `${hu(sc.riso)} MΩ`,
      pass: sc.riso >= 1,
      noteHu: sc.riso < 1 ? 'Szigetelési hiba (pl. nedves kötődoboz, sérült ér) - a berendezés nem helyezhető üzembe.' : undefined,
    };
  }

  const pt = measurePoint(b);
  const ptL = pt && `${pt.id}.${POINT_L[pt.type]}`;
  const live = !!(sim && ptL && hasPhase(sim.railsAt(ptL)));
  const ptPe = pt && peTerm(pt);
  const peOk = !!(sim && ptPe && sim.railsAt(ptPe).has('PE'));

  if (id === 'zs' || id === 'rcd' || id === 'u') {
    if (!pt) return { id, valueHu: 'nincs mérési pont', pass: null };
    if (!live) {
      return {
        refused: true,
        safety: false,
        messageHu: `A mérési ponton (${pointName(pt)}) nincs fázis. Kapcsold be a védelmeket, indítsd el a fogyasztót.`,
      };
    }
  }

  if (id === 'zs') {
    if (!peOk) return { id, valueHu: 'OL (nincs hurok)', pass: false, noteHu: 'A mérési pont PE-je nem jut vissza a betáplálásig.' };
    const zs = sc.ze + 0.21;
    return {
      id,
      num: Math.round(zs * 100) / 100,
      valueHu: `${hu(zs)} Ω · Ik = ${Math.round(230 / zs)} A`,
      pass: zs <= 4.6,
      noteHu: zs > 4.6 ? 'Túl nagy hurokimpedancia: a B10 nem old ki időben. C helyett kisebb In vagy nagyobb keresztmetszet kell.' : undefined,
    };
  }

  if (id === 'rcd') {
    const rcd = b.parts.find((p) => p.type === 'rcd');
    if (!rcd) return { id, valueHu: 'nincs Fi-relé a feladatban', pass: null };
    if (!rcd.st.on || rcd.st.tripped) return { refused: true, safety: false, messageHu: 'A Fi-relé ki van kapcsolva - kapcsold vissza.' };
    if (!peOk) return { id, valueHu: 'nem old ki', pass: false, noteHu: 'PE nélkül a vizsgálóáram nem tud elfolyni - a Fi-relé nem véd.' };
    rcd.st.tripped = true; /* a vizsgálat valóban lekapcsolja */
    return {
      id,
      num: sc.rcdT,
      valueHu: `IΔn: ${sc.rcdT} ms · 5×IΔn: ${sc.rcdT5} ms`,
      pass: sc.rcdT <= 300 && sc.rcdT5 <= 40,
      noteHu: 'A Fi-relé kioldott - kapcsold vissza.' + (sc.rcdT > 300 || sc.rcdT5 > 40 ? ' Lassú kioldás: a Fi-relét cserélni kell.' : ''),
    };
  }

  if (id === 'u') {
    /* Három érték egy mérésben: L-N, L-PE, N-PE. A jegyzőkönyvbe az L-N kerül
       számként, a másik kettő a kijelzett szövegben látszik. */
    const nT = POINT_N[pt!.type];
    const nOk = !nT || sim!.railsAt(`${pt!.id}.${nT}`).has('N');
    const ln = nOk ? sc.u : 0;
    const lpe = ptPe ? (peOk ? sc.u + 0.3 : 0) : null;
    const npe = ptPe && nOk ? (peOk ? 0.4 : null) : null;
    const parts = [
      `L-N ${hu(ln, 1)} V`,
      lpe === null ? 'L-PE: nincs PE kapocs' : `L-PE ${hu(lpe, 1)} V`,
      npe === null ? (ptPe ? 'N-PE: OL' : '') : `N-PE ${hu(npe, 1)} V`,
    ].filter(Boolean);
    const ok = nOk && sc.u >= 207 && sc.u <= 253 && (!ptPe || peOk);
    return {
      id,
      num: ln,
      valueHu: parts.join(' · '),
      pass: ok,
      noteHu: !nOk
        ? 'A mérési pont nullája szakadt.'
        : ptPe && !peOk
          ? 'L-PE ≈ 0 V: a védővezető nem jut el a mérési pontig - szakadt vagy bekötetlen PE.'
          : undefined,
    };
  }

  if (id === 'forg') {
    const m = b.parts.find((p) => PARTS[p.type].run);
    if (m) {
      const dir = PARTS[m.type].run!(m, sim!.ctxFor(m));
      if (!dir) return { refused: true, safety: false, messageHu: `${m.label || m.id} áll - indítsd el a motort.` };
      return { id, valueHu: dir === 1 ? 'jobbra forog (L1-L2-L3)' : 'balra forog', pass: dir === 1 };
    }
    const f3 = b.parts.find((p) => p.type === 'feed3');
    if (!f3) return { id, valueHu: 'egyfázisú feladat', pass: null };
    const seq = ['L1', 'L2', 'L3'].map((t) => phaseOf(sim!.railsAt(`${f3.id}.${t}`)));
    return { id, valueHu: seq.join('-'), pass: seq.join() === 'L1,L2,L3' };
  }

  /* működési próba: a bekötés villamosan egyezik és nincs hiba a táblán */
  const ok = checkWiring(task, b.wires).ok && !sim!.shorts.size && !sim!.earthFault;
  return {
    id,
    valueHu: ok ? 'minden üzemállapot rendben' : 'eltérés a feladattól',
    pass: ok,
    noteHu: ok ? undefined : 'Próbáld végig a kapcsolókat - a bekötés vagy a működés nem egyezik.',
  };
}

/** A mérési sorrend hibái: PE-folytonosság → szigetelés → feszültség alatt. */
export function orderErrors(done: MeasureId[]): string[] {
  const errs: string[] = [];
  const stage = (id: MeasureId) => MEASURES.find((m) => m.id === id)!.stage;
  let max = 0;
  for (const id of done) {
    const s = stage(id);
    if (s < max) errs.push(`${MEASURES.find((m) => m.id === id)!.titleHu}: későn - ennek előbb kellett volna jönnie.`);
    max = Math.max(max, s);
  }
  if (done.some((d) => stage(d) === 3) && !done.includes('riso')) {
    errs.push('Szigetelésmérés nélkül helyezted feszültség alá.');
  }
  return errs;
}
