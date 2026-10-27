/**
 * A szerelőtábla imperatív vezérlője.
 *
 * Szándékosan nem React-komponens: húzás közben másodpercenként több tucatszor
 * kell újrarajzolni negyven készüléket és a kábeleket, amit közvetlen DOM-mal
 * lehet gyorsan megtenni. A React ezt egyetlen konténeren keresztül kezeli, és
 * eseményekkel kapja vissza az állapotot.
 */
import type {
  Board,
  PartInstance,
  Rail,
  SolveResult,
  TaskDef,
  Wire,
  WireColor,
} from '../../domain/electrical-types';
import { hasPhase, solve } from '../../domain/netlist';
import { PARTS, TIMER_MS, termsOf, widthOf } from '../../data/parts';

export type BoardMode = 'wire' | 'run';

export interface BoardOptions {
  task: TaskDef;
  mode: BoardMode;
  /** Kiemelendő alkatrész- vagy kapocs-azonosítók (vezetett mód, hibajelzés). */
  highlight?: string[];
  /** Csak a főáramkör vagy csak a vezérlés látszódjon. */
  onChange?(board: Board, sim: SolveResult): void;
  onSelect?(wireId: string | null): void;
}

const ROLE_COLOR: Record<string, WireColor> = { L: 'br', N: 'bl', PE: 'gy' };
const BASE_TILT = { x: 6, y: -4 };

interface DragState {
  kind: 'pan' | 'part' | 'handle' | 'wire' | 'hold';
  sx?: number;
  sy?: number;
  vx?: number;
  vy?: number;
  tx?: number;
  ty?: number;
  orbit?: boolean;
  part?: PartInstance;
  el?: SVGGElement;
  dx?: number;
  dy?: number;
  moved?: boolean;
  w?: Wire;
  from?: string;
}

export class BoardEngine {
  board: Board = { parts: [], wires: [] };
  sim: SolveResult | null = null;
  mode: BoardMode = 'wire';
  color: WireColor = 'br';
  armed: string | null = null;
  snap: string | null = null;
  selected: string | null = null;
  flat = false;

  private task!: TaskDef;
  private opts: BoardOptions;
  private view = { x: 0, y: 0, z: 1 };
  private tilt = { ...BASE_TILT };
  private wid = 1;
  private drag: DragState | null = null;
  private pointers = new Map<number, { x: number; y: number }>();
  private pinch: { d: number; cx: number; cy: number } | null = null;
  private tick = 0;
  private stairWasRunning = false;
  private highlight = new Set<string>();

  private stage: HTMLDivElement;
  private viewport: HTMLDivElement;
  private plate: HTMLDivElement;
  private boardEl: HTMLDivElement;
  private svg: SVGSVGElement;
  private gShadow: SVGGElement;
  private gParts: SVGGElement;
  private gCables: SVGGElement;
  private gTerms: SVGGElement;
  private gGhost: SVGGElement;

  constructor(host: HTMLElement, opts: BoardOptions) {
    this.opts = opts;
    host.innerHTML = '';
    host.classList.add('board-scope');

    this.stage = el('div', 'ee-stage tech-grid');
    this.viewport = el('div', 'ee-viewport');
    this.boardEl = el('div', 'ee-board');
    this.plate = el('div', 'ee-layer ee-plate');
    const gloss = el('div', 'ee-layer ee-gloss');

    this.svg = document.createElementNS(SVGNS, 'svg');
    this.svg.setAttribute('class', 'ee-layer ee-main');
    this.svg.innerHTML = DEFS;
    this.gShadow = mkG(this.svg);
    this.gParts = mkG(this.svg);
    this.gCables = mkG(this.svg);
    this.gTerms = mkG(this.svg);
    this.gGhost = mkG(this.svg);

    this.boardEl.append(this.plate, this.svg, gloss);
    this.viewport.append(this.boardEl);
    this.stage.append(this.viewport);
    host.append(this.stage);

    this.bind();
    this.setTask(opts.task);
    this.setMode(opts.mode);
  }

