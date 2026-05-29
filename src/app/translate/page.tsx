'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'

const LANG_MAP: Record<string, { source: string; target: string; sourceLabel: string; targetLabel: string; sourceFlag: string }> = {
  'vi-zh': { source: 'Vietnamese', target: 'Traditional Chinese', sourceLabel: '越南文', targetLabel: '繁體中文', sourceFlag: '🇻🇳' },
  'zh-vi': { source: 'Traditional Chinese', target: 'Vietnamese', sourceLabel: '繁體中文', targetLabel: '越南文', sourceFlag: '🇹🇼' },
}

function TranslateInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const dir = searchParams.get('dir') || 'vi-zh'
  const lang = LANG_MAP[dir] || LANG_MAP['vi-zh']

  const [input, setInput] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [listening, setListening] = useState(false)

  const [showSettings, setShowSettings] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [keySaved, setKeySaved] = useState(false)

  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    setApiKey(localStorage.getItem('deepseek_api_key') || '')
  }, [])

  const saveKey = () => {
    localStorage.setItem('deepseek_api_key', apiKey.trim())
    setKeySaved(true)
    setTimeout(() => setKeySaved(false), 2000)
  }

  const translate = useCallback(async () => {
    if (!input.trim()) return
    setLoading(true)
    setError('')
    setResult('')

    try {
      const key = apiKey || undefined
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(key ? { 'x-api-key': key } : {}) },
        body: JSON.stringify({ text: input.trim(), source: lang.source, target: lang.target }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '翻譯失敗')
      setResult(data.translation)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [input, apiKey, lang])

  // Voice input
  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setError('你的瀏覽器不支援語音輸入')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = dir === 'vi-zh' ? 'vi-VN' : 'zh-TW'

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setInput(prev => prev + transcript)
      setListening(false)
    }
    recognition.onerror = () => {
      setListening(false)
      setError('語音辨識失敗，請再試一次')
    }
    recognition.onend = () => setListening(false)

    recognitionRef.current = recognition
    setListening(true)
    recognition.start()
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    setListening(false)
  }

  // TTS
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    // Load voices (they may load async)
    const load = () => setVoices(window.speechSynthesis.getVoices())
    load()
    window.speechSynthesis.onvoiceschanged = load
    return () => { window.speechSynthesis.onvoiceschanged = null }
  }, [])

  const speak = (text: string, dir: string) => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()

    // Pick voice: Cantonese (zh-HK) for Chinese, Vietnamese (vi-VN) for Vietnamese
    const lang = dir === 'vi-zh' ? 'zh-HK' : 'vi-VN'
    const utterance = new SpeechSynthesisUtterance(text)

    // Try to find a matching voice
    const match = voices.find(v => v.lang.startsWith(lang))
    if (match) {
      utterance.voice = match
    }
    utterance.lang = lang
    utterance.rate = 0.85
    window.speechSynthesis.speak(utterance)
  }

  return (
    <main className="min-h-dvh flex flex-col bg-gradient-to-b from-sky-50 to-white">
      {/* Header */}
      <header className="flex items-center gap-3 px-5 py-5 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <button onClick={() => router.push('/')} className="text-gray-500 hover:text-sky-600 text-2xl">‹</button>
        <span className="font-semibold text-gray-800 text-xl">
          {lang.sourceFlag} {lang.sourceLabel} → {lang.targetLabel}
        </span>
        <button onClick={() => setShowSettings(!showSettings)} className="ml-auto text-gray-400 hover:text-sky-600 text-base">
          ⚙️
        </button>
      </header>

      {/* API Key popup */}
      {showSettings && (
        <div className="bg-white border-b border-gray-200 px-5 py-4 flex items-center gap-3">
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="DeepSeek API Key"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
          <button onClick={saveKey} className="bg-sky-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-sky-700 whitespace-nowrap">
            {keySaved ? '✅' : '儲存'}
          </button>
          {!apiKey && <span className="text-xs text-amber-500">用 .env</span>}
        </div>
      )}

      {/* Input area */}
      <div className="flex-1 flex flex-col p-5 gap-5">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={dir === 'vi-zh' ? 'Nhập văn bản tiếng Việt...' : '輸入繁體中文...'}
          className="flex-1 min-h-[200px] w-full border border-gray-300 rounded-2xl p-5 text-xl resize-none focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white shadow-sm"
        />

        <div className="flex items-center gap-3">
          <button
            onClick={listening ? stopListening : startListening}
            className={`flex items-center gap-2 px-6 py-4 rounded-xl font-medium text-lg transition-all ${
              listening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span className="text-xl">{listening ? '⏹' : '🎤'}</span>
            {listening ? '錄音中...' : '語音輸入'}
          </button>

          <button
            onClick={translate}
            disabled={loading || !input.trim()}
            className="flex-1 bg-sky-600 text-white py-4 rounded-xl font-semibold text-xl hover:bg-sky-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {loading ? '翻譯中...' : '翻  譯'}
          </button>
        </div>

        {/* Result */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-red-600 text-base">{error}</div>
        )}

        {result && (
          <div className="bg-white border border-sky-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-gray-800 text-2xl leading-relaxed whitespace-pre-wrap">{result}</p>
              <button
                onClick={() => speak(result, dir)}
                className="shrink-0 text-gray-400 hover:text-sky-600 text-2xl p-1"
                title="朗讀（廣東話）"
              >
                🔊
              </button>
            </div>
            <div className="flex gap-3 text-sm text-gray-400">
              <button
                onClick={() => { navigator.clipboard.writeText(result) }}
                className="hover:text-sky-600 text-base"
              >
                📋 複製
              </button>
              <button
                onClick={() => { setInput(result); setResult('') }}
                className="hover:text-sky-600 text-base"
              >
                🔄 反轉翻譯
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default function TranslatePage() {
  return (
    <Suspense fallback={<div className="min-h-dvh flex items-center justify-center text-gray-400">載入中...</div>}>
      <TranslateInner />
    </Suspense>
  )
}
