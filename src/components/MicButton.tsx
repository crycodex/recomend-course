import { MicIcon, StopIcon } from './Icons'

export default function MicButton({
  recording,
  level,
  disabled,
  onClick,
  size = 'lg',
}: {
  recording: boolean
  level: number
  disabled?: boolean
  onClick: () => void
  size?: 'lg' | 'sm'
}) {
  const dims = size === 'lg' ? 'size-24' : 'size-11'
  const icon = size === 'lg' ? 'size-9' : 'size-5'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={recording ? 'Detener grabación' : 'Hablar'}
      aria-pressed={recording}
      className={`relative grid ${dims} shrink-0 place-items-center rounded-full text-white transition focus-visible:ring-4 focus-visible:ring-iris-300 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
        recording ? 'bg-rose-500 hover:bg-rose-600' : 'bg-iris-600 hover:bg-iris-700'
      }`}
    >
      {recording && (
        <>
          <span className="absolute inset-0 animate-pulse-ring rounded-full bg-rose-500" />
          <span
            className="absolute inset-0 rounded-full bg-rose-400/40 transition-transform duration-75"
            style={{ transform: `scale(${1 + Math.min(level, 1.2) * 0.35})` }}
          />
        </>
      )}
      <span className="relative">{recording ? <StopIcon className={icon} /> : <MicIcon className={icon} />}</span>
    </button>
  )
}