  /* ---------------------------------------------------------- életciklus */

  setTask(task: TaskDef, wires?: Wire[]) {
    this.task = task;
    this.board = {
      parts: task.parts.map((p) => {
        const d = PARTS[p.type];
        return { ...p, st: d.init ? d.init() : {} } as PartInstance;
      }),
      wires: [],
    };
    this.wid = 1;
    this.armed = null;
    this.snap = null;
    this.selected = null;
    if (wires) {
      for (const w of wires) {
        if (this.termPos(w.a) && this.termPos(w.b)) {
          this.board.wires.push({ ...w, id: 'w' + this.wid++ });
        }
      }
    }
    const [w, h] = task.world;
    this.boardEl.style.width = w + 'px';
    this.boardEl.style.height = h + 'px';
    this.svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    this.plate.dataset.mark = task.id;
    this.fit();
    this.paint();
  }

  setMode(m: BoardMode) {
    this.mode = m;
    this.armed = null;
    this.snap = null;
    this.selected = null;
    this.gGhost.innerHTML = '';
    this.stage.dataset.mode = m;
    this.paint();
  }

  setColor(c: WireColor) {
    this.color = c;
  }

  setHighlight(ids: string[]) {
    this.highlight = new Set(ids);
    this.paint();
  }

  setFlat(flat: boolean) {
    this.flat = flat;
    this.applyTilt();
  }

  destroy() {
    window.clearInterval(this.tick);
    this.stage.remove();
  }

  /* ------------------------------------------------------------ műveletek */

  applySolution() {
    this.board.wires = this.task.solution.map((s) => ({
      id: 'w' + this.wid++,
      a: s[0],
      b: s[1],
      color: s[2],
      m: null,
    }));
    this.energiseForDemo();
    this.paint();
  }

  /** Egyetlen hiányzó kötés felfedése. */
  addWire(a: string, b: string, color: WireColor) {
    this.board.wires.push({ id: 'w' + this.wid++, a, b, color, m: null });
    this.paint();
  }

  removeWire(id: string) {
    this.board.wires = this.board.wires.filter((w) => w.id !== id);
    if (this.selected === id) this.selected = null;
    this.paint();
  }

  clearWires() {
    this.board.wires = [];
    this.selected = null;
    this.paint();
  }

  setWires(wires: Wire[]) {
    this.board.wires = wires.map((w) => ({ ...w }));
    this.paint();
  }

  togglePower() {
    const on = this.powered();
    for (const p of this.board.parts) if (PARTS[p.type].supply) p.st.on = !on;
    this.paint();
  }

  powered() {
    return this.board.parts.some((p) => PARTS[p.type].supply && p.st.on);
  }

  /** A megoldás bemutatásakor a tábla üzemkész legyen, különben halottnak látszik. */
  energiseForDemo() {
    for (const p of this.board.parts) {
      if (PARTS[p.type].supply || p.type === 'mprot' || p.type === 'mainsw') p.st.on = true;
      if (p.st.tripped) p.st.tripped = false;
    }
  }

  resetDevices() {
    for (const p of this.board.parts) {
      const d = PARTS[p.type];
      p.st = d.init ? d.init() : {};
    }
    this.paint();
  }

  fit() {
    const r = this.stage.getBoundingClientRect();
    if (!r.width) return;
    const [w, h] = this.task.world;
    const pad = r.width < 700 ? 16 : 40;
    const z = Math.min((r.width - pad) / w, (r.height - pad) / h);
    this.view.z = Math.max(r.width < 700 ? 0.16 : 0.3, Math.min(1.4, z));
    this.view.x = (r.width - w * this.view.z) / 2;
    const used = h * this.view.z;
    this.view.y = used <= r.height ? (r.height - used) / 2 : pad / 2;
    this.applyView();
  }

