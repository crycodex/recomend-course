import Logo from '../components/Logo'
import ThemeToggle from '../components/ThemeToggle'
import CourseCard from '../components/CourseCard'
import { ExternalIcon, MicIcon, SpeakerIcon } from '../components/Icons'
import { COURSES } from '../data/courses'

const PIPELINE = [
  { n: '01', title: 'Voz en tiempo real', tech: 'Gemini 3.8 Live · WebSocket', body: 'Hablas y la asistente te escucha en streaming: sin grabar ni transcribir antes. Puedes interrumpirla.' },
  { n: '02', title: 'Intención', tech: 'LLM nativo de audio', body: 'Entiende área de interés, nivel y restricciones mientras conversas, y pregunta si falta algo.' },
  { n: '03', title: 'Top 3 en vivo', tech: 'Function calling', body: 'Llama a la función mostrar_cursos y las 3 tarjetas aparecen en pantalla durante la llamada.' },
  { n: '04', title: 'Voz de respuesta', tech: 'Audio nativo de Gemini', body: 'La respuesta llega como audio generado por el propio modelo, con latencia de ~1 s.' },
  { n: '05', title: 'Reporte final', tech: 'Gemini 3.8 Flash · JSON', body: 'Al cumplirse 1 minuto la llamada termina y se genera un reporte con intención y Top 3 puntuado.' },
]

const TEAM = [
  { name: 'Victoria Elizabeth Abarca Pino', role: 'Product Owner', scope: 'Define la visión del producto, prioriza el Product Backlog y valida que las recomendaciones cumplan el objetivo de negocio.' },
  { name: 'Alexander', role: 'Scrum Master', scope: 'Facilita las ceremonias Scrum (daily, planning, review, retrospectiva), elimina impedimentos y vela por el proceso ágil.' },
  { name: 'Cristhian Recalde', role: 'Development Team · Backend', scope: 'Implementa la base de 5 cursos, el procesamiento de intención con LLM y el motor de recomendación Top 3.' },
  { name: 'Alexis Dario Anasicha Ayala', role: 'Development Team · Frontend', scope: 'Implementa la interfaz web: captura de voz, visualización de resultados y reproducción de audio.' },
  { name: 'Juan Flores', role: 'Development Team · QA', scope: 'Prueba el flujo completo voz a voz, valida el manejo de errores y documenta los casos de prueba.' },
]

const BACKLOG: [string, string, string, number, number][] = [
  ['F001', 'Captura de voz del usuario', 'Alto', 3, 1],
  ['F002', 'Procesamiento de intención (LLM)', 'Alto', 3, 1],
  ['F003', 'Catálogo local de 5 cursos', 'Alto', 2, 1],
  ['F004', 'Motor de recomendación Top 3', 'Alto', 3, 1],
  ['F005', 'Respuesta conversacional', 'Alto', 2, 2],
  ['F006', 'Síntesis de voz (TTS)', 'Alto', 2, 2],
  ['F007', 'Interfaz: 3 tarjetas de curso', 'Alto', 3, 2],
  ['F008', 'Integración end-to-end voz→voz', 'Alto', 5, 3],
  ['F009', 'Fallback a texto si falla el micrófono', 'Medio', 2, 3],
  ['F010', 'Historial de las últimas 3 búsquedas', 'Medio', 2, 3],
]

function DemoLink({ className = '' }: { className?: string }) {
  return (
    <a
      href="/demo"
      target="_blank"
      rel="noopener"
      className={`inline-flex items-center gap-2 rounded-full bg-iris-600 px-5 py-3 font-semibold text-white shadow-lg shadow-iris-600/25 transition hover:bg-iris-700 ${className}`}
    >
      Probar la demo <ExternalIcon />
    </a>
  )
}

