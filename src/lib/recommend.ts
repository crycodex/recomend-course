import { COURSES, courseById, type Course } from '../data/courses'
import { audioPart, generate, type Content, type Part } from './gemini'

const catalogText = COURSES.map(
  (c) =>
    `- id="${c.id}" | ${c.title} | área: ${c.area} | nivel: ${c.level} | ${c.durationHours} h | rating ${c.rating} | temas: ${c.tags.join(', ')} | ${c.description}`,
).join('\n')

export const RECRUITER_PROMPT = `Eres "Vera", una reclutadora de cursos amable para gente que quiere aprender algo.
Hablas en español neutro, frases cortas y naturales (tus respuestas pueden leerse en voz alta).
Solo puedes recomendar cursos de este catálogo (usa exactamente sus id):
${catalogText}
Nunca inventes cursos que no estén en el catálogo. Si ninguno encaja del todo, dilo con honestidad y sugiere el más cercano.`

// ---------- Modo "Recomendar" (F001–F006) ----------

export interface Intent {
  area: string
  level: string
  constraints: string
}

export interface Recommendation {
  course: Course
  score: number
  reason: string
}

export interface RecommendResult {
  transcript: string
  intent: Intent
  recommendations: Recommendation[]
  reply: string
  model: string
}

const recommendSchema = {
  type: 'OBJECT',
  properties: {
    transcript: { type: 'STRING', description: 'Transcripción literal de lo que pidió el usuario' },
    intent: {
      type: 'OBJECT',
      properties: {
        area: { type: 'STRING', description: 'Área de interés detectada' },
        level: { type: 'STRING', description: 'principiante, intermedio, avanzado o no especificado' },
        constraints: { type: 'STRING', description: 'Restricciones: tiempo, objetivo, etc. o "ninguna"' },
      },
      required: ['area', 'level', 'constraints'],
    },
    recommendations: {
      type: 'ARRAY',
      description: 'Exactamente 3 cursos, del más al menos relevante',
      items: {
        type: 'OBJECT',
        properties: {
          id: { type: 'STRING' },
          score: { type: 'NUMBER', description: 'Relevancia 0-100' },
          reason: { type: 'STRING', description: 'Por qué encaja, una frase' },
        },
        required: ['id', 'score', 'reason'],
      },
    },
    reply: {
      type: 'STRING',
      description: 'Respuesta conversacional (máx. 60 palabras) explicando las 3 recomendaciones, para leer en voz alta',
    },
  },
  required: ['transcript', 'intent', 'recommendations', 'reply'],
}

// Respaldo local (sin IA) si Gemini no está disponible: puntaje por palabras clave + rating
const STOPWORDS = new Set(['de', 'con', 'para', 'desde', 'la', 'el', 'los', 'las', 'y', 'e'])
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

export function localRecommend(query: string): RecommendResult {
  const q = norm(query)
  const level = /principiante|cero|empezar|nunca|basico/.test(q)
    ? 'principiante'
    : /avanzad|experto/.test(q)
      ? 'avanzado'
      : /intermedi|ya se|ya sé/.test(q)
        ? 'intermedio'
        : 'no especificado'
  const ranked = COURSES.map((c) => {
    const hits = [...c.tags, c.area, c.title].filter((w) => norm(w).split(/\s+/).some((t) => t.length >= 2 && !STOPWORDS.has(t) && new RegExp(`\\b${t}`).test(q))).length
    const score = Math.min(100, hits * 25 + (c.level === level ? 20 : 0) + c.rating * 4)
    return { course: c, score, reason: hits ? `Coincide con tu interés en ${c.area.toLowerCase()}.` : 'Opción popular del catálogo.' }
  }).sort((a, b) => b.score - a.score)
  const top = ranked.slice(0, 3)
  return {
    transcript: query,
    intent: { area: top[0].course.area, level, constraints: 'no detectadas (modo local)' },
    recommendations: top,
    reply: `Te recomiendo ${top.map((r) => r.course.title).join(', ')}. El primero es el que mejor encaja con lo que buscas.`,
    model: 'motor local (sin IA)',
  }
}

type RecommendInput = { audio?: Blob; text?: string; conversation?: { role: 'user' | 'model'; text: string }[] }

