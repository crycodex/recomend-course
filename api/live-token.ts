// Función serverless (Vercel): crea un token efímero de un solo uso para la Live API.
// Vercel no puede reenviar WebSockets, así que el navegador se conecta directo a Google
// con este token, sin conocer la API key.
import { GoogleGenAI } from '@google/genai'

export async function POST(): Promise<Response> {
  const key = process.env.GEMINI_API_KEY
  if (!key) return Response.json({ error: { message: 'Falta GEMINI_API_KEY en el servidor.' } }, { status: 500 })

  try {
    const ai = new GoogleGenAI({ apiKey: key, httpOptions: { apiVersion: 'v1alpha' } })
    const now = Date.now()
    const token = await ai.authTokens.create({
      config: {
        uses: 1,
        // La sesión debe empezar en 1 min y dura como máximo 5 min (la demo corta a 1 min)
        newSessionExpireTime: new Date(now + 60_000).toISOString(),
        expireTime: new Date(now + 5 * 60_000).toISOString(),
        httpOptions: { apiVersion: 'v1alpha' },
      },
    })
    return Response.json({ token: token.name }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    return Response.json({ error: { message: e instanceof Error ? e.message : 'No se pudo crear el token.' } }, { status: 502 })
  }
}
