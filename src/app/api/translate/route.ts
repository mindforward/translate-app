import { NextRequest, NextResponse } from 'next/server'

const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions'
const MODEL = 'deepseek-chat'

export async function POST(request: NextRequest) {
  try {
    const { text, source, target } = await request.json()

    if (!text) {
      return NextResponse.json({ error: '請輸入文字' }, { status: 400 })
    }

    // Allow client to override API key via header; fallback to env
    const apiKey = request.headers.get('x-api-key') || process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: '未設定 API Key。請在 .env 設定 DEEPSEEK_API_KEY 或在 App 內設定。' }, { status: 401 })
    }

    const systemPrompt = `You are a professional translator. Translate the following ${source} text to ${target}. 
Rules:
- Only output the translated text, nothing else.
- No explanations, no notes, no quotation marks around the translation.
- Preserve the original tone (formal/casual).
- If the text is already in ${target}, return it as-is.
- IMPORTANT: When translating TO Traditional Chinese, ALWAYS use Traditional Chinese characters (繁體字), NEVER Simplified Chinese (简体字).`

    const res = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text },
        ],
        temperature: 0.3,
        max_tokens: 2048,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      const errMsg = data.error?.message || data.error || `HTTP ${res.status}`
      return NextResponse.json({ error: `DeepSeek API 錯誤: ${errMsg}` }, { status: res.status })
    }

    const translation = data.choices?.[0]?.message?.content?.trim() || ''

    return NextResponse.json({ translation })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || '伺服器錯誤' }, { status: 500 })
  }
}
