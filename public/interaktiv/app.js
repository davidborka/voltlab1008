'use strict';
// Villanyszerelő interaktív vizsga gyakorló — single-file app, no build step.
// Data: window.QUESTIONS / window.TOPICS (data/questions.js), window.EXPLAINERS (data/explainers.js).
// Progress: localStorage, one record set per profile, so several learners can share a device.

const QUESTIONS = window.QUESTIONS || [];
const TOPICS = window.TOPICS || { parts: [], topics: [] };
const EXPLAINERS = window.EXPLAINERS || {};
const BY_ID = Object.fromEntries(QUESTIONS.map(q => [q.id, q]));
const TOPIC = Object.fromEntries(TOPICS.topics.map(t => [t.id, t]));
const PART = Object.fromEntries(TOPICS.parts.map(p => [p.id, p]));
const PROFILES_KEY = 'vvz.profiles';
const LEGACY_KEY = 'vvz.v1'; // single-user version, migrated into the first profile
const EXAM_MIN = 90;
const EXAM_POINTS = 100;
const PASS = 0.4;
const TARGET = 0.75;
const BOX_DAYS = [0, 1, 3, 7, 16, 35];
const DAY = 864e5;
const STRONG = 0.8, WEAK = 0.6, MIN_SEEN = 3; // topic status thresholds
const ELIM_PRACTICE = 10, ELIM_CHECK = 12, ELIM_PASS = 0.8; // weak-spot elimination program

// ---------- storage & profiles ----------
function lsGet(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode: keep in memory */ } }
function lsDel(k) { try { localStorage.removeItem(k); } catch { /* ignore */ } }
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
function emptyState() { return { name: '', stats: {}, history: [], log: [], elim: {}, active: null }; }
function loadProfiles() {
  let p = lsGet(PROFILES_KEY);
  if (!p || !Array.isArray(p.list) || !p.list.length) {
    const legacy = lsGet(LEGACY_KEY), id = newId();
    p = { list: [{ id, name: legacy?.name || 'Vizsgázó', created: Date.now() }], current: id };
    if (legacy) lsSet('vvz.p.' + id, legacy);
    lsSet(PROFILES_KEY, p);
  }
  if (!p.list.some(x => x.id === p.current)) p.current = p.list[0].id;
  return p;
}
let P = loadProfiles();
const profile = () => P.list.find(x => x.id === P.current);
function loadState(id) { const s = Object.assign(emptyState(), lsGet('vvz.p.' + id) || {}); s.name = P.list.find(x => x.id === id)?.name || ''; return s; }
let S = loadState(P.current);
function save() { lsSet('vvz.p.' + P.current, S); }
function saveProfiles() { lsSet(PROFILES_KEY, P); }

// Login: each learner sees only their own results. The PIN is a privacy lock against others on the same
// device, not real security (the data is still in this browser's storage).
const SESSION_KEY = 'vvz.session';
const pinHash = (id, pin) => { let h1 = 0xdeadbeef, h2 = 0x41c6ce57; for (const ch of `${id}:${pin}`) { const c = ch.charCodeAt(0); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); } h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909); h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909); return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36); };
function sessionGet() { try { return sessionStorage.getItem(SESSION_KEY); } catch { return null; } }
function sessionSet(v) { try { v ? sessionStorage.setItem(SESSION_KEY, v) : sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ } }
// a single profile without a PIN logs in by itself, so the one-person case has no extra step
function loggedIn() { const s = sessionGet(); return s === P.current || (s !== 'out' && P.list.length === 1 && !profile().pin); }
function login(id) { save(); P.current = id; saveProfiles(); sessionSet(id); S = loadState(id); view = { name: 'home' }; render(); }
function logout() { save(); sessionSet('out'); view = { name: 'home' }; render(); }
function addProfile(name, pin) { const id = newId(); P.list.push({ id, name, created: Date.now(), ...(pin ? { pin: pinHash(id, pin) } : {}) }); saveProfiles(); login(id); }
function renameProfile(name) { profile().name = name; S.name = name; saveProfiles(); save(); }
function setPin(pin) { if (pin) profile().pin = pinHash(P.current, pin); else delete profile().pin; saveProfiles(); }
function deleteProfile() {
  lsDel('vvz.p.' + P.current);
  P.list = P.list.filter(x => x.id !== P.current);
  if (!P.list.length) P.list.push({ id: newId(), name: 'Vizsgázó', created: Date.now() });
  P.current = P.list[0].id; saveProfiles(); sessionSet(null); S = loadState(P.current); view = { name: 'home' }; render();
}

// ---------- helpers ----------
const $ = (sel, el = document) => el.querySelector(sel);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// question text allows a small HTML subset; everything else is escaped
// "(Alapok: F3 …, M1)" references become links to that foundations section
const rich = s => esc(s).replace(/&lt;(\/?)(b|i|sub|sup|br)\s*\/?&gt;/g, '<$1$2>')
  .replace(/Alapok:[^)]*/g, m => m.replace(/\b([MF]\d{1,2})\b/g, '<a href="#" class="alap-ref" data-ref="$1">$1</a>'));
const plain = s => String(s).replace(/<[^>]*>/g, ''); // for <option>, which can't hold markup
const pct = x => Math.round(x * 100) + '%';
const fmt = n => (Math.round(n * 10) / 10).toString().replace('.', ',');
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const range = n => Array.from({ length: n }, (_, i) => i);
const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const app = document.getElementById('app');
const TYPE_NAME = { single: 'Egyszeres választás', multi: 'Többszörös választás', truefalse: 'Igaz / hamis', order: 'Sorba rendezés', match: 'Párosítás', group: 'Csoportosítás', dropdown: 'Listából választás', number: 'Szám beírása' };

// ---------- grading (KRÉTA rules: no negative, multi with penalty, all-checked = 0) ----------
function parseNum(s) { if (s == null) return NaN; const t = String(s).trim().replace(/\s/g, '').replace(',', '.'); return t === '' ? NaN : Number(t); }
function fieldOk(f, v) {
  const x = parseNum(v); if (!Number.isFinite(x)) return false;
  const tol = f.tolAbs !== undefined ? f.tolAbs : Math.abs(f.answer) * (f.tol ?? 0.02);
  return Math.abs(x - f.answer) <= tol + 1e-9;
}
// matchAssign: rightIdx -> leftIdx; correct for left i iff exactly right i is assigned to it
function matchCorrect(q, a, i) {
  const rights = Object.entries(a.assign || {}).filter(([, l]) => l === i).map(([r]) => +r);
  return rights.length === 1 && rights[0] === i;
}
function grade(q, a) {
  if (!a) return 0;
  switch (q.type) {
    case 'single': return (a.sel || []).length === 1 && a.sel[0] === q.answer[0] ? 1 : 0;
    case 'multi': {
      const sel = a.sel || [];
      if (sel.length === q.options.length) return 0;
      const good = sel.filter(i => q.answer.includes(i)).length, bad = sel.length - good;
      return Math.max(0, (good - bad) / q.answer.length);
    }
    case 'truefalse': return q.statements.filter((s, i) => a.vals?.[i] === s.answer).length / q.statements.length;
    case 'order': return q.items.filter((_, i) => a.pos?.[i] === i).length / q.items.length;
    case 'match': return q.pairs.filter((_, i) => matchCorrect(q, a, i)).length / q.pairs.length;
    case 'group': return q.items.filter((it, i) => a.assign?.[i] === it.group).length / q.items.length;
    case 'dropdown': return q.blanks.filter((b, i) => a.vals?.[i] === b.answer).length / q.blanks.length;
    case 'number': return q.fields.filter((f, i) => fieldOk(f, a.vals?.[i])).length / q.fields.length;
  }
  return 0;
}
function answered(q, a) {
  if (!a) return false;
  const vals = o => Object.values(o || {}).some(v => v !== null && v !== undefined && v !== '');
  switch (q.type) {
    case 'single': case 'multi': return (a.sel || []).length > 0;
    case 'order': return vals(a.pos);
    case 'match': case 'group': return vals(a.assign);
    default: return vals(a.vals);
  }
}

// ---------- learning model ----------
// per question: n, ew (EWMA of score fraction), last, box (Leitner), due, wrong (times < 50 %)
// S.log keeps every attempt (question, topic, score, time) for trends and the progress page.
// guess = the learner marked the answer as a guess: the score stays, but a lucky hit must not read as
// knowledge, so the learning model sees at most GUESS_CAP and the question comes back soon
const GUESS_CAP = 0.4;
function record(q, real, guess = false) {
  const frac = guess ? Math.min(real, GUESS_CAP) : real;
  const st = S.stats[q.id] || { n: 0, ew: null, box: 0, wrong: 0 };
  st.n++;
  st.lastGuess = guess;
  if (guess) st.guessed = (st.guessed || 0) + 1;
  st.ew = st.ew === null ? frac : 0.5 * st.ew + 0.5 * frac;
  st.lastFrac = frac;
  st.last = Date.now();
  if (frac >= 0.999) st.box = Math.min(st.box + 1, BOX_DAYS.length - 1); else st.box = 0;
  if (real < 0.5) st.wrong++;
  st.due = st.last + BOX_DAYS[st.box] * DAY;
  S.stats[q.id] = st;
  S.log.push({ id: q.id, t: q.topic, f: Math.round(frac * 100) / 100, ts: st.last, ...(guess ? { g: 1 } : {}) });
  if (S.log.length > 5000) S.log = S.log.slice(-5000);
}
function topicModel() {
  const m = {};
  for (const t of TOPICS.topics) m[t.id] = { total: 0, seen: 0, sum: 0, wrongNow: 0 };
  for (const q of QUESTIONS) {
    const t = m[q.topic]; if (!t) continue;
    t.total++;
    const st = S.stats[q.id];
    if (st) { t.seen++; t.sum += st.ew; if (st.lastFrac < 0.999) t.wrongNow++; }
  }
  // shrink toward a 50 % prior so two lucky answers don't read as mastery
  for (const t of Object.values(m)) t.mastery = (t.sum + 1) / (t.seen + 2);
  return m;
}
function partModel(tm = topicModel()) {
  const out = {};
  for (const p of TOPICS.parts) {
    const ts = TOPICS.topics.filter(t => t.part === p.id && tm[t.id].total);
    const tot = ts.reduce((s, t) => s + tm[t.id].total, 0) || 1;
    out[p.id] = {
      mastery: ts.reduce((s, t) => s + tm[t.id].mastery * tm[t.id].total, 0) / tot,
      coverage: ts.reduce((s, t) => s + tm[t.id].seen, 0) / tot,
    };
  }
  return out;
}
function predicted(pm = partModel()) { return TOPICS.parts.reduce((s, p) => s + p.weight * (pm[p.id]?.mastery ?? 0), 0); }