export async function recommend(input: RecommendInput): Promise<RecommendResult> {
  try {
    return await recommendWithGemini(input)
  } catch (e) {
    // Con texto podemos degradar al motor local; con audio no hay transcripción sin Gemini.
    const fallbackText = input.text ?? input.conversation?.filter((l) => l.role === 'user').map((l) => l.text).join(' ')
    if (fallbackText?.trim()) return localRecommend(fallbackText)
    throw e
  }
}

async function recommendWithGemini(input: RecommendInput): Promise<RecommendResult> {
  const parts: Part[] = []
  if (input.conversation) {
    const dialog = input.conversation.map((l) => `${l.role === 'user' ? 'Usuario' : 'Asistente'}: ${l.text.trim()}`).join('\n')
    parts.push({
      text: `Esta es la transcripción de una llamada de voz de 1 minuto:\n${dialog}\n\nGenera el reporte final: en "transcript" resume en una frase lo que pidió el usuario; extrae su intención; da el Top 3 definitivo de cursos del catálogo; y en "reply" escribe un cierre breve para leer en voz alta.`,
    })
  } else if (input.audio) {
    parts.push(await audioPart(input.audio))
    parts.push({
      text: 'Transcribe el audio anterior (es la petición del usuario), extrae su intención y recomienda el Top 3 de cursos del catálogo.',
    })
  } else {
    parts.push({
      text: `Petición del usuario: "${input.text}". Usa ese texto como transcripción, extrae su intención y recomienda el Top 3 de cursos del catálogo.`,
    })
  }

  const { text, model } = await generate({
    systemInstruction:
      RECRUITER_PROMPT +
      '\nPuntúa cada curso combinando relevancia con la intención (peso alto) y rating (peso bajo). Devuelve siempre 3 cursos distintos.',
    contents: [{ role: 'user', parts }],
    responseSchema: recommendSchema,
    temperature: 0.2,
  })

  const raw = JSON.parse(text) as {
    transcript: string
    intent: Intent
    recommendations: { id: string; score: number; reason: string }[]
    reply: string
  }

  const seen = new Set<string>()
  const recommendations = raw.recommendations
    .map((r) => ({ course: courseById(r.id), score: r.score, reason: r.reason }))
    .filter((r): r is Recommendation => !!r.course && !seen.has(r.course.id) && !!seen.add(r.course.id))
    .slice(0, 3)

  return { transcript: raw.transcript, intent: raw.intent, recommendations, reply: raw.reply, model }
}

// ---------- Modo "Chat" ----------

export interface ChatTurn {
  role: 'user' | 'model'
  text: string
  courseIds?: string[]
  model?: string
}

const chatSchema = {
  type: 'OBJECT',
  properties: {
    transcript: { type: 'STRING', description: 'Si el último mensaje del usuario fue audio, su transcripción; si no, cadena vacía' },
    reply: { type: 'STRING', description: 'Tu respuesta conversacional (máx. 80 palabras)' },
    courseIds: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description: 'ids de cursos que recomiendas en ESTE mensaje (0 a 3). Vacío si solo conversas o preguntas.',
    },
  },
  required: ['transcript', 'reply', 'courseIds'],
}

export async function chat(
  history: ChatTurn[],
  next: { text?: string; audio?: Blob },
): Promise<{ transcript: string; reply: string; courseIds: string[]; model: string }> {
  const contents: Content[] = history.map((t) => ({ role: t.role, parts: [{ text: t.text }] }))
  const parts: Part[] = next.audio ? [await audioPart(next.audio)] : [{ text: next.text ?? '' }]
  contents.push({ role: 'user', parts })

  const { text, model } = await generate({
    systemInstruction:
      RECRUITER_PROMPT +
      '\nEstás en modo conversación: si no tienes suficiente información (qué quiere aprender, su nivel, su tiempo), haz UNA pregunta breve antes de recomendar.',
    contents,
    responseSchema: chatSchema,
    temperature: 0.6,
  })
  const raw = JSON.parse(text) as { transcript: string; reply: string; courseIds: string[] }
  return { ...raw, courseIds: raw.courseIds.filter((id) => courseById(id)).slice(0, 3), model }
}
