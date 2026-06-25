const key = process.argv[2]
const model = process.argv[3] || 'gemini-2.5-flash'
const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`
const res = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contents: [{ role: 'user', parts: [{ text: '2 yumurta 1 dilim ekmek kalori. JSON: {"label":"","items":[{"name":"","cal":0}],"confidence":"high"}' }] }],
    generationConfig: { maxOutputTokens: 300, responseMimeType: 'application/json', temperature: 0.2 },
  }),
})
const d = await res.json()
console.log('HTTP', res.status)
if (d?.error) {
  console.log('ERROR:', d.error.message)
  process.exit(1)
}
const parts = d?.candidates?.[0]?.content?.parts || []
const text = parts.map((p) => p.text).filter(Boolean).join('')
console.log('TEXT:', text || '(bos)')
if (!text) console.log('RAW:', JSON.stringify(d).slice(0, 800))
