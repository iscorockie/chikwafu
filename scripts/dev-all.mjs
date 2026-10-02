/**
 * Runs the Express API (:5000) and the Vite dev server (:5173) together with
 * prefixed, colourised logs. Ctrl-C stops both.
 *
 *   npm run dev:all
 */
import { spawn } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

const procs = [
  { name: 'api', color: '\x1b[36m', cmd: 'node', args: ['index.mjs'], cwd: join(ROOT, 'server') },
  { name: 'web', color: '\x1b[35m', cmd: process.platform === 'win32' ? 'npx.cmd' : 'npx', args: ['vite'], cwd: ROOT },
]

const children = procs.map(({ name, color, cmd, args, cwd }) => {
  const child = spawn(cmd, args, { cwd, env: process.env, stdio: ['ignore', 'pipe', 'pipe'] })
  const prefix = `${color}[${name}]\x1b[0m `
  const pipe = (stream, out) => {
    let buf = ''
    stream.on('data', (chunk) => {
      buf += chunk.toString()
      let i
      while ((i = buf.indexOf('\n')) >= 0) {
        out.write(prefix + buf.slice(0, i + 1))
        buf = buf.slice(i + 1)
      }
    })
  }
  pipe(child.stdout, process.stdout)
  pipe(child.stderr, process.stderr)
  child.on('exit', (code) => {
    console.log(`${prefix}exited with code ${code}`)
    shutdown()
  })
  return child
})

let closing = false
function shutdown() {
  if (closing) return
  closing = true
  children.forEach((c) => c.kill('SIGTERM'))
  setTimeout(() => process.exit(0), 300)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

console.log('Chikwafu dev: API on :5000, storefront on :5173 (proxies /api).')
