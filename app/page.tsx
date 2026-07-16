"use client";

import { useEffect, useRef, useState } from "react";
import {
  FAILURE_STATUSES,
  STATUS_LABEL,
  type SunoModel,
  type SunoTrack,
} from "@/lib/suno";

const MODELS: { value: SunoModel; label: string }[] = [
  { value: "V4_5", label: "V4.5 — balanced (recommended)" },
  { value: "V5", label: "V5 — latest, expressive" },
  { value: "V4_5PLUS", label: "V4.5+ — richer tones" },
  { value: "V4_5ALL", label: "V4.5 All — better structure" },
  { value: "V4", label: "V4 — clean vocals" },
];

// Poll for up to ~5 minutes (full downloadable tracks land in 2–3 min).
const POLL_INTERVAL_MS = 5000;
const MAX_POLLS = 60;

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("");
  const [title, setTitle] = useState("");
  const [model, setModel] = useState<SunoModel>("V4_5");
  const [instrumental, setInstrumental] = useState(false);
  const [customMode, setCustomMode] = useState(false);

  const [busy, setBusy] = useState(false);
  const [statusLabel, setStatusLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tracks, setTracks] = useState<SunoTrack[]>([]);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setTracks([]);
    setBusy(true);
    setStatusLabel(STATUS_LABEL.PENDING);
    stopPolling();

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, style, title, model, instrumental, customMode }),
      });
      const data = await res.json();

      if (!res.ok || !data.taskId) {
        throw new Error(data.error || "Could not start generation.");
      }

      startPolling(data.taskId);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
      setBusy(false);
      setStatusLabel(null);
    }
  }

  function startPolling(taskId: string) {
    let polls = 0;
    let gotTracks = false;

    const tick = async () => {
      polls += 1;
      try {
        const res = await fetch(`/api/status?taskId=${encodeURIComponent(taskId)}`);
        const data = await res.json();

        if (data.status && STATUS_LABEL[data.status]) {
          setStatusLabel(STATUS_LABEL[data.status]);
        }

        // Show tracks as soon as any audio is available (FIRST_SUCCESS or SUCCESS).
        if (Array.isArray(data.tracks) && data.tracks.length > 0) {
          gotTracks = true;
          setTracks(data.tracks);
        }

        if (data.status === "SUCCESS") {
          stopPolling();
          setBusy(false);
          setStatusLabel(null);
          return;
        }

        if (FAILURE_STATUSES.includes(data.status)) {
          stopPolling();
          setBusy(false);
          setStatusLabel(null);
          setError(
            data.errorMessage || STATUS_LABEL[data.status] || "Generation failed. Please try again."
          );
          return;
        }
      } catch {
        // ignore transient errors; keep polling
      }

      if (polls >= MAX_POLLS) {
        stopPolling();
        setBusy(false);
        setStatusLabel(null);
        if (!gotTracks) {
          setError("This is taking longer than expected. Please try again in a moment.");
        }
      }
    };

    // Run once immediately, then on an interval.
    tick();
    pollRef.current = setInterval(tick, POLL_INTERVAL_MS);
  }

  return (
    <main className="container">
      <div className="header">
        <span className="badge">AI Music Studio</span>
        <h1>Cadence</h1>
        <p className="subtitle">
          Describe a song in a sentence and we&apos;ll create it. No instruments required.
        </p>
      </div>

      <form className="card" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="prompt">
            {customMode && !instrumental ? "Lyrics" : "Describe your song"}{" "}
            <span className="hint">
              {customMode
                ? instrumental
                  ? "(not needed for instrumental custom mode)"
                  : "(these exact words become the lyrics)"
                : "(e.g. “an upbeat summer pop song about road trips with friends”)"}
            </span>
          </label>
          <textarea
            id="prompt"
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              customMode && !instrumental
                ? "Write the lyrics you want sung…"
                : "Describe the vibe, mood, topic, and genre…"
            }
            disabled={customMode && instrumental}
          />
        </div>

        {customMode && (
          <div className="row">
            <div className="field">
              <label htmlFor="title">Title</label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Summer Nights"
              />
            </div>
            <div className="field">
              <label htmlFor="style">Style / genre</label>
              <input
                id="style"
                type="text"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                placeholder="Pop, upbeat, guitar"
              />
            </div>
          </div>
        )}

        <div className="field">
          <label htmlFor="model">Model</label>
          <select
            id="model"
            value={model}
            onChange={(e) => setModel(e.target.value as SunoModel)}
          >
            {MODELS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field checks">
          <label className="check">
            <input
              type="checkbox"
              checked={instrumental}
              onChange={(e) => setInstrumental(e.target.checked)}
            />
            Instrumental (no vocals)
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={customMode}
              onChange={(e) => setCustomMode(e.target.checked)}
            />
            Custom mode (set title, style &amp; exact lyrics)
          </label>
        </div>

        <button className="btn" type="submit" disabled={busy}>
          {busy ? "Creating your song…" : "Create song 🎵"}
        </button>

        {statusLabel && (
          <div className="status" role="status" aria-live="polite">
            <span className="spinner" />
            {statusLabel}
          </div>
        )}

        {error && <div className="error">{error}</div>}
      </form>

      {tracks.length > 0 && (
        <section className="results" aria-label="Generated tracks">
          {tracks.map((t, i) => {
            const src = t.audioUrl || t.streamAudioUrl || "";
            return (
              <article className="track" key={t.id || i}>
                {t.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.imageUrl} alt={t.title || "Cover art"} />
                ) : (
                  <div className="track-img" />
                )}
                <div className="track-body">
                  <p className="track-title">{t.title || `Track ${i + 1}`}</p>
                  {t.tags && <p className="track-tags">{t.tags}</p>}
                  {src ? (
                    <audio controls preload="none" src={src} />
                  ) : (
                    <p className="track-tags">Preparing audio…</p>
                  )}
                  {t.audioUrl && (
                    <a className="download" href={t.audioUrl} target="_blank" rel="noreferrer">
                      ⬇ Download MP3
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      )}

      <p className="footer">
        Powered by the Suno API · Generated tracks are retained by Suno for 15 days.
      </p>
    </main>
  );
}
