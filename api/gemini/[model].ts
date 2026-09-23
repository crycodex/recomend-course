// Función serverless (Vercel): reenvía generateContent a Gemini añadiendo la API key.
// El navegador llama a /api/gemini/<modelo>:generateContent y nunca ve la key.

const ALLOWED = /^gemini-[\w.-]+:generateContent$/

export async function POST(request: Request): Promise<Response> {
  const key = process.env.GEMINI_API_KEY
  if (!key) return Response.json({ error: { message: 'Falta GEMINI_API_KEY en el servidor.' } }, { status: 500 })

  const target = decodeURIComponent(new URL(request.url).pathname.split('/').pop() ?? '')
  if (!ALLOWED.test(target)) return Response.json({ error: { message: 'Modelo no permitido.' } }, { status: 400 })

  const upstream = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${target}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: await request.text(),
  })
  return new Response(upstream.body, {
    status: upstream.status,
    headers: { 'Content-Type': upstream.headers.get('Content-Type') ?? 'application/json' },
  })
}
