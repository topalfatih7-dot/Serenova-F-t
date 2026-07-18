# Media & Exercises — Reference

## Key files

- `src/services/supabaseDb.js` — `getExerciseVideoUrl`, `prefetchExerciseVideoUrls`, `getExerciseThumbUrl`, `uploadExerciseVideo`
- `src/components/ui/VideoPlayer.jsx`, `ExerciseVideoThumbnail.jsx`
- `src/pages/ExerciseLibraryPage.jsx`, `hooks/useExerciseLibrary.js`
- `src/services/exerciseLibrary.js`
- `docs/VIDEO_LATENCY_AND_PLAYBACK_RUNBOOK.md`, `docs/VIDEO_PLAYER_IOS_FULLSCREEN.md`

## Encode contract (§1.1)

MP4 H.264, yuv420p, ≤1280w, CRF ~28, no audio, `+faststart`. See exercise-import rule.
