import Link from "next/link";
import { ChevronLeft } from "lucide-react";

const years = [
  { level: 1, title: "السنة الأولى متوسط", tag: "1م", color: "from-emerald-500 to-teal-500" },
  { level: 2, title: "السنة الثانية متوسط", tag: "2م", color: "from-sky-500 to-indigo-500" },
];

export default function Home() {
  return (
    <div className="pt-10 fade-up">
      <div className="text-center mb-8">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-3xl font-extrabold shadow-lg shadow-emerald-600/20">
          ∑
        </div>
        <h1 className="mt-4 text-2xl font-extrabold">دروس الرياضيات</h1>
        <p className="mt-1 text-sm text-slate-500">اختر سنتك الدراسية</p>
      </div>

      <div className="space-y-4">
        {years.map((y) => (
          <Link
            key={y.level}
            href={`/year/${y.level}`}
            className="flex items-center gap-4 bg-white rounded-2xl p-5 shadow-sm border border-slate-100 active:scale-[0.98] transition"
          >
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${y.color} text-white flex items-center justify-center text-xl font-extrabold`}>
              {y.tag}
            </div>
            <div className="flex-1 text-lg font-bold">{y.title}</div>
            <ChevronLeft className="w-6 h-6 text-slate-400" />
          </Link>
        ))}
      </div>
    </div>
  );
}
