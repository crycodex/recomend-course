import { useCallback, useEffect, useState } from 'react'

// F006 — Texto a voz con Web Speech Synthesis
export function useSpeech() {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window
  const [speaking, setSpeaking] = useState(false)

  useEffect(() => () => {
    if (supported) speechSynthesis.cancel()
  }, [supported])

  const speak = useCallback(
    (text: string) => {
      if (!supported || !text) return
      speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text.replace(/[*_#`]/g, ''))
      const voices = speechSynthesis.getVoices()
      u.voice =
        voices.find((v) => v.lang.startsWith('es') && /google|natural|premium|enhanced/i.test(v.name)) ??
        voices.find((v) => v.lang.startsWith('es')) ??
        null
      u.lang = u.voice?.lang ?? 'es-ES'
      u.rate = 1.02
      u.onstart = () => setSpeaking(true)
      u.onend = u.onerror = () => setSpeaking(false)
      speechSynthesis.speak(u)
    },
    [supported],
  )

  const stop = useCallback(() => {
    if (supported) speechSynthesis.cancel()
    setSpeaking(false)
  }, [supported])

  return { supported, speaking, speak, stop }
}
