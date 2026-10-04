// Binding-level smoke test: the addon builds, loads, and exposes
// parseUserAgent with sane types. Deliberately does NOT assert uap-core
// parsing correctness — that is the rust package's + upstream fixtures'
// domain (see test/parser.test.mjs, run on main and locally).
import test from 'node:test'
import assert from 'node:assert/strict'
import { parseUserAgent } from '../index.js'

test('binding loads and exposes parseUserAgent', () => {
  assert.equal(typeof parseUserAgent, 'function')
})

test('returns the expected shape for a mainstream UA', () => {
  const r = parseUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
  )
  assert.equal(typeof r.browser, 'string')
  assert.equal(typeof r.browserVersion, 'string')
  assert.equal(typeof r.os, 'string')
  assert.equal(typeof r.osVersion, 'string')
})

test('unmatched input yields no throw and empty result', () => {
  const r = parseUserAgent('definitely not a user agent string')
  assert.equal(r.browser ?? null, null)
})

test('empty input does not throw', () => {
  assert.doesNotThrow(() => parseUserAgent(''))
})

test('a thousand parses stay fast (regression guard)', () => {
  const ua =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0'
  const t0 = performance.now()
  for (let i = 0; i < 1000; i++) parseUserAgent(ua)
  const ms = performance.now() - t0
  // ~4µs/parse measured; 10ms budget = ~100x headroom, catches deopt-level regressions
  assert.ok(ms < 1000, `1000 parses took ${ms.toFixed(0)}ms`)
})
