/**
 * Hálózatszámítás. Csomópont = "alkatreszId.sorkapocs".
 *
 * A huzalok és az alkatrészek belső kötései egy union-find hálózatot alkotnak,
 * a betáplálások pedig síneket (L1/L2/L3/N/PE) injektálnak bele. A fogyasztók
 * NEM kötik össze a saját kapcsaikat, ezért az a háló, amiben fázis és nulla is
 * megjelenik, valódi zárlat.
 *
 * A védelmek kioldása itt dől el, nem az alkatrészekben: zárlatkor az a
 * megszakító old ki, amelyiknek a bontása megszünteti a zárlatot, és közben a
 * legtöbb kapcsot hagyja feszültség alatt. Ez adja a szelektivitást.
 */
import type { Board, PartInstance, Rail, SolveCtx, SolveResult } from './electrical-types';
import { PARTS, termsOf } from '../data/parts';

const EMPTY: ReadonlySet<Rail> = new Set<Rail>();
const PHASE: Record<string, true> = { L1: true, L2: true, L3: true };
const MAX_PASS = 14;

export class DSU {
  private p = new Map<string, string>();

  find(x: string): string {
    const p = this.p;
    if (!p.has(x)) {
      p.set(x, x);
      return x;
    }
    let r = x;
    while (p.get(r) !== r) r = p.get(r)!;
    while (p.get(x) !== r) {
      const n = p.get(x)!;
      p.set(x, r);
      x = n;
    }
    return r;
  }

  union(a: string, b: string): void {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra !== rb) this.p.set(ra, rb);
  }
}

export function hasPhase(set: ReadonlySet<Rail>): boolean {
  for (const r of set) if (PHASE[r]) return true;
  return false;
}

export function phaseOf(set: ReadonlySet<Rail>): Rail | null {
  for (const r of set) if (PHASE[r]) return r;
  return null;
}

