import type { Course } from '../data/courses'
import { StarIcon } from './Icons'

const levelColor: Record<Course['level'], string> = {
  principiante: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300',
  intermedio: 'bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300',
  avanzado: 'bg-rose-100 text-rose-800 dark:bg-rose-400/15 dark:text-rose-300',
}

// F007 — Tarjeta de curso recomendado
export default function CourseCard({
  course,
  rank,
  score,
  reason,
  compact,
}: {
  course: Course
  rank?: number
  score?: number
  reason?: string
  compact?: boolean
}) {
  return (
    <article className="group relative flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-iris-300 hover:shadow-lg hover:shadow-iris-500/5 dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-iris-400/60">
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-iris-50 text-2xl dark:bg-iris-400/10" aria-hidden>
          {course.emoji}
        </span>
        {rank !== undefined && (
          <span className="rounded-full bg-stone-900 px-2.5 py-1 font-display text-xs font-bold text-white dark:bg-lime-accent dark:text-stone-900">
            #{rank}
          </span>
        )}
      </div>
      <div>
        <h3 className="font-display text-lg leading-tight font-bold">{course.title}</h3>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          {course.instructor} · {course.area}
        </p>
      </div>
      {!compact && <p className="text-sm text-stone-600 dark:text-stone-300">{course.description}</p>}
      {reason && (
        <p className="rounded-lg bg-iris-50 px-3 py-2 text-sm text-iris-900 dark:bg-iris-400/10 dark:text-iris-100">
          <span className="font-semibold">Por qué: </span>
          {reason}
        </p>
      )}
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-1 text-xs">
        <span className={`rounded-full px-2 py-0.5 font-medium capitalize ${levelColor[course.level]}`}>{course.level}</span>
        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-stone-600 dark:bg-white/10 dark:text-stone-300">
          {course.durationHours} h
        </span>
        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-300">
          <StarIcon className="size-3.5" /> {course.rating.toFixed(1)}
        </span>
        {score !== undefined && (
          <span className="ml-auto font-mono text-stone-500 dark:text-stone-400">{Math.round(score)}% match</span>
        )}
      </div>
      {score !== undefined && (
        <div className="h-1 overflow-hidden rounded-full bg-stone-100 dark:bg-white/10">
          <div className="h-full rounded-full bg-iris-500 transition-all duration-700" style={{ width: `${Math.min(100, score)}%` }} />
        </div>
      )}
    </article>
  )
}
