# Debate MVP

A full-stack competitive debate platform using Next.js (React), Tailwind CSS, shadcn UI, Supabase backend, and placeholder video integration. Features structured debate rounds, user profiles, debate history, and moderation endpoints. Future integration for speech-to-text and GPT judging.

## Features
- User authentication (Supabase)
- Debate matching and state (Supabase real-time)
- Structured debate rounds (opening, rebuttal, closing)
- Video (Daily.co or placeholder)
- Timer component
- User profiles and debate history
- Moderation/reporting endpoints
- Placeholder for speech-to-text and GPT judging

## Getting Started
1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and set Supabase variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
3. Run the SQL in `supabase_match_queue.sql` in the Supabase SQL Editor, then enable Realtime for the `match_queue` table (Database → Replication).
4. Run the development server: `npm run dev`

### Video calls (WebRTC)
When two users are matched, they join the same debate room. Video/audio uses **WebRTC** with **Supabase Realtime** for signaling—no third-party video service or API key required. Both participants see and hear each other peer-to-peer. Camera and microphone permission is requested when entering the debate room.

## Folder Structure
- `/pages` - Next.js routes
- `/components` - React components (UI, Timer, Video, etc.)
- `/lib` - Supabase client, API helpers
- `/styles` - Tailwind CSS
- `/api` - Backend API routes (debate logic, moderation)
- `/types` - TypeScript types
- `/public` - Static assets

## Notes
- Replace video placeholder with Daily.co/Agora/Twilio integration
- Add speech-to-text and GPT judging in future sprints
- See `.env.example` for required environment variables
