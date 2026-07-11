# Egzersiz videosu — gecikme, encode ve oynatma runbook

> **Tarih:** 2026-07-11  
> **Amaç:** Ne yaptık, nerede, nasıl; bozulursa nereye bakılacak.  
> **İlgili:** [`VIDEO_OPTIMIZASYON_BLUEPRINT.md`](./VIDEO_OPTIMIZASYON_BLUEPRINT.md) · [`VIDEO_INFRASTRUCTURE_BLUEPRINT.md`](./VIDEO_INFRASTRUCTURE_BLUEPRINT.md) · [`VIDEO_PLAYER_IOS_FULLSCREEN.md`](./VIDEO_PLAYER_IOS_FULLSCREEN.md) · `.cursor/rules/exercise-import.mdc` · `AI_PROJE_REHBERI.md` §68–§70

---

## 1. Sorun neydi?

| Belirti | Kök neden |
|---------|-----------|
| Modalda video geç açılıyor / uzun buffering | Storage’da kısa klipler **ort. ~4.7 MB**, p95 ~14 MB, max ~46 MB; pipeline yalnızca `-c copy` remux yapıyordu (bitrate düşürmüyordu). Blueprint §1.1 encode sözleşmesi kodda uygulanmamıştı. |
| İmza turu ekstra RTT | `getExerciseVideoUrl` önce `POST /api/auth` (Vercel) çağırıyordu; client RLS ile doğrudan imzalayabiliyordu. |
| iPhone 14 Pro Max: video oynuyor ama ortadaki play butonu kalıyor | `showCenterPlay = autoplayBlocked \|\| …` — iOS’ta `play()` bazen `blocked` dönüp video yine de oynuyor; `autoplayBlocked` true kalınca overlay kilitleniyordu. Ayrıca `mediaKey` değişince kontroller eski `<video>` dinleyicisinde kalabiliyordu. |

**Veritabanı / liste sorgusu darboğaz değildi** (`exercises` ~5 MB, sayfa 24 satır).

---

## 2. Ne yaptık? (özet)

### 2.1 Encode backfill (§1.1)

- Ortak encoder: `scripts/lib/exercise-video-encode.mjs`
- Toplu backfill: `scripts/compress-exercise-videos.mjs` → `npm run videos:compress`
- Import upload: `scripts/import-exercises.mjs` artık remux yerine encode (başarısızsa remux fallback)
- Sonuç (canlı storage, 2026-07-11): **~7.1 GB → ~0.5–0.6 GB**; ort. **~4.7 MB → ~0.4 MB**; max **~46 MB → ~1.5 MB**

Encode bayrakları (değiştirirken blueprint §1.1 ile uyumlu tut):

```text
libx264 · profile high · level 4.0 · yuv420p · CRF 28 · scale≤1280
-an · +faststart · container mp4
```

### 2.2 Client-first signed URL

- `src/services/supabaseDb.js` → `signExerciseVideoPathRaw`:
  1. `createSignedUrl` / batch `createSignedUrls` (authenticated RLS)
  2. Fallback: `POST /api/auth` `exercise-video-url` / `exercise-video-urls`
- Cache: `exerciseVideoUrlCache.js` (TTL ~13 dk, margin 2 dk) — aynı token CDN ısınması için kritik

### 2.3 iOS ortadaki play overlay

- `src/components/ui/VideoPlayer.jsx`:
  - `showCenterPlay = !playing && (autoplayBlocked || …)` — oynarken asla gösterilmez
  - `playing` event → `setAutoplayBlocked(false)`
  - `tryAutoplay`: `result.ok || !video.paused` ise blocked temizlenir
  - `VideoCustomControls` `mediaKey` ile dinleyicileri yeni `<video>` elemanına bağlar

---

## 3. Mimari harita (nerede ne var?)

