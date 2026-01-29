import { NextRequest, NextResponse } from "next/server";

const DAILY_API_BASE = "https://api.daily.co/v1";
const JITSI_BASE = "https://meet.jit.si";

/**
 * GET /api/meeting?matchId=xxx
 * Returns a video meeting URL for this debate match so both participants join the same room.
 * - If DAILY_API_KEY is set: uses Daily.co (requires payment method in Daily dashboard).
 * - Otherwise: uses Jitsi Meet (free, no API key or payment).
 */
export async function GET(request: NextRequest) {
  const matchId = request.nextUrl.searchParams.get("matchId");
  if (!matchId || typeof matchId !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid matchId" },
      { status: 400 }
    );
  }

  // Safe room name: letters, numbers, dash (works for Daily and Jitsi)
  const safeName = `debate-${matchId.replace(/[^A-Za-z0-9_-]/g, "-")}`.slice(0, 128);

  const apiKey = process.env.DAILY_API_KEY;

  // No Daily key: use Jitsi Meet (free, no signup or payment)
  if (!apiKey) {
    const jitsiUrl = `${JITSI_BASE}/${encodeURIComponent(safeName)}`;
    return NextResponse.json({ url: jitsiUrl });
  }

  // Daily.co: create or get room
  try {
    const getRes = await fetch(`${DAILY_API_BASE}/rooms/${encodeURIComponent(safeName)}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (getRes.ok) {
      const room = await getRes.json();
      return NextResponse.json({ url: room.url });
    }

    if (getRes.status !== 404) {
      const err = await getRes.text();
      console.error("Daily get room error:", getRes.status, err);
      return NextResponse.json(
        { error: "Failed to get meeting room" },
        { status: 502 }
      );
    }

    const exp = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
    const createRes = await fetch(`${DAILY_API_BASE}/rooms`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: safeName,
        privacy: "private",
        properties: {
          exp,
          enable_chat: true,
          enable_screenshare: true,
        },
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      console.error("Daily create room error:", createRes.status, err);
      return NextResponse.json(
        { error: "Failed to create meeting room" },
        { status: 502 }
      );
    }

    const room = await createRes.json();
    return NextResponse.json({ url: room.url });
  } catch (e) {
    console.error("Meeting API error:", e);
    return NextResponse.json(
      { error: "Meeting service error" },
      { status: 500 }
    );
  }
}
