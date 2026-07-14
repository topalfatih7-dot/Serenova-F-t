import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const root = process.cwd()

function loadLocalEnv() {
  try {
    const raw = readFileSync(resolve(root, '.env.local'), 'utf8')
    for (const line of raw.split('\n')) {
      const t = line.trim()
      if (!t || t.startsWith('#')) continue
      const i = t.indexOf('=')
      if (i < 1) continue
      const key = t.slice(0, i).trim()
      let val = t.slice(i + 1).trim()
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1)
      }
      if (!process.env[key]) process.env[key] = val
    }
  } catch {
    /* .env.local yoksa devam */
  }
}

function readBody(req) {
  return new Promise((resolveBody, reject) => {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => resolveBody(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function localApiPlugin() {
  const apiDir = resolve(root, 'api')

  return {
    name: 'local-api-dev',
    configureServer(server) {
      loadLocalEnv()

      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0] || ''
        if (url === '/sitemap.xml') {
          req.url = '/api/sitemap'
        }
        const apiPath = req.url?.split('?')[0] || ''
        if (!apiPath.startsWith('/api/')) return next()

        const rel = apiPath.replace(/^\/api\//, '')
        const handlerPath = resolve(apiDir, `${rel}.js`)
        if (!handlerPath.startsWith(apiDir)) {
          res.statusCode = 403
          res.end('Forbidden')
          return
        }

        try {
          const mod = await import(`${pathToFileURL(handlerPath).href}?t=${Date.now()}`)
          const handler = mod.default
          if (typeof handler !== 'function') throw new Error('Handler bulunamadı')

          const raw = req.method === 'GET' || req.method === 'HEAD' ? '' : await readBody(req)
          let body = raw
          try { body = raw ? JSON.parse(raw) : {} } catch { /* metin */ }

          const query = Object.fromEntries(new URL(req.url, 'http://localhost').searchParams)

          const vercelReq = { method: req.method, headers: req.headers, body, query }
          const vercelRes = {
            statusCode: 200,
            headers: {},
            setHeader(k, v) { this.headers[k.toLowerCase()] = v },
            status(code) { this.statusCode = code; return this },
            json(obj) {
              this.setHeader('Content-Type', 'application/json')
              res.writeHead(this.statusCode, this.headers)
              res.end(JSON.stringify(obj))
            },
            end(msg = '') {
              res.writeHead(this.statusCode, this.headers)
              res.end(msg)
            },
            send(msg) {
              this.end(msg)
            },
          }

          await handler(vercelReq, vercelRes)
        } catch (e) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ ok: false, error: String(e.message || e) }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), localApiPlugin()],
  appType: 'spa',
  preview: { host: true },
  server: { port: 5173 },
  build: {
    modulePreload: {
      // Ağır lazy vendor'ları entry'den preload etme (landing'e recharts vb. sızmasın)
      resolveDependencies: (_filename, deps) =>
        deps.filter(
          (dep) =>
            !dep.includes('recharts')
            && !dep.includes('html2pdf')
            && !dep.includes('daily-js')
            && !dep.includes('jspdf'),
        ),
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          // React'i ayrı tut — aksi halde recharts chunk'ına kaçıp entry'ye static import sızıyor
          if (
            id.includes('node_modules/react-dom/')
            || id.includes('node_modules/react/')
            || id.includes('node_modules/scheduler/')
          ) {
            return 'react-vendor'
          }
          if (id.includes('node_modules/recharts/')) {
            return 'recharts'
          }
          if (id.includes('node_modules/framer-motion/')) {
            return 'framer-motion'
          }
          if (id.includes('node_modules/@daily-co/daily-js/')) {
            return 'daily-js'
          }
          if (
            id.includes('node_modules/html2pdf.js/')
            || id.includes('node_modules/jspdf/')
            || id.includes('node_modules/html2canvas/')
          ) {
            return 'html2pdf'
          }
          return undefined
        },
      },
    },
  },
})
