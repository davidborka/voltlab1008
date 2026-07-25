/* Onteszt: mind a negy feladat referenciamegoldasat bekoti, aramot ad ra
   es vegigjatssza a mukodest. Nyisd meg a tests/index.html-t - zold = jo.
   Bongeszo-fuggetlen, nincs teszt-keretrendszer. */
(function () {
  'use strict';
  var EE = window.EE;
  var out = [], fails = 0;

  function board(taskId) {
    var t = EE.TASKS[taskId];
    return {
      task: t,
      parts: t.parts.map(function (p) {
        var d = EE.PARTS[p.type];
        return { id: p.id, type: p.type, x: p.x, y: p.y, label: p.label, opt: p.opt, st: d.init ? d.init() : {} };
      }),
      wires: t.solution.map(function (s, i) { return { id: 'w' + i, a: s[0], b: s[1], color: s[2] }; })
    };
  }
  function get(b, id) {
    for (var i = 0; i < b.parts.length; i++) if (b.parts[i].id === id) return b.parts[i];
    throw new Error('nincs ilyen alkatresz: ' + id);
  }
  function run(b) { return EE.solve(b, Date.now()); }
  function lit(sim, key) { return !!sim.live[key]; }

  function ok(name, cond, detail) {
    if (!cond) fails++;
    out.push({ ok: !!cond, name: name, detail: detail || '' });
  }

  /* --- kapcsok letezese minden megoldasban ------------------------- */
  EE.TASK_ORDER.forEach(function (id) {
    var b = board(id), missing = [];
    var known = {};
    b.parts.forEach(function (p) {
      EE.termsOf(p).forEach(function (t) { known[p.id + '.' + t.id] = 1; });
    });
    b.wires.forEach(function (w) {
      if (!known[w.a]) missing.push(w.a);
      if (!known[w.b]) missing.push(w.b);
    });
    ok(id + ': a megoldás minden kapcsa létezik', !missing.length, missing.join(', '));
  });

  /* --- A feladat ---------------------------------------------------- */
  (function () {
    var b = board('A'), sim;
    sim = run(b);
    ok('A: feszültségmentesen semmi nem világít', !lit(sim, 'E1.on') && !lit(sim, 'E2.on'));

    get(b, 'SUP').st.on = true;
    sim = run(b);
    ok('A: bekapcsolás után nincs zárlat', sim.shorts.size === 0 && !sim.earthFault);
    ok('A: E1 még sötét (automata nem indult)', !lit(sim, 'E1.on'));
    ok('A: E2 világít (K2 és K3 azonos állásban)', lit(sim, 'E2.on'));

    get(b, 'K3').st.pos = 1;
    sim = run(b);
    ok('A: K3 átkapcsolva E2 elalszik', !lit(sim, 'E2.on'));
    get(b, 'K2').st.pos = 1;
    sim = run(b);
    ok('A: K2 is átkapcsolva E2 újra világít', lit(sim, 'E2.on'));

    get(b, 'S1').st.p = true;
    sim = run(b);
    ok('A: S1 nyomógomb elindítja az automatát, E1 világít', lit(sim, 'E1.on'));
    get(b, 'S1').st.p = false;
    sim = run(b);
    ok('A: gomb elengedve az automata még jár', lit(sim, 'E1.on'));
    ok('A: az automata visszaszámlál', get(b, 'LA').st.until > Date.now());

    get(b, 'LA').st.until = 0;
    sim = run(b);
    ok('A: idő lejárta után E1 elalszik', !lit(sim, 'E1.on'));
    get(b, 'S2').st.p = true;
    sim = run(b);
    ok('A: S2 nyomógomb is indít', lit(sim, 'E1.on'));
    get(b, 'S2').st.p = false;
    get(b, 'LA').st.until = 0;
    get(b, 'K1').st.on = true;
    sim = run(b);
    ok('A: K1 kapcsoló is indít', lit(sim, 'E1.on'));

    get(b, 'X1').st.plug = true;
    sim = run(b);
    ok('A: dugaljba dugott fogyasztó működik', lit(sim, 'X1.on'));

    get(b, 'F3').st.on = false;
    sim = run(b);
    ok('A: F-3 lekapcsolva a dugalj feszültségmentes', !lit(sim, 'X1.on'));
    get(b, 'F3').st.on = true;

    /* zarlat: F-3 kimenete a nulla sinre */
    b.wires.push({ id: 'zz', a: 'F3.2', b: 'NB.b5', color: 'bk' });
    sim = run(b);
    ok('A: fázis-nulla zárlat kiveri az F-3-at', get(b, 'F3').st.tripped === true);
    ok('A: a zárlat nem érinti a másik két kört', get(b, 'F1').st.tripped === false && get(b, 'F2').st.tripped === false);
    b.wires.pop();

    /* testzarlat: fazis a PE-re -> Fi kiold */
    var b2 = board('A');
    get(b2, 'SUP').st.on = true;
    b2.wires.push({ id: 'ee', a: 'F2.2', b: 'PB.b3', color: 'bk' });
    sim = run(b2);
    ok('A: fázis a védőföldön kiveri a Fi-relét', get(b2, 'FI').st.tripped === true);
  })();

  /* --- B feladat ---------------------------------------------------- */
  (function () {
    var b = board('B'), sim;
    get(b, 'SUP').st.on = true;
    sim = run(b);
    ok('B: bekapcsolás után nincs zárlat', sim.shorts.size === 0 && !sim.earthFault);

    var base = lit(sim, 'E2.on');
    ok('B: alaphelyzetben E2 világít (mind egyenesben)', base === true);
    get(b, 'K2').st.pos = 1;
    sim = run(b);
    ok('B: keresztkapcsoló átkapcsolva E2 elalszik', !lit(sim, 'E2.on'));
    get(b, 'K1').st.pos = 1;
    sim = run(b);
    ok('B: K1 váltóval visszakapcsolható', lit(sim, 'E2.on'));
    get(b, 'K3').st.pos = 1;
    sim = run(b);
    ok('B: K3 váltóval megint elalszik', !lit(sim, 'E2.on'));
    get(b, 'K2').st.pos = 0;
    sim = run(b);
    ok('B: a keresztkapcsoló mindhárom helyről működik', lit(sim, 'E2.on'));

    get(b, 'S1').st.p = true;
    sim = run(b);
    ok('B: S1 indítja a lépcsőházi automatát', lit(sim, 'E1.on'));
    get(b, 'S1').st.p = false;
    get(b, 'LA').st.until = 0;
    sim = run(b);
    get(b, 'S2').st.p = true;
    sim = run(b);
    ok('B: S2 is indít', lit(sim, 'E1.on'));
  })();

  /* --- C feladat ---------------------------------------------------- */
  (function () {
    var b = board('C'), sim;
    var M = get(b, 'M');
    var dir = function (s) { return EE.PARTS.motor.run(M, s.ctxFor(M)); };

    get(b, 'SUP').st.on = true;
    sim = run(b);
    ok('C: motorvédő nélkül nincs vezérlés', !lit(sim, 'K1.coil'));

    get(b, 'HK').st.on = true;
    sim = run(b);
    ok('C: HK-1 bekapcsolva a P (áll) lámpa világít', lit(sim, 'P.on'));
    ok('C: a Z (üzem) lámpa sötét', !lit(sim, 'Z.on'));
    ok('C: a motor áll', dir(sim) === 0);

    get(b, 'S2').st.p = true;
    sim = run(b);
    ok('C: S2 indítógombra a mágneskapcsoló meghúz', lit(sim, 'K1.coil'));
    ok('C: a motor előre forog', dir(sim) === 1);
    ok('C: Z világít, P elalszik', lit(sim, 'Z.on') && !lit(sim, 'P.on'));

    get(b, 'S2').st.p = false;
    sim = run(b);
    ok('C: gomb elengedve az öntartás tartja', lit(sim, 'K1.coil') && dir(sim) === 1);

    get(b, 'S1').st.p = true;
    sim = run(b);
    ok('C: S1 leállító elenged', !lit(sim, 'K1.coil') && dir(sim) === 0);
    get(b, 'S1').st.p = false;
    sim = run(b);
    ok('C: leállítás után nem indul újra magától', !lit(sim, 'K1.coil'));

    get(b, 'S4').st.p = true;
    sim = run(b);
    ok('C: a másik indítógomb (S4) is indít', lit(sim, 'K1.coil'));
    get(b, 'S4').st.p = false;
    get(b, 'S3').st.p = true;
    sim = run(b);
    ok('C: a másik leállító (S3) is leállít', !lit(sim, 'K1.coil'));
    get(b, 'S3').st.p = false;

    get(b, 'S2').st.p = true;
    sim = run(b);
    get(b, 'S2').st.p = false;
    get(b, 'HK').st.on = false;
    sim = run(b);
    ok('C: motorvédő lekapcsolva a motor leáll', !lit(sim, 'K1.coil') && dir(sim) === 0);
  })();

  /* --- D feladat ---------------------------------------------------- */
  (function () {
    var b = board('D'), sim;
    var M = get(b, 'M');
    var dir = function (s) { return EE.PARTS.motor.run(M, s.ctxFor(M)); };

    get(b, 'SUP').st.on = true;
    get(b, 'HK').st.on = true;
    sim = run(b);
    ok('D: alaphelyzetben nincs zárlat', sim.shorts.size === 0 && !sim.earthFault);
    ok('D: P (áll) világít, a motor áll', lit(sim, 'P.on') && dir(sim) === 0);

    get(b, 'S2').st.p = true;
    sim = run(b);
    get(b, 'S2').st.p = false;
    sim = run(b);
    ok('D: S2-re K-1 meghúz és tart', lit(sim, 'K1.coil'));
    ok('D: a motor előre forog', dir(sim) === 1);
    ok('D: Z1 világít, Z2 és P sötét', lit(sim, 'Z1.on') && !lit(sim, 'Z2.on') && !lit(sim, 'P.on'));

    get(b, 'S3').st.p = true;
    sim = run(b);
    ok('D: reteszelés - K-2 nem húzhat meg, amíg K-1 tart', !lit(sim, 'K2.coil'));
    ok('D: a reteszelés alatt sincs zárlat', sim.shorts.size === 0);
    get(b, 'S3').st.p = false;

    get(b, 'S1').st.p = true;
    sim = run(b);
    get(b, 'S1').st.p = false;
    sim = run(b);
    ok('D: S1 mindkét irányt leállítja', !lit(sim, 'K1.coil') && !lit(sim, 'K2.coil') && dir(sim) === 0);

    get(b, 'S3').st.p = true;
    sim = run(b);
    get(b, 'S3').st.p = false;
    sim = run(b);
    ok('D: állóból S3-ra K-2 meghúz', lit(sim, 'K2.coil'));
    ok('D: a motor visszafelé forog', dir(sim) === -1);
    ok('D: Z2 világít', lit(sim, 'Z2.on') && !lit(sim, 'Z1.on'));

    get(b, 'S2').st.p = true;
    sim = run(b);
    ok('D: fordított irányban is működik a retesz', !lit(sim, 'K1.coil'));
    get(b, 'S2').st.p = false;

    /* szandekos reteszhiba: ha a ket tekercset kozvetlenul kotjuk, zarlat lesz */
    var bx = board('D');
    get(bx, 'SUP').st.on = true;
    get(bx, 'HK').st.on = true;
    bx.wires = bx.wires.filter(function (w) {
      return !(w.a === 'K2.82' && w.b === 'K1.A1') && !(w.a === 'K1.82' && w.b === 'K2.A1');
    });
    bx.wires.push({ id: 'x1', a: 'K1.14', b: 'K1.A1', color: 'br' });
    bx.wires.push({ id: 'x2', a: 'K2.14', b: 'K2.A1', color: 'br' });
    bx.wires.push({ id: 'x3', a: 'S2.4', b: 'K1.A1', color: 'br' });
    bx.wires.push({ id: 'x4', a: 'S3.4', b: 'K2.A1', color: 'br' });
    get(bx, 'S2').st.p = true;
    get(bx, 'S3').st.p = true;
    sim = run(bx);
    ok('D: retesz nélkül mindkét kapcsoló meghúzna és zárlatot okoz',
      sim.shorts.size > 0 || get(bx, 'F1').st.tripped === true);
  })();

  /* --- E feladat: egyfazisu motorinditas ---------------------------- */
  (function () {
    var b = board('E'), sim;
    var run = function (s) { return !!s.live['M.run']; };

    get(b, 'SUP').st.on = true;
    sim = window.EE.solve(b, Date.now());
    ok('E: bekapcsolás után nincs zárlat', sim.shorts.size === 0 && !sim.earthFault);
    ok('E: motorvédő nélkül nincs vezérlés', !lit(sim, 'K1.coil'));

    get(b, 'HK').st.on = true;
    sim = window.EE.solve(b, Date.now());
    ok('E: HK-1 behúzva a P (áll) lámpa világít', lit(sim, 'P.on'));
    ok('E: a motor áll, Z sötét', !run(sim) && !lit(sim, 'Z.on'));

    get(b, 'S2').st.p = true;
    sim = window.EE.solve(b, Date.now());
    ok('E: S2 indítógombra a mágneskapcsoló meghúz', lit(sim, 'K1.coil'));
    ok('E: a motor forog', run(sim));
    ok('E: Z világít, P elalszik', lit(sim, 'Z.on') && !lit(sim, 'P.on'));

    get(b, 'S2').st.p = false;
    sim = window.EE.solve(b, Date.now());
    ok('E: gomb elengedve az öntartás tartja', lit(sim, 'K1.coil') && run(sim));

    get(b, 'S1').st.p = true;
    sim = window.EE.solve(b, Date.now());
    ok('E: S1 bontó gomb leállít', !lit(sim, 'K1.coil') && !run(sim));
    get(b, 'S1').st.p = false;
    sim = window.EE.solve(b, Date.now());
    ok('E: leállítás után nem indul újra magától', !lit(sim, 'K1.coil'));

    get(b, 'S2').st.p = true;
    sim = window.EE.solve(b, Date.now());
    get(b, 'S2').st.p = false;
    get(b, 'HK').st.on = false;
    sim = window.EE.solve(b, Date.now());
    ok('E: motorvédő lekapcsolva a motor leáll', !run(sim));

    /* a motor nullaja nelkul nincs forgas */
    var b2 = board('E');
    get(b2, 'SUP').st.on = true;
    get(b2, 'HK').st.on = true;
    b2.wires = b2.wires.filter(function (w) { return !(w.a === 'NB.b1' && w.b === 'M.U2'); });
    get(b2, 'S2').st.p = true;
    sim = window.EE.solve(b2, Date.now());
    ok('E: a motor nullája nélkül nem forog', !run(sim));
  })();

  /* --- F feladat: haromfazisu merohely ------------------------------ */
  (function () {
    var b = board('F'), sim;
    var meterPhases = function (s) {
      var m = get(b, 'KWH');
      return ['3', '6', '9'].map(function (t) { return window.EE.phaseOf(s.ctxFor(m).rails(t)); });
    };

    get(b, 'SUP').st.on = true;
    sim = window.EE.solve(b, Date.now());
    ok('F: bekapcsolás után nincs zárlat', sim.shorts.size === 0 && !sim.earthFault);
    ok('F: a mérő mindhárom fázist átengedi', JSON.stringify(meterPhases(sim)) === JSON.stringify(['L1', 'L2', 'L3']));
    ok('F: főkapcsoló nélkül a lámpák sötétek', !lit(sim, 'E1.on') && !lit(sim, 'E2.on'));

    get(b, 'FK').st.on = true;
    sim = window.EE.solve(b, Date.now());
    ok('F: főkapcsoló bekapcsolva mindkét lámpa világít', lit(sim, 'E1.on') && lit(sim, 'E2.on'));
    ok('F: a két lámpa külön fázison van',
      window.EE.phaseOf(sim.railsAt('E1.1')) !== window.EE.phaseOf(sim.railsAt('E2.1')));

    get(b, 'X1').st.plug = true;
    sim = window.EE.solve(b, Date.now());
    ok('F: a dugaljba dugott fogyasztó működik', lit(sim, 'X1.on'));

    get(b, 'FI').st.on = false;
    sim = window.EE.solve(b, Date.now());
    ok('F: Fi-relé lekapcsolva minden fogyasztó feszültségmentes',
      !lit(sim, 'E1.on') && !lit(sim, 'E2.on') && !lit(sim, 'X1.on'));
    get(b, 'FI').st.on = true;

    /* a nullat a meron keresztul kell vezetni */
    var b2 = board('F');
    get(b2, 'SUP').st.on = true;
    get(b2, 'FK').st.on = true;
    b2.wires = b2.wires.filter(function (w) { return !(w.a === 'NB0.b1' && w.b === 'KWH.10'); });
    sim = window.EE.solve(b2, Date.now());
    ok('F: a mérő nullája nélkül nincs fogyasztói nulla', !lit(sim, 'E1.on') && !lit(sim, 'E2.on'));

    /* testzarlat a Fi mogott */
    var b3 = board('F');
    get(b3, 'SUP').st.on = true;
    get(b3, 'FK').st.on = true;
    b3.wires.push({ id: 'ef', a: 'F2.2', b: 'PB.b3', color: 'bk' });
    sim = window.EE.solve(b3, Date.now());
    ok('F: testzárlat kiveri a Fi-relét', get(b3, 'FI').st.tripped === true);

    /* ket fazis osszekotese zarlat */
    var b4 = board('F');
    get(b4, 'SUP').st.on = true;
    get(b4, 'FK').st.on = true;
    b4.wires.push({ id: 'sc', a: 'F1.2', b: 'F2.2', color: 'bk' });
    sim = window.EE.solve(b4, Date.now());
    ok('F: két fázis összekötése zárlat és kioldást okoz',
      get(b4, 'F1').st.tripped || get(b4, 'F2').st.tripped || get(b4, 'F0').st.tripped);
  })();

  /* --- G feladat: egyfazisu merohely -------------------------------- */
  (function () {
    var b = board('G'), sim;
    var meterOk = function (s) {
      var m = get(b, 'KWH'), c = s.ctxFor(m);
      return window.EE.hasPhase(c.rails('3')) && c.rails('6').has('N');
    };

    sim = window.EE.solve(b, Date.now());
    ok('G: feszültségmentesen semmi nem világít', !lit(sim, 'E1.on'));

    get(b, 'SUP').st.on = true;
    sim = window.EE.solve(b, Date.now());
    ok('G: bekapcsolás után nincs zárlat', sim.shorts.size === 0 && !sim.earthFault);
    ok('G: a mérőn átmegy a fázis és a nulla', meterOk(sim));
    ok('G: a lámpa világít', lit(sim, 'E1.on'));

    get(b, 'X1').st.plug = true;
    sim = window.EE.solve(b, Date.now());
    ok('G: a dugalj működik', lit(sim, 'X1.on'));

    get(b, 'FI').st.on = false;
    sim = window.EE.solve(b, Date.now());
    ok('G: Fi lekapcsolva minden fogyasztó feszültségmentes', !lit(sim, 'E1.on') && !lit(sim, 'X1.on'));
    get(b, 'FI').st.on = true;

    get(b, 'FM').st.on = false;
    sim = window.EE.solve(b, Date.now());
    ok('G: főkismegszakító lekapcsolva sincs feszültség', !lit(sim, 'E1.on'));
    get(b, 'FM').st.on = true;

    /* a meron at kell vezetni a nullat is */
    var b2 = board('G');
    get(b2, 'SUP').st.on = true;
    b2.wires = b2.wires.filter(function (w) { return !(w.a === 'NB0.b1' && w.b === 'KWH.4'); });
    sim = window.EE.solve(b2, Date.now());
    ok('G: a mérő nullája nélkül nincs fogyasztói nulla', !lit(sim, 'E1.on'));

    /* a merot megkerulve is mukodne - de az mar nem merne */
    var b3 = board('G');
    get(b3, 'SUP').st.on = true;
    b3.wires.push({ id: 'bp', a: 'F0.2', b: 'FM.1', color: 'br' });
    sim = window.EE.solve(b3, Date.now());
    ok('G: a mérőt megkerülő fázis nem okoz zárlatot, de a mérő megkerülhető lesz',
      sim.shorts.size === 0 && lit(sim, 'E1.on'));
    ok('G: az ellenőrzés a mérő megkerülését felesleges kötésként jelzi',
      window.EE.checkWiring(window.EE.TASKS.G.solution,
        b3.wires.map(function (w) { return { a: w.a, b: w.b }; })).extra.length === 1);

    /* testzarlat a Fi mogott */
    var b4 = board('G');
    get(b4, 'SUP').st.on = true;
    b4.wires.push({ id: 'ef', a: 'F2.2', b: 'PB.b3', color: 'bk' });
    sim = window.EE.solve(b4, Date.now());
    ok('G: testzárlat kiveri a Fi-relét', get(b4, 'FI').st.tripped === true);
  })();

  /* --- ellenorzo fuggveny ------------------------------------------- */
  (function () {
    var t = EE.TASKS.A;
    var full = t.solution.map(function (s, i) { return { id: 'w' + i, a: s[0], b: s[1], color: s[2] }; });
    ok('Ellenőrzés: a teljes megoldás hibátlan', EE.checkWiring(t.solution, full).ok === true);
    var short1 = full.slice(0, full.length - 3);
    var r = EE.checkWiring(t.solution, short1);
    ok('Ellenőrzés: hiányzó kötéseket jelez', !r.ok && r.missing.length === 3);
    var wrong = full.concat([{ id: 'wx', a: 'F1.2', b: 'E2.2', color: 'bk' }]);
    ok('Ellenőrzés: felesleges kötést jelez', EE.checkWiring(t.solution, wrong).extra.length === 1);
  })();

  window.EE_TEST = { results: out, fails: fails };

  var host = document.getElementById('out');
  if (host) {
    host.innerHTML =
      '<div class="sum ' + (fails ? 'bad' : 'good') + '">' +
      (fails ? fails + ' bukás' : 'mind a ' + out.length + ' ellenőrzés rendben') +
      ' · ' + out.length + ' teszt</div>' +
      out.map(function (r) {
        return '<div class="row ' + (r.ok ? 'ok' : 'no') + '"><span>' + (r.ok ? '✓' : '✗') + '</span>' +
          r.name + (r.detail ? ' <em>' + r.detail + '</em>' : '') + '</div>';
      }).join('');
  }
})();
