# VideoPlayer — iOS / Pro Max tam ekran (runbook)

> **Belirti:** Hareket kütüphanesi modalında videoyu büyütünce (özellikle iPhone Pro Max) video kayboluyor / siyah ekran.
> **Kod:** `src/components/ui/VideoPlayer.jsx`, `src/utils/scrollLock.js`, `src/index.css` (`.video-player-pseudo-fullscreen`), `src/components/ui/Modal.jsx` (`data-scroll-lock`).

---

## Kök nedenler (üçü birden)

### 1. `webkitEnterFullscreen` videoyu “yutuyor”

iOS’ta `video.webkitEnterFullscreen()` inline videoyu sistem oynatıcısına alır. Modal + `playsInline` bağlamında native UI bazen **hiç açılmaz**; video modalda boş/siyah kalır → “kayboldu”.

**Kural:** Custom controls + watermark gereken yerde iOS expand = **pseudo-fullscreen portal**. Native FS’ye güvenme.

### 2. Portal reparent + jest izni

Pseudo FS, frame’i `createPortal(..., document.body)` ile taşır. Safari `<video>` DOM taşımasında playback’i sıfırlar.

Restore’u `useEffect` / `requestAnimationFrame` ile yapmak jest token’ını kaçırır → `play()` sessizce başarısız → siyah ekran.

**Kural:** `flushSync(() => setPseudoFullscreen(...))` sonrası **aynı tık turunda** `currentTime` + muted `play()` restore et (`transitionPseudoFullscreen`).

### 3. `body { overflow: hidden }` fixed overlay’i kırpar

Pseudo overlay `position: fixed` ile `body` altında. iOS Safari’de `document.body.style.overflow = 'hidden'` fixed child’ları kırpıp kaybettirebiliyor.

**Kural:** `body` overflow’una dokunma. `lockAppScroll()` / `unlockAppScroll()` (`src/utils/scrollLock.js`) ile kilitle:

- `document.documentElement`
- `[data-panel-scroll]` (üye/staff/admin `main`)
- `[data-scroll-lock]` (Modal içerik)

Ref-count’lu; menü + video FS çakışmasında güvenli.

---

## Doğru akış (özet)

```
Kullanıcı “Tam ekran” (iOS)
  → transitionPseudoFullscreen(true)
  → snapshot currentTime + wasPlaying
  → flushSync(setPseudoFullscreen(true))  // portal body’ye
  → applyPseudoFsRestore(video)           // jest içinde
  → lockAppScroll()                       // effect

Küçült / Escape
  → transitionPseudoFullscreen(false)
  → aynı snapshot + flushSync restore
  → unlockAppScroll()
```

Desktop: element `requestFullscreen` (wrapper div).  
Android / FS API yok: pseudo (`needsPseudoFullscreen`).

---

## Tekrar denk gelirse kontrol listesi

1. iOS expand hâlâ `webkitEnterFullscreen` mı çağırıyor? → Kaldır, pseudo’ya al.
2. Restore effect/rAF’ta mı? → `flushSync` + senkron restore.
3. `document.body.style.overflow = 'hidden'` var mı? → `scrollLock.js` kullan.
4. Pseudo CSS: `100dvh` + safe-area; `-webkit-fill-available` ile `100dvh`’yi ezme.
5. Modal scroll kilidi: içerikte `data-scroll-lock` var mı?
6. Portal `z-index` ≥ `100000` (modal `z-50` üstü).

---

## Bilinçli trade-off

- iOS’ta sistem native fullscreen kullanılmıyor → watermark + custom controls korunuyor.
- Sistem bir şekilde native FS açarsa `webkitbeginfullscreen` / `webkitendfullscreen` state’i senkronlar; expand butonu pseudo yolunu tercih eder.

---

## İlgili

Genel video kuralları: [`VIDEO_LATENCY_AND_PLAYBACK_RUNBOOK.md`](./VIDEO_LATENCY_AND_PLAYBACK_RUNBOOK.md) · [`AI_PROJE_REHBERI.md`](../AI_PROJE_REHBERI.md) §0 madde 6.
