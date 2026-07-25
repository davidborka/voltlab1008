/* Villamos szimulációs motor.
   Csomópont = "alkatreszId.sorkapocs". A huzalok es az alkatreszek belso
   kotesei egy union-find halozatot alkotnak; a betaplalasok "sin"-eket
   (L1/L2/L3/N/PE) injektalnak a halozatba. Fogyasztok (izzo, tekercs) NEM
   kotik ossze a sajat kapcsaikat, ezert egy halo, amiben fazis es nulla is
   megjelenik, valodi zarlat.

   A vedelmek kioldasa itt dol el, nem az alkatreszekben: zarlatkor az a
   megszakito old ki, amelyik bontasa megszunteti a zarlatot es kozben a
   legtobb aramkort feszultseg alatt hagyja - ez adja a szelektivitast. */
(function () {
  'use strict';
  var EE = (window.EE = window.EE || {});

  var EMPTY = new Set();
  var PHASE = { L1: 1, L2: 1, L3: 1 };
  var MAX_PASS = 14;

  function DSU() {
    this.p = new Map();
  }
  DSU.prototype.find = function (x) {
    var p = this.p;
    if (!p.has(x)) {
      p.set(x, x);
      return x;
    }
    var r = x;
    while (p.get(r) !== r) r = p.get(r);
    while (p.get(x) !== r) {
      var n = p.get(x);
      p.set(x, r);
      x = n;
    }
    return r;
  };
  DSU.prototype.union = function (a, b) {
    var ra = this.find(a),
      rb = this.find(b);
    if (ra !== rb) this.p.set(ra, rb);
  };
  EE.DSU = DSU;

  function hasPhase(set) {
    for (var r of set) if (PHASE[r]) return true;
    return false;
  }
  EE.hasPhase = hasPhase;

  function phaseOf(set) {
    for (var r of set) if (PHASE[r]) return r;
    return null;
  }
  EE.phaseOf = phaseOf;

  /* board: { parts:[{id,type,x,y,st,opt}], wires:[{id,a,b,color}] } */
  EE.solve = function (board, now) {
    var defs = EE.PARTS;
    var parts = board.parts;
    var wires = board.wires;
    var live = Object.create(null);

    /* Az alkatreszek sajat kapocsnevet hasznalnak ('L', '2'); a ctx a
       hivo alkatreszhez koti oket. Teljes kulcs ('K1.A1') is atmehet. */
    var cur = null;
    function full(t) {
      return t.indexOf('.') >= 0 ? t : cur.id + '.' + t;
    }

    function buildDsu(skipId) {
      var d = new DSU(), i, j;
      for (i = 0; i < wires.length; i++) d.union(wires[i].a, wires[i].b);
      for (i = 0; i < parts.length; i++) {
        var p = parts[i];
        if (p.id === skipId) continue;
        var def = defs[p.type];
        if (!def.links) continue;
        cur = p;
        var ls = def.links(p.st, p, { now: now });
        for (j = 0; j < ls.length; j++) d.union(p.id + '.' + ls[j][0], p.id + '.' + ls[j][1]);
      }
      return d;
    }

    function railsFor(d, skipId) {
      var rails = new Map();
      var at = function (t) {
        return rails.get(d.find(t)) || EMPTY;
      };
      var add = function (t, r) {
        var root = d.find(t);
        var s = rails.get(root);
        if (!s) {
          s = new Set();
          rails.set(root, s);
        }
        if (s.has(r)) return false;
        s.add(r);
        return true;
      };
      var sctx = {
        now: now,
        rails: function (t) { return at(full(t)); },
        live: function (k) { return !!live[k]; }
      };
      var grew = true, guard = 0;
      while (grew && guard++ < 8) {
        grew = false;
        for (var i = 0; i < parts.length; i++) {
          var p = parts[i];
          if (p.id === skipId) continue;
          var def = defs[p.type];
          if (!def.sources) continue;
          cur = p;
          var ss = def.sources(p.st, p, sctx);
          for (var k = 0; k < ss.length; k++) if (add(p.id + '.' + ss[k][0], ss[k][1])) grew = true;
        }
      }
      return { rails: rails, at: at };
    }

    function faultsFor(railMap) {
      var shorts = new Set(), earth = false;
      railMap.forEach(function (s, root) {
        var ph = 0;
        for (var r of s) if (PHASE[r]) ph++;
        if (ph > 1 || (ph > 0 && s.has('N'))) shorts.add(root);
        if (ph > 0 && s.has('PE')) {
          shorts.add(root);
          earth = true;
        }
      });
      return { shorts: shorts, earth: earth };
    }

    /* hany kapocs marad feszultseg alatt, ha ezt az eszkozt bontjuk */
    function energizedCount(d, at) {
      var n = 0;
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        var ts = EE.termsOf(p);
        for (var j = 0; j < ts.length; j++) if (hasPhase(at(p.id + '.' + ts[j].id))) n++;
      }
      return n;
    }

    function isClosed(p) {
      return p.st.tripped !== true && p.st.on !== false;
    }

    var dsu, rails, at, shorts, earthFault, oscillating = false;
    var seen = [];

    for (var pass = 0; pass < MAX_PASS; pass++) {
      dsu = buildDsu(null);
      var rr = railsFor(dsu, null);
      rails = rr.rails;
      at = rr.at;
      var f = faultsFor(rails);
      shorts = f.shorts;
      earthFault = f.earth;

      /* fogyasztok */
      var next = Object.create(null);
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        var def = defs[p.type];
        if (!def.loads) continue;
        cur = p;
        var lds = def.loads(p.st, p, { now: now });
        for (var m = 0; m < lds.length; m++) {
          var ka = p.id + '.' + lds[m].a, kb = p.id + '.' + lds[m].b;
          if (shorts.has(dsu.find(ka))) continue;
          var ra = at(ka), rb = at(kb);
          if ((hasPhase(ra) && rb.has('N')) || (hasPhase(rb) && ra.has('N'))) next[p.id + '.' + lds[m].key] = true;
        }
      }
      live = next;

      /* alkatresz-allapotok (idozito, maganyos tekercs, Fi) */
      var uctx = {
        now: now,
        rails: function (t) { return at(full(t)); },
        live: function (k) { return !!live[k]; },
        shorted: function (t) { return shorts.has(dsu.find(full(t))); },
        earth: function () { return earthFault; }
      };
      for (i = 0; i < parts.length; i++) {
        p = parts[i];
        def = defs[p.type];
        if (!def.update) continue;
        cur = p;
        def.update(p.st, p, uctx);
      }

      /* szelektiv kioldas */
      if (shorts.size) {
        var best = null;
        for (i = 0; i < parts.length; i++) {
          p = parts[i];
          def = defs[p.type];
          if (!def.protect || !isClosed(p)) continue;
          var onFault = def.protect.poles.some(function (t) {
            return shorts.has(dsu.find(p.id + '.' + t));
          });
          if (!onFault) continue;
          var d2 = buildDsu(p.id);
          var r2 = railsFor(d2, p.id);
          if (faultsFor(r2.rails).shorts.size) continue; /* nem ez a hibas ag */
          var keep = energizedCount(d2, r2.at);
          if (!best || keep > best.keep) best = { p: p, keep: keep };
        }
        if (best) {
          best.p.st.tripped = true;
        } else {
          /* egyetlen eszkoz bontasa sem szunteti meg - mind kiold, ami erintett */
          for (i = 0; i < parts.length; i++) {
            p = parts[i];
            def = defs[p.type];
            if (!def.protect || !isClosed(p)) continue;
            if (def.protect.poles.some(function (t) { return shorts.has(dsu.find(p.id + '.' + t)); })) p.st.tripped = true;
          }
        }
      }

      var sig = JSON.stringify([Object.keys(live).sort(), parts.map(function (q) { return q.st; })]);
      if (seen.length && seen[seen.length - 1] === sig) break;
      if (seen.indexOf(sig) >= 0) {
        oscillating = true;
        break;
      }
      seen.push(sig);
    }

    var fRails = rails, fDsu = dsu, fShorts = shorts, fLive = live, fEarth = earthFault, fAt = at;
    return {
      rails: fRails,
      dsu: fDsu,
      live: fLive,
      shorts: fShorts,
      earthFault: fEarth,
      oscillating: oscillating,
      railsAt: fAt,
      shortedAt: function (t) {
        return fShorts.has(fDsu.find(t));
      },
      /* ugyanaz a kapocs-feloldas, mint megoldas kozben - a rajzolas
         pontosan azt latja, amit a szimulacio szamolt */
      ctxFor: function (p) {
        var f = function (t) {
          return t.indexOf('.') >= 0 ? t : p.id + '.' + t;
        };
        return {
          now: Date.now(),
          rails: function (t) { return fAt(f(t)); },
          live: function (k) { return !!fLive[k]; },
          shorted: function (t) { return fShorts.has(fDsu.find(f(t))); },
          earth: function () { return fEarth; }
        };
      }
    };
  };

  /* Bekotes-ellenorzes: a felhasznalo huzalai altal kepzett csomopont-felosztast
     hasonlitja a megoldasehoz. Nem huzalonkent egyezteti, hanem elektromosan. */
  EE.checkWiring = function (solution, wires) {
    var want = new DSU(),
      got = new DSU(),
      known = new Set();
    solution.forEach(function (s) {
      want.union(s[0], s[1]);
      known.add(s[0]);
      known.add(s[1]);
    });
    wires.forEach(function (w) {
      got.union(w.a, w.b);
    });

    var missing = [];
    solution.forEach(function (s) {
      if (got.find(s[0]) !== got.find(s[1])) missing.push([s[0], s[1]]);
    });

    var extra = [];
    wires.forEach(function (w) {
      if (!known.has(w.a) || !known.has(w.b)) {
        extra.push([w.a, w.b, 'ismeretlen sorkapocs']);
      } else if (want.find(w.a) !== want.find(w.b)) {
        extra.push([w.a, w.b, 'nem tartozik ossze']);
      }
    });

    return { missing: missing, extra: extra, ok: !missing.length && !extra.length };
  };
})();
