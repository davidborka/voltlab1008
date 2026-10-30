'use strict';
// Client UI: renders a sanitised state (from the host) and sends actions. The same code runs on every phone,
// on the host phone (send() goes straight into the engine) and on the optional big-screen board (?board=CODE).
const UI = (() => {
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const G = 100, M = 34, SIZE = M * 2 + G * 6; // map geometry (viewBox units)
  const P = n => { const [x, y] = R.xy(n); return [M + x * G, M + y * G]; };
  const L = 'ABCD';
  let root, send, role, S = null, prev = null, me = null;
  const U = { mode: null, sheet: null, trade: { give: {}, get: {} }, bankGive: null, bankGet: null, eloNode: null, lada: null, ladaPick: [], workPart: null, lastLine: 0, lastToast: 0, lastFx: 0, newAt: {}, picked: null, dismissed: {} };

  // ---------- mount ----------
  function mount(el, opts) {
    root = el; send = opts.send; role = opts.role;
    root.className = `hx role-${role}`;
    root.innerHTML = `
      <header class="hx-top"><span class="hx-logo">⚡ <b>Hálózatépítők</b></span><span class="hx-code" title="Szobakód"></span>
        <span class="hx-sp"></span><button class="hx-ib" data-ui="log" title="Napló">📜</button><button class="hx-ib" data-ui="help" title="Szabályok">❔</button><button class="hx-ib" data-ui="mute" title="Hang">${SFX.muted ? '🔇' : '🔊'}</button></header>
      <div class="hx-body">
        <div class="hx-left"><div class="hx-players"></div><div class="hx-mapwrap"><svg class="hx-map" viewBox="0 0 ${SIZE} ${SIZE}"></svg><div class="hx-fxl"></div></div><div class="hx-mapnote" hidden></div><div class="hx-ticker" data-ui="log"></div></div>
        <div class="hx-right"><div class="hx-status"></div><div class="hx-hand"></div><div class="hx-actions"></div></div>
      </div>
      <div class="hx-sheet" hidden></div><div class="hx-line" hidden></div><div class="hx-toast" hidden></div><div class="hx-float"></div><div class="hx-over" hidden></div>`;
    root.addEventListener('click', onClick);
    root.addEventListener('input', onInput);
    setInterval(timers, 250);
  }
  const mine = () => S && me && S.turn?.pid === me.id && S.phase === 'play';
  const player = id => S.players.find(p => p.id === id);
  const pname = id => esc(player(id)?.name || '?');
  const chip = (p, cls = '') => p ? `<span class="hx-av ${cls}" style="--c:${p.color}">${p.avatar}</span>` : '';
  const resIcons = o => Object.entries(o || {}).map(([k, v]) => `${v}${R.RES[k].icon}`).join(' ');
  const timer = (left, dur, cls = '') => `<span class="hx-timer ${cls}" data-end="${Date.now() + left}" data-dur="${dur}"><i></i><b></b></span>`;

  // ---------- render ----------
  function render(s) {
    prev = S; S = s; me = s.me;
    sounds();
    root.classList.toggle('my-turn', !!mine());
    root.classList.toggle('is-lobby', s.phase === 'lobby');
    $('.hx-code', root).textContent = s.code;
    if (s.phase === 'lobby') { U.mode = null; renderLobby(); return; }
    $('.hx-over', root).hidden = true;
    if (!mine() || S.turn?.stage !== 'main') { if (U.mode && !(S.phase === 'setup')) U.mode = null; if (['build', 'trade', 'lada', 'eloRes'].includes(U.sheet)) U.sheet = null; }
    renderPlayers(); renderMap(); renderTicker(); renderStatus(); renderHand(); renderActions(); renderSheet(); renderLine(); renderToast(); renderFx();
  }

  function renderPlayers() {
    const order = S.order.length ? S.order : S.players.map(p => p.id);
    $('.hx-players', root).innerHTML = order.map(id => player(id)).filter(Boolean).map(p => `
      <div class="hx-pl ${S.turn?.pid === p.id ? 'act' : ''} ${p.online ? '' : 'off'} ${me?.id === p.id ? 'me' : ''}" style="--c:${p.color}">
        ${chip(p)}<span class="nm">${esc(p.name)}</span>
        <span class="vp">⭐${p.vp}</span><span class="sm">🎒${p.resN} 🃏${p.cardsN}${S.longest?.pid === p.id ? ' 🏆' : ''}${S.safety?.pid === p.id ? ' 🦺' : ''}</span><i class="dot"></i></div>`).join('');
  }

  // legal targets for the current mode / prompt / setup step
  function targets() {
    const t = { e: [], b: [], n: [], cls: 'legal' };
    if (!me) return t;
    if (S.prompt?.kind === 'loseCable') return { e: S.prompt.edges, b: [], n: [], cls: 'lose' };
    if (S.phase === 'setup' && S.setup?.pid === me.id) {
      if (S.setup.kind === 'trafo') t.n = R.legalTrafo(S); else t.e = R.legalSetupCable(S, me.id);
      return t;
    }
    if (!mine() || S.turn.stage !== 'main') return t;
    if (U.mode === 'cable') t.e = R.legalCables(S, me.id);
    if (U.mode === 'power') t.b = R.legalPower(S, me.id).filter(b => R.afford(me.res, R.BUILD[S.blocks[b].t].cost));
    if (U.mode === 'eloszto') t.n = R.legalEloszto(S, me.id);
    return t;
  }
  function isNew(key) {
    const t = U.newAt[key]; if (!t) return '';
    const el = Date.now() - t; if (el > 1400) { delete U.newAt[key]; return ''; }
    return ` new" style="animation-delay:-${el}ms`;
  }
  function renderMap() {
    if (prev && prev.blocks !== S.blocks) {
      for (const [e, pid] of Object.entries(S.edges)) if (prev.edges?.[e] !== pid) U.newAt['e' + e] = Date.now();
      S.blocks.forEach((b, i) => { if (b.o && prev.blocks?.[i]?.o !== b.o) U.newAt['b' + i] = Date.now(); });
      for (const n of Object.keys(S.nodes)) if (!prev.nodes?.[n]) U.newAt['n' + n] = Date.now();
    }
    const tg = targets(), col = id => player(id)?.color || '#888';
    let h = `<defs><filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`;
    h += `<rect class="hx-ground" x="0" y="0" width="${SIZE}" height="${SIZE}" rx="18"/>`;
    const mid = M + 3 * G;
    h += `<line class="hx-dist" x1="${mid}" y1="6" x2="${mid}" y2="${SIZE - 6}"/><line class="hx-dist" x1="6" y1="${mid}" x2="${SIZE - 6}" y2="${mid}"/>`;
    // blocks
    S.blocks.forEach((b, i) => {
      const bx = i % 6, by = Math.floor(i / 6), x = M + bx * G + 12, y = M + by * G + 12, B = R.BUILD[b.t];
      const legal = tg.b.includes(i);
      h += `<g class="hx-block ${b.t || 'park'} ${b.o ? 'owned' : ''} ${legal ? 'legal' : ''}${isNew('b' + i)}" data-b="${i}" style="--c:${b.o ? col(b.o) : '#3a4558'}">
        <rect x="${x}" y="${y}" width="${G - 24}" height="${G - 24}" rx="12"/>
        <text x="${x + (G - 24) / 2}" y="${y + (G - 24) / 2 + 2}" class="ic">${B ? B.icon : (i % 3 ? '🌳' : '⛲')}</text>
        ${B ? `<text x="${x + G - 30}" y="${y + G - 30}" class="vpb">${B.vp}</text>` : ''}</g>`;
    });
    // streets + cables
    R.EDGES.forEach(([a, b], e) => {
      const [x1, y1] = P(a), [x2, y2] = P(b), o = S.edges[e];
      if (o != null) h += `<line class="hx-cable${isNew('e' + e)}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="--c:${col(o)}"/>`;
      else h += `<line class="hx-street" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
      if (tg.e.includes(e)) h += `<line class="hx-tgt ${tg.cls}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/><line class="hx-hit" data-e="${e}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
    });
    // intersections
    for (let n = 0; n < 49; n++) {
      const [x, y] = P(n), v = S.nodes[n];
      if (v?.kind === 'trafo') h += `<g class="hx-trafo${isNew('n' + n)}" style="--c:${col(v.pid)}"><rect x="${x - 17}" y="${y - 17}" width="34" height="34" rx="7"/><text x="${x}" y="${y + 1}">⚡</text></g>`;
      else if (v?.kind === 'eloszto') h += `<g class="hx-elo${isNew('n' + n)}" style="--c:${col(v.pid)}"><rect x="${x - 14}" y="${y - 14}" width="28" height="28" rx="5" transform="rotate(45 ${x} ${y})"/><text x="${x}" y="${y + 1}">${R.RES[v.res]?.icon || ''}</text></g>`;
      else h += `<circle class="hx-node" cx="${x}" cy="${y}" r="4.5"/>`;
      if (tg.n.includes(n)) h += `<circle class="hx-ntgt" cx="${x}" cy="${y}" r="17" data-n="${n}"/>`;
    }
    $('.hx-map', root).innerHTML = h;
    const note = $('.hx-mapnote', root);
    const msg = S.prompt?.kind === 'loseCable' ? '🔥 Koppints egy piros kábelre – az ég le.'
      : S.phase === 'setup' && S.setup?.pid === me?.id ? (S.setup.kind === 'trafo' ? '🗼 Tedd le a transzformátorod egy kiemelt szélső kereszteződésre!' : '〰️ Húzd ki az első, ingyenes kábeledet a transzformátorodtól!')
      : U.mode === 'cable' ? `〰️ Koppints egy kiemelt szakaszra (${me.free ? `${me.free} ingyenes` : R.costStr(R.cableCost(S))})` + (tg.e.length ? '' : ' – nincs szabad szakasz')
      : U.mode === 'power' ? (tg.b.length ? '💡 Koppints egy kiemelt épületre a bekapcsoláshoz' : '💡 Nincs bekapcsolható épület (kapcsolat vagy nyersanyag hiányzik)')
      : U.mode === 'eloszto' ? '🔷 Koppints egy kereszteződésre a hálózatodon' : '';
    note.innerHTML = msg ? `<span>${msg}</span>${U.mode ? '<button class="hx-btn sm" data-ui="mode-off">Kész</button>' : ''}` : '';
    note.hidden = !msg;
    $('.hx-ticker', root).hidden = !!msg;
  }
  function renderTicker() {
    const last = S.log[S.log.length - 1];
    $('.hx-ticker', root).innerHTML = last ? `<span>${esc(last.text)}</span>` : '';
  }
  function renderStatus() {
    const el = $('.hx-status', root);
    if (S.phase === 'setup') {
      const p = player(S.setup.pid);
      el.innerHTML = `<div class="hx-turn">${chip(p)}<div><b>${p?.id === me?.id ? 'Te jössz!' : esc(p?.name) + ' választ'}</b><small>Draft ${S.setup.step + 1}/${S.setup.total}: ${S.setup.kind === 'trafo' ? 'transzformátor' : 'első kábel'}</small></div>${timer(S.setup.left, 45000)}</div>`;
      return;
    }
    if (S.phase !== 'play' || !S.turn) { el.innerHTML = ''; return; }
    const p = player(S.turn.pid), st = S.turn.stage;
    const what = { work: 'munkát választ', question: 'kérdésre válaszol', main: 'kereskedik és épít', event: 'esemény!', skip: 'kimarad' }[st] || '';
    el.innerHTML = `<div class="hx-turn">${chip(p)}<div><b>${mine() ? 'A te köröd!' : esc(p?.name) + ' köre'}</b><small>${S.turnNo}. kör · ${mine() ? { work: 'válassz munkát', main: 'kereskedj, építs, aztán kör vége', question: 'válaszolj!', event: 'esemény', skip: '' }[st] : what}${S.costUp ? ' · 📉 drága réz' : ''} · cél ${S.vpTarget} ⭐</small></div>${['work', 'main'].includes(st) ? timer(S.turn.left, st === 'work' ? 40000 : 90000) : ''}</div>`;
  }
  function renderHand() {
    const el = $('.hx-hand', root);
    if (!me) { el.innerHTML = role === 'board' ? `<div class="hx-log board">${[...S.log].reverse().slice(0, 14).map(l => `<p>${esc(l.text)}</p>`).join('')}</div>` : ''; return; }
    const r = me.ratios;
    el.innerHTML = `<div class="hx-res">${R.RK.map(k => `<div class="hx-r" data-r="${k}"><span class="i">${R.RES[k].icon}</span><b>${me.res[k]}</b><small>${R.RES[k].name}${r[k] === 2 ? ' · 2:1' : ''}</small></div>`).join('')}</div>
      <div class="hx-extra">${me.free ? `<span>🚧 ${me.free} ingyen kábel</span>` : ''}${me.tesla ? '<span>💡 dupla munka</span>' : ''}<span>⭐ ${player(me.id)?.vp ?? 0} / ${S.vpTarget}</span></div>`;
    // fly-ins for gains
    const was = prev?.me?.res;
    if (was && prev.phase !== 'lobby') for (const k of R.RK) if (me.res[k] > was[k]) flyIn(k, `+${me.res[k] - was[k]}`);
  }
  function flyIn(k, text) {
    const tile = $(`.hx-r[data-r="${k}"]`, root); if (!tile) return;
    const r = tile.getBoundingClientRect(), f = document.createElement('div');
    f.className = 'hx-fly'; f.textContent = `${text} ${R.RES[k].icon}`; f.style.left = r.left + r.width / 2 + 'px'; f.style.top = r.top + 'px';
    $('.hx-float', root).append(f); setTimeout(() => f.remove(), 1600);
    tile.classList.remove('bump'); void tile.offsetWidth; tile.classList.add('bump');
  }
  function renderActions() {
    const el = $('.hx-actions', root);
    if (!me) { el.innerHTML = ''; return; }
    const main = mine() && S.turn.stage === 'main';
    const cards = me.cards.length;
    el.innerHTML = `
      <button class="hx-btn ${U.sheet === 'build' || U.mode ? 'on' : ''}" data-ui="build" ${main ? '' : 'disabled'}>🔨<span>Építés</span></button>
      <button class="hx-btn ${U.sheet === 'trade' ? 'on' : ''}" data-ui="trade" ${main ? '' : 'disabled'}>🤝<span>Csere</span></button>
      <button class="hx-btn ${U.sheet === 'cards' ? 'on' : ''}" data-ui="cards">🃏<span>Kártyák${cards ? ` (${cards})` : ''}</span></button>
      <button class="hx-btn primary" data-act="end" ${main ? '' : 'disabled'}>⏭<span>Kör vége</span></button>`;
  }

  // ---------- sheets ----------
  function renderSheet() {
    const el = $('.hx-sheet', root);
    let html = '', cls = '';
    const offer = S.offer && me && S.offer.from !== me.id && !S.offer.declined.includes(me.id) && U.dismissed.offer !== S.offer.id;
    if (S.phase === 'over') { html = podium(); cls = 'full'; }
    else if (S.q) { html = question(); cls = 'tall'; }
    else if (S.prompt) { html = prompt(); cls = S.prompt.kind === 'loseCable' ? 'peek' : ''; }
    else if (S.event) { html = eventCard(); cls = 'event'; }
    else if (offer) html = offerIn();
    else if (mine() && S.turn.stage === 'work' && U.sheet !== 'cards') html = workSheet();
    else if (U.sheet === 'build' && mine()) html = buildSheet();
    else if (U.sheet === 'trade' && mine()) html = tradeSheet();
    else if (U.sheet === 'cards') html = cardsSheet();
    else if (U.sheet === 'lada') html = ladaSheet();
    else if (U.sheet === 'eloRes') html = eloSheet();
    else if (U.sheet === 'log') html = logSheet();
    else if (U.sheet === 'help') html = helpSheet();
    el.hidden = !html;
    el.className = `hx-sheet ${cls}`;
    const key = (S.q ? 'q' + S.q.qid + (S.q.reveal ? 'r' : '') : '') + (S.event ? 'ev' + S.event.type + S.event.stage : '') + (U.sheet || '') + cls + (html ? 1 : 0);
    const changed = el.dataset.key !== key, top = el.firstElementChild?.scrollTop || 0;
    if (changed) { el.dataset.key = key; if (!S.q?.reveal) { el.classList.add('enter'); setTimeout(() => el.classList.remove('enter'), 450); } }
    el.innerHTML = html ? `<div class="hx-card">${html}</div>` : '';
    const card = el.firstElementChild;
    if (card && !changed) card.scrollTop = top;
    if (card && changed && S.q?.reveal) setTimeout(() => card.isConnected && card.scrollTo({ top: card.scrollHeight, behavior: REDUCED ? 'auto' : 'smooth' }), 1300);
  }
  const close = '<button class="hx-x" data-ui="close" aria-label="Bezárás">✕</button>';

  function question() {
    const q = S.q, rv = q.reveal, active = player(q.active), canAnswer = me && !rv && !q.answered.includes(me.id) && player(me.id)?.online;
    const myPick = rv ? rv.picks[me?.id] : (q.answered.includes(me?.id) ? U.picked?.[q.qid] : null);
    const head = q.kind === 'work'
      ? `🔧 Munkavégzés · ${R.RES[q.part].icon} ${esc(R.RES[q.part].part)} · ${q.diff === 'hard' ? 'Nehéz' : 'Könnyű'}`
      : `🧑‍🔧 Hatósági ellenőrzés · mindenki válaszol`;
    const who = q.kind === 'work' ? (me && q.active === me.id ? `<b>A te kérdésed!</b> Jó válasz: +${q.diff === 'hard' ? 2 : 1}${R.RES[q.part].icon}${me.tesla ? ' ×2 💡' : ''}`
      : `${chip(active)} <b>${esc(active?.name)}</b> kérdése – ha hibázik, a te jó válaszod +1${R.RES[q.part].icon}`) : 'Jó válasz: +1 🛡️, rossz: 1 nyersanyag bírság';
    const opts = q.opts.map((o, i) => {
      const pickers = rv ? S.players.filter(p => rv.picks[p.id] === i) : [];
      const st = rv ? (i === rv.correct ? 'ok' : myPick === i ? 'bad' : 'dim') : myPick === i ? 'sel' : '';
      return `<button class="hx-opt ${st}" data-ans="${i}" ${canAnswer ? '' : 'disabled'}><b>${L[i]}</b><span>${o}</span><em>${pickers.map((p, k) => `<span class="hx-av sm pop" style="--c:${p.color};animation-delay:${k * 0.12 + 0.2}s">${p.avatar}</span>`).join('')}</em></button>`;
    }).join('');
    let foot = '';
    if (!rv) foot = `<div class="hx-answered">${S.players.filter(p => p.online).map(p => `<span class="hx-av sm ${q.answered.includes(p.id) ? 'done' : 'wait'}" style="--c:${p.color}" title="${esc(p.name)}">${p.avatar}</span>`).join('')}<small>${me && q.answered.includes(me.id) ? 'Beküldve ✓ – várjuk a többieket' : role === 'board' ? 'Válaszok a telefonokon…' : 'Koppints a válaszodra!'}</small></div>`;
    else {
      const g = rv.gains.length ? rv.gains.map(x => `<span class="hx-gain">${chip(player(x.pid), 'sm')} ${pname(x.pid)} +${x.n}${R.RES[x.r].icon}${x.help ? ' <small>besegített</small>' : ''}</span>`).join('') : '<span class="hx-gain none">Senki nem kapott nyersanyagot.</span>';
      foot = `<div class="hx-gains">${g}${rv.card ? '<span class="hx-gain">🃏 + fejlesztőkártya!</span>' : ''}</div><div class="hx-expl"><b>Magyarázat:</b> ${esc(rv.expl)}</div>`;
    }
    return `<div class="hx-qhead"><small>${head}</small>${rv ? '' : timer(q.left, q.dur, 'q')}</div><p class="hx-who">${who}</p><div class="hx-qtext">${q.text}</div><div class="hx-opts ${rv ? 'rv' : ''}">${opts}</div>${foot}`;
  }
  function workSheet() {
    const part = U.workPart;
    const cards = me.cards.filter(c => c.t === 'tesla');
    return `<h3>🔧 Munkavégzés</h3><p class="hx-sub">Válassz szakterületet: a jó válasz nyersanyagot hoz. ${me.tesla ? '<b>💡 Tesla-ötlet: most dupla!</b>' : ''}</p>
      <div class="hx-parts">${R.RK.map(k => `<button class="hx-part ${part === k ? 'on' : ''}" data-ui="part" data-k="${k}"><span class="i">${R.RES[k].icon}</span><b>${R.RES[k].name}</b><small>${esc(R.RES[k].part)}</small></button>`).join('')}</div>
      <div class="hx-diff">${part ? `<button class="hx-btn big" data-work="easy">Könnyű<small>+1 ${R.RES[part].icon}</small></button><button class="hx-btn big primary" data-work="hard">Nehéz<small>+2 ${R.RES[part].icon} + 🃏 esély</small></button>` : '<p class="hx-sub">↑ előbb válassz területet</p>'}</div>
      ${cards.length && !me.tesla ? `<button class="hx-btn ghost" data-play="${cards[0].id}">💡 Tesla-ötlet kijátszása (dupla munka)</button>` : ''}`;
  }
  function buildSheet() {
    const legalC = R.legalCables(S, me.id).length, legalP = R.legalPower(S, me.id), legalE = R.legalEloszto(S, me.id).length;
    const cc = R.cableCost(S), canC = legalC && (me.free || R.afford(me.res, cc));
    const affP = legalP.some(b => R.afford(me.res, R.BUILD[S.blocks[b].t].cost));
    const row = (ic, name, cost, ok, ui, note = '') => `<div class="hx-brow ${ok ? '' : 'no'}"><span class="i">${ic}</span><div><b>${name}</b><small>${cost}${note ? ' · ' + note : ''}</small></div><button class="hx-btn sm ${ok ? 'primary' : ''}" data-ui="${ui}" ${ok ? '' : 'disabled'}>${ui === 'buy' ? 'Húzok' : 'Hova?'}</button></div>`;
    return `${close}<h3>🔨 Építés</h3>
      ${row('〰️', 'Kábelszakasz', me.free ? `${me.free} ingyen (engedély)` : R.costStr(cc), canC, 'm-cable', legalC ? '' : 'nincs szabad szakasz')}
      ${row('💡', 'Épület bekapcsolása', 'lásd lent', affP, 'm-power', legalP.length ? `${legalP.length} elérhető` : 'nincs bekötött épület')}
      ${row('🔷', 'Elosztó (+1 ⭐, 2:1 csere)', R.costStr(R.ELOSZTO_COST), legalE && R.afford(me.res, R.ELOSZTO_COST), 'm-eloszto', `max ${R.MAX_ELOSZTO}`)}
      ${row('🃏', 'Fejlesztőkártya', R.costStr(R.CARD_COST), S.deckN && R.afford(me.res, R.CARD_COST), 'buy', `${S.deckN} a pakliban`)}
      <div class="hx-costs">${Object.values(R.BUILD).map(B => `<span>${B.icon} ${B.name} <b>${B.vp}⭐</b> ${R.costStr(B.cost)}${B.tip ? ` <i>${B.tip}</i>` : ''}</span>`).join('')}</div>`;
  }
  function stepper(side, k, max) {
    const v = U.trade[side][k] || 0;
    return `<div class="hx-step"><span>${R.RES[k].icon}</span><button data-step="${side}:${k}:-1" ${v ? '' : 'disabled'}>−</button><b>${v}</b><button data-step="${side}:${k}:1" ${v >= max ? 'disabled' : ''}>+</button></div>`;
  }
  function tradeSheet() {
    const o = S.offer;
    if (o && o.from === me.id) {
      const dec = o.declined.map(pname).join(', ');
      return `${close}<h3>🤝 Ajánlatod kint van</h3><p class="hx-big">Adsz: ${resIcons(o.give)} → Kérsz: ${resIcons(o.get)}</p><p class="hx-sub">${dec ? `Elutasította: ${dec}` : 'Várjuk a válaszokat…'}</p><button class="hx-btn" data-act="offerCancel">Visszavonás</button>`;
    }
    const r = me.ratios, g = U.bankGive, can = g && me.res[g] >= r[g] && U.bankGet && U.bankGet !== g;
    const okOffer = Object.values(U.trade.give).some(Boolean) && Object.values(U.trade.get).some(Boolean);
    return `${close}<h3>🤝 Csere</h3>
      <div class="hx-trade"><div><small>Adok</small>${R.RK.map(k => stepper('give', k, me.res[k])).join('')}</div><div><small>Kérek</small>${R.RK.map(k => stepper('get', k, 9)).join('')}</div></div>
      <button class="hx-btn primary wide" data-ui="offer" ${okOffer ? '' : 'disabled'}>Ajánlat mindenkinek</button>
      <h4>🏦 Nagyker</h4><p class="hx-sub">Adj be ${'3'} egyformát (Elosztóval 2-t) egy tetszőlegesért.</p>
      <div class="hx-bank"><div>${R.RK.map(k => `<button class="hx-chipbtn ${g === k ? 'on' : ''}" data-bank-give="${k}" ${me.res[k] >= r[k] ? '' : 'disabled'}>${r[k]}${R.RES[k].icon}</button>`).join('')}</div><span>→</span>
      <div>${R.RK.map(k => `<button class="hx-chipbtn ${U.bankGet === k ? 'on' : ''}" data-bank-get="${k}" ${k === g ? 'disabled' : ''}>1${R.RES[k].icon}</button>`).join('')}</div></div>
      <button class="hx-btn wide" data-ui="bank" ${can ? '' : 'disabled'}>Csere a nagykerrel</button>`;
  }
  function offerIn() {
    const o = S.offer, can = me && R.afford(me.res, o.get);
    return `<h3>🤝 ${pname(o.from)} ajánlata</h3><p class="hx-big">Ad: ${resIcons(o.give)}<br>Kér tőled: ${resIcons(o.get)}</p>
      <div class="hx-row"><button class="hx-btn primary big" data-act="accept" data-id="${o.id}" ${can ? '' : 'disabled'}>Elfogadom</button><button class="hx-btn big" data-act="decline" data-id="${o.id}">Nem kérem</button></div>${can ? '' : '<p class="hx-sub">Nincs elég nyersanyagod hozzá.</p>'}`;
  }
  function cardsSheet() {
    const can = mine() && ['work', 'main'].includes(S.turn.stage);
    const list = me?.cards.length ? me.cards.map(c => { const C = R.CARDS[c.t]; return `<div class="hx-brow"><span class="i">${C.icon}</span><div><b>${C.name}</b><small>${C.tip}</small></div>${C.passive ? '<em>passzív</em>' : `<button class="hx-btn sm primary" data-play="${c.id}" ${can ? '' : 'disabled'}>Kijátszom</button>`}</div>`; }).join('') : '<p class="hx-sub">Még nincs kártyád. Fejlesztőkártyát az Építés menüben húzhatsz, vagy Nehéz munkával nyerhetsz.</p>';
    return `${close}<h3>🃏 Kártyáid</h3>${list}${can ? '' : '<p class="hx-sub">Kártyát a saját körödben játszhatsz ki.</p>'}`;
  }
  function ladaSheet() {
    return `${close}<h3>🧰 Szerszámláda</h3><p class="hx-sub">Válassz 2 nyersanyagot (lehet kétszer ugyanaz).</p>
      <div class="hx-parts four">${R.RK.map(k => `<button class="hx-part" data-lada="${k}"><span class="i">${R.RES[k].icon}</span><b>${R.RES[k].name}</b></button>`).join('')}</div>
      <p class="hx-big">${U.ladaPick.map(k => R.RES[k].icon).join(' + ') || '…'}</p><button class="hx-btn primary wide" data-ui="lada-go" ${U.ladaPick.length === 2 ? '' : 'disabled'}>Kérem</button>`;
  }
  function eloSheet() {
    return `${close}<h3>🔷 Elosztó</h3><p class="hx-sub">Melyik nyersanyagot cserélheted ezentúl 2:1 arányban a nagykerben?</p>
      <div class="hx-parts four">${R.RK.map(k => `<button class="hx-part" data-elo="${k}"><span class="i">${R.RES[k].icon}</span><b>${R.RES[k].name}</b></button>`).join('')}</div>`;
  }
  function prompt() {
    const pr = S.prompt;
    if (pr.kind === 'loseCable') return `<div class="hx-qhead"><b>⚡ ${esc(pr.text)}</b>${timer(pr.left, 20000)}</div><button class="hx-btn" data-choose="${pr.edges[Math.floor(Math.random() * pr.edges.length)]}">Mindegy, válassz helyettem</button>`;
    return `<div class="hx-qhead"><b>${esc(pr.text)}</b>${timer(pr.left, 20000)}</div><div class="hx-parts four">${pr.options.map(k => `<button class="hx-part" data-choose="${k}"><span class="i">${R.RES[k].icon}</span><b>${R.RES[k].name}</b></button>`).join('')}</div>`;
  }
  function eventCard() {
    const E = R.EVENTS[S.event.type];
    return `<div class="hx-event ev-${S.event.type}"><div class="hx-evic">${E.icon}</div><small>Esemény</small><h2>${E.name}</h2><p>${esc(S.event.text)}</p></div>`;
  }
  function logSheet() { return `${close}<h3>📜 Napló</h3><div class="hx-log">${[...S.log].reverse().map(l => `<p>${esc(l.text)}</p>`).join('')}</div>`; }
  function helpSheet() { return `${close}<h3>❔ Szabályok röviden</h3>${rulesHtml()}`; }
  function podium() {
    const pd = S.podium, rows = pd.rank.map((r, i) => {
      const p = player(r.id);
      return `<div class="hx-pod p${i + 1}" style="--c:${p?.color};animation-delay:${0.3 + (pd.rank.length - i) * 0.35}s"><span class="pl">${['🥇', '🥈', '🥉'][i] || i + 1 + '.'}</span>${chip(p)}<div><b>${esc(p?.name)}</b><small>${r.blocks.map(t => R.BUILD[t].icon).join('') || 'nincs épület'}${r.mester ? ` · 📜×${r.mester}` : ''} · hálózat ${r.len}</small>
        <small>Jó válaszok: ${R.RK.map(k => `${R.RES[k].icon}${r.ok[k]}/${r.n[k]}`).join(' ')}</small></div><span class="vp">${r.vp}⭐</span></div>`;
    }).join('');
    return `<div class="hx-podium"><div class="hx-confetti">${Array.from({ length: 24 }, (_, i) => `<i style="--x:${(i * 37) % 100};--d:${(i % 7) * 0.3}s;--h:${(i * 47) % 360}"></i>`).join('')}</div>
      <small>Kigyulladt a város!</small><h2>${chip(player(pd.winner))} ${pname(pd.winner)} nyert!</h2>${rows}
      ${S.isHost ? '<button class="hx-btn primary big wide" data-act="rematch">🔁 Visszavágó</button>' : '<p class="hx-sub">A házigazda indíthat visszavágót.</p>'}</div>`;
  }
  function rulesHtml() {
    return `<ul class="hx-rules">
      <li><b>Cél:</b> elsőként ${S?.vpTarget || 10} győzelmi pont (⭐) a saját körödben.</li>
      <li><b>Kör:</b> 1) <b>Munkavégzés</b> – válassz szakterületet és nehézséget, válaszolj egy vizsgakérdésre. Jó válasz = nyersanyag. Ha a soros játékos hibázik, a többiek közül aki jól válaszolt, kap 1-et. 2) <b>Csere</b> – ajánlat a többieknek vagy nagyker 3:1. 3) <b>Építés</b>. 4) Kör vége.</li>
      <li><b>Nyersanyagok:</b> ${R.RK.map(k => `${R.RES[k].icon} ${R.RES[k].name} (${R.RES[k].part.split(' ')[0]})`).join(', ')}.</li>
      <li><b>Kábel</b> (${R.costStr(R.cableCost({}))}) csak a hálózatodhoz csatlakozva épülhet. Egy épület akkor köthető be, ha valamelyik sarka a hálózatodon van; bekapcsolva a tiéd: ${Object.values(R.BUILD).map(B => `${B.icon}${B.vp}⭐`).join(' ')}. Üzem +1 ⏱️, Napelempark +1 🟠 körönként.</li>
      <li><b>Elosztó:</b> +1 ⭐, egy üres szakaszt átugorhat a hálózatod, és egy nyersanyagot 2:1-ben cserélhetsz.</li>
      <li><b>Bónusz:</b> Leghosszabb hálózat (≥5 szakasz) +2 ⭐, Biztonsági bajnok (legtöbb jó IV. részes válasz, ≥3) +2 ⭐.</li>
      <li><b>Esemény</b> minden 3. körben: villámcsapás, hatósági ellenőrzés, rézár-emelkedés, napos nap, szerszámkölcsön.</li>
      <li>Ha egy telefon nem tud csatlakozni (egyes mobilhálózatok tiltják a közvetlen kapcsolatot), menjetek ugyanarra a Wi-Fi-re.</li></ul>`;
  }

  // ---------- lobby ----------
  function renderLobby() {
    const ov = $('.hx-over', root); ov.hidden = false;
    const url = joinUrl(S.code), host = S.isHost;
    let qr = '';
    try { const q = qrcode(0, 'M'); q.addData(url); q.make(); qr = q.createSvgTag({ cellSize: 5, margin: 2, scalable: true }); } catch { /* QR lib offline */ }
    ov.innerHTML = `<div class="hx-lobby"><div class="hx-brand"><span>⚡</span><div><h1>Hálózatépítők</h1><small>Villanyszerelők kábelezik a várost – a vizsgakérdések hajtják a gazdaságot.</small></div></div>
      <div class="hx-join">${qr ? `<div class="hx-qr">${qr}</div>` : ''}<div><small>Szobakód</small><div class="hx-bigcode">${esc(S.code)}</div><div class="hx-url">${esc(url)}</div>
      <div class="hx-row">${navigator.share ? '<button class="hx-btn sm" data-ui="share">Megosztás</button>' : ''}<button class="hx-btn sm" data-ui="copy">Link másolása</button></div></div></div>
      <h3>Játékosok (${S.players.length}/5)</h3><div class="hx-lpl">${S.players.map(p => `<div class="hx-lp ${p.online ? '' : 'off'}">${chip(p)}<b>${esc(p.name)}</b>${p.host ? '<small>házigazda</small>' : ''}<i class="dot"></i>${host && !p.host ? `<button class="hx-x sm" data-kick="${p.id}" aria-label="Eltávolítás">✕</button>` : ''}</div>`).join('')}</div>
      ${host ? `<div class="hx-seg"><span>Győzelemhez:</span>${[6, 8, 10, 12].map(v => `<button class="${S.vpTarget === v ? 'on' : ''}" data-vp="${v}">${v} ⭐</button>`).join('')}</div>
        <button class="hx-btn primary big wide" data-act="start" ${S.players.length >= 2 ? '' : 'disabled'}>${S.players.length >= 2 ? `Indítás (${S.players.length} játékos)` : 'Várunk legalább még 1 játékosra…'}</button>`
        : `<p class="hx-wait">Várjuk, hogy a házigazda elindítsa a játékot… (cél: ${S.vpTarget} ⭐)</p>`}
      <details><summary>Hogyan játszunk?</summary>${rulesHtml()}</details></div>`;
  }
  function joinUrl(code) { const u = new URL(location.href); u.hash = code; u.searchParams.delete('board'); return u.toString(); }

  // ---------- feri, toast, fx ----------
  function renderLine() {
    const el = $('.hx-line', root), l = S.line;
    if (!l || l.seq === U.lastLine) return;
    U.lastLine = l.seq;
    el.innerHTML = `<span class="hx-feri">🧑‍🔧</span><p><b>Fázis Feri:</b> ${esc(l.text)}</p>`;
    el.hidden = false; el.classList.remove('in'); void el.offsetWidth; el.classList.add('in');
    clearTimeout(el._t); el._t = setTimeout(() => { el.hidden = true; }, Math.min(9000, 2500 + l.text.length * 45));
  }
  function renderToast() {
    const el = $('.hx-toast', root), t = S.toast;
    if (!t || t.seq === U.lastToast) return;
    U.lastToast = t.seq; el.textContent = t.text; el.hidden = false; el.classList.remove('in'); void el.offsetWidth; el.classList.add('in');
    clearTimeout(el._t); el._t = setTimeout(() => { el.hidden = true; }, 3200);
  }
  function renderFx() {
    const f = S.fx; if (!f || f.seq === U.lastFx) return;
    const first = !U.lastFx; U.lastFx = f.seq; if (first && prev == null) return;
    const layer = $('.hx-fxl', root), pct = v => (v / SIZE * 100) + '%';
    const spark = (x, y, cls) => { const d = document.createElement('div'); d.className = 'hx-spark ' + cls; d.style.left = pct(x); d.style.top = pct(y); layer.append(d); setTimeout(() => d.remove(), 1500); };
    if (f.kind === 'edge' || f.kind === 'burn') { const [a, b] = R.EDGES[f.e].map(P); spark((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, f.kind); }
    if (f.kind === 'node') spark(...P(f.n), 'node');
    if (f.kind === 'block') { const bx = f.b % 6, by = Math.floor(f.b / 6); spark(M + bx * G + G / 2, M + by * G + G / 2, 'block'); }
    if (f.kind === 'villam') {
      const d = document.createElement('div'); d.className = 'hx-strike'; d.style.left = f.d % 2 ? '50%' : '0'; d.style.top = f.d > 1 ? '50%' : '0';
      d.innerHTML = '<svg viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M58 0 L38 46 L54 46 L34 100 L72 36 L54 36 L70 0 Z"/></svg>';
      layer.append(d); setTimeout(() => d.remove(), 1800);
      root.classList.add('shake'); setTimeout(() => root.classList.remove('shake'), 600);
    }
  }
  // client-side sound effects from state changes (every phone, incl. the host)
  function sounds() {
    if (!prev) return;
    try {
      if (S.turn && me && S.turn.pid === me.id && prev.turn?.n !== S.turn.n) { SFX.start(); navigator.vibrate?.(120); }
      if (S.q && !prev.q) SFX.help();
      if (S.q?.reveal && !prev.q?.reveal) { const p = S.q.reveal.picks[me?.id]; if (p != null) (p === S.q.reveal.correct ? SFX.ok() : SFX.bad()); else SFX.lock(); }
      if (S.event && !prev.event) SFX.lock();
      if (S.fx && S.fx.seq !== prev.fx?.seq) ({ edge: () => SFX.tick(), node: () => SFX.cert(), block: () => SFX.ok(), villam: () => SFX.bad(), burn: () => SFX.bad() }[S.fx.kind] || (() => {}))();
      if (S.prompt && !prev.prompt) navigator.vibrate?.(60);
      if (S.phase === 'over' && prev.phase !== 'over') SFX.win();
    } catch { /* audio blocked */ }
  }
  function timers() {
    const t = Date.now();
    for (const el of root?.querySelectorAll('.hx-timer') || []) {
      const left = Math.max(0, +el.dataset.end - t), f = Math.min(1, left / +el.dataset.dur), s = Math.ceil(left / 1000);
      el.querySelector('i').style.width = f * 100 + '%';
      el.querySelector('b').textContent = s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : s;
      el.classList.toggle('warn', left < 5500);
      if (el.classList.contains('q') && left < 5500 && left > 0 && el._s !== s) { el._s = s; try { SFX.tick(); } catch { /* */ } }
    }
  }

  // ---------- input ----------
  const act = (a, extra = {}) => send({ type: 'act', a, ...extra });
  function onInput() {}
  function onClick(ev) {
    const t = ev.target.closest('button, [data-e], [data-b], [data-n], .hx-ticker'); if (!t || !S) return;
    const d = t.dataset;
    if (d.e != null) {
      const e = +d.e;
      if (S.prompt?.kind === 'loseCable') return act('choose', { v: e });
      if (S.phase === 'setup') return act('place', { e });
      if (U.mode === 'cable') { act('build', { what: 'cable', e }); return; }
    }
    if (d.n != null && !t.matches('button')) {
      const n = +d.n;
      if (S.phase === 'setup') return act('place', { n });
      if (U.mode === 'eloszto') { U.eloNode = n; U.mode = null; U.sheet = 'eloRes'; return render(S); }
    }
    if (d.b != null && !t.matches('button')) {
      const b = +d.b, blk = S.blocks[b], B = R.BUILD[blk.t];
      if (U.mode === 'power' && targets().b.includes(b)) { act('build', { what: 'power', b }); U.mode = null; return; }
      if (B) flash(`${B.icon} ${B.name} · ${B.vp} ⭐ · ${R.costStr(B.cost)}${B.tip ? ' · ' + B.tip : ''}${blk.o ? ` · ${player(blk.o)?.name}` : ''}`);
      return;
    }
    if (d.ans != null) { (U.picked ||= {})[S.q.qid] = +d.ans; act('answer', { i: +d.ans }); t.classList.add('sel'); root.querySelectorAll('.hx-opt').forEach(b => { b.disabled = true; }); try { SFX.tick(); } catch { /* */ } return; }
    if (d.work) { act('work', { part: U.workPart, diff: d.work }); U.workPart = null; return; }
    if (d.act) {
      if (d.act === 'start') { const vp = S.vpTarget; return act('start', { vp }); }
      if (d.act === 'accept' || d.act === 'decline') { if (d.act === 'decline') U.dismissed.offer = +d.id; return act(d.act, { id: +d.id }); }
      if (d.act === 'end') { U.mode = null; U.sheet = null; }
      if (d.act === 'offerCancel') U.sheet = null;
      return act(d.act);
    }
    if (d.vp) return act('vp', { vp: +d.vp });
    if (d.kick) return act('kick', { id: d.kick });
    if (d.choose != null) return act('choose', { v: S.prompt?.kind === 'loseCable' ? +d.choose : d.choose });
    if (d.play) {
      const c = me.cards.find(x => x.id === d.play); if (!c) return;
      if (c.t === 'lada') { U.lada = c.id; U.ladaPick = []; U.sheet = 'lada'; return render(S); }
      U.sheet = null; return act('play', { id: c.id });
    }
    if (d.lada) { if (U.ladaPick.length < 2) U.ladaPick.push(d.lada); return render(S); }
    if (d.elo) { U.sheet = null; act('build', { what: 'eloszto', n: U.eloNode, res: d.elo }); return render(S); }
    if (d.step) { const [side, k, dv] = d.step.split(':'); U.trade[side][k] = Math.max(0, (U.trade[side][k] || 0) + +dv); return render(S); }
    if (d.bankGive) { U.bankGive = d.bankGive; if (U.bankGet === d.bankGive) U.bankGet = null; return render(S); }
    if (d.bankGet) { U.bankGet = d.bankGet; return render(S); }
    const ui = d.ui;
    if (!ui) return;
    if (ui === 'mute') { const m = SFX.toggle(); t.textContent = m ? '🔇' : '🔊'; return; }
    if (ui === 'close') { U.sheet = null; return render(S); }
    if (ui === 'part') { U.workPart = d.k; return render(S); }
    if (['build', 'trade', 'cards', 'log', 'help'].includes(ui)) { U.mode = null; U.sheet = U.sheet === ui ? null : ui; return render(S); }
    if (ui.startsWith('m-')) { U.mode = ui.slice(2); U.sheet = null; return render(S); }
    if (ui === 'mode-off') { U.mode = null; return render(S); }
    if (ui === 'buy') { act('build', { what: 'card' }); return; }
    if (ui === 'offer') { act('offer', { give: U.trade.give, get: U.trade.get }); U.trade = { give: {}, get: {} }; return; }
    if (ui === 'bank') { act('bank', { give: U.bankGive, get: U.bankGet }); U.bankGive = U.bankGet = null; return; }
    if (ui === 'lada-go') { U.sheet = null; act('play', { id: U.lada, pick: U.ladaPick }); U.ladaPick = []; return render(S); }
    if (ui === 'copy') { navigator.clipboard?.writeText(joinUrl(S.code)).then(() => flash('Link a vágólapon ✓'), () => flash(joinUrl(S.code))); return; }
    if (ui === 'share') { navigator.share?.({ title: 'Hálózatépítők', text: `Gyere játszani! Szobakód: ${S.code}`, url: joinUrl(S.code) }).catch(() => {}); return; }
  }
  function flash(text) {
    const el = $('.hx-toast', root); el.textContent = text; el.hidden = false; el.classList.remove('in'); void el.offsetWidth; el.classList.add('in');
    clearTimeout(el._t); el._t = setTimeout(() => { el.hidden = true; }, 2600);
  }
  // full-screen notice (connection lost, room full …) with optional buttons
  function notice(html) {
    let el = $('.hx-notice'); if (!html) { el?.remove(); return; }
    if (!el) { el = document.createElement('div'); el.className = 'hx-notice'; document.body.append(el); }
    el.innerHTML = `<div class="hx-card">${html}</div>`;
    return el;
  }
  return { mount, render, notice, esc, flash, rulesHtml };
})();
