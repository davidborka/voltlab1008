// Validates content/interaktiv/explainers/*.json and writes public/interaktiv/data/explainers.js.
// Usage: node content/interaktiv/validate-explainers.mjs [--no-write]
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const topics = JSON.parse(readFileSync(join(root, 'topics.json'), 'utf8')).topics.map(t => t.id);
const EXTRA = ['alapok']; // foundations explainer, not an exam topic
const dir = join(root, 'explainers');
const isStr = s => typeof s === 'string' && s.trim().length > 0;
const errors = [], out = {};
for (const f of readdirSync(dir).filter(f => f.endsWith('.json'))) {
  const err = m => errors.push(`${f}: ${m}`);
  let e; try { e = JSON.parse(readFileSync(join(dir, f), 'utf8')); } catch (x) { err('invalid JSON ' + x.message); continue; }
  if (![...topics, ...EXTRA].includes(e.topic) || f !== `${e.topic}.json`) err('topic id / file name mismatch');
  if (!isStr(e.title) || !isStr(e.summary)) err('title/summary');
  if (!Array.isArray(e.sections) || e.sections.length < 2 || !e.sections.every(s => isStr(s.h) && (isStr(s.body) || (Array.isArray(s.bullets) && s.bullets.every(isStr))))) err('sections');
  if (!Array.isArray(e.keyFacts) || !e.keyFacts.every(k => isStr(k.k) && isStr(k.v))) err('keyFacts');
  if (e.formulas !== undefined && (!Array.isArray(e.formulas) || !e.formulas.every(x => isStr(x.f) && (x.derive === undefined || (Array.isArray(x.derive) && x.derive.every(isStr)))))) err('formulas');
  if (!Array.isArray(e.mistakes) || !e.mistakes.length || !e.mistakes.every(isStr)) err('mistakes');
  if (!Array.isArray(e.hooks) || !e.hooks.every(isStr)) err('hooks');
  if (!Array.isArray(e.sources) || !e.sources.length) err('sources');
  if (e.svg !== undefined && (!/^<svg[\s\S]*<\/svg>\s*$/.test(e.svg.trim()) || /<script|on\w+=/i.test(e.svg))) err('bad svg');
  if (e.videos !== undefined && !(Array.isArray(e.videos) && e.videos.every(v => isStr(v?.src) && isStr(v?.title)))) err('bad videos');
  out[e.topic] = e;
}
// NotebookLM video overviews, kept apart from the explainer files: { "<topic>": [{ "src", "title", "mins" }] }
let videos = {}; try { videos = JSON.parse(readFileSync(join(root, 'videos.json'), 'utf8')); } catch { /* none yet */ }
for (const [t, v] of Object.entries(videos)) { if (!out[t]) errors.push(`videos.json: unknown topic ${t}`); else out[t].videos = v; }
const missing = topics.filter(t => !out[t]);
console.log(`${Object.keys(out).length}/${topics.length} explainers, ${errors.length} errors${missing.length ? ', missing: ' + missing.join(' ') : ''}`);
if (errors.length) { console.log(errors.join('\n')); process.exit(1); }
if (!process.argv.includes('--no-write')) writeFileSync(join(root, '../../public/interaktiv/data/explainers.js'), `window.EXPLAINERS=${JSON.stringify(out)};\n`);
