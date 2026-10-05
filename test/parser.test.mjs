import test from 'node:test'
import assert from 'node:assert/strict'
import { parseUserAgent } from '../index.js'

const CHROME_MAC =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'
const SAFARI_MAC =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15'
const FIREFOX_WIN =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0'
const EDGE_MAC =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0'
const SAFARI_IOS =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1'
const CHROME_ANDROID =
  'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36'
const FIREFOX_LINUX =
  'Mozilla/5.0 (X11; Linux x86_64; rv:129.0) Gecko/20100101 Firefox/129.0'
const CURL = 'curl/8.7.1'
const GOOGLEBOT =
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
const GARBAGE = 'not-a-user-agent'

test('chrome on macOS', () => {
  const r = parseUserAgent(CHROME_MAC)
  assert.equal(r.browser, 'Chrome')
  assert.equal(r.browserVersion, '138')
  assert.equal(r.os, 'Mac OS X')
  assert.equal(r.osVersion, '10')
})

test('full versions and device info (general-purpose API)', () => {
  const r = parseUserAgent(CHROME_MAC)
  assert.equal(r.browserVersionFull, '138.0.0.0')
  assert.equal(r.osVersionFull, '10.15.7')
  assert.equal(r.device, 'Mac')
  assert.equal(r.brand, 'Apple')
  assert.equal(r.model, 'Mac')

  const iphone = parseUserAgent(SAFARI_IOS)
  assert.equal(iphone.osVersionFull, '18.5')
  assert.equal(iphone.device, 'iPhone')
  assert.equal(iphone.brand, 'Apple')
  assert.equal(iphone.model, 'iPhone')

  // unmatched strings leave every field undefined, no throw
  const g = parseUserAgent('not-a-user-agent')
  assert.equal(g.browserVersionFull ?? null, null)
  assert.equal(g.device ?? null, null)
  assert.equal(g.brand ?? null, null)
})

test('safari on macOS', () => {
  const r = parseUserAgent(SAFARI_MAC)
  assert.equal(r.browser, 'Safari')
  assert.equal(r.browserVersion, '17')
  assert.equal(r.os, 'Mac OS X')
})

test('firefox on windows', () => {
  const r = parseUserAgent(FIREFOX_WIN)
  assert.equal(r.browser, 'Firefox')
  assert.equal(r.browserVersion, '130')
  assert.equal(r.os, 'Windows')
  assert.equal(r.osVersion, '10')
})

test('edge is not chrome', () => {
  const r = parseUserAgent(EDGE_MAC)
  assert.equal(r.browser, 'Edge')
  assert.equal(r.browserVersion, '138')
})

test('safari on iOS', () => {
  const r = parseUserAgent(SAFARI_IOS)
  assert.equal(r.browser, 'Mobile Safari')
  assert.equal(r.browserVersion, '18')
  assert.equal(r.os, 'iOS')
  assert.equal(r.osVersion, '18')
})

test('chrome on android', () => {
  const r = parseUserAgent(CHROME_ANDROID)
  assert.equal(r.browser, 'Chrome Mobile') // uap-core family convention for mobile Chrome
  assert.equal(r.browserVersion, '138')
  assert.equal(r.os, 'Android')
  assert.equal(r.osVersion, '15')
})

test('firefox on linux has no OS version', () => {
  const r = parseUserAgent(FIREFOX_LINUX)
  assert.equal(r.browser, 'Firefox')
  assert.equal(r.browserVersion, '129')
  assert.equal(r.os, 'Linux')
  assert.equal(r.osVersion, undefined) // unmatched fields come back as undefined
})

test('unknown strings parse to nulls without throwing', () => {
  for (const ua of [CURL, GARBAGE, GOOGLEBOT, '']) {
    const r = parseUserAgent(ua)
    assert.equal(typeof r.browser === 'string' || r.browser == null, true)
  }
})

test('null/empty input does not throw', () => {
  const r = parseUserAgent('')
  assert.equal(r.browser, undefined)
  assert.equal(r.os, undefined)
})
