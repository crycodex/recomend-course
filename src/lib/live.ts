// Sesión voz-a-voz en tiempo real con la Live API de Gemini (WebSocket).
// El navegador se conecta a /api/live y el proxy de Vite añade la API key.
import { COURSES } from '../data/courses'
import { RECRUITER_PROMPT } from './recommend'

export const LIVE_MODEL = import.meta.env.VITE_GEMINI_LIVE_MODEL || 'gemini-3.8-live'
const VOICE = import.meta.env.VITE_GEMINI_LIVE_VOICE || 'Sadachbia'

export interface LiveLine {
  role: 'user' | 'model'
  text: string
}

export interface LiveCallbacks {
  onStatus: (s: 'connecting' | 'live' | 'closed') => void
  onTranscript: (lines: LiveLine[]) => void
  onShowCourses: (ids: string[], reason: string) => void
  onLevel: (mic: number, speaking: boolean) => void
  onError: (msg: string) => void
}

// AudioWorklet: remuestrea el micrófono a PCM16 mono 16 kHz en bloques de ~100 ms
const WORKLET = `
class Pcm16Capture extends AudioWorkletProcessor {
  constructor() { super(); this.ratio = sampleRate / 16000; this.pos = 0; this.out = []; }
  process(inputs) {
    const ch = inputs[0][0];
    if (!ch) return true;
    let sum = 0;
    for (let i = 0; i < ch.length; i++) sum += ch[i] * ch[i];
    for (; this.pos < ch.length; this.pos += this.ratio) {
      const i = Math.floor(this.pos), f = this.pos - i;
      const s = ch[i] * (1 - f) + (ch[i + 1] ?? ch[i]) * f;
      this.out.push(Math.max(-1, Math.min(1, s)) * 0x7fff);
    }
    this.pos -= ch.length;
    if (this.out.length >= 1600) {
      const pcm = Int16Array.from(this.out);
      this.out = [];
      this.port.postMessage({ pcm: pcm.buffer, rms: Math.sqrt(sum / ch.length) }, [pcm.buffer]);
    }
    return true;
  }
}
registerProcessor('pcm16-capture', Pcm16Capture);
`

function toBase64(buf: ArrayBuffer) {
  const bytes = new Uint8Array(buf)
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(bin)
}

function fromBase64Pcm16(b64: string): Float32Array {
  const bin = atob(b64)
  const len = bin.length >> 1
  const out = new Float32Array(len)
  for (let i = 0; i < len; i++) {
    const v = bin.charCodeAt(2 * i) | (bin.charCodeAt(2 * i + 1) << 8)
    out[i] = (v >= 0x8000 ? v - 0x10000 : v) / 0x8000
  }
  return out
}

const SYSTEM = `${RECRUITER_PROMPT}
Estás en una llamada de voz en tiempo real que dura como máximo 1 minuto: sé muy breve (1-2 frases por turno).
Saluda en una frase y pregunta qué quiere aprender. Si hace falta, pregunta su nivel o tiempo disponible (una sola pregunta).
En cuanto tengas suficiente información, llama a la función mostrar_cursos con los 3 ids más relevantes (del más al menos relevante) y explícalos en voz en pocas palabras.`

export class LiveSession {
  private ws?: WebSocket
  private micCtx?: AudioContext
  private playCtx?: AudioContext
  private stream?: MediaStream
  private nextTime = 0
  private sources = new Set<AudioBufferSourceNode>()
  private lines: LiveLine[] = []
  private ready = false
  private closed = false

  constructor(private cb: LiveCallbacks) {}

  get transcript() {
    return this.lines
  }

