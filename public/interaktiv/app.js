'use strict';
// Villanyszerelő interaktív vizsga gyakorló — single-file app, no build step.
// Data: window.QUESTIONS / window.TOPICS from data/questions.js. Progress: localStorage.

const QUESTIONS = window.QUESTIONS || [];
const TOPICS = window.TOPICS || { parts: [], topics: [] };
const BY_ID = Object.fromEntries(QUESTIONS.map(q => [q.id, q]));
const TOPIC = Object.fromEntries(TOPICS.topics.map(t => [t.id, t]));
const PART = Object.fromEntries(TOPICS.parts.map(p => [p.id, p]));
const STORE_KEY = 'vvz.v1';
const EXAM_MIN = 90;
const EXAM_POINTS = 100;
const PASS = 0.4;
const TARGET = 0.75;
const BOX_DAYS = [0, 1, 3, 7, 16, 35];
const DAY = 864e5;

// ---------- storage ----------
function emptyState() { return { name: '', stats: {}, history: [], active: null }; }
function load() {
  try { return Object.assign(emptyState(), JSON.parse(localStorage.getItem(STORE_KEY)) || {}); } catch { return emptyState(); }
}
let S = load();
function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch { /* private mode: keep in memory */ } }

// ---------- helpers ----------
const $ = (sel, el = document) => el.querySelector(sel);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// question text allows a small HTML subset; everything else is escaped
const rich = s => esc(s).replace(/&lt;(\/?)(b|i|sub|sup|br)\s*\/?&gt;/g, '<$1$2>');
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
function record(q, frac) {
  const st = S.stats[q.id] || { n: 0, ew: null, box: 0, wrong: 0 };
  st.n++;
  st.ew = st.ew === null ? frac : 0.5 * st.ew + 0.5 * frac;
  st.lastFrac = frac;
  st.last = Date.now();
  if (frac >= 0.999) st.box = Math.min(st.box + 1, BOX_DAYS.length - 1); else st.box = 0;
  if (frac < 0.5) st.wrong++;
  st.due = st.last + BOX_DAYS[st.box] * DAY;
  S.stats[q.id] = st;
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
function composeExam() {
  // per part: fill to its point budget, preferring less-seen questions so full exams spread over the bank
  const ids = [];
  for (const p of TOPICS.parts) {
    const budget = Math.round(EXAM_POINTS * p.weight);
    const pool = QUESTIONS.filter(q => q.part === p.id);
    const ordered = weightedPick(pool, q => 1 / (1 + (S.stats[q.id]?.n || 0)), pool.length);
    // round-robin over topics for coverage, like the KKK's per-topic task list
    const byTopic = {};
    for (const q of ordered) (byTopic[q.topic] ||= []).push(q);
    const queues = shuffle(Object.values(byTopic));
    let pts = 0, guard = 0;
    while (pts < budget && queues.some(x => x.length) && guard++ < 1000) {
      for (const qu of queues) {
        if (pts >= budget) break;
        const k = qu.findIndex(q => pts + q.points <= budget);
        if (k < 0) continue;
        const [q] = qu.splice(k, 1); ids.push(q.id); pts += q.points;
      }
      if (!queues.some(qu => qu.some(q => pts + q.points <= budget))) break;
    }
  }
  // the real exam is one continuous sheet ordered by part
  return ids;
}
function composeWeak(n, topics) {
  const tm = topicModel(), now = Date.now();
  let pool = QUESTIONS.filter(q => !topics?.length || topics.includes(q.topic));
  return weightedPick(pool, q => priority(q, tm, now), Math.min(n, pool.length)).map(q => q.id);
}
function composeReview() {
  const now = Date.now();
  return QUESTIONS.filter(q => S.stats[q.id] && S.stats[q.id].due <= now).sort((a, b) => S.stats[a.id].ew - S.stats[b.id].ew).map(q => q.id);
}

// ---------- sessions ----------
// mode: exam (KRÉTA rules, timed, no feedback), weak (same rules, adaptive), practice (instant feedback)
function newSession(mode, ids, minutes, title) {
  const shuf = {};
  for (const id of ids) {
    const q = BY_ID[id];
    if (q.type === 'single' || q.type === 'multi') shuf[id] = shuffle(range(q.options.length));
    else if (q.type === 'order') shuf[id] = shuffle(range(q.items.length));
    else if (q.type === 'match') shuf[id] = shuffle(range(q.pairs.length + (q.distractors?.length || 0)));
    else if (q.type === 'group') shuf[id] = shuffle(range(q.items.length));
    else if (q.type === 'dropdown') shuf[id] = q.blanks.map(b => shuffle(range(b.options.length)));
  }
  S.active = { mode, title, ids, idx: 0, answers: {}, locked: [], skipped: [], phase: 'main', shuf, start: Date.now(), minutes, checked: {} };
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
    if (s.mode !== 'practice') record(q, frac); // practice records on each check
    got += frac * q.points; max += q.points;
    const p = (parts[q.part] ||= { got: 0, max: 0 }); p.got += frac * q.points; p.max += q.points;
    items.push({ id, frac, a: s.answers[id] || null });
  }
  const res = { mode: s.mode, title: s.title, date: Date.now(), secs: Math.round((Date.now() - s.start) / 1000), got, max, parts, items };
  S.history.push(res);
  if (S.history.length > 200) S.history = S.history.slice(-200);
  S.active = null; save();
  view = { name: 'result', res };
  render();
}