// Weak-spot analysis. A topic's exam share is its part weight split evenly across the part's topics
// (the exam composer round-robins topics). lossPts = points it costs on a 100-point exam today,
// gainPts = points won by lifting it to ~90 %. Weak spots are ranked by gainPts.
const STATUS = {
  unknown: { label: 'még nem mért', cls: '' },
  weak: { label: 'gyenge', cls: 'bad' },
  developing: { label: 'fejlesztendő', cls: 'warn' },
  strong: { label: 'erős', cls: 'ok' },
  eliminated: { label: 'felszámolva', cls: 'ok' },
};
function analyze() {
  const tm = topicModel();
  const topicsInPart = {};
  for (const t of TOPICS.topics) if (tm[t.id].total) topicsInPart[t.part] = (topicsInPart[t.part] || 0) + 1;
  const att = {};
  for (const e of S.log) (att[e.t] ||= []).push(e.f);
  const avg = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : null;
  const rows = TOPICS.topics.filter(t => tm[t.id].total).map(t => {
    const m = tm[t.id], a = att[t.id] || [];
    const share = PART[t.part].weight / topicsInPart[t.part];
    const recent = avg(a.slice(-6)), before = avg(a.slice(-12, -6));
    const el = S.elim[t.id];
    let status = m.seen < MIN_SEEN ? 'unknown' : m.mastery >= STRONG ? 'strong' : m.mastery >= WEAK ? 'developing' : 'weak';
    if (status === 'strong' && el?.stage === 'done') status = 'eliminated';
    return {
      t, m, share, recent, status, attempts: a.length,
      trend: recent != null && before != null ? recent - before : null,
      lossPts: share * EXAM_POINTS * (1 - m.mastery),
      gainPts: share * EXAM_POINTS * Math.max(0, 0.9 - m.mastery),
    };
  });
  const weak = rows.filter(r => r.status === 'weak' || r.status === 'developing').sort((a, b) => b.gainPts - a.gainPts);
  const unknown = rows.filter(r => r.status === 'unknown').sort((a, b) => b.share - a.share);
  const types = {};
  for (const e of S.log) { const q = BY_ID[e.id]; if (!q) continue; const x = (types[q.type] ||= { n: 0, sum: 0 }); x.n++; x.sum += e.f; }
  return { rows, weak, unknown, types, byId: Object.fromEntries(rows.map(r => [r.t.id, r])) };
}

// priority for weak-spot / review selection: weak topic, wrong before, due, never seen
function priority(q, tm, now) {
  const st = S.stats[q.id], t = tm[q.topic];
  let p = (1 - t.mastery) * 2;
  if (!st) p += 0.5;
  else {
    p += (1 - st.ew) * 3;
    if (st.due <= now && st.lastFrac < 0.999) p += 2;
    else if (st.due <= now) p += 0.5;
    if (st.lastFrac >= 0.999 && st.due > now) p -= 1.5;
  }
  return Math.max(0.05, p);
}
function weightedPick(pool, weightFn, n) {
  const items = pool.map(q => ({ q, k: Math.pow(Math.random(), 1 / weightFn(q)) })); // Efraimidis–Spirakis
  return items.sort((a, b) => b.k - a.k).slice(0, n).map(x => x.q);
}

// ---------- exam composition ----------
// Real structure: 100 points, parts 20/20/20/40, one sheet ordered by part.
// targeted = same structure, but within each part the tasks come from your weak spots.
function composeExam(targeted = false) {
  const ids = [], tm = topicModel(), now = Date.now();
  for (const p of TOPICS.parts) {
    const budget = Math.round(EXAM_POINTS * p.weight);
    const pool = QUESTIONS.filter(q => q.part === p.id);
    let pts = 0;
    if (targeted) {
      for (const q of weightedPick(pool, q => priority(q, tm, now) ** 2, pool.length)) {
        if (pts + q.points <= budget) { ids.push(q.id); pts += q.points; }
        if (pts >= budget) break;
      }
      continue;
    }
    // round-robin over topics for coverage, like the KKK's per-topic task list; prefer less-seen questions
    const ordered = weightedPick(pool, q => 1 / (1 + (S.stats[q.id]?.n || 0)), pool.length);
    const byTopic = {};
    for (const q of ordered) (byTopic[q.topic] ||= []).push(q);
    const queues = shuffle(Object.values(byTopic));
    let guard = 0;
    while (pts < budget && guard++ < 1000) {
      for (const qu of queues) {
        if (pts >= budget) break;
        const k = qu.findIndex(q => pts + q.points <= budget);
        if (k < 0) continue;
        const [q] = qu.splice(k, 1); ids.push(q.id); pts += q.points;
      }
      if (!queues.some(qu => qu.some(q => pts + q.points <= budget))) break;
    }
  }
  return ids;
}
function composeWeak(n, topics) {
  const tm = topicModel(), now = Date.now();
  const pool = QUESTIONS.filter(q => !topics?.length || topics.includes(q.topic));
  return weightedPick(pool, q => priority(q, tm, now), Math.min(n, pool.length)).map(q => q.id);
}
function composeCheck(tid) {
  // the check exam avoids the questions just practised when the topic has enough others
  const tm = topicModel(), now = Date.now(), last = new Set(S.elim[tid]?.lastPractice || []);
  let pool = QUESTIONS.filter(q => q.topic === tid);
  if (pool.filter(q => !last.has(q.id)).length >= ELIM_CHECK) pool = pool.filter(q => !last.has(q.id));
  return weightedPick(pool, q => priority(q, tm, now), Math.min(ELIM_CHECK, pool.length)).map(q => q.id);
}
function composeReview() {
  const now = Date.now();
  return QUESTIONS.filter(q => S.stats[q.id] && S.stats[q.id].due <= now).sort((a, b) => S.stats[a.id].ew - S.stats[b.id].ew).map(q => q.id);
}
const minutesFor = ids => Math.max(5, Math.ceil(ids.reduce((s, id) => s + BY_ID[id].points, 0) * EXAM_MIN / EXAM_POINTS));

// ---------- weak-spot elimination program ----------
// per topic: learn (read the explainer) → practice (10 tasks with feedback) → check (12-task timed exam, ≥80 % = done)
const ELIM_STEPS = [['learn', 'Tananyag'], ['practice', 'Gyakorlás'], ['check', 'Ellenőrző vizsga'], ['done', 'Felszámolva']];
function elimNext(tid) {
  const el = (S.elim[tid] ||= { stage: 'learn', started: Date.now(), checks: [] });
  save();
  const name = TOPIC[tid].name;
  if (el.stage === 'learn' || el.stage === 'done') { view = { name: 'learn', topic: tid }; return render(); }
  if (el.stage === 'practice') return newSession('practice', composeWeak(ELIM_PRACTICE, [tid]), 0, `Felszámolás · gyakorlás: ${name}`, { elim: tid, stage: 'practice' });
  const ids = composeCheck(tid);
  return newSession('weak', ids, minutesFor(ids), `Felszámolás · ellenőrző vizsga: ${name}`, { elim: tid, stage: 'check' });
}

// ---------- sessions ----------
// mode: exam (KRÉTA rules, timed, no feedback), weak (same rules, adaptive), practice (instant feedback)
function newSession(mode, ids, minutes, title, meta = {}) {
  if (!ids.length) return alertBox('Ehhez nincs elérhető feladat.');
  const shuf = {};
  for (const id of ids) {
    const q = BY_ID[id];
    if (q.type === 'single' || q.type === 'multi') shuf[id] = shuffle(range(q.options.length));
    else if (q.type === 'order') shuf[id] = shuffle(range(q.items.length));
    else if (q.type === 'match') shuf[id] = shuffle(range(q.pairs.length + (q.distractors?.length || 0)));
    else if (q.type === 'group') shuf[id] = shuffle(range(q.items.length));
    else if (q.type === 'dropdown') shuf[id] = q.blanks.map(b => shuffle(range(b.options.length)));
  }
  S.active = { mode, title, ids, idx: 0, answers: {}, locked: [], skipped: [], phase: 'main', shuf, start: Date.now(), minutes, checked: {}, meta };
  save();
  render();
}
const timed = s => s.mode !== 'practice';
function remaining(s) { return s.minutes ? s.start + s.minutes * 60e3 - Date.now() : Infinity; }

function finishSession() {
  const s = S.active; if (!s) return;
  let got = 0, max = 0;
  const parts = {}, items = [];
  for (const id of s.ids) {
    const q = BY_ID[id]; if (!q) continue;
    if (s.mode === 'practice' && !s.checked[id]) continue; // practice: only what was actually checked
    const frac = grade(q, s.answers[id]);
    if (s.mode !== 'practice') record(q, frac, !!s.answers[id]?.guess); // practice records on each check
    got += frac * q.points; max += q.points;
    const p = (parts[q.part] ||= { got: 0, max: 0 }); p.got += frac * q.points; p.max += q.points;
    items.push({ id, frac, a: s.answers[id] || null });
  }
  const res = { mode: s.mode, title: s.title, date: Date.now(), secs: Math.round((Date.now() - s.start) / 1000), got, max, parts, items, meta: s.meta || {} };
  const tid = s.meta?.elim;
  if (tid) {
    const el = (S.elim[tid] ||= { stage: 'learn', started: Date.now(), checks: [] });
    if (s.meta.stage === 'practice' && items.length >= 5) { el.stage = 'check'; el.lastPractice = s.ids; }
    if (s.meta.stage === 'check') {
      const sc = max ? got / max : 0;
      el.checks.push({ date: Date.now(), score: sc });
      el.stage = sc >= ELIM_PASS ? 'done' : 'practice';
      if (el.stage === 'done') el.doneAt = Date.now();
    }
    res.elim = { topic: tid, stage: s.meta.stage, next: el.stage };
  }
  if (max) S.history.push(res);
  if (S.history.length > 300) S.history = S.history.slice(-300);
  S.active = null; save();
  view = max ? { name: 'result', res } : { name: 'home' };
  render();
}

