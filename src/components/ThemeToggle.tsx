import { useTheme } from '../hooks/useTheme'
import { MoonIcon, SunIcon } from './Icons'

export default function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className="grid size-10 place-items-center rounded-full border border-stone-200 bg-white text-stone-700 transition hover:border-iris-300 hover:text-iris-600 dark:border-white/10 dark:bg-white/5 dark:text-stone-200 dark:hover:border-iris-400 dark:hover:text-iris-300"
    >
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}