```
Liste kartı
  → getExerciseThumbUrl(path)          exercise-thumbs (public webp)
  → prefetchExerciseVideo(path)        hover/pointerdown/focus
       → getExerciseVideoUrl
            → cache hit?
            → client createSignedUrl   (öncelik)
            → API /api/auth            (fallback)

Modal / İzle
  → VideoPlayer
       → poster = webp
       → playUrl = cache veya getExerciseVideoUrl
       → <video> H.264 MP4 + watermark
       → iOS: custom controls + pseudo-FS (bkz. IOS_FULLSCREEN runbook)
```

| Katman | Dosya | Görev |
|--------|-------|--------|
| Encode sözleşmesi | `scripts/lib/exercise-video-encode.mjs` | Tek kaynak ffmpeg bayrakları |
| Backfill | `scripts/compress-exercise-videos.mjs` | Storage’daki mevcut MP4’leri küçült |
| Import | `scripts/import-exercises.mjs` | Yeni upload’ta encode + thumb |
| Remux (eski) | `scripts/faststart-exercise-videos.mjs` | Yalnız moov atomu; bitrate düşürmez |
| Thumb | `scripts/generate-exercise-thumbs.mjs` | Public webp |
| İmza + path | `src/services/supabaseDb.js` | `getExerciseVideoUrl`, `prefetchExerciseVideoUrls`, `getExerciseThumbUrl` |
| Cache | `src/services/exerciseVideoUrlCache.js` | URL TTL / invalidate / dedupe |
| Slot kuyruğu | `src/utils/exerciseVideoLoadQueue.js` | Paralel imza limiti (iOS 3 / diğer 6) |
| Prefetch UI | `src/utils/exerciseVideoPrefetch.js` | Kart hover |
| Player | `src/components/ui/VideoPlayer.jsx` | Poster, autoplay, overlay, FS |
| Platform | `src/utils/videoPlayerPlatform.js` | iOS/preload/playGuard |
| API fallback | `api/auth.js` | `EXERCISE_VIDEO_EXPIRES = 900` |
| RLS | `supabase/migrations/20260704_exercise_videos_authenticated_read.sql` | Client imza için SELECT |
| Güvenlik kuralı | `.cursor/rules/exercise-import.mdc` | Private bucket + path-only |

---

## 4. Nasıl çalıştırılır?

```bash
# Encode dry-run (en büyük 5, varsayılan min 1.5 MB)
npm run videos:compress:dry

# Backfill (en büyüklerden; min-bytes / limit / concurrency destekler)
npm run videos:compress
node scripts/compress-exercise-videos.mjs --min-bytes=5000000 --concurrency=2
node scripts/compress-exercise-videos.mjs --force --min-bytes=1500000 --limit=10

# Yeni paket upload (encode otomatik)
node scripts/import-exercises.mjs --pack=yoga --upload-videos

# Thumb / yalnız remux
npm run thumbs:generate
npm run videos:faststart
```

**Önemli:** `--force` yalnızca “encode büyüttüyse yine de yaz” içindir; **min-bytes filtresini atlamaz** (2026-07-11 düzeltmesi). Tüm kütüphaneyi yeniden encode etmek istemiyorsan `--force`’u minsiz kullanma.

Gereksinim: `ffmpeg` (veya `ffmpeg-static`), `.env.local` içinde `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`.

---

## 5. Olası sorunlar → nereye bak?

### 5.1 Video hâlâ yavaş

1. Storage boyutu: Supabase `storage.objects` `bucket_id='exercise-videos'` — avg / p95 / max.
2. Dosya hâlâ büyükse: `npm run videos:compress:dry` adayları listeler mi?
3. Network: modal açılışında signed URL cache hit mi? (`exerciseVideoUrlCache` / hover prefetch).
4. İmza yolu: DevTools’ta her oynatmada `/api/auth` mi gidiyor? Client-first bozulmuş olabilir → `signExerciseVideoPathRaw` sırası.
5. iOS `preload="metadata"` bilinçli; tam `auto` değil (`exerciseVideoPreload`).

