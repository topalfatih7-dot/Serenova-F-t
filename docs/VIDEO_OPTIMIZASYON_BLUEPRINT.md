# Cursor AI Uygulama Blueprint'i — Video Kütüphanesi Optimizasyonu

> **Durum (2026-07-10): ✅ FAZ 1–3 UYGULANDI**  
> Bu dosya artık **tarihsel uygulama kaydı**dır. Yeni player sertleştirme işi için → [`VIDEO_INFRASTRUCTURE_BLUEPRINT.md`](./VIDEO_INFRASTRUCTURE_BLUEPRINT.md).  
> Proje rehberi: `AI_PROJE_REHBERI.md` §68.

---

## Uygulama özeti (ne yapıldı)

| Faz | Konu | Sonuç |
|-----|------|--------|
| **1** | Statik `.webp` thumbnail | `exercise-thumbs` public bucket; `getExerciseThumbUrl()`; `ExerciseVideoThumbnail` yalnızca `<img>` |
| **2** | Tıklamada anında oynatma | Poster + preload; kartta `prefetchExerciseVideo`; MP4 `+faststart` |
| **3** | İndirmeyi zorlaştırma | Signed URL **15 dk**; sağ tık engeli; blob-hiding yok |

### Komutlar

```bash
npm run db:migrate                    # exercise-thumbs bucket
npm run thumbs:generate:dry           # thumb dry-run
npm run thumbs:generate               # tüm thumb'lar
npm run videos:faststart:dry          # moov atom dry-run (yalnız remux)
npm run videos:faststart              # tüm videolar faststart remux
npm run videos:compress:dry           # encode dry-run (en büyük 5, min 1.5 MB)
npm run videos:compress               # §1.1 H.264 encode (bitrate düşürme)
```

### Ana dosyalar

| Dosya | Rol |
|-------|-----|
| `supabase/migrations/20260710_exercise_thumbs_bucket.sql` | Public `exercise-thumbs` bucket + read policy |
| `scripts/generate-exercise-thumbs.mjs` | Toplu webp üretimi |
| `scripts/faststart-exercise-videos.mjs` | Moov atomu başa (`-c copy`) |
| `scripts/compress-exercise-videos.mjs` | §1.1 libx264 encode + `-an` + faststart |
| `scripts/lib/exercise-video-encode.mjs` | Ortak encode sözleşmesi |
| `scripts/import-exercises.mjs` | Upload sırasında encode + thumb |
| `scripts/lib/ffmpeg-bin.mjs` | ffmpeg yolu |
| `src/services/supabaseDb.js` | `getExerciseThumbUrl`, signed URL 900 sn |
| `src/services/exerciseVideoUrlCache.js` | TTL 13 dk / margin 2 dk |
| `api/auth.js` | `EXERCISE_VIDEO_EXPIRES = 15 * 60` |
| `src/components/library/ExerciseVideoThumbnail.jsx` | Statik `<img>` (video mount yok) |
| `src/components/ui/VideoPlayer.jsx` | Poster + URL gelene kadar `preload="none"` |
| `src/utils/exerciseVideoPrefetch.js` | Hover/pointerdown prefetch |
| `src/utils/exerciseVideoLoadQueue.js` | Yalnızca URL slot kuyruğu (thumbnail slot silindi) |
| `.cursor/rules/exercise-import.mdc` | Thumbs + 15 dk signed URL kuralları |

### Kabul kriterleri (doğrulandı / hedef)

1. Kütüphane açılışında Network’te `exercise-videos` yok; yalnızca `exercise-thumbs` webp.
2. Kart `pointerdown` → signed URL prefetch; modal’da poster anında; masaüstünde hızlı play.
3. Sağ tık menüsü yok; 15 dk sonra signed URL 403; blob `src` gizleme yok.

---

## Mevcut Mimari (uygulama sonrası — ajan için bağlam)

