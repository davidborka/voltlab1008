// Validates content/interaktiv/parts/*.json against SCHEMA.md and builds public/interaktiv/data/questions.js.
// Usage: node content/interaktiv/validate.mjs [file ...]   (no args = all parts, then build)
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const topics = JSON.parse(readFileSync(join(root, 'topics.json'), 'utf8'));
const topicPart = Object.fromEntries(topics.topics.map(t => [t.id, t.part]));
const args = process.argv.slice(2);
const files = args.length ? args : readdirSync(join(root, 'parts')).filter(f => f.endsWith('.json')).map(f => join(root, 'parts', f));

const errors = [];
const all = [];
const ids = new Set();
const isStr = s => typeof s === 'string' && s.trim().length > 0;
const isIdx = (i, n) => Number.isInteger(i) && i >= 0 && i < n;

for (const file of files) {
  let qs;
  try { qs = JSON.parse(readFileSync(file, 'utf8')); } catch (e) { errors.push(`${file}: invalid JSON: ${e.message}`); continue; }
  if (!Array.isArray(qs)) { errors.push(`${file}: not an array`); continue; }
  for (const q of qs) {
    const err = m => errors.push(`${file} ${q.id ?? '?'}: ${m}`);
    if (!isStr(q.id)) err('missing id');
    else if (ids.has(q.id)) err('duplicate id'); else ids.add(q.id);
    if (!['I', 'II', 'III', 'IV'].includes(q.part)) err('bad part');
    if (topicPart[q.topic] !== q.part) err(`topic ${q.topic} not in part ${q.part}`);
    if (![1, 2, 3].includes(q.difficulty)) err('bad difficulty');
    if (!Number.isInteger(q.points) || q.points < 1 || q.points > 6) err('bad points');
    if (!isStr(q.q)) err('missing q');
    if (!isStr(q.explanation) || q.explanation.length < 40) err('explanation missing/too short');
    if (!isStr(q.source)) err('missing source');
    if (q.svg !== undefined && (!/^<svg[\s\S]*<\/svg>\s*$/.test(q.svg.trim()) || /<script|on\w+=/i.test(q.svg))) err('bad svg');
    switch (q.type) {
      case 'single':
      case 'multi': {
        const n = q.options?.length ?? 0;
        if (!Array.isArray(q.options) || !q.options.every(isStr) || n < 2 || n > 8) { err('bad options'); break; }
        if (!Array.isArray(q.answer) || !q.answer.every(i => isIdx(i, n)) || new Set(q.answer).size !== q.answer.length) { err('bad answer'); break; }
        if (q.type === 'single' && q.answer.length !== 1) err('single needs exactly 1 answer');
        if (q.type === 'multi' && (q.answer.length < 1 || q.answer.length >= n)) err('multi needs ≥1 right and ≥1 wrong');
        if (new Set(q.options).size !== n) err('duplicate options');
        if (q.wrongWhy !== undefined && (!Array.isArray(q.wrongWhy) || q.wrongWhy.length !== n)) err('wrongWhy length');
        break;
      }
      case 'truefalse':
        if (!Array.isArray(q.statements) || !q.statements.length || q.statements.length > 6 || !q.statements.every(s => isStr(s.text) && typeof s.answer === 'boolean')) err('bad statements');
        break;
      case 'order':
        if (!Array.isArray(q.items) || q.items.length < 3 || q.items.length > 7 || !q.items.every(isStr) || new Set(q.items).size !== q.items.length) err('bad items');
        break;
      case 'match': {
        if (!Array.isArray(q.pairs) || q.pairs.length < 3 || q.pairs.length > 6 || !q.pairs.every(p => Array.isArray(p) && p.length === 2 && p.every(isStr))) { err('bad pairs'); break; }
        const rights = [...q.pairs.map(p => p[1]), ...(q.distractors ?? [])];
        if (new Set(rights).size !== rights.length) err('duplicate right side');
        if (new Set(q.pairs.map(p => p[0])).size !== q.pairs.length) err('duplicate left side');
        break;
      }
      case 'group': {
        const g = q.groups?.length ?? 0;
        if (!Array.isArray(q.groups) || g < 2 || g > 4 || !q.groups.every(isStr)) { err('bad groups'); break; }
        if (!Array.isArray(q.items) || q.items.length < 4 || q.items.length > 10 || !q.items.every(i => isStr(i.text) && isIdx(i.group, g))) { err('bad items'); break; }
        for (let k = 0; k < g; k++) if (!q.items.some(i => i.group === k)) err(`group ${k} empty`);
        break;
      }
      case 'dropdown': {
        const holes = [...(q.text ?? '').matchAll(/\{(\d+)\}/g)].map(m => +m[1]);
        if (!isStr(q.text) || !Array.isArray(q.blanks) || !q.blanks.length) { err('bad dropdown'); break; }
        if (holes.length !== q.blanks.length || !q.blanks.every((_, k) => holes.includes(k))) err('placeholders vs blanks mismatch');
        q.blanks.forEach((b, k) => { if (!Array.isArray(b.options) || b.options.length < 2 || !b.options.every(isStr) || !isIdx(b.answer, b.options.length)) err(`bad blank ${k}`); });
        break;
      }
      case 'number':
        if (!Array.isArray(q.fields) || !q.fields.length || q.fields.length > 4) { err('bad fields'); break; }
        q.fields.forEach((f, k) => {
          if (!isStr(f.label) || typeof f.answer !== 'number' || !Number.isFinite(f.answer)) err(`bad field ${k}`);
          if (f.tol === undefined && f.tolAbs === undefined) err(`field ${k} needs tol or tolAbs`);
        });
        break;
      default: err(`bad type ${q.type}`);
    }
    all.push(q);
  }
}

const count = (k) => all.reduce((m, q) => (m[q[k]] = (m[q[k]] ?? 0) + 1, m), {});
console.log(`${all.length} questions, ${errors.length} errors`);
console.log('by part', count('part'));
console.log('by type', count('type'));
console.log('by topic', count('topic'));
if (errors.length) { console.log(errors.slice(0, 80).join('\n')); process.exit(1); }
if (!args.length) {
  writeFileSync(join(root, '../../public/interaktiv/data/questions.js'), `window.TOPICS=${JSON.stringify(topics)};\nwindow.QUESTIONS=${JSON.stringify(all)};\n`);
  console.log('wrote public/interaktiv/data/questions.js');
}
