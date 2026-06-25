const key = process.argv[2]
if (!key) {
  console.error('Usage: node scripts/test-gemini-key.mjs <API_KEY>')
  process.exit(1)
}

const models = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
]

async function test(model) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: '2 yumurta yaklasik kac kalori? Kisa yanit ver.' }] }],
      generationConfig: { maxOutputTokens: 80 },
    }),
  })
  const d = await res.json()
  const text = d?.candidates?.[0]?.content?.parts?.[0]?.text
  return { model, status: res.status, text, err: d?.error?.message }
}

console.log('50 saniye bekleniyor (kota sifirlanmasi)...')
await new Promise((r) => setTimeout(r, 50000))

for (const m of models) {
  const r = await test(m)
  console.log(`\n${m}: HTTP ${r.status}`)
  if (r.text) console.log('Yanit:', r.text)
  else if (r.err) console.log('Hata:', r.err.slice(0, 300))
  if (r.status === 200) {
    console.log('\n✅ Calisan model:', m)
    process.exit(0)
  }
  await new Promise((r) => setTimeout(r, 3000))
}

console.log('\n❌ Hicbir model calismadi')
process.exit(1)