// ---------- rendering: question widgets ----------
// opts.ro = read-only, opts.show = mark right/wrong and reveal solution
let uid = 0; // radio group names must be unique when several questions share a page
function renderQuestion(q, a, sh, opts, onChange) {
  const ro = !!opts.ro, show = !!opts.show, nm = `q${++uid}`;
  const wrap = h(`<div class="${ro ? 'locked' : ''}"></div>`);
  wrap.append(h(`<div class="qmeta"><span class="pill">${esc(TYPE_NAME[q.type])}</span><span class="pill">${esc(PART[q.part]?.name || '')}</span>${opts.exam ? '' : `<span class="pill">${esc(TOPIC[q.topic]?.name || q.topic)}</span>`}<span class="pill">${q.points} pont</span><span class="qid" title="Kérdés azonosító – hibajelzésnél ezt add meg">#${esc(q.id)}</span></div>`));
  wrap.append(h(`<div class="qtitle">${rich(q.q)}</div>`));
  if (q.svg) { const d = h('<div class="qsvg"></div>'); d.innerHTML = q.svg; d.querySelectorAll('script').forEach(x => x.remove()); wrap.append(d); }
  const set = (patch) => { Object.assign(a, patch); onChange && onChange(); };
  const body = h('<div></div>'); wrap.append(body);

  if (q.type === 'single' || q.type === 'multi') {
    const multi = q.type === 'multi';
    a.sel ||= [];
    if (multi) body.append(h('<p class="small muted">Több helyes válasz is lehet. Hibás jelölésért pontlevonás jár.</p>'));
    const list = h('<div class="opts"></div>');
    for (const i of sh) {
      const sel = a.sel.includes(i), right = q.answer.includes(i);
      let cls = sel ? 'sel' : '';
      if (show) cls = right ? (sel || !multi ? 'right' : 'right miss') : (sel ? 'wrong' : '');
      const why = show && sel && !right && q.wrongWhy?.[i] ? `<span class="why">${rich(q.wrongWhy[i])}</span>` : show && !sel && right && multi ? '<span class="why" style="color:var(--ok)">Ezt is meg kellett volna jelölni.</span>' : '';
      const el = h(`<label class="opt ${cls}"><input type="${multi ? 'checkbox' : 'radio'}" name="${nm}" ${sel ? 'checked' : ''} ${ro ? 'disabled' : ''}><span>${rich(q.options[i])}${why}</span></label>`);
      el.querySelector('input').addEventListener('change', e => {
        if (multi) set({ sel: e.target.checked ? [...a.sel, i] : a.sel.filter(x => x !== i) });
        else set({ sel: [i] });
        list.querySelectorAll('.opt').forEach(o => o.classList.toggle('sel', o.querySelector('input').checked));
      });
      list.append(el);
    }
    body.append(list);
  }

  if (q.type === 'truefalse') {
    a.vals ||= {};
    const g = h('<div class="tf"></div>');
    q.statements.forEach((s, i) => {
      const v = a.vals[i];
      const cls = show ? (v === s.answer ? 'right' : 'wrong') : '';
      const sol = show && v !== s.answer ? ` <b>(${s.answer ? 'igaz' : 'hamis'})</b>` : '';
      g.append(h(`<div class="st ${cls}">${rich(s.text)}${sol}</div>`));
      const seg = h(`<div class="seg" role="radiogroup"><label><input type="radio" name="${nm}-${i}" value="1" ${v === true ? 'checked' : ''} ${ro ? 'disabled' : ''}>Igaz</label><label><input type="radio" name="${nm}-${i}" value="0" ${v === false ? 'checked' : ''} ${ro ? 'disabled' : ''}>Hamis</label></div>`);
      seg.querySelectorAll('input').forEach(inp => inp.addEventListener('change', () => set({ vals: { ...a.vals, [i]: inp.value === '1' } })));
      g.append(seg);
    });
    body.append(g);
  }

  if (q.type === 'dropdown') {
    a.vals ||= {};
    const d = h('<div class="dd-text"></div>');
    const parts = q.text.split(/(\{\d+\})/);
    for (const p of parts) {
      const m = p.match(/^\{(\d+)\}$/);
      if (!m) { d.append(document.createRange().createContextualFragment(rich(p))); continue; }
      const k = +m[1], b = q.blanks[k], v = a.vals[k];
      const cls = show ? (v === b.answer ? 'right' : 'wrong') : '';
      const sel = h(`<select class="${cls}" ${ro ? 'disabled' : ''} aria-label="${k + 1}. hely"><option value="">– válasszon –</option>${(Array.isArray(sh?.[k]) ? sh[k] : range(b.options.length)).map(j => `<option value="${j}" ${v === j ? 'selected' : ''}>${esc(plain(b.options[j]))}</option>`).join('')}</select>`);
      sel.addEventListener('change', () => set({ vals: { ...a.vals, [k]: sel.value === '' ? null : +sel.value } }));
      d.append(sel);
      if (show && v !== b.answer) d.append(h(`<b class="small" style="color:var(--ok)">[${rich(b.options[b.answer])}]</b>`));
    }
    body.append(d);
  }

  if (q.type === 'number') {
    a.vals ||= {};
    body.append(h('<p class="small muted">Tizedesvessző vagy pont is használható (pl. 10,14).</p>'));
    const g = h('<div class="nums"></div>');
    q.fields.forEach((f, i) => {
      const v = a.vals[i] ?? '';
      const cls = show ? (fieldOk(f, v) ? 'right' : 'wrong') : '';
      const el = h(`<label><span>${rich(f.label)}</span><input inputmode="decimal" autocomplete="off" class="${cls}" value="${esc(v)}" ${ro ? 'disabled' : ''}><span>${esc(f.unit || '')}</span></label>`);
      el.querySelector('input').addEventListener('input', e => set({ vals: { ...a.vals, [i]: e.target.value } }));
      g.append(el);
      if (show && !fieldOk(f, v)) g.append(h(`<div class="small" style="color:var(--ok)">Helyes: <b>${fmtAns(f.answer)} ${esc(f.unit || '')}</b></div>`));
    });
    body.append(g);
  }

  if (q.type === 'order' || q.type === 'match' || q.type === 'group') body.append(renderSlots(q, a, sh, ro, show, set));
  return wrap;
}
function fmtAns(x) { return String(Math.round(x * 1000) / 1000).replace('.', ','); }

// KRÉTA layout: slots on the left, items with a number dropdown on the right; drag and drop also works.
function renderSlots(q, a, sh, ro, show, set) {
  const kind = q.type;
  const key = kind === 'order' ? 'pos' : 'assign';
  a[key] ||= {};
  let slotLabels, itemTexts, leftTitle, rightTitle;
  if (kind === 'order') { slotLabels = q.items.map((_, i) => `${i + 1}.`); itemTexts = q.items; leftTitle = 'Sorba rendezés helye'; rightTitle = 'Sorba rendezendő elemek'; }
  if (kind === 'match') { slotLabels = q.pairs.map((p, i) => `${i + 1}. ${p[0]}`); itemTexts = [...q.pairs.map(p => p[1]), ...(q.distractors || [])]; leftTitle = 'Válaszlehetőségek'; rightTitle = 'Párosítandó elemek'; }
  if (kind === 'group') { slotLabels = q.groups.map((g, i) => `${i + 1}. ${g}`); itemTexts = q.items.map(i => i.text); leftTitle = 'Csoportok'; rightTitle = 'Csoportosítandó elemek'; }
  const right = (it) => kind === 'order' ? a.pos[it] === it : kind === 'match' ? (it < q.pairs.length ? a.assign[it] === it && matchCorrect(q, a, it) : a.assign[it] == null) : a.assign[it] === q.items[it].group;
  // KRÉTA: in matching every option takes exactly one item, so extra items stay unplaced; say so up front
  const extra = kind === 'match' ? q.distractors?.length || 0 : 0;
  const hint = kind === 'match' ? `Minden válaszlehetőséghez pontosan egy elem tartozik${extra ? `, ezért <b>${extra} elem kimarad</b> (egyikhez sem tartozik)` : ''}. Ha egy foglalt számot választasz, az előző elem onnan visszakerül.`
    : kind === 'group' ? 'Egy csoportba több elem is kerülhet.' : '';
  const wrap = h(`<div>${hint && !ro ? `<p class="small muted">${hint}</p>` : ''}<div class="two"><div><h4>${leftTitle}</h4><div class="slots"></div></div><div><h4>${rightTitle}</h4><div class="pool"></div></div></div></div>`);
  const slots = $('.slots', wrap), pool = $('.pool', wrap);
  const assign = (it, slot) => {
    const m = { ...a[key] };
    // order & match: one item per slot, so evict the previous occupant
    if (slot !== null && kind !== 'group') for (const [k, v] of Object.entries(m)) if (v === slot && +k !== it) m[k] = null;
    m[it] = slot;
    set({ [key]: m });
    redraw();
  };
  function redraw() {
    slots.innerHTML = ''; pool.innerHTML = '';
    slotLabels.forEach((lab, s) => {
      const sl = h(`<div class="slot" data-slot="${s}"><div class="lab">${rich(lab)}</div></div>`);
      for (const it of sh) if (a[key][it] === s) {
        const cls = show ? (right(it) ? 'right' : 'wrong') : '';
        sl.append(h(`<span class="chip ${cls}">${rich(itemTexts[it])}</span>`));
      }
      if (!ro) {
        sl.addEventListener('dragover', e => { e.preventDefault(); sl.classList.add('over'); });
        sl.addEventListener('dragleave', () => sl.classList.remove('over'));
        sl.addEventListener('drop', e => { e.preventDefault(); assign(+e.dataTransfer.getData('text/plain'), s); });
      }
      slots.append(sl);
    });
    for (const it of sh) {
      const v = a[key][it];
      const el = h(`<div class="item ${v != null ? 'placed' : ''}" draggable="${!ro}"><select ${ro ? 'disabled' : ''} aria-label="hely"><option value="">–</option>${slotLabels.map((_, s) => `<option value="${s}" ${v === s ? 'selected' : ''}>${s + 1}.</option>`).join('')}</select><span>${rich(itemTexts[it])}</span></div>`);
      el.querySelector('select').addEventListener('change', e => assign(it, e.target.value === '' ? null : +e.target.value));
      el.addEventListener('dragstart', e => e.dataTransfer.setData('text/plain', String(it)));
      pool.append(el);
    }
    if (show) {
      let sol;
      if (kind === 'order') sol = q.items.map((t, i) => `${i + 1}. ${rich(t)}`).join('<br>');
      if (kind === 'match') sol = q.pairs.map(p => `${rich(p[0])} → <b>${rich(p[1])}</b>`).join('<br>');
      if (kind === 'group') sol = q.groups.map((g, gi) => `<b>${rich(g)}:</b> ${q.items.filter(x => x.group === gi).map(x => rich(x.text)).join(', ')}`).join('<br>');
      pool.append(h(`<div class="small" style="padding:6px 4px"><b style="color:var(--ok)">Helyes megoldás:</b><br>${sol}</div>`));
    }
  }
  redraw();
  return wrap;
}

function explanationBox(q, frac, guess = false) {
  const cls = frac >= 0.999 ? '' : frac > 0 ? 'part' : 'bad';
  const head = (frac >= 0.999 ? '✔ Helyes' : frac > 0 ? `◐ Részben helyes (${pct(frac)})` : '✘ Hibás') + (guess ? ' · 🎲 tippelve' : '');
  if (guess && frac >= 0.999) frac = 0.5; // a lucky guess still gets the full study help
  const box = h(`<div class="feedback ${cls}"><h3>${head}</h3><div>${rich(q.explanation)}</div>${q.work ? workBox(q.work, frac < 0.999) : ''}<div class="src">Forrás: ${esc(q.source)}</div>
    <div class="row">${EXPLAINERS[q.topic] && frac < 0.999 ? `<button class="btn small learn-link">📘 Tananyag: ${esc(TOPIC[q.topic]?.name || q.topic)}</button>` : ''}
    ${q.work && EXPLAINERS.alapok ? '<button class="btn small basics-link">🧮 Matek és fizika alapok</button>' : ''}</div></div>`);
  $('.learn-link', box)?.addEventListener('click', () => openExplainer(q.topic));
  $('.basics-link', box)?.addEventListener('click', () => openExplainer('alapok'));
  return box;
}
// worked solution: data → steps (what we do, the calculation, why it is allowed) → sanity check
function workBox(w, open) {
  return `<details class="work"${open ? ' open' : ''}><summary>🧮 Levezetés lépésről lépésre</summary>
    ${w.given?.length ? `<div class="given"><b>Adatok:</b> ${w.given.map(rich).join(' · ')}</div>` : ''}
    <ol>${w.steps.map(x => `<li><div>${rich(x.do)}</div>${x.calc ? `<code>${rich(x.calc)}</code>` : ''}${x.why ? `<div class="why">Miért? ${rich(x.why)}</div>` : ''}</li>`).join('')}</ol>
    ${w.check ? `<div class="check">✔ Ellenőrzés: ${rich(w.check)}</div>` : ''}</details>`;
}

