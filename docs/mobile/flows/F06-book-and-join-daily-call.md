# F06 — Book & Join Daily Call

1. Schedule tab shows coach/dietitian/doctor sessions  
2. Join when session window open → navigate `call/:sessionType/:sessionId`  
3. `POST /api/daily-room` with Bearer → `{ roomUrl, token }`  
4. Daily RN join; mic/camera permissions  
5. Attendance tracking if web has `sessionAttendance` parity  

Errors: 401, Daily key missing, room expired. Max 4 participants; token ~1h.
