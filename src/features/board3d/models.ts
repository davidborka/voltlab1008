/**
 * A vizsgatábla készülékeinek eljárással épített 3D modelljei, valós méretben
 * (mm). Minden modell lokális koordinátában épül: x a test közepén, y a test
 * közepén (felfelé), z a hátlaptól (0) kifelé. A kapcsok helye a layout.ts
 * TermGeom adataiból jön, így a csavar, a nyílás és a huzal végpontja
 * ugyanaz a pont.
 *
 * Feliratok és kapocsjelölések: vászon (canvas) textúrák - nem képek, nem
 * fotók.
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { PlacedPart, TermGeom } from './layout';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Obj = any;

/* ------------------------------------------------------------- anyagok */

const matCache = new Map<string, Obj>();
export function mat(color: string, o: { metal?: number; rough?: number; opacity?: number; emissive?: string } = {}): Obj {
  const key = [color, o.metal ?? 0, o.rough ?? 0.62, o.opacity ?? 1, o.emissive ?? ''].join('|');
  let m = matCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color,
      metalness: o.metal ?? 0,
      roughness: o.rough ?? 0.62,
      transparent: (o.opacity ?? 1) < 1,
      opacity: o.opacity ?? 1,
      depthWrite: (o.opacity ?? 1) >= 1,
      emissive: o.emissive ?? '#000000',
    });
    matCache.set(key, m);
  }
  return m;
}

export function disposeCaches() {
  for (const m of matCache.values()) m.dispose();
  matCache.clear();
  for (const t of texCache.values()) t.dispose();
  texCache.clear();
}

const C = {
  white: '#f1f0ec',
  offwhite: '#e7e5df',
  grey: '#c9ccd0',
  midgrey: '#8d9399',
  dark: '#2f3337',
  black: '#17191b',
  steel: '#c7cacd',
  brass: '#c9a24a',
  copper: '#b87333',
  orange: '#e4692e',
  green: '#63b84a',
  tesysGreen: '#3aa335',
  niloeGrey: '#8b8f93',
  red: '#c8352b',
  blue: '#2e62c9',
  finderBlue: '#2f54c8',
  yellow: '#e8c22c',
};

/* ------------------------------------------------------------ geometria */

function box(w: number, h: number, d: number, m: Obj, x = 0, y = 0, z = 0, r = 0): Obj {
  const g = r > 0 ? new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2, h / 2, d / 2)) : new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(g, m);
  mesh.position.set(x, y, z + d / 2);
  return mesh;
}

function cyl(r: number, len: number, m: Obj, axis: 'x' | 'y' | 'z', x = 0, y = 0, z = 0, seg = 20): Obj {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg), m);
  if (axis === 'x') mesh.rotation.z = Math.PI / 2;
  if (axis === 'z') mesh.rotation.x = Math.PI / 2;
  mesh.position.set(x, y, z);
  return mesh;
}

/* ------------------------------------------------------- vászon textúrák */

const texCache = new Map<string, Obj>();
const PX = 10; /* képpont / mm */

/** Vászonra rajzolt sík (pl. előlap felirat), a z+ irányba néz. */
export function canvasPlane(
  key: string,
  wMm: number,
  hMm: number,
  draw: (c: CanvasRenderingContext2D, W: number, H: number) => void,
  o: { transparent?: boolean } = {}
): Obj {
  let tex = texCache.get(key);
  if (!tex) {
    const W = Math.min(2048, Math.max(16, Math.round(wMm * PX)));
    const H = Math.min(2048, Math.max(16, Math.round(hMm * PX)));
    const cv = document.createElement('canvas');
    cv.width = W;
    cv.height = H;
    const c = cv.getContext('2d')!;
    draw(c, W, H);
    tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    texCache.set(key, tex);
  }
  const m = new THREE.MeshBasicMaterial({ map: tex, transparent: o.transparent ?? true, toneMapped: false });
  return new THREE.Mesh(new THREE.PlaneGeometry(wMm, hMm), m);
}

/** Egysoros felirat átlátszó háttérrel. */
export function textPlane(text: string, hMm: number, color = '#111', o: { weight?: number; bg?: string; wMm?: number; align?: CanvasTextAlign } = {}): Obj {
  const wMm = o.wMm ?? Math.max(hMm * 0.62 * text.length + hMm * 0.4, hMm);
  return canvasPlane(`t|${text}|${hMm}|${color}|${o.weight ?? 600}|${o.bg ?? ''}|${wMm}|${o.align ?? 'center'}`, wMm, hMm, (c, W, H) => {
    if (o.bg) {
      c.fillStyle = o.bg;
      c.fillRect(0, 0, W, H);
    }
    c.fillStyle = color;
    c.strokeStyle = color;
    if (text.startsWith('⏚')) {
      /* földelés jele rajzolva - nem minden betűkészletben van ⏚ */
      const rest = text.slice(1).trim();
      const cx = rest ? H * 0.6 : W / 2;
      c.lineWidth = Math.max(2, H * 0.09);
      c.beginPath();
      c.moveTo(cx, H * 0.1);
      c.lineTo(cx, H * 0.48);
      for (const [y, hw] of [[0.48, 0.42], [0.66, 0.28], [0.84, 0.13]]) {
        c.moveTo(cx - H * hw, H * y);
        c.lineTo(cx + H * hw, H * y);
      }
      c.stroke();
      if (rest) {
        c.font = `${o.weight ?? 600} ${Math.round(H * 0.82)}px Inter, Arial, sans-serif`;
        c.textAlign = 'left';
        c.textBaseline = 'middle';
        c.fillText(rest, H * 1.25, H / 2 + H * 0.04);
      }
      return;
    }
    c.font = `${o.weight ?? 600} ${Math.round(H * 0.82)}px Inter, Arial, sans-serif`;
    c.textAlign = o.align ?? 'center';
    c.textBaseline = 'middle';
    c.fillText(text, o.align === 'left' ? 4 : W / 2, H / 2 + H * 0.04);
  });
}

