'use strict'
// Loads the prebuilt native binding for the current platform from the
// matching optionalDependency. No node-gyp, no postinstall — the binaries
// ship prebuilt, exactly like esbuild/rolldown do.

const { existsSync } = require('node:fs')
const { join } = require('node:path')

function isMusl() {
  const report = process.report?.getReport?.()
  return report != null && report.header?.glibcVersionRuntime == null
}

function platformKey() {
  const { platform, arch } = process
  if (platform === 'win32') return 'win32-x64-msvc'
  if (platform === 'linux') return `linux-${arch}${isMusl() ? '-musl' : '-gnu'}`
  if (platform === 'darwin') return `darwin-${arch}`
  return null
}

const platformPackages = {
  'darwin-arm64': '@ua-parser-node/darwin-arm64',
  'darwin-x64': '@ua-parser-node/darwin-x64',
  'linux-arm64-gnu': '@ua-parser-node/linux-arm64-gnu',
  'linux-arm64-musl': '@ua-parser-node/linux-arm64-musl',
  'linux-x64-gnu': '@ua-parser-node/linux-x64-gnu',
  'win32-x64-msvc': '@ua-parser-node/win32-x64-msvc',
}

let binding
const key = platformKey()
const pkg = key ? platformPackages[key] : null

if (pkg) {
  try {
    binding = require(pkg)
  } catch {
    // fall through to the local dev build
  }
}

if (!binding) {
  // local dev: `napi build` leaves ua-parser-node.node in the package root
  const local = join(__dirname, 'ua-parser-node.node')
  if (existsSync(local)) {
    binding = require(local)
  }
}

if (!binding) {
  throw new Error(
    `ua-parser-node: no prebuilt binding for ${key ?? `${process.platform}-${process.arch}`}. ` +
      `The platform package (${pkg ?? 'none for this platform'}) should have been installed as an optional ` +
      `dependency — check that your package manager is not skipping optional dependencies.`,
  )
}

module.exports = binding
module.exports.default = binding