  zoomBy(factor: number) {
    const r = this.stage.getBoundingClientRect();
    this.zoomAt(r.left + r.width / 2, r.top + r.height / 2, factor);
  }

  /* ------------------------------------------------------------- rajzolás */

  paint() {
    this.sim = solve(this.board, Date.now());
    const sim = this.sim;
    const ph: string[] = [];
    const th: string[] = [];

    for (const p of this.board.parts) {
      const d = PARTS[p.type];
      const ctx = sim.ctxFor(p);
      const hi = this.highlight.has(p.id) ? ' is-highlight' : '';
      ph.push(
        `<g class="ee-part${hi}" data-part="${p.id}" transform="translate(${p.x},${p.y})">${d.draw(p, p.st, ctx)}</g>`
      );
      for (const t of termsOf(p)) {
        const key = `${p.id}.${t.id}`;
        const rails = sim.railsAt(key);
        let cls = 'term';
        if (sim.shortedAt(key)) cls += ' short';
        else if (hasPhase(rails as ReadonlySet<Rail>)) cls += ' hot';
        else if (rails.has('N')) cls += ' neutral';
        if (this.armed === key) cls += ' armed';
        if (this.snap === key) cls += ' snap';
        if (this.highlight.has(key)) cls += ' is-highlight';
        const x = p.x + t.x;
        const y = p.y + t.y;
        const lo = labelOffset(t.dir);
        th.push(
          `<g class="${cls}" data-term="${key}" role="button" tabindex="0" aria-label="${escapeXml(
            `${p.label || p.id} ${t.t || t.id} sorkapocs`
          )}">` +
            `<circle class="hit" cx="${x}" cy="${y}" r="${this.hitR()}"/>` +
            `<circle class="tscrew" cx="${x}" cy="${y}" r="8"/>` +
            `<path class="tslot" d="M${x - 4},${y} h8"/>` +
            (t.t ? `<text class="tlabel" x="${x + lo[0]}" y="${y + lo[1]}">${escapeXml(t.t)}</text>` : '') +
            `</g>`
        );
      }
    }
    this.gParts.innerHTML = ph.join('');
    this.gTerms.innerHTML = th.join('');
    this.paintCables();
    this.opts.onChange?.(this.board, sim);
  }

  private paintCables() {
    const sim = this.sim;
    const cs: string[] = [];
    const sh: string[] = [];
    for (const w of this.board.wires) {
      const a = this.termPos(w.a);
      const b = this.termPos(w.b);
      if (!a || !b) continue;
      const d = cableD(a, b, w.m || null, w.id);
      const hot = sim && hasPhase(sim.railsAt(w.a) as ReadonlySet<Rail>);
      const bad = sim && sim.shortedAt(w.a);
      sh.push(`<path class="cshadow" d="${d}" transform="translate(6,11)"/>`);
      cs.push(
        `<path class="cable c-${w.color}${this.selected === w.id ? ' sel' : ''}" data-wire="${w.id}" d="${d}"/>`
      );
      cs.push(`<path class="chi" d="${d}" transform="translate(-1.5,-2)" opacity="0.35"/>`);
      if (w.color === 'gy') cs.push(`<path class="cstripe" d="${d}"/>`);
      if (hot || bad) cs.push(`<path class="cflow${bad ? ' cfault' : ''}" d="${d}"/>`);
      if (this.selected === w.id) {
        const m = this.cableMid(w)!;
        cs.push(
          `<circle class="chandle" data-handle="${w.id}" cx="${m.x}" cy="${m.y}" r="13"><title>Húzd, hogy elrendezd</title></circle>`
        );
        cs.push(
          `<g class="cdel" data-del="${w.id}" role="button" tabindex="0" aria-label="Kábel törlése">` +
            `<circle class="cdelbg" cx="${m.x + 44}" cy="${m.y - 30}" r="19"/>` +
            `<path class="cdelx" d="M${m.x + 36},${m.y - 38} l16,16 M${m.x + 52},${m.y - 38} l-16,16"/></g>`
        );
      }
    }
    this.gShadow.innerHTML = sh.join('');
    this.gCables.innerHTML = cs.join('');
  }

