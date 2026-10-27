/**
 * A tartomány alapfogalmai. Minden feladat, netlista, ellenőrzési szabály és
 * tananyag erre a néhány típusra épül, hogy a hét feladat ne hét különálló,
 * kézzel megírt oldal legyen.
 */

/** Melyik hálózati sín. A PE külön, mert soha nem lehet kapcsolt vagy terhelt. */
export type Rail = 'L1' | 'L2' | 'L3' | 'N' | 'PE';

/** Egy sorkapocs szerepe a bekötésben - ebből jön a kábel javasolt színe is. */
export type CircuitKind = 'power' | 'control' | 'neutral' | 'pe';

/** Vezetékszín: barna fázis, kék nulla, zöld-sárga védőföld, fekete és szürke ér. */
export type WireColor = 'br' | 'bl' | 'gy' | 'bk' | 'gr';

export type TermDir = 'n' | 's' | 'e' | 'w';

export interface Terminal {
  /** Alkatrészen belül egyedi, pl. "A1", "13", "T1". */
  id: string;
  /** A készülékre nyomtatott jelölés; ha üres, nem írjuk ki. */
  t?: string;
  x: number;
  y: number;
  dir: TermDir;
  /** L / N / PE - ebből ajánl színt a bekötő és ezt ellenőrzi a PE-szabály. */
  role?: 'L' | 'N' | 'PE';
}

/** Egy fogyasztó (izzó, tekercs): nem köti össze a saját kapcsait. */
export interface LoadSpec {
  key: string;
  a: string;
  b: string;
}

/** A megoldó által az alkatrésznek adott környezet. Saját kapocsnév is elég. */
export interface SolveCtx {
  now: number;
  rails(term: string): ReadonlySet<Rail>;
  live(loadKey: string): boolean;
  shorted(term: string): boolean;
  earth(): boolean;
  /** Ugyanabban a csomópontban van-e a két kapocs (pl. a csillagpont). */
  same(a: string, b: string): boolean;
}

export interface PartInstance {
  id: string;
  type: string;
  x: number;
  y: number;
  label?: string;
  opt?: PartOptions | null;
  st: PartState;
}

export interface PartOptions {
  /** Mágneskapcsoló segédérintkezői: [kapocs, kapocs, 'no' | 'nc']. */
  aux?: Array<[string, string, 'no' | 'nc']>;
  /** Fi-relé pólusszáma (2 vagy 4), motorvédőé (1 vagy 3). */
  poles?: number;
  color?: 'red' | 'green';
  rail?: Rail;
  /** Sorkapocs sín szerepe: ettől lesz a kapcsainak N vagy PE szerepe. */
  role?: 'L' | 'N' | 'PE';
}

/** Az alkatrész mutálható állapota. Szándékosan laza: minden típus a sajátját tartja. */
export interface PartState {
  on?: boolean;
  tripped?: boolean;
  pos?: number;
  p?: boolean;
  plug?: boolean;
  until?: number;
  /** Időrelé: mikor kapott feszültséget a tekercse (0 = nincs behúzva). */
  since?: number;
}

export interface PartDef {
  name: string;
  w: number;
  h: number;
  /** Ha a szélesség a beállítástól függ (pl. 4 pólusú Fi-relé). */
  wOf?(p: PartInstance): number;
  terms: Terminal[] | ((p: PartInstance) => Terminal[]);
  /** Betáplálásnak jelöli magát - a feszültség gomb ezeket kapcsolja. */
  supply?: boolean;
  /** Zárlatvédelem: mely kapcsokat védi. A kioldásról a megoldó dönt. */
  protect?: { poles: string[] };
  /** Nyomva tartható (nyomógomb). */
  hold?: boolean;
  /** Minden kapcsa tartósan egy csomópont (sorkapocs sín). Az ellenőrzés így
   *  nem várja el, hogy pont ugyanarra a csavarra köss, mint a referencia. */
  equipotential?: boolean;
  init?(): PartState;
  links?(st: PartState, p: PartInstance, ctx: SolveCtx): Array<[string, string]>;
  sources?(st: PartState, p: PartInstance, ctx: SolveCtx): Array<[string, Rail]>;
  loads?(st: PartState, p: PartInstance, ctx: SolveCtx): LoadSpec[];
  update?(st: PartState, p: PartInstance, ctx: SolveCtx): void;
  tap?(st: PartState): void;
  draw(p: PartInstance, st: PartState, ctx: SolveCtx): string;
  run?(p: PartInstance, ctx: SolveCtx): number;
}

