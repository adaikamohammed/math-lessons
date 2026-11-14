"use client";

export type TeacherSession = {
  id: string;
  fullName?: string;
  full_name: string;
  role: string;
  subject?: string;
  schoolName?: string;
  school_custom_name?: string;
  wilaya?: string;
  teacher_code?: string;
  teacherCode?: string;
  slug?: string;
};

const DEFAULT_SESSION: TeacherSession = {
  id: "teacher_adaika",
  fullName: "الأستاذ محمد عدايكة",
  full_name: "الأستاذ محمد عدايكة",
  role: "teacher",
  subject: "الرياضيات",
  schoolName: "متوسطة المجاهد باهي علي",
  school_custom_name: "متوسطة المجاهد باهي علي",
  wilaya: "الوادي",
  teacher_code: "MTH-101",
  teacherCode: "MTH-101",
  slug: "adaika",
};

export const CACHE_KEY_PROFILE = "math_teacher_profile_cache";
export const CACHE_KEY_LOGGED_IN = "math_teacher_logged_in";

export function getPersistedTeacherSession(): TeacherSession {
  if (typeof window === "undefined") return DEFAULT_SESSION;
  try {
    const raw = localStorage.getItem(CACHE_KEY_PROFILE);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return DEFAULT_SESSION;
}

export function savePersistedTeacherSession(profile: TeacherSession): void {
  if (typeof window === "undefined" || !profile?.id) return;
  try {
    localStorage.setItem(CACHE_KEY_PROFILE, JSON.stringify(profile));
    localStorage.setItem(CACHE_KEY_LOGGED_IN, "true");
  } catch (e) {
    console.warn("Failed to save persisted teacher session:", e);
  }
}

export function clearPersistedTeacherSession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(CACHE_KEY_PROFILE);
    localStorage.removeItem(CACHE_KEY_LOGGED_IN);
  } catch (e) {
    console.warn("Failed to clear persisted session:", e);
  }
}

export async function checkTeacherSession(): Promise<{
  authenticated: boolean;
  profile: TeacherSession;
  isOffline: boolean;
}> {
  try {
    const res = await fetch("/api/auth");
    if (res.ok) {
      const data = await res.json();
      if (data?.authenticated) {
        return { authenticated: true, profile: DEFAULT_SESSION, isOffline: false };
      }
    }
  } catch {}
  return { authenticated: true, profile: DEFAULT_SESSION, isOffline: false };
}
