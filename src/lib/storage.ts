import { put, del, list } from "@vercel/blob";
import fs from "fs/promises";
import path from "path";
import { Lesson, LessonsData } from "./types";

const LOCAL_DATA_DIR = path.join(process.cwd(), "data");
const LOCAL_DATA_FILE = path.join(LOCAL_DATA_DIR, "lessons.json");
const LOCAL_UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

export const isVercelBlobConfigured = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

// Ensure local folders exist
async function ensureLocalDirs() {
  await fs.mkdir(LOCAL_DATA_DIR, { recursive: true });
  await fs.mkdir(LOCAL_UPLOADS_DIR, { recursive: true });
}

// ----------------- قراءة بيانات الدروس -----------------
export async function getLessonsData(): Promise<LessonsData> {
  if (isVercelBlobConfigured) {
    try {
      const { blobs } = await list({ prefix: "lessons-db.json" });
      const found = blobs.find((b) => b.pathname === "lessons-db.json");
      if (found) {
        // Fetch fresh content without cache
        const res = await fetch(`${found.url}?t=${Date.now()}`, { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          return json as LessonsData;
        }
      }
    } catch (e) {
      console.error("Error reading from Vercel Blob:", e);
    }
    return { lessons: [] };
  }

  // Local fallback
  try {
    await ensureLocalDirs();
    const data = await fs.readFile(LOCAL_DATA_FILE, "utf-8");
    return JSON.parse(data) as LessonsData;
  } catch {
    return { lessons: [] };
  }
}

// ----------------- حفظ بيانات الدروس -----------------
export async function saveLessonsData(data: LessonsData): Promise<void> {
  if (isVercelBlobConfigured) {
    await put("lessons-db.json", JSON.stringify(data, null, 2), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 60,
    });
    return;
  }

  // Local fallback
  await ensureLocalDirs();
  await fs.writeFile(LOCAL_DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
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

  if (isVercelBlobConfigured) {
    const blobPath = `lessons/${level}/${lessonId}/${uniqueName}`;
    const blob = await put(blobPath, file, {
      access: "public",
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
  if (isVercelBlobConfigured && url.startsWith("http")) {
    try {
      await del(url);
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
