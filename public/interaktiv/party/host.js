'use strict';
// Host engine: the authoritative game state. Runs on the phone that created the room (that phone also plays,
// through the same UI as everyone else: its actions are passed straight to handle()).
// Phones get a sanitised per-player view on every change (never the correct answer before the reveal, never
// other players' cards). Timed flows (questions, events) are async; turn deadlines are checked by a ticker.
const Host = (() => {
  const SAVE_KEY = 'vlab.party.host';
  const Q_MS = 20000, WORK_MS = 40000, MAIN_MS = 90000, SETUP_MS = 45000, PROMPT_MS = 20000, REVEAL_MS = 6500;
  let S = null, net = null, localPid = null, onLocal = () => {};
  const conns = new Map(), seen = {}, spect = new Set(); // cid -> pid
  let answers = {}, secret = null, collector = null, prompts = {}, runId = 0, uid = 0, tickT = null;
  const now = () => Date.now();
  const byId = id => S.players.find(p => p.id === id);
  const nm = id => byId(id)?.name || '?';
  const online = () => S.players.filter(p => p.online);
  const cur = () => S.turn && byId(S.turn.pid);
  const newId = () => now().toString(36) + (uid++).toString(36) + Math.random().toString(36).slice(2, 5);

  // ---------- state ----------
  function fresh(code) {
    return { v: 2, code, phase: 'lobby', vpTarget: 10, players: [], seq: 0, log: [], line: null, toast: null, fx: null,
      blocks: R.genMap(), edges: {}, nodes: {}, order: [], turnNo: 0, turn: null, setup: null, q: null, offer: null,
      event: null, prompts: {}, costUp: 0, longest: null, safety: null, deck: [], evDeck: [], used: [], podium: null };
  }
  const zero = () => ({ I: 0, II: 0, III: 0, IV: 0 });
  function newPlayer(m, isLocal) {
    return { id: newId(), token: m.token, name: String(m.name || 'Játékos').slice(0, 16), avatar: m.avatar, color: m.color,
      online: true, isLocal, cid: null, res: zero(), cards: [], free: 0, tesla: false, offSince: 0,
      stats: { ok: zero(), n: zero(), cables: 0, built: 0 } };
  }
  function log(text) { S.log.push({ t: now(), text }); if (S.log.length > 40) S.log.shift(); }
  function toast(text, to) { S.toast = { seq: ++uid, text, to }; }
  function fx(o) { S.fx = { seq: ++uid, ...o }; }
  // Fázis Feri: subtitle for everyone; the voice plays on the host phone only
  function feri(text, kind, idx) {
    const lines = Voice.lines[kind];
    if (lines && idx == null) idx = Math.floor(Math.random() * lines.length);
    if (lines && !text) text = lines[idx];
    S.line = { seq: ++uid, text };
    if (lines) Voice.file(`game/voice/${kind}_${idx + 1}.mp3`, 0);
  }

  // ---------- sanitised views ----------
  function pubFor(pid) {
    const t = now(), me = pid && byId(pid), over = S.phase === 'over';
    const q = S.q && { ...S.q, left: S.q.deadline - t, answered: Object.keys(answers) };
    return {
      code: S.code, phase: S.phase, vpTarget: S.vpTarget, seq: S.seq, order: S.order, turnNo: S.turnNo, local: Net.LOCAL,
      turn: S.turn && { ...S.turn, left: S.turn.deadline - t },
      setup: S.setup && { pid: S.setup.seq[S.setup.i], kind: S.setup.i < S.order.length ? 'trafo' : 'cable', left: S.setup.deadline - t, step: S.setup.i, total: S.setup.seq.length },
      blocks: S.blocks, edges: S.edges, nodes: S.nodes, costUp: S.costUp, longest: S.longest, safety: S.safety,
      log: S.log.slice(-10), line: S.line, fx: S.fx, event: S.event, offer: S.offer, q, podium: S.podium,
      toast: S.toast && (!S.toast.to || S.toast.to === pid) ? S.toast : null,
      deckN: S.deck.length,
      players: S.players.map(p => ({ id: p.id, name: p.name, avatar: p.avatar, color: p.color, online: p.online, host: p.isLocal,
        resN: R.RK.reduce((a, k) => a + p.res[k], 0), cardsN: p.cards.length, vp: R.vp(S, p, p.id === pid || over),
        len: R.longest(S, p.id), safe: p.stats.ok.IV, stats: over ? p.stats : undefined })),
      me: me && { id: me.id, res: me.res, cards: me.cards, free: me.free, tesla: me.tesla, ratios: R.ratios(S, me.id) },
      prompt: pid ? S.prompts[pid] || null : null,
      isHost: !!pid && pid === localPid,
    };
  }
  let saveT = 0;
  function push() {
    S.seq++;
    for (const [cid, pid] of conns) { const p = byId(pid); if (p?.online && p.cid === cid) net.send(cid, { type: 'state', s: pubFor(pid) }); }
    for (const cid of spect) net.send(cid, { type: 'state', s: pubFor(null) });
    onLocal(structuredClone(pubFor(localPid)));
    if (!saveT) saveT = setTimeout(() => { saveT = 0; persist(); }, 800);
  }
  function persist() {
    if (!S) return;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify({ at: now(), S, localPid })); sessionStorage.setItem('vlab.party.hosting', S.code); } catch { /* full / private */ }
  }

  // ---------- flow helpers ----------
  const F = Net.LOCAL && new URLSearchParams(location.search).has('fast') ? 0.4 : 1; // test-only speed-up of the show pauses
  const wait = (ms, id = runId) => new Promise((ok, bad) => setTimeout(() => (id === runId ? ok() : bad(new Error('reset'))), ms * F));
  const guard = p => p.catch(e => { if (e?.message !== 'reset') console.error(e); });
  function collect(ids, ms) {
    return new Promise(res => {
      const done = why => { if (collector?.res !== res) return; clearTimeout(collector.t); collector = null; res(why); };
      collector = { ids, res, t: setTimeout(() => done('time'), ms), done };
      checkCollect();
    });
  }
  function checkCollect() {
    if (!collector) return;
    if (collector.ids.every(id => answers[id] || !byId(id)?.online)) setTimeout(() => collector?.done('all'), 600);
  }
  function ask(pid, prompt, def) {
    return new Promise(res => {
      const p = byId(pid);
      if (!p?.online) return res(def);
      S.prompts[pid] = { ...prompt, id: ++uid, deadline: now() + PROMPT_MS, left: PROMPT_MS };
      prompts[pid] = { res, def };
    });
  }
  function resolvePrompt(pid, v) {
    const pr = prompts[pid]; if (!pr) return;
    delete prompts[pid]; delete S.prompts[pid];
    pr.res(v ?? pr.def);
  }
  const rnd = a => a[Math.floor(Math.random() * a.length)];

  // ---------- questions ----------
  function pickQ(part, diffs) {
    const all = QUESTIONS.filter(q => q.type === 'single' && q.part === part && q.options.length >= 4);
    let pool = all.filter(q => diffs.includes(q.difficulty) && !S.used.includes(q.id));
    if (!pool.length) pool = all.filter(q => !S.used.includes(q.id));
    if (!pool.length) { S.used = []; pool = all; }
    const q = rnd(pool); S.used.push(q.id);
    const wrong = R.shuffle(q.options.map((_, i) => i).filter(i => i !== q.answer[0])).slice(0, 3);
    const order = R.shuffle([q.answer[0], ...wrong]);
    return { q, order, correct: order.indexOf(q.answer[0]) };
  }
  const plain = html => String(html || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  function shortExpl(html) {
    const t = plain(html); if (t.length <= 340) return t;
    const cut = t.slice(0, 340), end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '));
    return end > 120 ? cut.slice(0, end + 1) : cut + '…';
  }
  // learning stats for the host's own profile (the phones don't share the app's profile)
  function recordLocal(q, ok) {
    try {
      const P = JSON.parse(localStorage.getItem('vvz.profiles')); if (!P?.current) return;
      const key = 'vvz.p.' + P.current, st0 = JSON.parse(localStorage.getItem(key)); if (!st0) return;
      const BOX = [0, 1, 3, 7, 16, 35], frac = ok ? 1 : 0;
      st0.stats ||= {}; st0.log ||= [];
      const st = st0.stats[q.id] || { n: 0, ew: null, box: 0, wrong: 0 };
      st.n++; st.ew = st.ew === null ? frac : 0.5 * st.ew + 0.5 * frac; st.lastFrac = frac; st.last = now(); st.lastGuess = false;
      st.box = ok ? Math.min(st.box + 1, BOX.length - 1) : 0; if (!ok) st.wrong++; st.due = st.last + BOX[st.box] * 864e5;
      st0.stats[q.id] = st; st0.log.push({ id: q.id, t: q.topic, f: frac, ts: st.last }); if (st0.log.length > 5000) st0.log = st0.log.slice(-5000);
      localStorage.setItem(key, JSON.stringify(st0));
    } catch { /* no profile */ }
  }

  async function runQuestion({ kind, part, diff, active }) {
    const id = runId;
    const { q, order, correct } = pickQ(part, diff === 'hard' ? [2, 3] : [1]);
    secret = { correct, q };
    answers = {};
    S.q = { kind, part, diff, active, qid: q.id, text: q.q, opts: order.map(i => q.options[i]), dur: Q_MS, deadline: now() + Q_MS, reveal: null };
    if (kind === 'work') feri(null, diff === 'hard' ? rnd(['mid', 'hard']) : 'easy');
    push();
    const why = await collect(online().map(p => p.id), Q_MS);
    if (id !== runId) throw new Error('reset');
    const ok = pid => answers[pid]?.i === correct;
    const gains = [];
    for (const p of S.players) if (answers[p.id]) {
      p.stats.n[part]++; if (ok(p.id)) p.stats.ok[part]++;
      if (p.isLocal) recordLocal(q, ok(p.id));
    }
    let card = null;
    if (kind === 'work') {
      const a = byId(active);
      if (a && ok(active)) {
        let n = diff === 'hard' ? 2 : 1; if (a.tesla) n *= 2;
        a.res[part] += n; gains.push({ pid: active, n, r: part });
        if (diff === 'hard' && S.deck.length && Math.random() < 0.4) { card = drawCard(a); }
        feri(null, 'ok');
      } else {
        for (const p of S.players) if (p.id !== active && ok(p.id)) { p.res[part] += 1; gains.push({ pid: p.id, n: 1, r: part, help: true }); }
        feri(null, why === 'time' && !answers[active] ? 'time' : 'bad');
      }
      if (a) a.tesla = false;
      log(a && ok(active) ? `✅ ${a.name} jól válaszolt: +${gains[0].n}${R.RES[part].icon}${card ? ' + 🃏' : ''}`
        : `❌ ${nm(active)} hibázott${gains.length ? ` – besegített: ${gains.map(g => nm(g.pid)).join(', ')} (+1${R.RES[part].icon})` : ''}`);
    } else {
      for (const p of online()) if (ok(p.id)) { p.res.IV += 1; gains.push({ pid: p.id, n: 1, r: 'IV' }); }
    }
    S.q.reveal = { correct, picks: Object.fromEntries(Object.entries(answers).map(([k, v]) => [k, v.i])), gains, expl: shortExpl(q.explanation), card: !!card };
    updateSafety();
    push();
    await wait(REVEAL_MS, id);
    const wrong = online().filter(p => !ok(p.id)).map(p => p.id);
    S.q = null; secret = null; answers = {};
    return { wrong };
  }

  // ---------- awards ----------
  function award(key, vals, min, label) {
    const max = Math.max(0, ...Object.values(vals)), holder = S[key]?.pid, before = holder;
    if (max < min) S[key] = null;
    else if (holder && vals[holder] === max) S[key] = { pid: holder, n: max };
    else { const top = Object.keys(vals).filter(k => vals[k] === max); S[key] = top.length === 1 ? { pid: top[0], n: max } : null; }
    if (S[key]?.pid !== before) { if (S[key]) { log(`🏆 ${label}: ${nm(S[key].pid)} (+2 GYP)`); toast(`🏆 ${label}: ${nm(S[key].pid)}!`); } else if (before) log(`${label}: senkié`); }
  }
  const updateLongest = () => award('longest', Object.fromEntries(S.players.map(p => [p.id, R.longest(S, p.id)])), R.LONGEST_MIN, 'Leghosszabb hálózat');
  const updateSafety = () => award('safety', Object.fromEntries(S.players.map(p => [p.id, p.stats.ok.IV])), R.SAFETY_MIN, 'Biztonsági bajnok');

  function drawCard(p) {
    const t = S.deck.pop(); if (!t) return null;
    p.cards.push({ id: newId(), t });
    toast(`🃏 Új kártya: ${R.CARDS[t].icon} ${R.CARDS[t].name}`, p.id);
    return t;
  }
  function checkWin() {
    const p = cur(); if (!p || S.phase !== 'play') return false;
    if (R.vp(S, p) >= S.vpTarget) { finish(p.id); return true; }
    return false;
  }

  // ---------- match ----------
  function startMatch(vpTarget) {
    runId++;
    Object.keys(prompts).forEach(k => delete prompts[k]);
    collector = null;
    const keep = S.players;
    Object.assign(S, fresh(S.code), { players: keep, vpTarget: [6, 8, 10, 12].includes(+vpTarget) ? +vpTarget : S.vpTarget || 10 });
    for (const p of keep) Object.assign(p, { res: { ...R.START_RES }, cards: [], free: 0, tesla: false, stats: { ok: zero(), n: zero(), cables: 0, built: 0 } });
    S.deck = R.shuffle(Object.entries(R.DECK).flatMap(([t, n]) => Array(n).fill(t)));
    S.order = R.shuffle(keep.map(p => p.id));
    S.phase = 'setup';
    S.setup = { seq: [...S.order, ...[...S.order].reverse()], i: 0, deadline: now() + SETUP_MS };
    log('🎬 Indul a meccs! Kígyó-draft: előbb a transzformátorok, aztán visszafelé egy-egy ingyen kábel.');
    feri(null, 'intro', 1);
    push();
  }
  function setupPlace(pid, m, auto) {
    const st = S.setup; if (!st || st.seq[st.i] !== pid) return;
    const kind = st.i < S.order.length ? 'trafo' : 'cable';
    if (kind === 'trafo') {
      const legal = R.legalTrafo(S); const n = auto ? rnd(legal) : +m.n; if (!legal.includes(n)) return;
      S.nodes[n] = { pid, kind: 'trafo' }; log(`🗼 ${nm(pid)} lerakta a transzformátorát.`); fx({ kind: 'node', n });
    } else {
      const legal = R.legalSetupCable(S, pid); const e = auto ? rnd(legal) : +m.e;
      if (legal.includes(e)) { S.edges[e] = pid; byId(pid).stats.cables++; log(`〰️ ${nm(pid)} kihúzta az első kábelét.`); fx({ kind: 'edge', e }); }
      else if (!auto) return;
    }
    st.i++; st.deadline = now() + SETUP_MS;
    if (st.i >= st.seq.length) { S.setup = null; S.phase = 'play'; log('⚙️ Kész a draft – indul az építkezés!'); beginTurn(S.order[0]); return; }
    push();
  }
  function beginTurn(pid) {
    if (S.phase !== 'play') return;
    S.offer = null;
    S.turnNo++;
    const p = byId(pid);
    S.turn = { pid, stage: 'work', deadline: now() + WORK_MS, n: S.turnNo };
    if (!p.online) { S.turn.stage = 'skip'; const n = S.turnNo; log(`💤 ${p.name} nincs vonalban – kimarad.`); push(); return guard(wait(1500).then(() => { if (S.turnNo === n) nextTurn(); })); }
    // production: Üzem +1 ⏱️, Napelempark +1 🟠
    const prod = [];
    for (const b of S.blocks) if (b.o === pid && R.BUILD[b.t].prod) for (const [k, v] of Object.entries(R.BUILD[b.t].prod)) { p.res[k] += v; prod.push(R.RES[k].icon); }
    log(`▶️ ${S.turnNo}. kör: ${p.name}${prod.length ? ` (termelés: +${prod.join(' +')})` : ''}`);
    if (checkWin()) return;
    if (S.turnNo % 3 === 0) { guard(runEvent().then(() => { if (S.turn?.pid === pid && S.phase === 'play') { S.turn.stage = 'work'; S.turn.deadline = now() + WORK_MS; if (!checkWin()) push(); } })); return; }
    push();
  }
  function nextTurn() {
    if (S.phase !== 'play') return;
    const i = S.order.indexOf(S.turn?.pid);
    beginTurn(S.order[(i + 1) % S.order.length]);
  }
  function endTurn(pid) {
    if (S.turn?.pid !== pid || S.turn.stage !== 'main') return;
    if (S.offer) S.offer = null;
    nextTurn();
  }
  function startWork(pid, part, diff) {
    if (S.turn?.pid !== pid || S.turn.stage !== 'work' || !R.RK.includes(part)) return;
    S.turn.stage = 'question';
    guard(runQuestion({ kind: 'work', part, diff: diff === 'hard' ? 'hard' : 'easy', active: pid }).then(() => {
      if (S.turn?.pid !== pid) return;
      S.turn.stage = 'main'; S.turn.deadline = now() + MAIN_MS;
      if (!checkWin()) push();
    }));
  }

  // ---------- events ----------
  async function runEvent() {
    const id = runId;
    S.turn.stage = 'event';
    S.costUp = 0;
    if (!S.evDeck.length) S.evDeck = R.shuffle(Object.keys(R.EVENTS).flatMap(k => [k, k]));
    const type = S.evDeck.pop(), E = R.EVENTS[type];
    S.event = { type, stage: 'show', text: E.tip };
    log(`${E.icon} Esemény: ${E.name}`);
    feri(`Esemény! ${E.name}! ${E.tip}`, type === 'hatosag' ? 'book' : null, type === 'hatosag' ? 0 : null);
    push();
    await wait(3800, id);
    if (type === 'villam') {
      const d = Math.floor(Math.random() * 4);
      S.event.district = d; S.event.text = `A villám a ${R.DISTRICTS[d]} kerületbe csapott!`;
      fx({ kind: 'villam', d });
      push();
      await wait(1600, id);
      const jobs = [];
      for (const p of S.players) {
        const mine = R.ownEdges(S, p.id).filter(e => R.edgeDistrict(e) === d);
        if (!mine.length) continue;
        if (Object.entries(S.nodes).some(([n, v]) => v.pid === p.id && v.kind === 'eloszto' && R.nodeDistrict(+n) === d)) { log(`🛡 ${p.name} hálózatát megvédte az Elosztó.`); continue; }
        const card = p.cards.findIndex(c => c.t === 'levezeto');
        if (card >= 0) { p.cards.splice(card, 1); log(`🔰 ${p.name} levezetője elnyelte a villámot.`); continue; }
        jobs.push(ask(p.id, { kind: 'loseCable', edges: mine, text: 'Villámcsapás! Melyik kábelszakaszod égjen le? Koppints rá a térképen.' }, rnd(mine)).then(e => {
          const pick = mine.includes(+e) ? +e : rnd(mine);
          delete S.edges[pick]; p.stats.cables--; log(`🔥 ${p.name} elvesztett egy kábelszakaszt.`); fx({ kind: 'burn', e: pick }); push();
        }));
      }
      push();
      await Promise.all(jobs);
      updateLongest();
    } else if (type === 'hatosag') {
      S.event.stage = 'q';
      const { wrong } = await runQuestion({ kind: 'inspect', part: 'IV', diff: 'easy' });
      const jobs = [];
      for (const pid of wrong) {
        const p = byId(pid), has = R.RK.filter(k => p.res[k] > 0);
        if (!has.length) continue;
        jobs.push(ask(pid, { kind: 'pay', options: has, text: 'Bírság! Melyik nyersanyaggal fizetsz?' }, rnd(has)).then(r => {
          const k = has.includes(r) ? r : rnd(has); p.res[k]--; log(`💸 ${p.name} bírságot fizetett: 1${R.RES[k].icon}`); push();
        }));
      }
      S.event.stage = 'pay'; S.event.text = wrong.length ? 'Aki hibázott, 1 nyersanyag bírságot fizet.' : 'Mindenki átment az ellenőrzésen!';
      push();
      await Promise.all(jobs);
    } else if (type === 'rezar') {
      S.costUp = 1; S.event.text = `Mostantól a kábel ára: ${R.costStr(R.cableCost(S))} (a következő eseményig).`;
    } else if (type === 'napos') {
      const got = [];
      for (const b of S.blocks) if (b.t === 'napelem' && b.o) { byId(b.o).res.III += 2; got.push(nm(b.o)); }
      S.event.text = got.length ? `+2 🟠: ${got.join(', ')}` : 'Senkinek nincs még Napelemparkja – kár a napsütésért!';
      log(`🌞 ${S.event.text}`);
    } else if (type === 'kolcson') {
      const vps = S.players.map(p => ({ p, v: R.vp(S, p, false) }));
      const max = Math.max(...vps.map(x => x.v)), min = Math.min(...vps.map(x => x.v));
      if (max === min) S.event.text = 'Mindenki fej-fej mellett áll – nincs kölcsön.';
      else {
        const taker = rnd(vps.filter(x => x.v === min)).p, leader = rnd(vps.filter(x => x.v === max)).p, has = R.RK.filter(k => leader.res[k] > 0);
        if (!has.length) S.event.text = `${leader.name} zsebei üresek – ${taker.name} nem talál semmit.`;
        else {
          S.event.text = `${taker.name} kölcsönkér ${leader.name} szerszámosládájából…`; push();
          const r = await ask(taker.id, { kind: 'take', options: has, from: leader.id, text: `Mit veszel el ${leader.name}-tól/-től?` }, rnd(has));
          const k = has.includes(r) ? r : rnd(has);
          leader.res[k]--; taker.res[k]++;
          S.event.text = `${taker.name} elvett 1${R.RES[k].icon}-t ${leader.name} készletéből.`; log(`🔧 ${S.event.text}`);
        }
      }
    }
    if (id !== runId) return;
    S.event.stage = 'done'; push();
    await wait(2600, id);
    S.event = null;
  }

  // ---------- actions ----------
  function act(pid, m) {
    const p = byId(pid); if (!p) return;
    const mine = S.turn?.pid === pid && S.phase === 'play';
    switch (m.a) {
      case 'place': return S.phase === 'setup' && setupPlace(pid, m);
      case 'work': return startWork(pid, m.part, m.diff);
      case 'answer':
        if (!S.q || S.q.reveal || answers[pid] || !collector?.ids.includes(pid) || !(m.i >= 0 && m.i < 4)) return;
        answers[pid] = { i: m.i, t: now() }; push(); return checkCollect();
      case 'choose': return resolvePrompt(pid, m.v), push();
      case 'end': return endTurn(pid);
      case 'start': if (pid === localPid && S.phase === 'lobby' && S.players.length >= 2) startMatch(m.vp); return;
      case 'rematch': if (pid === localPid && S.phase === 'over') startMatch(S.vpTarget); return;
      case 'vp': if (pid === localPid && S.phase === 'lobby' && [6, 8, 10, 12].includes(+m.vp)) { S.vpTarget = +m.vp; push(); } return;
      case 'kick': if (pid === localPid && S.phase === 'lobby' && m.id !== localPid) { S.players = S.players.filter(x => x.id !== m.id); push(); } return;
    }
    if (!mine) return;
    const stage = S.turn.stage;
    if (m.a === 'play') {
      if (stage !== 'work' && stage !== 'main') return;
      const i = p.cards.findIndex(c => c.id === m.id); if (i < 0) return;
      const c = p.cards[i], C = R.CARDS[c.t]; if (C.passive) return;
      if (c.t === 'lada') { const pick = (m.pick || []).filter(k => R.RK.includes(k)).slice(0, 2); if (pick.length !== 2) return; pick.forEach(k => p.res[k]++); log(`🧰 ${p.name} kinyitotta a szerszámládát: +${pick.map(k => R.RES[k].icon).join(' +')}`); }
      else if (c.t === 'engedely') { p.free += 2; log(`🚧 ${p.name} engedélyt kapott: 2 ingyen kábel.`); }
      else if (c.t === 'tesla') { p.tesla = true; log(`💡 ${p.name} Tesla-ötletet kapott: a következő munka dupla!`); feri(null, 'tesla_hi'); }
      p.cards.splice(i, 1);
      return push();
    }
    if (stage !== 'main') return;
    if (m.a === 'build') {
      if (m.what === 'cable') {
        const e = +m.e; if (!R.legalCables(S, pid).includes(e)) return;
        if (p.free > 0) p.free--; else { const cost = R.cableCost(S); if (!R.afford(p.res, cost)) return; R.pay(p.res, cost); }
        S.edges[e] = pid; p.stats.cables++; fx({ kind: 'edge', e }); log(`〰️ ${p.name} kábelt húzott.`);
        updateLongest();
      } else if (m.what === 'power') {
        const b = +m.b, B = R.BUILD[S.blocks[b]?.t]; if (!B || !R.legalPower(S, pid).includes(b) || !R.afford(p.res, B.cost)) return;
        R.pay(p.res, B.cost); S.blocks[b].o = pid; p.stats.built++; fx({ kind: 'block', b }); log(`💡 ${p.name} bekapcsolta: ${B.icon} ${B.name} (+${B.vp} GYP)`);
      } else if (m.what === 'eloszto') {
        const n = +m.n; if (!R.legalEloszto(S, pid).includes(n) || !R.afford(p.res, R.ELOSZTO_COST) || !R.RK.includes(m.res)) return;
        R.pay(p.res, R.ELOSZTO_COST); S.nodes[n] = { pid, kind: 'eloszto', res: m.res }; fx({ kind: 'node', n });
        log(`🔷 ${p.name} Elosztót épített (+1 GYP, 2:1 csere: ${R.RES[m.res].icon})`);
      } else if (m.what === 'card') {
        if (!S.deck.length || !R.afford(p.res, R.CARD_COST)) return;
        R.pay(p.res, R.CARD_COST); drawCard(p); log(`🃏 ${p.name} fejlesztőkártyát húzott.`);
      } else return;
      if (!checkWin()) push();
      return;
    }
    if (m.a === 'bank') {
      const r = R.ratios(S, pid)[m.give];
      if (!r || !R.RK.includes(m.get) || m.get === m.give || p.res[m.give] < r) return;
      p.res[m.give] -= r; p.res[m.get]++; log(`🏦 ${p.name} nagyker: ${r}${R.RES[m.give].icon} → 1${R.RES[m.get].icon}`);
      return push();
    }
    if (m.a === 'offer') {
      const clean = o => Object.fromEntries(R.RK.map(k => [k, Math.max(0, Math.min(9, +o?.[k] || 0))]).filter(([, v]) => v));
      const give = clean(m.give), get = clean(m.get);
      if (!Object.keys(give).length || !Object.keys(get).length || !R.afford(p.res, give)) return;
      S.offer = { id: ++uid, from: pid, give, get, declined: [] };
      log(`🤝 ${p.name} ajánlata: ${R.costStr(give)} → ${R.costStr(get)}`);
      return push();
    }
    if (m.a === 'offerCancel') { S.offer = null; return push(); }
  }
  function tradeReply(pid, m) {
    const o = S.offer; if (!o || o.id !== m.id || pid === o.from) return;
    if (m.a === 'decline') {
      if (!o.declined.includes(pid)) o.declined.push(pid);
      if (online().filter(p => p.id !== o.from).every(p => o.declined.includes(p.id))) { S.offer = null; toast('Senki sem fogadta el az ajánlatot.', o.from); }
      return push();
    }
    const a = byId(o.from), b = byId(pid);
    if (!R.afford(a.res, o.give) || !R.afford(b.res, o.get)) return;
    R.pay(a.res, o.give); R.pay(b.res, o.get);
    for (const [k, v] of Object.entries(o.give)) b.res[k] += v;
    for (const [k, v] of Object.entries(o.get)) a.res[k] += v;
    log(`✅ Üzlet: ${a.name} ⇄ ${b.name} (${R.costStr(o.give)} ↔ ${R.costStr(o.get)})`);
    toast(`🤝 ${b.name} elfogadta az ajánlatodat!`, a.id);
    S.offer = null;
    push();
  }

  function finish(pid) {
    runId++;
    collector = null; Object.keys(prompts).forEach(k => delete prompts[k]); S.prompts = {};
    S.phase = 'over'; S.offer = null; S.q = null; S.event = null;
    const rank = [...S.players].sort((a, b) => R.vp(S, b) - R.vp(S, a) || (b.id === pid) - (a.id === pid));
    S.podium = { winner: pid, rank: rank.map(p => ({ id: p.id, vp: R.vp(S, p), mester: p.cards.filter(c => c.t === 'mester').length,
      blocks: S.blocks.filter(b => b.o === p.id).map(b => b.t), len: R.longest(S, p.id), ok: p.stats.ok, n: p.stats.n })) };
    log(`🏁 ${nm(pid)} nyert ${R.vp(S, byId(pid))} győzelmi ponttal!`);
    feri(`${nm(pid)} nyert! Kigyulladt az egész város!`, 'win', 0);
    push();
    setTimeout(() => { if (S.phase === 'over') { feri(null, 'over'); push(); } }, 9000);
  }

  // ---------- connections ----------
  function handle(cid, m) {
    if (cid !== 'local') seen[cid] = now();
    if (m.type === 'hello') return net.send(cid, { type: 'hi' });
    if (m.type === 'ping') return;
    if (m.type === 'watch') { spect.add(cid); return net.send(cid, { type: 'state', s: pubFor(null) }); }
    if (m.type === 'join') return join(cid, m);
    const pid = cid === 'local' ? localPid : conns.get(cid);
    const p = pid && byId(pid); if (!p) return;
    if (p.cid !== cid && cid !== 'local') return; // stale connection
    if (m.type === 'act') { if (m.a === 'accept' || m.a === 'decline') return tradeReply(pid, m); return act(pid, m); }
  }
  function join(cid, m) {
    let p = S.players.find(x => x.token && x.token === m.token);
    if (!p) p = S.players.find(x => !x.online && !x.isLocal && x.name.toLowerCase() === String(m.name || '').toLowerCase());
    if (!p) {
      if (S.players.length >= 5) return net.send(cid, { type: 'full' });
      if (S.phase !== 'lobby') return net.send(cid, { type: 'started' });
      p = newPlayer(m, false); S.players.push(p); log(`👋 ${p.name} csatlakozott.`);
    } else { if (!p.online) log(`🔌 ${p.name} visszajött.`); Object.assign(p, { name: String(m.name || p.name).slice(0, 16), avatar: m.avatar || p.avatar, color: m.color || p.color, token: m.token || p.token }); }
    if (S.players.some(x => x !== p && x.color === p.color)) p.color = R.COLORS.find(c => !S.players.some(x => x.color === c)) || p.color;
    p.online = true; p.cid = cid; p.offSince = 0; conns.set(cid, p.id);
    net.send(cid, { type: 'joined', pid: p.id });
    push();
  }
  function drop(cid) {
    spect.delete(cid);
    const pid = conns.get(cid); conns.delete(cid);
    const p = pid && byId(pid);
    if (p && p.cid === cid && p.online) { p.online = false; p.offSince = now(); log(`📴 ${p.name} kiesett a hálózatból.`); if (prompts[pid]) resolvePrompt(pid); checkCollect(); push(); }
  }
  function tick() {
    if (!S) return;
    const t = now();
    for (const cid of [...conns.keys(), ...spect]) { net.send(cid, { type: 'ping' }); if (t - (seen[cid] || t) > 9000) drop(cid); }
    if (S.phase === 'setup' && S.setup && t > S.setup.deadline) setupPlace(S.setup.seq[S.setup.i], {}, true);
    for (const [pid, pr] of Object.entries(S.prompts)) if (t > pr.deadline) { resolvePrompt(pid); push(); }
    if (S.phase === 'setup' && S.setup) { const p = byId(S.setup.seq[S.setup.i]); if (p && !p.online && t - p.offSince > 5000) setupPlace(p.id, {}, true); }
    if (S.phase === 'play' && S.turn) {
      const p = cur();
      if (S.turn.stage === 'work' && (t > S.turn.deadline || (!p.online && t - p.offSince > 8000))) {
        if (!p.online) { log(`💤 ${p.name} nincs vonalban – kimarad.`); nextTurn(); }
        else { const k = rnd(R.RK); log(`⏰ ${p.name} nem választott – kap egy könnyű kérdést (${R.RES[k].icon} ${R.RES[k].name}).`); startWork(p.id, k, 'easy'); }
      } else if (S.turn.stage === 'main' && (t > S.turn.deadline || (!p.online && t - p.offSince > 8000))) { log(`⏰ Lejárt ${p.name} ideje.`); S.turn.stage = 'main'; endTurn(p.id); }
    }
  }

  // ---------- public ----------
  async function open(code, me, render, resumeState) {
    onLocal = render;
    S = resumeState?.S || fresh(code);
    localPid = resumeState?.localPid || null;
    net = await Net.host(S.code, { open: cid => { seen[cid] = now(); }, msg: handle, close: drop });
    if (resumeState) {
      for (const p of S.players) if (!p.isLocal) { p.online = false; p.cid = null; p.offSince = now(); }
      S.q = null; S.event = null; S.offer = null; S.prompts = {};
      if (S.turn && S.turn.stage !== 'main') { S.turn.stage = 'work'; }
      if (S.turn) S.turn.deadline = now() + MAIN_MS;
      if (S.setup) S.setup.deadline = now() + SETUP_MS;
      log('🔄 A tábla újraindult – a játékosok visszacsatlakozhatnak.');
    } else {
      const p = newPlayer(me, true); S.players.push(p); localPid = p.id;
    }
    const lp = byId(localPid); if (lp) { lp.online = true; Object.assign(lp, { name: me.name || lp.name, avatar: me.avatar || lp.avatar, color: me.color || lp.color }); }
    clearInterval(tickT); tickT = setInterval(tick, 1000);
    push(); persist();
    return S.code;
  }
  function saved() {
    try { const d = JSON.parse(localStorage.getItem(SAVE_KEY)); return d && now() - d.at < 6 * 3600e3 && d.S?.v === 2 ? d : null; } catch { return null; }
  }
  return {
    open, saved, send: m => handle('local', m),
    forget() { try { localStorage.removeItem(SAVE_KEY); sessionStorage.removeItem('vlab.party.hosting'); } catch { /* ignore */ } },
    get state() { return S; }, // for tests/debugging
  };
})();
