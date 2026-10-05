# ua-parser-node

Node bindings for [ua-parser (uap-rust)](https://github.com/ua-parser/uap-rust),
the official Rust implementation of the
[uap-core](https://github.com/ua-parser/uap-core) user-agent regex spec.

General-purpose extraction of **browser, OS and device** — names, brands,
models, and versions — from user-agent strings. No node-gyp, no postinstall
scripts — prebuilt binaries ship as platform-specific `optionalDependencies`,
exactly like esbuild and rolldown.

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

## Why

Every maintained JavaScript user-agent parser in the ecosystem is either
frozen (`ua-parser-js` v1), AGPL-licensed (`ua-parser-js` v2), enormous
(`node-device-detector`, 2.4MB), or dead (`detect-browser`, last commit 2021).
The actively maintained part of this problem — the uap-core regex database —
is a data spec any Rust implementation can consume, so this package binds
uap-rust to it and leaves the JavaScript world behind.

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
| `ua-parser-node-darwin-x64` | `x86_64-apple-darwin` |
| `ua-parser-node-linux-x64-gnu` | `x86_64-unknown-linux-gnu` |
| `ua-parser-node-linux-arm64-gnu` | `aarch64-unknown-linux-gnu` |
| `ua-parser-node-linux-arm64-musl` | `aarch64-unknown-linux-musl` |
| `ua-parser-node-win32-x64-msvc` | `x86_64-pc-windows-msvc` |

## How the data stays fresh

The full uap-core spec (browser, OS and device parsers — 1,270 rules) is
vendored at `vendor/regexes.json` and compiled into the binary with
`include_str!`. Refresh with `python3 scripts/refresh-vendor.py` (fetches
upstream, converts to compact JSON) and cut a release — CI rebuilds every
platform.

## License

Dual-licensed [MIT](LICENSE-MIT) OR [Apache-2.0](LICENSE-APACHE) — the Rust
ecosystem convention. Both are permissive (no copyleft); Apache-2.0 adds an
explicit patent grant, which suits a package shipping compiled binaries.
The vendored uap-core data is MIT-licensed upstream.