function put(o: Obj, x: number, y: number, z: number, ry = 0, rx = 0): Obj {
  o.position.set(x, y, z);
  if (ry) o.rotation.y = ry;
  if (rx) o.rotation.x = rx;
  return o;
}

/** Többsoros előlap-felirat: [szöveg, méret mm, szín, súly]. */
function faceText(key: string, w: number, h: number, lines: Array<[string, number, string?, number?]>, bg?: string): Obj {
  return canvasPlane(`f|${key}`, w, h, (c, W, H) => {
    if (bg) {
      c.fillStyle = bg;
      c.fillRect(0, 0, W, H);
    }
    const total = lines.reduce((a, l) => a + l[1] * 1.25, 0);
    let y = (H - total * PX) / 2;
    for (const [t, s, col, wt] of lines) {
      const px = s * PX;
      y += px * 1.25;
      c.fillStyle = col || '#222';
      c.font = `${wt ?? 600} ${Math.round(px)}px Inter, Arial, sans-serif`;
      c.textAlign = 'center';
      c.textBaseline = 'alphabetic';
      c.fillText(t, W / 2, y - px * 0.22, W - 4);
    }
  });
}

/* --------------------------------------------------------------- kapcsok */

/** Csavarfej keresztréssel a homloklapon, a z+ irányba nézve. */
function screwHead(x: number, y: number, z: number, r = 2.6): Obj {
  const g = new THREE.Group();
  g.add(cyl(r, 1.4, mat(C.steel, { metal: 0.85, rough: 0.32 }), 'z', 0, 0, 0.7, 18));
  g.add(box(r * 1.5, 0.55, 0.5, mat('#4a4d50', { metal: 0.6 }), 0, 0, 1.2));
  g.add(box(0.55, r * 1.5, 0.5, mat('#4a4d50', { metal: 0.6 }), 0, 0, 1.2));
  g.position.set(x, y, z);
  return g;
}

/** A vezeték bevezető nyílása a felső/alsó homloklapon. */
function holeMark(t: TermGeom, w = 5.2, d = 6): Obj {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat('#0b0c0d'));
  m.rotation.x = t.dir[1] > 0 ? -Math.PI / 2 : Math.PI / 2;
  m.position.set(t.hole[0], t.hole[1] + t.dir[1] * 0.15, t.hole[2]);
  return m;
}

/** Push-in nyílások (kapcsonként 2) a szerkezet hátoldalán. */
function pushInBlock(t: TermGeom, color: string): Obj {
  const g = new THREE.Group();
  g.add(box(13, 7, 4.5, mat(color), t.hole[0] + 2.2, t.hole[1], t.hole[2], 1.2));
  for (const dx of [0, 5]) {
    const hole = new THREE.Mesh(new THREE.CircleGeometry(1.8, 14), mat('#0b0c0d'));
    hole.rotation.y = Math.PI;
    hole.position.set(t.hole[0] + dx - 0.3, t.hole[1], t.hole[2] - 0.05);
    g.add(hole);
  }
  return g;
}

/** A nyomtatott kapocsjelölés a csavar mellett. */
function termLabel(t: TermGeom, color = '#1d1f22', size = 3.6): Obj | null {
  if (!t.label) return null;
  const s = t.screw || t.hole;
  const towards = t.dir[1] > 0 ? -1 : t.dir[1] < 0 ? 1 : 0;
  const p = textPlane(t.label, size, color, { weight: 700 });
  if (t.dir[2] < 0) {
    /* hátoldali kapocs: a felirat a nyílás mellett, előre nézve (átlátszó testen át olvasható) */
    return put(p, t.hole[0] + 2.2, t.hole[1] + 6, t.hole[2] + 0.4);
  }
  return put(p, s[0], s[1] + towards * 5.6, s[2] + 0.25);
}

/* --------------------------------------------------- moduláris ház */

interface ModOpts {
  body?: string;
  shoulder?: number;
  nose?: number;
  noseH?: number;
}

/** DIN 43880 szerinti moduláris ház: hátsó test, váll, 45 mm-es homlok. */
function modular(q: PlacedPart, o: ModOpts = {}): { g: Obj; front: number; noseH: number } {
  const g = new THREE.Group();
  const body = mat(o.body || C.white);
  const shoulder = o.shoulder ?? 44;
  const nose = o.nose ?? Math.min(q.d, 61);
  const noseH = o.noseH ?? 45;
  g.add(box(q.w - 0.4, q.h, shoulder, body, 0, 0, 0, 1.5));
  g.add(box(q.w - 0.4, noseH, nose - shoulder, body, 0, 0, shoulder - 0.2, 1.5));
  /* DIN-sín pattintó */
  g.add(box(q.w - 2, 9, 3, mat(C.midgrey), 0, -q.h / 2 + 4.5, -3));
  for (const t of Object.values(q.terms)) {
    if (t.dir[1] === 0) continue;
    g.add(holeMark(t));
    if (t.screw) g.add(screwHead(t.screw[0], t.screw[1], shoulder + 0.05));
    const lb = termLabel({ ...t, screw: t.screw ? [t.screw[0], t.screw[1], shoulder] : undefined });
    if (lb) g.add(lb);
  }
  return { g, front: nose, noseH };
}

