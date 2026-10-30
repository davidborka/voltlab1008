'use strict';
// Synthesised sound effects for the quiz show (Web Audio, no audio files) + the host's voice lines.
const SFX = (() => {
  let ctx = null, master = null, bed = null;
  let muted = false; try { muted = localStorage.getItem('vvz.game.mute') === '1'; } catch { /* ignore */ }
  const ac = () => {
    if (!ctx) { ctx = new (window.AudioContext || window.webkitAudioContext)(); master = ctx.createGain(); master.gain.value = muted ? 0 : 0.5; master.connect(ctx.destination); }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  };
  const env = (g, t, a, peak, d) => { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); };
  function tone(freq, { type = 'sine', at = 0, a = 0.01, d = 0.4, vol = 0.3, slide } = {}) {
    const c = ac(), t = c.currentTime + at, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + a + d);
    env(g, t, a, vol, d); o.connect(g).connect(master); o.start(t); o.stop(t + a + d + 0.05);
  }
  function noise({ at = 0, d = 0.3, vol = 0.2, hp = 1000, lp = 8000 } = {}) {
    const c = ac(), t = c.currentTime + at, n = Math.ceil(c.sampleRate * d), buf = c.createBuffer(1, n, c.sampleRate), x = buf.getChannelData(0);
    for (let i = 0; i < n; i++) x[i] = (Math.random() * 2 - 1) * (Math.random() < 0.15 ? 1 : 0.25); // crackly
    const s = c.createBufferSource(), f1 = c.createBiquadFilter(), f2 = c.createBiquadFilter(), g = c.createGain();
    s.buffer = buf; f1.type = 'highpass'; f1.frequency.value = hp; f2.type = 'lowpass'; f2.frequency.value = lp;
    env(g, t, 0.005, vol, d); s.connect(f1).connect(f2).connect(g).connect(master); s.start(t);
  }
  // recorded effects (ElevenLabs, game/sfx/*.mp3); the synth versions below stay as fallback
  const buf = {}, FILES = ['lock', 'ok', 'bad', 'help', 'cert', 'win', 'applause', 'bed'];
  let loading = null;
  const load = () => loading ||= Promise.all(FILES.map(n => fetch(`game/sfx/${n}.mp3`).then(r => r.arrayBuffer()).then(b => ac().decodeAudioData(b)).then(d => { buf[n] = d; }).catch(() => {})));
  function play(n, vol = 1) {
    if (!buf[n]) return false;
    const c = ac(), s = c.createBufferSource(), g = c.createGain(); s.buffer = buf[n]; g.gain.value = vol; s.connect(g).connect(master); s.start(); return true;
  }
  return {
    get muted() { return muted; },
    load,
    toggle() { muted = !muted; try { localStorage.setItem('vvz.game.mute', muted ? '1' : '0'); } catch { /* ignore */ } if (master) master.gain.value = muted ? 0 : 0.5; Voice.stop(); return muted; },
    unlock() { ac(); load(); },
    start() { [262, 330, 392, 523, 659].forEach((f, i) => tone(f, { type: 'triangle', at: i * 0.09, d: 0.5, vol: 0.18 })); noise({ at: 0.45, d: 0.4, vol: 0.12 }); tone(1047, { type: 'sine', at: 0.5, d: 1.2, vol: 0.12 }); },
    tick() { tone(1800, { type: 'square', d: 0.03, vol: 0.05 }); },
    help() { if (play('help')) return; tone(300, { type: 'sawtooth', d: 0.25, vol: 0.12, slide: 1600 }); noise({ d: 0.25, vol: 0.15, hp: 2000 }); },
    lock() { if (play('lock')) return; tone(180, { type: 'sawtooth', a: 0.05, d: 0.9, vol: 0.12, slide: 720 }); tone(60, { type: 'sine', d: 1, vol: 0.25 }); },
    ok() { if (play('ok')) return; [523, 659, 784, 1047].forEach((f, i) => tone(f, { type: 'triangle', at: i * 0.08, d: 0.6, vol: 0.2 })); noise({ at: 0.05, d: 0.5, vol: 0.18, hp: 3000 }); },
    bad() { if (play('bad')) return; tone(110, { type: 'sawtooth', d: 0.9, vol: 0.22, slide: 70 }); tone(55, { type: 'square', at: 0.02, d: 0.25, vol: 0.25 }); noise({ d: 0.15, vol: 0.3, hp: 200, lp: 2000 }); },
    cert() { if (play('cert')) return; [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, { type: 'triangle', at: i * 0.11, d: 0.9, vol: 0.2 })); noise({ at: 0.5, d: 0.8, vol: 0.12, hp: 4000 }); },
    win() { play('applause', 0.6); if (play('win')) return; [262, 330, 392, 523, 392, 523, 659, 1047].forEach((f, i) => tone(f, { type: 'triangle', at: i * 0.14, d: 1.1, vol: 0.2 })); for (let i = 0; i < 6; i++) noise({ at: 0.3 + i * 0.25, d: 0.4, vol: 0.12, hp: 3000 }); },
    // rotary dial: each digit = n short clicks, then a pause
    async dial(digits = '06 1 230 400') {
      const c = ac(); let t = 0.1;
      for (const d of digits.replace(/\s/g, '')) { const n = +d || 10; for (let k = 0; k < n; k++) { noise({ at: t, d: 0.012, vol: 0.35, hp: 1500, lp: 6000 }); tone(900, { type: 'square', at: t, d: 0.01, vol: 0.05 }); t += 0.065; } t += 0.28; }
      return new Promise(r => setTimeout(r, t * 1000));
    },
    // Hungarian ring-back: 425 Hz, 1 s on / 4 s off; we play `n` short rings
    ring(n = 2) { for (let i = 0; i < n; i++) { tone(425, { type: 'sine', at: i * 1.6, a: 0.02, d: 1.0, vol: 0.12 }); tone(450, { type: 'sine', at: i * 1.6, a: 0.02, d: 1.0, vol: 0.06 }); } return new Promise(r => setTimeout(r, n * 1600)); },
    pickup() { noise({ d: 0.05, vol: 0.4, hp: 300, lp: 3000 }); tone(120, { type: 'square', d: 0.04, vol: 0.12 }); },
    hangup() { noise({ d: 0.08, vol: 0.4, hp: 200, lp: 2500 }); [0.15, 0.45, 0.75].forEach(at => tone(425, { at, d: 0.2, vol: 0.08 })); },
    hiss(on) {
      const c = ac();
      if (this._hiss) { this._hiss.stop(); this._hiss = null; }
      if (!on) return;
      const n = c.sampleRate * 2, b = c.createBuffer(1, n, c.sampleRate), x = b.getChannelData(0);
      for (let i = 0; i < n; i++) x[i] = (Math.random() * 2 - 1) * (Math.random() < 0.002 ? 1 : 0.15);
      const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      s.buffer = b; s.loop = true; f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = 0.7; g.gain.value = 0.04;
      s.connect(f).connect(g).connect(master); s.start(); this._hiss = s;
    },
    // the "thinking" bed: mains hum with a slow pulse, louder under tension
    bed(on, tense = false) {
      const c = ac();
      if (bed) { const b = bed; bed = null; b.g.gain.setTargetAtTime(0.0001, c.currentTime, 0.2); setTimeout(() => b.oscs.forEach(o => o.stop()), 800); }
      if (!on) return;
      if (buf.bed) { // recorded loop; tension = louder and a touch faster
        const s = c.createBufferSource(), g = c.createGain(); s.buffer = buf.bed; s.loop = true; s.playbackRate.value = tense ? 1.06 : 1;
        g.gain.value = 0.0001; g.gain.setTargetAtTime(tense ? 0.9 : 0.55, c.currentTime, 0.4); s.connect(g).connect(master); s.start();
        bed = { g, oscs: [s] }; return;
      }
      const g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain(), oscs = [];
      g.gain.value = 0.0001; g.gain.setTargetAtTime(tense ? 0.09 : 0.05, c.currentTime, 0.5);
      for (const [f, v] of [[50, 1], [100, 0.5], [150, 0.25]]) { const o = c.createOscillator(), og = c.createGain(); o.frequency.value = f; og.gain.value = v; o.connect(og).connect(g); o.start(); oscs.push(o); }
      lfo.frequency.value = tense ? 2 : 0.5; lg.gain.value = 0.03; lfo.connect(lg).connect(g.gain); lfo.start(); oscs.push(lfo);
      g.connect(master); bed = { g, oscs };
    },
  };
})();