// ---------- study explainers ----------
const para = s => rich(s).replace(/\n/g, '<br>');
function renderExplainer(tid) {
  const e = EXPLAINERS[tid], t = TOPIC[tid] || (e && { name: e.title });
  if (!e) return h(`<article class="explainer"><h1>${esc(t?.name || tid)}</h1><p class="muted">Ehhez a témához még nincs tananyag. A feladatok magyarázatai a Hibanaplóban olvashatók.</p></article>`);
  const el = h(`<article class="explainer" data-tid="${esc(tid)}">
    <div class="eyebrow">${t.part ? `${t.part}. vizsgarész · ${esc(PART[t.part].name)}` : 'Alapok · ide vezet vissza minden képlet'}</div>
    <h1>${rich(e.title)}</h1>
    <p class="lead">${para(e.summary)}</p>
    ${(e.videos || []).map(v => `<figure class="ex-video"><video controls preload="none" src="${esc(v.src)}"${v.poster ? ` poster="${esc(v.poster)}"` : ''}></video><figcaption>🎬 ${rich(v.title)}${v.mins ? ` · ${v.mins} perc` : ''} <span class="muted">· NotebookLM-videó</span>${v.note ? `<br><b>Javítás:</b> ${rich(v.note)}` : ''}</figcaption></figure>`).join('')}
    ${tid !== 'alapok' && EXPLAINERS.alapok && e.formulas?.length ? '<p><button class="btn small basics-link">🧮 Elakadtál egy képletnél? Matek és fizika alapok</button></p>' : ''}
    ${e.keyFacts?.length ? `<h2>Amit tudni kell</h2><table class="facts">${e.keyFacts.map(k => `<tr><th>${rich(k.k)}</th><td>${rich(k.v)}</td></tr>`).join('')}</table>` : ''}
    ${e.formulas?.length ? `<h2>Képletek</h2><div class="formulas">${e.formulas.map(f => `<div class="formula"><code>${rich(f.f)}</code>${f.note ? `<span>${rich(f.note)}</span>` : ''}${f.derive?.length ? `<details><summary>Honnan jön ez a képlet?</summary><ol>${f.derive.map(x => `<li>${rich(x)}</li>`).join('')}</ol></details>` : ''}</div>`).join('')}</div>` : ''}
    <div class="ex-svg"></div>
    ${e.sections.length >= 6 ? `<nav class="toc">${e.sections.map((s, i) => `<a href="#" data-sec="${i}">${rich(s.h)}</a>`).join('')}</nav>` : ''}
    ${e.sections.map((s, i) => `<section data-sec="${i}" data-code="${esc((s.h.match(/^[MF]\d{1,2}\b/) || [''])[0])}"><h2>${rich(s.h)}</h2>${s.body ? `<p>${para(s.body)}</p>` : ''}${s.bullets?.length ? `<ul>${s.bullets.map(b => `<li>${rich(b)}</li>`).join('')}</ul>` : ''}</section>`).join('')}
    <h2>Tipikus hibák</h2><ul class="mistakes">${e.mistakes.map(m => `<li>${rich(m)}</li>`).join('')}</ul>
    ${e.hooks?.length ? `<h2>Jegyezd meg</h2><ul class="hooks">${e.hooks.map(m => `<li>${rich(m)}</li>`).join('')}</ul>` : ''}
    <p class="src">Források: ${e.sources.map(esc).join(' · ')}</p>
  </article>`);
  $('.basics-link', el)?.addEventListener('click', () => openExplainer('alapok'));
  if (e.svg) { const d = h('<div class="qsvg"></div>'); d.innerHTML = e.svg; d.querySelectorAll('script').forEach(x => x.remove()); $('.ex-svg', el).append(d); }
  return el;
}
document.addEventListener('click', ev => {
  const a = ev.target.closest('.alap-ref, .toc a'); if (!a) return;
  ev.preventDefault();
  if (a.dataset.sec) return a.closest('.explainer').querySelector(`section[data-sec="${a.dataset.sec}"]`)?.scrollIntoView({ behavior: 'smooth' });
  const here = a.closest('.explainer[data-tid="alapok"]');
  if (!here) openExplainer('alapok');
  const sec = here ? here.querySelector(`section[data-code="${a.dataset.ref}"]`) : [...document.querySelectorAll('.overlay').values()].at(-1).querySelector(`section[data-code="${a.dataset.ref}"]`);
  if (sec) { sec.scrollIntoView(); sec.classList.add('flash'); }
});
function openExplainer(tid) {
  const o = h(`<div class="overlay"><div class="sheet"><div class="row" style="justify-content:flex-end"><button class="btn">Bezárás ✕</button></div></div></div>`);
  $('.sheet', o).append(renderExplainer(tid));
  $('button', o).addEventListener('click', () => o.remove());
  o.addEventListener('click', e => { if (e.target === o) o.remove(); });
  document.body.append(o);
}

// ---------- views ----------
let view = { name: 'home' };
let tick = null;

function render() {
  clearInterval(tick);
  app.innerHTML = '';
  if (!loggedIn()) return renderLogin();
  if (S.active) return renderSession();
  const views = { result: () => renderResult(view.res), start: () => renderStart(view.mode), mistakes: renderMistakes, learn: () => renderLearn(view.topic), library: renderLibrary, elim: renderElim, progress: renderProgress };
  return (views[view.name] || renderHome)();
}
const goView = v => { view = v; render(); scrollTo(0, 0); };
const back = () => '<button class="btn" data-back>← Főoldal</button>';
function wireBack(el) { el.querySelectorAll('[data-back]').forEach(b => b.addEventListener('click', () => goView({ name: 'home' }))); }
const trendIcon = t => t == null ? '' : t > 0.1 ? '<span class="trend up" title="javul">▲</span>' : t < -0.1 ? '<span class="trend down" title="romlik">▼</span>' : '<span class="trend" title="stagnál">▬</span>';
const statusPill = st => `<span class="pill ${STATUS[st].cls}">${STATUS[st].label}</span>`;

function profileBar() {
  const el = h(`<div class="profile-bar"><span>👤 <b>${esc(profile().name)}</b> <span class="muted small">${profile().pin ? '🔒 PIN-nel védett' : 'nincs PIN'}</span></span>
    <button class="btn small" id="ppin">${profile().pin ? 'PIN módosítása' : 'PIN beállítása'}</button><button class="btn small" id="pren">Átnevezés</button>
    <button class="btn small danger" id="pdel">Profil törlése</button><button class="btn small" id="pout">Kilépés</button></div>`);
  $('#ppin', el).addEventListener('click', () => promptBox('Új PIN (4–8 számjegy; üresen hagyva a PIN törlődik):', '', v => {
    if (v && !/^\d{4,8}$/.test(v)) return alertBox('A PIN 4–8 számjegy legyen.');
    setPin(v); render();
  }, true));
  $('#pren', el).addEventListener('click', () => promptBox('Új név:', profile().name, n => { if (n) { renameProfile(n); render(); } }));
  $('#pdel', el).addEventListener('click', () => confirmBox(`Törlöd „${profile().name}” profilját és összes eredményét?`, deleteProfile));
  $('#pout', el).addEventListener('click', logout);
  return el;
}

// login screen: names only, never anyone's results
function renderLogin() {
  const el = h(`<div class="start"><div class="card">
    <h1>Ki vizsgázik?</h1>
    <p class="muted">Mindenki csak a saját eredményeit látja. Ha többen használjátok ezt a gépet, állíts be PIN-t.</p>
    <div class="login-list">${P.list.map(p => `<button class="btn login" data-id="${p.id}">👤 ${esc(p.name)} ${p.pin ? '🔒' : ''}</button>`).join('')}</div>
    <h2 style="margin-top:22px">Új vizsgázó</h2>
    <div class="field"><label for="nn">Név</label><input id="nn" placeholder="pl. Kovács János"></div>
    <div class="field"><label for="np">PIN (4–8 számjegy, ajánlott)</label><input id="np" inputmode="numeric" type="password" autocomplete="new-password"></div>
    <div class="row"><button class="btn primary" id="add">Létrehozás és belépés</button></div>
    <p class="small muted" style="margin-top:16px">Az adatok csak ebben a böngészőben tárolódnak. A PIN a többi felhasználó elől zárja el az eredményeidet ezen a gépen, de nem titkosítás.</p>
  </div></div>`);
  el.querySelectorAll('[data-id]').forEach(b => b.addEventListener('click', () => {
    const p = P.list.find(x => x.id === b.dataset.id);
    if (!p.pin) return login(p.id);
    promptBox(`${p.name} – PIN:`, '', v => { if (v != null && pinHash(p.id, v) === p.pin) login(p.id); else if (v != null) alertBox('Hibás PIN.'); }, true);
  }));
  $('#add', el).addEventListener('click', () => {
    const n = $('#nn', el).value.trim(), pin = $('#np', el).value.trim();
    if (!n) return alertBox('Add meg a nevet.');
    if (pin && !/^\d{4,8}$/.test(pin)) return alertBox('A PIN 4–8 számjegy legyen.');
    addProfile(n, pin);
  });
  app.append(el);
}

