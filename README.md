# ua-parser-node

Node bindings for [ua-parser (uap-rust)](https://github.com/ua-parser/uap-rust),
the official Rust implementation of the
[uap-core](https://github.com/ua-parser/uap-core) user-agent regex spec.

Extracts **browser name + major version** and **OS name + major version** from
user-agent strings. No node-gyp, no postinstall scripts — prebuilt binaries
ship as platform-specific `optionalDependencies`, exactly like esbuild and
rolldown.

```js
import { parseUserAgent } from 'ua-parser-node'

parseUserAgent(
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
)
// => { browser: 'Chrome', browserVersion: '138', os: 'Mac OS X', osVersion: '10' }
```

## Why

Every maintained JavaScript user-agent parser in the ecosystem is either
frozen (`ua-parser-js` v1), AGPL-licensed (`ua-parser-js` v2), enormous
(`node-device-detector`, 2.4MB), or dead (`detect-browser`, last commit 2021).
The actively maintained part of this problem — the uap-core regex database —
is a data spec any Rust implementation can consume, so this package binds
uap-rust to it and leaves the JavaScript world behind.

Bot and AI-crawler classification is intentionally out of scope: use
[`isbot`](https://www.npmjs.com/package/isbot) (Unlicense, actively
maintained) alongside this package for that.

## Supported platforms

| package | triple |
| --- | --- |
| `@ua-parser-node/darwin-arm64` | `aarch64-apple-darwin` |
| `@ua-parser-node/darwin-x64` | `x86_64-apple-darwin` |
| `@ua-parser-node/linux-x64-gnu` | `x86_64-unknown-linux-gnu` |
| `@ua-parser-node/linux-arm64-gnu` | `aarch64-unknown-linux-gnu` |
| `@ua-parser-node/linux-arm64-musl` | `aarch64-unknown-linux-musl` |
| `@ua-parser-node/win32-x64-msvc` | `x86_64-pc-windows-msvc` |


## How the data stays fresh

The uap-core `regexes.yaml` is vendored at `vendor/regexes.yaml` and compiled
into the binary with `include_str!`. The vendored copy is trimmed to
`user_agent_parsers` + `os_parsers` — the 637 browser and OS rules. The
`device_parsers` section (633 rules, 63% of the spec) is dropped
deliberately: this package does not expose device data, and the trimmed
spec cuts the embedded data by ~63% and roughly halves the compiled-automata
memory footprint in the wasm build. When uap-core updates (new browsers,
new OS versions), re-trim the upstream file and cut a release — CI rebuilds
every platform.

## License

Dual-licensed MIT OR Apache-2.0, matching the Rust ecosystem. The vendored
uap-core data is also MIT-licensed.