function toggle(g: Obj, x: number, y: number, z: number, w = 9, color = C.black, len = 11) {
  g.add(box(w, 13, len, mat(color, { rough: 0.45 }), x, y, z, 1.4));
}

/* ------------------------------------------------------- típusmodellek */

function rating(q: PlacedPart): string {
  const m = q.dev?.model.match(/\b([BC]\d+)\b/);
  if (q.dev?.id === 'legrand-rx3-1p') return 'B ?';
  return m ? m[1] : '';
}

function rx3(q: PlacedPart): Obj {
  const { g, front } = modular(q, { shoulder: 43.9, nose: 60 });
  toggle(g, 0, 10, front, 8.5, C.black, 11.6);
  g.add(put(faceText(`rx3|${rating(q)}`, q.w - 1.5, 20, [['legrand', 2.7, '#d22630', 800], ['RX³', 3.4, '#222', 700], [rating(q), 4.2, '#111', 800], ['6000', 2.3, '#333', 600]]), 0, -12, front + 0.15));
  return g;
}

function easy9_3p(q: PlacedPart): Obj {
  const { g, front } = modular(q, { shoulder: 44, nose: 60 });
  g.add(box(q.w - 2, 3, 0.6, mat(C.tesysGreen), 0, 19.5, front));
  g.add(box(q.w - 4, 12, 9, mat('#5b6066', { rough: 0.5 }), 0, -1, front, 1.2));
  g.add(put(faceText('easy9-3p', q.w - 4, 13, [['Schneider Electric', 2.6, C.tesysGreen, 800], ['Easy9  C16  3P', 3, '#222', 700]]), 0, 11.5, front + 0.15));
  return g;
}

function rcd2(q: PlacedPart, ideal: boolean): Obj {
  const { g, front } = modular(q, { shoulder: 44, nose: 61 });
  toggle(g, ideal ? 3 : -6, 0, front, 9, ideal ? C.black : '#7a7f86', 11);
  if (ideal) {
    g.add(cyl(5, 2.4, mat('#f39a2c'), 'z', -10, 14, front + 1.2));
    g.add(put(textPlane('T', 4, '#222', { weight: 800 }), -10, 14, front + 2.5));
    g.add(put(faceText('ideal', q.w - 4, 14, [['IDEAL  KRD10-2/25/30-AC', 2.3, '#222', 700], ['In=25A  IΔn=30mA', 2.6, '#111', 700]]), 0, -14.5, front + 0.15));
  } else {
    g.add(cyl(3.4, 2, mat('#9aa0a6'), 'z', 9, -14, front + 1));
    g.add(put(textPlane('T', 3.2, '#222', { weight: 800 }), 9, -14, front + 2.1));
    g.add(put(faceText('rx3rcd', q.w - 4, 14, [['legrand  RX³', 2.8, '#d22630', 800], ['25 A  30 mA  AC', 2.8, '#111', 700]]), 0, 14, front + 0.15));
  }
  return g;
}

function easy9_4p(q: PlacedPart): Obj {
  const { g, front } = modular(q, { shoulder: 44, nose: 60 });
  g.add(box(q.w - 2, 3, 0.6, mat(C.tesysGreen), 0, 19.5, front));
  toggle(g, -12, 0, front, 18, '#5b6066', 10);
  g.add(cyl(3.6, 2, mat('#9aa0a6'), 'z', 22, -12, front + 1));
  g.add(put(textPlane('T', 3.2, '#222', { weight: 800 }), 22, -12, front + 2.1));
  g.add(put(faceText('easy9-4p', 34, 14, [['Schneider  Easy9', 2.8, C.tesysGreen, 800], ['25 A  30 mA  AC', 2.8, '#111', 700]]), 14, 8, front + 0.15));
  return g;
}

function cartridge(g: Obj, x: number, w: number, z: number, color: string, key: string, lines: Array<[string, number, string?, number?]>) {
  g.add(box(w - 0.8, 50, 24, mat(color, { rough: 0.5 }), x, -1, z - 2, 1.2));
  g.add(put(faceText(key, w - 2, 46, lines), x, -2, z + 22.05));
  g.add(box(9, 4.5, 0.6, mat('#7fd36b', { emissive: '#1b4d12' }), x, 18, z + 22));
}

function schelinger(q: PlacedPart): Obj {
  const { g } = modular(q, { shoulder: 44, nose: 46, noseH: 52 });
  for (let i = 0; i < 4; i++) {
    cartridge(g, (i - 1.5) * 18, 18, 44, C.orange, 'schel', [
      ['GREEN-OK', 1.5, '#222', 700],
      ['Schelinger', 2.1, '#fff', 800],
      ['SPD01-4P-B+C', 1.7, '#222', 700],
      ['Uc=275V', 1.7, '#222', 600],
      ['Iimp 5kA', 1.7, '#222', 600],
      ['In 20kA', 1.7, '#222', 600],
      ['Up≤1,5kV', 1.7, '#222', 600],
      ['T1  T2', 1.8, '#222', 800],
    ]);
  }
  return g;
}

function elmarkSpd(q: PlacedPart): Obj {
  const { g } = modular(q, { shoulder: 43.5, nose: 46, noseH: 52 });
  cartridge(g, 0, 18, 43.5, '#5fbf3f', 'elmark', [
    ['ELMARK', 2.2, '#123', 800],
    ['SPD-C10', 2, '#123', 800],
    ['Uc~275V', 1.7, '#123', 600],
    ['In 10kA', 1.7, '#123', 600],
    ['Imax 20kA', 1.6, '#123', 600],
    ['Up≤1,2kV', 1.7, '#123', 600],
  ]);
  return g;
}

