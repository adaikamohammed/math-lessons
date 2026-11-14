export type NotebookType = "lessons" | "directed_work" | "worksheets" | "summaries";

export type LessonImage = {
  id: string;
  url: string;
  downloadUrl?: string;
  name: string;
  createdAt: string;
  fileType?: "image" | "pdf";
};

export function isPdfFile(item?: { url?: string; name?: string; fileType?: string } | null): boolean {
  if (!item) return false;
  if (item.fileType === "pdf") return true;
  const name = (item.name || "").toLowerCase();
  const url = (item.url || "").toLowerCase();
  return name.endsWith(".pdf") || url.endsWith(".pdf") || url.includes(".pdf?") || url.includes("/pdf");
}


export type Lesson = {
  id: string;
  level: 1 | 2; // 1 = أولى متوسط ، 2 = ثانية متوسط
  type?: NotebookType; // "lessons" (كراس الدروس) | "directed_work" (كراس الأعمال الموجهة) | "worksheets" (سلاسل التمارين) | "summaries" (الملخصات والمطويات)
  field?: string; // الميدان : مثلاً "أنشطة عددية" ، "أنشطة هندسية" ، "تنظيم معطيات"
  section?: string; // المقطع المعرفي : مثلاً "المقطع 1 : الأعداد الطبيعية والأعداد العشرية"
  number: number; // رقم المورد المعرفي أو رقم حصة الأعمال الموجهة أو رقم السلسلة
  title: string; // عنوان المورد / الدرس / الحصة / السلسلة / الملخص
  notes?: string; // ملاحظات وتوجيهات الأستاذ
  createdAt: string;
  images: LessonImage[];
  homeworkImages?: LessonImage[]; // صور الحل النموذجي للواجب المنزلي
  homeworkNotes?: string; // ملاحظات أو رقم تمارين الواجب المنزلي
  views?: number; // عدد مشاهدات الدرس من طرف التلاميذ والأولياء
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

export type Penalty = {
  id: string;
  studentName: string; // اسم التلميذ
  className: string; // القسم : "1 م 1" ، "1 م 2" ، "1 م 3" ، "2 م 3"
  deduction: string; // مقدار الخصم أو العقوبة : مثلاً "ناقص 3 في التقويم المستمر (-3)"
  reason: string; // سبب العقوبة : مثلاً "هروب من الحصة يوم الثلاثاء"
  date?: string; // تاريخ الحادثة أو الخصم
  notes?: string; // ملاحظات أو توجيه إضافي من الأستاذ
  createdAt: string;
};

export type EvaluationRating = "excellent" | "very_good" | "good" | "medium" | "weak";
// التقييم اللفظي والألوان:
// ممتاز (أخضر داكن 🟢) = 18-20
// جيد جداً (أخضر 🟢) = 15-17
// جيد (أزرق/سماوي 🔵) = 12-14
// متوسط (برتقالي 🟡) = 10-11
// ضعيف (أحمر 🔴) = أقل من 10

export type StudentEvaluation = {
  id: string;
  studentName: string; // اسم التلميذ
  className: string; // القسم : "1 م 1" ، "1 م 2" ، "1 م 3" ، "2 م 3"
  groupName: "فوج 1" | "فوج 2" | "القسم كامل"; // الفوج في حصة التفويج (أعمال موجهة)
  // 1. كراس الدروس والأعمال الموجهة (5 نقاط)
  notebookScore: number; // 0 إلى 5
  notebookComplete?: boolean; // كراس كامل دون نقص دروس
  // 2. الواجبات المنزلية (5 نقاط)
  homeworkScore: number; // 0 إلى 5
  homeworkDone?: boolean; // واجب كراس المحاولات منجز
  // 3. السلوك والانضباط وإحضار الأدوات والكتاب (5 نقاط)
  toolsScore: number; // 0 إلى 5
  hasTools?: boolean; // إحضار الأدوات الهندسية والكتاب
  // 4. حل النشاط والمشاركة الفعالة (5 نقاط)
  activityScore: number; // 0 إلى 5
  // المجموع الإجمالي التلقائي من 20
  totalScore: number; // 0 إلى 20
  rating: EvaluationRating; // التقدير اللفظي
  ratingColor: "green" | "emerald" | "amber" | "rose"; // شارة اللون السريعة
  notes?: string; // ملاحظة الأستاذ (مثلاً: استدراك درس سابق، كراس نموذجي...)
  updatedAt: string;
};

export type InspectionRecord = {
  studentName: string;
  lessonsDone: number; // عدد الدروس المكتوبة (مثلاً 8 من 8)
  homeworksDone: number; // عدد الواجبات المنجزة (مثلاً 8 من 8)
  behaviorScore: number; // علامة السلوك والأدوات (من 5)
  activityScore: number; // علامة حل النشاط والمشاركة (من 5)
  score: number; // علامة هذه المراقبة من 20 (تحسب تلقائياً)
  notes?: string; // ملاحظة سريعة للتلميذ
};

export type InspectionSession = {
  id: string;
  sessionNumber: number; // 1, 2, 3...
  title?: string; // مثلاً: المراقبة الأولى (الدروس 1 إلى 8)
  date: string; // اليوم والتاريخ : مثلاً "الأربعاء 09 أكتوبر 2026"
  className: string; // القسم : "1 م 1" ، "1 م 2" ، "1 م 3" ، "2 م 3"
  groupName: "فوج 1" | "فوج 2" | "القسم كامل"; // الفوج المعني
  lessonRange: string; // مجال الدروس: مثلاً "الدروس من 1 إلى 8"
  totalLessons: number; // عدد الدروس المقررة للمراقبة (مثلاً 8)
  totalHomeworks: number; // عدد الواجبات المقررة للمراقبة (مثلاً 8)
  records: Record<string, InspectionRecord>; // سجلات التلاميذ (مفتاحها اسم التلميذ)
  createdAt: string;
  updatedAt: string;
};

export type StudentRosterItem = {
  id: string;
  studentName: string;
  className: string;
  groupName?: "فوج 1" | "فوج 2" | "القسم كامل" | string;
  birthDate?: string; // YYYY-MM-DD
  gender?: "M" | "F" | string;
  isRepeater?: boolean;
  parentPhone?: string;
  notes?: string;
};

export type StudentGradeRecord = {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  academicYear?: string;
  trimester: 1 | 2 | 3;
  behaviorScore?: number;
  homework1Score?: number;
  notebook1Score?: number;
  quiz1Score?: number;
  continuousScore?: number;
  test1Score?: number;
  test2Score?: number;
  examScore?: number;
  termAverage?: number;
  rank?: number;
  totalStudents?: number;
  classAvg?: number;
  appreciation?: string;
  customScores?: Record<string, number>;
  evaluatedColumns?: Record<string, boolean>;
  updatedAt?: string;
};

export type AnnouncementCategory = "absence" | "lesson" | "update" | "general" | "urgent";

export type Announcement = {
  id: string;
  title: string; // عنوان الإعلان (مثلاً: تنبيه غياب، رفع حل واجب، ملاحظة...)
  content: string; // نص الإعلان والتفاصيل
  category: AnnouncementCategory; // نوع الإعلان (absence: غياب، lesson: دروس/واجبات، update: تحديث، general: عام، urgent: عاجل)
  date: string; // تاريخ الإعلان أو اليوم المعني
  pinned?: boolean; // هل الإعلان مثبت في الأعلى
  active?: boolean; // هل الإعلان ظاهر للزوار
  createdAt: string;
};

export type MessageCategory = "question" | "suggestion" | "criticism" | "other";

export type MessageReply = {
  content: string; // نص رد الأستاذ
  repliedAt: string; // تاريخ ووقت الرد
  isPublic?: boolean; // هل يُعرض في الإجابات العامة لتعم الفائدة
};

export type AnonymousMessage = {
  id: string;
  category: MessageCategory; // تصنيف الرسالة (سؤال ❓، اقتراح 💡، نقد بنّاء ⚖️، أخرى 💬)
  targetLevel?: string; // اختياري: "1 متوسط" | "2 متوسط" | "ولي أمر" | "غير محدد"
  content: string; // نص الرسالة
  createdAt: string;
  read?: boolean; // هل تمت قراءتها من الأستاذ

  // معلومات اختيارية للمرسل والتلميذ
  studentName?: string; // اسم التلميذ (اختياري)
  senderName?: string; // اسم الولي أو المرسل (اختياري)
  senderPhone?: string; // رقم هاتف / واتساب للتواصل والرد (اختياري)
  className?: string; // القسم أو الفوج (اختياري، مثلاً 1م1، 1م2، 1م3، 2م3)
  trackingCode?: string; // رمز تتبع فريد وسهل (مثل M-4821) للمتابعة والردود
  reply?: MessageReply; // رد الأستاذ
};

export type VisitorDeviceType = "mobile" | "desktop" | "tablet";

export type AnalyticsEventLog = {
  id: string;
  timestamp: string; // ISO string
  type: "visit" | "lesson_view";
  visitorId: string; // Persistent device UUID e.g. "dev_a1b2c3d4"
  shortDeviceId: string; // Readable code e.g. "DEV-A1B2"
  isNewVisitor: boolean; // First time seen
  visitIndex: number; // 1 = first visit, 2+ = returning
  deviceType: VisitorDeviceType;
  os: string;
  browser: string;
  screen?: string;
  path?: string;
  lessonId?: string;
  lessonTitle?: string;
  level?: 1 | 2;
  referrer?: string;
};

export type HourlyBucket = {
  date: string; // YYYY-MM-DD
  hour: number; // 0..23
  visits: number;
  views: number;
  devices: string[]; // unique visitorIds for this hour
};

export type DailyBucket = {
  date: string; // YYYY-MM-DD
  visits: number;
  views: number;
  uniqueDevices: number;
  newVisitors: number;
  returningVisitors: number;
  devicesBreakdown: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
  browsers: Record<string, number>;
  os: Record<string, number>;
};

export type KnownDeviceSummary = {
  id: string; // visitorId
  shortId: string; // e.g. DEV-8F2A
  deviceType: VisitorDeviceType;
  os: string;
  browser: string;
  screen?: string;
  firstSeen: string;
  lastSeen: string;
  totalVisits: number;
  totalViews: number;
  lastPage?: string;
  lastLessonTitle?: string;
};

export type SiteAnalyticsData = {
  totalVisits: number;
  lastVisit?: string;
  todayVisits?: number;
  todayDate?: string;
  todayViews?: number;
  totalViews?: number;
  uniqueDevicesCount?: number;
  hourly?: Record<string, HourlyBucket>; // key: "YYYY-MM-DD_HH"
  daily?: Record<string, DailyBucket>; // key: "YYYY-MM-DD"
  knownDevices?: Record<string, KnownDeviceSummary>; // key: visitorId
  recentEvents?: AnalyticsEventLog[]; // last ~150-200 events
};

export type LessonsData = {
  lessons: Lesson[];
  summons?: ParentSummons[];
  honors?: HonorStudent[];
  penalties?: Penalty[];
  evaluations?: StudentEvaluation[];
  inspectionSessions?: InspectionSession[];
  studentRoster?: StudentRosterItem[];
  gradebookRecords?: StudentGradeRecord[];
  parentGradebookLookup?: any[];
  announcements?: Announcement[];
  anonymousMessages?: AnonymousMessage[];
  siteAnalytics?: SiteAnalyticsData;
};

export const LEVELS = {
  1: { label: "السنة الأولى متوسط", short: "1 متوسط" },
  2: { label: "السنة الثانية متوسط", short: "2 متوسط" },
} as const;

export const NOTEBOOKS = {
  lessons: {
    id: "lessons" as NotebookType,
    title: "كراس الدروس",
    subtitle: "192 صفحة • الميادين، المقاطع وحلول الواجبات",
    short: "كراس الدروس",
    icon: "📘",
  },
  directed_work: {
    id: "directed_work" as NotebookType,
    title: "الأعمال الموجهة",
    subtitle: "96 صفحة • حصص التفويج وتطبيقات القسم",
    short: "الأعمال الموجهة",
    icon: "📗",
  },
  worksheets: {
    id: "worksheets" as NotebookType,
    title: "سلاسل التمارين",
    subtitle: "سلاسل التمارين، الواجبات الورقية والحلول",
    short: "سلاسل التمارين",
    icon: "📑",
  },
  summaries: {
    id: "summaries" as NotebookType,
    title: "الملخصات والمطويات",
    subtitle: "ملخصات القواعد، بطاقات القوانين ومراجعة الاختبارات",
    short: "الملخصات",
    icon: "📌",
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
