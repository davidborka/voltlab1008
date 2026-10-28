/**
 * A 3D bekötési nézet elrendezése és huzalvezetése - three.js nélkül, hogy
 * tesztelhető legyen és ne kerüljön a fő csomagba.
 *
 * Egység: mm. x jobbra, y felfelé, z a szerelőlapból kifelé (a lap első síkja
 * z = 0). A DIN-sín (TH35-7,5) a lapon ül, a készülékek hátlapja a sín első
 * síkján, z = 7,5-nél.
 *
 * Minden kapocs fizikai helyen van: a moduláris készülékeknél a felső/alsó
 * homloklapon nyílik a vezeték bevezető nyílása, a Niloé szerkezeteknél a
 * hátoldalon a push-in nyílás, a motornál a kapocstáblán a csavar. Minden
 * huzal a kapocsból kilépve a legközelebbi kábelcsatornába megy, ott
 * vízszintesen fut, csatornaváltáskor a lap szélén levő függőleges
 * csatornán át - rendezett, követhető vezetés, nem légvonal.
 */
import type { PartInstance, TaskDef, WireColor } from '../../domain/electrical-types';
import { REAL_DEVICES, type RealDevice } from '../../data/realDevices';
import { termsOf } from '../../data/parts';

export type Vec3 = [number, number, number];

export const RAIL_Z = 7.5;
const DUCT_H = 44;
const GAP = 3;

/** A test fizikai formája - a modell ebből épül. */
export type ModelKind =
  | 'rx3' | 'easy9-3p' | 'ideal' | 'rx3-rcd' | 'easy9-4p' | 'schelinger' | 'elmark-spd' | 'min' | 'finder'
  | 'tesys' | 'tm2' | 'qoltec' | 'meter3' | 'mainsw' | 'vfd' | 'feedblocks' | 'busbar' | 'penbar'
  | 'pushbtn' | 'pilot' | 'niloe' | 'niloe-x' | 'se-push' | 'socket' | 'lamp' | 'motor' | 'rod' | 'pipe' | 'generic';

export type Zone = 'rail' | 'wall' | 'floor';

export interface TermGeom {
  /** a vezeték belépési pontja (nyílás közepe), lokális koordinátában */
  hole: Vec3;
  /** kifelé mutató irány a nyílásból */
  dir: Vec3;
  /** a csavarfej vagy a push-in kioldó helye (a modellnek) */
  screw?: Vec3;
  /** a nyomtatott jelölés */
  label: string;
  /** van-e a feladatban ilyen azonosítójú kapocs (a szabad, nem bekötött
   *  kapcsokat is megmutatjuk, pl. a Qoltec 5-6 vagy a Niloé 2) */
  free?: boolean;
}

export interface PlacedPart {
  part: Omit<PartInstance, 'st'>;
  kind: ModelKind;
  dev: RealDevice | null;
  zone: Zone;
  /** a test középpontja (x, y), z0 a hátlap */
  x: number;
  y: number;
  z0: number;
  w: number;
  h: number;
  d: number;
  terms: Record<string, TermGeom>;
  region: number;
  /** a készülék címkéjének helye: a csatorna alsó peremén, a készülék fölött */
  tagY?: number;
}

export interface T3 {
  key: string;
  partId: string;
  termId: string;
  label: string;
  /** világkoordináta: nyílás */
  hole: Vec3;
  dir: Vec3;
  free?: boolean;
}

export interface WirePath {
  index: number;
  a: string;
  b: string;
  color: WireColor;
  step: number;
  pts: Vec3[];
}

