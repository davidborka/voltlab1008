// Cache-busting: GitHub Pages caches for 10 minutes, so after a deploy a phone could mix old CSS with new JS.
// Stamps every local script/stylesheet in public/interaktiv/index.html with ?v=<content hash>.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = join(dirname(fileURLToPath(import.meta.url)), '../../public/interaktiv');
const hash = path => createHash('sha1').update(readFileSync(join(dir, path))).digest('hex').slice(0, 8);
// the 3D studio is loaded by a dynamic import inside game.js: stamp that first, so game.js's own hash includes it
const gamePath = join(dir, 'game.js');
writeFileSync(gamePath, readFileSync(gamePath, 'utf8').replace(/import\('\.\/game\/studio\.js(?:\?v=\w+)?'\)/, `import('./game/studio.js?v=${hash('game/studio.js')}')`));
const file = join(dir, 'index.html');
const html = readFileSync(file, 'utf8').replace(/(src|href)="((?!https?:)[^"?]+\.(?:js|css))(?:\?v=[^"]*)?"/g, (_, attr, path) =>
  `${attr}="${path}?v=${hash(path)}"`);
writeFileSync(file, html);
console.log('stamped', [...html.matchAll(/\?v=\w+/g)].length, 'assets');
