import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/* Az interaktív vizsga kérdésbankja: séma, egyedi azonosítók, témák, típusonkénti szabályok. */
describe('interaktív vizsga kérdésbank', () => {
  it('minden kérdés megfelel a sémának', () => {
    const dir = join(__dirname, '../../content/interaktiv');
    const files = readdirSync(join(dir, 'parts')).map((f) => join(dir, 'parts', f));
    const out = execFileSync('node', [join(dir, 'validate.mjs'), ...files], { encoding: 'utf8' });
    expect(out).toMatch(/, 0 errors/);
  });

  it('a tananyag-magyarázók érvényesek', () => {
    const out = execFileSync('node', [join(__dirname, '../../content/interaktiv/validate-explainers.mjs'), '--no-write'], { encoding: 'utf8' });
    expect(out).toMatch(/, 0 errors/);
  });
});
