# Yeniform.com — Video Infrastructure Blueprint (v1)

> **Audience:** an AI coding agent (Cursor) implementing/refactoring the video layer of this repo.
> **Scope:** architectural rules only. Do NOT invent a new player from scratch — extend the existing one.
> **Ground truth files:** `src/components/ui/VideoPlayer.jsx`, `src/utils/videoPlayerPlatform.js`,
> `src/services/exerciseVideoUrlCache.js`, `src/utils/exerciseVideoPrefetch.js`,
> `src/services/supabaseDb.js` (`getExerciseVideoUrl`, `getExerciseThumbUrl`), `api/auth.js`.
> **Related (done):** [`VIDEO_OPTIMIZASYON_BLUEPRINT.md`](./VIDEO_OPTIMIZASYON_BLUEPRINT.md) — thumbs / prefetch / faststart / 15 dk TTL.
> **Proje rehberi:** `AI_PROJE_REHBERI.md` §68.

---

## Status (2026-07-10) — uygulama tamam

Optimizasyon katmanı (Faz 1–3) + bu blueprint’in player sertleştirme maddeleri **uygulandı**.

| Bölüm | Durum | Not |
|-------|--------|-----|
| §0 Fixed context | ✅ | private bucket, 15 dk signed URL, public thumbs, anti-download, no blob-hide |
| §1.1–1.2 Codec / single-source H.264 | ✅ | pipeline + client single `<source type="video/mp4">` |
| §1.3 Source failure semantics | ✅ | `<source>` error listener; MEDIA_ERR 2/3/4 routing |
| §2.2 Attempt-then-fallback autoplay | ✅ | `shouldAttemptAutoplay` + `createPlayGuard`; iOS wholesale disable kaldırıldı |
| §2.3 Poster + blocked overlay | ✅ | verified block → overlay (custom + native controls) |
| §3.1 playsInline + webkit-playsinline | ✅ | attribute + React prop |
| §3.2 Fullscreen state machine | ✅ | iOS native FS (custom controls on iOS); pseudo; element FS |
| §3.3 Safe-area / `100dvh` | ✅ | control bar `env(safe-area-inset-*)`; `viewport-fit=cover` in `index.html` |
| §4.1 Signed-URL + prefetch | ✅ | 15 dk + invalidate on recover |
| §4.2 Stall / progress watchdog | ✅ | waiting 10s; timeupdate 3s stall; online/offline |
| §4.3 Network recovery | ✅ | re-sign ≤2, backoff 1s/4s, manual Tekrar dene |
| §4.4 Teardown contract | ✅ | pause → clear src/source → load on unmount |
| §5 Accessibility | ✅ | keyboard (custom), aria-live, title prop, reduced-motion/saveData, 44px targets |
| §6 Acceptance matrix | 📋 | Manuel cihaz testi — aşağıdaki tablo |

**Ana dosyalar:** `VideoPlayer.jsx`, `videoPlayerPlatform.js`, `exerciseVideoUrlCache.js` (`invalidateExerciseVideoUrlCache`), `index.html` (`viewport-fit=cover`).

---

## 0. Fixed Architectural Context (constraints the implementation MUST respect)

- Videos live in a **private** Supabase Storage bucket `exercise-videos`. `exercises.video_url` stores only a storage path (e.g. `gym100-0001.mp4`). This security model is immutable (see `.cursor/rules/exercise-import.mdc`).
- Playback URL = **15-minute signed URL** obtained via `POST /api/auth` (`action: exercise-video-url`), cached in `exerciseVideoUrlCache.js`.
- Posters are static `.webp` files in the **public** bucket `exercise-thumbs`; path is derived (`gym100-0001.mp4` → `gym100-0001.webp`) via `getExerciseThumbUrl()`. Thumbnails NEVER mount a `<video>`.
- Content = short exercise loop clips (< ~60 s), MP4/H.264, remuxed with `-movflags +faststart` (scripts: `faststart-exercise-videos.mjs`, `import-exercises.mjs --upload-videos`).
- Anti-download posture (keep): `controlsList="nodownload nofullscreen noremoteplayback"`, `disablePictureInPicture`, `disableRemotePlayback`, `onContextMenu` prevented, watermark overlay (`VideoWatermarkFrame`). Blob/MediaSource src-hiding is explicitly **forbidden** (breaks iOS native fullscreen and `recoverIosVideoPlayback`).
- YouTube URLs take a separate `<iframe>` path — out of scope for the rules below except where noted.

