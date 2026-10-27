/**
 * Készülékkönyvtár. Minden típus megadja a méretét, a sorkapcsait, a belső
 * kötéseit, a fogyasztóit és a saját SVG rajzát. A sorkapcsokat a rajzoló
 * komponens teszi ki, hogy egyformán nézzenek ki és egyformán lehessen rájuk
 * kötni.
 *
 * A rajzoló függvények SVG szövegrészletet adnak vissza egy <g> elembe. Ez
 * szándékos: így a hét feladat teljes vizuális nyelve egyetlen adatvezérelt
 * helyen marad, React komponensek szétszórása nélkül.
 */
import type { PartDef, PartInstance, PartState, SolveCtx, Terminal } from '../domain/electrical-types';
import { hasPhase, phaseOf } from '../domain/netlist';

  /* --- kozos rajzelemek ------------------------------------------------ */
  const LIFT = 11; /* az extrudalt oldallap magassaga - ettol all ki a tabla sikjabol */

  function shell(w: number, h: number, cls?: string): string {
    cls = cls || 'face';
    const dark = cls !== 'face';
    return (
      '<rect class="shadow" x="10" y="' + (LIFT + 8) + '" width="' + w + '" height="' + h + '" rx="14"/>' +
      '<rect class="side' + (dark ? ' side-dark' : '') + '" x="5" y="' + LIFT + '" width="' + w + '" height="' + h + '" rx="13"/>' +
      '<rect class="' + cls + '" x="0" y="0" width="' + w + '" height="' + h + '" rx="12"/>' +
      '<rect class="bevel" x="1.5" y="1.5" width="' + (w - 3) + '" height="' + (h - 3) + '" rx="11"/>'
    );
  }

  function label(w: number, h: number, txt: string): string {
    return '<text class="pname" x="' + w / 2 + '" y="' + (h + LIFT + 22) + '">' + txt + '</text>';
  }

  function din(w: number, h: number): string {
    return '<rect class="din" x="8" y="' + (h / 2 - 7) + '" width="' + (w - 16) + '" height="14" rx="3"/>';
  }

  /* A definiciok szerkezetet a tesztek ellenorzik; a laza indexelt tipus csak
   azert kell, hogy a sorkapocs-literalok ne igenyeljenek egyenkenti castot. */
