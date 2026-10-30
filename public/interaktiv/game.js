'use strict';
// „Legyen Ön is villanyszerelő!” – a TV-quiz-style game on top of the question bank. Loaded after app.js and
// game/sfx.js and shares their globals. Single-choice questions with rising difficulty, 16 ranks from
// "Óvodás" to "Albert Einstein"; a wrong answer drops you to the last certificate. The 3D studio
// (game/studio.js, three.js) is optional: without WebGL the show still runs on the CSS stage.

const RANKS = [
  { name: "Óvodás", sub: "A konnektort csak messziről csodálja", d: 1, say: "Gratulálok, ön hivatalosan is óvodás! A konnektort továbbra is csak nézzük, nem piszkáljuk." },
  { name: "Elemcserélő", sub: "A távirányító nagy hőse", d: 1, say: "Elemcserélő lett! A tévétávirányító mostantól önre néz fel." },
  { name: "Izzócserélő", sub: "Már tudja, merre kell tekerni", d: 1, say: "Izzócserélő! Már tudja, merre kell tekerni. A létrát is tartja valaki? Remélem." },
  { name: "Tanuló", sub: "Első kesztyű, első szerszámláda", d: 1, cert: 'Tanulóigazolvány', say: "Megvan a tanulóigazolvány! Kesztyű a kézen, szerszámláda a vállon, az élet szép." },
  { name: "Kábelhúzó inas", sub: "Ő hozza a dobot és a kávét", d: 1, say: "Kábelhúzó inas! Ön hozza a kábeldobot, és ha jó napja van, a kávét is." },
  { name: "WAGO-bajnok", sub: "Három érkötés, nulla szigszalag", d: 2, say: "WAGO-bajnok! Három ér, egy kattanás, és a szigszalag sértődötten néz a sarokból." },
  { name: "Dobozvéső virtuóz", sub: "A falban él, a port lélegzi", d: 2, say: "Dobozvéső virtuóz! A szomszédok már tudják a nevét. Főleg reggel hétkor." },
  { name: "Elosztótábla-suttogó", sub: "A kismegszakítók név szerint ismerik", d: 2, cert: 'Mesterlevél', say: "Mesterlevél a zsebben! Ön az elosztótábla-suttogó: a kismegszakítók név szerint köszönnek önnek." },
  { name: "Hurokimpedancia-vadász", sub: "Nincs hurok, amit ne mérne meg", d: 2, say: "Hurokimpedancia-vadász! Nincs olyan hurok, ami elbújhatna ön elől." },
  { name: "Szabványkönyv-faló", sub: "A szabványt esti meseként olvassa", d: 2, say: "Szabványkönyv-faló! Ön az, aki a szabványt esti meseként olvassa. És még élvezi is." },
  { name: "Áramkör-bűvész", sub: "Papíron is működik, élőben is", d: 3, say: "Áramkör-bűvész! Önnél nemcsak papíron működik a terv, hanem élőben is. Ritka madár!" },
  { name: "Georg Simon Ohm", sub: "Teljesen ellenállhatatlan", d: 3, cert: 'Ohm-érem', say: "Ohm-érem! Ön mostantól Georg Simon Ohm szintjén áll. Teljesen ellenállhatatlan!" },
  { name: "Michael Faraday", sub: "Ketrecben is boldog", d: 3, say: "Faraday szint! Önt még egy Faraday-kalitkában sem zavarja semmi." },
  { name: "James Clerk Maxwell", sub: "Négy egyenlet, nulla stressz", d: 3, say: "Maxwell szint! Négy egyenlet, nulla stressz. Mi jöhet még?" },
  { name: "Nikola Tesla", sub: "Kétszázharminc voltos frizurával ébred", d: 3, say: "Tesla szint! Önnek reggelente magától feláll a haja. Váltakozó áramban, természetesen." },
  { name: "Albert Einstein", sub: "Relatíve zseni, abszolút bajnok", d: 3, cert: 'Einstein-díj' },
];
const GAME_SECS = 60;
const HELPS = {
  half: { icon: '½', name: 'Felező', tip: 'A fáziskereső kiolt két rossz választ.' },
  phone: { icon: '📞', name: 'Felhívom Teslát', tip: 'Nikola Tesla megmondja a választ, és el is magyarázza, miért (közben áll az óra).' },
  swap: { icon: '🔁', name: 'Csere', tip: 'Ugyanilyen nehéz, másik kérdést kapsz.' },
};
let G = null, gameTick = null, Studio = null, studioReady = null;