  /* -------------------------------------------------------------- geometria */

  private hitR() {
    return Math.max(20, Math.round(22 / this.view.z));
  }

  termPos(key: string) {
    const dot = key.indexOf('.');
    const p = this.board.parts.find((q) => q.id === key.slice(0, dot));
    if (!p) return null;
    const t = termsOf(p).find((q) => q.id === key.slice(dot + 1));
    if (!t) return null;
    return { x: p.x + t.x, y: p.y + t.y, dir: t.dir, t, p };
  }

  termName(key: string) {
    const t = this.termPos(key);
    return t ? `${t.p.label || t.p.id} ${t.t.t || t.t.id}` : key;
  }

  private cableMid(w: Wire) {
    const a = this.termPos(w.a);
    const b = this.termPos(w.b);
    if (!a || !b) return null;
    return w.m ? { x: w.m[0], y: w.m[1] } : defaultMid(a, b, jitter(w.id));
  }

  private nearestTerm(pt: { x: number; y: number }, exclude: string) {
    const R = Math.max(52, 46 / this.view.z);
    let best: string | null = null;
    let bd = R * R;
    for (const p of this.board.parts) {
      for (const t of termsOf(p)) {
        const key = `${p.id}.${t.id}`;
        if (key === exclude) continue;
        const dx = p.x + t.x - pt.x;
        const dy = p.y + t.y - pt.y;
        const d = dx * dx + dy * dy;
        if (d < bd) {
          bd = d;
          best = key;
        }
      }
    }
    return best;
  }

  private applyView() {
    this.viewport.style.transform = `translate(${this.view.x}px,${this.view.y}px) scale(${this.view.z})`;
  }

  private applyTilt() {
    this.boardEl.style.transform = this.flat
      ? 'perspective(2400px)'
      : `perspective(2400px) rotateX(${this.tilt.x.toFixed(2)}deg) rotateY(${this.tilt.y.toFixed(2)}deg)`;
  }

  private zoomAt(cx: number, cy: number, factor: number) {
    const r = this.stage.getBoundingClientRect();
    const px = cx - r.left;
    const py = cy - r.top;
    const nz = Math.max(0.12, Math.min(3, this.view.z * factor));
    this.view.x = px - (px - this.view.x) * (nz / this.view.z);
    this.view.y = py - (py - this.view.y) * (nz / this.view.z);
    this.view.z = nz;
    this.applyView();
  }

  /** Képernyő -> tábla koordináta, a 3D vetítést is visszafejtve. */
  private toWorld(cx: number, cy: number) {
    const r = this.stage.getBoundingClientRect();
    let x = (cx - r.left - this.view.x) / this.view.z;
    let y = (cy - r.top - this.view.y) / this.view.z;
    const M = matrixOf(this.boardEl);
    if (M) {
      const ox = this.task.world[0] / 2;
      const oy = this.task.world[1] / 2;
      const p = unproject(M, x - ox, y - oy);
      x = p[0] + ox;
      y = p[1] + oy;
    }
    return { x, y };
  }

  /* ------------------------------------------------------------ interakció */

