/**
 * Wraps the OpenNext bundled worker with CF Pages static asset serving.
 *
 * CF Pages Advanced Mode: when _worker.js is present, CF Pages disables
 * built-in static asset serving. The worker must call env.ASSETS.fetch()
 * explicitly (unlike CF Workers which does it automatically when run_worker_first=false).
 *
 * This script renames worker_default to __innerWorker__ and adds a new
 * worker_default that tries env.ASSETS.fetch() for static paths first.
 */

import { readFileSync, writeFileSync } from 'fs'

const BUNDLE_PATH = process.argv[2]
const OUT_PATH = process.argv[3]

let bundle = readFileSync(BUNDLE_PATH, 'utf8')

// Remove sourcemap comment
bundle = bundle.replace(/\n\/\/# sourceMappingURL=.*$/, '')

// Add node: prefix to bare Node.js built-in imports (CF Pages requires it)
const NODE_BUILTINS = ['assert','async_hooks','buffer','child_process','cluster','console','crypto','dgram','diagnostics_channel','dns','events','fs','http','http2','https','inspector','module','net','os','path','perf_hooks','process','querystring','readline','stream','string_decoder','timers','tls','trace_events','tty','url','util','v8','vm','wasi','worker_threads','zlib']
for (const mod of NODE_BUILTINS) {
  bundle = bundle.replaceAll(`from "${mod}"`, `from "node:${mod}"`)
  bundle = bundle.replaceAll(`require("${mod}")`, `require("node:${mod}")`)
}

// Rename the last worker_default declaration to __innerWorker__
const WORKER_DEF = 'var worker_default = {'
const lastIdx = bundle.lastIndexOf(WORKER_DEF)
if (lastIdx === -1) {
  console.error('ERROR: Could not find "var worker_default = {" in bundle')
  process.exit(1)
}
bundle =
  bundle.substring(0, lastIdx) +
  'var __innerWorker__ = {' +
  bundle.substring(lastIdx + WORKER_DEF.length)

// Append the CF Pages static-aware wrapper
const wrapper = `

// CF Pages static asset wrapper
// In CF Pages Advanced Mode, _worker.js handles ALL requests.
// We must route /_next/*, /icons/*, etc. via env.ASSETS.fetch() ourselves.
var worker_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const isStatic =
      path.startsWith("/_next/") ||
      path.startsWith("/icons/") ||
      path === "/robots.txt" ||
      path === "/favicon.ico" ||
      path === "/BUILD_ID";
    if (isStatic && env.ASSETS) {
      try {
        const r = await env.ASSETS.fetch(request.clone());
        if (r.ok) return r;
      } catch (_) {}
    }
    return __innerWorker__.fetch(request, env, ctx);
  }
};
`

// Insert wrapper before the final export block
const exportIdx = bundle.lastIndexOf('\nexport {')
if (exportIdx === -1) {
  console.error('ERROR: Could not find "export {" in bundle')
  process.exit(1)
}

const result =
  bundle.substring(0, exportIdx) +
  wrapper +
  '\nexport {' +
  bundle.substring(exportIdx + '\nexport {'.length)

writeFileSync(OUT_PATH, result)
console.log('Wrapped worker written to', OUT_PATH, '(' + Math.round(result.length / 1024) + ' KB)')
