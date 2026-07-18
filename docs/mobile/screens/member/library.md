# Member — Library (IMPLEMENTATION LOCK)

- **Expo:** `/(member)/library`
- **Web:** `/library` → `ExerciseLibraryPage.jsx` + `useExerciseLibrary` + `exerciseLibrary.js`
- **Priority:** P0
- **Skill:** `yeniform-media-exercises`

---

## Access

- List metadata: available per plan (limited vs full via `hasFullVideoAccess`)
- Playback always via signed URL rules in `domains/video-media.md`
- `video_pending` → no sign; placeholder UI

## Filters (yalnızca web’dekiler)

Search text, category, difficulty, body part / target, equipment, **locations** (`home`|`gym`|`office`), **requires_machine**.  
Default sort A→Z. **Do not add sort UI** (web removed it).

Mobile < sm: filter panel collapsed; header tap toggles; show active filter count (web parity).

## List row

- Left: `ExerciseVideoThumbnail` static webp (`getExerciseThumbUrl`)
- Title: exercise **English name as stored** (do not auto-translate names)
- Tap row → detail modal (`ExerciseDetailModal` parity)
- Play → resolve signed URL → player

## Signed URL

1. Client `createSignedUrl` on path  
2. Fallback `POST /api/auth` `{ action:'exercise-video-url', path }`  
3. TTL 15 minutes; prefetch on press-in  

## Acceptance

- [ ] No public permanent video URLs stored/used  
- [ ] Filter set matches web  
- [ ] Thumb webp only for list (no video mount for thumbs)  
- [ ] Full vs limited library UX respects membership gate  