### 5.2 403 / “Video oynatılamadı”

1. Oturum var mı? (client imza JWT ister)
2. TTL: 15 dk doldu mu? → `invalidateExerciseVideoUrlCache` + recover (`VideoPlayer` stall/error).
3. Path geçerli mi? `^[\w.-]+$`, `video_pending=false`.
4. Paket gate: `memberHasFullVideoAccess` — Spor/VIP dışı üyede oynatma kilitli (liste açık).
5. API fallback: `api/auth.js` `handleExerciseVideoUrl` + service role.

### 5.3 iOS: play butonu takılı / siyah ekran

| Belirti | Bakılacak yer |
|---------|----------------|
| Video oynuyor, ortada play kalıyor | `VideoPlayer.jsx` `showCenterPlay`, `autoplayBlocked`, `onPlaying`, `VideoCustomControls` `mediaKey` |
| Büyütünce video kayboluyor | [`VIDEO_PLAYER_IOS_FULLSCREEN.md`](./VIDEO_PLAYER_IOS_FULLSCREEN.md) — pseudo-FS + `flushSync` + `scrollLock` |
| Autoplay yok, sadece poster | Low Power Mode / `prefers-reduced-motion` / `saveData` — beklenen; overlay tap ile play |

### 5.4 Encode script hataları

| Hata | Anlamı |
|------|--------|
| `Bad Request` upload | Geçici Storage hatası; aynı path’i tekrar dene |
| `skip-larger` | Encode çıktısı girdiden büyük; `--force` ile zorla yazılabilir |
| `ffmpeg bulunamadı` | `brew install ffmpeg` veya `ffmpeg-static` |
| Aday 0 | Hepsi `min-bytes` altında veya `video_pending` / YouTube path |

### 5.5 Thumb yok / kırık kapak

1. `getExerciseThumbUrl` → `video.mp4` → `video.webp`
2. `npm run thumbs:generate`
3. Public bucket policy: `20260710_exercise_thumbs_bucket.sql`

### 5.6 Güvenlik regresyonu (yapma)

- `exercise-videos` public yapma
- `exercises.video_url` içine kalıcı public URL yazma
- Blob/MediaSource ile `src` gizleme (iOS FS / recover bozar)
- Sayfa açılışında tüm kartlara toplu signed URL (bilinçli kaldırıldı; kart prefetch yeterli)

---

## 6. Doğrulama checklist

- [ ] `/library` Network: açılışta `exercise-videos` yok; `exercise-thumbs` webp var
- [ ] Kart hover → imza (ideal: doğrudan Supabase sign, her seferinde Vercel değil)
- [ ] Modal: poster anında; masaüstü/iOS muted autoplay veya play overlay
- [ ] iPhone 14 Pro Max: video oynarken ortadaki play **kaybolur**
- [ ] iOS tam ekran: pseudo portal; siyah/kayıp ekran yok
- [ ] 16 dk sonra seek → re-sign ≤2 deneme
- [ ] Yeni import `--upload-videos` → küçük H.264 + thumb

---

## 7. Ölçüm notu (2026-07-11, bu makineden Supabase)

Örnek klipler (~143–534 KB) için:

| Adım | Tipik süre |
|------|------------|
| `createSignedUrl` | ~180–470 ms |
| İmza + ilk ~256 KB | ~1.1–1.4 sn |
| Tam dosya indirme | ~0.4–0.8 sn |

Eski ort. 4.7 MB aynı hatta ~10 sn bandındaydı → transfer boyutu asıl kazanç.

---

## 8. Commit / sürüm izi

| Commit / dönem | Konu |
|----------------|------|
| `3755bd11` | Encode pipeline + client-first imza + docs |
| `0a5e838a` | iOS ortadaki play overlay fix |
| Storage backfill | `videos:compress` canlı bucket’ta uygulandı (DB migration değil) |
