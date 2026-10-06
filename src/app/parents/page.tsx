"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Users,
  Clock,
  Calendar,
  AlertTriangle,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  PhoneCall,
  MapPin,
} from "lucide-react";
import { RECEPTION_INFO, type ParentSummons } from "@/lib/types";
import { Loading } from "@/components/ui";

export default function ParentsPage() {
  const [summons, setSummons] = useState<ParentSummons[] | null>(null);
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/summons?_t=${Date.now()}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        setSummons(data.summons || []);
      })
      .catch(() => setSummons([]))
      .finally(() => setLoading(false));
  }, []);

  // استخراج قائمة الأفواج المتاحة تلقائياً
  const classesList = useMemo(() => {
    if (!summons) return [];
    const set = new Set<string>();
    summons.forEach((s) => set.add(s.className));
    return Array.from(set).sort();
  }, [summons]);

  // تصفية القائمة بالبحث والفوج
  const filtered = useMemo(() => {
    if (!summons) return [];
    return summons.filter((s) => {
      const matchSearch =
        s.studentName.toLowerCase().includes(search.toLowerCase()) ||
        s.className.toLowerCase().includes(search.toLowerCase()) ||
        (s.notes && s.notes.toLowerCase().includes(search.toLowerCase()));
      const matchClass = selectedClass === "all" || s.className === selectedClass;
      return matchSearch && matchClass;
    });
  }, [summons, search, selectedClass]);

  return (
    <div className="pb-16 pt-3 fade-up space-y-4">
      {/* رأس الصفحة وزر الرجوع */}
      <div className="flex items-center gap-3 bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs">
        <Link
          href="/"
          className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 active:scale-95 transition shrink-0"
          aria-label="الرجوع للرئيسية"
        >
          <ArrowRight className="w-5 h-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <span className="inline-flex items-center gap-1 text-[11px] font-black text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200/60 mb-0.5">
            <Users className="w-3 h-3 text-rose-600" /> مصلحة التوجيه والمتابعة
          </span>
          <h1 className="text-base font-extrabold text-slate-900 truncate">
            استدعاء الأولياء وساعة الاستقبال
          </h1>
          <p className="text-[11px] text-slate-500">
            الأستاذ محمد عدايكة — متوسطة المجاهد باهي علي
          </p>
        </div>
      </div>

      {/* بطاقة مواعيد الاستقبال ورسالة الأستاذ */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-5 shadow-md space-y-4 relative overflow-hidden">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
            <Clock className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-black">مواعيد استقبال الأولياء في مادة الرياضيات</h2>
            <p className="text-[11px] text-slate-300">متوسطة المجاهد باهي علي</p>
          </div>
        </div>

        {/* الموعدين: الرسمي والمستعجل */}
        <div className="grid sm:grid-cols-2 gap-2.5">
          {/* الموعد الرسمي */}
          <div className="bg-white/10 backdrop-blur rounded-2xl p-3 border border-white/15 space-y-1">
            <div className="flex items-center justify-between text-xs font-black text-emerald-300">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> الموعد الرسمي (أسبوعياً)
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-[10px]">
                ساعة الاستقبال
              </span>
            </div>
            <div className="text-sm font-black text-white">كل يوم أربعاء</div>
            <div className="text-xs text-slate-200">من 10:00 إلى 11:00 صباحاً</div>
          </div>

          {/* موعد الحالات المستعجلة */}
          <div className="bg-white/10 backdrop-blur rounded-2xl p-3 border border-amber-400/30 space-y-1">
            <div className="flex items-center justify-between text-xs font-black text-amber-300">
              <span className="flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" /> للحالات المستعجلة فقط
              </span>
              <span className="bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded text-[10px]">
                استثنائي
              </span>
            </div>
            <div className="text-sm font-black text-white">يوم الأحد صباحاً</div>
            <div className="text-xs text-slate-200">
              من 08:00 إلى 09:00 صباحاً
              <span className="block text-[10px] text-amber-200/80 mt-0.5">
                (ساعة فراغ للأستاذ وليست ساعة استقبال رسمية، لكن مرحباً بكم في الحالات العاجلة)
              </span>
            </div>
          </div>
        </div>

        {/* رسالة الأستاذ الحريصة للأولياء */}
        <div className="bg-amber-500/20 border border-amber-400/40 rounded-2xl p-3.5 text-xs text-amber-100 space-y-1">
          <div className="font-black text-amber-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> تنبيه ورسالة من الأستاذ:
          </div>
          <p className="leading-relaxed font-semibold text-white">
            « أود استقبالكم الآن لمتابعة مستوى أبنائكم ومعالجة أي نقائص في الكراس والواجبات من البداية، وليس بعد الإعلان عن نتائج الفصل الأول حين يفوت الأوان! »
          </p>
        </div>
      </div>

      {/* قسم قائمة التلاميذ المستدعين */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-rose-600" />
            <h3 className="text-xs font-black text-slate-800">
              قائمة التلاميذ المعنيين بمقابلة أوليائهم:
            </h3>
          </div>
          <span className="text-[11px] font-extrabold bg-rose-50 text-rose-700 px-2.5 py-0.5 rounded-full border border-rose-200/60">
            {filtered.length} تلميذ
          </span>
        </div>

        {/* حقل البحث */}
        <div className="relative">
          <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            className="w-full bg-white rounded-2xl border border-slate-200 py-2.5 pr-10 pl-4 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition"
            placeholder="ابحث باسم التلميذ أو الفوج..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* تصفية حسب الفوج */}
        {classesList.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-bold">
            <button
              onClick={() => setSelectedClass("all")}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition shrink-0 ${
                selectedClass === "all"
                  ? "bg-slate-800 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-100 hover:bg-slate-50"
              }`}
            >
              جميع الأفواج ({summons?.length || 0})
            </button>
            {classesList.map((cls) => (
              <button
                key={cls}
                onClick={() => setSelectedClass(cls)}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition shrink-0 ${
                  selectedClass === cls
                    ? "bg-rose-600 text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-100 hover:bg-slate-50"
                }`}
              >
                فوج {cls}
              </button>
            ))}
          </div>
        )}

        {/* قائمة البطاقات */}
        {loading ? (
          <Loading />
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200 p-6 space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h4 className="font-black text-sm text-slate-800">لا يوجد أي استدعاء حالياً</h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              الحمد لله، لم يتم تسجيل أي استدعاء حالياً. تذكير: ساعة الاستقبال مفتوحة كل أربعاء لكل ولي يرغب في الاطمئنان على ابنه.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((item) => (
              <div
                key={item.id}
                className={`bg-white rounded-2xl p-4 border shadow-2xs space-y-2.5 transition ${
                  item.isUrgent
                    ? "border-rose-300 bg-rose-50/20 shadow-rose-500/5"
                    : "border-slate-100 hover:border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-sm text-slate-900 leading-snug break-words">
                        {item.studentName}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                        فوج {item.className}
                      </span>
                      {item.isUrgent && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-100 text-rose-800 flex items-center gap-1 border border-rose-300">
                          <AlertCircle className="w-3 h-3 text-rose-600" />
                          <span>حالة مستعجلة (الأحد صباحاً)</span>
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      متوسطة المجاهد باهي علي
                    </div>
                  </div>
                </div>

                {/* ملاحظة الأستاذ لولي الأمر */}
                {item.notes ? (
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs text-slate-700 space-y-1">
                    <span className="font-extrabold text-[11px] text-slate-900 flex items-center gap-1">
                      <span>📌 ملاحظة وتوجيه الأستاذ:</span>
                    </span>
                    <p className="text-slate-800 whitespace-pre-line leading-relaxed pr-1 font-medium">
                      {item.notes}
                    </p>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded-xl">
                    يرجى من ولي الأمر الحضور في ساعة الاستقبال للاطلاع على كراس التلميذ ومناقشة مستواه الدراسي.
                  </div>
                )}

                {/* توقيت الحضور المقترح */}
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 pt-1 border-t border-slate-100">
                  <span className="flex items-center gap-1 text-slate-600">
                    <Clock className="w-3 h-3 text-emerald-600" />
                    <span>
                      {item.isUrgent
                        ? "الموعد: الأحد (08:00 إلى 09:00) أو الأربعاء"
                        : "الموعد: الأربعاء (10:00 إلى 11:00 صباحاً)"}
                    </span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(item.createdAt).toLocaleDateString("ar-DZ", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