function minTimer(q: PlacedPart): Obj {
  const g = new THREE.Group();
  const body = mat(C.white);
  /* alul lépcsős kapocsrész: felső lépcső (előrébb) és alsó sor */
  g.add(box(q.w - 0.4, q.h - 12, 44, body, 0, 6, 0, 1.2));
  g.add(box(q.w - 0.4, 12, 30, body, 0, -q.h / 2 + 6, 0, 1));
  g.add(box(q.w - 0.4, 45, 24, body, 0, 4, 44 - 0.2, 1.2));
  g.add(box(q.w - 0.4, 12, 14, body, 0, -q.h / 2 + 18, 36, 1));
  g.add(box(q.w - 2, 9, 3, mat(C.midgrey), 0, -q.h / 2 + 4.5, -3));
  g.add(box(9, 7, 4, mat('#7d8288'), 3, 20, 68));
  g.add(box(10, 16, 2, mat('#d5d7da'), -2, -2, 68));
  g.add(put(faceText('min', q.w - 2, 40, [['auto', 1.8, '#555'], ['Schneider', 2.1, C.tesysGreen, 800], ['1-7 min', 2, '#222', 700], ['15363', 2, '#222', 700], ['MIN', 2.2, '#222', 800]]), 0, 4, 68.1));
  g.add(put(faceText('min-diag', q.w - 2, 18, [['L  3', 2.2, '#333', 700], ['N  4', 2.2, '#333', 700]]), 0, q.h / 2 - 12, 44.1));
  for (const t of Object.values(q.terms)) {
    g.add(holeMark(t));
    if (t.screw) g.add(screwHead(t.screw[0], t.screw[1], t.screw[2], 2.2));
    const lb = termLabel(t, '#1d1f22', 3);
    if (lb) g.add(lb);
  }
  return g;
}

function finder(q: PlacedPart): Obj {
  const { g, front } = modular(q, { body: '#d9dadd', shoulder: 44, nose: 61 });
  g.add(cyl(5.5, 2, mat(C.finderBlue), 'z', 0, 4, front + 1));
  g.add(box(1.4, 8, 0.6, mat('#ffffff'), 0, 4, front + 2.1));
  g.add(cyl(2.6, 2.4, mat(C.finderBlue), 'z', 0, -9, front + 1.2));
  g.add(cyl(2.6, 2.4, mat(C.finderBlue), 'z', 0, -16, front + 1.2));
  g.add(box(2.4, 3.4, 0.8, mat('#2d6b2a', { emissive: '#114411' }), -5, 15, front));
  g.add(put(faceText('finder', q.w - 2, 8, [['finder', 2.3, '#2a2a2a', 800], ['TYPE 82.01', 1.8, '#222', 700]]), 0, -2 - 18.5, front + 0.15));
  return g;
}

function tesys(q: PlacedPart): Obj {
  const g = new THREE.Group();
  const body = mat(C.dark, { rough: 0.55 });
  const h = q.h;
  g.add(box(q.w, h, 60, body, 0, 0, 0, 2));
  g.add(box(q.w, h - 22, 15, body, 0, 0, 59.8, 2));
  g.add(box(q.w - 4, 38, 11, mat('#121314', { rough: 0.25 }), 0, 0, 74.6, 2));
  g.add(put(faceText('tesys-band', q.w - 5, 10, [['TeSys      Schneider', 3.2, '#ffffff', 800]], C.tesysGreen), 0, 13, 85.7));
  g.add(put(faceText('tesys-ctrl', q.w - 8, 5, [['Control', 2.4, '#e8e8e8', 600]]), -6, 3, 85.7));
  g.add(put(textPlane('LC1 D18', 3.2, '#d8d8d8', { weight: 600 }), -14, h / 2 - 15, 75.1));
  g.add(box(q.w - 4, 6, 4, mat(C.midgrey), 0, -h / 2 + 3, -3));
  for (const t of Object.values(q.terms)) {
    const front = t.hole[2] > 90;
    if (front) continue;
    g.add(holeMark(t));
    const zFace = t.hole[2] > 60 ? 75 : 60;
    if (t.screw) g.add(screwHead(t.screw[0], t.screw[1], zFace + 0.05));
    const lb = termLabel({ ...t, screw: t.screw ? [t.screw[0], t.screw[1], zFace] : undefined }, '#e9ecef', 3.1);
    if (lb) g.add(lb);
  }
  /* homlokra pattintott segédérintkező-blokk (nem a fotókon) */
  const extra = Object.values(q.terms).filter((t) => t.hole[2] > 90);
  if (extra.length) {
    g.add(box(q.w - 7, 32, 30, mat('#3a3f44', { rough: 0.5 }), 0, -9, 86));
    g.add(put(faceText('ladn', q.w - 10, 6, [['segédérintkező-blokk', 1.9, '#e0e0e0', 600]]), 0, -9, 116.1));
    for (const t of extra) {
      g.add(holeMark(t, 4.5, 5));
      if (t.screw) g.add(screwHead(t.screw[0], t.screw[1], 116.05, 2.2));
      const lb = termLabel({ ...t, screw: t.screw ? [t.screw[0], t.screw[1], 116] : undefined }, '#e9ecef', 3);
      if (lb) g.add(lb);
    }
  }
  return g;
}

