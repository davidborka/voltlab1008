/**
 * Bekötés-ellenőrzés. Nem huzalonként hasonlít, hanem elektromosan: a tanuló
 * huzalai által képzett csomópont-felosztást veti össze a referenciáéval, így a
 * más útvonalon vezetett, de villamosan azonos bekötés is jó.
 *
 * A puszta "hiányzik / felesleges" lista mellé magyarázó megállapítások
 * készülnek, mert a tanulónak azt kell megértenie, MIÉRT nem működik.
 */
import type { CheckResult, Finding, PartInstance, TaskDef, Wire } from './electrical-types';
import { DSU } from './netlist';
import { PARTS, termsOf } from '../data/parts';

/** Kapocs -> emberi név, pl. "K-1 A1". */
export function termName(task: TaskDef, key: string): string {
  const dot = key.indexOf('.');
  const partId = key.slice(0, dot);
  const termId = key.slice(dot + 1);
  const p = task.parts.find((q) => q.id === partId);
  if (!p) return key;
  const t = termsOf({ ...p, st: {} } as PartInstance).find((q) => q.id === termId);
  return `${p.label || p.id} ${t?.t || termId}`;
}

function partOf(key: string): string {
  return key.slice(0, key.indexOf('.'));
}

function roleOf(task: TaskDef, key: string): string | undefined {
  const p = task.parts.find((q) => q.id === partOf(key));
  if (!p) return undefined;
  const termId = key.slice(key.indexOf('.') + 1);
  return termsOf({ ...p, st: {} } as PartInstance).find((q) => q.id === termId)?.role;
}

/** Kapcsolóérintkezőn átvezetett készüléktípusok - a PE ezeken nem mehet át. */
const SWITCHING_TYPES = new Set(['sw1', 'sw2', 'swx', 'btn', 'btnNC', 'contactor', 'mcb', 'mcb3', 'mprot', 'mainsw', 'rcd']);

