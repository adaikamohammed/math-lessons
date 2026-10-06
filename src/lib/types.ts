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
  number: number;
  title: string;
  createdAt: string;
  images: LessonImage[];
};

export type LessonsData = {
  lessons: Lesson[];
};

export const LEVELS = {
  1: { label: "السنة الأولى متوسط", short: "1 متوسط" },
  2: { label: "السنة الثانية متوسط", short: "2 متوسط" },
} as const;
