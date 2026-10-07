import { put, del, list, get } from "@vercel/blob";
import fs from "fs/promises";
import path from "path";
import { Lesson, LessonsData } from "./types";

const LOCAL_DATA_DIR = path.join(process.cwd(), "data");
const LOCAL_DATA_FILE = path.join(LOCAL_DATA_DIR, "lessons.json");
const LOCAL_UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

export function getBlobToken(): string | undefined {
  return process.env.BLOB_READ_WRITE_TOKEN;
}

export function isVercelBlobConfigured(): boolean {
  return Boolean(getBlobToken());
}

// Ensure local folders exist
async function ensureLocalDirs() {
  await fs.mkdir(LOCAL_DATA_DIR, { recursive: true });
  await fs.mkdir(LOCAL_UPLOADS_DIR, { recursive: true });
}

// Mutex lock to serialize writes and prevent concurrent race conditions
let writeQueue: Promise<any> = Promise.resolve();

// ----------------- قراءة بيانات الدروس -----------------
export async function getLessonsData(): Promise<LessonsData> {
  const token = getBlobToken();

  if (token) {
    try {
      // 1. أولاً: فحص النسخ ذات المعرف الفريد الزمني (db/v-)
      // كل نسخة ذات اسم فريد تضمن تخطي كاش الـ Edge CDN بنسبة 100% لأن رابطها لم يسبق طلبه
      const versionList = await list({ prefix: "db/v-", token });
      if (versionList.blobs && versionList.blobs.length > 0) {
        // ترتيب تنازلي حسب تاريخ الرفع للحصول على أحدث نسخة فوراً
        const sorted = versionList.blobs.sort(
          (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
        );
        const latest = sorted[0];

        try {
          const res = await fetch(latest.url, {
            cache: "no-store",
            headers: {
              "Cache-Control": "no-cache, no-store, must-revalidate",
              Pragma: "no-cache",
            },
          });
          if (res.ok) {
            const json = await res.json();
            const result: LessonsData = {
              lessons: Array.isArray(json.lessons) ? json.lessons : [],
              summons: Array.isArray(json.summons) ? json.summons : [],
              honors: Array.isArray(json.honors) ? json.honors : [],
              penalties: Array.isArray(json.penalties) ? json.penalties : [],
            };
            // حفظ نسخة محلية احتياطية
            ensureLocalDirs()
              .then(() => fs.writeFile(LOCAL_DATA_FILE, JSON.stringify(result, null, 2), "utf-8"))
              .catch(() => {});
            return result;
          }
        } catch (fetchErr) {
          console.warn("Error fetching versioned blob, trying fallback:", fetchErr);
        }
      }

      // 2. ثانياً: في حال عدم العثور على db/v-، نلجأ إلى lessons-db.json كنسخة احتياطية
      const listResult = await list({ prefix: "lessons-db.json", token });
      const found = listResult.blobs.find((b) => b.pathname === "lessons-db.json");
      if (found) {
        try {
          const blobRes = await get(found.url, { token, access: "public" });
          if (blobRes && blobRes.statusCode === 200 && blobRes.stream) {
            const chunks: Uint8Array[] = [];
            // @ts-ignore
            for await (const chunk of blobRes.stream) {
              chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
            }
            const text = Buffer.concat(chunks).toString("utf-8");
            const json = JSON.parse(text);
            return {
              lessons: Array.isArray(json.lessons) ? json.lessons : [],
              summons: Array.isArray(json.summons) ? json.summons : [],
              honors: Array.isArray(json.honors) ? json.honors : [],
              penalties: Array.isArray(json.penalties) ? json.penalties : [],
            };
          }
        } catch (getErr) {
          console.warn("Direct blob.get error on lessons-db.json:", getErr);
        }
      }
    } catch (e) {
      console.error("Error reading from Vercel Blob:", e);
    }
  }

  // Local fallback
  try {
    await ensureLocalDirs();
    const data = await fs.readFile(LOCAL_DATA_FILE, "utf-8");
    const json = JSON.parse(data);
    return {
      lessons: Array.isArray(json.lessons) ? json.lessons : [],
      summons: Array.isArray(json.summons) ? json.summons : [],
      honors: Array.isArray(json.honors) ? json.honors : [],
      penalties: Array.isArray(json.penalties) ? json.penalties : [],
    };
  } catch {
    return { lessons: [], summons: [], honors: [], penalties: [] };
  }
}

// ----------------- حفظ بيانات الدروس -----------------
async function executeSave(data: LessonsData): Promise<void> {
  const token = getBlobToken();

  if (token) {
    const payload = JSON.stringify(data, null, 2);
    const ts = Date.now();
    const versionPath = `db/v-${ts}.json`;

    // 1. كتابة النسخة الفريدة (db/v-) التي تضمن عدم الكاش إطلاقاً
    await put(versionPath, payload, {
      access: "public",
      token,
    });

    // 2. تحديث lessons-db.json أيضاً للتوافق الاحتياطي
    try {
      await put("lessons-db.json", payload, {
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: true,
        token,
      });
    } catch (legacyErr) {
      console.warn("Could not overwrite lessons-db.json fallback:", legacyErr);
    }

    // 3. تنظيف النسخ القديمة جداً في الخلفية (الاحتفاظ بآخر 5 نسخ للأمان)
    list({ prefix: "db/v-", token })
      .then(async (res) => {
        if (res.blobs && res.blobs.length > 5) {
          const sorted = res.blobs.sort(
            (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
          );
          const toDelete = sorted.slice(5);
          for (const b of toDelete) {
            await del(b.url, { token }).catch(() => {});
          }
        }
      })
      .catch(() => {});

    // 4. حفظ نسخة محلية أيضاً
    ensureLocalDirs()
      .then(() => fs.writeFile(LOCAL_DATA_FILE, payload, "utf-8"))
      .catch(() => {});

    return;
  }

  // Local fallback
  await ensureLocalDirs();
  await fs.writeFile(LOCAL_DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export function saveLessonsData(data: LessonsData): Promise<void> {
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
  const token = getBlobToken();

  if (token) {
    const blobPath = `lessons/${level}/${lessonId}/${uniqueName}`;
    const blob = await put(blobPath, file, {
      access: "public",
      token,
    });
    return {
      url: blob.url,
      downloadUrl: blob.downloadUrl || blob.url,
    };
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

// ----------------- حذف صورة -----------------
export async function deleteImageFile(url: string): Promise<void> {
  const token = getBlobToken();

  if (token && url.startsWith("http")) {
    try {
      await del(url, { token });
    } catch (e) {
      console.error("Error deleting blob:", e);
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
