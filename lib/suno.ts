// Shared types + constants for the Suno API integration.
// The API base URL is public; the API KEY is read only in server route handlers.

export const SUNO_BASE = "https://api.sunoapi.org/api/v1";

export type SunoModel = "V4" | "V4_5" | "V4_5PLUS" | "V4_5ALL" | "V5" | "V5_5";

// Raw track shape returned by the Suno record-info endpoint.
export interface SunoTrack {
  id: string;
  audioUrl: string | null;
  streamAudioUrl: string | null;
  imageUrl: string | null;
  title: string | null;
  tags: string | null;
  duration: number | null;
}

// Task statuses per the Suno docs.
export type SunoStatus =
  | "PENDING"
  | "TEXT_SUCCESS"
  | "FIRST_SUCCESS"
  | "SUCCESS"
  | "CREATE_TASK_FAILED"
  | "GENERATE_AUDIO_FAILED"
  | "CALLBACK_EXCEPTION"
  | "SENSITIVE_WORD_ERROR"
  | "ERROR";

export const FAILURE_STATUSES: SunoStatus[] = [
  "CREATE_TASK_FAILED",
  "GENERATE_AUDIO_FAILED",
  "CALLBACK_EXCEPTION",
  "SENSITIVE_WORD_ERROR",
  "ERROR",
];

// Friendly labels for each status, shown to the user while polling.
export const STATUS_LABEL: Record<string, string> = {
  PENDING: "Warming up the studio…",
  TEXT_SUCCESS: "Writing the song…",
  FIRST_SUCCESS: "First track is ready — finishing the rest…",
  SUCCESS: "Done!",
  CREATE_TASK_FAILED: "Could not start the task.",
  GENERATE_AUDIO_FAILED: "Audio generation failed.",
  CALLBACK_EXCEPTION: "A processing error occurred.",
  SENSITIVE_WORD_ERROR: "Your prompt contained blocked content.",
  ERROR: "Something went wrong.",
};