function loadStudio(container) {
  studioReady ||= import('./game/studio.js').then(m => m.default).catch(() => null);
  return studioReady.then(s => { if (s && container.isConnected && s.init(container)) Studio = s; else Studio = null; window.Studio3D = Studio; return Studio; });
}
const st3 = (fn, ...a) => { try { Studio?.[fn]?.(...a); } catch { /* the show goes on without 3D */ } };

function gameNewQuestion() {
  const d = RANKS[G.level].d;
  const all = QUESTIONS.filter(q => q.type === 'single' && q.difficulty === d && q.options.length >= 4);
  const fresh = all.filter(q => !G.used.has(q.id));
  // prefer questions you have seen least, so the game also widens coverage
  const [q] = weightedPick(fresh.length ? fresh : all, q => 1 / (1 + (S.stats[q.id]?.n || 0)), 1);
  G.used.add(q.id);
  const wrong = shuffle(range(q.options.length).filter(i => i !== q.answer[0])).slice(0, 3);
  Object.assign(G, { q, opts: shuffle([q.answer[0], ...wrong]), hidden: [], picked: null, state: 'ask', t0: Date.now(), paused: 0, tesla: null });
}
const certLevel = lvl => { for (let i = lvl - 1; i >= 0; i--) if (RANKS[i].cert) return i + 1; return 0; }; // ranks kept after a fall

function startGame() {
  SFX.unlock();
  G = { level: 0, used: new Set(), helps: { half: true, phone: true, swap: true }, line: '' };
  gameNewQuestion();
  G.state = 'intro';
  goView({ name: 'game' });
  const go = () => { if (G?.state !== 'intro') return; st3('host', 'wave'); Voice.say('intro').then(() => { if (G?.state === 'intro') { G.state = 'ask'; G.t0 = Date.now(); render(); } }); };
  playOpener().then(go);
}
// the motion-graphics opener (game/opener.mp4); skippable, and skipped silently if it can't play
function playOpener() {
  return new Promise(done => {
    const o = h(`<div class="opener"><video src="game/opener.mp4" playsinline preload="auto"></video><button class="btn small">Átugrás ▶</button></div>`);
    const v = $('video', o), end = () => { if (!o.isConnected) return; o.classList.add('out'); setTimeout(() => o.remove(), 400); done(); };
    v.muted = SFX.muted; v.onended = end; v.onerror = end; $('button', o).onclick = end;
    document.body.append(o);
    v.play().catch(end);
  });
}
function gameEnd(reached, why, kind) {
  clearInterval(gameTick); SFX.bed(false);
  const st = (S.game ||= { plays: 0, best: 0, wins: 0 });
  st.plays++; st.best = Math.max(st.best, reached); if (reached === RANKS.length) st.wins++;
  save();
  Object.assign(G, { state: 'over', reached, why, kind });
  render();
}
function gameAnswer(i) {
  if (G.state !== 'ask') return;
  clearInterval(gameTick);
  G.picked = i; G.state = 'lock'; render();
  SFX.lock(); SFX.bed(true, true); st3('lockIn'); st3('tension', true); st3('host', 'nervous');
  const suspense = i === null ? Voice.say('time') : Promise.all([Voice.say('lock'), new Promise(r => setTimeout(r, 1800))]);
  suspense.then(() => {
    const ok = i === G.q.answer[0];
    record(G.q, ok ? 1 : 0); save();
    SFX.bed(false); st3('tension', false);
    G.state = ok ? 'right' : 'wrong'; render();
    if (!ok) {
      SFX.bad(); st3('wrong'); st3('host', 'facepalm');
      const back = certLevel(G.level);
      return Voice.say('bad').then(() => setTimeout(() => gameEnd(back, i === null ? 'Lejárt az idő.' : 'Rossz válasz.', 'lose'), 600));
    }
    SFX.ok(); st3('correct'); st3('host', 'cheer'); { const lv = G.level + 1; setTimeout(() => st3('setLevel', lv, RANKS.length), 1100); }
    if (G.level + 1 === RANKS.length) { st3('win'); st3('host', 'dance'); SFX.win(); return Voice.say('win').then(() => gameEnd(RANKS.length, 'Minden kérdésre jól válaszoltál!', 'win')); }
    if (RANKS[G.level].cert) SFX.cert();
    Voice.rank(G.level + 1, RANKS[G.level].say);
  });
}
function gameNext() {
  G.level++; gameNewQuestion(); render();
  st3('ask'); st3('host', 'point'); setTimeout(() => G?.state === 'ask' && st3('host', 'idle'), 2200);
  const r = RANKS[G.level];
  if (G.level === 5 || G.level === 10 || Math.random() < 0.3) Voice.say(r.d === 1 ? 'easy' : r.d === 2 ? 'mid' : 'hard');
}