---

## 1. Codec & Format Strategy

### 1.1 Canonical format (single source of truth)

- **Master format: MP4 container, H.264 (AVC) video + AAC-LC audio.** This is the ONLY format guaranteed to hardware-decode on every target: iOS Safari ≥ 12, Android Chrome (all vendors incl. low-end MediaTek SoCs), Firefox (via OS decoder), Edge, macOS Safari, Windows Chrome.
- Encoding contract (enforce in `scripts/` ffmpeg steps, NOT in the client):
  - Video: `-c:v libx264 -profile:v high -level 4.0 -pix_fmt yuv420p`
    - `yuv420p` is MANDATORY. `yuv422p/yuv444p` output silently fails or renders green/black frames on iOS and many Android hardware decoders.
    - Width and height MUST be even numbers (H.264 4:2:0 constraint); use `-vf "scale=trunc(iw/2)*2:trunc(ih/2)*2"` defensively.
    - Cap resolution at 1080p and ~4 Mbps for exercise clips; low-end phones (2 GB RAM, Mali-400 class GPUs) drop frames above that.
  - Audio: `-c:a aac -b:a 96k` OR strip audio entirely (`-an`) for silent loop clips. IF a clip has no audio track, autoplay policy handling becomes trivial (see §2), so PREFER `-an` for silent demo loops.
  - Container: `-movflags +faststart` ALWAYS (moov atom at file head). Without it, browsers must fetch the tail of the file before first frame → multi-second click-to-play delay and iOS `preload="metadata"` downloads nearly the whole file.
- `.mov` uploads (video/quicktime): remux to `.mp4` at import time (`-c copy` when codec is already H.264). `videoMimeFromUrl()` in `VideoPlayer.jsx` already maps `.mov` → `video/quicktime` as a stopgap; treat any surviving `.mov` as legacy, because Firefox and some Android builds refuse `video/quicktime`.

### 1.2 Multi-source strategy and `<source>` order

- Browsers pick the **first** `<source>` whose `type` they report playable — order is a priority list, best-compression-first, universal-last:
  1. *(optional, only if ever generated)* AV1 in MP4 — `type="video/mp4; codecs=av01.0.05M.08"`
  2. *(optional)* HEVC in MP4 — `type="video/mp4; codecs=hvc1.1.6.L93.B0"` — the codec fourcc MUST be `hvc1`, not `hev1`; Safari rejects `hev1`.
  3. *(optional)* WebM VP9 — `type="video/webm; codecs=vp9,opus"`
  4. **H.264 MP4 — `type="video/mp4"` — ALWAYS present, ALWAYS last.**
- **Decision for THIS project: ship the H.264 MP4 single-source only.** Rationale: clips are short, storage is signed-URL-per-file (each extra rendition doubles signing + storage + import pipeline complexity), and H.264 is playable everywhere. Do NOT implement multi-rendition until a measured bandwidth problem exists. Keep the `<source type>` attribute accurate anyway so failed-codec fallback events fire correctly.
- **HLS/DASH: explicitly out of scope** (clips < 2 min). IF long-form training videos (> 2 min) are added later, THEN introduce HLS with `hls.js` for non-Safari + native HLS on Safari — as a separate phase, never retrofitted into `VideoWatermarkFrame`.
- `canPlayType()` is only a hint (`""` / `"maybe"` / `"probably"`). NEVER hard-block rendering on it. IF `canPlayType('video/mp4') === ""` (effectively never on targets), THEN show the existing `VideoOff` error panel with retry guidance.

