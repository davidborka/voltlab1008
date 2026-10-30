'use strict';
// Boot: landing (new room / join / resume), join form, phone client with reconnect, big-screen board viewer.
(() => {
  const app = document.getElementById('app');
  const LOCAL = Net.LOCAL, params = new URLSearchParams(location.search);
  // tabs of one browser share localStorage, so the ?local=1 test mode keeps identities per tab
  const store = LOCAL ? sessionStorage : localStorage;
  const get = k => { try { return JSON.parse(store.getItem(k)); } catch { return null; } };
  const set = (k, v) => { try { store.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } };
  const esc = UI.esc;
  const token = () => { let t = get('vlab.party.token'); if (!t) { t = Math.random().toString(36).slice(2) + Date.now().toString(36); set('vlab.party.token', t); } return t; };
  const cleanCode = s => String(s || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
  const newCode = () => Array.from({ length: 4 }, () => 'ABCDEFGHJKLMNPRSTUVZ'[Math.floor(Math.random() * 20)]).join('');

  function landing(err) {
    const saved = Host.saved();
    app.className = 'hx-landing-wrap';
    app.innerHTML = `<div class="hx-landing">
      <div class="hx-brand big"><span>⚡</span><div><h1>Hálózatépítők</h1><small>Online társasjáték 2–5 villanyszerelőnek: kábelezzétek be a várost! Minden telefon egy játékos, a vizsgakérdések adják a nyersanyagot.</small></div></div>
      ${err ? `<p class="hx-err">${esc(err)}</p>` : ''}
      <button class="hx-btn primary big wide" data-go="host">⚡ Új szoba létrehozása</button>
      <div class="hx-or">vagy csatlakozz</div>
      <form class="hx-codeform"><input name="code" maxlength="4" autocomplete="off" autocapitalize="characters" placeholder="KÓD" aria-label="Szobakód"><button class="hx-btn big">Belépés</button></form>
      ${saved ? `<div class="hx-resume"><span>Félbehagyott szoba: <b>${esc(saved.S.code)}</b> (${saved.S.phase === 'lobby' ? 'várószoba' : saved.S.turnNo + '. kör'})</span><button class="hx-btn sm primary" data-go="resume">Folytatás</button><button class="hx-btn sm" data-go="forget">Elvetés</button></div>` : ''}
      <details><summary>Hogyan játszunk?</summary>${UI.rulesHtml()}</details>
      <p class="hx-sub">${LOCAL ? '🧪 Teszt mód: a gépen belüli fülek között (BroadcastChannel).' : 'A telefonok közvetlenül (WebRTC, PeerJS) kapcsolódnak. Ha valakinél nem megy, legyetek ugyanazon a Wi-Fi-n.'}</p></div>`;
    app.onclick = e => {
      const go = e.target.closest('[data-go]')?.dataset.go; if (!go) return;
      SFX.unlock();
      if (go === 'host') joinForm('Te is játszol – ki vagy?', 'Szoba létrehozása', me => startHost(me));
      if (go === 'resume') startHost(get('vlab.party.profile') || {}, saved);
      if (go === 'forget') { Host.forget(); landing(); }
    };
    app.querySelector('form').onsubmit = e => {
      e.preventDefault(); const c = cleanCode(e.target.code.value);
      if (c.length !== 4) return UI.flash?.('4 betűs kód kell');
      history.replaceState(null, '', '#' + c); joinFlow(c);
    };
  }

  function joinForm(title, cta, done, err) {
    const p = get('vlab.party.profile') || {};
    let avatar = p.avatar || R.AVATARS[Math.floor(Math.random() * R.AVATARS.length)], color = p.color || R.COLORS[Math.floor(Math.random() * R.COLORS.length)];
    app.className = 'hx-landing-wrap';
    app.innerHTML = `<form class="hx-landing hx-jf"><div class="hx-brand"><span>⚡</span><div><h1>Hálózatépítők</h1><small>${esc(title)}</small></div></div>
      ${err ? `<p class="hx-err">${esc(err)}</p>` : ''}
      <label>Neved<input name="name" maxlength="16" required autocomplete="nickname" value="${esc(p.name || '')}" placeholder="pl. Feri"></label>
      <div class="hx-lbl">Avatar</div><div class="hx-avs">${R.AVATARS.map(a => `<button type="button" class="hx-avbtn ${a === avatar ? 'on' : ''}" data-a="${a}">${a}</button>`).join('')}</div>
      <div class="hx-lbl">Szín</div><div class="hx-cols">${R.COLORS.map(c => `<button type="button" class="hx-colbtn ${c === color ? 'on' : ''}" data-c="${c}" style="--c:${c}" aria-label="szín"></button>`).join('')}</div>
      <button class="hx-btn primary big wide">${esc(cta)}</button><button type="button" class="hx-btn ghost wide" data-back>Vissza</button></form>`;
    const f = app.querySelector('form');
    f.onclick = e => {
      const a = e.target.closest('[data-a]'), c = e.target.closest('[data-c]');
      if (a) { avatar = a.dataset.a; f.querySelectorAll('.hx-avbtn').forEach(b => b.classList.toggle('on', b === a)); }
      if (c) { color = c.dataset.c; f.querySelectorAll('.hx-colbtn').forEach(b => b.classList.toggle('on', b === c)); }
      if (e.target.closest('[data-back]')) { history.replaceState(null, '', location.pathname + location.search); landing(); }
    };
    f.onsubmit = e => {
      e.preventDefault(); SFX.unlock();
      const me = { name: f.name.value.trim().slice(0, 16) || 'Játékos', avatar, color };
      set('vlab.party.profile', me);
      done({ ...me, token: token() });
    };
  }

  // ---------- host ----------
  async function startHost(me, resume, tries = 0) {
    app.className = ''; app.innerHTML = '<div class="hx-root"></div>';
    const el = app.firstElementChild;
    UI.mount(el, { role: 'player', send: m => Host.send(m) });
    UI.notice('<p>⚡ Szoba nyitása…</p>');
    try {
      await Host.open(resume?.S.code || newCode(), { ...me, token: token() }, s => UI.render(s), resume);
      UI.notice(null);
    } catch (e) {
      if (typeof e !== 'string') console.error(e);
      if (e === 'taken' && !resume && tries < 4) return startHost(me, null, tries + 1);
      if (e === 'taken' && resume && tries < 12) { UI.notice('<p>🔄 A régi szobakód felszabadítása… (pár másodperc)</p>'); setTimeout(() => startHost(me, resume, tries + 1), 2500); return; }
      UI.notice(null); landing(e === 'neterr' ? 'Nem sikerült elérni a kapcsolódási szervert (PeerJS). Van internet?' : 'Nem sikerült szobát nyitni.');
    }
  }

  // ---------- phone / board client ----------
  function joinFlow(code) {
    if (params.get('board')) return client(code, null);
    joinForm(`Belépés a(z) ${code} szobába`, 'Belépek', me => client(code, me));
  }
  function client(code, me) {
    let net = null, mounted = false, last = Date.now(), state = 'connecting', retry = null, everJoined = false;
    const watch = !me;
    const hello = () => net?.send(watch ? { type: 'watch' } : { type: 'join', ...me });
    const handlers = {
      msg(m) {
        last = Date.now();
        if (m.type === 'joined') { everJoined = true; state = 'up'; UI.notice(null); return; }
        if (m.type === 'state') {
          if (!mounted) { app.className = ''; app.innerHTML = '<div class="hx-root"></div>'; UI.mount(app.firstElementChild, { role: watch ? 'board' : 'player', send: x => net?.send(x) }); mounted = true; }
          if (watch && state !== 'up') { state = 'up'; UI.notice(null); }
          UI.render(m.s); return;
        }
        if (m.type === 'hostup') { UI.notice('<p>🔄 A tábla újraindult – visszacsatlakozás…</p>'); hello(); return; }
        if (m.type === 'full') { state = 'dead'; return UI.notice(`<h3>Megtelt a szoba</h3><p>Legfeljebb 5 játékos lehet egy szobában.</p><button class="hx-btn" onclick="location.href=location.pathname+location.search">Vissza</button>`); }
        if (m.type === 'started') { state = 'dead'; return UI.notice(`<h3>A játék már elindult</h3><p>Új játékos csak a várószobában léphet be. (Aki kiesett, ugyanazzal a névvel visszajöhet.)</p><button class="hx-btn" onclick="location.href=location.pathname+location.search">Vissza</button>`); }
      },
      close() { lost(); },
    };
    async function connect() {
      clearTimeout(retry);
      if (!everJoined) UI.notice(`<p>🔌 Kapcsolódás a(z) <b>${esc(code)}</b> szobához…</p>`);
      try { net = await Net.join(code, handlers); last = Date.now(); hello(); }
      catch (e) {
        net = null;
        if (everJoined) { retry = setTimeout(connect, 3000); return; }
        UI.notice(`<h3>${e === 'noroom' ? 'Nincs ilyen szoba' : 'Hálózati hiba'}</h3><p>${e === 'noroom' ? `A(z) ${esc(code)} szoba nem érhető el. Jó a kód? Nyitva van a házigazda telefonján az oldal?` : 'Nem sikerült kapcsolódni. Egyes mobilhálózatok tiltják a közvetlen kapcsolatot – próbáljátok ugyanazon a Wi-Fi-n.'}</p>
          <div class="hx-row"><button class="hx-btn primary" data-retry>Újra</button><button class="hx-btn" onclick="location.href=location.pathname+location.search">Vissza</button></div>`).querySelector('[data-retry]').onclick = connect;
      }
    }
    function lost() {
      if (state === 'dead') return;
      try { net?.close(); } catch { /* */ }
      net = null; state = 'lost';
      const n = UI.notice(`<h3>📴 Megszakadt a kapcsolat</h3><p>A tábla újraindult, vagy gyenge a hálózat. Újracsatlakozunk…</p><button class="hx-btn primary" data-retry>Újracsatlakozás most</button>`);
      n.querySelector('[data-retry]').onclick = connect;
      retry = setTimeout(connect, 2000);
    }
    setInterval(() => {
      if (!net) return;
      net.send({ type: 'ping' });
      if (state !== 'connecting' && Date.now() - last > 9000) lost();
    }, 2000);
    addEventListener('pagehide', () => { try { net?.close(); } catch { /* */ } });
    connect();
  }

  // ---------- boot ----------
  const hash = cleanCode(location.hash.slice(1)), board = cleanCode(params.get('board'));
  if (board) client(board, null);
  else if (hash.length === 4) joinFlow(hash);
  else {
    const saved = Host.saved(); let hosting = null; try { hosting = sessionStorage.getItem('vlab.party.hosting'); } catch { /* */ }
    if (saved && hosting === saved.S.code) startHost(get('vlab.party.profile') || {}, saved); // host refreshed the page
    else landing();
  }
})();
