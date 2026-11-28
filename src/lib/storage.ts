import { createClient, SupabaseClient } from "@supabase/supabase-js";
import fs from "fs/promises";
import path from "path";
import { Lesson, LessonsData } from "./types";
import { bundledLessonsData } from "./bundledData";

const LOCAL_DATA_DIR = path.join(process.cwd(), "data");
const LOCAL_DATA_FILE = path.join(LOCAL_DATA_DIR, "lessons.json");
const LOCAL_UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hpgzmbibwewzebufczrr.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const BUCKET_NAME = "math-assets";
const FIXED_SUPABASE_DB_URL = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/lessons-db.json`;

let supabaseClientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClientInstance) return supabaseClientInstance;
  if (!SUPABASE_KEY) return null;
  supabaseClientInstance = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
  });
  return supabaseClientInstance;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_KEY);
}

// Ensure local folders exist
async function ensureLocalDirs() {
  await fs.mkdir(LOCAL_DATA_DIR, { recursive: true });
  await fs.mkdir(LOCAL_UPLOADS_DIR, { recursive: true });
}

// Mutex lock to serialize writes and prevent concurrent race conditions
let writeQueue: Promise<any> = Promise.resolve();

// كاش ذاكرة فوري لمنع قراءة بيانات قديمة من كاش CDN بعد الحفظ المباشر
let memoryCache: { data: LessonsData; timestamp: number } | null = null;

function normalizeClass(raw?: string): string {
  if (!raw) return "1م1";
  const s = raw.replace(/\s+/g, "").trim();
  if (s === "1م1" || s === "1-1" || s === "11") return "1م1";
  if (s === "1م2" || s === "2م1" || s === "1-2" || s === "12" || s === "م12") return "1م2";
  if (s === "1م3" || s === "3م1" || s === "1-3" || s === "13" || s === "م13") return "1م3";
  if (s === "2م3" || s === "3م2" || s === "2-3" || s === "23" || s === "م23") return "2م3";
  if (s.startsWith("1م") || s.endsWith("م1")) {
    if (s.includes("1")) return "1م1";
    if (s.includes("2")) return "1م2";
    if (s.includes("3")) return "1م3";
  }
  if (s.startsWith("2م") || s.endsWith("م2")) {
    return "2م3";
  }
  return s;
}

// مزامنة آمنة: قائمة التلاميذ الرسمية (studentRoster) هي المرجع الوحيد
export function synchronizeStudents(data: LessonsData): LessonsData {
  if (!data.studentRoster) data.studentRoster = [];
  if (!data.evaluations) data.evaluations = [];
  if (!data.gradebookRecords) data.gradebookRecords = [];

  // توحيد أسماء الأفواج إلى الأفواج الأربعة الرسمية
  data.studentRoster = data.studentRoster.map((r) => ({
    ...r,
    className: normalizeClass(r.className),
  }));

  const rosterKeys = new Set(
    data.studentRoster.map(
      (r) => `${(r.studentName || "").trim().toLowerCase()}_${normalizeClass(r.className)}`
    )
  );

  // إذا كانت قائمة التلاميذ تحتوي على تلاميذ: أي تلميذ حُذف منها يُحذف تلقائياً من التقييمات وسجلات النقاط
  if (data.studentRoster.length > 0) {
    data.evaluations = data.evaluations.filter((e) => {
      const key = `${(e.studentName || "").trim().toLowerCase()}_${normalizeClass(e.className)}`;
      return rosterKeys.has(key);
    });
  }

  // مزامنة التلاميذ في studentRoster إلى evaluations إن لم يكونوا مسجلين
  for (const r of data.studentRoster) {
    const rName = (r.studentName || "").trim();
    if (!rName) continue;
    const rCls = normalizeClass(r.className);
    const exists = data.evaluations.some(
      (e) =>
        (e.studentName || "").trim().toLowerCase() === rName.toLowerCase() &&
        normalizeClass(e.className) === rCls
    );
    if (!exists) {
      data.evaluations.push({
        id: `eval_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        studentName: rName,
        className: rCls,
        groupName: (r.groupName as any) || "فوج 1",
        notebookScore: 5,
        notebookComplete: true,
        homeworkScore: 5,
        homeworkDone: true,
        toolsScore: 5,
        hasTools: true,
        activityScore: 5,
        totalScore: 20,
        rating: "excellent",
        ratingColor: "emerald",
        updatedAt: new Date().toISOString(),
      });
    }
  }

  return data;
}

