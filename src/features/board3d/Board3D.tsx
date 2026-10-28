/**
 * „3D bekötés”: a feladat referenciamegoldása a vizsgatábla valós
 * készülékein, valós méretben. Lustán töltődik (React.lazy), így a three.js
 * nem kerül a fő csomagba.
 *
 * Vezérlés: forgatás/nagyítás (OrbitControls), lépésenként a stepsHu szerint
 * kiemelt huzalok, „összes” nézet; a kapocs fölé állva vagy rákoppintva
 * megjelenik a készülék és a nyomtatott jelölés.
 */
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ChevronLeft, ChevronRight, Layers3, RotateCcw } from 'lucide-react';
import type { TaskDef, WireColor } from '../../domain/electrical-types';
import { termsOf } from '../../data/parts';
import { deviceOf, modelLabel } from '../../data/realDevices';
import { Button } from '../../components/ui';
import { buildLayout, type Layout3D, type Vec3 } from './layout';
import { buildPart, disposeCaches, mat, partTag, stripeTexture, textPlane } from './models';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Obj = any;

export const WIRE_HEX: Record<WireColor, string> = {
  br: '#7a4521',
  bl: '#1f5fd0',
  gy: '#3aa63f',
  bk: '#1c1c1c',
  gr: '#8c9196',
};

const ROLE_HU: Record<string, string> = { L: 'fázis', N: 'nulla', PE: 'védővezető' };

interface Props {
  task: TaskDef;
  /** -1: összes huzal; 0..n-1: a stepsHu lépése */
  step: number;
  onStep(step: number): void;
}

interface Hover {
  key: string;
  x: number;
  y: number;
  pinned: boolean;
}

/** Sarkoknál lekerekített útvonal a huzalcsőhöz. */
function smoothPath(pts: Vec3[], r = 5): Obj {
  const path = new THREE.CurvePath();
  const v = pts.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
  let start = v[0].clone();
  for (let i = 1; i < v.length - 1; i++) {
    const a = v[i - 1];
    const b = v[i];
    const c = v[i + 1];
    const ab = b.clone().sub(a);
    const bc = c.clone().sub(b);
    const rr = Math.min(r, ab.length() / 2, bc.length() / 2);
    const p1 = b.clone().sub(ab.normalize().multiplyScalar(rr));
    const p2 = b.clone().add(bc.normalize().multiplyScalar(rr));
    if (start.distanceTo(p1) > 0.01) path.add(new THREE.LineCurve3(start, p1));
    if (rr > 0.01) path.add(new THREE.QuadraticBezierCurve3(p1, b.clone(), p2));
    start = p2;
  }
  path.add(new THREE.LineCurve3(start, v[v.length - 1]));
  return path;
}

function themeBg(): string {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--surface').trim();
  const [r, g, b] = raw.split(/\s+/).map(Number);
  return Number.isFinite(r) ? `rgb(${r}, ${g}, ${b})` : '#0e1116';
}

