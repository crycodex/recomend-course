type P = { className?: string }
const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, viewBox: '0 0 24 24' }

export const MicIcon = ({ className = 'size-5' }: P) => (
  <svg {...base} className={className}><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10a7 7 0 0 0 14 0M12 19v3" /></svg>
)
export const StopIcon = ({ className = 'size-5' }: P) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2.5" /></svg>
)
export const SendIcon = ({ className = 'size-5' }: P) => (
  <svg {...base} className={className}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
)
export const SunIcon = ({ className = 'size-5' }: P) => (
  <svg {...base} className={className}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
)
export const MoonIcon = ({ className = 'size-5' }: P) => (
  <svg {...base} className={className}><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" /></svg>
)
export const SpeakerIcon = ({ className = 'size-5' }: P) => (
  <svg {...base} className={className}><path d="M11 5 6 9H3v6h3l5 4V5ZM15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /></svg>
)
export const ExternalIcon = ({ className = 'size-4' }: P) => (
  <svg {...base} className={className}><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>
)
export const StarIcon = ({ className = 'size-4' }: P) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="m12 2.5 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9L12 2.5Z" /></svg>
)
