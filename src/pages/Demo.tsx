import { useEffect, useRef, useState, type FormEvent } from 'react'
import Logo from '../components/Logo'
import ThemeToggle from '../components/ThemeToggle'
import CourseCard from '../components/CourseCard'
import MicButton from '../components/MicButton'
import { SendIcon, SpeakerIcon, StopIcon } from '../components/Icons'
import { useRecorder } from '../hooks/useRecorder'
import { useSpeech } from '../hooks/useSpeech'
import { useHistory } from '../hooks/useHistory'
import { chat, recommend, type ChatTurn, type RecommendResult } from '../lib/recommend'
import { courseById } from '../data/courses'
import { PRIMARY_MODEL } from '../lib/gemini'
import { LIVE_MODEL, LiveSession, type LiveLine } from '../lib/live'

type Mode = 'recomendar' | 'chat'

export default function Demo() {
  const [mode, setMode] = useState<Mode>('recomendar')
  const [autoSpeak, setAutoSpeak] = useState(true)
  const speech = useSpeech()

  useEffect(() => {
    document.title = 'Demo · VozCursos'
    speech.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-stone-200 dark:border-white/5">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Logo />
          <div role="tablist" className="order-3 flex w-full rounded-full bg-stone-200/70 p-1 text-sm font-semibold sm:order-none sm:w-auto dark:bg-white/5">
            {(['recomendar', 'chat'] as Mode[]).map((m) => (
              <button
                key={m}
                role="tab"
                aria-selected={mode === m}
                onClick={() => setMode(m)}
                className={`flex-1 rounded-full px-5 py-2 capitalize transition sm:flex-none ${
                  mode === m ? 'bg-white text-stone-900 shadow-sm dark:bg-iris-600 dark:text-white' : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white'
                }`}
              >
                {m === 'recomendar' ? 'Recomendar' : 'Chat'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setAutoSpeak((v) => !v); speech.stop() }}
              aria-pressed={autoSpeak}
              title="Leer respuestas en voz alta"
              className={`grid size-10 place-items-center rounded-full border transition ${
                autoSpeak ? 'border-iris-300 bg-iris-50 text-iris-700 dark:border-iris-400/50 dark:bg-iris-400/10 dark:text-iris-200' : 'border-stone-200 text-stone-400 dark:border-white/10'
              }`}
            >
              <SpeakerIcon />
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8 sm:px-6">
        {mode === 'recomendar' ? <RecommendMode speech={speech} autoSpeak={autoSpeak} /> : <ChatMode speech={speech} autoSpeak={autoSpeak} />}
      </main>

      <footer className="py-4 text-center text-xs text-stone-400">
        MVP · Voz en vivo: <span className="font-mono">{LIVE_MODEL}</span> · Reporte y chat: <span className="font-mono">{PRIMARY_MODEL}</span>
      </footer>
    </div>
  )
}

type Speech = ReturnType<typeof useSpeech>

// ---------------- Modo Recomendar: voz a voz en tiempo real ----------------

const SESSION_SECONDS = 60
type Phase = 'idle' | 'connecting' | 'live' | 'reporting' | 'done'

function RecommendMode({ speech, autoSpeak }: { speech: Speech; autoSpeak: boolean }) {
  const history = useHistory()
  const sessionRef = useRef<LiveSession | null>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [secondsLeft, setSecondsLeft] = useState(SESSION_SECONDS)
  const [lines, setLines] = useState<LiveLine[]>([])
  const [liveCourses, setLiveCourses] = useState<string[]>([])
  const [mic, setMic] = useState({ level: 0, modelSpeaking: false })
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<RecommendResult | null>(null)
  const transcriptEnd = useRef<HTMLDivElement>(null)

  useEffect(() => () => {
    sessionRef.current?.stop()
  }, [])
  useEffect(() => {
    transcriptEnd.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [lines])

  // Cuenta regresiva: al llegar a 0 se cierra la llamada y se genera el reporte
  useEffect(() => {
    if (phase !== 'live') return
    if (secondsLeft <= 0) {
      finish()
      return
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, secondsLeft])

  async function startCall() {
    speech.stop()
    setError(null)
    setReport(null)
    setLines([])
    setLiveCourses([])
    setSecondsLeft(SESSION_SECONDS)
    const session = new LiveSession({
      onStatus: (s) => {
        if (s === 'connecting') setPhase('connecting')
        if (s === 'live') setPhase('live')
      },
      onTranscript: setLines,
      onShowCourses: (ids) => setLiveCourses(ids.filter((id) => courseById(id)).slice(0, 3)),
      onLevel: (level, modelSpeaking) => setMic({ level, modelSpeaking }),
      onError: (msg) => setError(msg),
    })
    sessionRef.current = session
    try {
      await session.start()
    } catch (e) {
      session.stop()
      sessionRef.current = null
      setPhase('idle')
      setError(
        e instanceof DOMException && e.name === 'NotAllowedError'
          ? 'Permiso de micrófono denegado. Puedes escribir tu consulta abajo.'
          : `No se pudo iniciar la llamada de voz${e instanceof Error ? ` (${e.message})` : ''}. Puedes escribir tu consulta abajo.`,
      )
    }
  }

  async function finish() {
    const session = sessionRef.current
    if (!session) return
    sessionRef.current = null
    const conversation = session.transcript
    session.stop()
    setMic({ level: 0, modelSpeaking: false })
    if (!conversation.some((l) => l.role === 'user' && l.text.trim())) {
      setPhase('idle')
      setError('No escuché ninguna petición. Vuelve a intentarlo o escribe tu consulta.')
      return
    }
    await buildReport({ conversation })
  }

  async function buildReport(input: Parameters<typeof recommend>[0]) {
    setPhase('reporting')
    setError(null)
    try {
      const r = await recommend(input)
      setReport(r)
      history.add({ query: r.transcript, courseIds: r.recommendations.map((x) => x.course.id), at: Date.now() })
      if (autoSpeak && !input.conversation) speech.speak(r.reply)
      setPhase('done')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo generar el reporte.')
      setPhase('idle')
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    if (text.trim()) {
      setLines([])
      setLiveCourses([])
      buildReport({ text: text.trim() })
    }
  }

  const inCall = phase === 'connecting' || phase === 'live'
  const progress = secondsLeft / SESSION_SECONDS

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_260px]">
      <div>
        <section className="flex flex-col items-center rounded-3xl border border-stone-200 bg-white px-6 py-10 text-center dark:border-white/10 dark:bg-white/[0.03]">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600 dark:bg-white/5 dark:text-stone-300">
            <span className={`size-1.5 rounded-full ${phase === 'live' ? 'animate-pulse bg-rose-500' : 'bg-stone-400'}`} />
            Speech-to-speech en tiempo real · <span className="font-mono">{LIVE_MODEL}</span>
          </p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            {phase === 'live' ? 'Habla con Vera' : phase === 'connecting' ? 'Conectando…' : '¿Qué quieres aprender?'}
          </h1>
          <p className="mt-2 max-w-md text-stone-500 dark:text-stone-400">
            {phase === 'live'
              ? mic.modelSpeaking
                ? 'Vera está hablando… puedes interrumpirla.'
                : 'Te escucho. Cuéntame qué quieres aprender.'
              : phase === 'reporting'
                ? 'Llamada finalizada. Generando tu reporte…'
                : 'Inicia una llamada de voz de 1 minuto. Al terminar recibirás un reporte con tus 3 cursos.'}
          </p>

          {/* Botón de llamada con anillo de tiempo */}
          <div className="relative my-8 grid size-40 place-items-center">
            <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden>
              <circle cx="50" cy="50" r="46" className="fill-none stroke-stone-200 dark:stroke-white/10" strokeWidth="4" />
              {inCall && (
                <circle
                  cx="50" cy="50" r="46" pathLength={1}
                  className="fill-none stroke-iris-500 transition-[stroke-dashoffset] duration-1000 ease-linear"
                  strokeWidth="4" strokeLinecap="round" strokeDasharray="1" strokeDashoffset={1 - progress}
                />
              )}
            </svg>
            <MicButton
              recording={phase === 'live'}
              level={mic.modelSpeaking ? 0.4 : mic.level}
              disabled={phase === 'connecting' || phase === 'reporting'}
              onClick={inCall ? finish : startCall}
            />
          </div>
          <div className="flex items-center gap-3 text-sm">
            {inCall ? (
              <>
                <span className="font-mono text-2xl font-bold tabular-nums">0:{String(secondsLeft).padStart(2, '0')}</span>
                <button onClick={finish} className="rounded-full bg-rose-500 px-4 py-2 font-semibold text-white hover:bg-rose-600">
                  Finalizar y ver reporte
                </button>
              </>
            ) : phase === 'reporting' ? (
              <span className="animate-pulse text-iris-600 dark:text-iris-300">Analizando la conversación…</span>
            ) : (
              <span className="text-stone-500 dark:text-stone-400">
                {phase === 'done' ? 'Pulsa el micrófono para una nueva llamada' : 'Pulsa el micrófono para empezar'}
              </span>
            )}
          </div>

          {/* Transcripción en vivo */}
          {lines.length > 0 && (
            <div className="mt-8 max-h-64 w-full max-w-xl space-y-2 overflow-y-auto text-left text-sm">
              {lines.map((l, i) => (
                <div key={i} className={l.role === 'user' ? 'flex justify-end' : 'flex'}>
                  <p className={`max-w-[85%] rounded-2xl px-3 py-2 ${l.role === 'user' ? 'rounded-br-md bg-iris-600 text-white' : 'rounded-bl-md bg-stone-100 dark:bg-white/5'}`}>
                    {l.text}
                  </p>
                </div>
              ))}
              <div ref={transcriptEnd} />
            </div>
          )}

          {/* Fallback a texto (F009) */}
          {!inCall && phase !== 'reporting' && (
            <form onSubmit={submit} className="mt-8 flex w-full max-w-lg items-center gap-2 rounded-full border border-stone-200 bg-stone-50 p-1.5 pl-5 focus-within:border-iris-400 dark:border-white/10 dark:bg-white/5">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="¿Sin micrófono? Escríbelo aquí"
                aria-label="Escribe tu consulta"
                className="min-w-0 flex-1 bg-transparent py-2 outline-none placeholder:text-stone-400"
              />
              <button disabled={!text.trim()} className="grid size-10 place-items-center rounded-full bg-stone-900 text-white disabled:opacity-30 dark:bg-white dark:text-stone-900" aria-label="Enviar">
                <SendIcon />
              </button>
            </form>
          )}
        </section>

        {error && (
          <div role="alert" className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-400/30 dark:bg-rose-400/10 dark:text-rose-200">
            {error}
          </div>
        )}

        {/* Cursos que Vera muestra durante la llamada */}
        {inCall && liveCourses.length > 0 && (
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {liveCourses.map((id, i) => <CourseCard key={id} course={courseById(id)!} rank={i + 1} compact />)}
          </div>
        )}

        {phase === 'reporting' && (
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[0, 1, 2].map((i) => <div key={i} className="h-56 animate-pulse rounded-2xl bg-stone-200/70 dark:bg-white/5" />)}
          </div>
        )}

        {report && phase === 'done' && (
          <section className="mt-6 space-y-5" aria-live="polite">
            <h2 className="font-display text-2xl font-extrabold tracking-tight">Reporte de la llamada</h2>
            <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
              <p className="text-xs font-semibold tracking-wide text-stone-400 uppercase">Lo que pediste</p>
              <p className="mt-1 text-lg">“{report.transcript}”</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <Chip label="Área" value={report.intent.area} />
                <Chip label="Nivel" value={report.intent.level} />
                <Chip label="Restricciones" value={report.intent.constraints} />
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl bg-iris-600 p-4 text-white dark:bg-iris-700">
              <button
                onClick={() => (speech.speaking ? speech.stop() : speech.speak(report.reply))}
                className="grid size-10 shrink-0 place-items-center rounded-full bg-white/15 hover:bg-white/25"
                aria-label={speech.speaking ? 'Detener voz' : 'Escuchar resumen'}
              >
                {speech.speaking ? <StopIcon className="size-4" /> : <SpeakerIcon />}
              </button>
              <p className="leading-relaxed">{report.reply}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {report.recommendations.map((r, i) => (
                <CourseCard key={r.course.id} course={r.course} rank={i + 1} score={r.score} reason={r.reason} compact />
              ))}
            </div>
            <p className="text-right text-xs text-stone-400">Reporte generado por <span className="font-mono">{report.model}</span></p>
          </section>
        )}
      </div>

      {/* F010 — Historial */}
      <aside className="h-fit rounded-2xl border border-stone-200 p-4 dark:border-white/10">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold">Últimas búsquedas</h2>
          {history.items.length > 0 && (
            <button onClick={history.clear} className="text-xs text-stone-400 hover:text-rose-500">Borrar</button>
          )}
        </div>
        {history.items.length === 0 ? (
          <p className="mt-3 text-sm text-stone-400">Aquí aparecerán tus 3 últimas consultas.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {history.items.map((h) => (
              <li key={h.at} className="rounded-xl bg-stone-100 p-3 text-sm dark:bg-white/5">
                <span className="line-clamp-2">{h.query}</span>
                <span className="mt-1 block text-lg" aria-hidden>{h.courseIds.map((id) => courseById(id)?.emoji).join(' ')}</span>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  )
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full bg-stone-100 px-2.5 py-1 dark:bg-white/10">
      <span className="text-stone-500 dark:text-stone-400">{label}:</span> <span className="font-medium">{value}</span>
    </span>
  )
}

// ---------------- Modo Chat ----------------

const GREETING: ChatTurn = {
  role: 'model',
  text: '¡Hola! Soy Vera, tu reclutadora de cursos. Cuéntame qué te gustaría aprender, por texto o con el micrófono.',
}

function ChatMode({ speech, autoSpeak }: { speech: Speech; autoSpeak: boolean }) {
  const rec = useRecorder()
  const [turns, setTurns] = useState<ChatTurn[]>([GREETING])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [turns, loading])

  async function send(input: { text?: string; audio?: Blob }) {
    setError(null)
    setLoading(true)
    speech.stop()
    const history = turns
    const placeholderIndex = history.length
    setTurns([...history, { role: 'user', text: input.text ?? '🎙️ Transcribiendo audio…' }])
    try {
      const r = await chat(history, input)
      setTurns((prev) => {
        const next = [...prev]
        if (input.audio) next[placeholderIndex] = { role: 'user', text: r.transcript || '(audio sin texto reconocible)' }
        return [...next, { role: 'model', text: r.reply, courseIds: r.courseIds, model: r.model }]
      })
      if (autoSpeak) speech.speak(r.reply)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Algo salió mal.')
      setTurns(history)
    } finally {
      setLoading(false)
    }
  }

  async function toggleMic() {
    if (rec.recording) {
      const blob = await rec.stop()
      if (blob) send({ audio: blob })
    } else {
      speech.stop()
      rec.start()
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    const t = text.trim()
    if (!t || loading) return
    setText('')
    send({ text: t })
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
      <div className="flex-1 space-y-4 pb-4">
        {turns.map((t, i) => (
          <div key={i} className={t.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            <div className={`max-w-[88%] ${t.role === 'user' ? '' : 'w-full'}`}>
              <div className={`rounded-2xl px-4 py-3 ${
                t.role === 'user' ? 'rounded-br-md bg-iris-600 text-white' : 'rounded-bl-md border border-stone-200 bg-white dark:border-white/10 dark:bg-white/[0.04]'
              }`}>
                <p className="leading-relaxed whitespace-pre-wrap">{t.text}</p>
                {t.role === 'model' && i > 0 && (
                  <button onClick={() => speech.speak(t.text)} className="mt-2 flex items-center gap-1 text-xs text-stone-400 hover:text-iris-600 dark:hover:text-iris-300">
                    <SpeakerIcon className="size-3.5" /> Escuchar
                  </button>
                )}
              </div>
              {t.courseIds && t.courseIds.length > 0 && (
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  {t.courseIds.map((id, k) => {
                    const c = courseById(id)
                    return c ? <CourseCard key={id} course={c} rank={k + 1} compact /> : null
                  })}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-1 rounded-2xl border border-stone-200 bg-white px-4 py-4 w-fit dark:border-white/10 dark:bg-white/[0.04]" aria-label="Vera está escribiendo">
            {[0, 1, 2].map((i) => <span key={i} className="size-2 animate-bounce rounded-full bg-iris-400" style={{ animationDelay: `${i * 120}ms` }} />)}
          </div>
        )}
        {error && (
          <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800 dark:bg-rose-400/10 dark:text-rose-200">{error}</p>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={submit} className="sticky bottom-4 flex items-center gap-2 rounded-full border border-stone-200 bg-white p-1.5 pl-5 shadow-xl shadow-stone-900/5 focus-within:border-iris-400 dark:border-white/10 dark:bg-[#18151f]">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={rec.recording ? 'Grabando… pulsa ■ para enviar' : 'Escribe un mensaje'}
          aria-label="Mensaje"
          disabled={rec.recording}
          className="min-w-0 flex-1 bg-transparent py-2 outline-none placeholder:text-stone-400"
        />
        {rec.supported && <MicButton size="sm" recording={rec.recording} level={rec.level} disabled={loading} onClick={toggleMic} />}
        <button disabled={loading || !text.trim()} className="grid size-11 place-items-center rounded-full bg-stone-900 text-white disabled:opacity-30 dark:bg-white dark:text-stone-900" aria-label="Enviar">
          <SendIcon />
        </button>
      </form>
      {rec.error && <p className="mt-2 text-center text-sm text-amber-700 dark:text-amber-300">{rec.error}</p>}
    </div>
  )
}