function renderGame() {
  if (!G) return startGameScreen();
  if (G.state === 'over') return gameOverScreen();
  const q = G.q, L = 'ABCD', r = RANKS[G.level];
  const shown = G.state === 'right' || G.state === 'wrong';
  const el = h(`<div class="show">
    <div class="stage3d"></div><div class="stage-fallback"></div>
    <header class="sh-top">
      <button class="sh-btn" id="gquit" title="Kilépés">✕</button>
      <div class="sh-helps">${Object.entries(HELPS).map(([k, x]) => `<button class="sh-help ${G.helps[k] ? '' : 'used'}" data-help="${k}" title="${x.tip}" ${G.helps[k] && G.state === 'ask' ? '' : 'disabled'}><b>${x.icon}</b><span>${x.name}</span></button>`).join('')}</div>
      <button class="sh-btn" id="gnew" title="Új játék">🔄</button>
      <button class="sh-btn" id="gmute" title="Hang ki/be">${SFX.muted ? '🔇' : '🔊'}</button>
    </header>
    <aside class="sh-ladder">${RANKS.map((x, i) => `<div class="rung ${i < G.level || (i === G.level && G.state === 'right') ? 'on' : ''} ${i === G.level && G.state !== 'right' ? 'cur' : ''} ${x.cert ? 'cert' : ''}" style="--i:${i}"><span class="led"></span><span class="n">${i + 1}</span><span class="nm">${esc(x.name)}</span>${x.cert ? '<span class="badge">🎓</span>' : ''}</div>`).reverse().join('')}</aside>
    <div class="sh-host ${G.line ? 'talk' : ''}"><span class="avatar">⚡</span><div><b>Fázis Feri</b><p id="gline">${esc(G.line || '')}</p></div></div>
    <main class="sh-panel" key="${q.id}">
      <div class="sh-meta"><span>${G.level + 1}. kérdés</span><span>Tét: <b>${esc(r.name)}</b>${r.cert ? ` · 🎓 ${esc(r.cert)}` : ''}</span>
        <span class="sh-timer ${G.state === 'ask' ? '' : 'idle'}"><svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="15.9" class="trk"/><circle cx="18" cy="18" r="15.9" class="arc" id="garc"/></svg><b id="gt">${GAME_SECS}</b></span></div>
      <div class="sh-prog" title="${G.level + 1}/${RANKS.length}">${RANKS.map((x, i) => `<i class="${i < G.level || (i === G.level && G.state === 'right') ? 'on' : i === G.level ? 'cur' : ''} ${x.cert ? 'cert' : ''}"></i>`).join('')}</div>
      <div class="sh-q">${rich(q.q)}</div>
      ${q.svg ? '<div class="qsvg sh-svg"></div>' : ''}
      ${G.tesla && G.state === 'ask' ? `<div class="sh-tesla">📞 <b>Tesla szerint:</b> ${rich(G.tesla)}</div>` : ''}
      <div class="sh-opts">${G.opts.map((oi, k) => {
        const hid = G.hidden.includes(oi);
        const cls = [hid ? 'out' : '', G.picked === oi ? 'pick' : '', shown && oi === q.answer[0] ? 'right' : '', G.state === 'wrong' && G.picked === oi ? 'wrong' : ''].join(' ');
        return `<button class="sh-opt ${cls}" style="--k:${k}" data-o="${oi}" ${hid || G.state !== 'ask' ? 'disabled' : ''}><b>${L[k]}</b><span>${hid ? '' : rich(q.options[oi])}</span></button>`;
      }).join('')}</div>
      ${G.state === 'right' ? `<div class="sh-next"><div class="rankup">⬆ ${esc(r.name)}<small>${esc(r.sub)}${r.cert ? ` · megszerezted: <b>${esc(r.cert)}</b>` : ''}</small></div>
        <div class="row"><button class="btn" id="gstop">Megállok ezzel a ranggal</button><button class="btn primary" id="gnext">Következő kérdés ▶</button></div></div>` : ''}
    </main>
    ${G.state === 'intro' ? `<div class="sh-intro"><div class="logo-volt">⚡</div><h1>Legyen Ön is<br>villanyszerelő!</h1><p>Óvodástól Albert Einsteinig – ${RANKS.length} kérdés</p><button class="btn" id="gskip">Kezdés ▶</button></div>` : ''}
    ${G.state === 'right' && r.cert ? '<div class="confetti">' + Array.from({ length: 40 }, (_, i) => `<i style="--x:${Math.random() * 100}%;--d:${(Math.random() * 1.5).toFixed(2)}s;--h:${Math.floor(Math.random() * 360)}"></i>`).join('') + '</div>' : ''}
    ${G.state === 'wrong' ? '<div class="trip"></div>' : ''}
  </div>`);
  if (q.svg) { const d = $('.sh-svg', el); d.innerHTML = q.svg; d.querySelectorAll('script').forEach(x => x.remove()); }
  el.querySelectorAll('.sh-opt').forEach(b => b.addEventListener('click', () => gameAnswer(+b.dataset.o)));
  el.querySelectorAll('[data-help]').forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.help; G.helps[k] = false; SFX.help();
    if (k === 'half') { G.hidden = shuffle(G.opts.filter(i => i !== q.answer[0])).slice(0, 2); Voice.say('half'); }
    if (k === 'phone') return callTesla(q);
    if (k === 'swap') { clearInterval(gameTick); gameNewQuestion(); Voice.say('swap'); }
    render();
  }));
  $('#gquit', el).addEventListener('click', () => confirmBox('Kilépsz? Az eddig elért rangod megmarad.', () => { Voice.stop(); gameEnd(G.state === 'right' ? G.level + 1 : G.level, 'Kiléptél.', 'stop'); }));
  $('#gnew', el).addEventListener('click', () => confirmBox('Új játékot kezdesz? Az eddigi rangod elveszik.', () => { Voice.stop(); SFX.bed(false); clearInterval(gameTick); startGame(); }));
  $('#gmute', el).addEventListener('click', e => { e.currentTarget.textContent = SFX.toggle() ? '🔇' : '🔊'; });
  $('#gstop', el)?.addEventListener('click', () => { Voice.say('stop'); gameEnd(G.level + 1, 'Megálltál a ranggal.', 'stop'); });
  $('#gnext', el)?.addEventListener('click', gameNext);
  $('#gskip', el)?.addEventListener('click', () => { Voice.stop(); G.state = 'ask'; G.t0 = Date.now(); render(); });
  app.append(el);
  // keep one WebGL studio alive across re-renders: move its canvas into the new stage
  const stage = $('.stage3d', el), old = document.querySelector('.stage3d-keep');
  if (old) { stage.replaceWith(old); old.classList.remove('stage3d-keep'); el.classList.add('has3d'); }
  else loadStudio(stage).then(s => { if (s) { el.classList.add('has3d'); s.setLevel(G.level, RANKS.length); s.ask(); s.setHost?.('game/feri.glb'); } });
  if (G.state === 'ask') startGameClock();
}
// "Felhívom Teslát": dial, ring, Tesla picks up and explains the right answer (pre-recorded per question)
let TESLA = null;
async function callTesla(q) {
  const p0 = Date.now();
  TESLA ||= await fetch('game/tesla.json').then(r => r.json()).catch(() => ({}));
  const o = h(`<div class="overlay phone"><div class="call"><div class="ph-who"><span class="ph-avatar">⚡</span><div><b>Nikola Tesla</b><small id="phs">Tárcsázás…</small></div></div>
    <div class="ph-dial">📞</div><div class="ph-wave"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><p id="pht"></p><button class="btn small" id="phx">Letenni</button></div></div>`);
  document.body.append(o);
  const st = x => { $('#phs', o).textContent = x; }, txt = x => { $('#pht', o).textContent = x; };
  // "Letenni" works at any moment: Voice.stop() only pauses the audio (no 'ended' event), so every step
  // races against the hang-up, otherwise the awaited line never resolves and the call gets stuck
  let hung = false, hangUp; const hungP = new Promise(r => { hangUp = r; });
  const step = p => hung ? Promise.resolve() : Promise.race([p, hungP]);
  $('#phx', o).disabled = false;
  $('#phx', o).onclick = () => { hung = true; Voice.stop(); hangUp(); };
  st3('host', 'talk');
  await step(Voice.say('phone'));
  if (!hung) { st('Tárcsázás…'); o.classList.add('dialing'); await step(SFX.dial()); }
  if (!hung) { st('Kicseng…'); o.classList.replace('dialing', 'ringing'); await step(SFX.ring(2)); }
  o.classList.remove('dialing', 'ringing'); o.classList.add('talking'); st3('host', 'think');
  if (!hung) {
    SFX.pickup(); SFX.hiss(true); st('Vonalban');
    const hi = Math.floor(Math.random() * 3); txt(Voice.lines.tesla_hi[hi]);
    await step(Voice.file(`game/voice/tesla_hi_${hi + 1}.mp3`, 2500));
  }
  // he says one or two sentences; the full derivation is written out on the card (shown even after an early hang-up)
  const said = TESLA[q.id], gen = 1 + Math.floor(Math.random() * 2);
  txt(said || (gen === 1 ? 'Hm, ez egy jó kérdés! A helyes választ és a levezetést felírtam a képernyőre, nézze csak!' : 'Ezt fejből tudom! Kiírtam önnek a választ, és azt is, hogy miért.'));
  const card = h(`<div class="ph-note"><div class="ph-ans">✔ ${rich(q.options[q.answer[0]])}</div><div class="ph-exp">${rich(q.explanation)}</div>${q.work ? workBox(q.work, true) : ''}</div>`);
  $('.call', o).insertBefore(card, $('#phx', o));
  await step(Voice.file(said ? `game/tesla/${q.id}.mp3` : `game/voice/tesla_gen_${gen}.mp3`, 3500));
  if (!hung) { const b = Math.floor(Math.random() * 2); txt(Voice.lines.tesla_bye[b]); await step(Voice.file(`game/voice/tesla_bye_${b + 1}.mp3`, 2000)); }
  Voice.stop();
  SFX.hiss(false); SFX.hangup(); st('Hívás vége');
  // keep the card open until the player closes it; the clock stays stopped meanwhile
  $('#phx', o).textContent = 'Vissza a kérdéshez'; $('#phx', o).classList.add('primary');
  await new Promise(r => { $('#phx', o).onclick = r; });
  o.remove(); G.t0 += Date.now() - p0; G.tesla = plain(q.options[q.answer[0]]); st3('host', 'idle'); render();
}
function startGameClock() {
  clearInterval(gameTick);
  SFX.bed(true, false);
  const upd = () => {
    if (view.name !== 'game' || G?.state !== 'ask') return clearInterval(gameTick);
    if (document.querySelector('.overlay')) return; // rulebook or confirm box open: the clock waits
    const l = GAME_SECS - (Date.now() - G.t0) / 1000, t = document.getElementById('gt'), a = document.getElementById('garc');
    if (t) { t.textContent = Math.max(0, Math.ceil(l)); t.parentElement.classList.toggle('warn', l <= 10); }
    if (a) a.style.strokeDasharray = `${Math.max(0, l / GAME_SECS) * 100} 100`;
    if (l <= 10 && l > 0 && Math.abs(l - Math.round(l)) < 0.13) SFX.tick();
    if (l <= 0) gameAnswer(null);
  };
  upd(); gameTick = setInterval(upd, 250);
}
// render() wipes #app; park the WebGL stage so the next render can adopt it instead of building a new one
const _render = render;
render = function () { const s = document.querySelector('.show .stage3d'); if (s && view.name === 'game' && Studio) { s.classList.add('stage3d-keep'); document.body.append(s); } else if (view.name !== 'game' && Studio) { st3('dispose'); Studio = null; studioReady = null; document.querySelector('.stage3d-keep')?.remove(); } return _render(); };
Voice.onLine = t => { if (G) { G.line = t; const p = document.getElementById('gline'); if (p) { p.textContent = t; p.closest('.sh-host').classList.add('talk'); } } };