// The host, "Fázis Feri" – an invented character (voice: ElevenLabs, pre-generated mp3s in game/voice/).
const Voice = (() => {
  const LINES = {
    intro: ['Jó estét, jó estét! Itt Fázis Feri, ez pedig a Legyen Ön is villanyszerelő! Ma kiderül, ki jut el az óvodástól egészen Albert Einsteinig!', 'Üdvözlöm a stúdióban! Kesztyű fel, szerszám elő, feszültség alá helyezzük a játékot!', 'Kedves néző, ma este nem a biztosíték fog kiolvadni, hanem a versenyzőnk agya. Kezdjük!'],
    easy: ['Kezdjük könnyen. Ez még csak bemelegítés, mint a forrasztópáka reggel.', 'Egy egyszerű kérdés jön, ez még az óvodásnak is megy. Remélem.', 'Lássuk, ki dugta be ma reggel a gondolkodását a konnektorba!'],
    mid: ['Nő a feszültség, és nem csak a vezetékben!', 'Most jön az igazi szakma. Itt már nem elég tudni, hogy melyik a kék.', 'Figyelem, ez a kérdés már a mestervizsga szaga!'],
    hard: ['Tudósok szintje. Itt már a szabványkönyv is izzad.', 'Ez a kérdés olyan nehéz, hogy a kismegszakító magától lekapcsolt, amikor elolvastam.', 'Ohm, Faraday, Tesla... ők figyelnek most önre. Ne hagyja cserben őket!'],
    lock: ['Megjelölte. Bekapcsolunk... és...', 'Ez a végleges? Mert most adjuk rá a feszültséget!', 'Rendben. Három, kettő, egy... kapcsolunk!'],
    ok: ['Helyes! Szépen zár az áramkör!', 'Így van! Ez a válasz földelve van, mint egy jó védővezető!', 'Telitalálat! Még a fáziskereső is felvillant!', 'Jó válasz! Ön ma egy kettős szigetelésű zseni!'],
    bad: ['Jaj, ez kioldott. Pont úgy, mint egy harminc milliamperes áram-védőkapcsoló.', 'Sajnos rossz. Ezt már csak egy villámhárító tudná elkapni.', 'Zárlat! De semmi baj: a hibából tanul az ember, a hibaáramból meg a relé.', 'Nem talált. Kérem, ne nyúljon semmihez, előbb feszültségmentesítünk!'],
    time: ['Lejárt az idő! Az óra nem vár, ahogy a lépcsőházi automata sem.', 'Csend a vonalban... ez szakadást jelent. Lejárt az idő.'],
    half: ['Felezünk! Fáziskereső elő, és két rossz válasz kialudt!', 'Felezés! Két válasz ment a szelektív hulladékba.'],
    book: ['Szabványkönyv! Lapozzon csak, a szabvány nem harap. Csak néha.'],
    phone: ['Felhívjuk Teslát! Remélem, nem zárlatos a vonal.', 'Tárcsázom a zsenit! Nikola, vegye fel, kérem!'],
    tesla_hi: ['Halló? Tesla beszél. Áramról van szó? Akkor jó helyen jár, fiatalember.', 'Igen, itt Nikola. Épp egy hatalmas szikrával kísérletezem, de önre mindig van időm.', 'Halló! Váltakozó áramban beszélek, remélem, jól hall. Lássuk azt a kérdést!'],
    tesla_bye: ['Sok sikert! És ne feledje: előbb feszültségmentesítünk, aztán dolgozunk!', 'Ennyi volt, búcsúzom. Az áram legyen önnel!'],
    swap: ['Csere! Ezt a kérdést visszaküldjük a raktárba.'],
    cert: ['Gratulálok, megvan a bizonyítvány! Ezt már senki nem veszi el, még a revizor sem.', 'Bizonyítvány a zsebben! Ha most hibázik, legfeljebb idáig esik vissza.'],
    stop: ['Okos döntés. Az okos villanyszerelő tudja, mikor kell lekapcsolni.'],
    win: ['Hihetetlen! Ön Albert Einstein szintjén áll! Tapsot a stúdiónak, és vigyázat: ne dörzsölje össze a kezét, mert szikrázik!'],
    over: ['Köszönjük a játékot! Legközelebb jöjjön több feszültséggel!', 'Vége a műsornak, de a tanulás nem áll le. Nézze meg a magyarázatot, és vágjon bele újra!'],
  };
  let cur = null, onLine = () => {};
  return {
    set onLine(f) { onLine = f; },
    // plays a random line of a kind; resolves when it ends (or right away when muted / blocked)
    say(kind) {
      const list = LINES[kind]; if (!list) return Promise.resolve();
      const i = Math.floor(Math.random() * list.length);
      onLine(list[i]);
      this.stop();
      if (SFX.muted) return new Promise(r => setTimeout(r, Math.min(2500, 600 + list[i].length * 25)));
      const a = new Audio(`game/voice/${kind}_${i + 1}.mp3`); cur = a;
      // plain talking lines animate the mouth; reaction lines (ok/bad/lock/...) keep the gesture the game set
      const talk = ['intro', 'easy', 'mid', 'hard', 'phone', 'half', 'swap', 'stop', 'over'].includes(kind);
      if (talk) try { window.Studio3D?.host?.('talk'); } catch { /* no studio */ }
      return new Promise(r => { a.onended = a.onerror = () => { if (talk) try { window.Studio3D?.host?.('idle'); } catch { /* no studio */ } r(); }; a.play().catch(() => r()); });
    },
    stop() { if (cur) { cur.pause(); cur = null; } },
    // plays one file, no subtitle callback (Tesla's per-question answer); resolves at the end
    file(src, fallbackMs = 4000) {
      this.stop();
      if (SFX.muted) return new Promise(r => setTimeout(r, fallbackMs));
      const a = new Audio(src); cur = a;
      return new Promise(r => { a.onended = a.onerror = () => r(); a.play().catch(() => r()); });
    },
    lines: LINES,
    // the rank-up line for rank n (game/voice/rank_n.mp3)
    rank(n, text) { onLine(text); return this.file(`game/voice/rank_${n}.mp3`, 2500); },
  };
})();