  async start() {
    this.cb.onStatus('connecting')
    // Pedimos el micrófono primero: si falla no abrimos el socket
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
    })
    this.playCtx = new AudioContext({ sampleRate: 24000 })
    this.micCtx = new AudioContext()
    await this.micCtx.audioWorklet.addModule(URL.createObjectURL(new Blob([WORKLET], { type: 'application/javascript' })))

    const proto = location.protocol === 'https:' ? 'wss' : 'ws'
    this.ws = new WebSocket(`${proto}://${location.host}/api/live`)
    this.ws.onopen = () => this.sendSetup()
    this.ws.onmessage = (e) => this.onMessage(e)
    this.ws.onerror = () => this.cb.onError('No se pudo conectar con Gemini Live.')
    this.ws.onclose = (e) => {
      if (!this.closed && e.code !== 1000) this.cb.onError(e.reason || `Conexión cerrada (${e.code}).`)
      this.stop()
    }

    const node = new AudioWorkletNode(this.micCtx, 'pcm16-capture')
    node.port.onmessage = ({ data }) => {
      this.cb.onLevel(Math.min(1, data.rms * 6), this.sources.size > 0)
      if (!this.ready || this.ws?.readyState !== WebSocket.OPEN) return
      this.ws.send(JSON.stringify({ realtimeInput: { audio: { data: toBase64(data.pcm), mimeType: 'audio/pcm;rate=16000' } } }))
    }
    this.micCtx.createMediaStreamSource(this.stream).connect(node)
  }

  private sendSetup() {
    this.ws!.send(
      JSON.stringify({
        setup: {
          model: `models/${LIVE_MODEL}`,
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } } },
          },
          systemInstruction: { parts: [{ text: SYSTEM }] },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          tools: [
            {
              functionDeclarations: [
                {
                  name: 'mostrar_cursos',
                  description: 'Muestra en pantalla los cursos recomendados al usuario.',
                  parameters: {
                    type: 'OBJECT',
                    properties: {
                      ids: { type: 'ARRAY', items: { type: 'STRING', enum: COURSES.map((c) => c.id) } },
                      motivo: { type: 'STRING', description: 'Resumen breve de por qué' },
                    },
                    required: ['ids'],
                  },
                },
              ],
            },
          ],
        },
      }),
    )
  }

  private appendLine(role: LiveLine['role'], text: string) {
    const last = this.lines[this.lines.length - 1]
    if (last?.role === role) this.lines = [...this.lines.slice(0, -1), { role, text: last.text + text }]
    else this.lines = [...this.lines, { role, text }]
    this.cb.onTranscript(this.lines)
  }

  private async onMessage(e: MessageEvent) {
    const raw = typeof e.data === 'string' ? e.data : await (e.data as Blob).text()
    const msg = JSON.parse(raw)

    if (msg.setupComplete) {
      this.ready = true
      this.cb.onStatus('live')
      // El modelo saluda primero
      this.ws!.send(JSON.stringify({ realtimeInput: { text: '(El usuario acaba de iniciar la llamada. Salúdalo.)' } }))
    }

    const sc = msg.serverContent
    if (sc) {
      if (sc.interrupted) this.flushAudio() // el usuario habló encima: cortamos la voz
      for (const p of sc.modelTurn?.parts ?? []) {
        if (p.inlineData?.data) this.play(p.inlineData.data)
      }
      if (sc.inputTranscription?.text) this.appendLine('user', sc.inputTranscription.text)
      if (sc.outputTranscription?.text) this.appendLine('model', sc.outputTranscription.text)
    }

    for (const fc of msg.toolCall?.functionCalls ?? []) {
      if (fc.name === 'mostrar_cursos') this.cb.onShowCourses(fc.args?.ids ?? [], fc.args?.motivo ?? '')
      this.ws!.send(
        JSON.stringify({ toolResponse: { functionResponses: [{ id: fc.id, name: fc.name, response: { result: 'mostrado' } }] } }),
      )
    }
  }

  private play(b64: string) {
    const ctx = this.playCtx!
    const data = fromBase64Pcm16(b64)
    const buf = ctx.createBuffer(1, data.length, 24000)
    buf.copyToChannel(data as Float32Array<ArrayBuffer>, 0)
    const src = ctx.createBufferSource()
    src.buffer = buf
    src.connect(ctx.destination)
    this.nextTime = Math.max(this.nextTime, ctx.currentTime + 0.02)
    src.start(this.nextTime)
    this.nextTime += buf.duration
    this.sources.add(src)
    src.onended = () => this.sources.delete(src)
  }

  private flushAudio() {
    this.sources.forEach((s) => s.stop())
    this.sources.clear()
    this.nextTime = 0
  }

  stop() {
    if (this.closed) return
    this.closed = true
    this.ready = false
    this.flushAudio()
    this.stream?.getTracks().forEach((t) => t.stop())
    this.micCtx?.close()
    this.playCtx?.close()
    if (this.ws && this.ws.readyState <= WebSocket.OPEN) this.ws.close(1000)
    this.cb.onStatus('closed')
  }
}