### 1.3 Source failure semantics (implementation contract)

- IF the last `<source>` fails to load, the browser fires `error` on the **`<source>` element** (not the `<video>`), and `video.error` may stay null. The implementation MUST attach an `onError` to the final `<source>` element as well as the `<video>` element.
- IF `video.error.code === MEDIA_ERR_SRC_NOT_SUPPORTED (4)`, THEN treat as permanent for this URL → error panel, no retry loop.
- IF `MEDIA_ERR_DECODE (3)`, THEN attempt exactly ONE `video.load()` retry (transient decoder glitches on Android after backgrounding are common); on second failure show error panel.
- IF `MEDIA_ERR_NETWORK (2)`, THEN enter the network-retry state machine of §4.3 (signed URL may have expired).

---

## 2. Mobile & Browser Autoplay Policies

### 2.1 The rules per platform (facts the logic must encode)

- **iOS Safari (and every iOS browser — all are WebKit):**
  - Autoplay is allowed ONLY if the video is `muted` (or has no audio track) AND has `playsinline`.
  - `video.play()` with audible sound outside a user gesture rejects with `NotAllowedError`.
  - A "user gesture" token is consumed by the first `play()`; an `await fetch(...)` between the tap and `play()` can invalidate the gesture on older iOS. THEREFORE: on tap, call `play()` synchronously in the event handler when a source is already set; the signed URL must already be prefetched (§4.1).
  - **Low Power Mode (and Screen Time / "Auto-Play video previews off"): ALL autoplay is blocked, even muted+inline.** There is NO API to detect Low Power Mode. The ONLY reliable signal is: `play()` returns a rejected promise (`NotAllowedError`) or resolves while `video.paused === true`.
- **Android Chrome:**
  - Muted + `playsinline` autoplay: always allowed.
  - Audible autoplay: allowed only with sufficiently high Media Engagement Index or after a gesture — treat as "never allowed" architecturally.
  - **Data Saver / Lite mode can block autoplay entirely** → same fallback path as iOS Low Power Mode.
- **Firefox (desktop + Android):** blocks audible autoplay by default; muted autoplay allowed. Users can block ALL autoplay in settings → must survive rejection.
- **Desktop Safari:** per-site autoplay preferences ("Stop Media with Sound" default) → audible autoplay may reject even on macOS.
- **Edge/Chrome desktop:** same model as Android Chrome minus Data Saver.

### 2.2 Required autoplay algorithm (extends `shouldAutoplayExerciseVideo()`)

Current code disables autoplay wholesale on iOS. Replace with an **attempt-then-fallback** model — never assume, always verify:

