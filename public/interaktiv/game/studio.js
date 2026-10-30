// studio.js – procedural three.js "electrical workshop" quiz-show studio background.
// ES module, no assets: everything is built from primitives and canvas textures.
// API: Studio.init(el) / setLevel(level,total) / ask() / tension(on) / lockIn() / correct() / wrong() / win()
//      setHost(url) / host(action) / dispose()
// Imports bare 'three' (shared with GLTFLoader), so the page needs an import map BEFORE loading this module:
//   <script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js"}}</script>
import * as THREE from 'three';
const GLTF_LOADER_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';
let hostUrl = null;                      // remembered so setHost() before init() still works

const AMBER = new THREE.Color('#f39200'), CYAN = new THREE.Color('#19d3e6'), GREEN = new THREE.Color('#5dff7a');
const RED = new THREE.Color('#ff2a1f'), WARM = new THREE.Color('#ffd7a0');
const MAXN = 24;                         // module capacity (instanced meshes are allocated once)
const BOARD_Z = -7.5, BOARD_Y0 = 1.25, BOARD_SPAN = 6.45, MOD_X = 0.35, MOD_W = 2.3;

let S = null;                            // whole runtime state; null = not running

const clamp01 = v => Math.min(1, Math.max(0, v));
const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
const hash = n => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };

function webglOK() {
  try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); }
  catch (e) { return false; }
}