// ----------------- قراءة بيانات الدروس -----------------
export async function getLessonsData(): Promise<LessonsData> {
  // كاش ذاكرة فوري لتفادي تأخير كاش الـ CDN بعد الحفظ المباشر
  if (memoryCache && Date.now() - memoryCache.timestamp < 30000) {
    return JSON.parse(JSON.stringify(memoryCache.data));
  }

  const supabase = getSupabaseClient();

  // 1. القراءة من جدول Supabase Database (الأسرع والأدق عبر PostgreSQL)
  if (supabase) {
    try {
      const { data: row, error } = await supabase
        .from("math_platform_store")
        .select("data")
        .eq("id", "platform_state")
        .single();

      if (!error && row && row.data && Array.isArray(row.data.lessons) && row.data.lessons.length > 0) {
        const result = synchronizeStudents(row.data);
        memoryCache = { data: JSON.parse(JSON.stringify(result)), timestamp: Date.now() };
        ensureLocalDirs()
          .then(() => fs.writeFile(LOCAL_DATA_FILE, JSON.stringify(result, null, 2), "utf-8"))
          .catch(() => {});
        return result;
      }
    } catch (dbErr) {
      console.warn("[Storage] Supabase DB read error:", dbErr);
    }
  }

  // 2. القراءة البديلة من سلة Supabase Storage
  try {
    const res = await fetch(`${FIXED_SUPABASE_DB_URL}?_t=${Date.now()}`, {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
      },
    });

    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.lessons) && json.lessons.length > 0) {
        const rawResult: LessonsData = {
          lessons: json.lessons,
          summons: Array.isArray(json.summons) ? json.summons : [],
          honors: Array.isArray(json.honors) ? json.honors : [],
          penalties: Array.isArray(json.penalties) ? json.penalties : [],
          evaluations: Array.isArray(json.evaluations) ? json.evaluations : [],
          inspectionSessions: Array.isArray(json.inspectionSessions) ? json.inspectionSessions : [],
          studentRoster: Array.isArray(json.studentRoster) ? json.studentRoster : [],
          gradebookRecords: Array.isArray(json.gradebookRecords) ? json.gradebookRecords : [],
          parentGradebookLookup: Array.isArray(json.parentGradebookLookup) ? json.parentGradebookLookup : [],
          announcements: Array.isArray(json.announcements) ? json.announcements : [],
          anonymousMessages: Array.isArray(json.anonymousMessages) ? json.anonymousMessages : [],
          siteAnalytics: json.siteAnalytics || { totalVisits: 0 },
          rewardSubmissions: Array.isArray(json.rewardSubmissions) ? json.rewardSubmissions : [],
        };
        const result = synchronizeStudents(rawResult);
        memoryCache = { data: JSON.parse(JSON.stringify(result)), timestamp: Date.now() };
        ensureLocalDirs()
          .then(() => fs.writeFile(LOCAL_DATA_FILE, JSON.stringify(result, null, 2), "utf-8"))
          .catch(() => {});
        return result;
      }
    }
  } catch (fetchErr) {
    console.warn("[Storage] Direct Supabase storage fetch failed, trying local fallback:", fetchErr);
  }

  // 3. Local filesystem fallback
  try {
    await ensureLocalDirs();
    const data = await fs.readFile(LOCAL_DATA_FILE, "utf-8");
    const json = JSON.parse(data);
    if (Array.isArray(json.lessons) && json.lessons.length > 0) {
      const result = synchronizeStudents(json);
      memoryCache = { data: JSON.parse(JSON.stringify(result)), timestamp: Date.now() };
      return result;
    }
  } catch {
    // Local filesystem not available on serverless
  }

  // 4. Guaranteed bundled fallback (always has complete 49 lessons, 166 students, 1088 views, 116 devices, 832 visits!)
  const fallback = synchronizeStudents(JSON.parse(JSON.stringify(bundledLessonsData)));
  memoryCache = { data: JSON.parse(JSON.stringify(fallback)), timestamp: Date.now() };
  return fallback;
}