1. IF `autoPlay` prop is true, THEN render `<video muted playsInline autoplay …>` regardless of platform. (`muted` MUST be set as a DOM property/attribute before source load — React's `muted` prop has a known SSR/attribute quirk; set `video.muted = true` imperatively in a ref callback as well.)
2. On `canplay` (or immediately if `readyState >= HAVE_FUTURE_DATA`), call `const p = video.play()`.
3. `p` handling (MANDATORY pattern everywhere `play()` is called):
   - Store the pending promise; NEVER call `pause()` while a `play()` promise is pending (causes `AbortError: The play() request was interrupted` and can wedge Chrome's media pipeline). Queue the pause until the promise settles.
   - IF resolved AND `!video.paused` → playing; hide overlay.
   - IF rejected with `NotAllowedError` OR resolved-but-paused → **autoplay-blocked state**: keep poster visible, show the center play-button overlay (already exists as `showCenterPlay` in `VideoCustomControls`), do NOT show an error, do NOT retry automatically (retrying without a gesture will reject again and can spam the console).
   - IF rejected with `AbortError` → benign (source changed / element removed); ignore.
   - IF rejected with `NotSupportedError` → route to §1.3 source-failure handling.
4. On the user's tap of the overlay: run `recoverIosVideoPlayback(video)` (existing util — keeps its load()+timeout metadata recovery), which is a gesture-context `play()`.
5. Loop behavior: keep the existing `ended → currentTime=0 → play()` handler, but the replay `play()` must also go through the promise-guard of step 3 (Low Power Mode can block the *re*-play even after a successful gesture-initiated first play, if the tab was backgrounded in between).
6. IF the page/tab is hidden (`document.visibilityState === 'hidden'`), THEN do not attempt autoplay; attempt once on `visibilitychange → visible` (iOS kills decoders of hidden tabs; a play() there rejects or plays audio-only).

### 2.3 Fallback UI/UX contract

- Poster (`getExerciseThumbUrl`) MUST be set on the `<video>` so a blocked autoplay is indistinguishable from a paused video — never a black rectangle.
- The blocked-state overlay: full-surface tap target (whole video area, not a 44px icon), `aria-label="Videoyu oynat"`, play glyph ≥ 64px. This already exists; the rule is it must appear on **verified** block (step 3), not on platform guess.
- Sound: exercise clips play muted by default everywhere. IF audible playback is ever needed, THEN unmute ONLY inside a user-gesture handler (`video.muted = false` in the tap handler — allowed), never programmatically.

---

## 3. Cross-Browser Quirks & UI Inconsistencies

### 3.1 Inline playback (`playsInline`)

- Every `<video>` MUST carry: React `playsInline` prop **and** the legacy attribute `webkit-playsinline` (for iOS 9 WebViews / older embedded browsers). Without it, iOS hijacks playback into the native fullscreen player, escaping the watermark frame and custom controls.
- YouTube iframes: keep `playsinline: '1'` in the embed params (already done in `youTubeEmbedSrc`).

### 3.2 Fullscreen — three incompatible worlds, one state machine

Facts:

- **Desktop (Chrome/Edge/Firefox/Safari ≥ 16.4):** `element.requestFullscreen()` on the wrapper `<div>` works. Older desktop Safari needs `webkitRequestFullscreen` and `webkitfullscreenchange`/`webkitFullscreenElement`.
- **iPhone Safari:** `requestFullscreen` does NOT exist on arbitrary elements (iPadOS partially does). The ONLY native fullscreen is `video.webkitEnterFullscreen()` — the system player. It ignores CSS overlays: **watermark and custom controls disappear** inside it. Exit is signaled by `webkitendfullscreen`.
- **Android Chrome:** element fullscreen works; entering fullscreen on a landscape video may auto-rotate; `screen.orientation.lock('landscape')` is best-effort (throws in non-fullscreen; wrap in try/catch, never await-block on it).

Required state machine (this is what `VideoWatermarkFrame` already approximates — keep and harden):

- One derived boolean `isExpanded` with exactly three mutually exclusive strategies chosen at mount:
  - `useIosNativeExpand` (iOS): prefer `video.webkitEnterFullscreen()`; IF unavailable (rare WebViews) THEN pseudo-fullscreen.
  - `usePseudoMode` (no element-fullscreen support, non-iOS): portal the frame to `document.body`, `position: fixed; inset: 0; height: 100dvh; z-index` above app chrome, `body { overflow: hidden }`.
  - native element fullscreen otherwise.
- State MUST be read from the DOM (event-driven), never assumed: listen to `fullscreenchange` + `webkitfullscreenchange` on `document`, and `webkitbeginfullscreen`/`webkitendfullscreen` on the video. The user can exit via Esc / system gesture — button-toggled local state alone WILL desync.
- **Portal side-effect rule:** moving a playing `<video>` across the DOM (pseudo-fullscreen portal) resets playback in some browsers. On portal enter/exit: snapshot `currentTime` + `paused`, restore after two `requestAnimationFrame`s, replay via the §2.2 promise-guard (existing effect — keep).
- **Desktop watermark protection rule:** if the browser puts the raw `<video>` element into fullscreen (double-click, native control), immediately exit and re-enter fullscreen on the wrapper div so the watermark stays visible (existing `redirectNativeVideoFullscreen` — keep).
- iOS native fullscreen watermark loss is ACCEPTED (documented trade-off; blob-hiding alternatives are forbidden per §0).
- Keyboard: IF native fullscreen active THEN Esc is handled by the browser; IF pseudo-fullscreen THEN the component MUST handle `keydown Escape` itself to exit.

### 3.3 Notch / safe-area handling (fullscreen + pseudo-fullscreen)

- `index.html` viewport meta MUST include `viewport-fit=cover` (verify; without it `env(safe-area-inset-*)` is always 0 on iOS).
- Pseudo-fullscreen frame: use `height: 100dvh` (NOT `100vh` — iOS Safari's collapsing URL bar makes `100vh` overflow and hides bottom controls behind the home indicator).
- Custom control bar bottom padding: `padding-bottom: max(0.75rem, env(safe-area-inset-bottom))` so the seek bar isn't under the home indicator; in landscape, left/right controls need `env(safe-area-inset-left/right)` so the notch doesn't cover the time display.
- The video itself letterboxes with `object-fit: contain` on a black background — the notch overlapping black bars is fine; the notch overlapping CONTROLS is not.
- Android display cutouts: same `env()` variables apply in fullscreen when `viewport-fit=cover`; no separate code path.

---

## 4. Network & Performance Edge Cases

### 4.1 Signed-URL lifecycle (project-specific — highest priority)

- URLs expire in **15 minutes**. Two failure modes the player MUST survive:
  - **Expiry before first byte:** user opens modal, backgrounds the tab 20 min, returns, taps play → 403 → `MEDIA_ERR_NETWORK` or stalled `networkState = NETWORK_NO_SOURCE`.
  - **Expiry mid-session:** video is paused/parked, user seeks to an unbuffered range after expiry → range request 403s → `error` or infinite `waiting`.
- Rule: on any network-class failure (§4.3), the recovery path is: `readExerciseVideoUrlCache(storagePath)` → IF stale/absent THEN `getExerciseVideoUrl(storagePath)` (fresh signature) → set new `src` → `video.load()` → restore `currentTime` → gesture-safe replay. Maximum 2 automatic re-sign attempts per playback session, THEN error panel ("oturumunuzun açık olduğundan emin olun…" — exists).
- Prefetch contract (keep from current architecture): signed URL is requested on `pointerenter`/`pointerdown` of the card (`prefetchExerciseVideo`), so the modal's `play()` never awaits network inside the gesture (§2.1 gesture-token rule).

### 4.2 Mandatory event listeners and their exact semantics

Attach ALL of these on the playing `<video>` (single effect, single cleanup):

- `waiting` → playback stopped for data. START a **stall watchdog**: show buffering spinner immediately; IF still not `playing` after 10 s, escalate to §4.3 recovery.
- `playing` / `canplay` → clear spinner, reset watchdog, reset retry counter on 30 s of healthy playback.
- `stalled` → fetch stopped mid-download. On iOS this fires spuriously; do NOT show UI for it alone. IF `stalled` AND `readyState < HAVE_FUTURE_DATA` AND no progress for 10 s THEN treat as `waiting` escalation.
- `suspend` → browser intentionally paused download (normal after buffering ahead, and **normal on iOS with `preload="metadata"`**). NEVER treat as an error. Existing iOS behavior to keep: IF `suspend`/`stalled` fires while `readyState < HAVE_METADATA`, debounce 400 ms then `video.load()` (Safari's suspended-before-metadata wedge — `recoverIosVideoPlayback` / prime effect).
- `error` → dispatch on `video.error.code` per §1.3; code 2 (or null error after a `<source>` error) → §4.3.
- `abort` / `emptied` → benign teardown signals (source swap, unload); reset internal state, no UI.
- `progress` + `timeupdate` → feed the watchdog ("is data/time advancing?"). The watchdog is the safety net for the cases WebKit fails to fire `waiting` (documented Safari gap): IF `!video.paused` AND `currentTime` unchanged for 3+ s THEN behave as if `waiting` fired.
- `window online`/`offline` → IF `offline` THEN pause watchdog and show non-blocking "bağlantı koptu" hint; IF `online` THEN immediately run one §4.3 recovery cycle.

### 4.3 Network-drop recovery state machine

```
PLAYING → (waiting >10s | stalled+no-progress | error code 2 | online-after-offline)
  → RECOVERING:
      1. snapshot t = video.currentTime
      2. refresh signed URL if cache-stale (§4.1)
      3. video.load(); on loadedmetadata: video.currentTime = t
      4. play() via promise-guard (§2.2)
      → success → PLAYING (increment recovery counter)
      → failure OR counter > 2 → FAILED (error panel + manual "Tekrar dene" button
        that resets the counter — a user gesture, so it also re-arms iOS playback)
```

- All retries use exponential backoff (1 s, 4 s) to avoid hammering Supabase on real outages.
- NEVER auto-recover while `document.visibilityState === 'hidden'`; defer to `visibilitychange`.

### 4.4 Memory & low-end-device rules

- **Teardown contract (component unmount / modal close) — every step, in order:**
  1. `video.pause()`
  2. remove all listeners (single cleanup function)
  3. `video.removeAttribute('src')`; ALSO remove/clear child `<source>` elements
  4. `video.load()` — this is the documented way to force the browser to release the decoder + network buffers; skipping it leaks decoder instances on iOS/Android until GC, and iOS has a hard cap (~3–4 simultaneous decode pipelines → new videos silently fail to play).
- Object URLs: the playback path uses signed HTTPS URLs (no blobs — §0). The ONLY `URL.createObjectURL` usage allowed is the admin-upload thumbnail capture; that code MUST `URL.revokeObjectURL` in a `finally` block.
- Concurrency: at most **ONE** mounted playing `<video>` at any time (modal player). Thumbnails are `<img>` only (Faz 1 rule) — never regress this. If a second player context appears (e.g. admin preview + modal), pause+teardown the first.
- `preload` policy (existing `exerciseVideoPreload()` — keep): iOS → `"metadata"` (iOS ignores/abuses `"auto"`); desktop autoplay → `"auto"`; URL-not-yet-signed placeholder video → `"none"`.
- Low-end Android: do not attach `timeupdate`-driven React state updates at full rate to large trees — the custom controls component must own that state locally (already isolated in `VideoCustomControls`; keep it that way, never lift `currentTime` into page state).
- `key={playUrl}` remount on URL change is acceptable ONLY because teardown contract above runs in the unmounting instance's cleanup.

---

## 5. Accessibility & UX Mandates

### 5.1 Keyboard navigation (custom-controls mode)

Handle `keydown` on the player frame (frame gets `tabIndex={0}` when custom controls are active); ignore events whose target is an input outside the player:

- `Space` / `k` → toggle play/pause (preventDefault to stop page scroll). MUST route through the §2.2 promise-guard.
- `ArrowLeft` / `ArrowRight` → seek −5 s / +5 s (clamped `[0, duration]`).
- `ArrowUp` / `ArrowDown` when volume UI exists → volume ±10%; otherwise unbound.
- `Home` / `End` → seek to 0 / duration.
- `f` → toggle fullscreen (same `toggleExpand` path); `Escape` → exit pseudo-fullscreen (§3.2).
- `m` → toggle mute (if audio tracks exist).
- All shortcuts are inert when native controls mode is active (browser owns them there).

### 5.2 ARIA / screen readers

- Frame: `role="region"` + `aria-label` = exercise name + "video oynatıcı" (pass the exercise title into the player as a prop; the current generic frame has no accessible name).
- Play/pause button: dynamic `aria-label` (`"Oynat"`/`"Duraklat"` — exists) AND `aria-pressed` is NOT appropriate; keep it a plain toggle-label button.
- Seek slider: keep native `<input type="range">` (correct choice — free keyboard + SR semantics). Add `aria-valuemin/max` implicit via min/max, plus `aria-valuetext` = `"1:23 / 3:00"` updated on change so VoiceOver doesn't read raw percentages.
- Buffering/error announcements: one visually-hidden `aria-live="polite"` region inside the frame announcing state transitions: "Video yükleniyor", "Video duraklatıldı", "Bağlantı sorunu, yeniden deneniyor", "Video oynatılamadı". Never `aria-live="assertive"`.
- Fullscreen button: dynamic `aria-label` (`"Tam ekran"` / `"Tam ekrandan çık"` — exists).
- Watermark `<img>`: `alt=""` + `aria-hidden="true"` (exists — keep).
- The autoplay-blocked overlay button MUST be focusable and be the first focusable element in the frame.

### 5.3 Focus & modal integration

- IF the player lives in a modal (`ExerciseDetailModal`), THEN on open, focus moves to the modal per existing modal rules; the player frame must be reachable by Tab and must NOT auto-steal focus (autoplaying muted video + focus theft is disorienting for SR users).
- On pseudo-fullscreen enter: move focus to the player frame; on exit: restore focus to the toggle button. Trap Tab inside the pseudo-fullscreen portal while active.

### 5.4 Motion & data preferences

- IF `matchMedia('(prefers-reduced-motion: reduce)')` matches, THEN disable autoplay (treat as autoplay-blocked → poster + play overlay). Loop replay still allowed after an explicit user play.
- IF `navigator.connection?.saveData === true` (Chrome/Android only), THEN force `preload="none"` and disable autoplay — same fallback UI. Absence of the API means "no signal", not "no save-data".

### 5.5 Touch ergonomics

- All interactive controls ≥ 44×44 px hit area (current 36 px buttons: extend hit area with padding/pseudo-element, visual size may stay).
- Range input thumb: enlarge the touch target via `[&::-webkit-slider-thumb]` height trick or an invisible taller overlay; a 6 px-tall track is not draggable on mobile as-is.
- Keep `touch-pan-y` on the video element (exists) so vertical page scroll is not eaten by the video surface.

---

## 6. Acceptance Test Matrix (verify after implementation)

| # | Scenario | Expected |
|---|----------|----------|
| 1 | iPhone, Low Power Mode ON, open modal | Poster + play overlay, no error, no console spam; tap → plays |
| 2 | iPhone, normal mode | Muted inline autoplay works; no fullscreen hijack |
| 3 | Android Chrome, Data Saver ON | Same as #1 |
| 4 | Desktop Chrome, open modal after URL prefetch | First frame < 300 ms; no `AbortError` in console |
| 5 | Pause video, wait 16 min, seek forward | Silent re-sign + resume at seek point (≤ 2 auto retries) |
| 6 | Kill Wi-Fi mid-play, restore after 30 s | Spinner + "bağlantı koptu" hint → auto-resume on restore |
| 7 | Open/close modal 10× on low-end Android | No accumulating decoder errors; heap stable (teardown §4.4) |
| 8 | Esc / system gesture exits fullscreen | `isExpanded` state resyncs; controls/watermark correct |
| 9 | iPhone landscape fullscreen (pseudo path on non-iOS notch devices) | Controls not under notch/home indicator |
| 10 | Keyboard only: Tab into player, Space, arrows, f, Esc | All work; VoiceOver/NVDA announces state changes |
| 11 | `prefers-reduced-motion: reduce` | No autoplay; overlay play works |
| 12 | Legacy `.mov` entry in DB | Plays on Safari/Chrome; Firefox shows error panel, not a black box |
