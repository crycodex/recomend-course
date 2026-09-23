import { Link } from 'react-router-dom'

export default function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 font-display text-lg font-extrabold tracking-tight">
      <img src="/favicon.svg" alt="" className="size-8" />
      <span>
        Voz<span className="text-iris-600 dark:text-iris-300">Cursos</span>
      </span>
    </Link>
  )
}