// ----------------- حفظ بيانات الدروس -----------------
async function executeSave(data: LessonsData): Promise<void> {
  synchronizeStudents(data);
  memoryCache = { data: JSON.parse(JSON.stringify(data)), timestamp: Date.now() };

  // دمج وقائي صارم لمنع فقدان الدروس أو التلاميذ عند حدوث أي خطأ في الكاش
  try {
    const existing = await getLessonsData();
    if ((!data.lessons || data.lessons.length === 0) && existing.lessons && existing.lessons.length > 0) {
      data.lessons = existing.lessons;
    }
    if ((!data.studentRoster || data.studentRoster.length === 0) && existing.studentRoster && existing.studentRoster.length > 0) {
      data.studentRoster = existing.studentRoster;
    }
    if ((!data.evaluations || data.evaluations.length === 0) && existing.evaluations && existing.evaluations.length > 0) {
      data.evaluations = existing.evaluations;
    }
    if ((!data.inspectionSessions || data.inspectionSessions.length === 0) && existing.inspectionSessions && existing.inspectionSessions.length > 0) {
      data.inspectionSessions = existing.inspectionSessions;
    }
    if ((!data.gradebookRecords || data.gradebookRecords.length === 0) && existing.gradebookRecords && existing.gradebookRecords.length > 0) {
      data.gradebookRecords = existing.gradebookRecords;
    }
    if ((!data.parentGradebookLookup || data.parentGradebookLookup.length === 0) && existing.parentGradebookLookup && existing.parentGradebookLookup.length > 0) {
      data.parentGradebookLookup = existing.parentGradebookLookup;
    }
    if (data.announcements === undefined && existing.announcements) {
      data.announcements = existing.announcements;
    }
    if (data.anonymousMessages === undefined && existing.anonymousMessages) {
      data.anonymousMessages = existing.anonymousMessages;
    }
    if (data.siteAnalytics === undefined && existing.siteAnalytics) {
      data.siteAnalytics = existing.siteAnalytics;
    }
    if (data.rewardSubmissions === undefined && existing.rewardSubmissions) {
      data.rewardSubmissions = existing.rewardSubmissions;
    }
  } catch (mergeErr) {
    console.warn("Could not merge existing data before save:", mergeErr);
  }

  synchronizeStudents(data);
  const payload = JSON.stringify(data, null, 2);

  // 1. الحفظ إلى Supabase Database & Storage
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase
        .from("math_platform_store")
        .upsert({
          id: "platform_state",
          data,
          updated_at: new Date().toISOString(),
        });
    } catch (dbSaveErr) {
      console.error("Supabase DB upsert error:", dbSaveErr);
    }

    try {
      await supabase.storage
        .from(BUCKET_NAME)
        .upload("lessons-db.json", Buffer.from(payload, "utf-8"), {
          contentType: "application/json",
          upsert: true,
        });
    } catch (saveErr) {
      console.error("Supabase Storage save error on lessons-db.json:", saveErr);
    }
  }

  // 2. حفظ نسخة محلية احتياطية
  ensureLocalDirs()
    .then(() => fs.writeFile(LOCAL_DATA_FILE, payload, "utf-8"))
    .catch(() => {});
}

export function saveLessonsData(data: LessonsData): Promise<void> {
  synchronizeStudents(data);
  memoryCache = { data: JSON.parse(JSON.stringify(data)), timestamp: Date.now() };
  const next = writeQueue.then(() => executeSave(data));
  writeQueue = next.catch(() => {});
  return next;
}

// ----------------- رفع صورة -----------------
export async function uploadImageFile(
  file: File | Blob,
  fileName: string,
  lessonId: string,
  level: number
): Promise<{ url: string; downloadUrl: string }> {
  const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const uniqueName = `${Date.now()}-${safeName}`;
  const supabase = getSupabaseClient();

  if (supabase) {
    const storagePath = `lessons/${level}/${lessonId}/${uniqueName}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = (file as any).type || "image/jpeg";

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (!error) {
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${storagePath}`;
      return {
        url: publicUrl,
        downloadUrl: publicUrl,
      };
    } else {
      console.error("Supabase upload error:", error);
    }
  }

  // Local fallback
  await ensureLocalDirs();
  const lessonUploadDir = path.join(LOCAL_UPLOADS_DIR, String(level), lessonId);
  await fs.mkdir(lessonUploadDir, { recursive: true });

  const filePath = path.join(lessonUploadDir, uniqueName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, buffer);

  const localUrl = `/uploads/${level}/${lessonId}/${uniqueName}`;
  return {
    url: localUrl,
    downloadUrl: localUrl,
  };
}

// ----------------- رفع صورة إثبات كشف النقاط لتحدي الهدايا -----------------
export async function uploadRewardProofFile(
  file: File | Blob,
  fileName: string
): Promise<{ url: string }> {
  const safeName = (fileName || "proof.jpg").replace(/[^a-zA-Z0-9.-]/g, "_");
  const uniqueName = `proof-${Date.now()}-${safeName}`;
  const supabase = getSupabaseClient();

  if (supabase) {
    const storagePath = `rewards/proofs/${uniqueName}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = (file as any).type || "image/jpeg";

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (!error) {
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${storagePath}`;
      return { url: publicUrl };
    } else {
      console.error("Supabase proof upload error:", error);
    }
  }

  // Local fallback
  await ensureLocalDirs();
  const proofsDir = path.join(LOCAL_UPLOADS_DIR, "rewards");
  await fs.mkdir(proofsDir, { recursive: true });
  const filePath = path.join(proofsDir, uniqueName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, buffer);
  return { url: `/uploads/rewards/${uniqueName}` };
}

// ----------------- حذف صورة -----------------
export async function deleteImageFile(url: string): Promise<void> {
  const supabase = getSupabaseClient();

  if (supabase && url.includes(`/storage/v1/object/public/${BUCKET_NAME}/`)) {
    try {
      const relPath = url.split(`/storage/v1/object/public/${BUCKET_NAME}/`)[1];
      if (relPath) {
        await supabase.storage.from(BUCKET_NAME).remove([relPath]);
      }
    } catch (e) {
      console.error("Error deleting from Supabase storage:", e);
    }
    return;
  }

  // Local fallback
  if (url.startsWith("/uploads/")) {
    try {
      const relPath = url.replace("/uploads/", "");
      const fullPath = path.join(LOCAL_UPLOADS_DIR, relPath);
      await fs.unlink(fullPath);
    } catch (e) {
      console.error("Error deleting local file:", e);
    }
  }
}
