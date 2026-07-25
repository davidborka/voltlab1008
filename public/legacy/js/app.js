/* Felhasznaloi felulet: rajzolas, kabelezes, pan/zoom, 3D dontes, erintes. */
(function () {
  'use strict';
  var EE = window.EE;
  var $ = function (id) { return document.getElementById(id); };

  var COLORS = [
    ['br', 'Barna - fázis', 'var(--w-br)'],
    ['bl', 'Kék - nulla', 'var(--w-bl)'],
    ['gy', 'Zöld-sárga - védőföld', 'var(--w-gy)'],
    ['bk', 'Fekete', 'var(--w-bk)'],
    ['gr', 'Szürke', 'var(--w-gr)']
  ];
  var ROLE_COLOR = { L: 'br', N: 'bl', PE: 'gy' };
  var BASE_TILT = { x: 7, y: -5 };

  var S = {
    taskId: 'A',
    task: null,
    board: { parts: [], wires: [] },
    mode: 'wire',
    color: 'br',
    armed: null,
    snap: null,
    selected: null,
    view: { x: 0, y: 0, z: 1 },
    tilt: { x: BASE_TILT.x, y: BASE_TILT.y },
    flat: false,
    gyro: false,
    sim: null,
    wid: 1
  };

  var stage = $('stage'), viewport = $('viewport'), board = $('board'), svg = $('svg');
  var gParts = $('gParts'), gCables = $('gCables'), gCsh = $('gCableShadow'),
    gTerms = $('gTerms'), gGhost = $('gGhost');

  /* ============ segedfuggvenyek ==================================== */
  function esc(s) {
    return String(s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; });
  }
  function partById(id) {
    for (var i = 0; i < S.board.parts.length; i++) if (S.board.parts[i].id === id) return S.board.parts[i];
    return null;
  }
  function termPos(key) {
    var i = key.indexOf('.');
    var p = partById(key.slice(0, i));
    if (!p) return null;
    var ts = EE.termsOf(p);
    for (var k = 0; k < ts.length; k++) {
      if (ts[k].id === key.slice(i + 1)) return { x: p.x + ts[k].x, y: p.y + ts[k].y, dir: ts[k].dir, t: ts[k], p: p };
    }
    return null;
  }
  function termName(key) {
    var t = termPos(key);
    if (!t) return key;
    return (t.p.label || t.p.id) + ' ' + (t.t.t || t.t.id);
  }

  /* ============ betoltes / mentes ================================== */
  function storeKey() { return 'ee.board.' + S.taskId; }

  function loadTask(id, fresh) {
    S.taskId = id;
    var t = EE.TASKS[id];
    S.task = t;
    S.board = {
      parts: t.parts.map(function (p) {
        var d = EE.PARTS[p.type];
        return {
          id: p.id, type: p.type, x: p.x, y: p.y, label: p.label, opt: p.opt,
          st: d.init ? d.init() : {}
        };
      }),
      wires: []
    };
    S.wid = 1;
    S.armed = null;
    S.selected = null;

    if (!fresh) {
      try {
        var raw = localStorage.getItem(storeKey());
        if (raw) {
          var saved = JSON.parse(raw);
          (saved.wires || []).forEach(function (w) {
            if (termPos(w.a) && termPos(w.b)) S.board.wires.push({ id: 'w' + S.wid++, a: w.a, b: w.b, color: w.color, m: w.m || null });
          });
          (saved.pos || []).forEach(function (q) {
            var p = partById(q.id);
            if (p) { p.x = q.x; p.y = q.y; }
          });
        }
      } catch (e) { /* romlott mentes - uj tablaval indulunk */ }
    }

    board.style.width = t.world[0] + 'px';
    board.style.height = t.world[1] + 'px';
    svg.setAttribute('viewBox', '0 0 ' + t.world[0] + ' ' + t.world[1]);
    svg.setAttribute('width', t.world[0]);
    svg.setAttribute('height', t.world[1]);
    $('plateMark').textContent = id;
    $('tTitle').textContent = t.title;
    $('tSub').textContent = t.subtitle;
    Array.prototype.forEach.call($('tabs').children, function (b) {
      b.setAttribute('aria-selected', String(b.dataset.id === id));
    });
    fit();
    paint();
  }

  var saveT = 0;
  function save() {
    clearTimeout(saveT);
    saveT = setTimeout(function () {
      try {
        localStorage.setItem(storeKey(), JSON.stringify({
          wires: S.board.wires.map(function (w) { return { a: w.a, b: w.b, color: w.color, m: w.m }; }),
          pos: S.board.parts.map(function (p) { return { id: p.id, x: p.x, y: p.y }; })
        }));
      } catch (e) { /* tele a tarhely - a tabla akkor is mukodik */ }
    }, 250);
  }

  /* ============ szimulacio ========================================= */
  function solve() {
    S.sim = EE.solve(S.board, Date.now());
    return S.sim;
  }

  /* Barmi lehet betaplalas, ami a definiciojaban supply-nak jeloli magat
     (egy- es haromfazisu halozat egyarant). */
  function isSupply(p) {
    return !!EE.PARTS[p.type].supply;
  }
  function powered() {
    return S.board.parts.some(function (p) { return isSupply(p) && p.st.on; });
  }

  /* ============ rajzolas =========================================== */
  function paint() {
    var sim = solve();
    var ph = [], th = [];
    S.board.parts.forEach(function (p) {
      var d = EE.PARTS[p.type];
      var ctx = sim.ctxFor(p);
      ph.push('<g class="part" data-part="' + p.id + '" transform="translate(' + p.x + ',' + p.y + ')">' +
        d.draw(p, p.st, ctx) + '</g>');

      EE.termsOf(p).forEach(function (t) {
        var key = p.id + '.' + t.id;
        var rails = sim.railsAt(key);
        var cls = 'term';
        if (sim.shortedAt(key)) cls += ' short';
        else if (EE.hasPhase(rails)) cls += ' hot';
        else if (rails.has('N')) cls += ' neutral';
        if (S.armed === key) cls += ' armed';
        if (S.snap === key) cls += ' snap';
        var x = p.x + t.x, y = p.y + t.y;
        var lo = labelOffset(t.dir);
        th.push('<g class="' + cls + '" data-term="' + key + '">' +
          '<circle class="hit" cx="' + x + '" cy="' + y + '" r="' + hitR() + '"/>' +
          '<circle class="tscrew" cx="' + x + '" cy="' + y + '" r="8"/>' +
          '<path class="tslot" d="M' + (x - 4) + ',' + y + ' h8"/>' +
          (t.t ? '<text class="tlabel" x="' + (x + lo[0]) + '" y="' + (y + lo[1]) + '">' + esc(t.t) + '</text>' : '') +
          '</g>');
      });
    });
    gParts.innerHTML = ph.join('');
    gTerms.innerHTML = th.join('');
    paintCables(sim);
    paintStatus(sim);
  }

  function labelOffset(dir) {
    return dir === 'n' ? [0, -14] : dir === 's' ? [0, 22] : dir === 'w' ? [-16, 4] : [16, 4];
  }

  /* A sorkapocs erintofelulete a nagyitastol fuggetlenul kb. ujjnyi maradjon. */
  function hitR() {
    return Math.max(20, Math.round(22 / S.view.z));
  }

  /* Magneses tapadas: huzas kozben a legkozelebbi sorkapocs, ha eleg kozel van.
     A sugar a nagyitassal skalazodik, hogy ujjal is konnyu legyen eltalalni. */
  function nearestTerm(pt, exclude) {
    var R = Math.max(52, 46 / S.view.z), best = null, bd = R * R;
    S.board.parts.forEach(function (p) {
      EE.termsOf(p).forEach(function (t) {
        var key = p.id + '.' + t.id;
        if (key === exclude) return;
        var dx = p.x + t.x - pt.x, dy = p.y + t.y - pt.y, d = dx * dx + dy * dy;
        if (d < bd) { bd = d; best = key; }
      });
    });
    return best;
  }

  function markSnap() {
    Array.prototype.forEach.call(gTerms.children, function (g) {
      g.classList.toggle('snap', g.dataset.term === S.snap);
    });
  }

  function drawGhost(fromKey, pt) {
    var a = termPos(fromKey);
    if (!a) return;
    var t = S.snap ? termPos(S.snap) : { x: pt.x, y: pt.y, dir: 'w' };
    var s = '<path class="cable ghost c-' + S.color + (S.snap ? ' locked' : '') + '" d="' +
      cableD(a, t, null, '') + '"/>';
    if (S.snap) {
      /* a tabla tetejen a cimke kilogna, ilyenkor a kapocs ala kerul */
      var ly = t.y < 96 ? t.y + 34 : t.y - 62;
      s += '<circle class="snapring" cx="' + t.x + '" cy="' + t.y + '" r="20"/>' +
        '<rect class="snaplabelbg" x="' + (t.x - 62) + '" y="' + ly + '" width="124" height="30" rx="8"/>' +
        '<text class="snaplabel" x="' + t.x + '" y="' + (ly + 20) + '">' + esc(termName(S.snap)) + '</text>';
    }
    gGhost.innerHTML = s;
  }
  function updateHitR() {
    var r = hitR();
    Array.prototype.forEach.call(gTerms.children, function (g) {
      g.children[0].setAttribute('r', r);
    });
  }

  function dirVec(d) {
    return d === 'n' ? [0, -1] : d === 's' ? [0, 1] : d === 'w' ? [-1, 0] : [1, 0];
  }

  /* Az azonos kapocsbol indulo kabelek kulonben pontosan fedik egymast,
     ezert a huzal azonositojabol szarmazo apro elteritest kapnak. */
  function jitter(id) {
    var h = 0;
    for (var i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
    return ((h % 7) - 3) * 5;
  }

  function cableD(a, b, m, id) {
    var L = Math.hypot(b.x - a.x, b.y - a.y);
    var k = Math.min(48, Math.max(18, L * 0.16));
    var j = id ? jitter(id) : 0;
    var va = dirVec(a.dir), vb = dirVec(b.dir);
    var c1x = a.x + va[0] * k - va[1] * j, c1y = a.y + va[1] * k + va[0] * j;
    var c2x = b.x + vb[0] * k - vb[1] * j, c2y = b.y + vb[1] * k + vb[0] * j;
    var mid = m || defaultMid(a, b, j);
    var mx = mid.x, my = mid.y;
    var tx = b.x - a.x, ty = b.y - a.y, tl = Math.hypot(tx, ty) || 1;
    var t = Math.min(70, L * 0.26);
    return 'M' + a.x + ',' + a.y +
      ' C' + c1x + ',' + c1y + ' ' + (mx - tx / tl * t) + ',' + (my - ty / tl * t) + ' ' + mx + ',' + my +
      ' C' + (mx + tx / tl * t) + ',' + (my + ty / tl * t) + ' ' + c2x + ',' + c2y + ' ' + b.x + ',' + b.y;
  }

  function defaultMid(a, b, j) {
    var L = Math.hypot(b.x - a.x, b.y - a.y);
    return { x: (a.x + b.x) / 2 + (j || 0), y: (a.y + b.y) / 2 + Math.min(20, L * 0.05) };
  }

  function cableMid(w) {
    var a = termPos(w.a), b = termPos(w.b);
    if (!a || !b) return null;
    return w.m ? { x: w.m[0], y: w.m[1] } : defaultMid(a, b, jitter(w.id));
  }

  function paintCables(sim) {
    sim = sim || S.sim;
    var cs = [], sh = [];
    S.board.wires.forEach(function (w) {
      var a = termPos(w.a), b = termPos(w.b);
      if (!a || !b) return;
      var d = cableD(a, b, w.m, w.id);
      var hot = sim && EE.hasPhase(sim.railsAt(w.a));
      var bad = sim && sim.shortedAt(w.a);
      sh.push('<path class="cshadow" d="' + d + '" transform="translate(6,11)"/>');
      cs.push('<path class="cable c-' + w.color + (S.selected === w.id ? ' sel' : '') + '" data-wire="' + w.id + '" d="' + d + '"/>');
      cs.push('<path class="chi" d="' + d + '" transform="translate(-1.5,-2)" opacity="0.35"/>');
      if (w.color === 'gy') cs.push('<path class="cstripe" d="' + d + '"/>');
      if (hot || bad) cs.push('<path class="cflow' + (bad ? ' cfault' : '') + '" d="' + d + '"/>');
      if (S.selected === w.id) {
        var m = cableMid(w);
        cs.push('<circle class="chandle" data-handle="' + w.id + '" cx="' + m.x + '" cy="' + m.y + '" r="13"><title>Húzd, hogy elrendezd a kábelt</title></circle>');
        cs.push('<g class="cdel" data-del="' + w.id + '">' +
          '<circle class="cdelbg" cx="' + (m.x + 44) + '" cy="' + (m.y - 30) + '" r="19"/>' +
          '<path class="cdelx" d="M' + (m.x + 36) + ',' + (m.y - 38) + ' l16,16 M' + (m.x + 52) + ',' + (m.y - 38) + ' l-16,16"/>' +
          '<title>Kábel törlése</title></g>');
      }
    });
    gCsh.innerHTML = sh.join('');
    gCables.innerHTML = cs.join('');
  }

  function paintStatus(sim) {
    var el = $('status'), txt = el.querySelector('.txt');
    var on = powered();
    el.classList.toggle('on', on && !sim.earthFault && !sim.shorts.size);
    el.classList.toggle('fault', !!(sim.shorts.size || sim.earthFault));
    var tripped = S.board.parts.filter(function (p) { return p.st && p.st.tripped; });
    if (tripped.length) {
      txt.textContent = tripped.map(function (p) { return p.label; }).join(', ') + ' kioldott';
    } else if (sim.oscillating) {
      txt.textContent = 'a vezérlés csattog';
    } else if (sim.shorts.size) {
      txt.textContent = 'zárlat';
    } else {
      txt.textContent = on ? 'feszültség alatt' : 'feszültségmentes';
    }
    $('bPower').classList.toggle('on', on);
    $('bPower').firstChild.nodeValue = on ? 'Feszültség ki ' : 'Feszültség be ';
  }

  /* ============ nezet: pan / zoom / dontes ========================= */
  function applyView() {
    viewport.style.transform = 'translate(' + S.view.x + 'px,' + S.view.y + 'px) scale(' + S.view.z + ')';
  }
  function applyTilt() {
    board.style.transform = S.flat
      ? 'perspective(2400px)'
      : 'perspective(2400px) rotateX(' + S.tilt.x.toFixed(2) + 'deg) rotateY(' + S.tilt.y.toFixed(2) + 'deg)';
  }
  /* A tabla belefer, ha lehet; ha tul magas, inkabb olvashato maradjon es
     felulrol induljon - lefele gorgetheto. */
  function fit() {
    var r = stage.getBoundingClientRect();
    var w = S.task.world[0], h = S.task.world[1];
    var pad = r.width < 700 ? 16 : 40;
    var z = Math.min((r.width - pad) / w, (r.height - pad) / h);
    S.view.z = Math.max(r.width < 700 ? 0.16 : 0.34, Math.min(1.4, z));
    S.view.x = (r.width - w * S.view.z) / 2;
    var used = h * S.view.z;
    S.view.y = used <= r.height ? (r.height - used) / 2 : pad / 2;
    applyView();
  }
  function zoomAt(cx, cy, factor) {
    var r = stage.getBoundingClientRect();
    var px = cx - r.left, py = cy - r.top;
    var nz = Math.max(0.12, Math.min(3, S.view.z * factor));
    S.view.x = px - (px - S.view.x) * (nz / S.view.z);
    S.view.y = py - (py - S.view.y) * (nz / S.view.z);
    S.view.z = nz;
    applyView();
    clearTimeout(hitT);
    hitT = setTimeout(updateHitR, 120);
  }
  var hitT = 0;

  /* kepernyo -> tabla koordinata, a 3D vetitest is visszafejtve */
  function boardMatrix() {
    var t = getComputedStyle(board).transform;
    if (!t || t === 'none') return null;
    var nums = t.slice(t.indexOf('(') + 1, -1).split(',').map(parseFloat);
    if (nums.length === 6) {
      return [nums[0], nums[1], 0, 0, nums[2], nums[3], 0, 0, 0, 0, 1, 0, nums[4], nums[5], 0, 1];
    }
    return nums.length === 16 ? nums : null;
  }
  function unproject(M, sx, sy) {
    var a11 = M[0] - sx * M[3], a12 = M[4] - sx * M[7], b1 = sx * M[15] - M[12];
    var a21 = M[1] - sy * M[3], a22 = M[5] - sy * M[7], b2 = sy * M[15] - M[13];
    var det = a11 * a22 - a12 * a21;
    if (!det) return [sx, sy];
    return [(b1 * a22 - a12 * b2) / det, (a11 * b2 - b1 * a21) / det];
  }
  function toWorld(cx, cy) {
    var r = stage.getBoundingClientRect();
    var x = (cx - r.left - S.view.x) / S.view.z;
    var y = (cy - r.top - S.view.y) / S.view.z;
    var M = boardMatrix();
    if (M) {
      var ox = S.task.world[0] / 2, oy = S.task.world[1] / 2;
      var p = unproject(M, x - ox, y - oy);
      x = p[0] + ox;
      y = p[1] + oy;
    }
    return { x: x, y: y };
  }

  /* ============ interakcio ========================================= */
  var drag = null, pointers = new Map(), pinch = null;

  /* nehany bongeszo eldobja a rogzitest (pl. szintetikus esemenynel) -
     a huzas ettol meg mukodjon */
  function capture(e) {
    try { stage.setPointerCapture(e.pointerId); } catch (err) { /* nem baj */ }
  }

  /* A panel, a zoom gombok es a buborek a tabla FOLOTT ulnek. Ha a tabla
     elkapja rajtuk a mutatot (pointer capture), a gombok kattintasa sosem
     sul el - ezert ezeket az esemenyeket erintetlenul tovabbengedjuk. */
  function inOverlay(e) {
    return !!(e.target && e.target.closest && e.target.closest('.sheet, .zoomers, .toast'));
  }

  stage.addEventListener('pointerdown', function (e) {
    if (inOverlay(e)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      var a = Array.from(pointers.values());
      pinch = {
        d: Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y),
        cx: (a[0].x + a[1].x) / 2,
        cy: (a[0].y + a[1].y) / 2
      };
      drag = null;
      return;
    }
    if (pointers.size > 1) return;

    var t = e.target;
    var tEl = t.closest ? t.closest('[data-term]') : null;
    var hEl = t.closest ? t.closest('[data-handle]') : null;
    var dEl = t.closest ? t.closest('[data-del]') : null;
    var wEl = t.closest ? t.closest('[data-wire]') : null;
    var pEl = t.closest ? t.closest('[data-part]') : null;
    board.classList.add('free');

    if (S.mode === 'run') {
      if (pEl) {
        var p = partById(pEl.dataset.part);
        var d = EE.PARTS[p.type];
        if (d.hold) {
          p.st.p = true;
          paint();
          drag = { kind: 'hold', part: p };
          capture(e);
          return;
        }
        if (d.tap) { d.tap(p.st); paint(); save(); return; }
      }
      startPan(e);
      return;
    }

    if (dEl) { removeWire(dEl.dataset.del); toast('Kábel törölve.'); return; }
    if (hEl) {
      var w = S.board.wires.filter(function (q) { return q.id === hEl.dataset.handle; })[0];
      drag = { kind: 'handle', w: w };
      capture(e);
      return;
    }
    if (tEl) {
      var key = tEl.dataset.term;
      /* Ha mar ki van jelolve egy masik kapocs, ez a koppintas osszekoti oket. */
      if (S.armed && S.armed !== key) { armTerm(key); return; }
      /* Kulonben huzas indul: elengedeskor a legkozelebbi kapocsra ragad. */
      var t0 = termPos(key);
      if (t0 && t0.t.role && ROLE_COLOR[t0.t.role]) setColor(ROLE_COLOR[t0.t.role]);
      S.armed = key;
      S.snap = null;
      drag = { kind: 'wire', from: key, moved: false, sx: e.clientX, sy: e.clientY };
      capture(e);
      paint();
      drawGhost(key, toWorld(e.clientX, e.clientY));
      return;
    }
    if (wEl) {
      S.selected = S.selected === wEl.dataset.wire ? null : wEl.dataset.wire;
      paintCables();
      return;
    }
    if (pEl) {
      var pp = partById(pEl.dataset.part);
      var w0 = toWorld(e.clientX, e.clientY);
      drag = { kind: 'part', part: pp, dx: w0.x - pp.x, dy: w0.y - pp.y, moved: false, el: pEl };
      pEl.classList.add('dragging');
      capture(e);
      return;
    }
    S.selected = null;
    S.armed = null;
    S.snap = null;
    gGhost.innerHTML = '';
    paint();
    startPan(e);
  });

  function startPan(e) {
    drag = { kind: 'pan', sx: e.clientX, sy: e.clientY, vx: S.view.x, vy: S.view.y, orbit: e.shiftKey || e.altKey, tx: S.tilt.x, ty: S.tilt.y };
    stage.classList.add('grabbing');
    capture(e);
  }

  stage.addEventListener('pointermove', function (e) {
    if (!drag && !S.armed && inOverlay(e)) return;
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && pointers.size === 2) {
      var a = Array.from(pointers.values());
      var d = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y);
      var cx = (a[0].x + a[1].x) / 2, cy = (a[0].y + a[1].y) / 2;
      if (pinch.d > 0) zoomAt(cx, cy, d / pinch.d);
      S.view.x += cx - pinch.cx;
      S.view.y += cy - pinch.cy;
      applyView();
      pinch = { d: d, cx: cx, cy: cy };
      return;
    }
    if (drag && drag.kind === 'wire') {
      if (Math.abs(e.clientX - drag.sx) + Math.abs(e.clientY - drag.sy) > 6) drag.moved = true;
      var wp = toWorld(e.clientX, e.clientY);
      var sn = nearestTerm(wp, drag.from);
      if (sn !== S.snap) { S.snap = sn; markSnap(); }
      drawGhost(drag.from, wp);
      return;
    }
    if (S.armed) {
      var wg = toWorld(e.clientX, e.clientY);
      var sn2 = nearestTerm(wg, S.armed);
      if (sn2 !== S.snap) { S.snap = sn2; markSnap(); }
      drawGhost(S.armed, wg);
    }
    if (!drag) return;
    if (drag.kind === 'pan') {
      if (drag.orbit) {
        S.tilt.x = Math.max(-28, Math.min(28, drag.tx - (e.clientY - drag.sy) * 0.13));
        S.tilt.y = Math.max(-32, Math.min(32, drag.ty + (e.clientX - drag.sx) * 0.13));
        applyTilt();
      } else {
        S.view.x = drag.vx + (e.clientX - drag.sx);
        S.view.y = drag.vy + (e.clientY - drag.sy);
        applyView();
      }
    } else if (drag.kind === 'part') {
      var w1 = toWorld(e.clientX, e.clientY);
      drag.part.x = Math.round((w1.x - drag.dx) / 10) * 10;
      drag.part.y = Math.round((w1.y - drag.dy) / 10) * 10;
      drag.moved = true;
      drag.el.setAttribute('transform', 'translate(' + drag.part.x + ',' + drag.part.y + ')');
      paintTermsFast();
      paintCables();
    } else if (drag.kind === 'handle') {
      var w2 = toWorld(e.clientX, e.clientY);
      drag.w.m = [Math.round(w2.x), Math.round(w2.y)];
      paintCables();
    }
  });

  function paintTermsFast() {
    Array.prototype.forEach.call(gTerms.children, function (g) {
      var key = g.dataset.term;
      var t = termPos(key);
      if (!t) return;
      g.children[0].setAttribute('cx', t.x); g.children[0].setAttribute('cy', t.y);
      g.children[1].setAttribute('cx', t.x); g.children[1].setAttribute('cy', t.y);
      g.children[2].setAttribute('d', 'M' + (t.x - 4) + ',' + t.y + ' h8');
      if (g.children[3]) {
        var lo = labelOffset(t.dir);
        g.children[3].setAttribute('x', t.x + lo[0]);
        g.children[3].setAttribute('y', t.y + lo[1]);
      }
    });
  }

  function endPointer(e) {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = null;
    stage.classList.remove('grabbing');
    board.classList.remove('free');
    if (!drag) return;
    if (drag.kind === 'hold') { drag.part.st.p = false; paint(); }
    if (drag.kind === 'part') { drag.el.classList.remove('dragging'); if (drag.moved) save(); }
    if (drag.kind === 'handle') save();
    if (drag.kind === 'wire') {
      var to = S.snap;
      S.snap = null;
      if (to) {
        armTerm(to);           /* ide huzta - ossze is kotjuk */
      } else if (drag.moved) {
        S.armed = null;        /* a semmibe engedte el */
        gGhost.innerHTML = '';
        paint();
      }
      /* ha nem mozdult, a kapocs kijelolve marad: mehet a ket koppintasos mod */
    }
    drag = null;
  }
  stage.addEventListener('pointerup', endPointer);
  stage.addEventListener('pointercancel', endPointer);

  stage.addEventListener('wheel', function (e) {
    if (inOverlay(e)) return; /* a panel gorgesse magat, ne a tablat nagyitsa */
    e.preventDefault();
    zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.12 : 1 / 1.12);
  }, { passive: false });

  stage.addEventListener('contextmenu', function (e) {
    var wEl = e.target.closest ? e.target.closest('[data-wire]') : null;
    if (wEl) { e.preventDefault(); removeWire(wEl.dataset.wire); }
  });

  function armTerm(key) {
    if (!S.armed) {
      S.armed = key;
      var t = termPos(key);
      if (t && t.t.role && ROLE_COLOR[t.t.role]) setColor(ROLE_COLOR[t.t.role]);
      paint();
      return;
    }
    if (S.armed === key) { S.armed = null; gGhost.innerHTML = ''; paint(); return; }
    var dup = S.board.wires.some(function (w) {
      return (w.a === S.armed && w.b === key) || (w.b === S.armed && w.a === key);
    });
    if (dup) { toast('Ez a két kapocs már össze van kötve.', true); }
    else {
      S.board.wires.push({ id: 'w' + S.wid++, a: S.armed, b: key, color: S.color, m: null });
      save();
    }
    S.armed = null;
    S.snap = null;
    gGhost.innerHTML = '';
    paint();
  }

  function removeWire(id) {
    S.board.wires = S.board.wires.filter(function (w) { return w.id !== id; });
    if (S.selected === id) S.selected = null;
    save();
    paint();
  }

  /* ============ dokk ============================================== */
  function setColor(c) {
    S.color = c;
    Array.prototype.forEach.call($('swatches').children, function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.c === c));
    });
  }

  function setMode(m) {
    S.mode = m;
    $('mWire').setAttribute('aria-pressed', String(m === 'wire'));
    $('mRun').setAttribute('aria-pressed', String(m === 'run'));
    S.armed = null;
    S.snap = null;
    S.selected = null;
    gGhost.innerHTML = '';
    svg.style.cursor = m === 'run' ? 'pointer' : '';
    setHint();
    paint();
  }

  function setHint() {
    $('hint').textContent = S.mode === 'wire'
      ? 'Húzd a kábelt az egyik kapocsról a másikra - odaugrik a legközelebbihez. Kábelre koppintva jön a törlés (×). Shift+húzás: 3D forgatás.'
      : 'Kapcsolókra, gombokra, megszakítókra koppintva működtetheted a táblát.';
  }

  var toastT = 0;
  function toast(msg, bad) {
    var el = $('toast');
    el.textContent = msg;
    el.classList.toggle('bad', !!bad);
    el.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(function () { el.classList.remove('show'); }, 2600);
  }

  function sheet(html) {
    $('sheetBody').innerHTML = html;
    $('sheet').hidden = false;
  }
  $('sheetClose').onclick = function () { $('sheet').hidden = true; };

  $('bPower').onclick = function () {
    var on = powered();
    S.board.parts.forEach(function (p) { if (isSupply(p)) p.st.on = !on; });
    paint();
  };

  $('bReset').onclick = function () {
    if (!confirm('Biztosan törlöd a bekötést és elölről kezded?')) return;
    localStorage.removeItem(storeKey());
    loadTask(S.taskId, true);
    toast('Tábla visszaállítva.');
  };

  /* A megoldas nem csak bekot, hanem uzemkesz allapotba is teszi a tablat:
     uzem mod, feszultseg, motorvedo behuzva - kulonben a diak azt latja,
     hogy "bekototte" es megsem tortenik semmi. */
  $('bSolve').onclick = function () {
    if (S.board.wires.length && !confirm('A megoldás felülírja a mostani bekötésedet. Folytatod?')) return;
    S.board.wires = S.task.solution.map(function (s) {
      return { id: 'w' + S.wid++, a: s[0], b: s[1], color: s[2], m: null };
    });
    S.board.parts.forEach(function (p) {
      if (isSupply(p) || p.type === 'mprot' || p.type === 'mainsw') p.st.on = true;
      if (p.st && p.st.tripped) p.st.tripped = false;
    });
    save();
    setMode('run');
    toast(S.board.parts.some(function (p) { return p.type === 'motor' || p.type === 'motor1'; })
      ? 'Kész, üzem alatt. Tartsd nyomva az indító nyomógombot - a motor elindul.'
      : 'Kész, üzem alatt. Nyomd meg a nyomógombot vagy kapcsold a kapcsolót.');
  };

  $('bCheck').onclick = function () {
    var r = EE.checkWiring(S.task.solution, S.board.wires);
    var html = '<div class="eyebrow">Ellenőrzés</div><h2>' + esc(S.task.title) + '</h2><div class="report">';
    if (r.ok) {
      html += '<div class="verdict ok">A bekötés megegyezik a referenciamegoldással.</div>';
    } else {
      html += '<div class="verdict bad">' + r.missing.length + ' hiányzó és ' + r.extra.length + ' felesleges kötés.</div>';
      r.missing.slice(0, 14).forEach(function (m) {
        html += '<div class="line"><b>hiányzik</b> ' + esc(termName(m[0])) + ' → ' + esc(termName(m[1])) + '</div>';
      });
      if (r.missing.length > 14) html += '<div class="line">… és még ' + (r.missing.length - 14) + '</div>';
      r.extra.slice(0, 10).forEach(function (m) {
        html += '<div class="line"><b>felesleges</b> ' + esc(termName(m[0])) + ' → ' + esc(termName(m[1])) + ' <i>(' + esc(m[2]) + ')</i></div>';
      });
      if (r.extra.length > 10) html += '<div class="line">… és még ' + (r.extra.length - 10) + '</div>';
    }
    sheet(html + '</div>');
  };

  $('bTask').onclick = function () {
    var t = S.task;
    sheet('<div class="eyebrow">' + t.id + ' feladat</div><h2>' + esc(t.title) + '</h2>' +
      '<p>' + esc(t.brief) + '</p><ol>' +
      t.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>');
  };

  $('bSheet').onclick = function () {
    sheet('<div class="eyebrow">Eredeti vizsgarajz</div><h2>' + S.taskId + ' feladat</h2>' +
      '<img src="reference/' + S.taskId + '.png" alt="A ' + S.taskId + ' feladat kapcsolási rajza" loading="lazy">');
  };

  $('bParts').onclick = function () {
    var html = '<div class="eyebrow">Alkatrészek</div><h2>Tegyél a táblára</h2>' +
      '<p>Az alkatrész a nézet közepére kerül, onnan húzhatod a helyére.</p><div class="palette-grid">';
    EE.PALETTE.forEach(function (t) {
      html += '<button data-add="' + t + '">' + esc(EE.PARTS[t].name) + '</button>';
    });
    sheet(html + '</div>');
  };

  $('sheetBody').addEventListener('click', function (e) {
    var b = e.target.closest('[data-add]');
    if (!b) return;
    var type = b.dataset.add, d = EE.PARTS[type];
    var n = 1;
    while (partById(type + n)) n++;
    var r = stage.getBoundingClientRect();
    var c = toWorld(r.left + r.width / 2, r.top + r.height / 2);
    S.board.parts.push({
      id: type + n, type: type, x: Math.round(c.x - d.w / 2), y: Math.round(c.y - d.h / 2),
      label: (d.name || type).slice(0, 2).toUpperCase() + n,
      opt: type === 'contactor' ? { aux: [['13', '14', 'no'], ['21', '22', 'nc']] } : null,
      st: d.init ? d.init() : {}
    });
    $('sheet').hidden = true;
    save();
    paint();
    toast(d.name + ' hozzáadva.');
  });

  $('bFull').onclick = function () {
    var d = document;
    if (d.fullscreenElement || d.webkitFullscreenElement) {
      (d.exitFullscreen || d.webkitExitFullscreen).call(d);
    } else {
      var e = d.documentElement;
      var req = e.requestFullscreen || e.webkitRequestFullscreen;
      if (req) req.call(e).catch(function () { toast('A böngésző nem engedte a teljes képernyőt.', true); });
      else toast('Ez a böngésző nem tud teljes képernyőt.', true);
    }
  };
  document.addEventListener('fullscreenchange', function () { setTimeout(fit, 120); });

  $('zIn').onclick = function () { var r = stage.getBoundingClientRect(); zoomAt(r.left + r.width / 2, r.top + r.height / 2, 1.25); };
  $('zOut').onclick = function () { var r = stage.getBoundingClientRect(); zoomAt(r.left + r.width / 2, r.top + r.height / 2, 1 / 1.25); };
  $('zFit').onclick = fit;
  $('mWire').onclick = function () { setMode('wire'); };
  $('mRun').onclick = function () { setMode('run'); };

  document.addEventListener('keydown', function (e) {
    if (e.target.tagName === 'INPUT') return;
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (S.selected) { e.preventDefault(); removeWire(S.selected); }
    } else if (e.key === 'Escape') {
      S.armed = null; S.snap = null; S.selected = null; gGhost.innerHTML = ''; $('sheet').hidden = true; paint();
    } else if (e.key === 'p' || e.key === 'P') {
      $('bPower').click();
    } else if (e.key === '3') {
      S.flat = !S.flat; applyTilt();
    }
  });

  /* giroszkop mobilon */
  function enableGyro() {
    function onOri(ev) {
      if (!S.gyro) return;
      S.tilt.x = Math.max(-24, Math.min(24, BASE_TILT.x + ((ev.beta || 0) - 40) * 0.35));
      S.tilt.y = Math.max(-28, Math.min(28, BASE_TILT.y + (ev.gamma || 0) * 0.35));
      applyTilt();
    }
    if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission) {
      DeviceOrientationEvent.requestPermission().then(function (r) {
        if (r === 'granted') { S.gyro = true; window.addEventListener('deviceorientation', onOri); }
        else toast('A telefon nem engedte a dőlésérzékelőt.', true);
      }).catch(function () { toast('A dőlésérzékelő nem érhető el.', true); });
    } else if (window.DeviceOrientationEvent) {
      S.gyro = true;
      window.addEventListener('deviceorientation', onOri);
    } else {
      toast('Ez az eszköz nem tud dőlést mérni.', true);
    }
  }
  EE.enableGyro = enableGyro;

  /* ============ indulas ============================================ */
  EE.TASK_ORDER.forEach(function (id) {
    var b = document.createElement('button');
    b.textContent = id;
    b.dataset.id = id;
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-selected', 'false');
    b.title = EE.TASKS[id].title;
    b.onclick = function () { loadTask(id); };
    $('tabs').appendChild(b);
  });

  COLORS.forEach(function (c) {
    var b = document.createElement('button');
    b.className = 'sw';
    b.dataset.c = c[0];
    b.title = c[1];
    b.setAttribute('aria-label', c[1]);
    b.setAttribute('aria-pressed', String(c[0] === S.color));
    b.innerHTML = '<i style="background:' + c[2] + (c[0] === 'gy' ? ';background:repeating-linear-gradient(45deg,var(--w-gy) 0 5px,var(--w-gy2) 5px 10px)' : '') + '"></i>';
    b.onclick = function () { setColor(c[0]); };
    $('swatches').appendChild(b);
  });

  /* konzolbol elerheto allapot - fejlesztéshez és onteszthez */
  EE.app = { S: S, paint: paint, solve: solve, part: partById, load: loadTask, fit: fit };

  applyTilt();
  setHint();
  loadTask('A');

  var rt = 0;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(fit, 150);
  });

  /* A lepcsohazi automata visszaszamlal - amig jar, ujrarajzolunk. A lejarat
     utan meg egyszer rajzolni kell, kulonben a kep megfagy a vilagito lampan. */
  var stairWasRunning = false;
  setInterval(function () {
    var running = S.board.parts.some(function (p) { return p.type === 'stair' && p.st.until > Date.now(); });
    if (running || stairWasRunning) paint();
    stairWasRunning = running;
  }, 200);
})();
