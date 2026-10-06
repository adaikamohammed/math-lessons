export type NotebookType = "lessons" | "directed_work";

export type LessonImage = {
  id: string;
  url: string;
  downloadUrl?: string;
  name: string;
  createdAt: string;
};

export type Lesson = {
  id: string;
  level: 1 | 2; // 1 = أولى متوسط ، 2 = ثانية متوسط
  type?: NotebookType; // "lessons" (كراس الدروس 192 صفحة) | "directed_work" (كراس الأعمال الموجهة 96 صفحة)
  field?: string; // الميدان : مثلاً "أنشطة عددية" ، "أنشطة هندسية" ، "تنظيم معطيات"
  section?: string; // المقطع المعرفي : مثلاً "المقطع 1 : الأعداد الطبيعية والأعداد العشرية"
  number: number; // رقم المورد المعرفي أو رقم حصة الأعمال الموجهة
  title: string; // عنوان المورد / الدرس / الحصة
  notes?: string; // ملاحظات وتوجيهات الأستاذ
  createdAt: string;
  images: LessonImage[];
};

export type ParentSummons = {
  id: string;
  studentName: string; // اسم التلميذ
  className: string; // الفوج : مثلاً "1م3"
  notes?: string; // ملاحظة وتوجيه الأستاذ لولي الأمر
  isUrgent?: boolean; // توقيت إضافي: الأحد صباحاً
  createdAt: string;
};

export type HonorStudent = {
  id: string;
  studentName: string; // اسم التلميذ
  className: string; // القسم : "1 م 1" ، "1 م 2" ، "1 م 3" ، "2 م 3"
  notes?: string; // ملاحظة غير ضرورية (تميز في الفرض، كراس منظم، مواظبة...)
  badge?: string; // لقب تشجيعي اختياري (مثلاً: نجم الرياضيات ⭐، كراس نموذجي 📖)
  createdAt: string;
};

export const HONOR_CLASSES = ["1 م 1", "1 م 2", "1 م 3", "2 م 3"] as const;
export type HonorClass = (typeof HONOR_CLASSES)[number];

export type LessonsData = {
  lessons: Lesson[];
  summons?: ParentSummons[];
  honors?: HonorStudent[];
};

export const LEVELS = {
  1: { label: "السنة الأولى متوسط", short: "1 متوسط" },
  2: { label: "السنة الثانية متوسط", short: "2 متوسط" },
} as const;

export const NOTEBOOKS = {
  lessons: {
    id: "lessons" as NotebookType,
    title: "كراس الدروس",
    subtitle: "192 صفحة • الميادين، المقاطع والموارد المعرفية",
    short: "كراس الدروس",
    icon: "📘",
  },
  directed_work: {
    id: "directed_work" as NotebookType,
    title: "كراس الأعمال الموجهة",
    subtitle: "96 صفحة • حصص التفويج وسلاسل التمارين والملاحظات",
    short: "الأعمال الموجهة",
    icon: "📗",
  },
} as const;

export const COMMON_FIELDS = [
  "أنشطة عددية",
  "أنشطة هندسية",
  "تنظيم معطيات",
] as const;

export const RECEPTION_INFO = {
  officialDay: "الأربعاء",
  officialTime: "10:00 إلى 11:00 صباحاً",
  extraDay: "الأحد",
  extraTime: "08:00 إلى 09:00 صباحاً",
  extraNote: "توقيت إضافي (مبادرة من الأستاذ لعدم الانتظار لأسبوع كامل) وليس ساعة استقبال رسمية",
  location: "متوسطة المجاهد باهي علي",
  motto: "أود استقبالكم الآن لمتابعة مستوى أبنائكم ومعالجة النقائص، وليس بعد الإعلان عن نتائج الفصل الأول!",
} as const;
