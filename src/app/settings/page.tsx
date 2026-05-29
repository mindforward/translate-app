'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function SettingsPage() {
  const router = useRouter()
  const [key, setKey] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setKey(localStorage.getItem('deepseek_api_key') || '')
  }, [])

  const save = () => {
    localStorage.setItem('deepseek_api_key', key.trim())
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <main className="min-h-dvh flex flex-col bg-gradient-to-b from-sky-50 to-white px-6 py-8">
      <button onClick={() => router.back()} className="text-sky-600 mb-6 w-fit">← 返回</button>

      <h1 className="text-2xl font-bold text-gray-800 mb-6">⚙️ API 設定</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 space-y-4 max-w-md">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">DeepSeek API Key</label>
          <input
            type="password"
            value={key}
            onChange={e => setKey(e.target.value)}
            placeholder="sk-xxxxxxxxxxxxxxxx"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
        </div>

        <p className="text-xs text-gray-400">
          API Key 只儲存在你瀏覽器的 localStorage，不會傳送到伺服器。
          如不設定的話，會使用 .env 的 DEEPSEEK_API_KEY。
        </p>

        <button
          onClick={save}
          className="w-full bg-sky-600 text-white rounded-lg py-2.5 font-medium hover:bg-sky-700 transition-colors"
        >
          {saved ? '✅ 已儲存' : '儲存'}
        </button>
      </div>

      <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-200 p-5 max-w-md">
        <h2 className="font-medium text-gray-700 mb-2">如何取得 API Key？</h2>
        <ol className="text-sm text-gray-500 space-y-1 list-decimal list-inside">
          <li>前往 <a href="https://platform.deepseek.com" target="_blank" rel="noreferrer" className="text-sky-600 underline">platform.deepseek.com</a></li>
          <li>註冊／登入帳號</li>
          <li>到 API Keys 頁面建立新的 Key</li>
          <li>複製貼上到上面輸入框</li>
        </ol>
      </div>
    </main>
  )
}
