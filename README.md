# Fun Quest (Python + Shared Redis State)

This version is optimized for a shared multiplayer session.

- Admin sees all players on the same deployed link.
- Leaderboard is shared for everyone.
- Works locally with in-memory state.
- Works on Vercel reliably when Redis is configured.

## Tech used

- Backend: Python (Flask)
- Frontend: HTML/CSS/JS
- Shared state for production: Redis (Vercel KV / Upstash)

## Local run (no Redis required)

```powershell
cd P:\Game
py -m pip install -r requirements.txt
py server.py
```

Open:

- Player: `http://localhost:3000`
- Admin: `http://localhost:3000/admin.html`

Default admin code: `admin123`

## Production-ready shared session setup (Vercel)

1. Create/connect Vercel KV (Upstash Redis).
2. Add environment variables in Vercel project:
   - `REDIS_URL` (preferred), or `KV_URL`
   - `ADMIN_CODE` (custom admin code)
   - Optional: `STATE_KEY` (default is `funquest:state:v1`)
3. Deploy.

When `REDIS_URL` (or `KV_URL`) is present, all instances share one game state, so admin/player visibility stays consistent.

## Current game behavior

- 5-minute timer per question (display only; does not auto-next)
- Admin-only controls: start, reveal, next, mark
- One submission per question per player
- Live updates via 1-second polling

