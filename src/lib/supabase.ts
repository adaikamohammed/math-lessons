import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isConfigured = Boolean(url && key);

export const supabase = createClient(url || "http://localhost", key || "anon");

export const BUCKET = "lesson-images";

export type Lesson = {
  id: string;
  level: 1 | 2;
  number: number;
  title: string;
  created_at: string;
};

export type LessonImage = {
  id: string;
  lesson_id: string;
  path: string;
  position: number;
};

export const LEVELS = {
  1: { label: "السنة الأولى متوسط", short: "1 متوسط" },
  2: { label: "السنة الثانية متوسط", short: "2 متوسط" },
} as const;

export function imageUrl(path: string) {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export function downloadUrl(path: string, name: string) {
  return supabase.storage.from(BUCKET).getPublicUrl(path, { download: name }).data.publicUrl;
}
