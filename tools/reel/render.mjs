// Renders a reel from apps/reel frame by frame and encodes it with ffmpeg.
//
//   npm run reel:dev                      # in another terminal: serves the reels on :3100
//   npm run reel:render -- timeline       # → out/reels/timeline.mp4 (30 fps)
//   npm run reel:render -- timeline --fps 60 --stills 1.5,4,9
//
// Options: --fps N, --from S, --to S, --stills S,S,... (PNG frames only, no
// video), --base URL (default http://localhost:3100), --out FILE.
// The video is silent; tools/reel/soundtrack.py writes the temp track and
// muxes it in.
import { spawn, execSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

function parseArgs(argv) {
  const options = { fps: 30, base: 'http://localhost:3100' }
  const rest = []
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg.startsWith('--')) options[arg.slice(2)] = argv[++i]
    else rest.push(arg)
  }
  options.variant = rest[0]
  return options
}

function loadPlaywright() {
  const require = createRequire(import.meta.url)
  try {
    return require('playwright')
  } catch {
    const globalRoot = execSync('npm root -g').toString().trim()
    return require(join(globalRoot, 'playwright'))
  }
}

const options = parseArgs(process.argv.slice(2))
if (!options.variant) {
  console.error('Usage: node tools/reel/render.mjs <variant> [--fps 30] [--stills 1,2,3]')
  process.exit(1)
}

const fps = Number(options.fps)
const outDir = join(root, 'out', 'reels')
mkdirSync(outDir, { recursive: true })
const stills = options.stills ? options.stills.split(',').map(Number) : null

const { chromium } = loadPlaywright()
// Animations run on the main thread, so pausing and seeking them is exact.
const browser = await chromium.launch({
  args: ['--font-render-hinting=none', '--disable-lcd-text', '--disable-threaded-animation', '--disable-checker-imaging'],
})
const page = await browser.newPage({ viewport: { width: 432, height: 768 }, deviceScaleFactor: 2.5 })
page.on('console', (message) => {
  if (message.type() === 'error' || message.type() === 'warning') console.log('[page]', message.text())
})
page.on('pageerror', (error) => console.log('[page error]', error.message))

await page.addInitScript({ path: join(root, 'tools/reel/clock.js') })
await page.goto(`${options.base}/${options.variant}?render`, { waitUntil: 'networkidle', timeout: 120_000 })
await page.waitForFunction(() => window.__reel, null, { timeout: 60_000 })
await page.evaluate(() => window.__reel.ready)
const info = await page.evaluate(() => {
  window.__clock.freeze()
  window.__reel.start()
  const { id, duration, bpm, mood, sounds } = window.__reel
  return { id, duration, bpm, mood, sounds }
})

const from = Number(options.from ?? 0)
const to = Math.min(Number(options.to ?? info.duration), info.duration)
const total = Math.round(info.duration * fps)
const capture = () => page.screenshot({ type: 'png', caret: 'initial', scale: 'device' })

// Timing of the edit, for the soundtrack.
writeFileSync(join(outDir, `${info.id}.cues.json`), JSON.stringify(info, null, 2))

const started = Date.now()

if (stills) {
  const dir = join(outDir, `${info.id}-stills`)
  mkdirSync(dir, { recursive: true })
  const wanted = new Set(stills.map((s) => Math.round(s * fps)))
  const last = Math.max(...wanted)
  for (let i = 0; i <= last; i++) {
    await page.evaluate((t) => window.__reel.frame(t), i / fps)
    if (!wanted.has(i)) continue
    const file = join(dir, `${(i / fps).toFixed(2).padStart(6, '0')}.png`)
    writeFileSync(file, await capture())
    console.log('still', file)
  }
} else {
  const out = options.out ? resolve(options.out) : join(outDir, `${info.id}.silent.mp4`)
  const ffmpeg = spawn('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-',
    '-vf', 'scale=1080:1920:flags=lanczos:out_color_matrix=bt709:out_range=tv,format=yuv420p',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-tune', 'film',
    '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
    '-movflags', '+faststart', out,
  ], { stdio: ['pipe', 'inherit', 'inherit'] })
  const finished = new Promise((ok, fail) => ffmpeg.on('close', (code) => (code ? fail(new Error('ffmpeg ' + code)) : ok())))

  for (let i = 0; i < total; i++) {
    const t = i / fps
    await page.evaluate((s) => window.__reel.frame(s), t)
    if (t < from || t > to) continue
    const png = await capture()
    if (!ffmpeg.stdin.write(png)) await new Promise((ok) => ffmpeg.stdin.once('drain', ok))
    if (i % fps === 0) {
      const elapsed = (Date.now() - started) / 1000
      console.log(`${t.toFixed(1)}s / ${info.duration}s  (${elapsed.toFixed(0)}s elapsed)`)
    }
  }
  ffmpeg.stdin.end()
  await finished
  console.log('wrote', out)
}

await browser.close()
console.log(`done in ${((Date.now() - started) / 1000).toFixed(0)}s`)
