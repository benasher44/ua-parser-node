# ua-parser-node

Node bindings for [ua-parser (uap-rust)](https://github.com/ua-parser/uap-rust),
the official Rust implementation of the
[uap-core](https://github.com/ua-parser/uap-core) user-agent regex spec.

```js
import { parseUserAgent } from 'ua-parser-node'

parseUserAgent(
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
)
// => {
//   browser: 'Chrome',
//   browserVersion: '138',          // major, for analytics grouping
//   browserVersionFull: '138.0.0.0',
//   os: 'Mac OS X',
//   osVersion: '10',                // major
//   osVersionFull: '10.15.7',
//   device: 'Mac',
//   brand: 'Apple',
//   model: 'Mac',
// }
```

Fully typed: `index.d.ts` ships with the package, generated from the Rust API
on every build — `parseUserAgent` and `UaResult` are typed out of the box, no
`@types/` package needed.

An ESM package (`"type": "module"`): static `import` works everywhere, and
`require()` works on Node versions that support `require(esm)` (20.19+ /
22.12+). The native binding loads synchronously via `createRequire` — no
`await import` needed. Tested on 20/22/24.

## Why

The maintained JavaScript user-agent parsers are a mixed bag: `ua-parser-js`
v1 is frozen, v2 is AGPL-licensed, `node-device-detector` is 2.4MB, and
`detect-browser` is unmaintained. The actively maintained part of this
problem is the uap-core regex database, a data spec any Rust implementation
can consume. This package binds uap-rust to it: uap-rust is actively
maintained, so the parsing rules stay current without this package
maintaining its own.

## API

`parseUserAgent(ua: string): UaResult`

All uap-core domains are extracted in one call — browser family + version,
OS + version, and device family/brand/model. Version fields come in two
forms: `*Version` (major only, for analytics grouping) and `*VersionFull`
(the complete dotted string). Unmatched input returns a result with every
field `undefined` and never throws.

## Supported platforms

| package | triple |
| --- | --- |
| `ua-parser-node-darwin-arm64` | `aarch64-apple-darwin` |
| `ua-parser-node-linux-x64-gnu` | `x86_64-unknown-linux-gnu` |
| `ua-parser-node-linux-arm64-gnu` | `aarch64-unknown-linux-gnu` |
| `ua-parser-node-linux-arm64-musl` | `aarch64-unknown-linux-musl` |
| `ua-parser-node-win32-x64-msvc` | `x86_64-pc-windows-msvc` |

## Bundlers

Bundlers (esbuild, rolldown, etc.) refuse to inline a native `.node` file, so
mark the native packages external when bundling for Node:

```js
// esbuild
build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  external: ['ua-parser-node', 'ua-parser-node-linux-arm64-gnu' /* + your platforms */],
})
```

The package itself loads fine unbundled under both `import` and `require`
(fully ESM-interop-clean).

## License

Dual-licensed [MIT](LICENSE-MIT) OR [Apache-2.0](LICENSE-APACHE), matching
uap-rust.