export default function Board3D({ task, step, onStep }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<{ applyStep(s: number, pin: string | null): void; reset(): void; layout: Layout3D } | null>(null);
  const [hover, setHover] = useState<Hover | null>(null);
  const pinnedRef = useRef<string | null>(null);
  const stepRef = useRef(step);
  stepRef.current = step;

  /* --------------------------------------------------- jelenet felépítése */
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const L = buildLayout(task);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.touchAction = 'none';
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(themeBg());
    const camera = new THREE.PerspectiveCamera(32, 1, 5, 30000);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = false;
    controls.screenSpacePanning = true;
    controls.zoomToCursor = true;

    const { plate } = L;
    const cx = (plate.x0 + plate.x1) / 2;
    const cy = (plate.y0 + plate.y1) / 2;
    const pw = plate.x1 - plate.x0;
    const ph = plate.y1 - plate.y0;

    scene.add(new THREE.HemisphereLight(0xffffff, 0x7d8590, 1.25));
    const sun = new THREE.DirectionalLight(0xffffff, 1.5);
    sun.position.set(cx - pw * 0.4, cy + ph * 0.9, 900);
    sun.target.position.set(cx, cy, 0);
    scene.add(sun, sun.target);
    const fill = new THREE.DirectionalLight(0xffffff, 0.45);
    fill.position.set(cx + pw, cy - ph * 0.3, 500);
    scene.add(fill);

    /* szerelőlap */
    const plateMesh = new THREE.Mesh(new THREE.BoxGeometry(pw, ph, 3), mat('#c9cdd1', { metal: 0.35, rough: 0.6 }));
    plateMesh.position.set(cx, cy, -1.5);
    scene.add(plateMesh);
    const frame = mat('#9aa0a6', { metal: 0.5, rough: 0.5 });
    for (const [w, h, x, y] of [
      [pw + 12, 6, cx, plate.y1 + 3],
      [pw + 12, 6, cx, plate.y0 - 3],
      [6, ph, plate.x0 - 3, cy],
      [6, ph, plate.x1 + 3, cy],
    ] as Array<[number, number, number, number]>) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 10), frame);
      m.position.set(x, y, 2);
      scene.add(m);
    }

    /* szekrények (J) */
    for (const e of L.enclosures) {
      const wall = mat('#e9eaec', { opacity: 0.3, rough: 0.3 });
      const back = new THREE.Mesh(new THREE.BoxGeometry(e.x1 - e.x0, e.y1 - e.y0, 2), mat('#dfe2e5'));
      back.position.set((e.x0 + e.x1) / 2, (e.y0 + e.y1) / 2, 0.6);
      scene.add(back);
      const dz = 125;
      for (const [w, h, x, y] of [
        [e.x1 - e.x0, 3, (e.x0 + e.x1) / 2, e.y1],
        [e.x1 - e.x0, 3, (e.x0 + e.x1) / 2, e.y0],
        [3, e.y1 - e.y0, e.x0, (e.y0 + e.y1) / 2],
        [3, e.y1 - e.y0, e.x1, (e.y0 + e.y1) / 2],
      ] as Array<[number, number, number, number]>) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, dz), wall);
        m.position.set(x, y, dz / 2);
        scene.add(m);
      }
      const title = textPlane(e.titleHu, 9, '#111', { weight: 800, bg: '#fffef6' });
      title.position.set((e.x0 + e.x1) / 2, e.y1 - 10, 3);
      scene.add(title);
    }

    /* DIN-sínek (TH35-7,5) */
    const steel = mat('#cfd3d6', { metal: 0.8, rough: 0.35 });
    for (const r of L.rails) {
      const len = r.x1 - r.x0;
      const backM = new THREE.Mesh(new THREE.BoxGeometry(len, 35, 1), steel);
      backM.position.set((r.x0 + r.x1) / 2, r.y, 0.5);
      const hat = new THREE.Mesh(new THREE.BoxGeometry(len, 25, 1), steel);
      hat.position.set((r.x0 + r.x1) / 2, r.y, 7);
      scene.add(backM, hat);
    }

    /* kábelcsatornák: hátlap és két fésűs oldalfal, fedél nélkül */
    const ductMat = mat('#9aa1a8', { rough: 0.7 });
    const ductWall = mat('#aab0b6', { opacity: 0.55, rough: 0.6 });
    for (const d of L.ducts) {
      const len = d.x1 - d.x0;
      const b = new THREE.Mesh(new THREE.BoxGeometry(len, 44, 1.5), ductMat);
      b.position.set((d.x0 + d.x1) / 2, d.y, 0.75);
      scene.add(b);
      for (const s of [1, -1]) {
        const w = new THREE.Mesh(new THREE.BoxGeometry(len, 1.6, 42), ductWall);
        w.position.set((d.x0 + d.x1) / 2, d.y + s * 22, 21);
        scene.add(w);
      }
    }
    for (const r of L.risers) {
      const len = r.y1 - r.y0;
      const b = new THREE.Mesh(new THREE.BoxGeometry(40, len, 1.5), ductMat);
      b.position.set(r.x, (r.y0 + r.y1) / 2, 0.75);
      scene.add(b);
      for (const s of [1, -1]) {
        const w = new THREE.Mesh(new THREE.BoxGeometry(1.6, len, 42), ductWall);
        w.position.set(r.x + s * 20, (r.y0 + r.y1) / 2, 21);
        scene.add(w);
      }
    }
    /* védőcső a két szekrény között (mért fővezeték) */
    for (const c of L.conduits) {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(12, 12, c.x1 - c.x0, 24, 1, true), mat('#b9bec3', { opacity: 0.35, rough: 0.3 }));
      m.rotation.z = Math.PI / 2;
      m.position.set((c.x0 + c.x1) / 2, c.y, c.z);
      scene.add(m);
      const t = textPlane('mért fővezeték (L, N, PE)', 6, '#111', { weight: 700, bg: '#fffef6' });
      t.position.set((c.x0 + c.x1) / 2, c.y + 22, 50);
      scene.add(t);
    }

    /* készülékek */
    for (const q of L.parts) {
      scene.add(buildPart(q));
      const d = deviceOf(q.part);
      scene.add(partTag(q, q.part.label || q.part.id, d ? d.short : null));
    }

    /* betáplálás bejövő kábele */
    for (const f of L.feedIn) {
      const g = new THREE.TubeGeometry(smoothPath(f.pts, 6), 64, 1.5, 8, false);
      scene.add(new THREE.Mesh(g, f.color === 'gy' ? new THREE.MeshStandardMaterial({ map: stripeTexture(), roughness: 0.5 }) : mat(WIRE_HEX[f.color], { rough: 0.45 })));
    }

    /* huzalok */
    const wireMeshes: Obj[] = [];
    for (const w of L.wires) {
      const path = smoothPath(w.pts, 6);
      const len = path.getLength();
      const g = new THREE.TubeGeometry(path, Math.max(24, Math.round(len / 4)), 1.4, 8, false);
      let m: Obj;
      if (w.color === 'gy') {
        const tex = stripeTexture().clone();
        tex.needsUpdate = true;
        tex.repeat.set(len / 18, 1);
        m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, transparent: true });
      } else {
        m = new THREE.MeshStandardMaterial({ color: WIRE_HEX[w.color], roughness: 0.45, transparent: true });
      }
      const mesh = new THREE.Mesh(g, m);
      mesh.userData = { wire: w };
      wireMeshes.push(mesh);
      scene.add(mesh);
    }

    /* kapocs-célpontok a rámutatáshoz (láthatatlan gömbök) */
    const pickGroup = new THREE.Group();
    const pickMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false });
    const pickGeo = new THREE.SphereGeometry(4.2, 10, 8);
    for (const t of L.terms.values()) {
      const s = new THREE.Mesh(pickGeo, pickMat);
      s.position.set(t.hole[0] + t.dir[0] * 2, t.hole[1] + t.dir[1] * 2, t.hole[2] + t.dir[2] * 2);
      s.userData = { key: t.key };
      pickGroup.add(s);
    }
    scene.add(pickGroup);

    /* kiemelő gyűrűk az aktuális lépés kapcsain */
    const hlGroup = new THREE.Group();
    scene.add(hlGroup);
    const ringGeo = new THREE.TorusGeometry(4.6, 0.9, 8, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color: '#ffb020', toneMapped: false });
    const pinMat = new THREE.MeshBasicMaterial({ color: '#22d3ee', toneMapped: false });

    function render() {
      renderer.render(scene, camera);
    }

    function applyStep(s: number, pin: string | null) {
      hlGroup.clear();
      const hot = new Set<string>();
      for (const mesh of wireMeshes) {
        const w = mesh.userData.wire as Layout3D['wires'][number];
        const m = mesh.material;
        const touchesPin = !!pin && (w.a === pin || w.b === pin);
        if (s < 0) {
          mesh.visible = true;
          m.opacity = pin && !touchesPin ? 0.35 : 1;
          m.emissive.set(touchesPin ? '#0b5563' : '#000000');
        } else if (w.step < s) {
          mesh.visible = true;
          m.opacity = touchesPin ? 1 : 0.22;
          m.emissive.set(touchesPin ? '#0b5563' : '#000000');
        } else if (w.step === s) {
          mesh.visible = true;
          m.opacity = 1;
          m.emissive.set(touchesPin ? '#0b5563' : '#5a3a00');
          hot.add(w.a);
          hot.add(w.b);
        } else {
          mesh.visible = false;
        }
        m.depthWrite = m.opacity >= 1;
      }
      const ring = (key: string, material: Obj) => {
        const t = L.terms.get(key);
        if (!t) return;
        const r = new THREE.Mesh(ringGeo, material);
        r.position.set(t.hole[0] + t.dir[0] * 1.5, t.hole[1] + t.dir[1] * 1.5, t.hole[2] + t.dir[2] * 1.5);
        if (t.dir[1] !== 0) r.rotation.x = Math.PI / 2;
        hlGroup.add(r);
      };
      for (const k of hot) ring(k, ringMat);
      if (pin) ring(pin, pinMat);
      render();
    }

    function reset() {
      const aspect = Math.max(0.3, host!.clientWidth / Math.max(1, host!.clientHeight));
      const fov = (camera.fov * Math.PI) / 180;
      /* alul az irányító sáv takar ~80 px-t: a lapot kissé feljebb toljuk */
      const fit = Math.max(ph * 1.22, (pw * 1.08) / aspect);
      const dist = fit / 2 / Math.tan(fov / 2) + 160;
      controls.target.set(cx, cy - ph * 0.07, 40);
      camera.position.set(cx + pw * 0.1, cy + ph * 0.12, dist);
      camera.near = Math.max(1, dist / 200);
      camera.far = dist * 20;
      camera.updateProjectionMatrix();
      controls.update();
      render();
    }

    function resize() {
      const w = Math.max(1, host!.clientWidth);
      const h = Math.max(1, host!.clientHeight);
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = w + 'px';
      renderer.domElement.style.height = h + 'px';
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      render();
    }

    controls.addEventListener('change', render);
    const ro = new ResizeObserver(() => resize());
    ro.observe(host);
    resize();
    reset();
    applyStep(stepRef.current, pinnedRef.current);

    /* rámutatás és koppintás */
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    let downAt: { x: number; y: number } | null = null;
    const pick = (ev: PointerEvent): string | null => {
      const rect = renderer.domElement.getBoundingClientRect();
      ndc.set(((ev.clientX - rect.left) / rect.width) * 2 - 1, -((ev.clientY - rect.top) / rect.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const hit = ray.intersectObjects(pickGroup.children, false)[0];
      return hit ? (hit.object.userData.key as string) : null;
    };
    const onMove = (ev: PointerEvent) => {
      if (ev.buttons) return;
      const key = pick(ev);
      const rect = host.getBoundingClientRect();
      renderer.domElement.style.cursor = key ? 'pointer' : 'grab';
      if (pinnedRef.current) return;
      setHover(key ? { key, x: ev.clientX - rect.left, y: ev.clientY - rect.top, pinned: false } : null);
    };
    const onDown = (ev: PointerEvent) => {
      downAt = { x: ev.clientX, y: ev.clientY };
    };
    const onUp = (ev: PointerEvent) => {
      if (!downAt || Math.hypot(ev.clientX - downAt.x, ev.clientY - downAt.y) > 6) return;
      const key = pick(ev);
      const rect = host.getBoundingClientRect();
      pinnedRef.current = key && key !== pinnedRef.current ? key : null;
      setHover(pinnedRef.current ? { key: pinnedRef.current, x: ev.clientX - rect.left, y: ev.clientY - rect.top, pinned: true } : null);
      applyStep(stepRef.current, pinnedRef.current);
    };
    const onLeave = () => {
      if (!pinnedRef.current) setHover(null);
    };
    renderer.domElement.addEventListener('pointermove', onMove);
    renderer.domElement.addEventListener('pointerdown', onDown);
    renderer.domElement.addEventListener('pointerup', onUp);
    renderer.domElement.addEventListener('pointerleave', onLeave);

    /* világos/sötét téma */
    const mo = new MutationObserver(() => {
      scene.background = new THREE.Color(themeBg());
      render();
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    apiRef.current = { applyStep, reset, layout: L };
    if (import.meta.env.DEV) {
      /* fejlesztői kampó a képernyőképekhez: kamera beállítása kódból */
      (window as unknown as Record<string, unknown>).__vl3d = {
        view(px: number, py: number, pz: number, tx: number, ty: number, tz: number) {
          camera.position.set(px, py, pz);
          controls.target.set(tx, ty, tz);
          controls.update();
          render();
        },
        part(id: string) {
          const q = L.parts.find((p) => p.part.id === id);
          return q && { x: q.x, y: q.y, z0: q.z0, w: q.w, h: q.h, d: q.d };
        },
        plate: L.plate,
        /** egy kapocs képernyő-koordinátája (kliens px) */
        screenOf(key: string) {
          const t = L.terms.get(key);
          if (!t) return null;
          const v = new THREE.Vector3(t.hole[0] + t.dir[0] * 2, t.hole[1] + t.dir[1] * 2, t.hole[2] + t.dir[2] * 2).project(camera);
          const r = renderer.domElement.getBoundingClientRect();
          return { x: r.left + ((v.x + 1) / 2) * r.width, y: r.top + ((1 - v.y) / 2) * r.height };
        },
      };
    }
    return () => {
      apiRef.current = null;
      mo.disconnect();
      ro.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener('pointermove', onMove);
      renderer.domElement.removeEventListener('pointerdown', onDown);
      renderer.domElement.removeEventListener('pointerup', onUp);
      renderer.domElement.removeEventListener('pointerleave', onLeave);
      scene.traverse((o: Obj) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material && !Array.isArray(o.material) && o.material.map && o.material.map.isTexture && o.userData.wire) o.material.map.dispose();
        if (o.userData.wire) o.material.dispose();
      });
      disposeCaches();
      renderer.dispose();
      host.removeChild(renderer.domElement);
      pinnedRef.current = null;
      setHover(null);
    };
  }, [task]);

  useEffect(() => {
    apiRef.current?.applyStep(step, pinnedRef.current);
  }, [step]);

  /* ----------------------------------------------------------- felület */
  const n = task.stepsHu.length;
  const t = hover && apiRef.current?.layout.terms.get(hover.key);
  const part = t ? task.parts.find((p) => p.id === t.partId) : null;
  const appTerm = part ? termsOf({ ...part, st: {} }).find((x) => x.id === t!.termId) : null;
  const wiresAt = t ? task.solution.filter(([a, b]) => a === t.key || b === t.key).length : 0;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[14px] border border-line bg-surface">
      <div ref={hostRef} className="absolute inset-0" aria-label={`${task.id} feladat 3D bekötési nézete`} role="img" />

      {t && part && (
        <div
          className="pointer-events-none absolute z-20 max-w-[260px] rounded-[10px] border border-line bg-surface-2/95 px-3 py-2 text-[12px] leading-snug shadow-lg"
          style={{ left: Math.min(hover!.x + 14, (hostRef.current?.clientWidth || 300) - 270), top: Math.max(8, hover!.y - 70) }}
        >
          <div className="font-bold text-ink">{modelLabel(part)}</div>
          {deviceOf(part)?.orderCode && <div className="mono text-[10.5px] text-ink-faint">{deviceOf(part)!.orderCode}</div>}
          {!deviceOf(part) && <div className="text-[11px] text-ink-faint">nem a fotókon szereplő eszköz (általános modell)</div>}
          <div className="mt-1">
            <span className="text-ink-faint">kapocs: </span>
            <span className="mono font-bold text-arc">{t.label || t.termId}</span>
            {appTerm?.role && <span className="text-ink-dim"> · {ROLE_HU[appTerm.role]}</span>}
          </div>
          <div className="text-[11px] text-ink-dim">
            {t.free || !appTerm ? 'szabad kapocs - ebben a feladatban nincs bekötve' : wiresAt ? `${wiresAt} vezeték a megoldásban` : 'a megoldásban nincs rajta vezeték'}
          </div>
          {hover!.pinned && <div className="mt-1 text-[10.5px] text-ink-faint">koppints máshova a feloldáshoz</div>}
        </div>
      )}

      <div className="absolute right-2 top-2 z-10 flex gap-1.5 no-print">
        <Button size="sm" icon={RotateCcw} onClick={() => apiRef.current?.reset()} title="Nézet alaphelyzetbe">
          <span className="hidden sm:inline">Nézet</span>
        </Button>
      </div>

      <div className="absolute inset-x-2 bottom-2 z-10 rounded-[12px] border border-line bg-surface/90 p-2 shadow-lg backdrop-blur no-print">
        <div className="flex items-center gap-1.5">
          <Button size="sm" icon={Layers3} tone={step < 0 ? 'live' : 'default'} onClick={() => onStep(-1)} aria-pressed={step < 0}>
            összes
          </Button>
          <Button size="sm" icon={ChevronLeft} disabled={step <= 0} onClick={() => onStep(step < 0 ? 0 : step - 1)} aria-label="Előző lépés" />
          <div className="mono min-w-[64px] text-center text-[12px] font-bold text-ink">
            {step < 0 ? `${n} lépés` : `${step + 1} / ${n}`}
          </div>
          <Button size="sm" icon={ChevronRight} disabled={step >= n - 1} onClick={() => onStep(step < 0 ? 0 : step + 1)} aria-label="Következő lépés">
            <span className="hidden sm:inline">lépésenként</span>
          </Button>
        </div>
        <p className="mt-1.5 max-h-[4.6em] overflow-y-auto text-[12px] leading-snug text-ink-dim">
          {step < 0
            ? 'Minden vezeték a helyén. Forgasd (húzás), nagyíts (görgő / két ujj), koppints egy kapocsra a jelöléséért.'
            : task.stepsHu[step]}
        </p>
      </div>
    </div>
  );
}
