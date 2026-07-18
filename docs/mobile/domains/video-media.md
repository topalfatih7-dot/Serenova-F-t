# Domain — Video & Exercise Media

## Exercise videos

1. Storage path only in DB (`gym100-0001.mp4`)
2. Private bucket `exercise-videos`
3. Signed URL TTL **15 minutes**
4. Client-first signed URL; fallback `POST /api/auth` action `exercise-video-url` / `exercise-video-urls`
5. `video_pending` → no sign request; show placeholder
6. Path validation: `^[\w.-]+$`, no `..`

## Thumbnails

- Public bucket `exercise-thumbs`
- Path: same basename `.webp`
- No DB column; `getExerciseThumbUrl(videoRef)`

## Playback UX

- List: static webp thumb
- Tap: detail modal / inline player
- Prefetch signed URL on press-in
- iOS fullscreen: follow `docs/VIDEO_PLAYER_IOS_FULLSCREEN.md` patterns in RN player

## Daily calls

Separate from exercise videos — see chat-realtime-video skill + `api/daily-room.js`.
