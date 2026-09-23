// Cliente mínimo de la REST API de Gemini (generateContent).
// Las peticiones van a /api/gemini, que el proxy de Vite reenvía a Google
// añadiendo la API key desde .env — el navegador nunca la ve.

export const PRIMARY_MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.8-flash'
// Modelos de respaldo, separados por coma, por si el principal está saturado
const FALLBACK_MODELS = (import.meta.env.VITE_GEMINI_FALLBACK_MODELS || 'gemini-3.7-flash,gemini-3.5-flash,gemini-3.1-flash-lite')
  .split(',')
  .map((m: string) => m.trim())
  .filter(Boolean)
const MODEL_CHAIN = [...new Set([PRIMARY_MODEL, ...FALLBACK_MODELS])]
// Si un modelo no responde en este tiempo, lanzamos el siguiente en paralelo (gana el primero)
const HEDGE_AFTER_MS = 8_000
const TIMEOUT_MS = 45_000

export type Part = { text: string } | { inlineData: { mimeType: string; data: string } }
export interface Content {
  role: 'user' | 'model'
  parts: Part[]
}

export interface GenerateOptions {
  contents: Content[]
  systemInstruction?: string
  responseSchema?: object
  temperature?: number
}

export interface GenerateResult {
  text: string
  model: string
}

async function callModel(model: string, opts: GenerateOptions, signal: AbortSignal): Promise<GenerateResult> {
  const body: Record<string, unknown> = {
    contents: opts.contents,
    generationConfig: {
      temperature: opts.temperature ?? 0.4,
      // Los Gemini 3.x razonan por defecto; para un asistente de voz priorizamos latencia
      ...(model.startsWith('gemini-3') && { thinkingConfig: { thinkingLevel: 'low' } }),
      ...(opts.responseSchema && {
        responseMimeType: 'application/json',
        responseSchema: opts.responseSchema,
      }),
    },
  }
  if (opts.systemInstruction) {
    body.systemInstruction = { parts: [{ text: opts.systemInstruction }] }
  }
  const res = await fetch(`/api/gemini/${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })
  const json = await res.json().catch(() => null)
  if (!res.ok) throw new Error(json?.error?.message ?? `Error HTTP ${res.status}`)
  const text: string =
    json?.candidates?.[0]?.content?.parts
      ?.filter((p: { thought?: boolean }) => !p.thought)
      .map((p: { text?: string }) => p.text ?? '')
      .join('') ?? ''
  if (!text) throw new Error('Gemini no devolvió texto (posible bloqueo de seguridad).')
  return { text, model }
}

// Peticiones escalonadas ("hedged"): arranca el modelo principal y, si falla o tarda más de
// HEDGE_AFTER_MS, arranca el siguiente de la cadena sin cancelar los anteriores.
export function generate(opts: GenerateOptions): Promise<GenerateResult> {
  return new Promise((resolve, reject) => {
    const controllers: AbortController[] = []
    let next = 0
    let pending = 0
    let done = false
    let lastError: unknown = null
    let hedgeTimer: ReturnType<typeof setTimeout> | undefined

    const finish = () => {
      done = true
      clearTimeout(hedgeTimer)
      controllers.forEach((c) => c.abort())
    }

    const launch = () => {
      clearTimeout(hedgeTimer)
      if (done || next >= MODEL_CHAIN.length) return
      const model = MODEL_CHAIN[next++]
      const ctrl = new AbortController()
      controllers.push(ctrl)
      const timeout = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
      pending++
      callModel(model, opts, ctrl.signal)
        .then((r) => {
          if (done) return
          finish()
          resolve(r)
        })
        .catch((e) => {
          if (done) return
          lastError = ctrl.signal.aborted ? new Error('Tiempo de espera agotado.') : e
          if (next < MODEL_CHAIN.length) launch()
          else if (pending === 1) {
            finish()
            reject(lastError)
          }
        })
        .finally(() => {
          clearTimeout(timeout)
          pending--
        })
      hedgeTimer = setTimeout(launch, HEDGE_AFTER_MS)
    }

    launch()
  })
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(String(reader.result).split(',')[1] ?? '')
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export async function audioPart(blob: Blob): Promise<Part> {
  // Gemini no necesita el parámetro codecs
  const mimeType = (blob.type || 'audio/webm').split(';')[0]
  return { inlineData: { mimeType, data: await blobToBase64(blob) } }
}