// ---------- canvas textures ----------
function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
const glowTex = () => canvasTex(64, 64, (g, w) => {
  const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.25, 'rgba(255,255,255,.55)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, w, w);
}, false);
const wallTex = () => canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#202226'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 9000; i++) { const v = 20 + Math.random() * 30 | 0; g.fillStyle = `rgba(${v},${v + 2},${v + 5},.5)`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
  g.strokeStyle = '#0c0d0f'; g.lineWidth = 4;
  for (let x = 0; x <= w; x += 128) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
  g.beginPath(); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke();
  g.fillStyle = '#3a3d42';
  for (let x = 12; x < w; x += 128) for (let y = 12; y < h; y += 256) { g.fillRect(x, y, 5, 5); g.fillRect(x + 100, y, 5, 5); g.fillRect(x, y + 228, 5, 5); g.fillRect(x + 100, y + 228, 5, 5); }
});
const hazardTex = () => canvasTex(256, 32, (g, w, h) => {
  g.fillStyle = '#f3b800'; g.fillRect(0, 0, w, h); g.fillStyle = '#111';
  for (let x = -h; x < w + h; x += 32) { g.beginPath(); g.moveTo(x, h); g.lineTo(x + 16, h); g.lineTo(x + 16 + h, 0); g.lineTo(x + h, 0); g.fill(); }
});
const moduleTex = () => canvasTex(512, 96, (g, w, h) => {
  g.fillStyle = '#d9dadc'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#c4c6c9'; g.fillRect(0, 0, w, 8); g.fillRect(0, h - 8, w, 8);
  g.fillStyle = '#2b2d31'; g.fillRect(40, 18, 110, 60);                     // lever window
  g.fillStyle = '#6b6f76'; g.font = 'bold 30px sans-serif'; g.fillText('C16', 190, 50);
  g.font = '18px sans-serif'; g.fillText('230/400V~  6000', 190, 76);
  g.fillStyle = '#1f6fb2'; g.fillRect(400, 26, 6, 44);
  g.fillStyle = '#111'; g.fillRect(430, 30, 46, 36);                         // LED bezel
});
function panelTex(n, layout) {
  const W = 512, H = 1150, top = 9.55, bottom = 0.7, hgt = top - bottom;
  return canvasTex(W, H, (g) => {
    const gr = g.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, '#24272b'); gr.addColorStop(0.5, '#2f3338'); gr.addColorStop(1, '#222528');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * 0.025})`; g.fillRect(0, Math.random() * H, W, 1); }
    const py = y => (top - y) / hgt * H, px = x => (x + 2.1) / 4.2 * W;
    // header plate
    g.fillStyle = '#15171a'; g.fillRect(24, 22, W - 48, 118);
    g.strokeStyle = '#f39200'; g.lineWidth = 3; g.strokeRect(24, 22, W - 48, 118);
    g.fillStyle = '#f3b800'; g.beginPath(); g.moveTo(70, 118); g.lineTo(106, 42); g.lineTo(142, 118); g.closePath(); g.fill();
    g.fillStyle = '#111'; g.beginPath(); g.moveTo(110, 60); g.lineTo(94, 92); g.lineTo(108, 92); g.lineTo(100, 112); g.lineTo(120, 80); g.lineTo(106, 80); g.closePath(); g.fill();
    g.fillStyle = '#f2f2f2'; g.font = 'bold 40px sans-serif'; g.fillText('FŐELOSZTÓ', 168, 78);
    g.fillStyle = '#9aa0a8'; g.font = '22px sans-serif'; g.fillText('3×400 V · 50 Hz · IP54', 170, 116);
    // DIN rails + labels
    for (let i = 0; i < n; i++) {
      const y = py(layout.y(i)), cp = layout.cp(i);
      g.fillStyle = '#4a4e55'; g.fillRect(px(-1.0), y - 6, px(MOD_X + MOD_W / 2 + 0.25) - px(-1.0), 12);
      g.fillStyle = cp ? '#f39200' : '#15171a'; g.fillRect(18, y - 26, 96, 52);
      g.fillStyle = cp ? '#111' : '#e8e8e8'; g.font = 'bold 34px sans-serif'; g.textAlign = 'center'; g.fillText(String(i + 1), 66, y + 12);
      g.textAlign = 'left';
    }
    // top-level name plate
    const ty = py(layout.y(n - 1)) - 50;
    g.fillStyle = '#f39200'; g.fillRect(px(MOD_X - MOD_W / 2), ty - 24, px(MOD_X + MOD_W / 2) - px(MOD_X - MOD_W / 2), 32);
    g.fillStyle = '#111'; g.font = 'bold 22px sans-serif'; g.textAlign = 'center'; g.fillText('★ ALBERT EINSTEIN ★', px(MOD_X), ty); g.textAlign = 'left';
    g.fillStyle = '#9aa0a8'; g.font = '16px sans-serif'; g.fillText('VOLTLAB 1008 · RANGLÉTRA', 30, H - 24);
    g.fillStyle = '#5c6068'; for (const [x, y] of [[12, 12], [W - 20, 12], [12, H - 20], [W - 20, H - 20]]) g.fillRect(x, y, 8, 8);
  });
}

// ---------- shaders ----------
const floorVS = `uniform mat4 textureMatrix; varying vec4 vRefl; varying vec3 vWorld;
void main(){ vec4 wp = modelMatrix*vec4(position,1.); vWorld = wp.xyz; vRefl = textureMatrix*wp; gl_Position = projectionMatrix*viewMatrix*wp; }`;
const floorFS = `uniform sampler2D tRefl; uniform vec2 texel; uniform vec3 camPos; uniform vec4 pools[4]; uniform vec3 poolCol[4]; uniform float master; uniform vec3 tint;
varying vec4 vRefl; varying vec3 vWorld;
void main(){
  vec2 cell = vWorld.xz/1.2; vec2 f = abs(fract(cell)-.5);
  float seam = smoothstep(.485,.5,max(f.x,f.y));
  float n = fract(sin(dot(floor(cell),vec2(12.9898,78.233)))*43758.5453);
  vec2 uv = vRefl.xy/vRefl.w + (n-.5)*.004;
  vec3 r = vec3(0.); float k = 2.5;
  r += texture2D(tRefl, uv).rgb*.36;
  r += texture2D(tRefl, uv+vec2(texel.x,0.)*k).rgb*.16; r += texture2D(tRefl, uv-vec2(texel.x,0.)*k).rgb*.16;
  r += texture2D(tRefl, uv+vec2(0.,texel.y)*k*2.).rgb*.16; r += texture2D(tRefl, uv-vec2(0.,texel.y)*k*2.).rgb*.16;
  vec3 V = normalize(camPos - vWorld); float fres = .35 + .6*pow(1.-V.y, 3.);
  vec3 col = vec3(.008,.009,.011) + r*fres*(1.-seam*.8);
  for(int i=0;i<4;i++){ vec2 d = vWorld.xz - pools[i].xy; float g = exp(-dot(d,d)/(pools[i].z*pools[i].z)); col += poolCol[i]*g*pools[i].w*.10; }
  col += tint*.02;
  float dist = length(camPos - vWorld); col *= 1. - smoothstep(14.,34.,dist);
  gl_FragColor = vec4(col,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
const beamVS = `varying float vT; varying vec3 vN; varying vec3 vV;
void main(){ vT = uv.y; vec4 mv = modelViewMatrix*vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`;
const beamFS = `uniform vec3 color; uniform float intensity; uniform float time; varying float vT; varying vec3 vN; varying vec3 vV;
void main(){ float e = pow(abs(dot(normalize(vN), normalize(vV))), 2.2);
  float a = e * mix(.28, 1., pow(vT, 1.4)) * smoothstep(0.,.08,vT) * intensity * (0.85 + 0.15*sin(vT*40. - time*2.));
  gl_FragColor = vec4(color*a, 1.); }`;
const cableVS = `varying vec2 vUv; varying vec3 vN; void main(){ vUv = uv; vN = normalize(normalMatrix*normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`;
const cableFS = `uniform vec3 base; uniform vec3 pulse; uniform float time; uniform float speed; uniform float amp; uniform float len; varying vec2 vUv; varying vec3 vN;
void main(){ float l = .35 + .65*max(0., dot(vN, normalize(vec3(.2,.8,.6))));
  float p = fract(vUv.x*len*.12 - time*speed); float band = smoothstep(.0,.04,p)*smoothstep(.14,.04,p);
  vec3 col = base*l + pulse*band*amp;
  gl_FragColor = vec4(col,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

// ---------- build ----------
function build(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const cv = renderer.domElement;
  Object.assign(cv.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', zIndex: '0', pointerEvents: 'none', display: 'block' });
  cv.setAttribute('aria-hidden', 'true');
  container.appendChild(cv);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#050608');
  scene.fog = new THREE.Fog('#050608', 16, 38);
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 80);
  camera.layers.enable(1);
  const disposables = [];
  const keep = o => (disposables.push(o), o);

  // environment for PBR highlights (tiny PMREM of a softbox room)
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = new THREE.Scene(); env.background = new THREE.Color('#050505');
  const sb = (c, w, h, p, r) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide })); m.position.set(...p); m.lookAt(0, 0, 0); env.add(m); return m; };
  sb(new THREE.Color(3, 2.4, 1.6), 8, 2, [0, 6, 2]); sb(new THREE.Color(0.2, 1.4, 1.6), 2, 6, [-7, 2, 0]); sb(new THREE.Color(2, 1, 0.1), 2, 6, [7, 2, -1]); sb(new THREE.Color(.6, .6, .7), 10, 4, [0, 2, 8]);
  const envTex = pmrem.fromScene(env, 0.03).texture; scene.environment = envTex; keep(envTex);
  env.traverse(o => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } }); pmrem.dispose();

  const tGlow = keep(glowTex()), tHaz = keep(hazardTex()), tMod = keep(moduleTex()), tWall = keep(wallTex());
  tWall.wrapS = tWall.wrapT = THREE.RepeatWrapping; tWall.repeat.set(9, 3);
  tHaz.wrapS = THREE.RepeatWrapping;

  const std = (o) => keep(new THREE.MeshStandardMaterial(o));
  const metal = std({ color: '#7d828a', metalness: 0.85, roughness: 0.35 });
  const darkMetal = std({ color: '#2a2d32', metalness: 0.7, roughness: 0.45 });

  // lights
  const hemi = new THREE.HemisphereLight('#8aa0b8', '#100c08', 0.35); scene.add(hemi);
  const boardLight = new THREE.PointLight(AMBER, 6, 9, 2); boardLight.position.set(0, 4, BOARD_Z + 2); scene.add(boardLight);
  const cyanL = new THREE.PointLight(CYAN, 5, 10, 2); cyanL.position.set(-5, 1.2, -1.5); scene.add(cyanL);
  const cyanR = new THREE.PointLight(CYAN, 5, 10, 2); cyanR.position.set(5, 1.2, -1.5); scene.add(cyanR);
  const keyLight = new THREE.DirectionalLight('#ffe9cf', 0.35); keyLight.position.set(2, 8, 10); scene.add(keyLight);
  const bulb = new THREE.PointLight(AMBER, 0, 2.5, 2); scene.add(bulb);   // mascot head light; pre-created so loading the host never recompiles shaders

  // back wall
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(40, 13), std({ map: tWall, color: '#8a8f99', roughness: 0.9, metalness: 0.1 }));
  wall.position.set(0, 6.5, -8.5); scene.add(wall);

  // board enclosure + panel
  const encl = new THREE.Mesh(new THREE.BoxGeometry(4.6, 9.3, 0.6), std({ color: '#3b3f45', metalness: 0.6, roughness: 0.4 }));
  encl.position.set(0, 5.1, BOARD_Z - 0.32); scene.add(encl);
  const panelMat = std({ color: '#ffffff', roughness: 0.55, metalness: 0.3 });
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 8.85), panelMat);
  panel.position.set(0, (9.55 + 0.7) / 2, BOARD_Z + 0.0); scene.add(panel);
  const trim = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), metal, 4); // enclosure lip
  [[0, 9.72, 4.6, 0.12], [0, 0.48, 4.6, 0.12], [-2.27, 5.1, 0.12, 9.3], [2.27, 5.1, 0.12, 9.3]].forEach(([x, y, w, h], i) => {
    trim.setMatrixAt(i, new THREE.Matrix4().compose(new THREE.Vector3(x, y, BOARD_Z + 0.02), new THREE.Quaternion(), new THREE.Vector3(w, h, 0.12)));
  });
  scene.add(trim);

  // modules (instanced)
  const modBody = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), std({ color: '#c9cbce', roughness: 0.5, metalness: 0.05 }), MAXN);
  const modFace = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), std({ map: tMod, roughness: 0.6, metalness: 0 }), MAXN);
  const leverGeo = new THREE.BoxGeometry(0.16, 0.26, 0.12); leverGeo.translate(0, 0.1, 0.06);
  const lever = new THREE.InstancedMesh(leverGeo, std({ color: '#1d1f22', roughness: 0.4 }), MAXN);
  const ledCore = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, 0.12, 0.05), keep(new THREE.MeshBasicMaterial({ color: '#fff', toneMapped: false })), MAXN);
  const ledGlow = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), keep(new THREE.MeshBasicMaterial({ map: tGlow, color: '#fff', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })), MAXN);
  const frame = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), keep(new THREE.MeshBasicMaterial({ color: '#fff', toneMapped: false })), MAXN * 4);
  for (const m of [modBody, modFace, lever, ledCore, ledGlow, frame]) { m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.frustumCulled = false; scene.add(m); }
  ledCore.setColorAt(0, new THREE.Color()); ledGlow.setColorAt(0, new THREE.Color()); frame.setColorAt(0, new THREE.Color());

  // side cabinets with idle status LEDs
  const cab = new THREE.InstancedMesh(new THREE.BoxGeometry(2.6, 5.6, 0.7), std({ color: '#33363b', metalness: 0.6, roughness: 0.45 }), 2);
  const cabX = [-7.2, 7.2];
  cabX.forEach((x, i) => cab.setMatrixAt(i, new THREE.Matrix4().makeTranslation(x, 2.8, -8.0)));
  scene.add(cab);
  const NSL = 48;
  const sideLed = new THREE.InstancedMesh(new THREE.BoxGeometry(0.09, 0.09, 0.04), keep(new THREE.MeshBasicMaterial({ color: '#fff', toneMapped: false })), NSL);
  for (let i = 0; i < NSL; i++) {
    const c = i % 24, side = i < 24 ? 0 : 1;
    sideLed.setMatrixAt(i, new THREE.Matrix4().makeTranslation(cabX[side] - 0.9 + (c % 6) * 0.36, 4.6 - Math.floor(c / 6) * 0.5, -7.63));
    sideLed.setColorAt(i, new THREE.Color());
  }
  scene.add(sideLed);
  const meter = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.32, 0.32, 0.06, 28), std({ color: '#d8d8d0', roughness: 0.3, metalness: 0.2, emissive: '#2a2010' }), 4);
  [[-7.6, 2.6], [-6.8, 2.6], [6.8, 2.6], [7.6, 2.6]].forEach(([x, y], i) => meter.setMatrixAt(i, new THREE.Matrix4().compose(new THREE.Vector3(x, y, -7.63), new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)), new THREE.Vector3(1, 1, 1))));
  scene.add(meter);

  // vertical accent light bars on the wall
  const NB = 8;
  const bars = new THREE.InstancedMesh(new THREE.BoxGeometry(0.12, 6.5, 0.06), keep(new THREE.MeshBasicMaterial({ color: '#fff', toneMapped: false })), NB);
  const barX = [-4.2, -3.5, 3.5, 4.2, -10.5, -9.6, 9.6, 10.5];
  barX.forEach((x, i) => { bars.setMatrixAt(i, new THREE.Matrix4().makeTranslation(x, 4.6, -8.4)); bars.setColorAt(i, new THREE.Color()); });
  scene.add(bars);

  // cable trays (ladder) + cables with flowing pulses
  const trayParts = [];
  const tray = (x0, x1, y, z) => { trayParts.push([(x0 + x1) / 2, y, z, x1 - x0, 0.08, 0.06], [(x0 + x1) / 2, y, z + 0.5, x1 - x0, 0.08, 0.06]); for (let x = x0; x <= x1; x += 0.6) trayParts.push([x, y - 0.02, z + 0.25, 0.05, 0.04, 0.5]); };
  tray(-12, 12, 10.2, -8.3); tray(-9, -5.5, 5.9, -8.2); tray(5.5, 9, 5.9, -8.2);
  for (const x of [-11.5, -5.8, 5.8, 11.5]) trayParts.push([x, 8.1, -8.2, 0.06, 4.2, 0.06]);
  const trays = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), metal, trayParts.length);
  trayParts.forEach(([x, y, z, w, h, d], i) => trays.setMatrixAt(i, new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion(), new THREE.Vector3(w, h, d))));
  scene.add(trays);
  const cables = [];
  const cableDef = [
    [[-7.2, 5.6, -7.9], [-6.5, 8.6, -7.8], [-3.5, 10.0, -8.0], [-1.2, 9.85, -7.9]], ['#141414', AMBER, 0.55],
    [[-7.6, 5.6, -7.9], [-8.5, 8.5, -7.9], [-5, 10.1, -8.1], [-0.6, 9.85, -7.9]], ['#3a3d44', CYAN, 0.4],
    [[7.2, 5.6, -7.9], [6.5, 8.6, -7.8], [3.5, 10.0, -8.0], [1.2, 9.85, -7.9]], ['#141414', AMBER, 0.5],
    [[7.6, 5.6, -7.9], [8.5, 8.5, -7.9], [5, 10.1, -8.1], [0.6, 9.85, -7.9]], ['#1d3a6b', CYAN, 0.45],
    [[-12, 4.2, -8.3], [-10, 0.4, -8.0], [-8.6, 0.3, -7.9], [-7.6, 0.6, -7.9]], ['#141414', CYAN, 0.3],
    [[12, 4.2, -8.3], [10, 0.4, -8.0], [8.6, 0.3, -7.9], [7.6, 0.6, -7.9]], ['#141414', AMBER, 0.35],
  ];
  for (let i = 0; i < cableDef.length; i += 2) {
    const curve = new THREE.CatmullRomCurve3(cableDef[i].map(p => new THREE.Vector3(...p)));
    const [base, pulse, speed] = cableDef[i + 1];
    const mat = keep(new THREE.ShaderMaterial({ vertexShader: cableVS, fragmentShader: cableFS, uniforms: {
      base: { value: new THREE.Color(base).multiplyScalar(2.2) }, pulse: { value: pulse.clone() }, time: { value: 0 }, speed: { value: speed }, amp: { value: 1 }, len: { value: curve.getLength() } } }));
    const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.07, 6, false), mat); scene.add(m); cables.push(m);
  }

  // insulator stacks on pedestals (porcelain discs, lathe)
  const prof = [[0.05, 0], [0.42, 0.04], [0.44, 0.07], [0.2, 0.12], [0.16, 0.2], [0.05, 0.22]].map(([x, y]) => new THREE.Vector2(x, y));
  const discGeo = new THREE.LatheGeometry(prof, 28);
  const NI = 14;
  const ins = new THREE.InstancedMesh(discGeo, std({ color: '#7a3b1c', roughness: 0.15, metalness: 0.0 }), NI);
  const insX = [-4.6, 4.6];
  for (let i = 0; i < NI; i++) { const s = i < 7 ? 0 : 1, k = i % 7; ins.setMatrixAt(i, new THREE.Matrix4().makeTranslation(insX[s], 1.05 + k * 0.22, -1.6)); }
  scene.add(ins);
  const ped = new THREE.InstancedMesh(new THREE.BoxGeometry(0.9, 1, 0.9), darkMetal, 2);
  insX.forEach((x, i) => ped.setMatrixAt(i, new THREE.Matrix4().makeTranslation(x, 0.5, -1.6))); scene.add(ped);
  const rod = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.06, 0.06, 2.3, 10), metal, 2);
  insX.forEach((x, i) => rod.setMatrixAt(i, new THREE.Matrix4().makeTranslation(x, 2.0, -1.6))); scene.add(rod);
  const tipGlow = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), ledGlow.material, 2);
  insX.forEach((x, i) => { tipGlow.setMatrixAt(i, new THREE.Matrix4().compose(new THREE.Vector3(x, 3.18, -1.6), new THREE.Quaternion(), new THREE.Vector3(0.9, 0.9, 1))); tipGlow.setColorAt(i, CYAN.clone()); });
  scene.add(tipGlow);
  const pedStrip = new THREE.InstancedMesh(new THREE.BoxGeometry(0.92, 0.05, 0.92), bars.material, 2);
  insX.forEach((x, i) => { pedStrip.setMatrixAt(i, new THREE.Matrix4().makeTranslation(x, 0.95, -1.6)); pedStrip.setColorAt(i, CYAN.clone().multiplyScalar(1.4)); });
  scene.add(pedStrip);

  // stage + podium
  const stage = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.22, 3.4), std({ color: '#16181b', metalness: 0.75, roughness: 0.3 }));
  stage.position.set(0, 0.11, 0.9); scene.add(stage);
  const hazMat = std({ map: tHaz, roughness: 0.6 });
  const haz = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), hazMat, 2);
  haz.setMatrixAt(0, new THREE.Matrix4().compose(new THREE.Vector3(0, 0.11, 2.61), new THREE.Quaternion(), new THREE.Vector3(5.2, 0.2, 0.02)));
  haz.setMatrixAt(1, new THREE.Matrix4().compose(new THREE.Vector3(0, 0.222, 2.4), new THREE.Quaternion(), new THREE.Vector3(5.2, 0.005, 0.18)));
  tHaz.repeat.set(8, 1); scene.add(haz);
  const podGeo = new THREE.CylinderGeometry(0.62, 0.8, 1.1, 4, 1); podGeo.rotateY(Math.PI / 4);
  const podium = new THREE.Mesh(podGeo, std({ color: '#2c3036', metalness: 0.5, roughness: 0.32 }));
  podium.scale.set(1.25, 1, 0.75); podium.position.set(0, 0.22 + 0.55, 0.9); scene.add(podium);
  const podTop = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.08, 1.05), std({ color: '#0a0b0d', metalness: 0.3, roughness: 0.08 }));
  podTop.position.set(0, 1.36, 0.9); scene.add(podTop);
  const podStrip = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.06, 0.02), keep(new THREE.MeshBasicMaterial({ color: '#fff', toneMapped: false })));
  podStrip.position.set(0, 1.16, 1.49); podStrip.rotation.x = -0.14; scene.add(podStrip);
  const podBolt = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42), keep(new THREE.MeshBasicMaterial({ map: keep(canvasTex(128, 128, (g) => {
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(74, 8); g.lineTo(30, 72); g.lineTo(60, 72); g.lineTo(46, 120); g.lineTo(98, 50); g.lineTo(68, 50); g.closePath(); g.fill();
  }, false)), transparent: true, depthWrite: false, color: '#fff', toneMapped: false, blending: THREE.AdditiveBlending })));
  podBolt.position.set(0, 0.72, 1.565); podBolt.rotation.x = -0.14; scene.add(podBolt);

  // truss + moving heads
  const trussParts = [];
  for (const [y, z] of [[8.4, 1.2], [8.4, 1.8], [8.85, 1.5]]) trussParts.push([0, y, z, 22, 0.07, 0.07, 0]);
  for (let x = -11; x <= 11; x += 0.8) trussParts.push([x, 8.62, 1.35, 0.04, 0.55, 0.04, 0.5], [x + 0.4, 8.62, 1.65, 0.04, 0.55, 0.04, -0.5]);
  const truss = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), metal, trussParts.length);
  trussParts.forEach(([x, y, z, w, h, d, r], i) => truss.setMatrixAt(i, new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, r)), new THREE.Vector3(w, h, d))));
  scene.add(truss);
  const headGeo = new THREE.CylinderGeometry(0.2, 0.24, 0.5, 14);
  const heads = new THREE.InstancedMesh(headGeo, darkMetal, 4);
  const lensGeo = new THREE.CircleGeometry(0.18, 18); lensGeo.rotateX(Math.PI / 2); lensGeo.translate(0, -0.26, 0);
  const lens = new THREE.InstancedMesh(lensGeo, keep(new THREE.MeshBasicMaterial({ color: '#fff', toneMapped: false })), 4);
  for (const m of [heads, lens]) { m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.frustumCulled = false; scene.add(m); }
  lens.setColorAt(0, new THREE.Color());

  const coneGeo = new THREE.ConeGeometry(1, 1, 28, 1, true); coneGeo.translate(0, -0.5, 0);
  const spots = [-6, -2.2, 2.2, 6].map((x, i) => {
    const col = (i % 3 === 0 ? CYAN : AMBER).clone();
    const light = new THREE.SpotLight(col, 260, 0, 0.26, 0.6, 2);
    light.position.set(x, 8.1, 1.5); scene.add(light); scene.add(light.target);
    const mat = keep(new THREE.ShaderMaterial({ vertexShader: beamVS, fragmentShader: beamFS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      uniforms: { color: { value: col.clone() }, intensity: { value: 0.3 }, time: { value: 0 } } }));
    const beam = new THREE.Mesh(coneGeo, mat); beam.frustumCulled = false; scene.add(beam);
    return { light, beam, base: col, phase: i * 1.7, x, target: new THREE.Vector3(x * 0.6, 0, 0) };
  });

  // reflective floor (custom planar reflection, half-res)
  const rt = new THREE.WebGLRenderTarget(2, 2, { type: THREE.HalfFloatType }); keep(rt);
  const floorMat = keep(new THREE.ShaderMaterial({ vertexShader: floorVS, fragmentShader: floorFS, uniforms: {
    tRefl: { value: rt.texture }, textureMatrix: { value: new THREE.Matrix4() }, texel: { value: new THREE.Vector2() }, camPos: { value: new THREE.Vector3() },
    pools: { value: [0, 1, 2, 3].map(() => new THREE.Vector4()) }, poolCol: { value: [0, 1, 2, 3].map(() => new THREE.Color()) }, master: { value: 1 }, tint: { value: new THREE.Color() } } }));
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), floorMat); floor.rotation.x = -Math.PI / 2; floor.position.z = -2; scene.add(floor);
  const vcam = new THREE.PerspectiveCamera();

  // dust
  const ND = 600, dPos = new Float32Array(ND * 3), dSeed = new Float32Array(ND);
  for (let i = 0; i < ND; i++) { dPos[i * 3] = (Math.random() - 0.5) * 22; dPos[i * 3 + 1] = Math.random() * 8; dPos[i * 3 + 2] = -7 + Math.random() * 12; dSeed[i] = Math.random() * 100; }
  const dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3).setUsage(THREE.DynamicDrawUsage));
  const dust = new THREE.Points(dustGeo, keep(new THREE.PointsMaterial({ map: tGlow, size: 0.05, color: '#b8aa90', transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending })));
  dust.frustumCulled = false; dust.layers.set(1); scene.add(dust);

  // sparks: glowing heads (points) + streak trails (line segments), shared pool
  const NS = 700;
  const sp = { pos: new Float32Array(NS * 3), vel: new Float32Array(NS * 3), life: new Float32Array(NS), max: new Float32Array(NS), col: new Float32Array(NS * 3), grav: new Float32Array(NS), next: 0 };
  const sPosAttr = new THREE.BufferAttribute(new Float32Array(NS * 3), 3).setUsage(THREE.DynamicDrawUsage);
  const sColAttr = new THREE.BufferAttribute(new Float32Array(NS * 3), 3).setUsage(THREE.DynamicDrawUsage);
  const sparkGeo = new THREE.BufferGeometry(); sparkGeo.setAttribute('position', sPosAttr); sparkGeo.setAttribute('color', sColAttr);
  const sparkPts = new THREE.Points(sparkGeo, keep(new THREE.PointsMaterial({ map: tGlow, size: 0.16, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })));
  const tPosAttr = new THREE.BufferAttribute(new Float32Array(NS * 6), 3).setUsage(THREE.DynamicDrawUsage);
  const tColAttr = new THREE.BufferAttribute(new Float32Array(NS * 6), 3).setUsage(THREE.DynamicDrawUsage);
  const trailGeo = new THREE.BufferGeometry(); trailGeo.setAttribute('position', tPosAttr); trailGeo.setAttribute('color', tColAttr);
  const trails = new THREE.LineSegments(trailGeo, keep(new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })));
  for (const m of [sparkPts, trails]) { m.frustumCulled = false; scene.add(m); }

  // full-screen flash quad (camera child, not reflected)
  const flash = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), keep(new THREE.MeshBasicMaterial({ color: '#000', transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })));
  flash.position.z = -0.5; flash.renderOrder = 999; flash.layers.set(1); camera.add(flash); scene.add(camera);

  return { bulb, renderer, scene, camera, vcam, rt, floor, floorMat, disposables, panelMat, boardLight, hemi, cyanL, cyanR, keyLight,
    modBody, modFace, lever, ledCore, ledGlow, frame, sideLed, bars, cables, spots, heads, lens, podStrip, podBolt, tipGlow, pedStrip,
    dust, dPos, dSeed, sp, sPosAttr, sColAttr, tPosAttr, tColAttr, sparkPts, trails, flash };
}

// ---------- layout of the ladder ----------
function layoutBoard() {
  const n = S.total, step = BOARD_SPAN / Math.max(1, n - 1), h = Math.min(0.42, step * 0.82);
  const cpEvery = 4;
  S.layout = { n, step, h, y: i => BOARD_Y0 + i * step, cp: i => (i + 1) % cpEvery === 0 || i === n - 1 };
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), sc = new THREE.Vector3();
  const zf = BOARD_Z + 0.2;
  let f = 0;
  for (let i = 0; i < n; i++) {
    const y = S.layout.y(i);
    S.o.modBody.setMatrixAt(i, m.compose(v.set(MOD_X, y, BOARD_Z + 0.1), q.identity(), sc.set(MOD_W, h, 0.2)));
    S.o.modFace.setMatrixAt(i, m.compose(v.set(MOD_X, y, zf + 0.001), q, sc.set(MOD_W, h, 1)));
    S.o.ledCore.setMatrixAt(i, m.compose(v.set(MOD_X + MOD_W * 0.4, y, zf + 0.02), q, sc.set(h / 0.42, h / 0.42, 1)));
    S.o.ledGlow.setMatrixAt(i, m.compose(v.set(MOD_X + MOD_W * 0.4, y, zf + 0.06), q, sc.set(h * 2.6, h * 2.6, 1)));
    if (S.layout.cp(i)) {
      const w = MOD_W + 0.2, hh = h + 0.16, t = 0.045;
      for (const [x, yy, sx, sy] of [[MOD_X, y + hh / 2, w, t], [MOD_X, y - hh / 2, w, t], [MOD_X - w / 2, y, t, hh], [MOD_X + w / 2, y, t, hh]]) {
        S.o.frame.setMatrixAt(f, m.compose(v.set(x, yy, zf + 0.01), q, sc.set(sx, sy, 0.04))); S.frameOf[f++] = i;
      }
    }
  }
  for (const k of ['modBody', 'modFace', 'lever', 'ledCore', 'ledGlow']) { S.o[k].count = n; S.o[k].instanceMatrix.needsUpdate = true; }
  S.o.frame.count = f; S.o.frame.instanceMatrix.needsUpdate = true;
  if (S.panelTex) S.panelTex.dispose();
  S.panelTex = panelTex(n, S.layout); S.o.panelMat.map = S.panelTex; S.o.panelMat.needsUpdate = true;
  S.lever = new Float32Array(MAXN).map((_, i) => (i < S.level ? 1 : 0));
}
const ledPos = i => new THREE.Vector3(MOD_X + MOD_W * 0.4, S.layout.y(Math.min(i, S.layout.n - 1)), BOARD_Z + 0.3);

// ---------- sparks ----------
function emit(origin, count, o = {}) {
  const sp = S.o.sp, cols = o.colors || [new THREE.Color(1.6, 1.3, 0.8), AMBER];
  for (let k = 0; k < count; k++) {
    const i = sp.next; sp.next = (sp.next + 1) % sp.life.length;
    const a = Math.random() * Math.PI * 2, u = (o.up ?? 0.4) + Math.random() * (o.spread ?? 1), spd = (o.speed ?? 5) * (0.35 + Math.random() * 0.8);
    sp.pos[i * 3] = origin.x + (Math.random() - 0.5) * (o.jitter ?? 0.1); sp.pos[i * 3 + 1] = origin.y + (Math.random() - 0.5) * (o.jitter ?? 0.1); sp.pos[i * 3 + 2] = origin.z;
    sp.vel[i * 3] = Math.cos(a) * spd; sp.vel[i * 3 + 1] = u * spd * 0.8 + Math.sin(a) * spd * 0.5; sp.vel[i * 3 + 2] = (0.3 + Math.random()) * spd * (o.forward ?? 0.6);
    sp.max[i] = sp.life[i] = (o.life ?? 1.1) * (0.5 + Math.random() * 0.7);
    const c = cols[(Math.random() * cols.length) | 0]; sp.col[i * 3] = c.r; sp.col[i * 3 + 1] = c.g; sp.col[i * 3 + 2] = c.b;
    sp.grav[i] = o.grav ?? 1;
  }
}
function updateSparks(dt) {
  const sp = S.o.sp, P = S.o.sPosAttr.array, C = S.o.sColAttr.array, TP = S.o.tPosAttr.array, TC = S.o.tColAttr.array;
  for (let i = 0; i < sp.life.length; i++) {
    let L = sp.life[i];
    if (L <= 0) { C[i * 3] = C[i * 3 + 1] = C[i * 3 + 2] = 0; for (let j = 0; j < 6; j++) TC[i * 6 + j] = 0; continue; }
    L -= dt; sp.life[i] = L;
    const b = i * 3;
    sp.vel[b + 1] -= 9.8 * sp.grav[i] * dt;
    sp.vel[b] *= 1 - 0.6 * dt; sp.vel[b + 2] *= 1 - 0.6 * dt;
    sp.pos[b] += sp.vel[b] * dt; sp.pos[b + 1] += sp.vel[b + 1] * dt; sp.pos[b + 2] += sp.vel[b + 2] * dt;
    if (sp.pos[b + 1] < 0.02) { sp.pos[b + 1] = 0.02; sp.vel[b + 1] *= -0.35; sp.vel[b] *= 0.6; sp.vel[b + 2] *= 0.6; }
    const k = Math.max(0, L / sp.max[i]), f = k * k * (0.7 + 0.3 * Math.random());
    P[b] = sp.pos[b]; P[b + 1] = sp.pos[b + 1]; P[b + 2] = sp.pos[b + 2];
    C[b] = sp.col[b] * f; C[b + 1] = sp.col[b + 1] * f; C[b + 2] = sp.col[b + 2] * f;
    const t = i * 6, s = 0.035;
    TP[t] = P[b]; TP[t + 1] = P[b + 1]; TP[t + 2] = P[b + 2];
    TP[t + 3] = P[b] - sp.vel[b] * s; TP[t + 4] = P[b + 1] - sp.vel[b + 1] * s; TP[t + 5] = P[b + 2] - sp.vel[b + 2] * s;
    TC[t] = C[b]; TC[t + 1] = C[b + 1]; TC[t + 2] = C[b + 2]; TC[t + 3] = TC[t + 4] = TC[t + 5] = 0;
  }
  S.o.sPosAttr.needsUpdate = S.o.sColAttr.needsUpdate = S.o.tPosAttr.needsUpdate = S.o.tColAttr.needsUpdate = true;
}

// ---------- per-frame ----------
const tmpC = new THREE.Color(), tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpV = new THREE.Vector3(), tmpS = new THREE.Vector3(), DOWN = new THREE.Vector3(0, -1, 0);
const since = name => S.t - (S.ev[name] ?? -99);

function frame(now) {
  S.raf = requestAnimationFrame(frame);
  if (document.hidden) return;
  const t0 = performance.now();
  const realDt = Math.min(0.05, (now - (S.last || now)) / 1000); S.last = now;
  const rm = S.reduced, dt = realDt * (rm ? 0.35 : 1);
  S.t += dt; const t = S.t, o = S.o;
  S.fps = S.fps ? S.fps * 0.95 + (realDt > 0 ? 1 / realDt : 60) * 0.05 : 60;

  // mood interpolation
  const M = S.mood, G = S.goal;
  for (const k in G) M[k] = damp(M[k], G[k], k === 'push' ? 0.45 : 2.2, realDt);

  // event envelopes
  const lk = since('lock'), ramp = lk < 1.1 ? (lk < 0.25 ? 1 - lk / 0.25 * 0.6 : 0.4 + Math.min(1, (lk - 0.25) / 0.35) * 1.4 - Math.max(0, lk - 0.6) * 1.6) : 1;
  const ok = since('ok'), bad = since('bad'), won = since('win');
  let flick = 1;
  if (bad < 1.2) flick = rm ? 0.55 + 0.45 * (bad / 1.2) : (bad > 1.0 ? 0.5 + (bad - 1) * 2.5 : (hash(Math.floor(bad * 18)) > 0.45 ? 1 : 0.08));
  const master = Math.max(0.05, ramp * flick * (1 - 0.55 * M.dim)) * (1 + 0.5 * M.warm);
  const pulse = M.dim * (0.5 + 0.5 * Math.sin(t * 3.4));
  const spotMaster = Math.max(0.05, ramp * flick) * (1 + 0.5 * M.warm) * (1 + 0.5 * M.converge);

  // spotlights
  o.spots.forEach((s, i) => {
    const sweep = 1 - M.converge;
    const tx = s.x * 0.55 + Math.sin(t * 0.45 + s.phase) * 3.2 * sweep, tz = 0.6 + Math.sin(t * 0.31 + s.phase * 1.3) * 2.6 * sweep;
    const ty = M.converge * 1.3;
    s.target.set(tx * sweep + 0 * M.converge, ty, tz * sweep + 0.9 * M.converge);
    s.light.target.position.copy(s.target);
    tmpC.copy(s.base).lerp(AMBER, M.dim * 0.7).lerp(WARM, M.warm);
    if (ok < 0.6) tmpC.lerp(GREEN, (1 - ok / 0.6) * 0.8);
    if (bad < 1.2) tmpC.lerp(RED, (1 - bad / 1.2) * 0.9);
    const inten = spotMaster * (0.8 + 0.5 * pulse);
    s.light.color.copy(tmpC); s.light.intensity = 260 * inten;
    const dir = tmpV.copy(s.target).sub(s.light.position); const len = dir.length(); dir.normalize();
    s.beam.position.copy(s.light.position); s.beam.quaternion.setFromUnitVectors(DOWN, dir);
    const r = Math.tan(0.24 - 0.1 * M.converge) * len; s.beam.scale.set(r, len, r);
    s.beam.material.uniforms.color.value.copy(tmpC); s.beam.material.uniforms.intensity.value = 0.22 * inten * (1 - 0.35 * M.converge); s.beam.material.uniforms.time.value = t;
    o.heads.setMatrixAt(i, tmpM.compose(s.light.position, s.beam.quaternion, tmpS.set(1, 1, 1)));
    o.lens.setMatrixAt(i, tmpM); o.lens.setColorAt(i, tmpC.clone().multiplyScalar(1.5 * inten));
    const pd = Math.max(0, s.target.y) / Math.max(0.1, -dir.y);
    o.floorMat.uniforms.pools.value[i].set(s.target.x + dir.x * pd, s.target.z + dir.z * pd, r * 0.75, inten);
    o.floorMat.uniforms.poolCol.value[i].copy(tmpC);
  });
  o.heads.instanceMatrix.needsUpdate = o.lens.instanceMatrix.needsUpdate = true; o.lens.instanceColor.needsUpdate = true;

  // other lights
  o.hemi.intensity = 0.35 * master; o.keyLight.intensity = 0.35 * master;
  const curY = S.layout.y(Math.min(S.level, S.layout.n - 1));
  o.boardLight.position.y = damp(o.boardLight.position.y, curY, 3, realDt);
  tmpC.copy(AMBER).lerp(WARM, M.warm); if (ok < 0.8) tmpC.lerp(GREEN, 1 - ok / 0.8); if (bad < 1.2) tmpC.lerp(RED, 1 - bad / 1.2);
  o.boardLight.color.copy(tmpC); o.boardLight.intensity = 6 * master * (1 + pulse * 0.5) + (ok < 0.5 ? 20 * (1 - ok / 0.5) : 0);
  const cy = 5 * master * (1 - 0.6 * M.dim) * (0.85 + 0.15 * Math.sin(t * 1.3));
  o.cyanL.intensity = o.cyanR.intensity = cy;
  o.tipGlow.setColorAt(0, tmpC.copy(CYAN).multiplyScalar(0.6 * master * (0.8 + 0.2 * Math.sin(t * 7)))); o.tipGlow.setColorAt(1, tmpC); o.tipGlow.instanceColor.needsUpdate = true;
  o.podStrip.material.color.copy(AMBER).multiplyScalar(master * (1.2 + 1.6 * pulse) + (lk < 1 ? (1 - lk) * 2 : 0));
  if (ok < 0.8) o.podStrip.material.color.lerp(GREEN, 1 - ok / 0.8); if (bad < 1.2) o.podStrip.material.color.lerp(RED, 1 - bad / 1.2);
  o.podBolt.material.color.copy(o.podStrip.material.color).multiplyScalar(0.8);

  // wall bars: slow breathing, chase on win, amber pulse on tension
  for (let i = 0; i < o.bars.count; i++) {
    const base = i % 2 ? CYAN : AMBER;
    let k = 0.45 + 0.25 * Math.sin(t * 0.9 + i * 0.8);
    if (won < 6) k += Math.max(0, Math.sin(t * 9 - i * 1.2)) * 1.4;
    tmpC.copy(base).lerp(AMBER, M.dim).multiplyScalar(k * master * (1 + pulse));
    o.bars.setColorAt(i, tmpC);
  }
  o.bars.instanceColor.needsUpdate = true;

  // side cabinet LEDs: idle twinkle
  for (let i = 0; i < o.sideLed.count; i++) {
    const h = hash(i + 0.37), on = hash(Math.floor(t * (0.4 + h * 1.2)) * 13.1 + i) > 0.35;
    tmpC.copy(h < 0.5 ? GREEN : h < 0.8 ? AMBER : RED).multiplyScalar(on ? 0.9 * Math.min(1, master) : 0.04);
    o.sideLed.setColorAt(i, tmpC);
  }
  o.sideLed.instanceColor.needsUpdate = true;

  // cables: flowing pulses, faster when tense / on win
  o.cables.forEach((c, i) => { const u = c.material.uniforms; u.time.value = t * (1 + M.dim * 1.5 + M.warm * 2) + i * 0.37; u.amp.value = (1.2 + pulse) * master; });

  // ladder LEDs
  updateLadder(dt, realDt, master);

  // camera: drift, tension push-in, shake
  const drift = rm ? 0.3 : 1;
  const push = M.push;
  const cx = Math.sin(t * 0.13) * 0.9 * drift, cyy = Math.sin(t * 0.17) * 0.2 * drift;
  S.camPos.set(cx * (1 - push * 0.6), 3.7 + cyy - push * 0.9, 11.2 - push * 3.6);
  S.camLook.set(cx * 0.2, 3.5 - push * 0.9, -4);
  const cam = o.camera;
  cam.position.copy(S.camPos);
  if (!rm && bad < 0.5) { const a = (1 - bad / 0.5) * 0.12; cam.position.x += (Math.random() - 0.5) * a; cam.position.y += (Math.random() - 0.5) * a; }
  if (!rm && lk < 0.4 && lk > 0.25) cam.position.z -= 0.04 * Math.sin((lk - 0.25) / 0.15 * Math.PI);
  cam.lookAt(S.camLook);

  // flash overlay
  let fa = 0; tmpC.set(0, 0, 0);
  if (ok < 0.7) { fa = (1 - ok / 0.7) ** 2 * 0.35; tmpC.copy(GREEN).multiplyScalar(fa); }
  if (bad < 0.7) { fa = (1 - bad / 0.7) ** 2 * 0.4; tmpC.copy(RED).multiplyScalar(fa); }
  if (won < 1.2) tmpC.add(tmpV.set(1, 0.75, 0.4).multiplyScalar((1 - won / 1.2) ** 2 * 0.3));
  if (rm) tmpC.multiplyScalar(0.5);
  o.flash.material.color.copy(tmpC); o.flash.visible = tmpC.r + tmpC.g + tmpC.b > 0.002;

  if (S.sparkAt && S.t >= S.sparkAt) {
    S.sparkAt = 0;
    emit(ledPos(S.level), rm ? 40 : 150, { colors: [new THREE.Color(1.6, 1.5, 1.1), AMBER, GREEN], speed: 6, life: 1.2 });
    if (!rm) emit(ledPos(S.level).add(new THREE.Vector3(-MOD_W * 0.7, 0, 0)), 60, { speed: 4, life: 0.9 });
  }
  // win: continuous sparks fountains for a while
  if (won < 5 && Math.random() < (rm ? 0.12 : 0.5)) {
    const x = (Math.random() - 0.5) * 12;
    emit(new THREE.Vector3(x, 6 + Math.random() * 2, -3 + Math.random() * 3), rm ? 8 : 22, { colors: [AMBER, CYAN, GREEN, new THREE.Color(1.5, 1.4, 1.2)], speed: 3, grav: 0.25, life: 2.2, up: 0.1, forward: 0.4 });
  }
  // occasional idle crackle at the insulators
  if (!rm && Math.random() < 0.012 * (1 + M.dim * 3)) emit(new THREE.Vector3(Math.random() < 0.5 ? -4.6 : 4.6, 3.18, -1.6), 6, { colors: [CYAN, new THREE.Color(1.2, 1.6, 1.8)], speed: 2.2, life: 0.5, grav: 0.4 });

  // dust
  const P = o.dPos;
  for (let i = 0; i < P.length / 3; i++) {
    const s = o.dSeed[i];
    P[i * 3 + 1] += (0.05 + 0.04 * Math.sin(s)) * dt; P[i * 3] += Math.sin(t * 0.3 + s) * 0.03 * dt;
    if (P[i * 3 + 1] > 8.5) P[i * 3 + 1] = 0;
  }
  o.dust.geometry.attributes.position.needsUpdate = true;
  o.dust.material.opacity = 0.5 * Math.min(1, master);

  updateHost(dt, realDt);
  updateSparks(dt);
  render();
  const ms = performance.now() - t0; S.ms = S.ms ? S.ms * 0.95 + ms * 0.05 : ms;
}

function updateLadder(dt, realDt, master) {
  const o = S.o, n = S.layout.n, t = S.t, rm = S.reduced;
  const ok = since('ok'), bad = since('bad'), won = since('win'), lk = since('lock');
  const L = S.level;
  // climb chase after correct(): a light runs from the bottom up to the newly reached module
  const climbHead = ok < 1.3 ? Math.min(L + 0.65, (ok / 0.9) * (L + 1) - 0.5) : -1;
  for (let i = 0; i < n; i++) {
    let c = tmpC, glow = 0, leverGoal;
    const flick = 0.92 + 0.08 * Math.sin(t * (13 + hash(i) * 9) + i * 3) * (hash(Math.floor(t * 3) + i * 7) > 0.85 ? 1 : 0.3); // subtle idle flicker
    if (won < 99 && S.state === 'win') {
      const ph = ((t * 10 - i) % n + n) % n, k = Math.max(0, 1 - ph / 3.5);
      c.copy(i % 3 === 0 ? AMBER : i % 3 === 1 ? GREEN : CYAN).multiplyScalar(0.25 + 1.6 * k);
      glow = 0.3 + k; leverGoal = 1;
    } else if (i < L || (i === L && S.cur === 'ok')) {
      c.copy(GREEN).multiplyScalar(0.9 * flick); glow = 0.55 * flick; leverGoal = 1;
      if (i === L && ok > 0.8 && ok < 2) { const k = Math.max(0, 1 - (ok - 0.8) / 1.2); c.multiplyScalar(1 + 2 * k); glow += k * 1.5; }
    } else if (i === L && S.cur === 'bad') {
      const k = bad < 1.4 && !rm ? (Math.sin(bad * 30) > 0 ? 1 : 0.3) : 1;
      c.copy(RED).multiplyScalar(1.1 * k); glow = 0.8 * k; leverGoal = -1;
    } else if (i === L) {
      const speed = lk < 2.5 ? 9 : S.mood.dim > 0.5 ? 5 : 3, bl = rm ? 0.65 + 0.35 * Math.sin(t * 2) : (Math.sin(t * speed) > -0.2 ? 1 : 0.12);
      c.copy(AMBER).multiplyScalar(1.1 * bl); glow = 0.9 * bl; leverGoal = 0;
    } else { c.setRGB(0.05, 0.05, 0.055).multiplyScalar(flick); glow = 0; leverGoal = 0; }
    if (climbHead >= 0 && S.state !== 'win') {
      if (i === L && climbHead < i + 0.5) { c.copy(AMBER).multiplyScalar(0.8); glow = 0.6; }
      const d = climbHead - i; if (d > -0.3 && d < 1.6) { const k = 1 - Math.abs(d - 0.65) / 0.95; if (k > 0) { c.r += 1.4 * k; c.g += 1.3 * k; c.b += 0.9 * k; glow += k * 1.2; } }
    }
    if (S.state !== 'win') c.multiplyScalar(Math.min(1.15, 0.5 + master * 0.6));
    o.ledCore.setColorAt(i, c);
    o.ledGlow.setColorAt(i, c.clone().multiplyScalar(glow));
    // lever animation: up(1) = on, 0 = off, -1 = tripped (snaps fast)
    S.lever[i] = damp(S.lever[i], leverGoal, leverGoal === -1 ? 18 : 8, realDt);
    const y = S.layout.y(i), ang = -S.lever[i] * 0.55 + 0.25;
    o.lever.setMatrixAt(i, tmpM.compose(tmpV.set(MOD_X - MOD_W * 0.33, y, BOARD_Z + 0.2), tmpQ.setFromAxisAngle(new THREE.Vector3(1, 0, 0), ang), tmpS.set(1, S.layout.h / 0.42, 1)));
  }
  for (let f = 0; f < o.frame.count; f++) {
    const i = S.frameOf[f], reached = i < L || (i === L && S.cur === 'ok');
    tmpC.copy(AMBER).multiplyScalar(reached ? 1.5 + 0.3 * Math.sin(t * 2) : 0.35);
    if (S.state === 'win') tmpC.copy(WARM).multiplyScalar(1.2 + Math.sin(t * 6 + i));
    o.frame.setColorAt(f, tmpC);
  }
  o.ledCore.instanceColor.needsUpdate = o.ledGlow.instanceColor.needsUpdate = o.frame.instanceColor.needsUpdate = true;
  o.lever.instanceMatrix.needsUpdate = true;
}

function render() {
  const o = S.o, r = o.renderer, cam = o.camera;
  // planar reflection: mirror camera across y=0
  const v = o.vcam;
  v.fov = cam.fov; v.aspect = cam.aspect; v.near = cam.near; v.far = cam.far; v.updateProjectionMatrix();
  v.position.set(cam.position.x, -cam.position.y, cam.position.z);
  v.up.set(0, -1, 0); v.lookAt(S.camLook.x, -S.camLook.y, S.camLook.z); v.updateMatrixWorld();
  o.floorMat.uniforms.textureMatrix.value.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1).multiply(v.projectionMatrix).multiply(v.matrixWorldInverse);
  o.floorMat.uniforms.camPos.value.copy(cam.position);
  r.info.autoReset = false; r.info.reset();
  o.floor.visible = false;
  r.setRenderTarget(o.rt); r.clear(); r.render(o.scene, v);
  r.setRenderTarget(null); o.floor.visible = true;
  r.render(o.scene, cam);
}

// ---------- mascot host ----------
const HOST_POS = new THREE.Vector3(-2.9, 1.5, 0.9), HOST_H = 2.2;    // on a raised host stand at the left, clear of the question panel and the rank list
function removeHost() {
  const h = S && S.host; if (!h) return;
  h.mixer.stopAllAction(); h.mixer.uncacheRoot(h.model);
  if (h.bulb) { h.bulb.intensity = 0; S.o.scene.add(h.bulb); }
  S.o.scene.remove(h.root);
  h.root.traverse(x => {
    if (x.geometry) x.geometry.dispose();
    if (x.material) [].concat(x.material).forEach(m => { for (const k in m) if (m[k] && m[k].isTexture) m[k].dispose(); m.dispose(); });
  });
  S.host = null;
}
async function loadHost(url) {
  if (!S) return;
  const token = S.hostToken = (S.hostToken || 0) + 1;
  removeHost();
  if (!url) return;
  try {
    const { GLTFLoader } = await import(GLTF_LOADER_URL);
    const gltf = await new GLTFLoader().loadAsync(url);
    if (!S || S.hostToken !== token) return;            // disposed or superseded meanwhile
    const root = new THREE.Group(), model = gltf.scene;
    root.add(model);
    const box = new THREE.Box3().setFromObject(model), size = box.getSize(new THREE.Vector3());
    const k = size.y > 0.01 ? HOST_H / size.y : 1;
    model.scale.setScalar(k); model.position.y = -box.min.y * k;   // feet on the stage even if origin is off
    root.position.copy(HOST_POS);
    { // the host stand: a dark plinth with an amber edge, down to the stage
      const ph = HOST_POS.y - 0.22, plinth = new THREE.Mesh(new THREE.BoxGeometry(1.3, ph, 1.1), new THREE.MeshStandardMaterial({ color: 0x1a1f27, metalness: 0.6, roughness: 0.4 }));
      plinth.position.y = -ph / 2; root.add(plinth);
      const strip = new THREE.Mesh(new THREE.BoxGeometry(1.34, 0.05, 1.14), new THREE.MeshBasicMaterial({ color: 0xf39200 }));
      strip.position.y = -0.03; root.add(strip);
    }
    root.rotation.y = Math.atan2(-HOST_POS.x, 11 - HOST_POS.z);   // turn toward the camera
    model.traverse(x => { if (x.isMesh) { x.frustumCulled = false; [].concat(x.material).forEach(m => { if (m.isMeshStandardMaterial) m.envMapIntensity = 0.8; if (/bulb/i.test(m.name)) { m.color?.set(0xfff4d6); m.emissive?.set(0xffc870); m.emissiveIntensity = 0.35; m.opacity = Math.max(m.opacity, 0.55); } }); } });
    const mixer = new THREE.AnimationMixer(model), actions = {};
    for (const clip of gltf.animations) {
      const name = clip.name.toLowerCase();
      for (const want of ['idle', 'talk', 'cheer', 'sad', 'think', 'wave', 'point', 'nervous', 'facepalm', 'dance']) if (!actions[want] && (name === want || name.includes(want))) actions[want] = mixer.clipAction(clip);
    }
    let filament = null;
    model.traverse(x => { if (!filament && /filament/i.test(x.name)) filament = x; });
    let bulb = null;
    if (filament) { bulb = S.o.bulb; filament.add(bulb); bulb.position.set(0, 0, 0); }
    S.o.scene.add(root);
    S.host = { root, model, mixer, actions, cur: null, bulb, glow: 1 };
    Studio.host(S.hostAction || 'idle');
  } catch (e) { if (S && S.hostToken === token) S.host = null; }   // missing file / no network: silently no host
}
function updateHost(dt, realDt) {
  const h = S.host; if (!h) return;
  h.mixer.update(dt);
  if (h.bulb) {
    const cheer = h.cur === h.actions.cheer, goal = cheer ? 3.2 : h.cur === h.actions.sad ? 0.35 : 1;
    h.glow = damp(h.glow, goal, 4, realDt);
    const fl = S.reduced ? 1 : 0.88 + 0.08 * Math.sin(S.t * 23) + 0.06 * hash(Math.floor(S.t * 14));
    h.bulb.intensity = 0.6 * h.glow * fl * Math.max(0.3, Math.min(1.2, S.mood ? 1 - 0.3 * S.mood.dim : 1));
    if (h.cur === h.actions.sad) h.bulb.color.copy(AMBER).multiplyScalar(0.8); else h.bulb.color.copy(AMBER);
  }
}

function resize() {
  if (!S) return;
  const el = S.container, w = Math.max(1, el.clientWidth || window.innerWidth), h = Math.max(1, el.clientHeight || window.innerHeight);
  const o = S.o; o.renderer.setSize(w, h, false);
  o.camera.aspect = w / h; o.camera.fov = w / h < 1 ? 60 : w / h < 1.4 ? 50 : 42; o.camera.updateProjectionMatrix();
  o.rt.setSize(Math.ceil(w / 2), Math.ceil(h / 2));
  o.floorMat.uniforms.texel.value.set(2 / w, 2 / h);
}

const Studio = {
  init(container) {
    if (S) return true;
    if (!container || !webglOK()) return false;
    let o;
    try { o = build(container); } catch (e) { console.warn('Studio: WebGL init failed', e); return false; }
    const mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    S = { container, o, t: 0, last: 0, level: 0, total: 16, cur: 'cur', state: 'ask', ev: {}, frameOf: new Int16Array(MAXN * 4),
      mood: { dim: 0, converge: 0, push: 0, warm: 0 }, goal: { dim: 0, converge: 0, push: 0, warm: 0 },
      camPos: new THREE.Vector3(), camLook: new THREE.Vector3(), reduced: !!(mq && mq.matches), mq };
    S.onMq = () => { S.reduced = !!mq.matches; };
    if (mq) mq.addEventListener ? mq.addEventListener('change', S.onMq) : mq.addListener(S.onMq);
    S.onResize = () => resize();
    window.addEventListener('resize', S.onResize);
    if (window.ResizeObserver) { S.ro = new ResizeObserver(S.onResize); S.ro.observe(container); }
    S.onVis = () => { S.last = 0; };
    document.addEventListener('visibilitychange', S.onVis);
    S.onLost = (e) => { e.preventDefault(); cancelAnimationFrame(S.raf); };
    o.renderer.domElement.addEventListener('webglcontextlost', S.onLost);
    layoutBoard(); resize();
    if (hostUrl) loadHost(hostUrl);
    S.raf = requestAnimationFrame(frame);
    return true;
  },
  setLevel(level, total) {
    if (!S) return;
    total = Math.max(1, Math.min(MAXN, total | 0 || S.total));
    const relayout = total !== S.total;
    S.total = total; S.level = Math.max(0, Math.min(total, level | 0));
    S.cur = 'cur'; if (S.state === 'win') S.state = 'ask';
    if (relayout) layoutBoard();
  },
  ask() { if (!S) return; S.state = 'ask'; S.cur = 'cur'; Object.assign(S.goal, { dim: 0, converge: 0, push: 0, warm: 0 }); },
  tension(on) { if (!S) return; S.state = on ? 'tension' : 'ask'; Object.assign(S.goal, on ? { dim: 1, converge: 1, push: 1, warm: 0 } : { dim: 0, converge: 0, push: 0, warm: 0 }); },
  lockIn() { if (!S) return; S.ev.lock = S.t; },
  correct() {
    if (!S) return;
    S.cur = 'ok'; S.ev.ok = S.t; S.state = 'ask';
    Object.assign(S.goal, { dim: 0, converge: 0.4, push: 0.35, warm: 0.2 });
    S.sparkAt = S.t + 0.8;   // burst when the climb chase reaches the new module
    emit(ledPos(0), S.reduced ? 6 : 20, { speed: 2.5, life: 0.6 });
  },
  wrong() {
    if (!S) return;
    S.cur = 'bad'; S.ev.bad = S.t; S.state = 'ask';
    Object.assign(S.goal, { dim: 0.6, converge: 0.2, push: 0.2, warm: 0 });
    emit(ledPos(S.level).add(new THREE.Vector3(-MOD_W * 0.73, 0, 0)), S.reduced ? 20 : 70, { colors: [new THREE.Color(1.6, 1.2, 0.8), RED], speed: 4.5, life: 0.8 });
  },
  win() {
    if (!S) return;
    S.state = 'win'; S.ev.win = S.t; S.level = S.total; S.cur = 'ok';
    Object.assign(S.goal, { dim: 0, converge: 0, push: 0, warm: 1 });
    for (let i = 0; i < S.total; i += 2) emit(ledPos(i), S.reduced ? 6 : 25, { colors: [AMBER, GREEN, CYAN], speed: 5, life: 1.4 });
  },
  // Mascot host: GLB with clips idle/talk/cheer/sad/think/wave/point/nervous/facepalm/dance, faces +Z, origin at feet. Missing/broken file -> no host.
  setHost(url) { hostUrl = url || null; if (S) loadHost(hostUrl); },
  host(action) {
    if (!S) return;
    S.hostAction = action;
    const h = S.host; if (!h) return;
    // newer actions fall back to the closest basic one when the model doesn't have them
    const FALL = { wave: 'cheer', point: 'talk', nervous: 'think', facepalm: 'sad', dance: 'cheer' };
    const want = String(action).toLowerCase(), next = h.actions[want] || h.actions[FALL[want]];
    if (!next || next === h.cur) return;
    next.reset().setEffectiveWeight(1).play();
    if (h.cur) h.cur.crossFadeTo(next, 0.35, false);
    h.cur = next;
  },
  dispose() {
    if (!S) return;
    cancelAnimationFrame(S.raf);
    removeHost();
    window.removeEventListener('resize', S.onResize);
    document.removeEventListener('visibilitychange', S.onVis);
    if (S.ro) S.ro.disconnect();
    if (S.mq) S.mq.removeEventListener ? S.mq.removeEventListener('change', S.onMq) : S.mq.removeListener(S.onMq);
    const o = S.o;
    o.scene.traverse(x => { if (x.geometry) x.geometry.dispose(); if (x.material) [].concat(x.material).forEach(m => m.dispose()); if (x.dispose && x.isInstancedMesh) x.dispose(); });
    o.disposables.forEach(d => d.dispose && d.dispose());
    if (S.panelTex) S.panelTex.dispose();
    o.renderer.domElement.removeEventListener('webglcontextlost', S.onLost);
    o.renderer.dispose();
    o.renderer.domElement.remove();
    S = null;
  },
  get supported() { return webglOK(); },
  _debug() { return S && { calls: S.o.renderer.info.render.calls, tris: S.o.renderer.info.render.triangles, level: S.level, total: S.total, state: S.state, fps: Math.round(S.fps || 0), cpuMs: +(S.ms || 0).toFixed(2) }; },
};

export default Studio;