  private bind() {
    const capture = (e: PointerEvent) => {
      try {
        this.stage.setPointerCapture(e.pointerId);
      } catch {
        /* néhány böngésző eldobja - a húzás ettől még megy */
      }
    };

    this.stage.addEventListener('pointerdown', (e) => {
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.pointers.size === 2) {
        const a = [...this.pointers.values()];
        this.pinch = {
          d: Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y),
          cx: (a[0].x + a[1].x) / 2,
          cy: (a[0].y + a[1].y) / 2,
        };
        this.drag = null;
        return;
      }
      if (this.pointers.size > 1) return;

      const t = e.target as Element;
      const tEl = t.closest?.('[data-term]') as HTMLElement | null;
      const hEl = t.closest?.('[data-handle]') as HTMLElement | null;
      const dEl = t.closest?.('[data-del]') as HTMLElement | null;
      const wEl = t.closest?.('[data-wire]') as HTMLElement | null;
      const pEl = t.closest?.('[data-part]') as SVGGElement | null;
      this.boardEl.classList.add('free');

      if (this.mode === 'run') {
        if (pEl) {
          const p = this.byId(pEl.dataset.part!)!;
          const d = PARTS[p.type];
          if (d.hold) {
            p.st.p = true;
            this.paint();
            this.drag = { kind: 'hold', part: p };
            capture(e);
            return;
          }
          if (d.tap) {
            d.tap(p.st);
            this.paint();
            return;
          }
        }
        this.startPan(e, capture);
        return;
      }

      if (dEl) {
        this.removeWire(dEl.dataset.del!);
        return;
      }
      if (hEl) {
        this.drag = { kind: 'handle', w: this.board.wires.find((q) => q.id === hEl.dataset.handle) };
        capture(e);
        return;
      }
      if (tEl) {
        const key = tEl.dataset.term!;
        if (this.armed && this.armed !== key) {
          this.connect(key);
          return;
        }
        const t0 = this.termPos(key);
        if (t0?.t.role && ROLE_COLOR[t0.t.role]) this.color = ROLE_COLOR[t0.t.role];
        this.armed = key;
        this.snap = null;
        this.drag = { kind: 'wire', from: key, moved: false, sx: e.clientX, sy: e.clientY };
        capture(e);
        this.paint();
        this.drawGhost(key, this.toWorld(e.clientX, e.clientY));
        return;
      }
      if (wEl) {
        this.selected = this.selected === wEl.dataset.wire ? null : wEl.dataset.wire!;
        this.opts.onSelect?.(this.selected);
        this.paintCables();
        return;
      }
      if (pEl) {
        const pp = this.byId(pEl.dataset.part!)!;
        /* Gyakorlás közben is élő a tábla: a nyomógombot nyomva tartod, a
           kapcsolót koppintással váltod (húzással továbbra is áthelyezhető). */
        if (PARTS[pp.type].hold) {
          pp.st.p = true;
          this.paint();
          this.drag = { kind: 'hold', part: pp };
          capture(e);
          return;
        }
        const w0 = this.toWorld(e.clientX, e.clientY);
        this.drag = { kind: 'part', part: pp, dx: w0.x - pp.x, dy: w0.y - pp.y, moved: false, el: pEl, sx: e.clientX, sy: e.clientY };
        pEl.classList.add('dragging');
        capture(e);
        return;
      }
      this.selected = null;
      this.armed = null;
      this.snap = null;
      this.gGhost.innerHTML = '';
      this.paint();
      this.startPan(e, capture);
    });

    this.stage.addEventListener('pointermove', (e) => {
      if (this.pointers.has(e.pointerId)) this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.pinch && this.pointers.size === 2) {
        const a = [...this.pointers.values()];
        const d = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y);
        const cx = (a[0].x + a[1].x) / 2;
        const cy = (a[0].y + a[1].y) / 2;
        if (this.pinch.d > 0) this.zoomAt(cx, cy, d / this.pinch.d);
        this.view.x += cx - this.pinch.cx;
        this.view.y += cy - this.pinch.cy;
        this.applyView();
        this.pinch = { d, cx, cy };
        return;
      }
      const drag = this.drag;
      if (drag?.kind === 'wire') {
        if (Math.abs(e.clientX - drag.sx!) + Math.abs(e.clientY - drag.sy!) > 6) drag.moved = true;
        const wp = this.toWorld(e.clientX, e.clientY);
        const sn = this.nearestTerm(wp, drag.from!);
        if (sn !== this.snap) {
          this.snap = sn;
          this.markSnap();
        }
        this.drawGhost(drag.from!, wp);
        return;
      }
      if (!drag) return;
      if (drag.kind === 'pan') {
        if (drag.orbit) {
          this.tilt.x = clamp(drag.tx! - (e.clientY - drag.sy!) * 0.13, -28, 28);
          this.tilt.y = clamp(drag.ty! + (e.clientX - drag.sx!) * 0.13, -32, 32);
          this.applyTilt();
        } else {
          this.view.x = drag.vx! + (e.clientX - drag.sx!);
          this.view.y = drag.vy! + (e.clientY - drag.sy!);
          this.applyView();
        }
      } else if (drag.kind === 'part') {
        /* apró remegés még koppintás, nem áthelyezés */
        if (!drag.moved && Math.abs(e.clientX - drag.sx!) + Math.abs(e.clientY - drag.sy!) < 6) return;
        const w1 = this.toWorld(e.clientX, e.clientY);
        drag.part!.x = Math.round((w1.x - drag.dx!) / 10) * 10;
        drag.part!.y = Math.round((w1.y - drag.dy!) / 10) * 10;
        drag.moved = true;
        drag.el!.setAttribute('transform', `translate(${drag.part!.x},${drag.part!.y})`);
        this.paintTermsFast();
        this.paintCables();
      } else if (drag.kind === 'handle') {
        const w2 = this.toWorld(e.clientX, e.clientY);
        drag.w!.m = [Math.round(w2.x), Math.round(w2.y)];
        this.paintCables();
      }
    });

    const end = (e: PointerEvent) => {
      this.pointers.delete(e.pointerId);
      if (this.pointers.size < 2) this.pinch = null;
      this.boardEl.classList.remove('free');
      const drag = this.drag;
      if (!drag) return;
      if (drag.kind === 'hold') {
        drag.part!.st.p = false;
        this.paint();
      }
      if (drag.kind === 'part') {
        drag.el!.classList.remove('dragging');
        const tap = PARTS[drag.part!.type].tap;
        if (!drag.moved && tap) {
          tap(drag.part!.st);
          this.paint();
        }
      }
      if (drag.kind === 'wire') {
        const to = this.snap;
        this.snap = null;
        if (to) this.connect(to);
        else if (drag.moved) {
          this.armed = null;
          this.gGhost.innerHTML = '';
          this.paint();
        }
      }
      this.drag = null;
    };
    this.stage.addEventListener('pointerup', end);
    this.stage.addEventListener('pointercancel', end);

    this.stage.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        this.zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.12 : 1 / 1.12);
      },
      { passive: false }
    );

    this.stage.addEventListener('contextmenu', (e) => {
      const wEl = (e.target as Element).closest?.('[data-wire]') as HTMLElement | null;
      if (wEl) {
        e.preventDefault();
        this.removeWire(wEl.dataset.wire!);
      }
    });

    /* billentyűzetes bekötés: a sorkapocs fókuszálható, Enter köti össze */
    this.stage.addEventListener('keydown', (e) => {
      const tEl = (e.target as Element).closest?.('[data-term]') as HTMLElement | null;
      if (tEl && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        const key = tEl.dataset.term!;
        if (this.armed && this.armed !== key) this.connect(key);
        else {
          this.armed = key;
          this.paint();
        }
      }
      const dEl = (e.target as Element).closest?.('[data-del]') as HTMLElement | null;
      if (dEl && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        this.removeWire(dEl.dataset.del!);
      }
    });

    this.applyTilt();
    this.tick = window.setInterval(() => {
      const now = Date.now();
      const running = this.board.parts.some(
        (p) =>
          (p.type === 'stair' && (p.st.until || 0) > now) ||
          (p.type === 'timer' && !!p.st.since && now - p.st.since < TIMER_MS + 400)
      );
      if (running || this.stairWasRunning) this.paint();
      this.stairWasRunning = running;
    }, 200);
  }

  private startPan(e: PointerEvent, capture: (e: PointerEvent) => void) {
    this.drag = {
      kind: 'pan',
      sx: e.clientX,
      sy: e.clientY,
      vx: this.view.x,
      vy: this.view.y,
      orbit: e.shiftKey || e.altKey,
      tx: this.tilt.x,
      ty: this.tilt.y,
    };
    capture(e);
  }

  private connect(to: string) {
    const from = this.armed!;
    const dup = this.board.wires.some(
      (w) => (w.a === from && w.b === to) || (w.b === from && w.a === to)
    );
    if (!dup) this.board.wires.push({ id: 'w' + this.wid++, a: from, b: to, color: this.color, m: null });
    this.armed = null;
    this.snap = null;
    this.gGhost.innerHTML = '';
    this.paint();
  }

  private markSnap() {
    for (const g of Array.from(this.gTerms.children)) {
      g.classList.toggle('snap', (g as HTMLElement).dataset.term === this.snap);
    }
  }

  private drawGhost(fromKey: string, pt: { x: number; y: number }) {
    const a = this.termPos(fromKey);
    if (!a) return;
    const t = this.snap ? this.termPos(this.snap)! : { x: pt.x, y: pt.y, dir: 'w' as const };
    let s = `<path class="cable ghost c-${this.color}${this.snap ? ' locked' : ''}" d="${cableD(a, t, null, '')}"/>`;
    if (this.snap) {
      const ly = t.y < 96 ? t.y + 34 : t.y - 62;
      s +=
        `<circle class="snapring" cx="${t.x}" cy="${t.y}" r="20"/>` +
        `<rect class="snaplabelbg" x="${t.x - 70}" y="${ly}" width="140" height="30" rx="8"/>` +
        `<text class="snaplabel" x="${t.x}" y="${ly + 20}">${escapeXml(this.termName(this.snap))}</text>`;
    }
    this.gGhost.innerHTML = s;
  }

  private paintTermsFast() {
    for (const g of Array.from(this.gTerms.children)) {
      const key = (g as HTMLElement).dataset.term!;
      const t = this.termPos(key);
      if (!t) continue;
      const c = g.children;
      c[0].setAttribute('cx', String(t.x));
      c[0].setAttribute('cy', String(t.y));
      c[1].setAttribute('cx', String(t.x));
      c[1].setAttribute('cy', String(t.y));
      c[2].setAttribute('d', `M${t.x - 4},${t.y} h8`);
      if (c[3]) {
        const lo = labelOffset(t.dir);
        c[3].setAttribute('x', String(t.x + lo[0]));
        c[3].setAttribute('y', String(t.y + lo[1]));
      }
    }
  }

  private byId(id: string) {
    return this.board.parts.find((p) => p.id === id);
  }
}

