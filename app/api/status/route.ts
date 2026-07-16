import { NextResponse } from "next/server";
import { SUNO_BASE, type SunoTrack } from "@/lib/suno";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/status?taskId=...
// Polls Suno's record-info endpoint and returns a normalized status + tracks.
export async function GET(req: Request) {
  const apiKey = process.env.SUNO_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Server is missing SUNO_API_KEY." }, { status: 500 });
  }

  const taskId = new URL(req.url).searchParams.get("taskId");
  if (!taskId) {
    return NextResponse.json({ error: "Missing taskId." }, { status: 400 });
  }

  try {
    const res = await fetch(
      `${SUNO_BASE}/generate/record-info?taskId=${encodeURIComponent(taskId)}`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        cache: "no-store",
      }
    );

    const data = await res.json().catch(() => null);

    if (!data || data.code !== 200 || !data.data) {
      const msg = data?.msg || `Suno API error (HTTP ${res.status}).`;
      return NextResponse.json({ status: "ERROR", error: msg, tracks: [] }, { status: 200 });
    }

    const d = data.data;
    const rawTracks: any[] = d?.response?.sunoData ?? [];
    const tracks: SunoTrack[] = rawTracks.map((t) => ({
      id: t?.id ?? "",
      audioUrl: t?.audioUrl ?? null,
      streamAudioUrl: t?.streamAudioUrl ?? null,
      imageUrl: t?.imageUrl ?? null,
      title: t?.title ?? null,
      tags: t?.tags ?? null,
      duration: typeof t?.duration === "number" ? t.duration : null,
    }));

    return NextResponse.json({
      status: d.status ?? "PENDING",
      errorMessage: d.errorMessage ?? null,
      tracks,
    });
  } catch {
    // Transient network error — report as pending so the client keeps polling.
    return NextResponse.json({ status: "PENDING", tracks: [] });
  }
}
