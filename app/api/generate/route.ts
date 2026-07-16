import { NextResponse } from "next/server";
import { SUNO_BASE } from "@/lib/suno";

// Run on the Node runtime as a serverless function; never statically cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/generate
// Proxies to Suno's generate endpoint. The API key lives ONLY here (server-side).
export async function POST(req: Request) {
  const apiKey = process.env.SUNO_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server is missing SUNO_API_KEY. Set it in your environment / Netlify." },
      { status: 500 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const customMode = Boolean(body.customMode);
  const instrumental = Boolean(body.instrumental);
  const model = typeof body.model === "string" && body.model ? body.model : "V4_5";
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  const style = typeof body.style === "string" ? body.style.trim() : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";

  // Validation mirrors the Suno docs' required-field rules.
  if (!customMode) {
    if (!prompt) {
      return NextResponse.json({ error: "Please describe the song you want." }, { status: 400 });
    }
    if (prompt.length > 500) {
      return NextResponse.json(
        { error: "In simple mode the description must be 500 characters or fewer." },
        { status: 400 }
      );
    }
  } else if (instrumental) {
    if (!style || !title) {
      return NextResponse.json(
        { error: "Custom instrumental mode requires a Style and a Title." },
        { status: 400 }
      );
    }
  } else if (!style || !title || !prompt) {
    return NextResponse.json(
      { error: "Custom mode with vocals requires Style, Title, and Lyrics/Prompt." },
      { status: 400 }
    );
  }

  // Build the payload per the docs. callBackUrl is required by the API even
  // though we poll for results instead of receiving callbacks.
  const payload: Record<string, unknown> = {
    customMode,
    instrumental,
    model,
    callBackUrl: process.env.SUNO_CALLBACK_URL || "https://example.com/callback",
  };

  if (!customMode) {
    payload.prompt = prompt;
  } else {
    payload.style = style;
    payload.title = title;
    if (!instrumental) payload.prompt = prompt; // used as exact lyrics
  }

  try {
    const res = await fetch(`${SUNO_BASE}/generate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const data = await res.json().catch(() => null);

    if (!data || data.code !== 200 || !data?.data?.taskId) {
      const msg = data?.msg || `Suno API error (HTTP ${res.status}).`;
      return NextResponse.json({ error: msg, code: data?.code ?? res.status }, { status: 502 });
    }

    return NextResponse.json({ taskId: data.data.taskId });
  } catch (err) {
    return NextResponse.json(
      { error: "Could not reach the Suno API. Please try again." },
      { status: 502 }
    );
  }
}
