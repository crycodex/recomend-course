import { defineConfig, loadEnv, type ProxyOptions } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// La API key vive solo en .env (GEMINI_API_KEY, sin prefijo VITE_), así que nunca
// llega al bundle del navegador: el proxy de Vite la inyecta como header.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const geminiProxy: Record<string, ProxyOptions> = {
    '/api/gemini': {
      target: 'https://generativelanguage.googleapis.com',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api\/gemini/, '/v1beta/models'),
      headers: { 'x-goog-api-key': env.GEMINI_API_KEY ?? '' },
    },
    // Live API (voz a voz en tiempo real) por WebSocket; la key se añade aquí, en el servidor
    '/api/live': {
      target: 'https://generativelanguage.googleapis.com',
      changeOrigin: true,
      ws: true,
      rewrite: () =>
        `/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${encodeURIComponent(env.GEMINI_API_KEY ?? '')}`,
    },
  }

  return {
    plugins: [react(), tailwindcss()],
    server: { proxy: geminiProxy },
    preview: { proxy: geminiProxy },
  }
})
