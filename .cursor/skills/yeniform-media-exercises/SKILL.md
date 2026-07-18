---
name: yeniform-media-exercises
description: >-
  Handles Yeni Form exercise library media: private video storage, 15-minute
  signed URLs, public webp thumbs, filters, and playback. Use when working on
  egzersiz kütüphanesi, signed URL, thumbnail, video_pending, exercise-videos,
  or library filters (location, machine).
---

# Yeni Form Media & Exercises

## Non-negotiable security model

1. Bucket `exercise-videos` is **private**.
2. DB `exercises.video_url` stores **storage path only** (e.g. `gym100-0001.mp4`) — never permanent public URL.
3. Playback: client `createSignedUrl` (RLS) → fallback `POST /api/auth` `exercise-video-url(s)` → **15 minute** TTL.
4. If `video_pending=true`, do not request signed URL.
5. Thumbs: public `exercise-thumbs`, path = video path with `.webp` extension; derive via `getExerciseThumbUrl` — no DB column.

## Filters (member/staff library)

Search, category, difficulty, body part, equipment, **locations** (home/gym/office), **requires_machine**. Default sort A→Z.

## Full library access

Gated by `hasFullVideoAccess` (spor/vip/…); limited access on lower plans — document UX locks in screen specs.

## Related

[reference.md](reference.md) · `.cursor/rules/exercise-import.mdc` · `docs/VIDEO_*.md`
