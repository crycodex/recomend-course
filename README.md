# VozCursos — Recomendador de cursos con voz (MVP)

React + Vite + Tailwind (modo claro/oscuro). Proyecto Grupo 1 · Gestión ágil de proyectos (UEES).

- **`/`** — Landing del proyecto (visión, IA, catálogo, equipo, backlog).
- **`/demo`** — Demo del MVP (se abre en otra pestaña):
  - **Recomendar**: llamada *speech-to-speech* en tiempo real con **Gemini 3.8 Live** (WebSocket). Dura máx. 1 minuto; al terminar (o al pulsar *Finalizar*) se genera un **reporte** con intención y Top 3 usando **Gemini 3.8 Flash**. Si no hay micrófono, se puede escribir.
  - **Chat**: conversación por texto o por voz (el audio lo transcribe Gemini) con tarjetas de cursos.

## Configuración

```bash
cp .env.example .env   # y pon tu GEMINI_API_KEY
npm install
npm run dev
```

La API key **nunca llega al navegador**: `GEMINI_API_KEY` (sin prefijo `VITE_`) solo la usan las funciones de `api/`:

- `api/gemini/[model].ts` — reenvía `generateContent` (reporte y chat) añadiendo la key.
- `api/live-token.ts` — crea un **token efímero** de un solo uso para la Live API; el navegador se conecta directo a Google por WebSocket con ese token.

En desarrollo, `vite.config.ts` monta esas mismas funciones, así que `npm run dev` se comporta igual que Vercel.

## Deploy en Vercel

1. Sube el repo a GitHub e impórtalo en [vercel.com/new](https://vercel.com/new) (detecta Vite; `vercel.json` ya define build, salida y rutas).
2. En **Settings → Environment Variables** agrega `GEMINI_API_KEY` (obligatoria). Las `VITE_*` son opcionales: si no las pones se usan los valores por defecto.
3. Deploy. O desde la terminal: `npx vercel` (preview) y `npx vercel --prod`.

> El micrófono requiere HTTPS: funciona en el dominio `*.vercel.app` y en `localhost`.

| Variable | Uso |
|---|---|
| `GEMINI_API_KEY` | Secreto, solo servidor |
| `VITE_GEMINI_MODEL` | Reporte y chat (`gemini-3.8-flash`) |
| `VITE_GEMINI_FALLBACK_MODELS` | Respaldo si el principal está saturado (se lanzan escalonados) |
| `VITE_GEMINI_LIVE_MODEL` | Voz en tiempo real (`gemini-3.8-live`) |
| `VITE_GEMINI_LIVE_VOICE` | Voz prebuilt (`Sadachbia`) |

## Integrantes

| Integrante | Rol |
|---|---|
| Victoria Elizabeth Abarca Pino | Product Owner |
| Alexander | Scrum Master |
| Cristhian Recalde | Development Team · Backend |
| Alexis Dario Anasicha Ayala | Development Team · Frontend |
| Juan Flores | Development Team · QA |

## Licencia

[Apache 2.0](LICENSE)