- `exercise-videos` bucket **private**; `exercises.video_url` yalnızca storage path (`gym100-0001.mp4`).
- Oynatma: `getExerciseVideoUrl()` → `POST /api/auth` (`exercise-video-url`) → **15 dakikalık** signed URL → `exerciseVideoUrlCache.js`.
- Kapak: `exercise-thumbs` **public** → `getExerciseThumbUrl()` (`gym100-0001.mp4` → `gym100-0001.webp`). Thumbnail’de `<video>` yok.
- Prefetch: `ExerciseLibraryPage` / `ProgramsPage` / `CalendarPage` kartlarında `onPointerEnter` / `onPointerDown` / `onFocus`.
- Kullanım: thumbnail → library/programs/calendar; player → `ExerciseDetailModal`, `AdminLibraryPage`, takvim inline İzle.

---

## FAZ 1 — Frontend Thumbnail Üretiminin İptali, Statik .webp Thumbnail'ler ✅

### 1.1 Yeni bucket + migration ✅

Dosya: `supabase/migrations/20260710_exercise_thumbs_bucket.sql`

```sql
-- Thumbnail'ler tek kare, hassas içerik değil: public bucket = CDN cache + sıfır imzalama maliyeti.
-- Videolar private kalmaya devam ediyor.
insert into storage.buckets (id, name, public)
values ('exercise-thumbs', 'exercise-thumbs', true)
on conflict (id) do update set public = true;

create policy "exercise thumbs public read"
  on storage.objects for select
  using (bucket_id = 'exercise-thumbs');

-- Yazma sadece service role (varsayılan; ek insert/update policy AÇMA).
```

**İsimlendirme:** thumb path = video path uzantısı `.webp`. DB kolonu yok.

### 1.2 Toplu thumbnail üretim scripti ✅

`scripts/generate-exercise-thumbs.mjs` — ffmpeg; `--dry-run` / `--limit=N`.  
`import-exercises.mjs` `uploadVideoBatch()` içinde aynı thumb adımı.

### 1.3 Admin panel yüklemesinde thumbnail ✅ / best-effort

`uploadExerciseVideo` sonrası client canvas webp veya script backfill. Thumb hatası video upload’u bozmaz.

### 1.4 `ExerciseVideoThumbnail.jsx` ✅

- Silindi: thumbnail video slot, gizli `<video>`, signed URL thumb için.
- Korundu: YouTube thumb, `videoPending`, boyut/accent sınıfları.
- Eklendi: `getExerciseThumbUrl` + lazy `<img>` + `draggable={false}` / contextmenu engeli.

### 1.5 Temizlik ✅

- Thumbnail slot API’leri kaldırıldı; `exerciseVideoLoadQueue.js` yalnızca URL slot.
- Sayfa açılışında toplu `prefetchExerciseVideosFromItems` yok; kart bazlı prefetch (Faz 2).

---

## FAZ 2 — Tıklamada Anında Oynatma ✅

### 2.1 `VideoPlayer.jsx` ✅

`<video>` hemen mount; `poster={getExerciseThumbUrl(url)}`; URL yokken `preload="none"`; URL gelince `exerciseVideoPreload()`.

### 2.2 Prefetch ✅

`prefetchExerciseVideo` — library / programs / calendar kartlarında pointerenter/down/focus.

### 2.3 MP4 faststart ✅

`scripts/faststart-exercise-videos.mjs` + import upload’ta `-movflags +faststart`.

### 2.4 Bilinçli ertelenen

- HLS / Edge Function proxy — kısa klipler için gerekmez (bkz. infrastructure blueprint §1.2).

---

## FAZ 3 — İndirmeyi Zorlaştırma ✅

### 3.1 Signed URL 15 dk ✅

- `api/auth.js` → `EXERCISE_VIDEO_EXPIRES = 15 * 60`
- Cache varsayılanları 13 dk / 2 dk margin
- Client fallback `createSignedUrl(..., 900)`

### 3.2 Sağ tık + sürükleme ✅

`VideoWatermarkFrame` + video + thumbnail img: `onContextMenu` prevent + `draggable={false}`.

### 3.3 Beklenti

Blob/MediaSource `src` gizleme **yok** (iOS fullscreen / `recoverIosVideoPlayback` bozulur). Hedef: sıradan kullanıcı için zahmetli.

---

## Sonraki iş

Player sertleştirme tamamlandı → [`VIDEO_INFRASTRUCTURE_BLUEPRINT.md`](./VIDEO_INFRASTRUCTURE_BLUEPRINT.md) (✅ · `AI_PROJE_REHBERI.md` §69).
Manuel cihaz testi: blueprint §6 acceptance matrix.