function renderHome() {
  const tm = topicModel(), pm = partModel(tm), pred = predicted(pm), A = analyze();
  const seen = Object.keys(S.stats).filter(id => BY_ID[id]).length;
  const due = composeReview().length;
  const exams = S.history.filter(r => r.mode === 'exam');
  const lastExam = exams.at(-1);
  const wrongNow = QUESTIONS.filter(q => S.stats[q.id] && S.stats[q.id].lastFrac < 0.999).length;
  const ready = pred >= TARGET && seen >= QUESTIONS.length * 0.6;
  const activeElim = Object.entries(S.elim).filter(([, e]) => e.stage !== 'done').length;
  const el = h(`<div class="dash">
    <div class="topbar"><div class="logo"><svg width="20" height="20" viewBox="0 0 24 24"><path d="M14 1 4 14h6l-2 9 10-13h-6z" fill="#fff"/></svg></div>
      <div><div class="t">Villanyszerelő – interaktív vizsga gyakorló ${window.top === window ? '<a class="small" href="../" style="font-weight:400;margin-left:8px">← VOLT LAB 1008</a>' : ''}</div><div class="s">Épületvillamosság · KKK 4 0713 04 07 · 90 perc · sikeres ≥ 40 %, cél 70–80 %</div></div></div>
    <div id="pb"></div>
    <div class="grid">
      <div class="card"><h2>Vizsgakészség <span class="pill ${ready ? 'ok' : ''}">${ready ? 'vizsgakész' : 'gyakorlás alatt'}</span></h2>
        <div class="kpi"><div><span>Becsült eredmény</span><b class="big" style="color:${seen < 10 ? 'var(--muted)' : pred >= TARGET ? 'var(--ok)' : pred >= PASS ? 'var(--accent)' : 'var(--bad)'}">${seen < 10 ? '–' : pct(pred)}</b></div>
          <div><span>Utolsó próbavizsga</span><b>${lastExam ? pct(lastExam.got / lastExam.max) : '–'}</b></div>
          <div><span>Látott kérdés</span><b>${seen} / ${QUESTIONS.length}</b></div></div>
        <div class="small muted" style="margin-bottom:8px">Vizsgarészek (súly) – elsajátítás</div>
        ${TOPICS.parts.map(p => `<div class="part-row"><span>${p.id}. ${esc(p.name)} <span class="muted">(${pct(p.weight)})</span></span><div class="bar ${pm[p.id].mastery >= TARGET ? 'ok' : pm[p.id].mastery < PASS ? 'bad' : ''}"><i style="width:${pm[p.id].coverage ? pct(pm[p.id].mastery) : 0}"></i></div><b>${pm[p.id].coverage ? pct(pm[p.id].mastery) : '–'}</b></div>`).join('')}
        ${seen < 10 ? '<p class="small"><b>Kezdd egy teljes próbavizsgával</b> – ebből látja a rendszer, hol tartasz.</p>' : ''}
        <p class="small muted">A becslés témánként súlyozott, 50 %-os kiindulásból indul, és minden válasszal pontosodik. ${pct(TARGET)} feletti becslés + a kérdések ≥60 %-ának látása = vizsgakész.</p>
      </div>
      <div class="card"><h2>Mit csináljak most?</h2><div class="modes">
        <div class="mode"><div><b>Teljes próbavizsga</b><p>Valós KRÉTA-szabályok: ${EXAM_MIN} perc, ${EXAM_POINTS} pont, I–IV. rész 20/20/20/40 %.</p></div><button class="btn primary" data-go="exam">Indítás</button></div>
        <div class="mode"><div><b>Célzott vizsga</b><p>Ugyanaz a vizsgaszerkezet, de a feladatok a gyengeségeidre szabva.</p></div><button class="btn" data-go="targeted" ${seen ? '' : 'disabled'}>Indítás</button></div>
        <div class="mode"><div><b>Gyengeség-felszámolás</b><p>Témánként: tananyag → gyakorlás → ellenőrző vizsga (≥80 %).</p></div><button class="btn" data-view="elim">${activeElim ? `${activeElim} folyamatban` : 'Megnyitás'}</button></div>
        <div class="mode"><div><b>Gyakorlás magyarázattal</b><p>Azonnali megoldás és magyarázat minden feladat után.</p></div><button class="btn" data-go="practice">Indítás</button></div>
        <div class="mode"><div><b>Esedékes ismétlés</b><p>Térközös ismétlés: amit elrontottál, hamar visszajön.</p></div><button class="btn" data-go="review" ${due ? '' : 'disabled'}>${due} db</button></div>
        <div class="mode"><div><b>Hibanapló</b><p>Jelenleg hibás kérdéseid témánként, magyarázattal.</p></div><button class="btn" data-view="mistakes" ${wrongNow ? '' : 'disabled'}>${wrongNow} db</button></div>
        <div class="mode"><div><b>Tananyag</b><p>Témánkénti magyarázók a tanfolyami anyagokból.</p></div><button class="btn" data-view="library">Megnyitás</button></div>
      </div></div>
      <div class="card wide"><h2>Gyengeségeim <span class="small muted">ahol a legtöbb pontot nyerheted – a lista a válaszaidból frissül</span></h2><div id="weak"></div></div>
      <div class="card"><h2>Haladás <button class="btn small" data-view="progress">Összes eredmény</button></h2>
        ${exams.length > 1 ? chart(exams.slice(-20).map(r => r.got / r.max)) : '<p class="muted small">Két teljes próbavizsga után itt látod a fejlődési görbédet.</p>'}
        ${historyTable(S.history.slice(-6).reverse(), S.history.length - 1)}
        <div class="row" style="margin-top:14px"><button class="btn small" id="exp">Eredmények mentése (JSON)</button><label class="btn small">Betöltés<input type="file" accept="application/json" id="imp" hidden></label><button class="btn small danger" id="reset">Nullázás</button></div>
        <p class="small muted">Az eredmények ebben a böngészőben, vizsgázónként tárolódnak. Más eszközre a mentés/betöltés gombbal viheted át.</p>
      </div>
    </div></div>`);
  $('#pb', el).replaceWith(profileBar());
  $('#weak', el).append(weakList(A, 5));
  el.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => {
    const g = b.dataset.go;
    if (g === 'review') return newSession('practice', composeReview().slice(0, 40), 0, 'Ismétlés');
    goView({ name: 'start', mode: g });
  }));
  el.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => goView({ name: b.dataset.view })));
  wireHistory(el);
  $('#exp', el).addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({ ...S, active: null }, null, 1)], { type: 'application/json' });
    const u = URL.createObjectURL(blob); const l = document.createElement('a');
    l.href = u; l.download = `villanyszerelo-${profile().name.replace(/\W+/g, '_')}-${new Date().toISOString().slice(0, 10)}.json`; l.click(); URL.revokeObjectURL(u);
  });
  $('#imp', el).addEventListener('change', async e => {
    try { const d = JSON.parse(await e.target.files[0].text()); if (!d.stats) throw 0; S = Object.assign(emptyState(), d, { active: null, name: profile().name }); save(); render(); }
    catch { alertBox('A fájl nem érvényes eredménymentés.'); }
  });
  $('#reset', el).addEventListener('click', () => confirmBox(`Biztosan törlöd ${profile().name} összes eredményét?`, () => { S = Object.assign(emptyState(), { name: profile().name }); save(); render(); }));
  app.append(el);
}

// ranked weak spots with the actions to fix them
function weakList(A, limit) {
  const box = h('<div></div>');
  if (!A.weak.length && !A.unknown.length) { box.append(h('<p class="muted small">Nincs mért gyengeséged. 👏</p>')); return box; }
  if (!A.weak.length) box.append(h(`<p class="muted small">Még nincs elég adat. Írj egy teljes próbavizsgát, vagy gyakorolj: témánként ${MIN_SEEN} megválaszolt kérdés után mérhető.</p>`));
  for (const r of A.weak.slice(0, limit)) {
    const el = S.elim[r.t.id];
    const row = h(`<div class="weak-row"><div class="wr-main"><div><b>${r.t.part}. ${esc(r.t.name)}</b> ${statusPill(r.status)} ${trendIcon(r.trend)}</div>
      <div class="bar ${r.status === 'weak' ? 'bad' : ''}"><i style="width:${pct(r.m.mastery)}"></i></div>
      <div class="small muted">${pct(r.m.mastery)} · ${r.m.seen}/${r.m.total} kérdés látva · jelenleg ~${fmt(r.lossPts)} pontot veszítesz rajta · <b style="color:var(--ok)">+${fmt(r.gainPts)} pont</b> nyerhető</div></div>
      <div class="wr-act"><button class="btn small" data-l>📘 Tananyag</button><button class="btn small primary" data-e>${el && el.stage !== 'done' ? `Folytatás: ${ELIM_STEPS.find(s => s[0] === el.stage)[1]}` : 'Felszámolás'}</button></div></div>`);
    $('[data-l]', row).addEventListener('click', () => openExplainer(r.t.id));
    $('[data-e]', row).addEventListener('click', () => elimNext(r.t.id));
    box.append(row);
  }
  if (A.unknown.length) box.append(h(`<p class="small muted" style="margin-top:10px">Még nem mért témák (${A.unknown.length}): ${A.unknown.map(r => esc(r.t.name)).join(', ')}.</p>`));
  return box;
}

