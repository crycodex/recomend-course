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

La API key **nunca llega al navegador**: `GEMINI_API_KEY` (sin prefijo `VITE_`) solo la lee el proxy de Vite
(`vite.config.ts`), que la inyecta en `/api/gemini` (REST) y `/api/live` (WebSocket).
Para producción necesitas un backend equivalente a ese proxy (o tokens efímeros de la Live API).

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