function tm2(q: PlacedPart): Obj {
  const { g, front } = modular(q, { body: '#e9eaec', shoulder: 34, nose: 66, noseH: 50 });
  g.add(box(q.w - 0.4, 22, 34, mat(C.dark), 0, -q.h / 2 + 11, 0));
  g.add(box(13, 12, 10, mat(C.red, { rough: 0.45 }), 9, -6, front, 1.5));
  g.add(box(12, 11, 6, mat(C.black, { rough: 0.45 }), -9, -6, front, 2));
  g.add(cyl(5.5, 1.6, mat('#f4f4f4'), 'z', 12, 13, front + 0.8));
  g.add(put(faceText('tm2', q.w - 6, 9, [['ELMARK  TM2-E08', 2.4, '#1d3d7a', 800], ['STOP      START', 1.8, '#333', 700]]), -5, 14, front + 0.15));
  /* oldalsó 13-14 segédérintkező-blokk */
  g.add(box(9, 70, 46, mat('#d6d8db'), q.w / 2 + 5, 0, 0, 1));
  for (const t of [q.terms['13'], q.terms['14']]) {
    g.add(holeMark(t, 4.5, 5));
    if (t.screw) g.add(screwHead(t.screw[0], t.screw[1], 46.05, 2));
    const lb = termLabel({ ...t, screw: t.screw ? [t.screw[0], t.screw[1], 46] : undefined }, '#222', 2.8);
    if (lb) g.add(lb);
  }
  return g;
}

function qoltec(q: PlacedPart): Obj {
  const g = new THREE.Group();
  g.add(box(q.w, q.h, q.d - 6, mat('#dcdedf'), 0, 0, 0, 3));
  /* átlátszó plombálható fedél */
  g.add(box(q.w - 4, q.h - 4, 6, mat('#cfe6f0', { opacity: 0.28, rough: 0.05 }), 0, 0, q.d - 6.2, 2.5));
  g.add(put(faceText('qoltec-face', q.w - 12, 82, [
    ['Qoltec®', 5.2, '#333', 800],
    [' ', 9],
    ['SINGLE PHASE KWH METER', 3, '#333', 700],
    ['Pulse ●      Model:50888', 2.7, '#444', 600],
    [' ', 1.5],
    ['230V 5(60)A 50Hz 1600imp/kWh', 2.6, '#ffffff', 700],
    [' ', 2.5],
    ['5 6: impulzus', 2.2, '#444', 600],
    ['L-1  2-L     N-3  4-N', 2.8, '#333', 700],
  ]), 0, 10, q.d - 6.05));
  g.add(box(q.w - 14, 6.5, 0.4, mat('#1e1f21'), 0, -11.2, q.d - 6.1));
  g.add(box(60, 17, 1, mat('#9bab8e', { rough: 0.3 }), 0, 27, q.d - 6.2));
  g.add(put(faceText('qoltec-lcd', 56, 13, [['000000.1', 9, '#1f2a1a', 700]]), 0, 27, q.d - 5.1));
  /* alsó kapocsrész a fedél alatt */
  g.add(box(q.w - 6, 20, 30, mat('#cfd2d4'), 0, -q.h / 2 + 10, 6));
  for (const t of Object.values(q.terms)) {
    g.add(holeMark(t, t.free ? 3.2 : 7, t.free ? 4 : 8));
    if (t.screw) g.add(screwHead(t.screw[0], t.screw[1], 36.05, 3));
    const lb = termLabel({ ...t, screw: t.screw ? [t.screw[0], t.screw[1], 36] : [t.hole[0], t.hole[1] + 10, 36] }, '#222', 3.4);
    if (lb) g.add(lb);
  }
  return g;
}

function genericModular(q: PlacedPart, body: string, title: string[], extra?: (g: Obj, front: number) => void): Obj {
  const { g, front } = modular(q, { body, shoulder: 44, nose: Math.min(q.d, 62) });
  if (extra) extra(g, front);
  g.add(put(faceText(`gen|${q.kind}|${title.join('|')}`, q.w - 3, 13, title.map((t, i) => [t, i ? 2.4 : 3, '#222', 700] as [string, number, string, number])), 0, -14, front + 0.15));
  return g;
}

function feedBlocks(q: PlacedPart): Obj {
  const g = new THREE.Group();
  const ids = Object.keys(q.terms);
  ids.forEach((id, i) => {
    const t = q.terms[id];
    const x = (i - (ids.length - 1) / 2) * 8.2;
    const lab = t.label;
    const color = lab === 'N' ? '#2e62c9' : lab === 'PE' || lab === 'PEN' ? '#4caf50' : '#9aa0a6';
    g.add(box(7.8, q.h, 36, mat(color), x, 0, 0, 0.8));
    g.add(box(7.8, q.h - 24, 9, mat(color), x, 0, 35.8, 0.8));
    if (lab === 'PE' || lab === 'PEN') {
      for (let k = -2; k <= 2; k++) g.add(box(7.9, 2.2, 0.4, mat(C.yellow), x, k * 5, 44.9));
      if (lab === 'PEN') g.add(box(7.9, 3, 0.5, mat('#2e62c9'), x, 15, 45));
    }
    g.add(holeMark(t, 5, 5));
    g.add(holeMark({ ...t, hole: [x, -q.h / 2, 22], dir: [0, -1, 0] }, 5, 5));
    g.add(screwHead(x, q.h / 2 - 7, 36.05, 2.2));
    g.add(screwHead(x, -q.h / 2 + 7, 36.05, 2.2));
    g.add(put(textPlane(lab, 3.4, '#111', { weight: 800, bg: '#ffffff', wMm: 7.4 }), x, 0, 45.1));
  });
  return g;
}

