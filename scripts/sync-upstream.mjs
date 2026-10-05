// Sync ua-parser-node's version + dependency with the upstream ua-parser
// (uap-rust) crate, so a new upstream release triggers an automatic publish.
//
//   node scripts/sync-upstream.mjs --mode alpha|final
//
// - fetches the latest ua-parser version from crates.io
// - target version mirrors upstream; alpha mode appends -alpha.<N> (the
//   validation round), final mode is the upstream version exactly
// - bumps Cargo.toml (version + exact dep pin), package.json + the five
//   platform stubs (version + optionalDependencies)
// - prints NEW_VERSION=<v> when a bump happened, NOTHING_TO_DO otherwise
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const mode = argv.includes('--mode') ? argv[argv.indexOf('--mode') + 1] : 'alpha';
if (!['alpha', 'final'].includes(mode)) throw new Error('--mode must be alpha or final');

const res = await fetch('https://crates.io/api/v1/crates/ua-parser', {
  headers: { 'user-agent': 'ua-parser-node-sync (ben@benasher.co)' },
});
if (!res.ok) throw new Error(`crates.io fetch failed: ${res.status}`);
const data = await res.json();
const upstream = data.crate.max_stable_version ?? data.crate.max_version;
if (!upstream) throw new Error('no upstream version found');

const cargo = readFileSync(join(root, 'Cargo.toml'), 'utf8');
const curVersion = cargo.match(/^version = "([^"]+)"/m)?.[1];
const curDep = cargo.match(/^ua-parser = "([^"]+)"/m)?.[1];
if (!curVersion || !curDep) throw new Error('could not read Cargo.toml version/dep');

const base = upstream.split('-')[0];
const curAlpha = curVersion.match(new RegExp(`^${base.replace(/\./g, '\\.')}-alpha\\.(\\d+)$`))?.[1];
const target = mode === 'alpha' ? `${base}-alpha.${curAlpha ? Number(curAlpha) + 1 : 1}` : upstream;

if (target === curVersion) {
  console.log('NOTHING_TO_DO');
  process.exit(0);
}

// Cargo.toml: version + exact dep pin (a caret range would absorb upstream
// releases without a sync, defeating the auto-publish)
writeFileSync(
  join(root, 'Cargo.toml'),
  cargo
    .replace(/^version = "[^"]+"/m, `version = "${target}"`)
    .replace(/^ua-parser = "[^"]+"/m, `ua-parser = "${upstream}"`),
);

// main package.json: version + optionalDependencies in lockstep
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
pkg.version = target;
pkg.optionalDependencies = Object.fromEntries(
  Object.keys(pkg.optionalDependencies).map((k) => [k, target]),
);
writeFileSync(join(root, 'package.json'), JSON.stringify(pkg, null, 2) + '\n');

// platform stubs
for (const d of readdirSync(join(root, 'npm'))) {
  const p = join(root, 'npm', d, 'package.json');
  const sp = JSON.parse(readFileSync(p, 'utf8'));
  sp.version = target;
  writeFileSync(p, JSON.stringify(sp, null, 2) + '\n');
}

console.log(`NEW_VERSION=${target} (upstream ${upstream}, dep ${curDep} -> ${upstream})`);
