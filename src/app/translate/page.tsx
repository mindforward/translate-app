'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'

type UIStrings = {
  inputPlaceholder: string
  translate: string
  translating: string
  voiceInput: string
  recording: string
  copy: string
  reverse: string
  clear: string
  clearHistory: string
  history: string
  speakTitle: string
  errorNoVoice: string
  errorVoiceFailed: string
  errorTranslateFailed: string
  settingsSave: string
  settingsUsingEnv: string
  loading: string
}

const LANG_MAP: Record<string, {
  source: string; target: string
  sourceLabel: string; targetLabel: string; sourceFlag: string
  ui: UIStrings
}> = {
  'vi-zh': {
    source: 'Vietnamese', target: 'Traditional Chinese',
    sourceLabel: '越南文', targetLabel: '繁體中文', sourceFlag: '🇻🇳',
    ui: {
      inputPlaceholder: 'Nhập văn bản tiếng Việt...',
      translate: 'Dịch',
      translating: 'Đang dịch...',
      voiceInput: 'Nhập bằng giọng nói',
      recording: 'Đang ghi âm...',
      copy: 'Sao chép',
      reverse: 'Đảo ngược',
      clear: 'Xoá',
      clearHistory: 'Xoá lịch sử',
      history: 'Lịch sử',
      speakTitle: 'Đọc to',
      errorNoVoice: 'Trình duyệt không hỗ trợ nhập giọng nói',
      errorVoiceFailed: 'Nhập giọng nói thất bại, vui lòng thử lại',
      errorTranslateFailed: 'Dịch thất bại',
      settingsSave: 'Lưu',
      settingsUsingEnv: 'Dùng .env',
      loading: 'Đang tải...',
    },
  },
  'zh-vi': {
    source: 'Traditional Chinese', target: 'Vietnamese',
    sourceLabel: '繁體中文', targetLabel: '越南文', sourceFlag: '🇹🇼',
    ui: {
      inputPlaceholder: '輸入繁體中文...',
      translate: '翻  譯',
      translating: '翻譯中...',
      voiceInput: '語音輸入',
      recording: '錄音中...',
      copy: '複製',
      reverse: '反轉翻譯',
      clear: '清除',
      clearHistory: '清除歷史',
      history: '歷史記錄',
      speakTitle: '朗讀（廣東話）',
      errorNoVoice: '你的瀏覽器不支援語音輸入',
      errorVoiceFailed: '語音辨識失敗，請再試一次',
      errorTranslateFailed: '翻譯失敗',
      settingsSave: '儲存',
      settingsUsingEnv: '用 .env',
      loading: '載入中...',
    },
  },
}

function TranslateInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const dir = searchParams.get('dir') || 'vi-zh'
  const lang = LANG_MAP[dir] || LANG_MAP['vi-zh']
  const ui = lang.ui

  const [input, setInput] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [listening, setListening] = useState(false)

  const [showSettings, setShowSettings] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [keySaved, setKeySaved] = useState(false)

  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState<{source: string; target: string; dir: string; ts: number}[]>([])

  const recognitionRef = useRef<any>(null)

  const HISTORY_KEY = 'translate_history'

  useEffect(() => {
    setApiKey(localStorage.getItem('deepseek_api_key') || '')
    try {
      const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
      setHistory(saved)
    } catch {}
  }, [])

  const clearAll = () => {
    setInput('')
    setResult('')
    setError('')
  }

  const clearHistory = () => {
    localStorage.removeItem(HISTORY_KEY)
    setHistory([])
  }

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
      if (!res.ok) throw new Error(data.error || ui.errorTranslateFailed)
      setResult(data.translation)
      // Auto-save to history
      const entry = { source: input.trim(), target: data.translation, dir, ts: Date.now() }
      setHistory(prev => {
        const updated = [entry, ...prev].slice(0, 200)
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
        return updated
      })
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [input, apiKey, lang, ui])

  // Toggle direction and swap input/result
  const toggleDir = () => {
    const newDir = dir === 'vi-zh' ? 'zh-vi' : 'vi-zh'
    setInput(result)
    setResult('')
    router.push(`/translate?dir=${newDir}`)
  }

  // Voice input
  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setError(ui.errorNoVoice)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = dir === 'vi-zh' ? 'vi-VN' : 'zh-HK'

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setInput(prev => prev + transcript)
      setListening(false)
    }
    recognition.onerror = () => {
      setListening(false)
      setError(ui.errorVoiceFailed)
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
  const speak = (text: string, dir: string) => {
    if (!text || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()

    const lang = dir === 'vi-zh' ? 'zh-HK' : 'vi-VN'
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = 0.9
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
            {keySaved ? '✅' : ui.settingsSave}
          </button>
          {!apiKey && <span className="text-xs text-amber-500">{ui.settingsUsingEnv}</span>}
        </div>
      )}

      {/* Dual-panel: original + translation */}
      <div className="flex-1 flex flex-col p-5 gap-4">
        {/* Original text panel */}
        <div className="flex-1 flex flex-col gap-2">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">{lang.sourceFlag} {lang.sourceLabel}</div>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={ui.inputPlaceholder}
            className="flex-1 min-h-[120px] w-full border border-gray-300 rounded-2xl p-4 text-lg resize-none focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white shadow-sm"
          />
        </div>

        {/* Translation panel */}
        <div className="flex-1 flex flex-col gap-2">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">{lang.targetLabel}</div>
          <div className="flex-1 min-h-[120px] w-full border border-gray-200 rounded-2xl p-4 bg-gray-50 shadow-sm flex flex-col">
            {result ? (
              <>
                <div className="flex-1 flex items-start justify-between gap-3">
                  <p className="text-gray-800 text-lg leading-relaxed whitespace-pre-wrap">{result}</p>
                  <button
                    onClick={() => speak(result, dir)}
                    className="shrink-0 text-gray-400 hover:text-sky-600 text-xl p-1"
                    title={ui.speakTitle}
                  >
                    🔊
                  </button>
                </div>
                <div className="flex gap-3 text-sm text-gray-400 mt-2 pt-2 border-t border-gray-200">
                  <button
                    onClick={() => { navigator.clipboard.writeText(result) }}
                    className="hover:text-sky-600 text-base"
                  >
                    📋 {ui.copy}
                  </button>
                  <button
                    onClick={toggleDir}
                    className="hover:text-sky-600 text-base"
                  >
                    🔄 {ui.reverse}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-300 text-base italic">
                {loading ? ui.translating : '⋯'}
              </div>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-600 text-sm">{error}</div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={listening ? stopListening : startListening}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-base transition-all ${
              listening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span className="text-lg">{listening ? '⏹' : '🎤'}</span>
          </button>

          <button
            onClick={translate}
            disabled={loading || !input.trim()}
            className="flex-1 bg-sky-600 text-white py-3 rounded-xl font-semibold text-lg hover:bg-sky-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {loading ? ui.translating : ui.translate}
          </button>
        </div>

        {/* Second row: clear + history */}
        <div className="flex items-center gap-2">
          <button
            onClick={clearAll}
            disabled={!input && !result}
            className="flex-1 bg-gray-100 text-gray-500 py-2.5 rounded-xl font-medium text-sm hover:bg-red-100 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            🧹 {ui.clear}
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-colors ${
              showHistory ? 'bg-sky-100 text-sky-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            📜 {ui.history} ({history.length})
          </button>
        </div>

        {/* History panel */}
        {showHistory && (
          <div className="border border-gray-200 rounded-2xl bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-500">{ui.history}</span>
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="text-xs text-red-400 hover:text-red-600 transition-colors"
                >
                  🗑 {ui.clearHistory}
                </button>
              )}
            </div>
            <div className="max-h-[240px] overflow-y-auto">
              {history.length === 0 ? (
                <div className="text-center text-gray-300 text-sm py-8">—</div>
              ) : (
                history.map((entry, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInput(entry.source)
                      setResult(entry.target)
                      setShowHistory(false)
                    }}
                    className="w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-sky-50 transition-colors last:border-0"
                  >
                    <div className="text-sm text-gray-800 truncate">{entry.source}</div>
                    <div className="text-xs text-gray-400 truncate mt-0.5">{entry.target}</div>
                    <div className="text-[10px] text-gray-300 mt-0.5">
                      {entry.dir === 'vi-zh' ? '🇻🇳→🇹🇼' : '🇹🇼→🇻🇳'} · {new Date(entry.ts).toLocaleString()}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default function TranslatePage() {
  return (
    <Suspense fallback={<div className="min-h-dvh flex items-center justify-center text-gray-400">{LANG_MAP['vi-zh'].ui.loading}</div>}>
      <TranslateInner />
    </Suspense>
  )
}