export default function Landing() {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-stone-200/70 bg-stone-50/80 backdrop-blur dark:border-white/5 dark:bg-[#0e0c16]/80">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Logo />
          <div className="hidden items-center gap-6 text-sm text-stone-600 md:flex dark:text-stone-300">
            <a href="#como-funciona" className="hover:text-iris-600 dark:hover:text-iris-300">Cómo funciona</a>
            <a href="#catalogo" className="hover:text-iris-600 dark:hover:text-iris-300">Catálogo</a>
            <a href="#equipo" className="hover:text-iris-600 dark:hover:text-iris-300">Integrantes</a>
            <a href="#backlog" className="hover:text-iris-600 dark:hover:text-iris-300">Backlog</a>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <a href="/demo" target="_blank" rel="noopener" className="hidden rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-white sm:inline-flex dark:bg-white dark:text-stone-900">
              Demo MVP
            </a>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-iris-400/20 blur-3xl dark:bg-iris-600/20" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pt-16 pb-20 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:pt-24">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-iris-200 bg-white px-3 py-1 text-xs font-medium text-iris-700 dark:border-iris-400/30 dark:bg-iris-400/10 dark:text-iris-200">
              <span className="size-1.5 rounded-full bg-lime-500 dark:bg-lime-accent" /> MVP · Speech-to-Speech en tiempo real · Gemini 3.8
            </p>
            <h1 className="font-display text-5xl leading-[1.02] font-extrabold tracking-tight text-balance sm:text-6xl lg:text-7xl">
              Dilo en voz alta.<br />
              <span className="text-iris-600 dark:text-iris-300">Encuentra tu curso.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-stone-600 dark:text-stone-300">
              Un asistente de voz que escucha lo que quieres aprender, entiende tu nivel y objetivo, y te responde —en pantalla y hablando— con los 3 cursos que mejor encajan.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <DemoLink />
              <a href="#como-funciona" className="font-semibold text-stone-700 underline-offset-4 hover:underline dark:text-stone-200">
                Ver cómo funciona
              </a>
            </div>
          </div>

          {/* Mock de conversación */}
          <div className="relative rounded-3xl border border-stone-200 bg-white p-5 shadow-2xl shadow-iris-900/10 dark:border-white/10 dark:bg-white/[0.04]">
            <div className="flex items-center gap-3 rounded-2xl bg-stone-100 p-3 dark:bg-white/5">
              <span className="grid size-10 place-items-center rounded-full bg-rose-500 text-white"><MicIcon /></span>
              <div className="flex h-8 flex-1 items-center gap-[3px]" aria-hidden>
                {Array.from({ length: 32 }, (_, i) => (
                  <span key={i} className="w-1 rounded-full bg-rose-400/80" style={{ height: `${20 + Math.abs(Math.sin(i * 1.7)) * 80}%` }} />
                ))}
              </div>
            </div>
            <p className="mt-4 ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-iris-600 px-4 py-3 text-sm text-white">
              “Quiero un curso de programación para principiantes, tengo poco tiempo.”
            </p>
            <div className="mt-3 max-w-[90%] rounded-2xl rounded-bl-md bg-stone-100 px-4 py-3 text-sm dark:bg-white/5">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-iris-600 dark:text-iris-300"><SpeakerIcon className="size-4" /> Vera responde</p>
              Te recomiendo <b>Python desde cero</b>: 20 horas, pensado para empezar. Después, <b>Diseño UX/UI</b> o <b>React</b> si quieres ir a la web.
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
              {['🐍 Python', '🎨 UX/UI', '⚛️ React'].map((c, i) => (
                <div key={c} className="rounded-xl border border-stone-200 px-2 py-2 dark:border-white/10">
                  <span className="block font-display font-bold text-iris-600 dark:text-lime-accent">#{i + 1}</span>{c}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Problema / beneficio */}
      <section className="mx-auto grid max-w-6xl gap-6 px-4 pb-20 sm:px-6 md:grid-cols-3">
        {[
          ['Ámbito', 'Plataformas de educación online (e-learning).'],
          ['Problema', 'Los usuarios pierden tiempo buscando en catálogos extensos sin saber qué curso se ajusta a su nivel y objetivo.'],
          ['Beneficio', 'Menos fricción, más inscripciones y accesibilidad para quienes prefieren hablar en lugar de escribir.'],
        ].map(([t, b]) => (
          <div key={t} className="rounded-2xl border border-stone-200 bg-white p-6 dark:border-white/10 dark:bg-white/[0.03]">
            <h3 className="font-display text-sm font-bold tracking-widest text-iris-600 uppercase dark:text-iris-300">{t}</h3>
            <p className="mt-3 text-stone-700 dark:text-stone-300">{b}</p>
          </div>
        ))}
      </section>

      {/* Pipeline IA */}
      <section id="como-funciona" className="scroll-mt-20 border-y border-stone-200 bg-white py-20 dark:border-white/5 dark:bg-white/[0.02]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="font-display text-4xl font-extrabold tracking-tight">Dónde entra la IA</h2>
          <p className="mt-3 max-w-2xl text-stone-600 dark:text-stone-300">
            Speech-to-speech real: Gemini 3.8 Live escucha y responde con voz en tiempo real durante 1 minuto; luego Gemini 3.8 Flash genera el reporte.
          </p>
          <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {PIPELINE.map((s) => (
              <li key={s.n} className="relative rounded-2xl border border-stone-200 p-5 dark:border-white/10">
                <span className="font-mono text-xs text-stone-400">{s.n}</span>
                <h3 className="mt-2 font-display text-xl font-bold">{s.title}</h3>
                <p className="mt-1 text-xs font-semibold text-iris-600 dark:text-iris-300">{s.tech}</p>
                <p className="mt-3 text-sm text-stone-600 dark:text-stone-400">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Catálogo */}
      <section id="catalogo" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-4xl font-extrabold tracking-tight">El catálogo del MVP</h2>
            <p className="mt-3 text-stone-600 dark:text-stone-300">5 cursos locales. El asistente solo recomienda desde aquí.</p>
          </div>
          <DemoLink />
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COURSES.map((c) => <CourseCard key={c.id} course={c} />)}
        </div>
      </section>

      {/* Equipo */}
      <section id="equipo" className="scroll-mt-20 border-y border-stone-200 bg-white py-20 dark:border-white/5 dark:bg-white/[0.02]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="font-display text-4xl font-extrabold tracking-tight">Integrantes del equipo</h2>
          <p className="mt-3 text-stone-600 dark:text-stone-300">Grupo 1 · Roles Scrum y alcance de cada integrante.</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {TEAM.map((m) => (
              <div key={m.name} className="rounded-2xl border border-stone-200 p-5 dark:border-white/10">
                <div className="grid size-11 place-items-center rounded-full bg-iris-100 font-display font-bold text-iris-700 dark:bg-iris-400/15 dark:text-iris-200">
                  {m.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                </div>
                <h3 className="mt-4 font-semibold">{m.name}</h3>
                <p className="text-sm font-medium text-iris-600 dark:text-iris-300">{m.role}</p>
                <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">{m.scope}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Backlog */}
      <section id="backlog" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
        <h2 className="font-display text-4xl font-extrabold tracking-tight">Product Backlog</h2>
        <p className="mt-3 text-stone-600 dark:text-stone-300">10 features · 27 puntos de historia · Sprint 1: F001–F004 (11 pts) · Sprint 2: F005–F010 (16 pts)</p>
        <div className="mt-8 overflow-x-auto rounded-2xl border border-stone-200 dark:border-white/10">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-stone-100 text-xs tracking-wide text-stone-500 uppercase dark:bg-white/5 dark:text-stone-400">
              <tr>
                <th className="px-4 py-3">ID</th><th className="px-4 py-3">Feature</th><th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3 text-right">Puntos</th><th className="px-4 py-3 text-right">Prioridad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 dark:divide-white/5">
              {BACKLOG.map(([id, f, v, pts, p]) => (
                <tr key={id} className="bg-white dark:bg-transparent">
                  <td className="px-4 py-3 font-mono text-xs text-stone-500">{id}</td>
                  <td className="px-4 py-3 font-medium">{f}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${v === 'Alto' ? 'bg-iris-100 text-iris-800 dark:bg-iris-400/15 dark:text-iris-200' : 'bg-stone-100 text-stone-700 dark:bg-white/10 dark:text-stone-300'}`}>{v}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{pts}</td>
                  <td className="px-4 py-3 text-right font-mono">{p}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-iris-700 px-8 py-14 text-white sm:px-14 dark:bg-iris-800">
          <div className="pointer-events-none absolute -right-20 -bottom-24 size-80 rounded-full bg-lime-accent/30 blur-3xl" />
          <h2 className="relative max-w-xl font-display text-4xl font-extrabold tracking-tight">Pruébalo: pulsa el micrófono y pide un curso.</h2>
          <p className="relative mt-3 max-w-lg text-iris-100">Modo Recomendar: llamada de voz en vivo de 1 minuto con reporte final. Modo Chat: conversa por texto o voz.</p>
          <a href="/demo" target="_blank" rel="noopener" className="relative mt-8 inline-flex items-center gap-2 rounded-full bg-lime-accent px-6 py-3 font-semibold text-stone-900 transition hover:brightness-95">
            Abrir demo en otra pestaña <ExternalIcon />
          </a>
        </div>
      </section>

      <footer className="border-t border-stone-200 px-4 py-8 text-center text-sm text-stone-500 dark:border-white/5 dark:text-stone-400">
        <p>Universidad de Especialidades Espíritu Santo · Gestión ágil de proyectos · Grupo 1 · 2026</p>
        <p className="mt-2">{TEAM.map((m) => m.name).join(' · ')}</p>
        <p className="mt-2 text-xs">Profesor: Ing. Miguel Antonio Viejó Maestre · Licencia Apache 2.0</p>
      </footer>
    </div>
  )
}