/* ------------------------------------------------------------- segédek */

const SVGNS = 'http://www.w3.org/2000/svg';

function el(tag: string, cls: string) {
  const d = document.createElement(tag) as HTMLDivElement;
  d.className = cls;
  return d;
}

function mkG(svg: SVGSVGElement) {
  const g = document.createElementNS(SVGNS, 'g');
  svg.append(g);
  return g;
}

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

function escapeXml(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}

function labelOffset(dir: string): [number, number] {
  return dir === 'n' ? [0, -14] : dir === 's' ? [0, 22] : dir === 'w' ? [-16, 4] : [16, 4];
}

function dirVec(d: string): [number, number] {
  return d === 'n' ? [0, -1] : d === 's' ? [0, 1] : d === 'w' ? [-1, 0] : [1, 0];
}

/** Az azonos kapocsból induló kábelek különben pontosan fednék egymást. */
function jitter(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return ((h % 7) - 3) * 5;
}

function defaultMid(a: { x: number; y: number }, b: { x: number; y: number }, j: number) {
  const L = Math.hypot(b.x - a.x, b.y - a.y);
  return { x: (a.x + b.x) / 2 + j, y: (a.y + b.y) / 2 + Math.min(20, L * 0.05) };
}

function cableD(
  a: { x: number; y: number; dir: string },
  b: { x: number; y: number; dir: string },
  m: [number, number] | null,
  id: string
) {
  const L = Math.hypot(b.x - a.x, b.y - a.y);
  const k = Math.min(48, Math.max(18, L * 0.16));
  const j = id ? jitter(id) : 0;
  const va = dirVec(a.dir);
  const vb = dirVec(b.dir);
  const c1x = a.x + va[0] * k - va[1] * j;
  const c1y = a.y + va[1] * k + va[0] * j;
  const c2x = b.x + vb[0] * k - vb[1] * j;
  const c2y = b.y + vb[1] * k + vb[0] * j;
  const mid = m ? { x: m[0], y: m[1] } : defaultMid(a, b, j);
  const tx = b.x - a.x;
  const ty = b.y - a.y;
  const tl = Math.hypot(tx, ty) || 1;
  const t = Math.min(70, L * 0.26);
  return (
    `M${a.x},${a.y} C${c1x},${c1y} ${mid.x - (tx / tl) * t},${mid.y - (ty / tl) * t} ${mid.x},${mid.y}` +
    ` C${mid.x + (tx / tl) * t},${mid.y + (ty / tl) * t} ${c2x},${c2y} ${b.x},${b.y}`
  );
}

