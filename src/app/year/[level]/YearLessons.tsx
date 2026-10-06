"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Image as ImageIcon } from "lucide-react";
import { supabase, LEVELS, type Lesson } from "@/lib/supabase";
import { BackHeader, Loading, Empty } from "@/components/ui";

type Row = Lesson & { lesson_images: { count: number }[] };

export function YearLessons({ level }: { level: 1 | 2 }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase
      .from("lessons")
      .select("*, lesson_images(count)")
      .eq("level", level)
      .order("number", { ascending: true })
      .then(({ data, error }) => {
        if (error) setError("تعذر تحميل الدروس، حاول مجدداً.");
        setRows((data as Row[]) ?? []);
      });
  }, [level]);

  return (
    <div>
      <BackHeader href="/" title={LEVELS[level].label} subtitle="اختر الدرس" />

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      {!rows ? (
        <Loading />
      ) : rows.length === 0 ? (
        <Empty text="لم تُضف دروس بعد" />
      ) : (
        <ul className="space-y-3 mt-2">
          {rows.map((l, i) => {
            const count = l.lesson_images?.[0]?.count ?? 0;
            return (
              <li key={l.id} className="fade-up" style={{ animationDelay: `${i * 30}ms` }}>
                <Link
                  href={`/lesson/${l.id}`}
                  className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-slate-100 shadow-sm active:scale-[0.98] transition"
                >
                  <div className="w-11 h-11 shrink-0 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-extrabold">
                    {l.number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-slate-400">الدرس {l.number}</div>
                    <div className="font-bold leading-snug">{l.title}</div>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <ImageIcon className="w-4 h-4" />
                    {count}
                  </span>
                  <ChevronLeft className="w-5 h-5 text-slate-300" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