function startGameScreen() {
  const st = S.game || { plays: 0, best: 0, wins: 0 };
  const el = h(`<div class="start"><div class="card game-intro">
    <h1>⚡ Legyen Ön is villanyszerelő!</h1>
    <p>Kvízjáték a kérdésbankból, Fázis Feri műsorvezetésével. ${RANKS.length} kérdés, egyre nehezebben: az <b>Óvodás</b> szinttől az <b>Elosztótábla-suttogón</b> át egészen <b>Albert Einstein</b>ig. Rossz válasznál visszaesel az utolsó bizonyítványodig: ${RANKS.filter(r => r.cert).map((r, i) => `${RANKS.indexOf(r) + 1}. ${esc(r.cert)}`).join(', ')}. Jó válasz után megállhatsz, és megtarthatod a rangot.</p>
    <ul><li>Kérdésenként ${GAME_SECS} másodperc.</li>${Object.values(HELPS).map(x => `<li><b>${x.icon} ${x.name}</b> (egyszer): ${x.tip}</li>`).join('')}<li>A válaszaid a tanulási rendszerbe is beszámítanak; rossz válasz után megkapod a magyarázatot.</li><li>Hanggal a legjobb (🔊 a jobb felső sarokban kapcsolható).</li></ul>
    ${st.plays ? `<p class="small muted">Eddig ${st.plays} játék · legjobb rang: <b>${st.best ? esc(RANKS[st.best - 1].name) : '–'}</b>${st.wins ? ` · ${st.wins}× Einstein lettél` : ''}</p>` : ''}
    <div class="row">${back()}<button class="btn primary" id="gs">Játék indítása ▶</button></div></div></div>`);
  wireBack(el);
  $('#gs', el).addEventListener('click', startGame);
  app.append(el);
}
function gameOverScreen() {
  const r = G.reached, top = r === RANKS.length;
  if (G.kind !== 'win') setTimeout(() => Voice.say('over'), 400);
  const el = h(`<div class="start"><div class="card game-over ${G.kind}">
    <div class="cert-card"><div class="small muted">${esc(G.why)}</div>
      <div class="cert-k">${top ? '🏆 ' : r ? '🎓 ' : ''}Elért rang</div>
      <h1>${r ? esc(RANKS[r - 1].name) : 'Még nincs rang'}</h1>
      ${r ? `<div class="small">${esc(RANKS[r - 1].sub)}</div>` : ''}
      <div class="cert-who">${esc(profile().name)} · ${r}/${RANKS.length} fok · ${new Date().toLocaleDateString('hu-HU')}</div></div>
    <div id="gexp"></div>
    <div class="row" style="margin-top:16px">${back()}<button class="btn primary" id="gagain">Új játék ▶</button></div></div></div>`);
  if (G.kind === 'lose' && G.q) $('#gexp', el).append(h('<h3>Az utolsó kérdés megoldása</h3>'), renderSolutionOnly(G.q), explanationBox(G.q, 0));
  wireBack(el);
  el.querySelectorAll('[data-back]').forEach(b => b.addEventListener('click', () => { G = null; }));
  $('#gagain', el).addEventListener('click', startGame);
  app.append(el);
}

if (location.hash === '#jatek') goView({ name: 'game' });