// ---------- rendering: question widgets ----------
// opts.ro = read-only, opts.show = mark right/wrong and reveal solution
let uid = 0; // radio group names must be unique when several questions share a page
function renderQuestion(q, a, sh, opts, onChange) {
  const ro = !!opts.ro, show = !!opts.show, nm = `q${++uid}`;
  const wrap = h(`<div class="${ro ? 'locked' : ''}"></div>`);
  wrap.append(h(`<div class="qmeta"><span class="pill">${esc(TYPE_NAME[q.type])}</span><span class="pill">${esc(PART[q.part]?.name || '')}</span>${opts.exam ? '' : `<span class="pill">${esc(TOPIC[q.topic]?.name || q.topic)}</span>`}<span class="pill">${q.points} pont</span></div>`));
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
  const wrap = h(`<div class="two"><div><h4>${leftTitle}</h4><div class="slots"></div></div><div><h4>${rightTitle}</h4><div class="pool"></div></div></div>`);
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

function explanationBox(q, frac) {
  const cls = frac >= 0.999 ? '' : frac > 0 ? 'part' : 'bad';
  const head = frac >= 0.999 ? '✔ Helyes' : frac > 0 ? `◐ Részben helyes (${pct(frac)})` : '✘ Hibás';
  return h(`<div class="feedback ${cls}"><h3>${head}</h3><div>${rich(q.explanation)}</div><div class="src">Forrás: ${esc(q.source)}</div></div>`);
}

// ---------- views ----------
let view = { name: 'home' };
let tick = null;

function render() {
  clearInterval(tick);
  app.innerHTML = '';
  if (S.active) return renderSession();
  if (view.name === 'result') return renderResult(view.res);
  if (view.name === 'start') return renderStart(view.mode);
  if (view.name === 'mistakes') return renderMistakes();
  return renderHome();
}

function renderHome() {
  const tm = topicModel(), pm = partModel(tm), pred = predicted(pm);
  const seen = Object.keys(S.stats).filter(id => BY_ID[id]).length;
  const due = composeReview().length;
  const exams = S.history.filter(r => r.mode === 'exam');
  const lastExam = exams.at(-1);
  const wrongNow = QUESTIONS.filter(q => S.stats[q.id] && S.stats[q.id].lastFrac < 0.999).length;
  const ready = pred >= TARGET && seen >= QUESTIONS.length * 0.6;
  const el = h(`<div class="dash">
    <div class="topbar"><div class="logo"><svg width="20" height="20" viewBox="0 0 24 24"><path d="M14 1 4 14h6l-2 9 10-13h-6z" fill="#fff"/></svg></div>
      <div><div class="t">Villanyszerelő – interaktív vizsga gyakorló ${window.top === window ? '<a class="small" href="../" style="font-weight:400;margin-left:8px">← VOLT LAB 1008</a>' : ''}</div><div class="s">Épületvillamosság · KKK 4 0713 04 07 · 90 perc · sikeres ≥ 40 %, cél 70–80 %</div></div></div>
    <div class="grid">
      <div class="card"><h2>Vizsgakészség <span class="pill ${ready ? 'ok' : ''}">${ready ? 'vizsgakész' : 'gyakorlás alatt'}</span></h2>
        <div class="kpi"><div><span>Becsült eredmény</span><b class="big" style="color:${seen < 10 ? 'var(--muted)' : pred >= TARGET ? 'var(--ok)' : pred >= PASS ? 'var(--accent)' : 'var(--bad)'}">${seen < 10 ? '–' : pct(pred)}</b></div>
          <div><span>Utolsó próbavizsga</span><b>${lastExam ? pct(lastExam.got / lastExam.max) : '–'}</b></div>
          <div><span>Látott kérdés</span><b>${seen} / ${QUESTIONS.length}</b></div></div>
        <div class="small muted" style="margin-bottom:8px">Vizsgarészek (súly) – elsajátítás</div>
        ${TOPICS.parts.map(p => `<div class="part-row"><span>${p.id}. ${esc(p.name)} <span class="muted">(${pct(p.weight)})</span></span><div class="bar ${pm[p.id].mastery >= TARGET ? 'ok' : pm[p.id].mastery < PASS ? 'bad' : ''}"><i style="width:${pm[p.id].coverage ? pct(pm[p.id].mastery) : 0}"></i></div><b>${pm[p.id].coverage ? pct(pm[p.id].mastery) : '–'}</b></div>`).join('')}
        ${seen < 10 ? '<p class="small"><b>Kezdd egy teljes próbavizsgával</b> – ebből látja a rendszer, hol tartasz.</p>' : ''}<p class="small muted">A becslés témánként súlyozott, 50 %-os kiindulásból indul, és minden válasszal pontosodik. A ${pct(TARGET)} feletti becslés + a kérdések ≥60 %-ának látása = vizsgakész.</p>
      </div>
      <div class="card"><h2>Mit csináljak most?</h2><div class="modes">
        <div class="mode"><div><b>Teljes próbavizsga</b><p>Valós KRÉTA-szabályok: ${EXAM_MIN} perc, ${EXAM_POINTS} pont, I–IV. rész 20/20/20/40 %, átlépés, végén kiértékelés.</p></div><button class="btn primary" data-go="exam">Indítás</button></div>
        <div class="mode"><div><b>Gyengeségeim vizsga</b><p>A leggyengébb témáidból és a korábban elrontott kérdésekből, időre.</p></div><button class="btn" data-go="weak">Indítás</button></div>
        <div class="mode"><div><b>Gyakorlás magyarázattal</b><p>Minden válasz után azonnal látod a megoldást és a magyarázatot. Téma választható.</p></div><button class="btn" data-go="practice">Indítás</button></div>
        <div class="mode"><div><b>Esedékes ismétlés</b><p>Térközös ismétlés: amit elrontottál, hamar visszajön; amit tudsz, ritkábban.</p></div><button class="btn" data-go="review" ${due ? '' : 'disabled'}>${due} db</button></div>
        <div class="mode"><div><b>Hibanapló</b><p>Az összes jelenleg hibás kérdésed témánként, magyarázattal.</p></div><button class="btn" data-go="mistakes" ${wrongNow ? '' : 'disabled'}>${wrongNow} db</button></div>
      </div></div>
      <div class="card"><h2>Témák <span class="small muted">gyengétől az erősig</span></h2>
        ${TOPICS.topics.filter(t => tm[t.id].total).sort((x, y) => tm[x.id].mastery - tm[y.id].mastery).map(t => { const m = tm[t.id]; return `<div class="topic-row"><button data-topic="${t.id}" title="Gyakorlás ebből a témából">${t.part}. ${esc(t.name)} <span class="muted">(${m.seen}/${m.total})</span></button><div class="bar ${m.mastery >= TARGET ? 'ok' : m.mastery < 0.45 ? 'bad' : ''}"><i style="width:${m.seen ? pct(m.mastery) : 0}"></i></div><b class="small">${m.seen ? pct(m.mastery) : '–'}</b></div>`; }).join('')}
      </div>
      <div class="card"><h2>Előzmények</h2>
        ${exams.length > 1 ? chart(exams.slice(-20).map(r => r.got / r.max)) : ''}
        ${S.history.length ? `<table class="hist"><tr><th>Dátum</th><th>Mód</th><th>Eredmény</th><th></th></tr>${S.history.slice(-12).reverse().map((r, i) => `<tr><td>${new Date(r.date).toLocaleString('hu-HU', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td><td>${esc(r.title)}</td><td><b>${pct(r.got / r.max)}</b> <span class="muted small">${fmt(r.got)}/${r.max}</span></td><td><button class="btn small" data-hist="${S.history.length - 1 - i}">Megnéz</button></td></tr>`).join('')}</table>` : '<p class="muted">Még nincs kitöltött feladatsor.</p>'}
        <div class="row" style="margin-top:14px"><button class="btn small" id="exp">Eredmények mentése (JSON)</button><label class="btn small">Betöltés<input type="file" accept="application/json" id="imp" hidden></label><button class="btn small danger" id="reset">Nullázás</button></div>
        <p class="small muted">Az eredmények ebben a böngészőben tárolódnak. Más eszközre a mentés/betöltés gombbal viheted át.</p>
      </div>
    </div></div>`);
  el.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => {
    const g = b.dataset.go;
    if (g === 'review') return newSession('practice', composeReview().slice(0, 40), 0, 'Ismétlés');
    if (g === 'mistakes') { view = { name: 'mistakes' }; return render(); }
    view = { name: 'start', mode: g }; render();
  }));
  el.querySelectorAll('[data-topic]').forEach(b => b.addEventListener('click', () => newSession('practice', composeWeak(15, [b.dataset.topic]), 0, `Gyakorlás: ${TOPIC[b.dataset.topic].name}`)));
  el.querySelectorAll('[data-hist]').forEach(b => b.addEventListener('click', () => { view = { name: 'result', res: S.history[+b.dataset.hist], old: true }; render(); }));
  $('#exp', el).addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({ ...S, active: null }, null, 1)], { type: 'application/json' });
    const u = URL.createObjectURL(blob); const l = document.createElement('a');
    l.href = u; l.download = `villanyszerelo-eredmenyek-${new Date().toISOString().slice(0, 10)}.json`; l.click(); URL.revokeObjectURL(u);
  });
  $('#imp', el).addEventListener('change', async e => {
    try { const d = JSON.parse(await e.target.files[0].text()); if (!d.stats) throw 0; S = Object.assign(emptyState(), d, { active: null }); save(); render(); }
    catch { alertBox('A fájl nem érvényes eredménymentés.'); }
  });
  $('#reset', el).addEventListener('click', () => confirmBox('Biztosan törlöd az összes eredményt?', () => { S = emptyState(); save(); render(); }));
  app.append(el);
}

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
  const titles = { exam: 'Teljes próbavizsga', weak: 'Gyengeségeim vizsga', practice: 'Gyakorlás magyarázattal' };
  const el = h(`<div class="start"><div class="card">
    <h1>${titles[mode]}</h1>
    ${mode === 'exam' ? `<p>Ugyanúgy működik, mint a KRÉTA interaktív vizsga:</p><ul>
      <li>${EXAM_MIN} perc, ${EXAM_POINTS} pont; I. Alkatrész és anyagismeret 20 %, II. Technológia 20 %, III. Számítás 20 %, IV. Villamos biztonság 40 %.</li>
      <li>Ha nem tudod a választ, ne jelölj semmit, lépj tovább a <b>Következő feladat</b> gombbal: az átlépett feladatokat a végén még egyszer megkapod.</li>
      <li>Ha legalább egy választ megjelöltél, továbblépés után <b>már nem módosítható</b>.</li>
      <li>Többszörös választásnál a rossz jelölés pontot von le, mindent bejelölve 0 pont. Negatív pont nincs.</li>
      <li>Lejáró időnél a vizsga automatikusan befejeződik. Sikeres: ≥ 40 %. A célod: 70–80 %.</li></ul>` : ''}
    ${mode === 'weak' ? `<p>A rendszer a leggyengébb témáidból, a legutóbb elrontott és az esedékes kérdésekből állít össze egy feladatsort. Ugyanazok a szabályok, mint a vizsgán (időre, visszajelzés a végén).</p>` : ''}
    ${mode === 'practice' ? `<p>Minden feladat után <b>Ellenőrzés</b>: azonnal látod a helyes megoldást, a magyarázatot és hogy miért rossz a választott lehetőség.</p>` : ''}
    <div class="field"><label for="nm">Vizsgázó neve</label><input id="nm" value="${esc(S.name)}" placeholder="pl. Kovács János"></div>
    ${mode !== 'exam' ? `<div class="field"><label for="cnt">Feladatok száma</label><select id="cnt">${[10, 20, 30, 45].map(n => `<option ${n === (mode === 'weak' ? 30 : 20) ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
      <div class="field"><span>Témák <span class="muted small">(üresen hagyva: ${mode === 'weak' ? 'a rendszer választ a gyengeségeid alapján' : 'mind'})</span></span><div class="chk">${TOPICS.topics.filter(t => tm[t.id].total).map(t => `<label><input type="checkbox" value="${t.id}">${t.part}. ${esc(t.name)}</label>`).join('')}</div></div>` : ''}
    <div class="row" style="margin-top:18px"><button class="btn" id="back">Vissza</button><button class="btn primary" id="go">${mode === 'practice' ? 'Gyakorlás indítása' : 'Személyes adatok rendben vannak – Teszt megkezdése'}</button></div>
    ${QUESTIONS.length ? '' : '<p style="color:var(--bad)">Nincs betöltött kérdésbank (data/questions.js).</p>'}
  </div></div>`);
  $('#back', el).addEventListener('click', () => { view = { name: 'home' }; render(); });
  $('#go', el).addEventListener('click', () => {
    S.name = $('#nm', el).value.trim(); save();
    if (mode === 'exam') return newSession('exam', composeExam(), EXAM_MIN, 'Teljes próbavizsga');
    const n = +$('#cnt', el).value;
    const topics = [...el.querySelectorAll('.chk input:checked')].map(i => i.value);
    const ids = mode === 'weak' ? composeWeak(n, topics) : weightedPick(QUESTIONS.filter(q => !topics.length || topics.includes(q.topic)), q => 1 / (1 + (S.stats[q.id]?.n || 0)), n).map(q => q.id);
    // exam-paced: the real exam gives ~2 minutes per 2-point task
    const mins = mode === 'weak' ? Math.ceil(ids.reduce((s, id) => s + BY_ID[id].points, 0) * EXAM_MIN / EXAM_POINTS) : 0;
    newSession(mode, ids, mins, mode === 'weak' ? 'Gyengeségeim vizsga' : 'Gyakorlás');
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
    <div class="who"><b>${esc(S.name || 'Vizsgázó')}</b>${esc(s.title)}</div>
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
  if (practice && checked) main.append(explanationBox(q, grade(q, a)));
  const nav = h('<div class="next"></div>');
  if (practice && !checked) {
    const b = h('<button class="btn primary">Ellenőrzés</button>');
    b.addEventListener('click', () => {
      if (!answered(q, a)) return alertBox('Előbb adj meg egy választ — vagy lépj tovább (Átugrás).');
      s.checked[id] = true; record(q, grade(q, a)); save(); render();
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
  const shell = h(`<div class="shell"><div class="main"></div><aside class="side"><div class="who"><b>${esc(S.name || 'Vizsgázó')}</b>${esc(s.title)}</div><div class="stat"><div class="ring timer" id="tm">--:--</div><div>Teszten hátralévő idő</div></div><div class="sp"></div></aside></div>`);
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
  const byTopic = {};
  for (const it of wrong) { const q = BY_ID[it.id]; if (q) byTopic[q.topic] = (byTopic[q.topic] || 0) + q.points * (1 - it.frac); }
  const lost = Object.entries(byTopic).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const el = h(`<div><div class="close-head">${esc(S.name || 'Vizsgázó')} – ${esc(res.title)}</div><div class="close-body">
    <p class="verdict">A vizsga befejeződött. Eredmény: <b>${pct(ratio)}</b> (${fmt(res.got)} / ${res.max} pont)<br><span class="${pass ? '' : ''}" style="font-size:1rem;color:${ratio >= 0.7 ? 'var(--ok)' : pass ? 'var(--accent)' : 'var(--bad)'}">${verdict}</span></p>
    <div class="grid">
      <div class="card"><h3>Vizsgarészenként</h3>${TOPICS.parts.filter(p => res.parts[p.id]).map(p => { const r = res.parts[p.id], v = r.got / r.max; return `<div class="part-row"><span>${p.id}. ${esc(p.name)}</span><div class="bar ${v >= 0.7 ? 'ok' : v < PASS ? 'bad' : ''}"><i style="width:${pct(v)}"></i></div><b>${pct(v)}</b></div>`; }).join('')}
        <p class="small muted">Idő: ${Math.floor(res.secs / 60)} perc ${res.secs % 60} mp</p></div>
      <div class="card"><h3>Itt vesztetted a legtöbb pontot</h3>${lost.length ? lost.map(([t, p]) => `<div class="topic-row"><span>${esc(TOPIC[t]?.name || t)}</span><span class="small muted">−${fmt(p)} pont</span><span></span></div>`).join('') : '<p>Nincs hibád. 👏</p>'}
        ${lost.length ? '<div class="row" style="margin-top:12px"><button class="btn primary" id="drill">Gyakorold ezeket most</button></div>' : ''}</div>
    </div>
    <h2 style="margin-top:26px">Feladatok és magyarázatok</h2>
    <div class="row" style="margin-bottom:8px"><label class="small"><input type="checkbox" id="onlyBad" checked> csak a hibás / részben hibás feladatok</label></div>
    <div id="rvlist"></div>
    <div class="row" style="margin-top:20px;justify-content:center"><button class="btn green" id="home">Befejezés</button></div>
  </div></div>`);
  const list = $('#rvlist', el);
  const draw = () => {
    list.innerHTML = '';
    const only = $('#onlyBad', el).checked;
    res.items.forEach((it, n) => {
      const q = BY_ID[it.id]; if (!q || (only && it.frac >= 0.999)) return;
      const d = h(`<details class="rv"><summary><span class="pill ${it.frac >= 0.999 ? 'ok' : 'bad'}">${n + 1}.</span><span>${rich(q.q.length > 110 ? q.q.slice(0, 110).replace(/<[^>]*$/, '') + '…' : q.q)}</span><span class="sc small">${fmt(it.frac * q.points)} / ${q.points} p</span></summary><div class="inner"></div></details>`);
      d.addEventListener('toggle', () => {
        const inner = $('.inner', d); if (!d.open || inner.childElementCount) return;
        const sh = q.type === 'single' || q.type === 'multi' ? range(q.options.length) : q.type === 'match' ? range(q.pairs.length + (q.distractors?.length || 0)) : range(q.items?.length || 0);
        inner.append(renderQuestion(q, structuredClone(it.a || {}), sh, { ro: true, show: true }));
        if (!it.a || !answered(q, it.a)) inner.append(h('<p class="small" style="color:var(--bad)">Nem adtál választ.</p>'));
        inner.append(explanationBox(q, it.frac));
      });
      list.append(d);
    });
    if (!list.childElementCount) list.append(h('<p class="muted">Nincs megjeleníthető feladat.</p>'));
  };
  $('#onlyBad', el).addEventListener('change', draw);
  draw();
  $('#home', el).addEventListener('click', () => { view = { name: 'home' }; render(); });
  $('#drill', el)?.addEventListener('click', () => newSession('practice', composeWeak(20, lost.map(([t]) => t)), 0, 'Gyakorlás: hibás témák'));
  app.append(el);
  scrollTo(0, 0);
}

function renderMistakes() {
  const wrong = QUESTIONS.filter(q => S.stats[q.id] && S.stats[q.id].lastFrac < 0.999);
  const groups = {};
  for (const q of wrong) (groups[q.topic] ||= []).push(q);
  const el = h(`<div class="dash"><div class="row" style="justify-content:space-between"><h1>Hibanapló</h1><div class="row"><button class="btn" id="back">Vissza</button><button class="btn primary" id="drill">Mind gyakorlása</button></div></div>
    <p class="muted">A legutóbbi próbálkozáskor hibás vagy részben hibás kérdések. Ha legközelebb jól válaszolod meg, lekerül a listáról.</p><div id="g"></div></div>`);
  const g = $('#g', el);
  for (const [t, qs] of Object.entries(groups).sort((a, b) => b[1].length - a[1].length)) {
    g.append(h(`<h2 style="margin-top:22px">${esc(TOPIC[t]?.name || t)} <span class="pill bad">${qs.length}</span></h2>`));
    for (const q of qs) {
      const st = S.stats[q.id];
      const d = h(`<details class="rv"><summary><span>${rich(q.q.length > 120 ? q.q.slice(0, 120).replace(/<[^>]*$/, '') + '…' : q.q)}</span><span class="sc small muted">${st.wrong ? `${st.wrong}× hibás` : 'részben hibás'}</span></summary><div class="inner"></div></details>`);
      d.addEventListener('toggle', () => {
        const inner = $('.inner', d); if (!d.open || inner.childElementCount) return;
        inner.append(renderSolutionOnly(q), explanationBox(q, 0));
      });
      g.append(d);
    }
  }
  $('#back', el).addEventListener('click', () => { view = { name: 'home' }; render(); });
  $('#drill', el).addEventListener('click', () => newSession('practice', shuffle(wrong.map(q => q.id)).slice(0, 40), 0, 'Hibanapló gyakorlás'));
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
  const sh = q.type === 'single' || q.type === 'multi' ? range(q.options.length) : q.type === 'match' ? range(q.pairs.length + (q.distractors?.length || 0)) : range(q.items?.length || 0);
  return renderQuestion(q, a, sh, { ro: true, show: true });
}

// ---------- small dialogs (no native alert/confirm) ----------
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

render();