export function solve(board: Board, now: number): SolveResult {
  const parts = board.parts;
  const wires = board.wires;
  let live: Record<string, boolean> = Object.create(null);

  /* Az alkatrészek a saját kapocsnevüket használják ('L', '2'); a ctx a hívó
     alkatrészhez köti őket. Teljes kulcs ('K1.A1') is átmehet. */
  let cur: PartInstance | null = null;
  const full = (t: string) => (t.indexOf('.') >= 0 ? t : `${cur!.id}.${t}`);

  function buildDsu(skipId: string | null): DSU {
    const d = new DSU();
    for (const w of wires) d.union(w.a, w.b);
    for (const p of parts) {
      if (p.id === skipId) continue;
      const def = PARTS[p.type];
      if (!def?.links) continue;
      cur = p;
      for (const [a, b] of def.links(p.st, p, { now } as SolveCtx)) {
        d.union(`${p.id}.${a}`, `${p.id}.${b}`);
      }
    }
    return d;
  }

  function railsFor(d: DSU, skipId: string | null) {
    const rails = new Map<string, Set<Rail>>();
    const at = (t: string): ReadonlySet<Rail> => rails.get(d.find(t)) || EMPTY;
    const add = (t: string, rail: Rail): boolean => {
      const root = d.find(t);
      let s = rails.get(root);
      if (!s) {
        s = new Set<Rail>();
        rails.set(root, s);
      }
      if (s.has(rail)) return false;
      s.add(rail);
      return true;
    };
    const sctx = {
      now,
      rails: (t: string) => at(full(t)),
      live: (k: string) => !!live[k],
      shorted: () => false,
      earth: () => false,
      same: (a: string, b: string) => d.find(full(a)) === d.find(full(b)),
    } as SolveCtx;

    let grew = true;
    let guard = 0;
    while (grew && guard++ < 8) {
      grew = false;
      for (const p of parts) {
        if (p.id === skipId) continue;
        const def = PARTS[p.type];
        if (!def?.sources) continue;
        cur = p;
        for (const [t, rail] of def.sources(p.st, p, sctx)) {
          if (add(`${p.id}.${t}`, rail)) grew = true;
        }
      }
    }
    return { rails, at };
  }

  function faultsFor(rails: Map<string, Set<Rail>>) {
    const shorts = new Set<string>();
    let earth = false;
    rails.forEach((s, root) => {
      let ph = 0;
      for (const r of s) if (PHASE[r]) ph++;
      if (ph > 1 || (ph > 0 && s.has('N'))) shorts.add(root);
      if (ph > 0 && s.has('PE')) {
        shorts.add(root);
        earth = true;
      }
    });
    return { shorts, earth };
  }

  /** Hány kapocs marad feszültség alatt, ha ezt az eszközt bontjuk. */
  function energizedCount(at: (t: string) => ReadonlySet<Rail>): number {
    let n = 0;
    for (const p of parts) {
      for (const t of termsOf(p)) if (hasPhase(at(`${p.id}.${t.id}`))) n++;
    }
    return n;
  }

  const isClosed = (p: PartInstance) => p.st.tripped !== true && p.st.on !== false;

  let dsu = new DSU();
  let rails = new Map<string, Set<Rail>>();
  let at: (t: string) => ReadonlySet<Rail> = () => EMPTY;
  let shorts = new Set<string>();
  let earthFault = false;
  let oscillating = false;
  const seen: string[] = [];

  for (let pass = 0; pass < MAX_PASS; pass++) {
    dsu = buildDsu(null);
    const rr = railsFor(dsu, null);
    rails = rr.rails;
    at = rr.at;
    const f = faultsFor(rails);
    shorts = f.shorts;
    earthFault = f.earth;

    /* fogyasztók */
    const next: Record<string, boolean> = Object.create(null);
    for (const p of parts) {
      const def = PARTS[p.type];
      if (!def?.loads) continue;
      cur = p;
      for (const ld of def.loads(p.st, p, { now } as SolveCtx)) {
        const ka = `${p.id}.${ld.a}`;
        const kb = `${p.id}.${ld.b}`;
        if (shorts.has(dsu.find(ka))) continue;
        const ra = at(ka);
        const rb = at(kb);
        if ((hasPhase(ra) && rb.has('N')) || (hasPhase(rb) && ra.has('N'))) {
          next[`${p.id}.${ld.key}`] = true;
        }
      }
    }
    live = next;

    /* alkatrész-állapotok: időzítő, meghúzott tekercs, Fi-relé */
    const uctx: SolveCtx = {
      now,
      rails: (t) => at(full(t)),
      live: (k) => !!live[k],
      shorted: (t) => shorts.has(dsu.find(full(t))),
      earth: () => earthFault,
      same: (a, b) => dsu.find(full(a)) === dsu.find(full(b)),
    };
    for (const p of parts) {
      const def = PARTS[p.type];
      if (!def?.update) continue;
      cur = p;
      def.update(p.st, p, uctx);
    }

    /* szelektív kioldás */
    if (shorts.size) {
      let best: { p: PartInstance; keep: number } | null = null;
      for (const p of parts) {
        const def = PARTS[p.type];
        if (!def?.protect || !isClosed(p)) continue;
        const onFault = def.protect.poles.some((t) => shorts.has(dsu.find(`${p.id}.${t}`)));
        if (!onFault) continue;
        const d2 = buildDsu(p.id);
        const r2 = railsFor(d2, p.id);
        if (faultsFor(r2.rails).shorts.size) continue; /* nem ez a hibás ág */
        const keep = energizedCount(r2.at);
        if (!best || keep > best.keep) best = { p, keep };
      }
      if (best) {
        best.p.st.tripped = true;
      } else {
        /* egyetlen eszköz bontása sem szünteti meg - mind kiold, ami érintett */
        for (const p of parts) {
          const def = PARTS[p.type];
          if (!def?.protect || !isClosed(p)) continue;
          if (def.protect.poles.some((t) => shorts.has(dsu.find(`${p.id}.${t}`)))) {
            p.st.tripped = true;
          }
        }
      }
    }

    const sig = JSON.stringify([Object.keys(live).sort(), parts.map((q) => q.st)]);
    if (seen.length && seen[seen.length - 1] === sig) break;
    if (seen.indexOf(sig) >= 0) {
      oscillating = true;
      break;
    }
    seen.push(sig);
  }

  const fRails = rails;
  const fDsu = dsu;
  const fShorts = shorts;
  const fLive = live;
  const fEarth = earthFault;
  const fAt = (t: string): ReadonlySet<Rail> => fRails.get(fDsu.find(t)) || EMPTY;

  return {
    live: fLive,
    shorts: fShorts,
    earthFault: fEarth,
    oscillating,
    railsAt: fAt,
    shortedAt: (t) => fShorts.has(fDsu.find(t)),
    /* ugyanaz a kapocs-feloldás, mint megoldás közben, hogy a rajzolás pontosan
       azt lássa, amit a szimuláció számolt */
    ctxFor: (p) => {
      const f = (t: string) => (t.indexOf('.') >= 0 ? t : `${p.id}.${t}`);
      return {
        now: Date.now(),
        rails: (t) => fAt(f(t)),
        live: (k) => !!fLive[k],
        shorted: (t) => fShorts.has(fDsu.find(f(t))),
        earth: () => fEarth,
        same: (a, b) => fDsu.find(f(a)) === fDsu.find(f(b)),
      };
    },
  };
}