export interface Wire {
  id: string;
  a: string;
  b: string;
  color: WireColor;
  /** Kézzel elrendezett középpont. */
  m?: [number, number] | null;
}

export interface Board {
  parts: PartInstance[];
  wires: Wire[];
}

export interface SolveResult {
  live: Record<string, boolean>;
  shorts: Set<string>;
  earthFault: boolean;
  oscillating: boolean;
  railsAt(term: string): ReadonlySet<Rail>;
  shortedAt(term: string): boolean;
  ctxFor(p: PartInstance): SolveCtx;
}

/* ---------------------------------------------------------------- tananyag */

export type TaskCategory = 'epuletvillamossag' | 'motorvezerles' | 'merohely';

/** Egy csomópont a referenciamegoldásban: mely kapcsok tartoznak össze és miért. */
export interface Net {
  id: string;
  terminalIds: string[];
  purposeHu: string;
  circuit: CircuitKind;
}

/** Vezetett megoldás egy lépése. */
export interface GuidedStep {
  id: string;
  titleHu: string;
  goalHu: string;
  /** Mely alkatrészek tartoznak a lépéshez - ezeket emeli ki a rajzon. */
  focus: string[];
  reasoningHu: string;
  questionHu: string;
  options: string[];
  correct: number;
  hintHu: string;
  explanationHu: string;
}

export interface ExamQuestion {
  id: string;
  promptHu: string;
  options: string[];
  correct: number;
  /** Melyik pontozási kategóriába számít. */
  category: ScoreCategory;
  explanationHu: string;
}

export type ScoreCategory =
  | 'rajzolvasas'
  | 'keszulekismeret'
  | 'bekotesi-pontossag'
  | 'mukodes-megertese'
  | 'biztonsagi-szemlelet'
  | 'ellenorzesi-sorrend';

export const SCORE_LABELS: Record<ScoreCategory, string> = {
  rajzolvasas: 'Rajzolvasás',
  keszulekismeret: 'Készülékismeret',
  'bekotesi-pontossag': 'Bekötési pontosság',
  'mukodes-megertese': 'Működés megértése',
  'biztonsagi-szemlelet': 'Biztonsági szemlélet',
  'ellenorzesi-sorrend': 'Ellenőrzési sorrend',
};

/** A rajzból önmagában nem eldönthető érték. Sosem találunk ki helyette adatot. */
export interface UnresolvedValue {
  id: string;
  labelHu: string;
  /** Mi hiányzik ahhoz, hogy meghatározható legyen. */
  missingHu: string[];
  /** Tipikus oktatási példa - kifejezetten megjelölve, hogy nem a megoldás. */
  typicalExampleHu?: string;
}

export interface TaskDef {
  id: string;
  title: string;
  subtitle: string;
  category: TaskCategory;
  /** 1-5, a kártyán jelenik meg. */
  complexity: number;
  /** Az eredeti vizsgarajz képe, ha van hozzá. */
  sourcePreview?: string;
  world: [number, number];
  briefHu: string;
  objectivesHu: string[];
  stepsHu: string[];
  commonMistakesHu: string[];
  parts: Array<Omit<PartInstance, 'st'>>;
  solution: Array<[string, string, WireColor]>;
  nets?: Net[];
  guided?: GuidedStep[];
  exam?: ExamQuestion[];
  unresolved?: UnresolvedValue[];
}

/* ------------------------------------------------------- bekötés-ellenőrzés */

export type Severity = 'error' | 'warning' | 'info';

export interface Finding {
  severity: Severity;
  messageHu: string;
  explanationHu: string;
  /** Kapocs- vagy alkatrész-azonosítók, amiket ki kell emelni a rajzon. */
  highlightIds: string[];
}

export interface CheckResult {
  ok: boolean;
  missing: Array<[string, string]>;
  extra: Array<[string, string, string]>;
  findings: Finding[];
  /** 0-100, a helyes csomópontok aránya. */
  score: number;
}

/** A feladathoz tartozó tananyag - külön fájlban, hogy a tábla adatai és a
 *  magyarázó szövegek ne keveredjenek. */
export interface TaskContent {
  objectivesHu: string[];
  commonMistakesHu: string[];
  guided: GuidedStep[];
  exam: ExamQuestion[];
  unresolved?: UnresolvedValue[];
}