export interface Box {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

export interface Layout3D {
  plate: Box;
  rails: Array<{ y: number; x0: number; x1: number }>;
  ducts: Array<{ y: number; x0: number; x1: number }>;
  risers: Array<{ x: number; y0: number; y1: number }>;
  enclosures: Array<Box & { titleHu: string }>;
  conduits: Array<{ y: number; z: number; x0: number; x1: number }>;
  parts: PlacedPart[];
  terms: Map<string, T3>;
  wires: WirePath[];
  /** a betáplálás bejövő kábele (nem része a megoldásnak) */
  feedIn: Array<{ pts: Vec3[]; color: WireColor }>;
}

/* ------------------------------------------------------------ készülékek */

/** Mely készülék melyik formát kapja; a valós készüléké az elsődleges. */
function kindOf(p: Omit<PartInstance, 'st'>): ModelKind {
  switch (p.dev) {
    case 'legrand-rx3-1p':
    case 'legrand-rx3-b16':
    case 'legrand-rx3-b10':
      return 'rx3';
    case 'schneider-easy9-3p-c16':
      return 'easy9-3p';
    case 'ideal-krd10':
      return 'ideal';
    case 'legrand-rx3-rcd-2p':
      return 'rx3-rcd';
    case 'schneider-easy9-rcd-4p':
      return 'easy9-4p';
    case 'schelinger-spd01-4p':
      return 'schelinger';
    case 'elmark-spd-c10':
      return 'elmark-spd';
    case 'schneider-min-15363':
      return 'min';
    case 'finder-82-01':
      return 'finder';
    case 'schneider-lc1d18':
      return 'tesys';
    case 'elmark-tm2-e08':
      return 'tm2';
    case 'qoltec-50888':
      return 'qoltec';
    case 'legrand-niloe-764504':
      return 'niloe-x';
    case 'legrand-niloe-valto':
      return 'niloe';
    case 'schneider-nyomo':
      return 'se-push';
  }
  switch (p.type) {
    case 'feed':
    case 'feed3':
    case 'feedpen':
      return 'feedblocks';
    case 'busbar':
      return 'busbar';
    case 'penbar':
      return 'penbar';
    case 'meter3':
      return 'meter3';
    case 'mainsw':
      return 'mainsw';
    case 'vfd':
      return 'vfd';
    case 'btn':
    case 'btnNC':
      return 'pushbtn';
    case 'pilot':
      return 'pilot';
    case 'socket':
      return 'socket';
    case 'lamp':
      return 'lamp';
    case 'motor':
    case 'motor1':
    case 'motor6':
      return 'motor';
    case 'earthrod':
      return 'rod';
    case 'bond':
      return 'pipe';
  }
  return 'generic';
}

function zoneOf(kind: ModelKind): Zone {
  if (kind === 'niloe' || kind === 'niloe-x' || kind === 'se-push' || kind === 'socket' || kind === 'lamp') return 'wall';
  if (kind === 'motor' || kind === 'rod' || kind === 'pipe') return 'floor';
  return 'rail';
}

/** Méret (mm): valós készüléknél az adatlapból, egyébként általános érték. */
function sizeOf(p: Omit<PartInstance, 'st'>, kind: ModelKind, dev: RealDevice | null): { w: number; h: number; d: number } {
  if (dev && dev.dimsMm.d > 0 && zoneOf(kind) === 'rail') return { ...dev.dimsMm };
  switch (kind) {
    case 'qoltec':
      return { w: 103, h: 114, d: 48 };
    case 'feedblocks':
      return { w: termsOf({ ...p, st: {} }).length * 8.2, h: 50, d: 45 };
    case 'busbar':
      return { w: 72, h: 24, d: 30 };
    case 'penbar':
      return { w: 124, h: 24, d: 30 };
    case 'meter3':
      return { w: 126, h: 90, d: 65 };
    case 'mainsw':
      return { w: 72, h: 85, d: 68 };
    case 'vfd':
      return { w: 72, h: 128, d: 108 };
    case 'pushbtn':
    case 'pilot':
      return { w: 18, h: 85, d: 66 };
    case 'niloe':
    case 'niloe-x':
    case 'se-push':
    case 'socket':
    case 'lamp':
      return { w: 86, h: 86, d: 40 };
    case 'motor':
      return { w: p.type === 'motor6' ? 210 : 180, h: 150, d: 130 };
    case 'rod':
      return { w: 40, h: 120, d: 40 };
    case 'pipe':
      return { w: 40, h: 160, d: 40 };
  }
  return { w: 36, h: 85, d: 66 };
}

/* --------------------------------------------------------------- kapcsok */

const top = (h: number, x: number, z: number, label: string): TermGeom => ({
  hole: [x, h / 2, z],
  dir: [0, 1, 0],
  screw: [x, h / 2 - 8, z + 16],
  label,
});
const bot = (h: number, x: number, z: number, label: string): TermGeom => ({
  hole: [x, -h / 2, z],
  dir: [0, -1, 0],
  screw: [x, -h / 2 + 8, z + 16],
  label,
});
/** Szerelvény hátoldali push-in nyílása: a vezeték hátulról, +z irányban lép be. */
const back = (x: number, y: number, label: string): TermGeom => ({ hole: [x, y, 9], dir: [0, 0, -1], label });

/** Lokális kapocsgeometria típusonként. A kulcs az alkalmazás kapocsazonosítója. */
function termGeoms(p: Omit<PartInstance, 'st'>, kind: ModelKind, s: { w: number; h: number; d: number }): Record<string, TermGeom> {
  const h = s.h;
  const T: Record<string, TermGeom> = {};
  const ts = termsOf({ ...p, st: {} });
  const lab = (id: string) => ts.find((t) => t.id === id)?.t || id;
  /* moduláris: a vállrész ~44 mm a sín síkjától, a nyílás a váll közepén */
  const zs = 26;
  switch (kind) {
    case 'rx3':
      T['1'] = top(h, 0, zs, '1');
      T['2'] = bot(h, 0, zs, '2');
      break;
    case 'easy9-3p':
      ['1', '3', '5'].forEach((id, i) => (T[id] = top(h, (i - 1) * 18, zs, id)));
      ['2', '4', '6'].forEach((id, i) => (T[id] = bot(h, (i - 1) * 18, zs, id)));
      break;
    case 'ideal':
    case 'rx3-rcd':
      T.L1 = top(h, -9, zs, '1');
      T.N1 = top(h, 9, zs, 'N');
      T.L2 = bot(h, -9, zs, '2');
      T.N2 = bot(h, 9, zs, 'N');
      break;
    case 'easy9-4p':
      ['N1', 'L1', 'L2', 'L3'].forEach((id, i) => (T[id] = top(h, (i - 1.5) * 18, zs, lab(id))));
      ['N2', 'T1', 'T2', 'T3'].forEach((id, i) => (T[id] = bot(h, (i - 1.5) * 18, zs, lab(id))));
      break;
    case 'schelinger':
      ['L1', 'L2', 'L3', 'N'].forEach((id, i) => (T[id] = top(h, (i - 1.5) * 18, zs, id)));
      T.PE = bot(h, 9, zs, '⏚');
      break;
    case 'elmark-spd':
      T['L/N'] = top(h, 0, zs, 'L/N');
      T.PE = bot(h, 0, zs, '⏚');
      break;
    case 'min':
      /* mind a négy alul: felső lépcső L, 3 (előrébb), alsó sor N, 4 */
      T.L = { hole: [-4.5, -h / 2 + 12, 44], dir: [0, -1, 0], screw: [-4.5, -h / 2 + 18, 52], label: 'L' };
      T['3'] = { hole: [4.5, -h / 2 + 12, 44], dir: [0, -1, 0], screw: [4.5, -h / 2 + 18, 52], label: '3' };
      T.N = { hole: [-4.5, -h / 2, 20], dir: [0, -1, 0], screw: [-4.5, -h / 2 + 6, 32], label: 'N' };
      T['4'] = { hole: [4.5, -h / 2, 20], dir: [0, -1, 0], screw: [4.5, -h / 2 + 6, 32], label: '4' };
      break;
    case 'finder':
      ['A1', 'B1', '15'].forEach((id, i) => (T[id] = top(h, (i - 1) * 5.6, zs, id)));
      ['16', '18', 'A2'].forEach((id, i) => (T[id] = bot(h, (i - 1) * 5.6, zs, id)));
      break;
    case 'tesys': {
      /* hátsó sor: főkapcsok; első lépcső: 13 21 A1 / 14 22 A2 */
      ['1L1', '3L2', '5L3'].forEach((id, i) => (T[id] = { ...top(h, (i - 1) * 14, 46, id), screw: [(i - 1) * 14, h / 2 - 7, 60] }));
      ['2T1', '4T2', '6T3'].forEach((id, i) => (T[id] = { ...bot(h, (i - 1) * 14, 46, id), screw: [(i - 1) * 14, -h / 2 + 7, 60] }));
      const stepY = h / 2 - 11;
      T.A1 = { hole: [16, stepY, 68], dir: [0, 1, 0], screw: [16, stepY - 6, 75], label: 'A1' };
      T.A2 = { hole: [16, -stepY, 68], dir: [0, -1, 0], screw: [16, -stepY + 6, 75], label: 'A2' };
      const built: Record<string, [number, number]> = { '13': [-8, 1], '14': [-8, -1], '21': [4, 1], '22': [4, -1] };
      const aux = p.opt?.aux || [];
      const extra = aux.filter((a) => !(a[0] === '13' && a[1] === '14') && !(a[0] === '21' && a[1] === '22'));
      for (const [id, [x, sgn]] of Object.entries(built)) {
        T[id] = {
          hole: [x, sgn * stepY, 68],
          dir: [0, sgn, 0],
          screw: [x, sgn * (stepY - 6), 75],
          label: id + (id === '13' || id === '14' ? ' NO' : ' NC'),
          free: !aux.some((a) => a[0] === id || a[1] === id),
        };
      }
      /* homlokra pattintott segédérintkező-blokk a további érintkezőknek */
      extra.forEach((a, i) => {
        const x = (i - (extra.length - 1) / 2) * 13;
        /* a blokk a homlok alsó részén ül, a zöld TeSys sáv látható marad */
        T[a[0]] = { hole: [x, 7, 104], dir: [0, 1, 0], screw: [x, 2, 112], label: a[0] };
        T[a[1]] = { hole: [x, -25, 104], dir: [0, -1, 0], screw: [x, -20, 112], label: a[1] };
      });
      break;
    }
    case 'tm2':
      if (p.opt?.poles === 1) {
        T['1L1'] = top(h, 0, 32, '1L1');
        T['2T1'] = bot(h, 0, 32, '2T1');
      } else {
        ['1L1', '3L2', '5L3'].forEach((id, i) => (T[id] = top(h, (i - 1) * 14.5, 32, id)));
        ['2T1', '4T2', '6T3'].forEach((id, i) => (T[id] = bot(h, (i - 1) * 14.5, 32, id)));
      }
      /* oldalra szerelt 13-14 segédérintkező-blokk (jobb oldal) */
      T['13'] = { hole: [s.w / 2 + 5, 28, 34], dir: [0, 1, 0], screw: [s.w / 2 + 5, 22, 46], label: '13' };
      T['14'] = { hole: [s.w / 2 + 5, -28, 34], dir: [0, -1, 0], screw: [s.w / 2 + 5, -22, 46], label: '14' };
      break;
    case 'qoltec':
      ['1', '2', '3', '4'].forEach((id, i) => (T[id] = { hole: [(i - 1.5) * 22, -h / 2, 20], dir: [0, -1, 0], screw: [(i - 1.5) * 22, -h / 2 + 8, 40], label: id }));
      T['5'] = { hole: [-47, -h / 2, 38], dir: [0, -1, 0], label: '5+', free: true };
      T['6'] = { hole: [-42, -h / 2, 38], dir: [0, -1, 0], label: '6−', free: true };
      break;
    case 'meter3':
      ['1', '4', '7', '10'].forEach((id, i) => (T[id] = top(h, (i - 1.5) * 30, zs, id)));
      ['3', '6', '9', '11'].forEach((id, i) => (T[id] = bot(h, (i - 1.5) * 30, zs, id)));
      break;
    case 'mainsw':
      ['L1', 'L2', 'L3', 'N'].forEach((id, i) => (T[id] = top(h, (i - 1.5) * 18, zs, id)));
      ['T1', 'T2', 'T3', 'TN'].forEach((id, i) => (T[id] = bot(h, (i - 1.5) * 18, zs, id === 'TN' ? 'N' : id)));
      break;
    case 'vfd':
      ['PE', 'L1', 'N'].forEach((id, i) => (T[id] = top(h, (i - 1) * 20, 40, id)));
      ['T1', 'T2', 'T3'].forEach((id, i) => (T[id] = bot(h, (i - 1) * 20, 40, id)));
      break;
    case 'feedblocks':
      ts.forEach((t, i) => (T[t.id] = top(h, (i - (ts.length - 1) / 2) * 8.2, 22, t.t || t.id)));
      break;
    case 'busbar':
      ts.forEach((t, i) => (T[t.id] = { hole: [(i - 3) * 9.5, -h / 2, 20], dir: [0, -1, 0], screw: [(i - 3) * 9.5, -h / 2 + 8, 30], label: '' }));
      break;
    case 'penbar':
      ts.forEach((t) => {
        const i = Number(t.id.slice(1));
        const x = t.id[0] === 'p' ? -58 + i * 10 : 18 + i * 10;
        T[t.id] = { hole: [x, -h / 2, 20], dir: [0, -1, 0], screw: [x, -h / 2 + 8, 30], label: t.id === 'p0' ? 'PEN' : '' };
      });
      break;
    case 'pushbtn':
    case 'pilot':
      T[ts[0].id] = top(h, 0, zs, ts[0].t || ts[0].id);
      T[ts[1].id] = bot(h, 0, zs, ts[1].t || ts[1].id);
      break;
    case 'niloe':
      /* 07.jpg: felső blokk „1” és „L”, alsó blokk „2” - kapcsonként 2 nyílás */
      T['1'] = back(-9, 15, '1');
      T.L = back(9, 15, 'L');
      T['2'] = { ...back(-9, -15, '2'), free: p.type === 'sw1' };
      break;
    case 'niloe-x':
      /* 11.jpg: szürke 3 4 fent, piros L1 L2 lent */
      T['3'] = back(-9, 14, '3');
      T['4'] = back(9, 14, '4');
      T.L1 = back(-9, -10, 'L1');
      T.L2 = back(9, -10, 'L2');
      break;
    case 'se-push':
      /* 09.jpg: „1” fent, „L” lent, jobb oldalon */
      T['1'] = back(9, 18, '1');
      T.L = back(9, -18, 'L');
      break;
    case 'socket':
      T.L = back(-15, -10, 'L');
      T.N = back(15, -10, 'N');
      T.PE = back(0, 20, '⏚');
      break;
    case 'lamp':
      T['1'] = back(-10, 0, 'L');
      T['2'] = back(10, 0, 'N');
      break;
    case 'motor': {
      /* kapocstábla a motor tetején; a csavarok felfelé néznek */
      const yTop = h / 2 + 34;
      if (p.type === 'motor6') {
        ['U1', 'V1', 'W1'].forEach((id, i) => (T[id] = { hole: [(i - 1) * 22, yTop, 82], dir: [0, 1, 0], label: id }));
        ['W2', 'U2', 'V2'].forEach((id, i) => (T[id] = { hole: [(i - 1) * 22, yTop, 58], dir: [0, 1, 0], label: id }));
      } else {
        const ids = ts.filter((t) => t.id !== 'PE').map((t) => t.id);
        ids.forEach((id, i) => (T[id] = { hole: [(i - (ids.length - 1) / 2) * 22, yTop, 70], dir: [0, 1, 0], label: id }));
      }
      T.PE = { hole: [44, yTop, 70], dir: [0, 1, 0], label: '⏚' };
      break;
    }
    case 'rod':
      T.E = { hole: [0, h / 2 + 6, 20], dir: [0, 1, 0], label: 'RE' };
      break;
    case 'pipe':
      T.E = { hole: [0, 30, 34], dir: [0, 1, 0], label: 'EPH' };
      break;
    default:
      ts.forEach((t, i) => (T[t.id] = t.dir === 's' ? bot(h, (i - ts.length / 2) * 10, zs, t.t || t.id) : top(h, (i - ts.length / 2) * 10, zs, t.t || t.id)));
  }
  return T;
}

/** A sínen elfoglalt szélesség: a TM2-E08 oldalsó segédérintkező-blokkja is. */
const footW = (q: PlacedPart) => q.w + (q.kind === 'tm2' ? 10 : 0);

/* ---------------------------------------------------------------- régiók */

/** Feladatonkénti szekrények (J: mérőszekrény + lakás főelosztó). */
export const TASK_REGIONS: Record<string, Array<{ titleHu: string; parts: string[] }>> = {
  J: [
    { titleHu: 'Mérőszekrény', parts: ['SUP', 'F0', 'KWH', 'SP1', 'SP2', 'PEN', 'EPH'] },
    { titleHu: 'Lakás főelosztó', parts: ['FM', 'FI', 'F1', 'F2', 'NB', 'PB'] },
  ],
};

/* ------------------------------------------------------------- elrendezés */

export function buildLayout(task: TaskDef): Layout3D {
  const regionsDef = TASK_REGIONS[task.id] || [{ titleHu: '', parts: task.parts.map((p) => p.id) }];
  const enclosed = !!TASK_REGIONS[task.id];
  const placed: PlacedPart[] = task.parts.map((p) => {
    const kind = kindOf(p);
    const dev = (p.dev && REAL_DEVICES[p.dev]) || null;
    const s = sizeOf(p, kind, dev);
    const zone = zoneOf(kind);
    const region = Math.max(0, regionsDef.findIndex((r) => r.parts.includes(p.id)));
    return { part: p, kind, dev, zone, x: 0, y: 0, z0: 0, ...s, terms: termGeoms(p, kind, s), region };
  });

  /* sínre kerülő készülékek régiónként, sorokba töltve (a feladat sorrendje
     nagyjából az energiaút sorrendje). Fekvő képernyőhöz egy régióban széles
     sorok, két szekrénynél keskenyebbek. */
  const cap = enclosed ? 215 : 560;
  type Row = PlacedPart[];
  const regionRows: Row[][] = regionsDef.map(() => []);
  for (const pp of placed.filter((q) => q.zone === 'rail')) {
    const rows = regionRows[pp.region];
    let row = rows[rows.length - 1];
    const len = row ? row.reduce((a, q) => a + footW(q) + GAP, 0) : Infinity;
    if (!row || len + pp.w > cap) rows.push((row = []));
    row.push(pp);
  }
  const nRows = Math.max(1, ...regionRows.map((r) => r.length));
  /* soronként a legmagasabb készülék határozza meg a sor magasságát */
  const rowH: number[] = [];
  for (let r = 0; r < nRows; r++) {
    rowH[r] = Math.max(90, ...regionRows.flatMap((rows) => (rows[r] || []).map((q) => q.h)));
  }

  /* x: szekrényenként saját függőleges csatorna a bal belső oldalon; szekrény
     nélkül egyetlen függőleges csatorna a lap bal szélén */
  const margin = 26;
  const riserW = 40;
  const x0 = 0;
  const regionX: Array<[number, number]> = [];
  const riserXs: number[] = [];
  const regionGap = 90;
  let cursor = x0 + margin + riserW + 14;
  for (const rows of regionRows) {
    const width = Math.max(120, ...rows.map((row) => row.reduce((a, q) => a + footW(q) + GAP, 0)));
    if (enclosed) cursor += 30;
    regionX.push([cursor, cursor + width]);
    riserXs.push(enclosed ? cursor - 22 : x0 + margin + riserW / 2);
    cursor += width + (enclosed ? regionGap : 0);
  }
  let railX1 = cursor - (enclosed ? regionGap : 0);

  /* y: fentről lefelé; a csatorna k a k. sor fölött van */
  const ductY: number[] = [];
  const railY: number[] = [];
  let y = -margin - (enclosed ? 30 : 0);
  for (let r = 0; r < nRows; r++) {
    y -= DUCT_H / 2;
    ductY.push(y);
    y -= DUCT_H / 2 + 14 + rowH[r] / 2;
    railY.push(y);
    y -= rowH[r] / 2 + 14;
  }
  y -= DUCT_H / 2;
  ductY.push(y);
  y -= DUCT_H / 2 + 20;
  const cabinetY0 = ductY[nRows] - DUCT_H / 2 - 10;

  for (let ri = 0; ri < regionRows.length; ri++) {
    regionRows[ri].forEach((row, r) => {
      let x = regionX[ri][0];
      for (const q of row) {
        q.x = x + q.w / 2;
        q.y = railY[r];
        q.tagY = ductY[r] - DUCT_H / 2 + 2;
        q.z0 = q.kind === 'qoltec' || q.kind === 'vfd' ? 0 : RAIL_Z;
        x += footW(q) + GAP;
      }
    });
  }

  /* a lap alján levő elemek (szerelvények, motor, földelő, csövek) ahhoz a
     szekrényhez tartoznak, amelyikbe a vezetékük fut */
  const partOf = new Map(placed.map((q) => [q.part.id, q]));
  const bottom = placed.filter((p) => p.zone !== 'rail');
  for (const q of bottom) {
    const partner = task.solution
      .flatMap(([a, b]) => {
        const pa = a.slice(0, a.indexOf('.'));
        const pb = b.slice(0, b.indexOf('.'));
        return pa === q.part.id ? [pb] : pb === q.part.id ? [pa] : [];
      })
      .map((id) => partOf.get(id))
      .find((o) => o && o.zone === 'rail');
    q.region = partner ? partner.region : 0;
  }
  const bottomTop = y;
  const wallH = 86;
  let bx = x0 + margin + riserW + 20;
  let maxFloorDrop = 0;
  for (let ri = 0; ri < regionX.length; ri++) {
    if (enclosed) bx = Math.max(bx, regionX[ri][0] - 10);
    const mine = bottom.filter((q) => q.region === ri);
    for (const q of [...mine.filter((p) => p.zone === 'wall'), ...mine.filter((p) => p.zone === 'floor')]) {
      if (q.zone === 'wall') {
        q.x = bx + q.w / 2;
        q.y = bottomTop - 20 - wallH / 2;
        q.z0 = 0;
        bx += q.w + 34;
        continue;
      }
      bx += q.kind === 'motor' ? 20 : 0;
      q.x = bx + q.w / 2;
      if (q.kind === 'motor') {
        q.y = bottomTop - 60 - q.h / 2 - 34;
        q.z0 = 40;
      } else if (q.kind === 'rod') {
        q.y = bottomTop - 50 - q.h / 2;
        q.z0 = 10;
      } else {
        q.y = bottomTop - 40 - q.h / 2;
        q.z0 = 6;
      }
      maxFloorDrop = Math.max(maxFloorDrop, bottomTop - (q.y - q.h / 2));
      bx += q.w + (q.kind === 'motor' ? 40 : 26);
    }
  }
  const hasBottom = bottom.length > 0;
  const bottomH = hasBottom ? Math.max(wallH + 50, maxFloorDrop + 10) : 0;
  railX1 = Math.max(railX1, bx);
  const plate: Box = { x0, x1: railX1 + margin, y0: bottomTop - bottomH - margin, y1: 0 };

  const rails: Layout3D['rails'] = [];
  const ducts: Layout3D['ducts'] = [];
  const enclosures: Layout3D['enclosures'] = [];
  regionRows.forEach((rows, ri) => {
    rows.forEach((row, r) => {
      /* a Qoltec lapra csavarozott doboz: mögötte nincs sín */
      const onRail = row.filter((q) => q.z0 > 0);
      if (onRail.length) rails.push({ y: railY[r], x0: regionX[ri][0] - 8, x1: regionX[ri][1] + 4 });
    });
    if (enclosed) {
      enclosures.push({
        titleHu: regionsDef[ri].titleHu,
        x0: regionX[ri][0] - 50,
        x1: regionX[ri][1] + 12,
        y0: cabinetY0,
        y1: ductY[0] + DUCT_H / 2 + 26,
      });
    }
  });
  for (let k = 0; k <= nRows; k++) {
    if (enclosed) regionX.forEach(([a, b]) => ducts.push({ y: ductY[k], x0: a - 42, x1: b + 6 }));
    else ducts.push({ y: ductY[k], x0: x0 + margin + riserW / 2, x1: railX1 + 6 });
  }
  const risers = riserXs
    .filter((x, i, a) => a.indexOf(x) === i)
    .map((x) => ({ x, y0: ductY[nRows] - DUCT_H / 2, y1: ductY[0] + DUCT_H / 2 }));

  /* világkoordinátás kapcsok */
  const terms = new Map<string, T3>();
  for (const q of placed) {
    for (const [id, g] of Object.entries(q.terms)) {
      const key = `${q.part.id}.${id}`;
      terms.set(key, {
        key,
        partId: q.part.id,
        termId: id,
        label: g.label,
        hole: [q.x + g.hole[0], q.y + g.hole[1], q.z0 + g.hole[2]],
        dir: g.dir,
        free: g.free,
      });
    }
  }

  /* -------------------------------------------------------- huzalvezetés
     Szabályok:
     - a kapocsból egyenesen ki a legközelebbi csatornáig (sín fölött/alatt);
     - azonos csatornán belül vízszintesen, saját „sávban” (y, z eltolás);
     - csatornaváltás a szekrény függőleges csatornáján át;
     - két szekrény között minden vezeték az alsó csatorna szintjén, egy
       védőcsövön megy át (J: mért fővezeték);
     - a lap alján levő elemek vezetéke alulról lép be a saját szekrényébe;
     - két fali szerelvény között (kapcsoló → lámpa) közvetlenül, a dobozok
       fölött futó csatornában. */
  const R = nRows;
  const ductOf = (t: T3, q: PlacedPart): number => {
    if (q.zone !== 'rail') return R;
    const r = railY.indexOf(q.y);
    return t.dir[1] > 0 ? r : r + 1;
  };
  const laneCount = new Map<string, number>();
  const lane = (key: string) => {
    const n = laneCount.get(key) || 0;
    laneCount.set(key, n + 1);
    return n;
  };
  const laneY = (i: number) => ((i % 7) - 3) * 4.6;
  const laneZ = (i: number) => 12 + (Math.floor(i / 7) % 5) * 6.5;
  const perTerm = new Map<string, number>();

  /** A kapocsból kifelé a „kikötőig”: onnan már a csatornába megy. */
  function outPath(t: T3, q: PlacedPart, j: number): { pts: Vec3[]; port: Vec3 } {
    const [hx, hy, hz] = t.hole;
    const shift = j * 3.4;
    if (q.zone === 'wall') {
      /* a szerelvény mögött, a dobozban: hátulról be a push-in nyílásba,
         a doboz tetején ki a csatorna felé */
      const zIn = 3.5 + (j % 2) * 1.6;
      const boxTop = q.y + q.h / 2;
      return {
        pts: [t.hole, [hx, hy, zIn], [hx + shift, boxTop - 8, zIn], [hx + shift, boxTop + 10, zIn + 6]],
        port: [hx + shift, boxTop + 10, zIn + 6],
      };
    }
    const s = t.dir[1] >= 0 ? 1 : -1;
    const stub = q.zone === 'floor' ? 14 : 9;
    const p1: Vec3 = [hx, hy + s * stub, hz];
    const p2: Vec3 = [hx + shift, hy + s * (stub + 7), hz];
    return { pts: [t.hole, p1, p2], port: p2 };
  }

  /** Szekrényes elrendezésben az alsó elem vezetéke a szekrény alá fut, és
   *  ott, a szekrény szélességén belül lép be alulról. */
  const underLane = new Map<string, number>();
  function enterFromBelow(q: PlacedPart, port: Vec3, key: string): Vec3[] {
    if (!enclosed) return [];
    const [x0r, x1r] = regionX[q.region];
    const n = underLane.get(String(q.region)) || 0;
    underLane.set(String(q.region) + key, n);
    underLane.set(String(q.region), n + 1);
    const yU = cabinetY0 - 10 - (n % 4) * 4.5;
    const xE = Math.min(Math.max(port[0], x0r - 30 + (n % 8) * 4), x1r - 8);
    return [
      [port[0], yU, port[2]],
      [xE, yU, port[2]],
    ];
  }

  const wires: WirePath[] = [];
  const conduitSet = new Map<string, { y: number; z: number; x0: number; x1: number }>();
  const regionOfPart = (q: PlacedPart) => q.region;
  /** egy csatorna sávjának pontjai: függőlegesen be, vízszintesen végig */
  function viaDuct(pts: Vec3[], from: Vec3, toX: number, k: number, keyLane: string) {
    const l = lane(keyLane);
    const yl = ductY[k] + laneY(l);
    const zl = laneZ(l);
    pts.push([from[0], yl, from[2]], [from[0], yl, zl], [toX, yl, zl]);
    return { yl, zl };
  }
  task.solution.forEach(([a, b, color], index) => {
    const ta = terms.get(a);
    const tb = terms.get(b);
    if (!ta || !tb) return;
    const qa = partOf.get(ta.partId)!;
    const qb = partOf.get(tb.partId)!;
    const ja = perTerm.get(a) || 0;
    const jb = perTerm.get(b) || 0;
    perTerm.set(a, ja + 1);
    perTerm.set(b, jb + 1);
    const oa = outPath(ta, qa, ja);
    const ob = outPath(tb, qb, jb);
    const pts: Vec3[] = [...oa.pts];
    const tail: Vec3[] = [...ob.pts].reverse();
    let pa = oa.port;
    let pb = ob.port;

    /* két alsó elem között közvetlenül, a dobozok fölött */
    if (qa.zone !== 'rail' && qb.zone !== 'rail') {
      const l = lane('wall');
      const yl = bottomTop - 6 + laneY(l) * 0.6;
      const zl = 8 + (l % 4) * 3;
      pts.push([pa[0], yl, pa[2]], [pa[0], yl, zl], [pb[0], yl, zl], [pb[0], yl, pb[2]], ...tail);
      wires.push({ index, a, b, color, step: task.wireStep?.[index] ?? 0, pts: dedupe(pts) });
      return;
    }
    /* alsó elem: szekrényes elrendezésben alulról lép be */
    if (qa.zone !== 'rail') {
      const extra = enterFromBelow(qa, pa, a);
      pts.push(...extra);
      if (extra.length) pa = extra[extra.length - 1];
    }
    const tailExtra: Vec3[] = [];
    if (qb.zone !== 'rail') {
      const extra = enterFromBelow(qb, pb, b);
      if (extra.length) {
        tailExtra.push(...[...extra].reverse());
        pb = extra[extra.length - 1];
      }
    }

    const da = ductOf(ta, qa);
    const db = ductOf(tb, qb);
    const ra = regionOfPart(qa);
    const rb = regionOfPart(qb);
    const [ax, , az] = pa;
    const [bx2, , bz] = pb;

    if (ra === rb && da === db) {
      const { yl } = viaDuct(pts, [ax, 0, az], bx2, da, 'd' + da);
      pts.push([bx2, yl, bz]);
    } else if (ra === rb) {
      const xr0 = riserXs[ra];
      const lr = lane('riser' + ra);
      const xr = xr0 + ((lr % 6) - 2.5) * 4.4;
      const zr = 12 + (Math.floor(lr / 6) % 5) * 6.5;
      const A = viaDuct(pts, [ax, 0, az], xr, da, 'd' + da);
      const lb = lane('d' + db);
      const yb = ductY[db] + laneY(lb);
      const zb = laneZ(lb);
      pts.push([xr, A.yl, zr], [xr, yb, zr], [xr, yb, zb], [bx2, yb, zb], [bx2, yb, bz]);
    } else {
      /* szekrényből szekrénybe: az alsó csatorna szintjén, védőcsőben */
      const lc = lane('cross');
      const yc = ductY[R] + laneY(lc + 2);
      const zc = 18 + (lc % 3) * 5;
      const go = (from: Vec3, d: number, r: number, toX: number): Vec3[] => {
        const out: Vec3[] = [];
        if (d === R) {
          out.push([from[0], yc, from[2]], [from[0], yc, zc], [toX, yc, zc]);
          return out;
        }
        const lr = lane('riser' + r);
        const xr = riserXs[r] + ((lr % 6) - 2.5) * 4.4;
        const zr = 12 + (Math.floor(lr / 6) % 5) * 6.5;
        const l = lane('d' + d);
        const yl = ductY[d] + laneY(l);
        const zl = laneZ(l);
        out.push([from[0], yl, from[2]], [from[0], yl, zl], [xr, yl, zl], [xr, yl, zr], [xr, yc, zr], [xr, yc, zc], [toX, yc, zc]);
        return out;
      };
      const legA = go([ax, 0, az], da, ra, regionX[ra][0]);
      const legB = go([bx2, 0, bz], db, rb, regionX[ra][0]).reverse();
      /* A oldal: a szekrény szélén ki, B oldal: a csőből be */
      pts.push(...legA.slice(0, -1), ...legB.slice(1));
      const xa = Math.min(regionX[ra][1], regionX[rb][1]) + 12;
      const xb = Math.max(regionX[ra][0], regionX[rb][0]) - 50;
      conduitSet.set('cross', { y: ductY[R], z: 23, x0: Math.min(xa, xb), x1: Math.max(xa, xb) });
    }
    pts.push(...tailExtra, ...tail);
    wires.push({ index, a, b, color, step: task.wireStep?.[index] ?? 0, pts: dedupe(pts) });
  });

  /* a betáplálás bejövő kábele: a lap tetejéről a sorkapcsok alsó oldalára */
  const riserX = riserXs[0];
  const feedIn: Layout3D['feedIn'] = [];
  const feed = placed.find((q) => q.kind === 'feedblocks');
  if (feed) {
    const ts = termsOf({ ...feed.part, st: {} });
    ts.forEach((t, i) => {
      const x = feed.x + (i - (ts.length - 1) / 2) * 8.2;
      const yb = feed.y - feed.h / 2;
      const c: WireColor = t.role === 'N' ? 'bl' : t.role === 'PE' || t.t === 'PEN' ? 'gy' : t.t === 'L2' ? 'bk' : t.t === 'L3' ? 'gr' : 'br';
      const zl = 30 + i * 3;
      feedIn.push({
        color: c,
        pts: [
          [x, yb, feed.z0 + 22],
          [x, yb - 12 - i * 2.4, feed.z0 + 22],
          [x - 8 - i * 3, yb - 12 - i * 2.4, zl],
          [riserX + 10 + i * 3, yb - 12 - i * 2.4, zl],
          [riserX + 10 + i * 3, plate.y1 + 40, zl],
        ],
      });
    });
  }

  return {
    plate,
    rails,
    ducts,
    risers,
    enclosures,
    conduits: [...conduitSet.values()],
    parts: placed,
    terms,
    wires,
    feedIn,
  };
}

function dedupe(pts: Vec3[]): Vec3[] {
  const out: Vec3[] = [];
  for (const p of pts) {
    const q = out[out.length - 1];
    if (!q || Math.abs(q[0] - p[0]) + Math.abs(q[1] - p[1]) + Math.abs(q[2] - p[2]) > 0.01) out.push(p);
  }
  return out;
}

/** A huzal hossza (mm) - a vezetékjegyzékhez és a tesztekhez. */
export function pathLength(pts: Vec3[]): number {
  let n = 0;
  for (let i = 1; i < pts.length; i++) {
    n += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]);
  }
  return n;
}