function busbar(q: PlacedPart): Obj {
  const g = new THREE.Group();
  const role = q.part.opt?.role;
  const base = role === 'N' ? '#2e62c9' : '#3e9b47';
  g.add(box(q.w, q.h, 18, mat(base), 0, 0, 0, 1.5));
  g.add(box(q.w - 4, 9, 10, mat(C.brass, { metal: 0.85, rough: 0.35 }), 0, -q.h / 2 + 6, 17.5));
  for (const t of Object.values(q.terms)) {
    g.add(holeMark({ ...t, hole: [t.hole[0], t.hole[1] + 1.5, 22.5] }, 3.6, 3.6));
    g.add(screwHead(t.hole[0], -q.h / 2 + 6, 27.6, 1.9));
  }
  g.add(put(textPlane(role === 'N' ? 'N' : '⏚ PE', 5, '#ffffff', { weight: 800, wMm: role === 'N' ? 5 : 16 }), 0, 6, 18.1));
  return g;
}

function penbar(q: PlacedPart): Obj {
  const g = new THREE.Group();
  g.add(box(58, q.h, 18, mat('#3e9b47'), -38, 0, 0, 1.5));
  g.add(box(58, q.h, 18, mat('#2e62c9'), 38, 0, 0, 1.5));
  g.add(box(54, 9, 10, mat(C.brass, { metal: 0.85, rough: 0.35 }), -38, -q.h / 2 + 6, 17.5));
  g.add(box(54, 9, 10, mat(C.brass, { metal: 0.85, rough: 0.35 }), 38, -q.h / 2 + 6, 17.5));
  /* oldható híd a PE- és az N-sín között */
  g.add(box(30, 5, 3, mat('#d8b24c', { metal: 0.9, rough: 0.3 }), 0, -q.h / 2 + 6, 28));
  g.add(screwHead(-12, -q.h / 2 + 6, 31, 1.8));
  g.add(screwHead(12, -q.h / 2 + 6, 31, 1.8));
  for (const t of Object.values(q.terms)) {
    g.add(holeMark({ ...t, hole: [t.hole[0], t.hole[1] + 1.5, 22.5] }, 3.6, 3.6));
    g.add(screwHead(t.hole[0], -q.h / 2 + 6, 27.6, 1.9));
  }
  g.add(put(textPlane('PE ← PEN', 4.2, '#ffffff', { weight: 800 }), -38, 6, 18.1));
  g.add(put(textPlane('N', 5, '#ffffff', { weight: 800 }), 38, 6, 18.1));
  g.add(put(textPlane('híd', 3, '#222', { weight: 700 }), 0, -q.h / 2 + 13, 28.2));
  return g;
}

/* --------------------------------------------- fali szerelvények */

function wallBox(g: Obj, q: PlacedPart) {
  /* falon kívüli doboz: átlátszó, hogy a hátoldali bekötés látsszon */
  g.add(box(q.w, q.h, 40, mat('#f4f4f2', { opacity: 0.22, rough: 0.2 }), 0, 0, 0, 4));
  g.add(box(14, 4, 6, mat('#bfc3c7'), 0, q.h / 2 - 2, 2));
}

function niloe(q: PlacedPart, cross: boolean): Obj {
  const g = new THREE.Group();
  wallBox(g, q);
  g.add(box(76, 76, 1.6, mat(C.niloeGrey, { opacity: 0.55 }), 0, 0, 40));
  g.add(box(50, 50, 31, mat(C.niloeGrey, { opacity: 0.42 }), 0, 0, 9));
  g.add(box(45, 45, 12, mat('#fbfbfa', { rough: 0.35 }), 0, 0, 41.5, 3));
  if (cross) g.add(put(textPlane('✕', 8, '#9a9a9a'), 0, 0, 53.6));
  for (const t of Object.values(q.terms)) {
    const red = cross && (t.label === 'L1' || t.label === 'L2');
    g.add(pushInBlock(t, red ? '#d23b2f' : '#8f9397'));
    const lb = termLabel(t, red ? '#b3261e' : '#1d1f22', 3.6);
    if (lb) g.add(lb);
  }
  g.add(put(textPlane(cross ? 'Niloé 7 645 04' : 'Niloé', 3.4, '#555', { weight: 700 }), 0, -q.h / 2 + 6, 40.2));
  return g;
}

function sePush(q: PlacedPart): Obj {
  const g = new THREE.Group();
  wallBox(g, q);
  g.add(box(71, 71, 1.4, mat(C.steel, { metal: 0.7, rough: 0.4, opacity: 0.7 }), 0, 0, 40));
  g.add(box(46, 46, 31, mat('#f2f2f0', { opacity: 0.45 }), 0, 0, 9));
  g.add(box(48, 48, 11, mat('#fbfbfa', { rough: 0.35 }), 0, 0, 41.5, 3));
  g.add(
    put(
      canvasPlane('bell', 9, 9, (c, W, H) => {
        c.strokeStyle = '#444';
        c.lineWidth = W * 0.07;
        c.beginPath();
        c.moveTo(W * 0.2, H * 0.72);
        c.quadraticCurveTo(W * 0.28, H * 0.2, W * 0.5, H * 0.2);
        c.quadraticCurveTo(W * 0.72, H * 0.2, W * 0.8, H * 0.72);
        c.closePath();
        c.moveTo(W * 0.42, H * 0.82);
        c.lineTo(W * 0.58, H * 0.82);
        c.stroke();
      }),
      14,
      -14,
      52.6
    )
  );
  for (const t of Object.values(q.terms)) {
    g.add(pushInBlock(t, '#e9e9e6'));
    const lb = termLabel(t, '#1d1f22', 3.6);
    if (lb) g.add(lb);
  }
  return g;
}

