#!/usr/bin/env node
// Servidor local del export ya construido; nunca inicia un build ni llama APIs.
import { createServer } from 'node:http'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'

const root = resolve('out')
const base = '/madclon-front-office'
const port = Number(process.env.PREVIEW_PORT || 9341)
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' }

createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405).end(); return }
  try {
    const url = new URL(req.url, `http://127.0.0.1:${port}`)

    if (!url.pathname.startsWith(`${base}/`)) { res.writeHead(404).end(); return }
    let file = resolve(join(root, decodeURIComponent(url.pathname.slice(base.length))))

    if (file !== root && !file.startsWith(`${root}/`)) { res.writeHead(403).end(); return }
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html')
    if (!existsSync(file)) { res.writeHead(404).end(); return }
    res.writeHead(200, { 'content-type': mime[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' })
    res.end(req.method === 'HEAD' ? undefined : readFileSync(file))
  } catch { res.writeHead(500).end() }
}).listen(port, '127.0.0.1', () => console.log(`Static preview http://127.0.0.1:${port}${base}/`))