const RAW: Record<string, unknown> = {};
const PARTS = RAW as unknown as Record<string, PartDef>;

  /* --- betaplalas ------------------------------------------------------ */
  RAW.feed = {
    name: 'Betáplálás',
    supply: true,
    w: 150,
    h: 190,
    terms: [
      { id: 'L1', x: 150, y: 50, dir: 'e', role: 'L', t: 'L1' },
      { id: 'N', x: 150, y: 95, dir: 'e', role: 'N', t: 'N' },
      { id: 'PE', x: 150, y: 140, dir: 'e', role: 'PE', t: 'PE' }
    ],
    init: function () {
      return { on: false };
    },
    sources: function (st: PartState) {
      return st.on ? [['L1', 'L1'], ['N', 'N'], ['PE', 'PE']] : [];
    },
    tap: function (st: PartState) {
      st.on = !st.on;
    },
    draw: function (_p: PartInstance, st: PartState) {
      return (
        shell(150, 190, 'face-dark') +
        '<text class="ptitle" x="16" y="32">HÁLÓZAT</text>' +
        '<text class="pmeta" x="16" y="52">230 V / 50 Hz</text>' +
        '<path class="wavy" d="M18,120 q14,-22 28,0 t28,0 t28,0"/>' +
        (st.on ? '<circle class="coilled" cx="120" cy="120" r="9"/>' : '<circle class="pilotcap" cx="120" cy="120" r="9"/>') +
        label(150, 190, st.on ? 'feszültség alatt' : 'feszültségmentes')
      );
    }
  };

  /* --- Fi-rele --------------------------------------------------------- */
  RAW.rcd = {
    name: 'Fi-relé',
    w: 150,
    wOf: function (p: PartInstance) { return p.opt && p.opt.poles === 4 ? 240 : 150; },
    h: 160,
    /* ket polus (1P+N) az alapertelmezett; opt.poles = 4 eseten haromfazisu */
    terms: function (p: PartInstance): Terminal[] {
      if (!p.opt || p.opt.poles !== 4) {
        return [
          { id: 'L1', x: 42, y: 0, dir: 'n', role: 'L', t: '1' },
          { id: 'N1', x: 108, y: 0, dir: 'n', role: 'N', t: 'N' },
          { id: 'L2', x: 42, y: 160, dir: 's', role: 'L', t: '2' },
          { id: 'N2', x: 108, y: 160, dir: 's', role: 'N', t: 'N' }
        ];
      }
      return [
        { id: 'L1', x: 40, y: 0, dir: 'n', role: 'L', t: 'L1' },
        { id: 'L2', x: 92, y: 0, dir: 'n', role: 'L', t: 'L2' },
        { id: 'L3', x: 144, y: 0, dir: 'n', role: 'L', t: 'L3' },
        { id: 'N1', x: 200, y: 0, dir: 'n', role: 'N', t: 'N' },
        { id: 'T1', x: 40, y: 160, dir: 's', role: 'L', t: 'T1' },
        { id: 'T2', x: 92, y: 160, dir: 's', role: 'L', t: 'T2' },
        { id: 'T3', x: 144, y: 160, dir: 's', role: 'L', t: 'T3' },
        { id: 'N2', x: 200, y: 160, dir: 's', role: 'N', t: 'N' }
      ];
    },
    protect: { poles: ['L2', 'T1', 'T2', 'T3'] },
    init: function () {
      return { on: true, tripped: false };
    },
    links: function (st: PartState, p: PartInstance) {
      if (!st.on || st.tripped) return [];
      return p.opt && p.opt.poles === 4
        ? [['L1', 'T1'], ['L2', 'T2'], ['L3', 'T3'], ['N1', 'N2']]
        : [['L1', 'L2'], ['N1', 'N2']];
    },
    update: function (st: PartState, _p: PartInstance, ctx: SolveCtx) {
      if (st.on && !st.tripped && ctx.earth()) st.tripped = true;
    },
    tap: function (st: PartState) {
      if (st.tripped) {
        st.tripped = false;
        st.on = true;
      } else st.on = !st.on;
    },
    draw: function (p: PartInstance, st: PartState) {
      const up = st.on && !st.tripped;
      const w = p.opt && p.opt.poles === 4 ? 240 : 150;
      return (
        shell(w, 160) +
        din(w, 160) +
        '<text class="ptitle" x="14" y="30">' + (p.label || 'Fi-1') + '</text>' +
        '<text class="pmeta" x="14" y="48">30 mA / 40 A</text>' +
        '<rect class="lever ' + (up ? 'lv-on' : 'lv-off') + '" x="' + (w - 50) + '" y="' + (up ? 92 : 114) + '" width="34" height="26" rx="5"/>' +
        '<text class="lvtxt" x="' + (w - 33) + '" y="' + (up ? 110 : 132) + '">' + (up ? 'I' : '0') + '</text>' +
        (st.tripped ? '<circle class="trip" cx="30" cy="118" r="11"/><text class="triptxt" x="30" y="123">!</text>' : '') +
        '<text class="pmeta" x="14" y="' + 122 + '">TEST</text>' +
        label(w, 160, st.tripped ? 'Fi kioldott' : (p.opt && p.opt.poles === 4 ? '4 pólusú Fi-relé' : 'Fi-relé'))
      );
    }
  };

  /* --- kismegszakito 1P ------------------------------------------------ */
  RAW.mcb = {
    name: 'Kismegszakító 1P',
    w: 78,
    h: 150,
    terms: [
      { id: '1', x: 39, y: 0, dir: 'n', role: 'L', t: '1' },
      { id: '2', x: 39, y: 150, dir: 's', role: 'L', t: '2' }
    ],
    protect: { poles: ['2'] },
    init: function () {
      return { on: true, tripped: false };
    },
    links: function (st: PartState) {
      return st.on && !st.tripped ? [['1', '2']] : [];
    },
    tap: function (st: PartState) {
      if (st.tripped) {
        st.tripped = false;
        st.on = true;
      } else st.on = !st.on;
    },
    draw: function (p: PartInstance, st: PartState) {
      const up = st.on && !st.tripped;
      return (
        shell(78, 150) +
        din(78, 150) +
        '<text class="ptitle sm" x="39" y="26">' + (p.label || 'F') + '</text>' +
        '<text class="pmeta sm" x="39" y="44">B10</text>' +
        '<rect class="lever ' + (up ? 'lv-on' : 'lv-off') + '" x="22" y="' + (up ? 86 : 108) + '" width="34" height="26" rx="5"/>' +
        '<text class="lvtxt" x="39" y="' + (up ? 104 : 126) + '">' + (up ? 'I' : '0') + '</text>' +
        label(78, 150, st.tripped ? 'lekapcsolt' : '')
      );
    }
  };

  /* --- kismegszakito 3x1P ---------------------------------------------- */
  RAW.mcb3 = {
    name: 'Kismegszakító 3×1P',
    w: 200,
    h: 150,
    terms: [
      { id: '1a', x: 40, y: 0, dir: 'n', role: 'L', t: '1' },
      { id: '1b', x: 100, y: 0, dir: 'n', role: 'L', t: '1' },
      { id: '1c', x: 160, y: 0, dir: 'n', role: 'L', t: '1' },
      { id: '2a', x: 40, y: 150, dir: 's', role: 'L', t: '2' },
      { id: '2b', x: 100, y: 150, dir: 's', role: 'L', t: '2' },
      { id: '2c', x: 160, y: 150, dir: 's', role: 'L', t: '2' }
    ],
    protect: { poles: ['2a', '2b', '2c'] },
    init: function () {
      return { on: true, tripped: false };
    },
    links: function (st: PartState) {
      return st.on && !st.tripped ? [['1a', '2a'], ['1b', '2b'], ['1c', '2c']] : [];
    },
    tap: function (st: PartState) {
      if (st.tripped) {
        st.tripped = false;
        st.on = true;
      } else st.on = !st.on;
    },
    draw: function (p: PartInstance, st: PartState) {
      const up = st.on && !st.tripped;
      let s = shell(200, 150) + din(200, 150) +
        '<text class="ptitle" x="14" y="28">' + (p.label || 'F-1') + '</text>' +
        '<text class="pmeta" x="14" y="46">B10 A · 3×1P</text>';
      for (let i = 0; i < 3; i++) {
        s += '<rect class="lever ' + (up ? 'lv-on' : 'lv-off') + '" x="' + (23 + i * 60) + '" y="' + (up ? 86 : 108) + '" width="34" height="26" rx="5"/>';
      }
      return s + label(200, 150, st.tripped ? 'kioldott' : '');
    }
  };

  /* --- lepcsohazi automata --------------------------------------------- */
  const STAIR_MS = 7000;
  RAW.stair = {
    name: 'Lépcsőházi automata',
    w: 160,
    h: 160,
    terms: [
      { id: 'L', x: 44, y: 0, dir: 'n', role: 'L', t: 'L' },
      { id: 'N', x: 116, y: 0, dir: 'n', role: 'N', t: 'N' },
      { id: '3', x: 44, y: 160, dir: 's', role: 'L', t: '3' },
      { id: '4', x: 116, y: 160, dir: 's', role: 'L', t: '4' }
    ],
    init: function () {
      return { until: 0 };
    },
    links: function (st: PartState, _p: PartInstance, ctx: SolveCtx) {
      return ctx.now < (st.until || 0) ? [['L', '4']] : [];
    },
    update: function (st: PartState, _p: PartInstance, ctx: SolveCtx) {
      const powered = hasPhase(ctx.rails('L')) && ctx.rails('N').has('N');
      if (powered && hasPhase(ctx.rails('3'))) st.until = ctx.now + STAIR_MS;
    },
    draw: function (p: PartInstance, st: PartState, ctx: SolveCtx) {
      const left = Math.max(0, (st.until || 0) - ctx.now);
      const frac = left / STAIR_MS;
      /* Ha a 3-as kapcson allandoan feszultseg van (pl. bekapcsolva hagyott
         kapcsolo), az automata folyamatosan ujraindul - nem hiba, de jelezni
         kell, kulonben ugy tunik, mintha nem jarna le. */
      const held = hasPhase(ctx.rails('3'));
      const r = 26,
        c = 2 * Math.PI * r;
      return (
        shell(160, 160) +
        din(160, 160) +
        '<text class="ptitle" x="14" y="28">' + (p.label || 'LA-1') + '</text>' +
        '<text class="pmeta" x="14" y="46">lépcsőházi automata</text>' +
        '<circle class="dialbg" cx="80" cy="106" r="' + r + '"/>' +
        (left > 0 && !held
          ? '<circle class="dial" cx="80" cy="106" r="' + r + '" stroke-dasharray="' + c + '" stroke-dashoffset="' + c * (1 - frac) + '"/>'
          : '') +
        (held ? '<circle class="dial dial-held" cx="80" cy="106" r="' + r + '"/>' : '') +
        '<text class="dialtxt" x="80" y="113">' + (held ? '∞' : left > 0 ? Math.ceil(left / 1000) + 's' : '7s') + '</text>' +
        label(160, 160, held ? 'tartós fény - a 3-as kapcson feszültség van' : left > 0 ? 'jár' : '')
      );
    }
  };

  /* --- kapcsolok -------------------------------------------------------- */
  function switchShell(w: number, h: number, title: string, sym: string, sub?: string) {
    return (
      shell(w, h) +
      '<rect class="keystone" x="14" y="14" width="' + (w - 28) + '" height="' + (h - 28) + '" rx="9"/>' +
      sym +
      '<text class="ptag" x="' + w / 2 + '" y="' + (h - 20) + '">' + title + '</text>' +
      (sub || '')
    );
  }

  RAW.sw1 = {
    name: 'Egysarkú kapcsoló',
    w: 112,
    h: 112,
    terms: [
      { id: '1', x: 0, y: 56, dir: 'w', role: 'L', t: '1' },
      { id: '2', x: 112, y: 56, dir: 'e', role: 'L', t: '2' }
    ],
    init: function () {
      return { on: false };
    },
    links: function (st: PartState) {
      return st.on ? [['1', '2']] : [];
    },
    tap: function (st: PartState) {
      st.on = !st.on;
    },
    draw: function (p: PartInstance, st: PartState) {
      var sym =
        '<rect class="rocker ' + (st.on ? 'rk-on' : '') + '" x="32" y="' + (st.on ? 34 : 46) + '" width="48" height="32" rx="6"/>' +
        '<path class="rkline" d="M56,' + (st.on ? 30 : 82) + ' v10"/>';
      return switchShell(112, 112, p.label || 'K', sym) + label(112, 112, 'kapcsoló');
    }
  };

  RAW.sw2 = {
    name: 'Váltókapcsoló',
    w: 112,
    h: 112,
    terms: [
      { id: 'P', x: 0, y: 56, dir: 'w', role: 'L', t: 'P' },
      { id: '1', x: 112, y: 38, dir: 'e', role: 'L', t: '1' },
      { id: '2', x: 112, y: 74, dir: 'e', role: 'L', t: '2' }
    ],
    init: function () {
      return { pos: 0 };
    },
    links: function (st: PartState) {
      return st.pos === 0 ? [['P', '1']] : [['P', '2']];
    },
    tap: function (st: PartState) {
      st.pos = st.pos ? 0 : 1;
    },
    draw: function (p: PartInstance, st: PartState) {
      var sym =
        '<rect class="rocker rk-on" x="32" y="' + (st.pos === 0 ? 34 : 50) + '" width="48" height="30" rx="6"/>' +
        '<path class="pivot" d="M30,56 L74,' + (st.pos === 0 ? 40 : 72) + '"/>';
      return switchShell(112, 112, p.label || 'K', sym) + label(112, 112, 'váltó');
    }
  };

  RAW.swx = {
    name: 'Keresztkapcsoló',
    w: 112,
    h: 112,
    terms: [
      { id: '1', x: 0, y: 38, dir: 'w', role: 'L', t: '1' },
      { id: '2', x: 0, y: 74, dir: 'w', role: 'L', t: '2' },
      { id: '3', x: 112, y: 38, dir: 'e', role: 'L', t: '3' },
      { id: '4', x: 112, y: 74, dir: 'e', role: 'L', t: '4' }
    ],
    init: function () {
      return { pos: 0 };
    },
    links: function (st: PartState) {
      return st.pos === 0 ? [['1', '3'], ['2', '4']] : [['1', '4'], ['2', '3']];
    },
    tap: function (st: PartState) {
      st.pos = st.pos ? 0 : 1;
    },
    draw: function (p: PartInstance, st: PartState) {
      var sym =
        '<rect class="rocker rk-on" x="32" y="' + (st.pos === 0 ? 34 : 50) + '" width="48" height="30" rx="6"/>' +
        (st.pos === 0
          ? '<path class="pivot" d="M30,40 L74,40 M30,72 L74,72"/>'
          : '<path class="pivot" d="M30,40 L74,72 M30,72 L74,40"/>');
      return switchShell(112, 112, p.label || 'K', sym) + label(112, 112, 'kereszt');
    }
  };

  function buttonPart(nc: boolean): PartDef {
    return {
      name: nc ? 'Nyomógomb (bontó)' : 'Nyomógomb (záró)',
      w: 112,
      h: 112,
      hold: true,
      terms: nc
        ? [
            { id: '1', x: 0, y: 56, dir: 'w', role: 'L', t: '1' },
            { id: '2', x: 112, y: 56, dir: 'e', role: 'L', t: '2' }
          ]
        : [
            { id: '3', x: 0, y: 56, dir: 'w', role: 'L', t: '3' },
            { id: '4', x: 112, y: 56, dir: 'e', role: 'L', t: '4' }
          ],
      init: function () {
        return { p: false };
      },
      links: function (st: PartState) {
        const t: [string, string] = nc ? ['1', '2'] : ['3', '4'];
        return (nc ? !st.p : st.p) ? [t] : [];
      },
      draw: function (p: PartInstance, st: PartState) {
        const col = p.opt && p.opt.color ? p.opt.color : nc ? 'red' : 'green';
        var sym =
          '<circle class="btnring" cx="56" cy="52" r="26"/>' +
          '<circle class="btncap bc-' + col + (st.p ? ' pressed' : '') + '" cx="56" cy="' + (st.p ? 54 : 49) + '" r="20"/>';
        return switchShell(112, 112, p.label || 'S', sym) + label(112, 112, nc ? 'leállítás' : 'indítás');
      }
    };
  }
  RAW.btn = buttonPart(false);
  RAW.btnNC = buttonPart(true);

  /* --- fogyasztok ------------------------------------------------------- */
  RAW.lamp = {
    name: 'Lámpatest',
    w: 130,
    h: 130,
    terms: [
      { id: '1', x: 0, y: 65, dir: 'w', role: 'L', t: '1' },
      { id: '2', x: 130, y: 65, dir: 'e', role: 'N', t: 'N' }
    ],
    loads: function () {
      return [{ key: 'on', a: '1', b: '2' }];
    },
    draw: function (p: PartInstance, _st: PartState, ctx: SolveCtx) {
      const on = ctx.live(p.id + '.on');
      return (
        shell(130, 130) +
        '<circle class="lampglow" cx="65" cy="60" r="46" opacity="' + (on ? 1 : 0) + '"/>' +
        '<circle class="lampbase" cx="65" cy="60" r="30"/>' +
        '<circle class="lampbulb ' + (on ? 'lit' : '') + '" cx="65" cy="60" r="22"/>' +
        '<path class="lampx" d="M50,45 L80,75 M80,45 L50,75"/>' +
        '<text class="ptag" x="65" y="106">' + (p.label || 'E') + '</text>' +
        label(130, 130, on ? 'világít' : '')
      );
    }
  };

  RAW.pilot = {
    name: 'Jelzőlámpa',
    w: 96,
    h: 96,
    terms: [
      { id: 'X1', x: 0, y: 48, dir: 'w', role: 'L', t: 'X1' },
      { id: 'X2', x: 96, y: 48, dir: 'e', role: 'N', t: 'X2' }
    ],
    loads: function () {
      return [{ key: 'on', a: 'X1', b: 'X2' }];
    },
    draw: function (p: PartInstance, _st: PartState, ctx: SolveCtx) {
      const on = ctx.live(p.id + '.on');
      const col = (p.opt && p.opt.color) || 'green';
      return (
        shell(96, 96) +
        '<circle class="pilotglow pg-' + col + '" cx="48" cy="42" r="34" opacity="' + (on ? 1 : 0) + '"/>' +
        '<circle class="pilotcap pc-' + col + (on ? ' lit' : '') + '" cx="48" cy="42" r="20"/>' +
        '<text class="ptag sm" x="48" y="80">' + (p.label || 'H') + '</text>' +
        label(96, 96, '')
      );
    }
  };

  RAW.socket = {
    name: 'Dugaszolóaljzat',
    w: 130,
    h: 130,
    terms: [
      { id: 'L', x: 0, y: 40, dir: 'w', role: 'L', t: 'L' },
      { id: 'N', x: 0, y: 92, dir: 'w', role: 'N', t: 'N' },
      { id: 'PE', x: 130, y: 66, dir: 'e', role: 'PE', t: 'PE' }
    ],
    init: function () {
      return { plug: false };
    },
    loads: function (st: PartState) {
      return st.plug ? [{ key: 'on', a: 'L', b: 'N' }] : [];
    },
    tap: function (st: PartState) {
      st.plug = !st.plug;
    },
    draw: function (p: PartInstance, st: PartState, ctx: SolveCtx) {
      const on = ctx.live(p.id + '.on');
      return (
        shell(130, 130) +
        '<rect class="keystone" x="14" y="14" width="102" height="102" rx="9"/>' +
        '<circle class="sockbody" cx="65" cy="58" r="34"/>' +
        '<circle class="sockhole" cx="53" cy="58" r="7"/>' +
        '<circle class="sockhole" cx="77" cy="58" r="7"/>' +
        '<rect class="sockpe" x="59" y="24" width="12" height="6" rx="2"/>' +
        '<rect class="sockpe" x="59" y="86" width="12" height="6" rx="2"/>' +
        (st.plug
          ? '<rect class="plug ' + (on ? 'lit' : '') + '" x="40" y="42" width="50" height="34" rx="7"/><path class="plugcord" d="M90,59 h26"/>'
          : '') +
        '<text class="ptag" x="65" y="110">' + (p.label || 'X') + '</text>' +
        label(130, 130, st.plug ? (on ? 'fogyasztó jár' : 'bedugva') : 'koppints: dugvillа')
      );
    }
  };

  /* --- sorkapocs sin ---------------------------------------------------- */
  RAW.busbar = {
    name: 'Sorkapocs sín',
    equipotential: true,
    w: 360,
    h: 76,
    terms: function (p: PartInstance): Terminal[] {
      const t: Terminal[] = [];
      const role = p.opt?.role;
      for (let i = 0; i < 7; i++) t.push({ id: 'b' + i, x: 34 + i * 49, y: 76, dir: 's', t: '', role });
      return t;
    },
    links: function () {
      const l: Array<[string, string]> = [];
      for (let i = 1; i < 7; i++) l.push(['b0', 'b' + i]);
      return l;
    },
    sources: function (st: PartState, p: PartInstance) {
      void st;
      return p.opt && p.opt.rail ? [['b0', p.opt.rail]] : [];
    },
    draw: function (p: PartInstance) {
      const role = (p.opt && p.opt.rail) || '';
      return (
        shell(360, 76, 'face-rail rail-' + role) +
        '<rect class="railstrip rail-' + role + '" x="16" y="20" width="328" height="26" rx="5"/>' +
        '<text class="ptitle" x="16" y="16">' + (p.label || 'sín') + '</text>' +
        label(360, 76, '')
      );
    }
  };

  /* --- magneskapcsolo --------------------------------------------------- */
  /* A tekercs (A1/A2) es a segederintkezok is jobb oldalon vannak, hogy a
     vezerles egy oldalrol bekothetok legyen - igy nem kell atkabelezni a
     foaramkoron. */
  const AUX_Y = function (i: number) { return 40 + i * 52; };
  RAW.contactor = {
    name: 'Mágneskapcsoló',
    w: 280,
    h: 260,
    terms: function (p: PartInstance): Terminal[] {
      const t: Terminal[] = [
        { id: '1', x: 56, y: 0, dir: 'n', role: 'L', t: '1' },
        { id: '3', x: 140, y: 0, dir: 'n', role: 'L', t: '3' },
        { id: '5', x: 224, y: 0, dir: 'n', role: 'L', t: '5' },
        { id: '2', x: 56, y: 260, dir: 's', role: 'L', t: '2' },
        { id: '4', x: 140, y: 260, dir: 's', role: 'L', t: '4' },
        { id: '6', x: 224, y: 260, dir: 's', role: 'L', t: '6' },
        { id: 'A1', x: 280, y: 206, dir: 'e', role: 'L', t: 'A1' },
        { id: 'A2', x: 280, y: 238, dir: 'e', role: 'N', t: 'A2' }
      ];
      ((p.opt && p.opt.aux) || []).forEach(function (a: [string, string, string], i: number) {
        t.push({ id: a[0], x: 280, y: AUX_Y(i), dir: 'e', t: a[0] });
        t.push({ id: a[1], x: 280, y: AUX_Y(i) + 26, dir: 'e', t: a[1] });
      });
      return t;
    },
    /* A meghuzott allapot allapotvaltozo, nem szamitott ertek: az ontartas
       csak igy eli tul a kovetkezo szamolast (a tekercs sajat erintkezoje
       tartja magat). */
    init: function () {
      return { on: false };
    },
    loads: function () {
      return [{ key: 'coil', a: 'A1', b: 'A2' }];
    },
    update: function (st: PartState, p: PartInstance, ctx: SolveCtx) {
      st.on = ctx.live(p.id + '.coil');
    },
    links: function (st: PartState, p: PartInstance) {
      const l: Array<[string, string]> = st.on ? [['1', '2'], ['3', '4'], ['5', '6']] : [];
      ((p.opt && p.opt.aux) || []).forEach(function (a: [string, string, string]) {
        if (a[2] === 'no' ? st.on : !st.on) l.push([a[0], a[1]]);
      });
      return l;
    },
    draw: function (p: PartInstance, st: PartState) {
      const on = st.on;
      var s =
        shell(280, 260) +
        '<rect class="keystone" x="14" y="66" width="150" height="130" rx="8"/>' +
        '<text class="ptitle" x="16" y="34">' + (p.label || 'K') + '</text>' +
        '<text class="pmeta" x="16" y="52">AC3 20 A · főáramköri</text>' +
        '<rect class="armature ' + (on ? 'pulled' : '') + '" x="30" y="' + (on ? 112 : 90) + '" width="118" height="26" rx="5"/>' +
        '<path class="coil" d="M36,168 q10,-16 20,0 t20,0 t20,0 t20,0 t20,0"/>' +
        '<text class="pmeta sm" x="89" y="192">' + (on ? 'meghúzva' : 'elengedve') + '</text>' +
        '<rect class="auxtag ' + (on ? 'aux-no' : '') + '" x="180" y="196" width="76" height="22" rx="5"/>' +
        '<text class="auxtxt" x="218" y="212">TEKERCS</text>' +
        (on ? '<circle class="coilled" cx="166" cy="168" r="7"/>' : '');
      ((p.opt && p.opt.aux) || []).forEach(function (a: [string, string, string], i: number) {
        const y = AUX_Y(i), no = a[2] === 'no', closed = no ? on : !on;
        const bar = closed ? 'M196,' + (y + 34) + ' h34' : 'M196,' + (y + 34) + ' l32,-12';
        s += '<rect class="auxtag ' + (no ? 'aux-no' : 'aux-nc') + '" x="180" y="' + (y - 6) + '" width="76" height="22" rx="5"/>' +
          '<text class="auxtxt" x="218" y="' + (y + 10) + '">' + (no ? 'NO záró' : 'NC bontó') + '</text>' +
          '<path class="auxsym" d="M188,' + (y + 34) + ' h8 M230,' + (y + 34) + ' h8"/>' +
          '<path class="auxsym ' + (closed ? 'closed' : '') + '" d="' + bar + '"/>';
      });
      return s + label(280, 260, on ? 'meghúzott' : 'elengedett');
    }
  };

  /* --- motorvedo kapcsolo ----------------------------------------------- */
  RAW.mprot = {
    name: 'Motorvédő kapcsoló',
    protect: { poles: ['T1', 'T2', 'T3'] },
    onePole: true,
    w: 200,
    h: 210,
    terms: function (p: PartInstance): Terminal[] {
      const one = p.opt && p.opt.poles === 1;
      const t: Terminal[] = one
        ? [
            { id: 'L1', x: 100, y: 0, dir: 'n', role: 'L', t: 'L1' },
            { id: 'T1', x: 100, y: 210, dir: 's', role: 'L', t: 'T1' }
          ]
        : [
            { id: 'L1', x: 44, y: 0, dir: 'n', role: 'L', t: 'L1' },
            { id: 'L2', x: 100, y: 0, dir: 'n', role: 'L', t: 'L2' },
            { id: 'L3', x: 156, y: 0, dir: 'n', role: 'L', t: 'L3' },
            { id: 'T1', x: 44, y: 210, dir: 's', role: 'L', t: 'T1' },
            { id: 'T2', x: 100, y: 210, dir: 's', role: 'L', t: 'T2' },
            { id: 'T3', x: 156, y: 210, dir: 's', role: 'L', t: 'T3' }
          ];
      return t.concat([
        { id: '13', x: 200, y: 76, dir: 'e', t: '13' },
        { id: '14', x: 200, y: 134, dir: 'e', t: '14' }
      ] as Terminal[]);
    },
    init: function () {
      return { on: false, tripped: false };
    },
    links: function (st: PartState, p: PartInstance) {
      if (!st.on || st.tripped) return [];
      return p.opt && p.opt.poles === 1
        ? [['L1', 'T1'], ['13', '14']]
        : [['L1', 'T1'], ['L2', 'T2'], ['L3', 'T3'], ['13', '14']];
    },

    tap: function (st: PartState) {
      if (st.tripped) {
        st.tripped = false;
        st.on = true;
      } else st.on = !st.on;
    },
    draw: function (p: PartInstance, st: PartState) {
      const up = st.on && !st.tripped;
      return (
        shell(200, 210) +
        '<text class="ptitle" x="16" y="32">' + (p.label || 'HK-1') + '</text>' +
        '<text class="pmeta" x="16" y="50">0,8-1,2 A</text>' +
        '<circle class="knobbg" cx="100" cy="120" r="42"/>' +
        '<g transform="rotate(' + (up ? 45 : -45) + ' 100 120)"><rect class="knob" x="92" y="84" width="16" height="72" rx="8"/></g>' +
        '<text class="pmeta sm" x="52" y="' + 182 + '">0</text>' +
        '<text class="pmeta sm" x="148" y="182">I</text>' +
        label(200, 210, st.tripped ? 'kioldott' : up ? 'bekapcsolva' : 'kikapcsolva')
      );
    }
  };

  /* --- frekvenciavalto -------------------------------------------------- */
  RAW.vfd = {
    name: 'Frekvenciaváltó',
    w: 240,
    h: 240,
    terms: [
      { id: 'PE', x: 54, y: 0, dir: 'n', role: 'PE', t: 'PE' },
      { id: 'L1', x: 120, y: 0, dir: 'n', role: 'L', t: 'L1' },
      { id: 'N', x: 186, y: 0, dir: 'n', role: 'N', t: 'N' },
      { id: 'T1', x: 54, y: 240, dir: 's', role: 'L', t: 'T1' },
      { id: 'T2', x: 120, y: 240, dir: 's', role: 'L', t: 'T2' },
      { id: 'T3', x: 186, y: 240, dir: 's', role: 'L', t: 'T3' }
    ],
    sources: function (_st: PartState, _p: PartInstance, ctx: SolveCtx) {
      const ok = hasPhase(ctx.rails('L1')) && ctx.rails('N').has('N');
      return ok ? [['T1', 'L1'], ['T2', 'L2'], ['T3', 'L3']] : [];
    },
    draw: function (p: PartInstance, _st: PartState, ctx: SolveCtx) {
      const ok = hasPhase(ctx.rails('L1')) && ctx.rails('N').has('N');
      return (
        shell(240, 240, 'face-dark') +
        '<text class="ptitle" x="18" y="36">' + (p.label || 'Q-1') + '</text>' +
        '<text class="pmeta" x="18" y="56">J-1000 · 1,5 A</text>' +
        '<rect class="keystone dark" x="18" y="74" width="204" height="120" rx="8"/>' +
        '<path class="vfdslash" d="M30,186 L210,86"/>' +
        '<text class="vfdtxt" x="62" y="112">f1~</text>' +
        '<text class="vfdtxt" x="150" y="176">f2≈</text>' +
        (ok ? '<circle class="coilled" cx="204" cy="176" r="8"/>' : '') +
        label(240, 240, ok ? 'feszültség alatt' : '')
      );
    }
  };

  /* --- motor ------------------------------------------------------------ */
  /** A motor forgásiránya a rá jutó fázissorrendből. 0 = áll. */
  function motorDirection(p: PartInstance, ctx: SolveCtx): number {
    const ph = ['U1', 'V1', 'W1'].map((t) => phaseOf(ctx.rails(t)));
    if (ph.some((x) => x === null)) return 0;
    const [p1, p2, p3] = ph as string[];
    if (p1 === p2 || p2 === p3 || p1 === p3) return 0;
    const a = ORDER[p1], b = ORDER[p2], c = ORDER[p3];
    const even = (b - a + 3) % 3 === 1 && (c - b + 3) % 3 === 1;
    void p;
    return even ? 1 : -1;
  }

  const ORDER: Record<string, number> = { L1: 0, L2: 1, L3: 2 };
  RAW.motor = {
    name: 'Motor 3~',
    w: 190,
    h: 190,
    terms: [
      { id: 'U1', x: 48, y: 0, dir: 'n', role: 'L', t: 'U1' },
      { id: 'V1', x: 95, y: 0, dir: 'n', role: 'L', t: 'V1' },
      { id: 'W1', x: 142, y: 0, dir: 'n', role: 'L', t: 'W1' },
      { id: 'PE', x: 190, y: 95, dir: 'e', role: 'PE', t: 'PE' }
    ],
    run: motorDirection,
    draw: function (p: PartInstance, _st: PartState, ctx: SolveCtx) {
      const r = motorDirection(p, ctx);
      return (
        shell(190, 190) +
        '<circle class="motorbody" cx="95" cy="95" r="62"/>' +
        '<g class="rotor ' + (r === 1 ? 'spin-fwd' : r === -1 ? 'spin-rev' : '') + '" style="transform-origin:95px 95px">' +
        '<circle class="rotorring" cx="95" cy="95" r="44"/>' +
        '<path class="rotorbar" d="M95,55 v80 M55,95 h80"/></g>' +
        '<text class="motortxt" x="95" y="90">3 ~</text>' +
        '<text class="motortxt" x="95" y="116">M</text>' +
        label(190, 190, r === 1 ? 'jobbra forog' : r === -1 ? 'balra forog' : 'áll')
      );
    }
  };

  /* --- haromfazisu betaplalas ------------------------------------------ */
  RAW.feed3 = {
    name: 'Betáplálás 3~',
    supply: true,
    w: 170,
    h: 250,
    terms: [
      { id: 'L1', x: 170, y: 46, dir: 'e', role: 'L', t: 'L1' },
      { id: 'L2', x: 170, y: 88, dir: 'e', role: 'L', t: 'L2' },
      { id: 'L3', x: 170, y: 130, dir: 'e', role: 'L', t: 'L3' },
      { id: 'N', x: 170, y: 172, dir: 'e', role: 'N', t: 'N' },
      { id: 'PE', x: 170, y: 214, dir: 'e', role: 'PE', t: 'PE' }
    ],
    init: function () {
      return { on: false };
    },
    sources: function (st: PartState) {
      return st.on ? [['L1', 'L1'], ['L2', 'L2'], ['L3', 'L3'], ['N', 'N'], ['PE', 'PE']] : [];
    },
    tap: function (st: PartState) {
      st.on = !st.on;
    },
    draw: function (_p: PartInstance, st: PartState) {
      return (
        shell(170, 250, 'face-dark') +
        '<text class="ptitle" x="16" y="32">HÁLÓZAT</text>' +
        '<text class="pmeta" x="16" y="52">3×230/400 V · 50 Hz</text>' +
        '<path class="wavy" d="M18,150 q12,-20 24,0 t24,0 t24,0"/>' +
        (st.on ? '<circle class="coilled" cx="136" cy="150" r="9"/>' : '<circle class="pilotcap" cx="136" cy="150" r="9"/>') +
        label(170, 250, st.on ? 'feszültség alatt' : 'feszültségmentes')
      );
    }
  };

  /* --- haromfazisu fogyasztasmero (kozvetlen merosu) --------------------- */
  RAW.meter3 = {
    name: 'Fogyasztásmérő 3~',
    w: 300,
    h: 240,
    terms: [
      { id: '1', x: 46, y: 0, dir: 'n', role: 'L', t: '1' },
      { id: '4', x: 116, y: 0, dir: 'n', role: 'L', t: '4' },
      { id: '7', x: 186, y: 0, dir: 'n', role: 'L', t: '7' },
      { id: '10', x: 256, y: 0, dir: 'n', role: 'N', t: '10' },
      { id: '3', x: 46, y: 240, dir: 's', role: 'L', t: '3' },
      { id: '6', x: 116, y: 240, dir: 's', role: 'L', t: '6' },
      { id: '9', x: 186, y: 240, dir: 's', role: 'L', t: '9' },
      { id: '11', x: 256, y: 240, dir: 's', role: 'N', t: '11' }
    ],
    /* A mero atmenoen bekoti a fazisokat es a nullat: 1-3, 4-6, 7-9, 10-11. */
    links: function () {
      return [['1', '3'], ['4', '6'], ['7', '9'], ['10', '11']];
    },
    draw: function (p: PartInstance, _st: PartState, ctx: SolveCtx) {
      const n = ctx.rails('11').has('N');
      const ph = ['3', '6', '9'].map(function (t: string) { return phaseOf(ctx.rails(t)); });
      const distinct = ph.filter(Boolean).length === 3 && ph[0] !== ph[1] && ph[1] !== ph[2] && ph[0] !== ph[2];
      var s =
        shell(300, 240) +
        '<text class="ptitle" x="16" y="34">' + (p.label || 'kWh') + '</text>' +
        '<text class="pmeta" x="16" y="54">közvetlen mérésű · 3×80 A</text>' +
        '<rect class="meterwin" x="16" y="70" width="268" height="66" rx="7"/>' +
        /* A szimulacio nem mer energiat, ezert a szamlalo nullan all - kitalalt
           fogyasztast nem irunk ki. A fazis- es nulla-LED viszont valos: abbol
           latszik, hogy jol van-e bekotve a mero. */
        '<text class="meterdigits" x="150" y="116">' + (distinct && n ? '0 0 0 0 0 , 0' : '- - - - - , -') + '</text>' +
        '<text class="pmeta sm" x="150" y="152">kWh</text>';
      ['L1', 'L2', 'L3'].forEach(function (nm: string, i: number) {
        const okp = !!ph[i];
        s += '<circle class="phled ' + (okp ? 'lit' : '') + '" cx="' + (58 + i * 62) + '" cy="182" r="11"/>' +
          '<text class="pmeta sm" x="' + (58 + i * 62) + '" y="208">' + nm + '</text>';
      });
      s += '<circle class="phled nled ' + (n ? 'lit' : '') + '" cx="244" cy="182" r="11"/>' +
        '<text class="pmeta sm" x="244" y="208">N</text>';
      return s + label(300, 240,
        !n ? 'nincs nulla - nem mér'
          : distinct ? 'mind a három fázis a helyén'
            : 'hiányzó vagy összekötött fázis');
    }
  };

  /* --- egyfazisu fogyasztasmero (kozvetlen meresu) ---------------------- */
  RAW.meter1 = {
    name: 'Fogyasztásmérő 1~',
    w: 240,
    h: 220,
    terms: [
      { id: '1', x: 60, y: 0, dir: 'n', role: 'L', t: '1' },
      { id: '4', x: 180, y: 0, dir: 'n', role: 'N', t: '4' },
      { id: '3', x: 60, y: 220, dir: 's', role: 'L', t: '3' },
      { id: '6', x: 180, y: 220, dir: 's', role: 'N', t: '6' }
    ],
    /* A fazis az 1-3, a nulla a 4-6 kapcson megy at a meron. */
    links: function () {
      return [['1', '3'], ['4', '6']];
    },
    draw: function (p: PartInstance, _st: PartState, ctx: SolveCtx) {
      const l = hasPhase(ctx.rails('3')), n = ctx.rails('6').has('N');
      return (
        shell(240, 220) +
        '<text class="ptitle" x="16" y="34">' + (p.label || 'kWh') + '</text>' +
        '<text class="pmeta" x="16" y="54">közvetlen mérésű · 1×63 A</text>' +
        '<rect class="meterwin" x="16" y="70" width="208" height="60" rx="7"/>' +
        '<text class="meterdigits" x="120" y="113">' + (l && n ? '0 0 0 0 , 0' : '- - - - , -') + '</text>' +
        '<text class="pmeta sm" x="120" y="148">kWh</text>' +
        '<circle class="phled ' + (l ? 'lit' : '') + '" cx="86" cy="176" r="11"/>' +
        '<text class="pmeta sm" x="86" y="202">L</text>' +
        '<circle class="phled nled ' + (n ? 'lit' : '') + '" cx="154" cy="176" r="11"/>' +
        '<text class="pmeta sm" x="154" y="202">N</text>' +
        label(240, 220, !n ? 'nincs nulla - nem mér' : l ? 'fázis és nulla a helyén' : 'nincs fázis')
      );
    }
  };

  /* --- fokapcsolo (3P+N) ------------------------------------------------ */
  RAW.mainsw = {
    name: 'Főkapcsoló 3P+N',
    w: 240,
    h: 190,
    terms: [
      { id: 'L1', x: 40, y: 0, dir: 'n', role: 'L', t: 'L1' },
      { id: 'L2', x: 92, y: 0, dir: 'n', role: 'L', t: 'L2' },
      { id: 'L3', x: 144, y: 0, dir: 'n', role: 'L', t: 'L3' },
      { id: 'N', x: 200, y: 0, dir: 'n', role: 'N', t: 'N' },
      { id: 'T1', x: 40, y: 190, dir: 's', role: 'L', t: 'T1' },
      { id: 'T2', x: 92, y: 190, dir: 's', role: 'L', t: 'T2' },
      { id: 'T3', x: 144, y: 190, dir: 's', role: 'L', t: 'T3' },
      { id: 'TN', x: 200, y: 190, dir: 's', role: 'N', t: 'TN' }
    ],
    init: function () {
      return { on: false };
    },
    links: function (st: PartState) {
      return st.on ? [['L1', 'T1'], ['L2', 'T2'], ['L3', 'T3'], ['N', 'TN']] : [];
    },
    tap: function (st: PartState) {
      st.on = !st.on;
    },
    draw: function (p: PartInstance, st: PartState) {
      return (
        shell(240, 190) +
        '<text class="ptitle" x="16" y="32">' + (p.label || 'FK') + '</text>' +
        '<text class="pmeta" x="16" y="50">főkapcsoló</text>' +
        '<circle class="knobbg" cx="120" cy="112" r="44"/>' +
        '<g transform="rotate(' + (st.on ? 45 : -45) + ' 120 112)"><rect class="knob knob-red" x="111" y="74" width="18" height="76" rx="9"/></g>' +
        '<text class="pmeta sm" x="70" y="170">0</text>' +
        '<text class="pmeta sm" x="170" y="170">I</text>' +
        label(240, 190, st.on ? 'bekapcsolva' : 'kikapcsolva')
      );
    }
  };

  /* --- egyfazisu motor -------------------------------------------------- */
  RAW.motor1 = {
    name: 'Motor 1~',
    w: 190,
    h: 190,
    terms: [
      { id: 'U1', x: 60, y: 0, dir: 'n', role: 'L', t: 'U1' },
      { id: 'U2', x: 130, y: 0, dir: 'n', role: 'N', t: 'U2' },
      { id: 'PE', x: 190, y: 95, dir: 'e', role: 'PE', t: 'PE' }
    ],
    loads: function () {
      return [{ key: 'run', a: 'U1', b: 'U2' }];
    },
    draw: function (p: PartInstance, _st: PartState, ctx: SolveCtx) {
      const on = ctx.live(p.id + '.run');
      return (
        shell(190, 190) +
        '<circle class="motorbody" cx="95" cy="95" r="62"/>' +
        '<g class="rotor ' + (on ? 'spin-fwd' : '') + '" style="transform-origin:95px 95px">' +
        '<circle class="rotorring" cx="95" cy="95" r="44"/>' +
        '<path class="rotorbar" d="M95,55 v80 M55,95 h80"/></g>' +
        '<text class="motortxt" x="95" y="90">1 ~</text>' +
        '<text class="motortxt" x="95" y="116">M</text>' +
        label(190, 190, on ? 'forog' : 'áll')
      );
    }
  };


  /* --- TN-C betaplalas (L + PEN) --------------------------------------- */
  /* A PEN egyszerre nulla es vedovezeto, ezert nincs szerepe (role): se N-,
     se PE-szabaly nem vonatkozik ra, amig szet nem valasztjuk. */
  RAW.feedpen = {
    name: 'Betáplálás TN-C (L + PEN)',
    supply: true,
    w: 150,
    h: 170,
    terms: [
      { id: 'L1', x: 150, y: 55, dir: 'e', role: 'L', t: 'L1' },
      { id: 'PEN', x: 150, y: 115, dir: 'e', t: 'PEN' }
    ],
    init: function () {
      return { on: false };
    },
    sources: function (st: PartState) {
      return st.on ? [['L1', 'L1'], ['PEN', 'N'], ['PEN', 'PE']] : [];
    },
    tap: function (st: PartState) {
      st.on = !st.on;
    },
    draw: function (_p: PartInstance, st: PartState) {
      return (
        shell(150, 170, 'face-dark') +
        '<text class="ptitle" x="16" y="32">HÁLÓZAT</text>' +
        '<text class="pmeta" x="16" y="52">TN-C · L + PEN</text>' +
        '<path class="wavy" d="M18,112 q14,-22 28,0 t28,0 t28,0"/>' +
        (st.on ? '<circle class="coilled" cx="120" cy="112" r="9"/>' : '<circle class="pilotcap" cx="120" cy="112" r="9"/>') +
        label(150, 170, st.on ? 'feszültség alatt' : 'feszültségmentes')
      );
    }
  };

  /* --- PEN-szetvalasztas: PE- es N-sin oldhato hiddal --------------------- */
  /* A PEN eloszor a PE-sinre (p0) erkezik, onnan a hid viszi at az N-sinre.
     Koppintas: hid bontasa / zarasa - szigetelesmereshez bontani kell. */
  const PEN_P = ['p0', 'p1', 'p2', 'p3', 'p4'];
  const PEN_N = ['n0', 'n1', 'n2', 'n3', 'n4'];
  RAW.penbar = {
    name: 'PEN-szétválasztó (PE- és N-sín hiddal)',
    w: 460,
    h: 110,
    groups: [PEN_P, PEN_N],
    terms: PEN_P.map(function (id, i): Terminal {
      return i === 0
        ? { id: id, x: 30, y: 110, dir: 's', t: 'PEN' }
        : { id: id, x: 30 + i * 40, y: 110, dir: 's', role: 'PE', t: '' };
    }).concat(PEN_N.map(function (id, i): Terminal {
      return { id: id, x: 270 + i * 40, y: 110, dir: 's', role: 'N', t: '' };
    })),
    init: function () {
      return { on: true };
    },
    links: function (st: PartState) {
      const l: Array<[string, string]> = [];
      for (let i = 1; i < 5; i++) {
        l.push([PEN_P[0], PEN_P[i]]);
        l.push([PEN_N[0], PEN_N[i]]);
      }
      if (st.on) l.push(['p0', 'n0']);
      return l;
    },
    tap: function (st: PartState) {
      st.on = !st.on;
    },
    draw: function (p: PartInstance, st: PartState) {
      return (
        shell(460, 110, 'face-rail') +
        '<rect class="railstrip rail-PE" x="14" y="34" width="196" height="26" rx="5"/>' +
        '<rect class="railstrip rail-N" x="250" y="34" width="196" height="26" rx="5"/>' +
        '<text class="ptitle" x="16" y="24">' + (p.label || 'PEN') + ' · PE</text>' +
        '<text class="ptitle" x="252" y="24">N</text>' +
        (st.on
          ? '<rect class="armature pulled" x="196" y="40" width="68" height="14" rx="4"/>'
          : '<rect class="armature" x="200" y="18" width="60" height="12" rx="4" transform="rotate(-18 230 24)"/>') +
        '<text class="pmeta sm" x="230" y="84">' + (st.on ? 'híd zárva' : 'híd bontva') + '</text>' +
        label(460, 110, st.on ? 'koppints: híd bontása (szigetelésméréshez)' : 'HÍD BONTVA - nincs nulla! koppints: zárás')
      );
    }
  };

  /* --- foldelo ------------------------------------------------------------ */
  RAW.earthrod = {
    name: 'Földelő (földelőszonda)',
    w: 120,
    h: 170,
    terms: [{ id: 'E', x: 60, y: 0, dir: 'n', role: 'PE', t: 'E' }],
    draw: function (p: PartInstance) {
      return (
        shell(120, 170) +
        '<text class="ptitle sm" x="60" y="34">' + (p.label || 'RE') + '</text>' +
        '<path class="auxsym closed" d="M60,44 v70 M30,114 h60 M40,126 h40 M50,138 h20"/>' +
        label(120, 170, 'földelő')
      );
    }
  };

  /* --- hokioldo rele ---------------------------------------------------- */
  /* A foerintkezok mindig atvezetnek; tulterheleskor csak a segederintkezok
     valtanak: a 95-96 bont (leejti a vezerlest), a 97-98 zar (hibajelzes).
     Koppintas: tulterheles szimulalasa / RESET. */
  RAW.olr = {
    name: 'Hőkioldó relé',
    w: 200,
    h: 170,
    terms: [
      { id: '1', x: 44, y: 0, dir: 'n', role: 'L', t: '1' },
      { id: '3', x: 100, y: 0, dir: 'n', role: 'L', t: '3' },
      { id: '5', x: 156, y: 0, dir: 'n', role: 'L', t: '5' },
      { id: '2', x: 44, y: 170, dir: 's', role: 'L', t: '2' },
      { id: '4', x: 100, y: 170, dir: 's', role: 'L', t: '4' },
      { id: '6', x: 156, y: 170, dir: 's', role: 'L', t: '6' },
      { id: '95', x: 200, y: 36, dir: 'e', t: '95' },
      { id: '96', x: 200, y: 62, dir: 'e', t: '96' },
      { id: '97', x: 200, y: 106, dir: 'e', t: '97' },
      { id: '98', x: 200, y: 132, dir: 'e', t: '98' }
    ],
    init: function () {
      return { tripped: false };
    },
    links: function (st: PartState) {
      const l: Array<[string, string]> = [['1', '2'], ['3', '4'], ['5', '6']];
      l.push(st.tripped ? ['97', '98'] : ['95', '96']);
      return l;
    },
    tap: function (st: PartState) {
      st.tripped = !st.tripped;
    },
    draw: function (p: PartInstance, st: PartState) {
      return (
        shell(200, 170) +
        '<text class="ptitle" x="16" y="30">' + (p.label || 'F3') + '</text>' +
        '<text class="pmeta" x="16" y="48">hőkioldó · 0,58·In</text>' +
        '<rect class="keystone" x="16" y="62" width="120" height="70" rx="8"/>' +
        '<path class="coil" d="M28,100 h12 v-14 h14 v14 h14 v-14 h14 v14 h14 v-14 h14 v14 h8"/>' +
        '<rect class="auxtag aux-nc" x="142" y="30" width="48" height="20" rx="5"/>' +
        '<text class="auxtxt" x="166" y="44">95-96</text>' +
        '<rect class="auxtag aux-no" x="142" y="100" width="48" height="20" rx="5"/>' +
        '<text class="auxtxt" x="166" y="114">97-98</text>' +
        (st.tripped ? '<circle class="trip" cx="76" cy="150" r="11"/><text class="triptxt" x="76" y="155">!</text>' : '') +
        label(200, 170, st.tripped ? 'túlterhelés - koppints: RESET' : 'koppints: túlterhelés próba')
      );
    }
  };

  /* --- idorele (meghuzaskesleltetett) ----------------------------------- */
  /** A csillag-delta indítás átkapcsolási ideje. */
  export const TIMER_MS = 5000;
  RAW.timer = {
    name: 'Időrelé (meghúzáskésleltetett)',
    w: 170,
    h: 200,
    terms: [
      { id: 'A1', x: 40, y: 0, dir: 'n', role: 'L', t: 'A1' },
      { id: '15', x: 130, y: 0, dir: 'n', t: '15' },
      { id: 'A2', x: 40, y: 200, dir: 's', role: 'N', t: 'A2' },
      { id: '16', x: 100, y: 200, dir: 's', t: '16' },
      { id: '18', x: 145, y: 200, dir: 's', t: '18' }
    ],
    init: function () {
      return { since: 0 };
    },
    loads: function () {
      return [{ key: 'coil', a: 'A1', b: 'A2' }];
    },
    /* A tekercs feszültséget kap -> indul az idő; lejártakor a 15 a 16-ról
       (késleltetve bontó) átvált a 18-ra (késleltetve záró). */
    update: function (st: PartState, p: PartInstance, ctx: SolveCtx) {
      if (!ctx.live(p.id + '.coil')) st.since = 0;
      else if (!st.since) st.since = ctx.now;
    },
    links: function (st: PartState, _p: PartInstance, ctx: SolveCtx) {
      const done = !!st.since && ctx.now - st.since >= TIMER_MS;
      return [done ? ['15', '18'] : ['15', '16']];
    },
    draw: function (p: PartInstance, st: PartState, ctx: SolveCtx) {
      const left = st.since ? Math.max(0, TIMER_MS - (ctx.now - st.since)) : TIMER_MS;
      const done = !!st.since && left === 0;
      const r = 26,
        c = 2 * Math.PI * r;
      return (
        shell(170, 200) +
        din(170, 200) +
        '<text class="ptitle" x="14" y="30">' + (p.label || 'KT') + '</text>' +
        '<text class="pmeta" x="14" y="48">időrelé · ' + TIMER_MS / 1000 + ' s</text>' +
        '<circle class="dialbg" cx="85" cy="118" r="' + r + '"/>' +
        (st.since && !done
          ? '<circle class="dial" cx="85" cy="118" r="' + r + '" stroke-dasharray="' + c + '" stroke-dashoffset="' + c * (left / TIMER_MS) + '"/>'
          : '') +
        (done ? '<circle class="dial dial-held" cx="85" cy="118" r="' + r + '"/>' : '') +
        '<text class="dialtxt" x="85" y="125">' + (done ? '15-18' : st.since ? Math.ceil(left / 1000) + 's' : '15-16') + '</text>' +
        label(170, 200, done ? 'lejárt - 15-18 zárt' : st.since ? 'számol' : 'elengedett')
      );
    }
  };

  /* --- motor 6 kivezetessel (csillag-delta) ----------------------------- */
  /** Csillag: U2-V2-W2 egy csomópont, feszültség nélkül. Delta: U1-W2, V1-U2,
   *  W1-V2 azonos fázison. Minden más tekercskötés hibás. */
  export function motor6State(p: PartInstance, ctx: SolveCtx): { dir: number; mode: 'star' | 'delta' | 'none' | 'bad' } {
    void p;
    const ph = ['U1', 'V1', 'W1'].map((t) => phaseOf(ctx.rails(t)));
    if (ph.every((x) => x === null)) return { dir: 0, mode: 'none' };
    if (ph.some((x) => x === null)) return { dir: 0, mode: 'bad' };
    const [p1, p2, p3] = ph as string[];
    if (p1 === p2 || p2 === p3 || p1 === p3) return { dir: 0, mode: 'bad' };
    const even = (ORDER[p2] - ORDER[p1] + 3) % 3 === 1 && (ORDER[p3] - ORDER[p2] + 3) % 3 === 1;
    const dir = even ? 1 : -1;
    const end = ['U2', 'V2', 'W2'].map((t) => phaseOf(ctx.rails(t)));
    if (end.every((x) => x === null) && ctx.same('U2', 'V2') && ctx.same('V2', 'W2')) return { dir, mode: 'star' };
    if (end[2] === p1 && end[0] === p2 && end[1] === p3) return { dir, mode: 'delta' };
    return { dir: 0, mode: 'bad' };
  }

  RAW.motor6 = {
    name: 'Motor 3~ (6 kivezetés)',
    w: 280,
    h: 200,
    terms: [
      { id: 'U1', x: 30, y: 0, dir: 'n', role: 'L', t: 'U1' },
      { id: 'V1', x: 74, y: 0, dir: 'n', role: 'L', t: 'V1' },
      { id: 'W1', x: 118, y: 0, dir: 'n', role: 'L', t: 'W1' },
      { id: 'U2', x: 162, y: 0, dir: 'n', role: 'L', t: 'U2' },
      { id: 'V2', x: 206, y: 0, dir: 'n', role: 'L', t: 'V2' },
      { id: 'W2', x: 250, y: 0, dir: 'n', role: 'L', t: 'W2' },
      { id: 'PE', x: 280, y: 120, dir: 'e', role: 'PE', t: 'PE' }
    ],
    run: function (p: PartInstance, ctx: SolveCtx) {
      return motor6State(p, ctx).dir;
    },
    draw: function (p: PartInstance, _st: PartState, ctx: SolveCtx) {
      const s = motor6State(p, ctx);
      const spin = s.mode === 'delta' ? (s.dir === 1 ? 'spin-fwd' : 'spin-rev') : s.mode === 'star' ? (s.dir === 1 ? 'spin-slow' : 'spin-slow-rev') : '';
      return (
        shell(280, 200) +
        '<circle class="motorbody" cx="140" cy="110" r="62"/>' +
        '<g class="rotor ' + spin + '" style="transform-origin:140px 110px">' +
        '<circle class="rotorring" cx="140" cy="110" r="44"/>' +
        '<path class="rotorbar" d="M140,70 v80 M100,110 h80"/></g>' +
        '<text class="motortxt" x="140" y="105">3 ~</text>' +
        '<text class="motortxt" x="140" y="131">' + (s.mode === 'star' ? 'Y' : s.mode === 'delta' ? 'Δ' : 'M') + '</text>' +
        label(280, 200,
          s.mode === 'star' ? 'csillagban indul (1/3 áram)' :
          s.mode === 'delta' ? 'deltában üzemel' :
          s.mode === 'bad' ? 'hibás tekercskötés - áll' : 'áll')
      );
    }
  };

/** Sorkapcsok lekérdezése - fix tömb vagy a beállítástól függő függvény. */
export function termsOf(p: PartInstance): Terminal[] {
  const d = PARTS[p.type];
  if (!d) return [];
  return typeof d.terms === 'function' ? d.terms(p) : d.terms;
}

/** A készülék szélessége, ha a beállítástól függ (pl. 4 pólusú Fi-relé). */
export function widthOf(p: PartInstance): number {
  const d = PARTS[p.type];
  return d.wOf ? d.wOf(p) : d.w;
}

export const PARTS_LIST = Object.keys(PARTS);
export { PARTS };
