'use strict';
// „Hálózatépítők” – shared rules: map geometry, legality, scoring. Pure functions over a state shape
// { blocks:[{t,o}], edges:{eid:pid}, nodes:{nid:{pid,kind,res?}}, players:[...] } used by the host (to
// validate) and by every phone (to highlight legal moves). No DOM here.
const R = (() => {
  const N = 7, B = 6; // 7×7 intersections, 6×6 blocks
  const RES = {
    I: { icon: '🔩', name: 'Szerelvény', part: 'I. Alkatrész és anyagismeret' },
    II: { icon: '⏱️', name: 'Munkaóra', part: 'II. Technológiai ismeret' },
    III: { icon: '🟠', name: 'Réz', part: 'III. Számítási feladatok' },
    IV: { icon: '🛡️', name: 'Védelem', part: 'IV. Villamos biztonsági ismeret' },
  };
  const RK = ['I', 'II', 'III', 'IV'];
  const BUILD = {
    haz: { name: 'Ház', icon: '🏠', vp: 1, cost: { I: 1, IV: 1 } },
    iskola: { name: 'Iskola', icon: '🏫', vp: 2, cost: { I: 2, IV: 1, II: 1 } },
    uzem: { name: 'Üzem', icon: '🏭', vp: 2, cost: { I: 2, IV: 1, II: 1 }, prod: { II: 1 }, tip: '+1 ⏱️ minden körödben' },
    korhaz: { name: 'Kórház', icon: '🏥', vp: 3, cost: { I: 2, IV: 2, III: 1 } },
    napelem: { name: 'Napelempark', icon: '🔆', vp: 1, cost: { I: 1, III: 1, IV: 1 }, prod: { III: 1 }, tip: '+1 🟠 minden körödben' },
  };
  const ELOSZTO_COST = { III: 2, I: 1, IV: 1 };
  const CARD_COST = { III: 1, II: 1, IV: 1 };
  const CARDS = {
    levezeto: { icon: '🔰', name: 'Túlfeszültség-levezető', tip: 'Kivéd egy Villámcsapás-veszteséget (magától lép életbe).', passive: true },
    lada: { icon: '🧰', name: 'Szerszámláda', tip: '+2 nyersanyag, amit választasz.' },
    engedely: { icon: '🚧', name: 'Engedélyügyintézés', tip: '2 kábelszakaszt ingyen építhetsz.' },
    mester: { icon: '📜', name: 'Mesterlevél', tip: '+1 győzelmi pont, a játék végéig titkos.', passive: true },
    tesla: { icon: '💡', name: 'Tesla-ötlet', tip: 'A következő munkavégzésed dupla nyersanyagot ad.' },
  };
  const DECK = { levezeto: 5, lada: 4, engedely: 4, mester: 4, tesla: 4 };
  const EVENTS = {
    villam: { icon: '⚡', name: 'Villámcsapás', tip: 'Egy kerületben mindenki elveszít egy kábelszakaszt (Elosztó vagy levezető-kártya véd).' },
    hatosag: { icon: '🧑‍🔧', name: 'Hatósági ellenőrzés', tip: 'Mindenki kap egy IV. részes kérdést. Jó válasz: +1 🛡️, rossz: 1 nyersanyag bírság.' },
    rezar: { icon: '📉', name: 'Rézár-emelkedés', tip: 'A kábel +1 🟠-ba kerül a következő eseményig.' },
    napos: { icon: '🌞', name: 'Napos nap', tip: 'Minden Napelempark +2 🟠-t termel a tulajdonosának.' },
    kolcson: { icon: '🔧', name: 'Szerszámkölcsön', tip: 'A legkevesebb pontú játékos elvesz 1 nyersanyagot az éllovastól.' },
  };
  const COLORS = ['#f39200', '#18d4ff', '#39d353', '#ff4d8d', '#b38cff', '#ffd60a'];
  const AVATARS = ['🦊', '🐻', '🐼', '🐸', '🦉', '🐙', '🦄', '🐯', '🐵', '🐧', '🦖', '🤖', '👷', '🧙', '🐝', '🦔'];
  const DISTRICTS = ['északnyugati', 'északkeleti', 'délnyugati', 'délkeleti'];
  const START_RES = { I: 1, II: 1, III: 2, IV: 1 };
  const LONGEST_MIN = 5, SAFETY_MIN = 3, MAX_ELOSZTO = 2;

  // ---- geometry ----
  const xy = n => [n % N, Math.floor(n / N)];
  const EDGES = [];
  for (let y = 0; y < N; y++) for (let x = 0; x < N - 1; x++) EDGES.push([y * N + x, y * N + x + 1]);
  for (let y = 0; y < N - 1; y++) for (let x = 0; x < N; x++) EDGES.push([y * N + x, (y + 1) * N + x]);
  const NODE_EDGES = Array.from({ length: N * N }, () => []);
  EDGES.forEach(([a, b], e) => { NODE_EDGES[a].push(e); NODE_EDGES[b].push(e); });
  const other = (e, n) => EDGES[e][0] === n ? EDGES[e][1] : EDGES[e][0];
  const corners = b => { const bx = b % B, by = Math.floor(b / B), n = by * N + bx; return [n, n + 1, n + N, n + N + 1]; };
  const boundary = n => { const [x, y] = xy(n); return x === 0 || y === 0 || x === N - 1 || y === N - 1; };
  const distOf = (x, y) => (x < 3 ? 0 : 1) + (y < 3 ? 0 : 2);
  const nodeDistrict = n => distOf(...xy(n));
  const edgeDistrict = e => { const [a, b] = EDGES[e].map(xy); return distOf((a[0] + b[0]) / 2, (a[1] + b[1]) / 2); };
  const blockDistrict = b => distOf(b % B, Math.floor(b / B));
  const manhattan = (a, b) => { const [ax, ay] = xy(a), [bx, by] = xy(b); return Math.abs(ax - bx) + Math.abs(ay - by); };

  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  // fair layout: every district (3×3 blocks) gets 2 Ház, Iskola, Üzem, Napelempark; two opposite districts
  // get a Kórház, the other two an extra Ház; the rest are parks
  function genMap() {
    const blocks = Array.from({ length: B * B }, () => ({ t: null, o: null }));
    const hosp = Math.random() < 0.5 ? [0, 3] : [1, 2];
    for (let d = 0; d < 4; d++) {
      const list = shuffle(['haz', 'haz', 'iskola', 'uzem', 'napelem', hosp.includes(d) ? 'korhaz' : 'haz', null, null, null]);
      const ids = []; for (let b = 0; b < B * B; b++) if (blockDistrict(b) === d) ids.push(b);
      ids.forEach((b, i) => { blocks[b].t = list[i]; });
    }
    return blocks;
  }

  // ---- network ----
  const ownEdges = (S, pid) => Object.keys(S.edges).filter(e => S.edges[e] === pid).map(Number);
  function netNodes(S, pid) {
    const set = new Set();
    for (const [n, v] of Object.entries(S.nodes)) if (v.pid === pid) set.add(+n);
    for (const e of ownEdges(S, pid)) { set.add(EDGES[e][0]); set.add(EDGES[e][1]); }
    return set;
  }
  const blocked = (S, pid, n) => S.nodes[n] && S.nodes[n].pid !== pid; // others' trafo / elosztó stops you
  function legalCables(S, pid) {
    const net = netNodes(S, pid), from = new Set();
    for (const n of net) if (!blocked(S, pid, n)) from.add(n);
    // Elosztó reach: the network may jump one empty edge from an Elosztó
    for (const [n, v] of Object.entries(S.nodes)) if (v.pid === pid && v.kind === 'eloszto')
      for (const e of NODE_EDGES[+n]) if (S.edges[e] == null) { const m = other(e, +n); if (!blocked(S, pid, m)) from.add(m); }
    const out = [];
    EDGES.forEach(([a, b], e) => { if (S.edges[e] == null && (from.has(a) || from.has(b))) out.push(e); });
    return out;
  }
  function legalTrafo(S) {
    const trafos = Object.entries(S.nodes).filter(([, v]) => v.kind === 'trafo').map(([n]) => +n);
    const out = [];
    for (let n = 0; n < N * N; n++) if (boundary(n) && !S.nodes[n] && trafos.every(t => manhattan(t, n) >= 3)) out.push(n);
    return out;
  }
  const legalSetupCable = (S, pid) => {
    const t = Object.entries(S.nodes).find(([, v]) => v.pid === pid && v.kind === 'trafo');
    return t ? NODE_EDGES[+t[0]].filter(e => S.edges[e] == null) : [];
  };
  function legalPower(S, pid) {
    const net = netNodes(S, pid);
    return S.blocks.map((b, i) => i).filter(i => S.blocks[i].t && S.blocks[i].o == null && corners(i).some(n => net.has(n)));
  }
  function legalEloszto(S, pid) {
    const count = Object.values(S.nodes).filter(v => v.pid === pid && v.kind === 'eloszto').length;
    if (count >= MAX_ELOSZTO) return [];
    return [...netNodes(S, pid)].filter(n => !S.nodes[n]);
  }
  const cableCost = S => ({ III: 1 + (S.costUp || 0), II: 1 });
  const afford = (res, cost) => Object.entries(cost).every(([k, v]) => (res[k] || 0) >= v);
  const pay = (res, cost) => { for (const [k, v] of Object.entries(cost)) res[k] -= v; };
  const costStr = cost => Object.entries(cost).map(([k, v]) => `${v}${RES[k].icon}`).join(' ');

  // longest continuous cable path (edges, each used once)
  function longest(S, pid) {
    const mine = new Set(ownEdges(S, pid));
    if (!mine.size) return 0;
    let best = 0;
    const used = new Set();
    const dfs = (n, len) => {
      if (len > best) best = len;
      for (const e of NODE_EDGES[n]) if (mine.has(e) && !used.has(e)) { used.add(e); dfs(other(e, n), len + 1); used.delete(e); }
    };
    const starts = new Set(); for (const e of mine) { starts.add(EDGES[e][0]); starts.add(EDGES[e][1]); }
    for (const n of starts) dfs(n, 0);
    return best;
  }
  // VP; withHidden = include Mesterlevél (only the owner and the host see those)
  function vp(S, p, withHidden = true) {
    let v = 0;
    for (const b of S.blocks) if (b.o === p.id) v += BUILD[b.t].vp;
    for (const n of Object.values(S.nodes)) if (n.pid === p.id && n.kind === 'eloszto') v += 1;
    if (S.longest?.pid === p.id) v += 2;
    if (S.safety?.pid === p.id) v += 2;
    if (withHidden) v += (p.cards || []).filter(c => c.t === 'mester').length;
    return v;
  }
  // bank ratio per resource: 3:1, or 2:1 in the resources chosen at your Elosztók
  function ratios(S, pid) {
    const r = { I: 3, II: 3, III: 3, IV: 3 };
    for (const v of Object.values(S.nodes)) if (v.pid === pid && v.kind === 'eloszto' && v.res) r[v.res] = 2;
    return r;
  }
  return { COLORS, AVATARS, N, B, RES, RK, BUILD, ELOSZTO_COST, CARD_COST, CARDS, DECK, EVENTS, DISTRICTS, START_RES, LONGEST_MIN, SAFETY_MIN, MAX_ELOSZTO,
    xy, EDGES, NODE_EDGES, other, corners, boundary, nodeDistrict, edgeDistrict, blockDistrict, shuffle, genMap,
    ownEdges, netNodes, legalCables, legalTrafo, legalSetupCable, legalPower, legalEloszto, cableCost, afford, pay, costStr, longest, vp, ratios };
})();
if (typeof module !== 'undefined') module.exports = R;