export function checkWiring(task: TaskDef, wires: Wire[]): CheckResult {
  const want = new DSU();
  const got = new DSU();
  const known = new Set<string>();

  /* Egy sorkapocs sín minden csavarja ugyanaz a csomópont. Ha ezt nem vesszük
     figyelembe, a validátor azt kéri, hogy pont ugyanarra a csavarra köss, mint
     a referencia - ami villamosan értelmetlen elvárás. Ugyanezért a sín összes
     kapcsa ismertnek számít, nem csak az, amelyik a megoldásban szerepel. */
  for (const p of task.parts) {
    if (!PARTS[p.type]?.equipotential) continue;
    const terms = termsOf({ ...p, st: {} } as PartInstance);
    for (const t of terms) {
      const key = `${p.id}.${t.id}`;
      known.add(key);
      want.union(`${p.id}.${terms[0].id}`, key);
      got.union(`${p.id}.${terms[0].id}`, key);
    }
  }

  for (const [a, b] of task.solution) {
    want.union(a, b);
    known.add(a);
    known.add(b);
  }
  for (const w of wires) got.union(w.a, w.b);

  const missing: Array<[string, string]> = [];
  for (const [a, b] of task.solution) {
    if (got.find(a) !== got.find(b)) missing.push([a, b]);
  }

  const extra: Array<[string, string, string]> = [];
  for (const w of wires) {
    if (!known.has(w.a) || !known.has(w.b)) {
      extra.push([w.a, w.b, 'ez a kapocs nem szerepel a megoldásban']);
    } else if (want.find(w.a) !== want.find(w.b)) {
      extra.push([w.a, w.b, 'két különböző csomópontot köt össze']);
    }
  }

  const findings: Finding[] = [];

  /* --- kettős huzal ugyanarra a kapocspárra --------------------------- */
  const seenPairs = new Set<string>();
  for (const w of wires) {
    const k = [w.a, w.b].sort().join('|');
    if (seenPairs.has(k)) {
      findings.push({
        severity: 'warning',
        messageHu: `Kettős kábel: ${termName(task, w.a)} - ${termName(task, w.b)}`,
        explanationHu:
          'Ugyanaz a két kapocs kétszer van összekötve. Villamosan nem hiba, de a vizsgán rendetlen munkának számít, és megnehezíti a hibakeresést.',
        highlightIds: [w.a, w.b],
      });
    }
    seenPairs.add(k);
    if (w.a === w.b) {
      findings.push({
        severity: 'error',
        messageHu: `Önmagára kötött kábel: ${termName(task, w.a)}`,
        explanationHu: 'Egy kapocs önmagával nem köthető össze.',
        highlightIds: [w.a],
      });
    }
  }

  /* --- védővezető kapcsolóérintkezőn ---------------------------------- */
  for (const w of wires) {
    const ra = roleOf(task, w.a);
    const rb = roleOf(task, w.b);
    if (ra !== 'PE' && rb !== 'PE') continue;
    const other = ra === 'PE' ? w.b : w.a;
    const otherPart = task.parts.find((q) => q.id === partOf(other));
    const otherRole = ra === 'PE' ? rb : ra;
    if (otherPart && SWITCHING_TYPES.has(otherPart.type) && otherRole !== 'PE') {
      findings.push({
        severity: 'error',
        messageHu: 'A védővezetőt nem szabad kapcsolóérintkezőn átvezetni.',
        explanationHu:
          'A PE vezetőnek megszakítás nélkül, folyamatosan kell eljutnia a fogyasztóig. Ha kapcsolón vagy megszakítón megy át, a készülék kikapcsolt állapotában megszűnik a védelem.',
        highlightIds: [w.a, w.b],
      });
    }
  }

  /* --- nulla és védőföld összekötése ---------------------------------- */
  for (const w of wires) {
    const ra = roleOf(task, w.a);
    const rb = roleOf(task, w.b);
    if ((ra === 'N' && rb === 'PE') || (ra === 'PE' && rb === 'N')) {
      findings.push({
        severity: 'error',
        messageHu: 'A nullavezető és a védővezető össze van kötve.',
        explanationHu:
          'A fogyasztói oldalon az N és a PE nem köthető össze. Ez kiüti a Fi-relét, és hibás esetben a védővezetőn üzemi áram folyna.',
        highlightIds: [w.a, w.b],
      });
    }
  }

  /* --- mágneskapcsoló öntartása és reteszelése ------------------------ */
  const contactors = task.parts.filter((p) => p.type === 'contactor');
  for (const k of contactors) {
    const aux = k.opt?.aux || [];
    const no = aux.find((a) => a[2] === 'no');
    if (no) {
      const a13 = `${k.id}.${no[0]}`;
      const a14 = `${k.id}.${no[1]}`;
      const wantsHold = task.solution.some(
        ([x, y]) => x === a13 || y === a13 || x === a14 || y === a14
      );
      const built = wires.some((w) => w.a === a13 || w.b === a13) && wires.some((w) => w.a === a14 || w.b === a14);
      if (wantsHold && !built) {
        findings.push({
          severity: 'error',
          messageHu: `A ${k.label || k.id} öntartó ága hiányzik.`,
          explanationHu:
            `Az indítógombot elengedve a tekercs áramtalanná válik, ezért a ${k.label || k.id} azonnal elenged. Az öntartáshoz a ${no[0]}-${no[1]} záró segédérintkezőt az indítógombbal párhuzamosan kell bekötni.`,
          highlightIds: [a13, a14],
        });
      }
    }
  }

  if (contactors.length >= 2) {
    const [k1, k2] = contactors;
    const nc81 = (k: (typeof contactors)[number]) => (k.opt?.aux || []).find((a) => a[0] === '81');
    const i1 = nc81(k1);
    const i2 = nc81(k2);
    if (i1 && i2) {
      const needed = task.solution.some(([a, b]) => a.startsWith(`${k1.id}.81`) || b.startsWith(`${k1.id}.81`));
      const built =
        wires.some((w) => w.a.startsWith(`${k1.id}.8`) || w.b.startsWith(`${k1.id}.8`)) &&
        wires.some((w) => w.a.startsWith(`${k2.id}.8`) || w.b.startsWith(`${k2.id}.8`));
      if (needed && !built) {
        findings.push({
          severity: 'error',
          messageHu: `A ${k1.label || k1.id} és ${k2.label || k2.id} közötti villamos reteszelés hiányzik.`,
          explanationHu:
            'Reteszelés nélkül a két mágneskapcsoló egyszerre húzhat meg, és a főáramkörben két fázis rövidre záródik. Mindkét tekercset a másik kapcsoló 81-82 bontó érintkezőjén keresztül kell táplálni.',
          highlightIds: [`${k1.id}.81`, `${k1.id}.82`, `${k2.id}.81`, `${k2.id}.82`],
        });
      }
    }
  }

  /* --- leállító gomb a vezérlő körben --------------------------------- */
  for (const s of task.parts.filter((p) => p.type === 'btnNC')) {
    const t1 = `${s.id}.1`;
    const t2 = `${s.id}.2`;
    const inSolution = task.solution.some(([a, b]) => a === t1 || b === t1 || a === t2 || b === t2);
    const built = wires.some((w) => w.a === t1 || w.b === t1) && wires.some((w) => w.a === t2 || w.b === t2);
    if (inSolution && !built) {
      findings.push({
        severity: 'error',
        messageHu: `A ${s.label || s.id} leállító nyomógomb nincs bekötve a vezérlő körbe.`,
        explanationHu:
          'A leállító nyomógombnak nyugalmi állapotban zártnak (bontó, NC) kell lennie, és sorosan kell a vezérlő körben lennie. Így a vezeték szakadása is leállítja a berendezést.',
        highlightIds: [t1, t2],
      });
    }
  }

  /* --- elfogadható eltérés: azonos csomópont -------------------------- */
  for (const w of wires) {
    if (known.has(w.a) && known.has(w.b) && want.find(w.a) === want.find(w.b)) {
      const inSolution = task.solution.some(
        ([a, b]) => (a === w.a && b === w.b) || (a === w.b && b === w.a)
      );
      if (!inSolution) {
        findings.push({
          severity: 'info',
          messageHu: `${termName(task, w.a)} - ${termName(task, w.b)}: más útvonal, de helyes.`,
          explanationHu:
            'Ez a csatlakozás ugyanabba a hálózati csomópontba tartozik, ezért elfogadható. A vizsgán a rendezett kábelvezetés is számít, de villamosan ez a bekötés jó.',
          highlightIds: [w.a, w.b],
        });
      }
    }
  }

  /* --- hiányzó kötések felsorolása ------------------------------------ */
  for (const [a, b] of missing) {
    findings.push({
      severity: 'error',
      messageHu: `Hiányzik: ${termName(task, a)} - ${termName(task, b)}`,
      explanationHu: 'Ez a két kapocs a referenciamegoldásban egy csomópontba tartozik.',
      highlightIds: [a, b],
    });
  }

  const total = task.solution.length || 1;
  const score = Math.max(0, Math.round(((total - missing.length - extra.length * 0.5) / total) * 100));

  return {
    ok: missing.length === 0 && extra.length === 0,
    missing,
    extra,
    findings: dedupe(findings),
    score: Math.min(100, score),
  };

  function dedupe(list: Finding[]): Finding[] {
    const seen = new Set<string>();
    return list.filter((f) => {
      const k = f.severity + f.messageHu;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }
}

/** Egy hiányzó kötés felfedése - a Bekötési gyakorlat "Mutass egy kötést" gombja. */
export function revealOne(task: TaskDef, wires: Wire[]): [string, string, Wire['color']] | null {
  const got = new DSU();
  for (const w of wires) got.union(w.a, w.b);
  for (const s of task.solution) {
    if (got.find(s[0]) !== got.find(s[1])) return s;
  }
  return null;
}

/** A készülék adott kapcsa mely feladatbeli alkatrészhez tartozik. */
export function partTypeOf(task: TaskDef, key: string): string | undefined {
  return task.parts.find((p) => p.id === partOf(key))?.type;
}

export { PARTS };