function socket(q: PlacedPart): Obj {
  const g = new THREE.Group();
  wallBox(g, q);
  g.add(box(70, 70, 16, mat('#fbfbfa'), 0, 0, 40, 6));
  g.add(cyl(19, 6, mat('#e8e8e6'), 'z', 0, 0, 54));
  for (const dx of [-9.5, 9.5]) g.add(cyl(2.2, 1, mat('#111'), 'z', dx, 0, 57.2));
  g.add(box(4, 7, 1, mat(C.steel, { metal: 0.8 }), 0, 17, 57));
  g.add(box(4, 7, 1, mat(C.steel, { metal: 0.8 }), 0, -17, 57));
  g.add(box(56, 40, 10, mat('#d9dadb', { opacity: 0.45 }), 0, 0, 6));
  for (const t of Object.values(q.terms)) {
    g.add(box(8, 6, 4, mat(C.brass, { metal: 0.8 }), t.hole[0], t.hole[1], t.hole[2]));
    const lb = termLabel(t, '#1d1f22', 3.6);
    if (lb) g.add(lb);
  }
  return g;
}

function lamp(q: PlacedPart): Obj {
  const g = new THREE.Group();
  wallBox(g, q);
  g.add(cyl(30, 12, mat('#fbfbfa'), 'z', 0, 0, 46));
  g.add(cyl(13, 18, mat('#ededeb'), 'z', 0, 0, 61));
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(22, 24, 18), mat('#fff6d8', { opacity: 0.85, emissive: '#5a4b18' }));
  bulb.position.set(0, 0, 92);
  g.add(bulb);
  g.add(box(46, 20, 10, mat('#d9dadb', { opacity: 0.45 }), 0, 0, 6));
  for (const t of Object.values(q.terms)) {
    g.add(box(8, 6, 4, mat(C.brass, { metal: 0.8 }), t.hole[0], t.hole[1], t.hole[2]));
    const lb = termLabel(t, '#1d1f22', 3.6);
    if (lb) g.add(lb);
  }
  return g;
}

/* ---------------------------------------------- padló: motor, földelő, cső */

function motor(q: PlacedPart): Obj {
  const g = new THREE.Group();
  const len = q.w - 40;
  const body = mat('#5f7f99', { rough: 0.45, metal: 0.3 });
  g.add(cyl(56, len, body, 'x', -10, 0, 65, 32));
  for (let i = -5; i <= 5; i++) g.add(box(len - 10, 2.5, 6, body, -10, Math.cos(i / 3.2) * 50, 65 + Math.sin(i / 3.2) * 50 - 3));
  g.add(cyl(54, 26, mat('#4c6a82', { rough: 0.5 }), 'x', -10 - len / 2 - 12, 0, 65, 28));
  g.add(cyl(9, 40, mat(C.steel, { metal: 0.9, rough: 0.3 }), 'x', -10 + len / 2 + 20, 0, 65));
  g.add(box(len - 30, 10, 90, mat('#4c6a82'), -10, -q.h / 2 + 5, 20));
  /* kapocsdoboz a tetején */
  g.add(box(100, 30, 64, mat('#55728b'), 0, q.h / 2 + 15, 38, 3));
  g.add(box(92, 2, 58, mat('#2d3a45'), 0, q.h / 2 + 30.5, 41));
  for (const t of Object.values(q.terms)) {
    g.add(cyl(2.6, 7, mat(C.brass, { metal: 0.9, rough: 0.3 }), 'y', t.hole[0], t.hole[1] - 3.5, t.hole[2], 12));
    g.add(put(textPlane(t.label, 4.2, '#ffffff', { weight: 800 }), t.hole[0], t.hole[1] - 1.7, t.hole[2] + 7, 0, -Math.PI / 2));
  }
  g.add(put(textPlane(q.part.type === 'motor1' ? 'M 1~' : 'M 3~', 12, '#ffffff', { weight: 800 }), -10, 0, 121.5));
  return g;
}

function rod(q: PlacedPart): Obj {
  const g = new THREE.Group();
  g.add(cyl(8, q.h, mat(C.copper, { metal: 0.8, rough: 0.35 }), 'y', 0, 0, 20, 18));
  g.add(box(26, 10, 18, mat(C.brass, { metal: 0.85, rough: 0.35 }), 0, q.h / 2 - 2, 11));
  g.add(put(textPlane('földelő (RE)', 6, '#333', { weight: 700 }), 0, -q.h / 2 - 8, 30));
  return g;
}

function pipe(q: PlacedPart): Obj {
  const g = new THREE.Group();
  const name = (q.part.label || '').toLowerCase();
  const color = name.startsWith('g') ? '#d9b23a' : name.startsWith('f') ? '#c94b3b' : '#9fb3c2';
  g.add(cyl(14, q.h, mat(color, { metal: 0.6, rough: 0.35 }), 'y', 0, 0, 20, 22));
  g.add(cyl(15.5, 10, mat(C.brass, { metal: 0.9, rough: 0.3 }), 'y', 0, 30, 20, 22));
  g.add(box(10, 12, 8, mat(C.brass, { metal: 0.9, rough: 0.3 }), 0, 30, 30));
  g.add(put(textPlane(`${q.part.label} fővezeték`, 6, '#333', { weight: 700 }), 0, -q.h / 2 - 8, 36));
  return g;
}

/* ------------------------------------------------------------- belépő */

