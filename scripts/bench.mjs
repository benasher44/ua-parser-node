// Benchmark + memory profile for the ua-parser-node binding.
// Usage: node scripts/bench.mjs [iterations=20000]
// Reports: init cost, ns/parse for repeated vs diverse traffic,
// and RSS growth across the run (leak check).
import { performance } from 'node:perf_hooks'
import { parseUserAgent } from '../index.js'

const UAS = {
  chromeMac:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
  safariMac:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  firefoxWin:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0',
  edgeMac:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0',
  safariIOS:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
  chromeAndroid:
    'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36',
  curl: 'curl/8.7.1',
  googlebot:
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  ahrefs:
    'Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)',
  pythonReqs: 'python-requests/2.32.3',
}

const rss = () => process.memoryUsage().rss / 1024 / 1024

const rssBefore = rss()

// init: first call compiles the extractor (lazy)
const t0 = performance.now()
parseUserAgent(UAS.chromeMac)
const initMs = performance.now() - t0

function bench(label, uas, total) {
  // warm up
  for (let i = 0; i < 200; i++) parseUserAgent(uas[i % uas.length])
  const n = uas.length
  const t0 = performance.now()
  for (let i = 0; i < total; i++) parseUserAgent(uas[i % n])
  const ms = performance.now() - t0
  console.log(`${label.padEnd(28)} ${(ms / total * 1000).toFixed(2).padStart(7)} ns/parse  (${total.toLocaleString()} parses, ${ms.toFixed(0)}ms)`)
}

const iters = Number(process.argv[2] ?? 20000)

console.log(`rss before binding load: ${rssBefore.toFixed(1)} MB`)
console.log(`extractor compile (first parse): ${initMs.toFixed(1)} ms, rss after: ${rss().toFixed(1)} MB`)

bench('repeated (8 UAs, hot cache)', Object.values(UAS).slice(0, 8), iters)
bench('single UA (500k-token)', [UAS.chromeMac], iters)
bench('unmatched garbage', ['not-a-user-agent-v' + 'x'.repeat(3)], iters)

// diverse traffic: synthetic variants (distinct UA strings, exercises matcher misses)
const diverse = []
for (let v = 0; v < 200; v++) {
  diverse.push(`Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_${v % 10}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${100 + (v % 60)}.0.0.0 Safari/537.36`)
  diverse.push(`Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:${100 + (v % 40)}.0) Gecko/20100101 Firefox/${100 + (v % 40)}.0`)
  diverse.push(`Mozilla/5.0 (iPhone; CPU iPhone OS 16_${v % 8} like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.${v % 8} Mobile/15E148 Safari/604.1`)
}
bench(`diverse (${diverse.length} distinct)`, diverse, iters)

// soak: growth check across many parses of the diverse set
const soak = iters * 5
const rssSoakStart = rss()
for (let i = 0; i < soak; i++) parseUserAgent(diverse[i % diverse.length])
const rssSoakEnd = rss()
console.log(`soak ${soak.toLocaleString()} diverse parses: rss ${rssSoakStart.toFixed(1)} -> ${rssSoakEnd.toFixed(1)} MB (delta ${(rssSoakEnd - rssSoakStart).toFixed(1)} MB)`)
console.log('node', process.version)