function historyTable(rows, lastIndex) {
  if (!rows.length) return '<p class="muted">Még nincs kitöltött feladatsor.</p>';
  return `<table class="hist"><tr><th>Dátum</th><th>Feladatsor</th><th>Eredmény</th><th></th></tr>${rows.map((r, i) => `<tr><td>${new Date(r.date).toLocaleString('hu-HU', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td><td>${esc(r.title)}</td><td><b style="color:${r.got / r.max >= 0.7 ? 'var(--ok)' : r.got / r.max >= PASS ? 'var(--accent)' : 'var(--bad)'}">${pct(r.got / r.max)}</b> <span class="muted small">${fmt(r.got)}/${r.max}</span></td><td><button class="btn small" data-hist="${S.history.indexOf(r)}">Megnéz</button></td></tr>`).join('')}</table>`;
}
function wireHistory(el) { el.querySelectorAll('[data-hist]').forEach(b => b.addEventListener('click', () => goView({ name: 'result', res: S.history[+b.dataset.hist] }))); }

function chart(vals) {
  const W = 400, H = 120, n = vals.length, x = i => 20 + i * (W - 30) / Math.max(1, n - 1), y = v => H - 10 - v * (H - 20);
  const pts = vals.map((v, i) => `${x(i)},${y(v)}`).join(' ');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Próbavizsgák eredménye">
    <line x1="20" x2="${W - 10}" y1="${y(PASS)}" y2="${y(PASS)}" stroke="#c62828" stroke-dasharray="4 4"/><text x="${W - 12}" y="${y(PASS) - 3}" font-size="10" text-anchor="end" fill="#c62828">40 %</text>
    <line x1="20" x2="${W - 10}" y1="${y(TARGET)}" y2="${y(TARGET)}" stroke="#2e8540" stroke-dasharray="4 4"/><text x="${W - 12}" y="${y(TARGET) - 3}" font-size="10" text-anchor="end" fill="#2e8540">cél 75 %</text>
    <polyline points="${pts}" fill="none" stroke="#f39200" stroke-width="2"/>${vals.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="3" fill="#f39200"/>`).join('')}</svg>`;
}

function renderStart(mode) {
  const tm = topicModel();
  const titles = { exam: 'Teljes próbavizsga', targeted: 'Célzott vizsga', weak: 'Gyengeségeim mini-vizsga', practice: 'Gyakorlás magyarázattal' };
  const rules = `<ul>
      <li>${EXAM_MIN} perc, ${EXAM_POINTS} pont; I. Alkatrész és anyagismeret 20 %, II. Technológia 20 %, III. Számítás 20 %, IV. Villamos biztonság 40 %.</li>
      <li>Ha nem tudod a választ, ne jelölj semmit, lépj tovább a <b>Következő feladat</b> gombbal: az átlépett feladatokat a végén még egyszer megkapod.</li>
      <li>Ha legalább egy választ megjelöltél, továbblépés után <b>már nem módosítható</b>.</li>
      <li>Többszörös választásnál a rossz jelölés pontot von le, mindent bejelölve 0 pont. Negatív pont nincs.</li>
      <li>Lejáró időnél a vizsga automatikusan befejeződik. Sikeres: ≥ 40 %. A célod: 70–80 %.</li></ul>`;
  const el = h(`<div class="start"><div class="card">
    <h1>${titles[mode]}</h1>
    ${mode === 'exam' ? `<p>Ugyanúgy működik, mint a KRÉTA interaktív vizsga:</p>${rules}` : ''}
    ${mode === 'targeted' ? `<p>Valódi vizsgaszerkezet és szabályok, de minden vizsgarészen belül a feladatok a leggyengébb témáidból, az elrontott és az esedékes kérdésekből jönnek. Így a vizsgát a gyengeségeidre tervezve gyakorolod.</p>${rules}` : ''}
    ${mode === 'weak' ? `<p>Rövid, időre menő feladatsor a leggyengébb témáidból és a korábban elrontott kérdésekből (KRÉTA-szabályok, visszajelzés a végén).</p>` : ''}
    ${mode === 'practice' ? `<p>Minden feladat után <b>Ellenőrzés</b>: azonnal látod a helyes megoldást, a magyarázatot, hogy miért rossz a választott lehetőség, és a téma tananyagát.</p>` : ''}
    <div class="field"><label for="nm">Vizsgázó neve</label><input id="nm" value="${esc(profile().name)}"></div>
    ${mode === 'weak' || mode === 'practice' ? `<div class="field"><label for="cnt">Feladatok száma</label><select id="cnt">${[10, 20, 30, 45].map(n => `<option ${n === (mode === 'weak' ? 30 : 20) ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
      <div class="field"><span>Témák <span class="muted small">(üresen hagyva: ${mode === 'weak' ? 'a rendszer választ a gyengeségeid alapján' : 'mind'})</span></span><div class="chk">${TOPICS.topics.filter(t => tm[t.id].total).map(t => `<label><input type="checkbox" value="${t.id}">${t.part}. ${esc(t.name)}</label>`).join('')}</div></div>` : ''}
    <div class="row" style="margin-top:18px">${back()}<button class="btn primary" id="go">${mode === 'practice' ? 'Gyakorlás indítása' : 'Személyes adatok rendben vannak – Teszt megkezdése'}</button></div>
    ${QUESTIONS.length ? '' : '<p style="color:var(--bad)">Nincs betöltött kérdésbank (data/questions.js).</p>'}
  </div></div>`);
  wireBack(el);
  $('#go', el).addEventListener('click', () => {
    const nm = $('#nm', el).value.trim(); if (nm && nm !== profile().name) renameProfile(nm);
    if (mode === 'exam') return newSession('exam', composeExam(), EXAM_MIN, 'Teljes próbavizsga');
    if (mode === 'targeted') return newSession('exam', composeExam(true), EXAM_MIN, 'Célzott vizsga');
    const n = +$('#cnt', el).value;
    const topics = [...el.querySelectorAll('.chk input:checked')].map(i => i.value);
    const ids = mode === 'weak' ? composeWeak(n, topics) : weightedPick(QUESTIONS.filter(q => !topics.length || topics.includes(q.topic)), q => 1 / (1 + (S.stats[q.id]?.n || 0)), n).map(q => q.id);
    newSession(mode, ids, mode === 'weak' ? minutesFor(ids) : 0, mode === 'weak' ? 'Gyengeségeim mini-vizsga' : 'Gyakorlás');
  });
  app.append(el);
}

function renderSession() {
  const s = S.active;
  if (timed(s) && remaining(s) <= 0) return finishSession();
  const ids = s.phase === 'main' ? s.ids : s.skipped;
  if (s.idx >= ids.length) return renderEndOfSheet();
  const id = ids[s.idx], q = BY_ID[id];
  if (!q) { s.idx++; save(); return renderSession(); }
  const a = (s.answers[id] ||= {});
  const practice = s.mode === 'practice';
  const checked = !!s.checked[id];
  const shell = h(`<div class="shell"><div class="main"></div><aside class="side">
    <div class="who"><b>${esc(profile().name)}</b>${esc(s.title)}</div>
    ${timed(s) ? '<div class="stat"><div class="ring timer" id="tm">--:--</div><div>Teszten hátralévő idő</div></div>' : ''}
    <div class="stat"><div class="ring">${s.phase === 'main' ? s.idx + 1 : s.idx + 1}/${ids.length}</div><div>${s.phase === 'main' ? 'Feladat' : 'Átlépett feladat'}</div></div>
    ${!practice ? `<div class="stat"><div class="ring">${s.skipped.length}</div><div>Átlépett feladatok</div></div>` : `<div class="stat"><div class="ring">${pct(sessionScore(s))}</div><div>Eddigi eredmény</div></div>`}
    <div class="sp"></div>
    <div class="mini small">${q.part}. vizsgarész</div>
    <div class="menu"><button id="pause">⏸ <span>Szüneteltetés</span></button><button id="quit">⏻ <span>${practice ? 'Befejezés' : 'Vizsga feladása'}</span></button></div>
  </aside></div>`);
  const main = $('.main', shell);
  const ro = practice ? checked : false;
  main.append(renderQuestion(q, a, s.shuf[id] || range(q.options?.length || 0), { ro, show: practice && checked, exam: !practice }, () => save()));
  if (practice && checked) main.append(explanationBox(q, grade(q, a), a.guess));
  const nav = h('<div class="next"></div>');
  if (!(practice && checked)) {
    const g = h(`<label class="guess" title="A pontszámod nem változik, de a rendszer ezt a kérdést gyakorolandónak veszi."><input type="checkbox" ${a.guess ? 'checked' : ''}> 🎲 Tippeltem</label>`);
    $('input', g).addEventListener('change', e => { a.guess = e.target.checked; save(); });
    nav.append(g);
  }
  if (practice && !checked) {
    const b = h('<button class="btn primary">Ellenőrzés</button>');
    b.addEventListener('click', () => {
      if (!answered(q, a)) return alertBox('Előbb adj meg egy választ — vagy lépj tovább (Átugrás).');
      s.checked[id] = true; record(q, grade(q, a), !!a.guess); save(); render();
    });
    const sk = h('<button class="btn">Átugrás</button>');
    sk.addEventListener('click', () => { s.idx++; save(); render(); });
    nav.append(sk, b);
  } else {
    const b = h(`<button class="btn ${practice ? 'primary' : ''}">Következő feladat</button>`);
    b.addEventListener('click', () => {
      if (!practice) {
        if (answered(q, a)) s.locked.push(id);
        else if (s.phase === 'main') s.skipped.push(id);
      }
      s.idx++; save(); render();
    });
    nav.append(b);
  }
  main.append(nav);
  $('#quit', shell).addEventListener('click', () => confirmBox(practice ? 'Befejezed a gyakorlást? Az eddigi válaszok mentésre kerülnek.' : 'Biztosan befejezed a vizsgát? A meg nem válaszolt kérdések hibásnak számítanak.', finishSession));
  $('#pause', shell).addEventListener('click', () => {
    const o = h(`<div class="overlay"><div class="box"><h3>Vizsga szüneteltetve</h3><p>${timed(s) ? 'Mint a valódi vizsgán: saját kérésre szüneteltetve az idő tovább telik.' : 'Pihenj egyet.'}</p><div class="row"><button class="btn">Folytatás</button></div></div></div>`);
    $('button', o).addEventListener('click', () => o.remove()); document.body.append(o);
  });
  app.append(shell);
  startTimer();
  const first = main.querySelector('input:not([disabled]), select:not([disabled])'); if (first && window.innerWidth > 820) first.focus({ preventScroll: true });
}
function sessionScore(s) {
  let got = 0, max = 0;
  for (const id of s.ids) if (s.checked[id]) { const q = BY_ID[id]; got += grade(q, s.answers[id]) * q.points; max += q.points; }
  return max ? got / max : 0;
}
function startTimer() {
  const s = S.active; if (!s || !timed(s)) return;
  const upd = () => {
    const r = remaining(s); const el = document.getElementById('tm');
    if (r <= 0) { clearInterval(tick); document.querySelectorAll('.overlay').forEach(o => o.remove()); return finishSession(); }
    if (el) { const m = Math.floor(r / 60e3), sec = Math.floor(r / 1e3) % 60; el.textContent = `${m}:${String(sec).padStart(2, '0')}`; el.classList.toggle('warn', r < 5 * 60e3); }
  };
  upd(); tick = setInterval(upd, 1000);
}
function renderEndOfSheet() {
  const s = S.active;
  if (s.mode === 'practice') return finishSession();
  const pending = s.skipped.filter(id => !s.locked.includes(id));
  const shell = h(`<div class="shell"><div class="main"></div><aside class="side"><div class="who"><b>${esc(profile().name)}</b>${esc(s.title)}</div><div class="stat"><div class="ring timer" id="tm">--:--</div><div>Teszten hátralévő idő</div></div><div class="sp"></div></aside></div>`);
  const box = s.phase === 'main' && pending.length
    ? h(`<div class="overlay" style="position:absolute"><div class="box"><h3>Átlépett feladatok megoldása</h3><p>A tesztben ${pending.length} feladatot átlépett. Az „Átlépett feladatok” gombra kattintva ezeket megoldhatja. Ezután nincs több átlépési lehetőség, a válasz nélküli feladatok hibásnak számítanak.</p><div class="row"><button class="btn" id="sk">Átlépett feladatok</button><button class="btn" id="fin">Teszt befejezése</button></div></div></div>`)
    : h(`<div class="overlay" style="position:absolute"><div class="box"><h3>A feladatsor végére értél</h3><p>Minden feladatot megválaszoltál vagy megtekintettél.</p><div class="row"><button class="btn" id="fin">Teszt befejezése</button></div></div></div>`);
  $('.main', shell).append(box);
  $('#fin', box).addEventListener('click', finishSession);
  $('#sk', box)?.addEventListener('click', () => { s.phase = 'skipped'; s.skipped = pending; s.idx = 0; save(); render(); });
  app.append(shell);
  startTimer();
}

function renderResult(res) {
  const ratio = res.max ? res.got / res.max : 0;
  const pass = ratio >= PASS;
  const verdict = ratio >= 0.8 ? 'Kiváló – ez vizsgaszinten is 80 % feletti.' : ratio >= 0.7 ? 'Elérted a 70 %-os célt.' : pass ? 'Sikeres lenne (≥40 %), de még nincs meg a 70 %-os cél.' : 'Ez most nem lenne sikeres (<40 %).';
  const wrong = res.items.filter(i => i.frac < 0.999);
  const guessed = res.items.filter(i => i.a?.guess);
  const byTopic = {};
  for (const it of wrong) { const q = BY_ID[it.id]; if (q) byTopic[q.topic] = (byTopic[q.topic] || 0) + q.points * (1 - it.frac); }
  const lost = Object.entries(byTopic).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const E = res.elim, en = E && TOPIC[E.topic]?.name;
  const elimBanner = !E ? '' : E.stage === 'practice'
    ? (E.next === 'check' ? `<div class="banner">Gyakorlás kész: <b>${esc(en)}</b>. Következik az ellenőrző vizsga (${ELIM_CHECK} feladat, ≥${pct(ELIM_PASS)} kell). <button class="btn primary" data-elim>Ellenőrző vizsga indítása</button></div>` : `<div class="banner">Legalább 5 feladatot ellenőrizz a gyakorlásban, hogy jöhessen az ellenőrző vizsga. <button class="btn primary" data-elim>Gyakorlás folytatása</button></div>`)
    : E.next === 'done' ? `<div class="banner ok">🎉 <b>${esc(en)}</b> felszámolva (${pct(ratio)}). A térközös ismétlés gondoskodik róla, hogy meg is maradjon.</div>`
      : `<div class="banner bad">Az ellenőrző vizsga ${pct(ratio)} lett, a ${pct(ELIM_PASS)} még nincs meg. Nézd át lent a hibákat és a tananyagot, aztán gyakorolj újra. <button class="btn" data-learn="${E.topic}">📘 Tananyag</button> <button class="btn primary" data-elim>Újra gyakorlás</button></div>`;
  const el = h(`<div><div class="close-head">${esc(profile().name)} – ${esc(res.title)}</div><div class="close-body">
    <p class="verdict">A feladatsor befejeződött. Eredmény: <b>${pct(ratio)}</b> (${fmt(res.got)} / ${res.max} pont)<br><span style="font-size:1rem;color:${ratio >= 0.7 ? 'var(--ok)' : pass ? 'var(--accent)' : 'var(--bad)'}">${verdict}</span></p>
    ${guessed.length ? `<p class="small">🎲 <b>${guessed.length}</b> feladatnál jelölted, hogy tippeltél, ebből <b>${guessed.filter(i => i.frac >= 0.999).length}</b> lett jó. A pontszámba beszámít, de a rendszer ezeket gyakorolandónak veszi, és hamarosan visszahozza.</p>` : ''}
    ${elimBanner}
    <div class="grid">
      <div class="card"><h3>Vizsgarészenként</h3>${TOPICS.parts.filter(p => res.parts[p.id]).map(p => { const r = res.parts[p.id], v = r.got / r.max; return `<div class="part-row"><span>${p.id}. ${esc(p.name)}</span><div class="bar ${v >= 0.7 ? 'ok' : v < PASS ? 'bad' : ''}"><i style="width:${pct(v)}"></i></div><b>${pct(v)}</b></div>`; }).join('')}
        <p class="small muted">Idő: ${Math.floor(res.secs / 60)} perc ${res.secs % 60} mp</p></div>
      <div class="card"><h3>Itt vesztetted a legtöbb pontot</h3>${lost.length ? lost.map(([t, p]) => `<div class="weak-row"><div class="wr-main"><b>${esc(TOPIC[t]?.name || t)}</b> <span class="small muted">−${fmt(p)} pont</span></div><div class="wr-act"><button class="btn small" data-learn="${t}">📘 Tananyag</button><button class="btn small" data-fix="${t}">Felszámolás</button></div></div>`).join('') : '<p>Nincs hibád. 👏</p>'}
        ${lost.length ? '<div class="row" style="margin-top:12px"><button class="btn primary" id="drill">Gyakorold ezeket most</button></div>' : ''}</div>
    </div>
    <h2 style="margin-top:26px">Feladatok és magyarázatok</h2>
    <div class="row" style="margin-bottom:8px"><label class="small"><input type="checkbox" id="onlyBad" checked> csak a hibás / részben hibás / tippelt feladatok</label></div>
    <div id="rvlist"></div>
    <div class="row" style="margin-top:20px;justify-content:center"><button class="btn green" data-back>Befejezés</button></div>
  </div></div>`);
  const list = $('#rvlist', el);
  const draw = () => {
    list.innerHTML = '';
    const only = $('#onlyBad', el).checked;
    res.items.forEach((it, n) => {
      const q = BY_ID[it.id]; if (!q || (only && it.frac >= 0.999 && !it.a?.guess)) return;
      const d = h(`<details class="rv"><summary><span class="pill ${it.frac >= 0.999 ? 'ok' : 'bad'}">${n + 1}.</span>${it.a?.guess ? '<span title="tippelt">🎲</span>' : ''}<span>${rich(q.q.length > 110 ? q.q.slice(0, 110).replace(/<[^>]*$/, '') + '…' : q.q)}</span><span class="sc small">${fmt(it.frac * q.points)} / ${q.points} p</span></summary><div class="inner"></div></details>`);
      d.addEventListener('toggle', () => {
        const inner = $('.inner', d); if (!d.open || inner.childElementCount) return;
        inner.append(renderQuestion(q, structuredClone(it.a || {}), defaultOrder(q), { ro: true, show: true }));
        if (!it.a || !answered(q, it.a)) inner.append(h('<p class="small" style="color:var(--bad)">Nem adtál választ.</p>'));
        inner.append(explanationBox(q, it.frac, it.a?.guess));
      });
      list.append(d);
    });
    if (!list.childElementCount) list.append(h('<p class="muted">Nincs megjeleníthető feladat.</p>'));
  };
  $('#onlyBad', el).addEventListener('change', draw);
  draw();
  wireBack(el);
  el.querySelectorAll('[data-learn]').forEach(b => b.addEventListener('click', () => openExplainer(b.dataset.learn)));
  el.querySelectorAll('[data-fix]').forEach(b => b.addEventListener('click', () => elimNext(b.dataset.fix)));
  $('[data-elim]', el)?.addEventListener('click', () => elimNext(E.topic));
  $('#drill', el)?.addEventListener('click', () => newSession('practice', composeWeak(20, lost.map(([t]) => t)), 0, 'Gyakorlás: hibás témák'));
  app.append(el);
  scrollTo(0, 0);
}
const defaultOrder = q => q.type === 'single' || q.type === 'multi' ? range(q.options.length) : q.type === 'match' ? range(q.pairs.length + (q.distractors?.length || 0)) : range(q.items?.length || 0);

function mistakeDetails(q) {
  const st = S.stats[q.id];
  const d = h(`<details class="rv"><summary><span><span class="qid">#${esc(q.id)}</span> ${rich(q.q.length > 120 ? q.q.slice(0, 120).replace(/<[^>]*$/, '') + '…' : q.q)}</span><span class="sc small muted">${st?.lastGuess && st.lastFrac >= GUESS_CAP - 1e-9 ? '🎲 tippelve' : st?.wrong ? `${st.wrong}× hibás` : 'részben hibás'}</span></summary><div class="inner"></div></details>`);
  d.addEventListener('toggle', () => {
    const inner = $('.inner', d); if (!d.open || inner.childElementCount) return;
    inner.append(renderSolutionOnly(q), explanationBox(q, 0));
  });
  return d;
}
function renderMistakes() {
  const wrong = QUESTIONS.filter(q => S.stats[q.id] && S.stats[q.id].lastFrac < 0.999);
  const groups = {};
  for (const q of wrong) (groups[q.topic] ||= []).push(q);
  const el = h(`<div class="dash"><div class="row" style="justify-content:space-between"><h1>Hibanapló</h1><div class="row">${back()}<button class="btn primary" id="drill">Mind gyakorlása</button></div></div>
    <p class="muted">A legutóbbi próbálkozáskor hibás vagy részben hibás kérdések. Ha legközelebb jól válaszolod meg, lekerül a listáról.</p><div id="g"></div></div>`);
  const g = $('#g', el);
  for (const [t, qs] of Object.entries(groups).sort((a, b) => b[1].length - a[1].length)) {
    const head = h(`<div class="row" style="margin-top:22px;justify-content:space-between"><h2 style="margin:0">${esc(TOPIC[t]?.name || t)} <span class="pill bad">${qs.length}</span></h2><div class="row"><button class="btn small">📘 Tananyag</button><button class="btn small primary">Felszámolás</button></div></div>`);
    const [lb, fb] = head.querySelectorAll('button');
    lb.addEventListener('click', () => openExplainer(t)); fb.addEventListener('click', () => elimNext(t));
    g.append(head);
    for (const q of qs) g.append(mistakeDetails(q));
  }
  wireBack(el);
  $('#drill', el).addEventListener('click', () => newSession('practice', shuffle(wrong.map(q => q.id)).slice(0, 40), 0, 'Hibanapló gyakorlás'));
  app.append(el);
}

// one topic: explainer, your mistakes in it, and the elimination steps
function renderLearn(tid) {
  const A = analyze(), r = A.byId[tid], el = S.elim[tid];
  const wrong = QUESTIONS.filter(q => q.topic === tid && S.stats[q.id] && S.stats[q.id].lastFrac < 0.999);
  const page = h(`<div class="dash learn">
    <div class="row" style="justify-content:space-between">${back()}<button class="btn" id="lib">Összes tananyag</button></div>
    ${r ? `<div class="card" style="margin:14px 0">${stepper(tid)}
      <div class="small muted" style="margin-top:8px">Elsajátítás: <b>${r.m.seen ? pct(r.m.mastery) : '–'}</b> ${statusPill(r.status)} · ${r.m.seen}/${r.m.total} kérdés látva${r.m.seen ? ` · ~${fmt(r.lossPts)} pont veszteség egy vizsgán` : ''}</div>
      <div class="row" style="margin-top:10px">${!el || el.stage === 'learn' || el.stage === 'done' ? '<button class="btn primary" id="read">Elolvastam – jöhet a gyakorlás</button>' : `<button class="btn primary" id="next">Folytatás: ${ELIM_STEPS.find(s => s[0] === el.stage)[1]}</button>`}
      <button class="btn" id="prac">Szabad gyakorlás ebből (15)</button></div></div>` : ''}
    <div class="card"></div>
    ${wrong.length ? `<h2 style="margin-top:22px">Ezekben hibáztál ebben a témában <span class="pill bad">${wrong.length}</span></h2><div id="wl"></div>` : ''}
  </div>`);
  page.querySelectorAll('.card')[r ? 1 : 0].append(renderExplainer(tid));
  const wl = $('#wl', page); if (wl) for (const q of wrong) wl.append(mistakeDetails(q));
  wireBack(page);
  $('#lib', page).addEventListener('click', () => goView({ name: 'library' }));
  $('#read', page)?.addEventListener('click', () => { S.elim[tid] = { ...(S.elim[tid] || { started: Date.now(), checks: [] }), stage: 'practice' }; save(); elimNext(tid); });
  $('#next', page)?.addEventListener('click', () => elimNext(tid));
  $('#prac', page)?.addEventListener('click', () => newSession('practice', composeWeak(15, [tid]), 0, `Gyakorlás: ${TOPIC[tid].name}`));
  app.append(page);
}
function stepper(tid) {
  const el = S.elim[tid], cur = el ? ELIM_STEPS.findIndex(s => s[0] === el.stage) : -1;
  const last = el?.checks?.at(-1);
  return `<div class="steps">${ELIM_STEPS.map(([, label], i) => `<span class="step ${i < cur || el?.stage === 'done' ? 'done' : i === cur ? 'cur' : ''}">${i + 1}. ${label}</span>`).join('<span class="sep">›</span>')}</div>
    ${last ? `<div class="small muted">Utolsó ellenőrző vizsga: ${pct(last.score)} (${new Date(last.date).toLocaleDateString('hu-HU')})</div>` : ''}`;
}

function renderLibrary() {
  const A = analyze();
  const el = h(`<div class="dash"><div class="row" style="justify-content:space-between"><h1>Tananyag</h1>${back()}</div>
    <p class="muted">Témánkénti magyarázók a tanfolyami anyagok alapján, vizsgarészenként. A színes címke a saját eredményed.</p><div id="g"></div></div>`);
  const g = $('#g', el);
  if (EXPLAINERS.alapok) {
    const c = h(`<button class="lib-card"><b>🧮 ${esc(EXPLAINERS.alapok.title)}</b><span class="small muted">Innen vezethető le minden képlet – ide nyúlj vissza, ha valami ködös.</span></button>`);
    c.addEventListener('click', () => goView({ name: 'learn', topic: 'alapok' }));
    g.append(h('<h2 style="margin-top:20px">Alapok</h2>'), h('<div class="lib-grid"></div>')); g.lastChild.append(c);
  }
  for (const p of TOPICS.parts) {
    g.append(h(`<h2 style="margin-top:20px">${p.id}. ${esc(p.name)} <span class="muted small">(${pct(p.weight)})</span></h2>`));
    const grid = h('<div class="lib-grid"></div>');
    for (const r of A.rows.filter(r => r.t.part === p.id)) {
      const c = h(`<button class="lib-card"><b>${esc(r.t.name)}</b><span>${statusPill(r.status)} ${r.m.seen ? pct(r.m.mastery) : ''}</span>${EXPLAINERS[r.t.id] ? '' : '<span class="small muted">tananyag hamarosan</span>'}</button>`);
      c.addEventListener('click', () => goView({ name: 'learn', topic: r.t.id }));
      grid.append(c);
    }
    g.append(grid);
  }
  wireBack(el);
  app.append(el);
}

function renderElim() {
  const A = analyze();
  const running = Object.entries(S.elim).filter(([, e]) => e.stage !== 'done').map(([t]) => t).filter(t => TOPIC[t]);
  const done = Object.entries(S.elim).filter(([, e]) => e.stage === 'done').map(([t]) => t).filter(t => TOPIC[t]);
  const suggested = A.weak.filter(r => !running.includes(r.t.id)).slice(0, 4);
  const el = h(`<div class="dash"><div class="row" style="justify-content:space-between"><h1>Gyengeség-felszámolás</h1>${back()}</div>
    <p class="muted">A rendszer a válaszaidból méri, melyik téma mennyi pontodba kerül a vizsgán. Egy témát három lépésben számolsz fel: <b>1. tananyag</b> (a hibáidra fókuszálva), <b>2. gyakorlás</b> azonnali magyarázattal (${ELIM_PRACTICE} feladat), <b>3. ellenőrző vizsga</b> KRÉTA-szabályokkal (${ELIM_CHECK} feladat, legalább ${pct(ELIM_PASS)}). Ha nem sikerül, vissza a gyakorláshoz, a térközös ismétlés pedig később is visszahozza a témát.</p>
    <div class="grid"><div class="card"><h2>Folyamatban</h2><div id="run"></div></div><div class="card"><h2>Javasolt következő</h2><div id="sug"></div></div></div>
    <div class="card" style="margin-top:16px"><h2>Felszámolt témák</h2><div id="done"></div></div></div>`);
  const card = (tid) => {
    const r = A.byId[tid];
    const c = h(`<div class="weak-row"><div class="wr-main"><b>${esc(TOPIC[tid].name)}</b> ${r ? statusPill(r.status) : ''}${stepper(tid)}</div><div class="wr-act"><button class="btn small" data-l>📘</button><button class="btn small primary" data-n>Tovább</button></div></div>`);
    $('[data-l]', c).addEventListener('click', () => openExplainer(tid));
    $('[data-n]', c).addEventListener('click', () => elimNext(tid));
    return c;
  };
  const run = $('#run', el); running.forEach(t => run.append(card(t))); if (!running.length) run.append(h('<p class="muted small">Nincs folyamatban lévő felszámolás.</p>'));
  const sug = $('#sug', el);
  for (const r of suggested) {
    const c = h(`<div class="weak-row"><div class="wr-main"><b>${esc(r.t.name)}</b> ${statusPill(r.status)}<div class="small muted">${pct(r.m.mastery)} · <b style="color:var(--ok)">+${fmt(r.gainPts)} pont</b> nyerhető</div></div><div class="wr-act"><button class="btn small primary">Indítás</button></div></div>`);
    $('button', c).addEventListener('click', () => elimNext(r.t.id));
    sug.append(c);
  }
  if (!suggested.length) sug.append(h(`<p class="muted small">${A.unknown.length ? 'Előbb írj egy teljes próbavizsgát, hogy legyen mit mérni.' : 'Nincs gyenge témád. 👏'}</p>`));
  const dn = $('#done', el);
  for (const t of done) dn.append(h(`<div class="weak-row"><div class="wr-main">✔ <b>${esc(TOPIC[t].name)}</b> <span class="small muted">${new Date(S.elim[t].doneAt).toLocaleDateString('hu-HU')} · ${pct(S.elim[t].checks.at(-1)?.score || 0)}</span></div></div>`));
  if (!done.length) dn.append(h('<p class="muted small">Még nincs.</p>'));
  wireBack(el);
  app.append(el);
}

function renderProgress() {
  const A = analyze();
  const exams = S.history.filter(r => r.mode === 'exam');
  const typeRows = Object.entries(A.types).sort((a, b) => a[1].sum / a[1].n - b[1].sum / b[1].n);
  const el = h(`<div class="dash"><div class="row" style="justify-content:space-between"><h1>Haladás – ${esc(profile().name)}</h1>${back()}</div>
    <div class="grid">
      <div class="card"><h2>Próbavizsgák</h2>${exams.length > 1 ? chart(exams.slice(-30).map(r => r.got / r.max)) : '<p class="muted small">Legalább két teljes vagy célzott vizsga kell a görbéhez.</p>'}
        ${exams.length ? `<table class="hist"><tr><th>Dátum</th><th>Össz.</th>${TOPICS.parts.map(p => `<th>${p.id}.</th>`).join('')}</tr>${exams.slice().reverse().map(r => `<tr><td>${new Date(r.date).toLocaleDateString('hu-HU')}</td><td><b>${pct(r.got / r.max)}</b></td>${TOPICS.parts.map(p => `<td>${r.parts[p.id] ? pct(r.parts[p.id].got / r.parts[p.id].max) : '–'}</td>`).join('')}</tr>`).join('')}</table>` : ''}</div>
      <div class="card"><h2>Feladattípusok</h2><p class="small muted">Melyik formátumban veszítesz pontot (átlagos részpontszám).</p>
        ${typeRows.length ? typeRows.map(([t, x]) => `<div class="part-row"><span>${TYPE_NAME[t]} <span class="muted small">(${x.n})</span></span><div class="bar ${x.sum / x.n < 0.6 ? 'bad' : x.sum / x.n >= 0.8 ? 'ok' : ''}"><i style="width:${pct(x.sum / x.n)}"></i></div><b>${pct(x.sum / x.n)}</b></div>`).join('') : '<p class="muted small">Még nincs adat.</p>'}
        ${A.types.multi && A.types.multi.sum / A.types.multi.n < 0.6 ? '<p class="small">💡 Többszörös választásnál a rossz jelölés levon: csak azt jelöld, amiben biztos vagy.</p>' : ''}</div>
    </div>
    <div class="card" style="margin-top:16px"><h2>Témák</h2><table class="hist"><tr><th>Téma</th><th>Állapot</th><th>Elsajátítás</th><th>Trend</th><th>Pontveszteség / vizsga</th><th></th></tr>
      ${A.rows.slice().sort((a, b) => b.lossPts - a.lossPts).map(r => `<tr><td>${r.t.part}. ${esc(r.t.name)}</td><td>${statusPill(r.status)}</td><td>${r.m.seen ? pct(r.m.mastery) : '–'} <span class="muted small">(${r.m.seen}/${r.m.total})</span></td><td>${trendIcon(r.trend)}</td><td>${r.m.seen ? '−' + fmt(r.lossPts) : '–'}</td><td><button class="btn small" data-learn="${r.t.id}">📘</button></td></tr>`).join('')}</table></div>
    <div class="card" style="margin-top:16px"><h2>Összes kitöltött feladatsor</h2>${historyTable(S.history.slice().reverse())}</div>
  </div>`);
  wireBack(el); wireHistory(el);
  el.querySelectorAll('[data-learn]').forEach(b => b.addEventListener('click', () => goView({ name: 'learn', topic: b.dataset.learn })));
  app.append(el);
}

function renderSolutionOnly(q) {
  // show the question with the correct answer filled in
  const a = {};
  if (q.type === 'single' || q.type === 'multi') a.sel = q.answer.slice();
  if (q.type === 'truefalse') a.vals = Object.fromEntries(q.statements.map((s, i) => [i, s.answer]));
  if (q.type === 'dropdown') a.vals = Object.fromEntries(q.blanks.map((b, i) => [i, b.answer]));
  if (q.type === 'number') a.vals = Object.fromEntries(q.fields.map((f, i) => [i, fmtAns(f.answer)]));
  if (q.type === 'order') a.pos = Object.fromEntries(q.items.map((_, i) => [i, i]));
  if (q.type === 'match') a.assign = Object.fromEntries(q.pairs.map((_, i) => [i, i]));
  if (q.type === 'group') a.assign = Object.fromEntries(q.items.map((it, i) => [i, it.group]));
  return renderQuestion(q, a, defaultOrder(q), { ro: true, show: true });
}

// ---------- small dialogs (no native alert/confirm/prompt) ----------
function alertBox(msg) {
  const o = h(`<div class="overlay"><div class="box"><p>${esc(msg)}</p><div class="row"><button class="btn">Rendben</button></div></div></div>`);
  $('button', o).addEventListener('click', () => o.remove()); document.body.append(o); $('button', o).focus();
}
function confirmBox(msg, yes) {
  const o = h(`<div class="overlay"><div class="box"><p>${esc(msg)}</p><div class="row"><button class="btn" data-n>Mégsem</button><button class="btn primary" data-y>Igen</button></div></div></div>`);
  $('[data-n]', o).addEventListener('click', () => o.remove());
  $('[data-y]', o).addEventListener('click', () => { o.remove(); yes(); });
  document.body.append(o); $('[data-n]', o).focus();
}
function promptBox(msg, value, done, secret = false) {
  const o = h(`<div class="overlay"><div class="box"><p>${esc(msg)}</p><input class="prompt-in" type="${secret ? 'password' : 'text'}" ${secret ? 'inputmode="numeric" autocomplete="off"' : ''} value="${esc(value)}"><div class="row"><button class="btn" data-n>Mégsem</button><button class="btn primary" data-y>OK</button></div></div></div>`);
  const inp = $('input', o);
  const ok = () => { o.remove(); done(inp.value.trim()); };
  $('[data-n]', o).addEventListener('click', () => o.remove());
  $('[data-y]', o).addEventListener('click', ok);
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') ok(); if (e.key === 'Escape') o.remove(); });
  document.body.append(o); inp.focus();
}

render();
