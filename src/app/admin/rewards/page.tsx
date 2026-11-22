"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Gift,
  Trophy,
  CheckCircle2,
  XCircle,
  Clock,
  Smartphone,
  ExternalLink,
  Trash2,
  Eye,
  Filter,
  Search,
  RefreshCw,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { RewardProofSubmission, REWARD_TIERS } from "@/lib/types";
import { Loading, Empty } from "@/components/ui";

export default function AdminRewardsPage() {
  const [submissions, setSubmissions] = useState<RewardProofSubmission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [activeImageModal, setActiveImageModal] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/rewards?_t=${Date.now()}`);
      const data = await res.json();
      if (data.submissions) {
        setSubmissions(data.submissions);
      }
    } catch (err) {
      console.error("Error fetching submissions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleUpdateStatus = async (
    id: string,
    status: "approved" | "rejected" | "pending",
    feedback?: string
  ) => {
    setUpdatingId(id);
    try {
      const res = await fetch("/api/admin/rewards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, teacherFeedback: feedback }),
      });
      if (res.ok) {
        setSubmissions((prev) =>
          prev.map((s) => (s.id === id ? { ...s, status, teacherFeedback: feedback } : s))
        );
      }
    } catch (err) {
      console.error("Error updating status:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الإثبات؟")) return;
    try {
      const res = await fetch(`/api/admin/rewards?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setSubmissions((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (err) {
      console.error("Error deleting submission:", err);
    }
  };

  const filtered = useMemo(() => {
    return submissions.filter((s) => {
      const matchClass = selectedClass === "all" || s.className === selectedClass;
      const matchStatus = selectedStatus === "all" || s.status === selectedStatus;
      const matchSearch =
        !search.trim() ||
        s.studentName.toLowerCase().includes(search.trim().toLowerCase()) ||
        s.className.toLowerCase().includes(search.trim().toLowerCase()) ||
        (s.parentPhone && s.parentPhone.includes(search.trim()));
      return matchClass && matchStatus && matchSearch;
    });
  }, [submissions, selectedClass, selectedStatus, search]);

  const stats = useMemo(() => {
    return {
      total: submissions.length,
      pending: submissions.filter((s) => s.status === "pending").length,
      approved: submissions.filter((s) => s.status === "approved").length,
      rejected: submissions.filter((s) => s.status === "rejected").length,
    };
  }, [submissions]);

  const getTierInfo = (tierId: string) => {
    return REWARD_TIERS.find((t) => t.id === tierId) || REWARD_TIERS[0];
  };

  return (
    <div className="pb-16 pt-3 space-y-5 fade-up">
      {/* رأس الصفحة */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition flex items-center justify-center"
            title="الرجوع للوحة التحكم"
          >
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-1.5">
              <span>إدارة كشوف وتأكيدات الهدايا والجوائز</span>
              <Gift className="w-4 h-4 text-emerald-600" />
            </h1>
            <p className="text-[11px] text-slate-500">
              معاينة صور كشوف النقاط المرفوعة من الأولياء والتلاميذ واعتماد الفائزين
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchSubmissions}
          disabled={loading}
          className="text-xs font-bold text-slate-700 bg-slate-50 hover:bg-emerald-50 px-3 py-1.5 rounded-xl border border-slate-200 flex items-center gap-1.5 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-600" : ""}`} />
          <span>تحديث</span>
        </button>
      </div>

      {/* بطاقات الإحصائيات الأربعة */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs text-right">
          <div className="text-[11px] font-bold text-slate-500">إجمالي الكشوف المرفوعة</div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{stats.total}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">طلب تأكيد جائزة</div>
        </div>

        <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200/90 shadow-2xs text-right">
          <div className="text-[11px] font-black text-amber-800">بانتظار المراجعة ⏳</div>
          <div className="text-xl sm:text-2xl font-black text-amber-950 mt-1">{stats.pending}</div>
          <div className="text-[10px] text-amber-700 mt-0.5">تحتاج تدقيق الأستاذ</div>
        </div>

        <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200/90 shadow-2xs text-right">
          <div className="text-[11px] font-black text-emerald-800">فائزون معتمدون 🎁</div>
          <div className="text-xl sm:text-2xl font-black text-emerald-950 mt-1">{stats.approved}</div>
          <div className="text-[10px] text-emerald-700 mt-0.5">حقّقوا الشروط بنجاح</div>
        </div>

        <div className="bg-rose-50/70 p-3.5 rounded-2xl border border-rose-200/90 shadow-2xs text-right">
          <div className="text-[11px] font-black text-rose-800">مرفوضة أو ناقصة ❌</div>
          <div className="text-xl sm:text-2xl font-black text-rose-950 mt-1">{stats.rejected}</div>
          <div className="text-[10px] text-rose-700 mt-0.5">لم تحقق الشروط المطلوبة</div>
        </div>
      </div>

      {/* شريط الفلاتر والبحث */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* فلتر الأقسام */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {["all", "1م1", "1م2", "1م3", "2م3"].map((cls) => (
              <button
                key={cls}
                type="button"
                onClick={() => setSelectedClass(cls)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition shrink-0 ${
                  selectedClass === cls
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cls === "all" ? "جميع الأقسام" : `قسم ${cls}`}
              </button>
            ))}
          </div>

          {/* فلتر الحالة */}
          <div className="flex items-center gap-1">
            {[
              { id: "all", label: "الكل" },
              { id: "pending", label: "قيد المراجعة" },
              { id: "approved", label: "معتمد" },
              { id: "rejected", label: "مرفوض" },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setSelectedStatus(st.id)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition ${
                  selectedStatus === st.id
                    ? "bg-emerald-700 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* حقل البحث */}
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث باسم التلميذ أو رقم الهاتف..."
            className="w-full text-xs font-bold p-2.5 pr-9 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
        </div>
      </div>

      {/* قائمة الكشوف والطلبات */}
      {loading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <Empty text="لم يتم إرسال كشوف نقاط أو إثباتات بعد ضمن هذه التصفية" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filtered.map((item) => {
            const tier = getTierInfo(item.tierId);
            const isUpdating = updatingId === item.id;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border p-4 shadow-2xs space-y-3 text-right transition ${
                  item.status === "approved"
                    ? "border-emerald-300 ring-1 ring-emerald-200"
                    : item.status === "rejected"
                    ? "border-rose-200 bg-rose-50/20"
                    : "border-slate-200"
                }`}
              >
                {/* رأس البطاقة */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-900">{item.studentName}</span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {item.className}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(item.submittedAt).toLocaleString("ar-DZ")}</span>
                    </div>
                  </div>

                  {/* شارة الحالة */}
                  <span
                    className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
                      item.status === "approved"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                        : item.status === "rejected"
                        ? "bg-rose-50 text-rose-800 border-rose-300"
                        : "bg-amber-50 text-amber-800 border-amber-300"
                    }`}
                  >
                    {item.status === "approved"
                      ? "فائز معتمد 🎁"
                      : item.status === "rejected"
                      ? "مرفوض ❌"
                      : "بانتظار المراجعة ⏳"}
                  </span>
                </div>

                {/* تفاصيل الفئة والشرط */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500">فئة التحدي:</span>
                    <span className="font-black text-slate-800">{tier.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-amber-800 font-bold">
                    <span className="text-[11px]">الشرط المطلوب:</span>
                    <span className="font-black">{tier.conditionText}</span>
                  </div>
                </div>

                {/* صورة كشف النقاط المرفقة */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                    <span>صورة كشف النقاط المرفقة:</span>
                    <button
                      type="button"
                      onClick={() => setActiveImageModal(item.proofImageUrl)}
                      className="text-emerald-700 hover:text-emerald-900 flex items-center gap-1 font-black"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>معاينة مكبرة</span>
                    </button>
                  </div>

                  <div
                    onClick={() => setActiveImageModal(item.proofImageUrl)}
                    className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer group h-40 flex items-center justify-center"
                  >
                    <img
                      src={item.proofImageUrl}
                      alt="كشف النقاط"
                      className="max-h-full max-w-full object-contain mx-auto group-hover:scale-102 transition"
                    />
                    <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-black gap-1">
                      <Eye className="w-4 h-4" />
                      <span>اضغط للتكبير</span>
                    </div>
                  </div>
                </div>

                {/* رقم هاتف الولي وملاحظات */}
                {(item.parentPhone || item.notes) && (
                  <div className="text-xs space-y-1 pt-1 border-t border-slate-100">
                    {item.parentPhone && (
                      <div className="flex items-center justify-between text-slate-600 font-bold">
                        <span className="text-[11px]">هاتف الولي:</span>
                        <div className="flex items-center gap-2">
                          <a
                            href={`tel:${item.parentPhone}`}
                            dir="ltr"
                            className="text-emerald-700 font-black hover:underline"
                          >
                            {item.parentPhone}
                          </a>
                          <a
                            href={`https://wa.me/213${item.parentPhone.replace(/^0/, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-md border border-green-200 font-black"
                          >
                            واتساب
                          </a>
                        </div>
                      </div>
                    )}
                    {item.notes && (
                      <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-200">
                        <span className="font-bold text-slate-700">ملاحظة التلميذ: </span>
                        {item.notes}
                      </div>
                    )}
                  </div>
                )}

                {/* أزرار الإجراء السريع للأستاذ */}
                <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleUpdateStatus(item.id, "approved")}
                    className={`flex-1 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1 ${
                      item.status === "approved"
                        ? "bg-emerald-700 text-white shadow-xs"
                        : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>اعتماد الفوز 🎁</span>
                  </button>

                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleUpdateStatus(item.id, "rejected")}
                    className={`flex-1 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1 ${
                      item.status === "rejected"
                        ? "bg-rose-700 text-white shadow-xs"
                        : "bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200"
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>رفض / غير مستوفي</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition"
                    title="حذف"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* نافذة معاينة الصورة بالحجم الكامل */}
      {activeImageModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-xs animate-in fade-in"
          onClick={() => setActiveImageModal(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[95vh] bg-slate-900 rounded-3xl overflow-hidden border border-slate-700 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 border-b border-slate-800 flex items-center justify-between text-white">
              <a
                href={activeImageModal}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-bold"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>فتح في تبويب جديد / تنزيل</span>
              </a>
              <button
                type="button"
                onClick={() => setActiveImageModal(null)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition"
              >
                <XCircle className="w-5 h-5 text-slate-300" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-2 flex items-center justify-center">
              <img
                src={activeImageModal}
                alt="كشف النقاط بحجم كامل"
                className="max-w-full max-h-[85vh] object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
