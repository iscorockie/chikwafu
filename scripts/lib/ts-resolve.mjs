/**
 * Node hooks that let the Node-based checks import the real `src/` modules.
 *
 * Two gaps between Vite and plain Node are bridged here:
 *   · the storefront uses extensionless imports (`../lib/catalog`), which Node
 *     ESM will not resolve;
 *   · Node strips types from `.ts` but cannot parse JSX, so `.tsx` files are
 *     transformed with esbuild first.
 *
 * The result is that the checks exercise the shipped components and stores
 * rather than a copy of them.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const TSX = /\.(tsx|jsx)$/
const TS = /\.ts$/

export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context)
  } catch (err) {
    for (const ext of ['.ts', '.tsx', '/index.ts', '/index.tsx']) {
      try {
        return await nextResolve(specifier + ext, context)
      } catch { /* try the next candidate */ }
    }
    throw err
  }
}

export async function load(url, context, nextLoad) {
  if (!url.startsWith('file://') || !(TSX.test(url) || TS.test(url))) {
    return nextLoad(url, context)
  }
  if (TS.test(url) && !TSX.test(url)) return nextLoad(url, context) // Node strips .ts itself

  const { transformSync } = await import('esbuild')
  const source = readFileSync(fileURLToPath(url), 'utf8')
  const { code } = transformSync(source, {
    loader: TSX.test(url) ? 'tsx' : 'ts',
    format: 'esm',
    jsx: 'automatic',
    target: 'node22',
    sourcefile: url,
  })
  return { format: 'module', source: code, shortCircuit: true }
}
