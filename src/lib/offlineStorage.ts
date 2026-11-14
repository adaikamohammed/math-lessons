"use client";

import type { LessonsData } from "./types";

export const STORAGE_KEY = (teacherId: string = "current") => `math_offline_data_${teacherId}`;

/**
 * استرجاع بيانات الأستاذ الكاملة المخزنة محلياً في جهازه
 */
export function getTeacherOfflineData(teacherId: string = "current"): LessonsData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY(teacherId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return parsed as LessonsData;
    }
  } catch (err) {
    console.warn("Failed to parse local teacher data:", err);
  }
  return null;
}

/**
 * حفظ وتحديث بيانات الأستاذ محلياً وسحابياً
 */
export function saveTeacherOfflineData(
  teacherId: string = "current",
  updates: Partial<LessonsData>,
  markPending: boolean = true
): LessonsData {
  if (typeof window === "undefined") {
    return { lessons: [], ...(updates as any) };
  }

  const existing = getTeacherOfflineData(teacherId) || { lessons: [] };
  const merged: LessonsData = {
    ...existing,
    ...updates,
  };

  try {
    localStorage.setItem(STORAGE_KEY(teacherId), JSON.stringify(merged));
  } catch (err) {
    console.warn("LocalStorage quota exceeded:", err);
  }

  // حفظ سحابي تلقائي عبر /api/gradebook
  if (updates.studentRoster || updates.gradebookRecords || updates.customClasses || updates.continuousEvalConfig) {
    fetch("/api/gradebook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roster: updates.studentRoster || merged.studentRoster,
        records: updates.gradebookRecords || merged.gradebookRecords,
        customClasses: updates.customClasses || merged.customClasses,
        continuousEvalConfig: updates.continuousEvalConfig || merged.continuousEvalConfig,
      }),
    }).catch((e) => console.warn("Failed to auto-sync gradebook to server:", e));
  }

  return merged;
}

export function cacheServerDataLocally(teacherId: string = "current", serverData: LessonsData): void {
  if (typeof window === "undefined" || !serverData) return;
  try {
    localStorage.setItem(STORAGE_KEY(teacherId), JSON.stringify(serverData));
  } catch (err) {
    console.warn("Failed to cache server data locally:", err);
  }
}

export function setupAutoSync(teacherId: string = "current", callback?: (success: boolean) => void): () => void {
  // مزامنة دورية خفيفة
  const interval = setInterval(async () => {
    try {
      const res = await fetch("/api/gradebook");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          cacheServerDataLocally(teacherId, {
            lessons: [],
            studentRoster: data.roster,
            gradebookRecords: data.records,
            customClasses: data.customClasses,
            continuousEvalConfig: data.continuousEvalConfig,
          });
          if (callback) callback(true);
        }
      }
    } catch {
      if (callback) callback(false);
    }
  }, 60000);

  return () => clearInterval(interval);
}
