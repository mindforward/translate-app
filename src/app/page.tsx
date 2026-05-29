'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function Home() {
  const router = useRouter()
  const [hasApiKey, setHasApiKey] = useState(false)

  useEffect(() => {
    setHasApiKey(!!localStorage.getItem('deepseek_api_key'))
  }, [])

  const choose = (dir: 'vi-zh' | 'zh-vi') => {
    router.push(`/translate?dir=${dir}`)
  }

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center bg-gradient-to-b from-sky-50 to-white px-6">
      <div className="text-center mb-10">
        <h1 className="text-5xl font-bold text-sky-700 mb-2">譯橋</h1>
        <p className="text-gray-500 text-lg">越南文 ↔ 繁體中文 · 語音翻譯</p>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button
          onClick={() => choose('vi-zh')}
          className="group relative flex items-center gap-3 bg-white border-2 border-sky-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-sky-400 transition-all text-left"
        >
          <span className="text-3xl">🇻🇳</span>
          <div>
            <div className="font-semibold text-gray-800">越南文 → 繁體中文</div>
            <div className="text-sm text-gray-400">Tiếng Việt → 中文</div>
          </div>
          <span className="ml-auto text-sky-400 group-hover:translate-x-1 transition-transform">→</span>
        </button>

        <button
          onClick={() => choose('zh-vi')}
          className="group relative flex items-center gap-3 bg-white border-2 border-sky-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-sky-400 transition-all text-left"
        >
          <span className="text-3xl">🇹🇼</span>
          <div>
            <div className="font-semibold text-gray-800">繁體中文 → 越南文</div>
            <div className="text-sm text-gray-400">中文 → Tiếng Việt</div>
          </div>
          <span className="ml-auto text-sky-400 group-hover:translate-x-1 transition-transform">→</span>
        </button>
      </div>

      <div className="mt-10 flex flex-col items-center gap-2">
        <button
          onClick={() => router.push('/settings')}
          className="text-sm text-gray-400 hover:text-sky-600 transition-colors"
        >
          ⚙️ API 設定
        </button>
        {!hasApiKey && (
          <p className="text-xs text-amber-500">⚠️ 請先設定 DeepSeek API Key</p>
        )}
      </div>
    </main>
  )
}