/** A készülék 3D modellje világkoordinátába helyezve. */
export function buildPart(q: PlacedPart): Obj {
  let g: Obj;
  switch (q.kind) {
    case 'rx3':
      g = rx3(q);
      break;
    case 'easy9-3p':
      g = easy9_3p(q);
      break;
    case 'ideal':
      g = rcd2(q, true);
      break;
    case 'rx3-rcd':
      g = rcd2(q, false);
      break;
    case 'easy9-4p':
      g = easy9_4p(q);
      break;
    case 'schelinger':
      g = schelinger(q);
      break;
    case 'elmark-spd':
      g = elmarkSpd(q);
      break;
    case 'min':
      g = minTimer(q);
      break;
    case 'finder':
      g = finder(q);
      break;
    case 'tesys':
      g = tesys(q);
      break;
    case 'tm2':
      g = tm2(q);
      break;
    case 'qoltec':
      g = qoltec(q);
      break;
    case 'meter3':
      g = genericModular(q, '#d6d8da', ['kWh 3~', 'általános'], (gg, f) => gg.add(box(60, 14, 1, mat('#9bab8e'), 0, 8, f)));
      break;
    case 'mainsw':
      g = genericModular(q, '#d6d8da', ['főkapcsoló', 'általános'], (gg, f) => gg.add(box(30, 12, 11, mat(C.red), 0, 6, f, 1.5)));
      break;
    case 'vfd':
      g = genericModular(q, '#3a3f44', ['frekvenciaváltó', 'általános'], (gg, f) => gg.add(box(40, 18, 1, mat('#7dd3a8', { emissive: '#0d3322' }), 0, 20, f)));
      break;
    case 'pushbtn': {
      const red = q.part.type === 'btnNC';
      g = genericModular(q, '#c9ccd0', [q.part.label || 'S', red ? 'bontó' : 'záró'], (gg, f) =>
        gg.add(cyl(6.5, 6, mat(red ? C.red : '#3fa34d', { rough: 0.4 }), 'z', 0, 6, f + 3))
      );
      break;
    }
    case 'pilot': {
      const col = q.part.opt?.color === 'red' ? '#e2483c' : '#49c45a';
      g = genericModular(q, '#c9ccd0', [q.part.label || 'H', 'jelzőlámpa'], (gg, f) =>
        gg.add(cyl(6.5, 5, mat(col, { opacity: 0.85, emissive: '#111' }), 'z', 0, 6, f + 2.5))
      );
      break;
    }
    case 'feedblocks':
      g = feedBlocks(q);
      break;
    case 'busbar':
      g = busbar(q);
      break;
    case 'penbar':
      g = penbar(q);
      break;
    case 'niloe':
      g = niloe(q, false);
      break;
    case 'niloe-x':
      g = niloe(q, true);
      break;
    case 'se-push':
      g = sePush(q);
      break;
    case 'socket':
      g = socket(q);
      break;
    case 'lamp':
      g = lamp(q);
      break;
    case 'motor':
      g = motor(q);
      break;
    case 'rod':
      g = rod(q);
      break;
    case 'pipe':
      g = pipe(q);
      break;
    default:
      g = genericModular(q, '#d6d8da', [q.part.label || q.part.id]);
  }
  g.position.set(q.x, q.y, q.z0);
  g.userData.partId = q.part.id;
  return g;
}

/** A készülék azonosító címkéje (pl. „F-1 · RX³ B16”): sínre szerelt
 *  készüléknél a fölötte futó csatorna alsó peremén, legfeljebb a készülék
 *  szélességében - így a szomszédos címkék nem lógnak egymásba, és nem takarják
 *  a kapcsokat. */
export function partTag(q: PlacedPart, label: string, short: string | null): Obj {
  const full = short ? `${label} · ${short}` : label;
  /* csak akkor kerül a típus is a címkére, ha olvashatóan elfér */
  const text = q.zone !== 'rail' || full.length * 2.7 <= q.w - 1 ? full : label;
  const wMm = q.zone === 'rail' ? Math.max(12, q.w - 1) : Math.max(30, text.length * 3.6);
  const t = canvasPlane(`tag|${text}|${wMm}`, wMm, 6, (c, W, H) => {
    c.fillStyle = '#fffef6';
    c.fillRect(0, 0, W, H);
    c.strokeStyle = '#999';
    c.lineWidth = 2;
    c.strokeRect(1, 1, W - 2, H - 2);
    c.fillStyle = '#111';
    c.font = `800 ${Math.round(H * 0.72)}px Inter, Arial, sans-serif`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(text, W / 2, H / 2 + H * 0.04, W - 6);
  });
  if (q.zone === 'rail') t.position.set(q.x, q.tagY ?? q.y + q.h / 2 + 8, 43);
  else if (q.zone === 'wall') t.position.set(q.x, q.y - q.h / 2 - 7, 2);
  else t.position.set(q.x, q.y + q.h / 2 + (q.kind === 'motor' ? 52 : 26), q.z0 + 60);
  return t;
}

/** Zöld-sárga csíkos textúra a PE-vezetékhez. */
export function stripeTexture(): Obj {
  const key = 'stripe';
  let tex = texCache.get(key);
  if (!tex) {
    const cv = document.createElement('canvas');
    cv.width = 64;
    cv.height = 16;
    const c = cv.getContext('2d')!;
    c.fillStyle = '#3aa63f';
    c.fillRect(0, 0, 64, 16);
    c.fillStyle = '#f2cf1f';
    for (let i = -1; i < 4; i++) {
      c.beginPath();
      c.moveTo(i * 22, 16);
      c.lineTo(i * 22 + 11, 16);
      c.lineTo(i * 22 + 21, 0);
      c.lineTo(i * 22 + 10, 0);
      c.fill();
    }
    tex = new THREE.CanvasTexture(cv);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    texCache.set(key, tex);
  }
  return tex;
}
