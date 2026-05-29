# 譯橋 - 越中翻譯 App

越南文 ↔ 繁體中文 語音翻譯 App，使用 DeepSeek API 進行翻譯。

## 功能

- ✅ 越南文 ↔ 繁體中文 雙向翻譯
- ✅ 語音輸入（支援越南語及中文語音辨識）
- ✅ 語音朗讀翻譯結果
- ✅ 複製翻譯結果
- ✅ 反轉翻譯（把結果當作新輸入）
- ✅ 支援自訂 API Key

## 技術

- [Next.js](https://nextjs.org/) (App Router)
- [Tailwind CSS](https://tailwindcss.com/)
- [DeepSeek API](https://platform.deepseek.com/)
- Web Speech API（語音辨識及朗讀）

## 部署到 Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Fork / Clone 這個 repo
2. 在 Vercel 匯入專案
3. 在 Vercel 設定 Environment Variable: `DEEPSEEK_API_KEY`
4. 完成！

### 環境變數

| 變數 | 說明 |
|------|------|
| `DEEPSEEK_API_KEY` | DeepSeek API Key（可選，用戶也可在 App 內設定） |

## 本地開發

```bash
npm install
cp .env.example .env  # 填上你的 DeepSeek API Key
npm run dev
```

打開 http://localhost:3000
