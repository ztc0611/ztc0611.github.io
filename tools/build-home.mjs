import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const result = await build({
  absWorkingDir: root,
  entryPoints: ['assets/home/scene.js'],
  outfile: 'assets/home/dist/scene.min.js',
  bundle: true,
  minify: true,
  format: 'esm',
  target: ['safari16', 'chrome110', 'firefox115'],
  legalComments: 'eof',
  write: false
});

const bundle = result.outputFiles[0];
const revision = createHash('sha256').update(bundle.contents).digest('hex').slice(0, 12);
const indexPath = new URL('../index.html', import.meta.url);
const html = await readFile(indexPath, 'utf8');
const asset = `/assets/home/dist/scene.min.js?v=${revision}`;
const previous = /\/assets\/home\/dist\/scene\.min\.js\?v=[a-f0-9]+/g;
if (html.match(previous)?.length !== 2) throw new Error('Expected the scene preload and script in index.html.');
await mkdir(new URL('../assets/home/dist/', import.meta.url), { recursive: true });
await writeFile(bundle.path, bundle.contents);
await writeFile(indexPath, html.replace(previous, asset));
console.log(`Built ${asset} (${bundle.contents.length} bytes)`);
