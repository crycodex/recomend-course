import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// En desarrollo servimos las mismas funciones de /api que usa Vercel en producción.
// GEMINI_API_KEY (sin prefijo VITE_) solo vive en el servidor: nunca llega al bundle.
function apiRoutes(): Plugin {
  const routes: [RegExp, string][] = [
    [/^\/api\/gemini\/[^/]+$/, '/api/gemini/[model].ts'],
    [/^\/api\/live-token$/, '/api/live-token.ts'],
  ]
  return {
    name: 'vercel-api-dev',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const path = req.url?.split('?')[0] ?? ''
        const route = routes.find(([re]) => re.test(path))
        if (!route || req.method !== 'POST') return next()
        try {
          const mod = await server.ssrLoadModule(route[1])
          const chunks: Buffer[] = []
          for await (const c of req) chunks.push(c as Buffer)
          const request = new Request(`http://${req.headers.host}${req.url}`, {
            method: 'POST',
            headers: { 'Content-Type': req.headers['content-type'] ?? 'application/json' },
            body: Buffer.concat(chunks),
          })
          const response: Response = await mod.POST(request)
          res.statusCode = response.status
          response.headers.forEach((v, k) => res.setHeader(k, v))
          res.end(Buffer.from(await response.arrayBuffer()))
        } catch (e) {
          next(e)
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  process.env.GEMINI_API_KEY ??= env.GEMINI_API_KEY

  return {
    plugins: [react(), tailwindcss(), apiRoutes()],
  }
})
