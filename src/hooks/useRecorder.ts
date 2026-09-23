import { useCallback, useRef, useState } from 'react'

// F001 — Captura de voz con MediaRecorder
const MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4', 'audio/webm']

export function useRecorder() {
  const [recording, setRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [level, setLevel] = useState(0)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const resolveRef = useRef<((b: Blob | null) => void) | null>(null)
  const rafRef = useRef<number>(0)

  const supported = typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && 'MediaRecorder' in window

  const start = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MIME_CANDIDATES.find((m) => MediaRecorder.isTypeSupported(m))
      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      chunksRef.current = []

      // Medidor de volumen para la animación
      const ctx = new AudioContext()
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      ctx.createMediaStreamSource(stream).connect(analyser)
      const data = new Uint8Array(analyser.frequencyBinCount)
      const tick = () => {
        analyser.getByteFrequencyData(data)
        setLevel(data.reduce((a, b) => a + b, 0) / data.length / 128)
        rafRef.current = requestAnimationFrame(tick)
      }
      tick()

      rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data)
      rec.onstop = () => {
        cancelAnimationFrame(rafRef.current)
        setLevel(0)
        ctx.close()
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' })
        resolveRef.current?.(blob.size > 0 ? blob : null)
        resolveRef.current = null
      }
      rec.start()
      recorderRef.current = rec
      setRecording(true)
    } catch (e) {
      setError(
        e instanceof DOMException && e.name === 'NotAllowedError'
          ? 'Permiso de micrófono denegado. Puedes escribir tu consulta.'
          : 'No se pudo acceder al micrófono. Puedes escribir tu consulta.',
      )
    }
  }, [])

  const stop = useCallback(
    () =>
      new Promise<Blob | null>((resolve) => {
        const rec = recorderRef.current
        if (!rec || rec.state === 'inactive') return resolve(null)
        resolveRef.current = resolve
        rec.stop()
        setRecording(false)
      }),
    [],
  )

  return { supported, recording, error, level, start, stop }
}