function matrixOf(node: HTMLElement): number[] | null {
  const t = getComputedStyle(node).transform;
  if (!t || t === 'none') return null;
  const nums = t.slice(t.indexOf('(') + 1, -1).split(',').map(parseFloat);
  if (nums.length === 6) return [nums[0], nums[1], 0, 0, nums[2], nums[3], 0, 0, 0, 0, 1, 0, nums[4], nums[5], 0, 1];
  return nums.length === 16 ? nums : null;
}

/** Perspektivikus vetítés visszafejtése a z=0 síkon - két ismeretlenes rendszer. */
function unproject(M: number[], sx: number, sy: number): [number, number] {
  const a11 = M[0] - sx * M[3];
  const a12 = M[4] - sx * M[7];
  const b1 = sx * M[15] - M[12];
  const a21 = M[1] - sy * M[3];
  const a22 = M[5] - sy * M[7];
  const b2 = sy * M[15] - M[13];
  const det = a11 * a22 - a12 * a21;
  if (!det) return [sx, sy];
  return [(b1 * a22 - a12 * b2) / det, (a11 * b2 - b1 * a21) / det];
}

export { widthOf };

const DEFS = `<defs>
<linearGradient id="gFace" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#f3f1ec"/><stop offset="1" stop-color="#d6d3ca"/></linearGradient>
<linearGradient id="gDark" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#333b46"/><stop offset="1" stop-color="#1d232b"/></linearGradient>
<linearGradient id="gKey" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#e9e7e1"/><stop offset="1" stop-color="#cfccc3"/></linearGradient>
<radialGradient id="gMotor"><stop offset="0" stop-color="#eceae4"/><stop offset="1" stop-color="#c4c1b8"/></radialGradient>
<radialGradient id="gGlow"><stop offset="0" stop-color="#ffd77a" stop-opacity="0.85"/><stop offset="1" stop-color="#ffb43c" stop-opacity="0"/></radialGradient>
<radialGradient id="gGlowR"><stop offset="0" stop-color="#ff6a5a" stop-opacity="0.8"/><stop offset="1" stop-color="#ff4433" stop-opacity="0"/></radialGradient>
<radialGradient id="gGlowG"><stop offset="0" stop-color="#6ff0a4" stop-opacity="0.8"/><stop offset="1" stop-color="#22c55e" stop-opacity="0"/></radialGradient>
<filter id="fGlow" x="-120%" y="-120%" width="340%" height="340%"><feGaussianBlur stdDeviation="3.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="fSel" x="-60%" y="-60%" width="220%" height="220%"><feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="#ffffff" flood-opacity="0.8"/></filter>
<filter id="fSoft" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="7"/></filter>
</defs>`;
