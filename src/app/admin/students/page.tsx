"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Users,
  Plus,
  Trash2,
  Edit2,
  Upload,
  Download,
  Search,
  CheckCircle2,
  AlertCircle,
  FileJson,
  X,
  Calendar,
  Phone,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { StudentRosterItem } from "@/lib/types";

const CLASSES = ["الكل", "1م1", "1م2", "1م3", "2م3"];

export default function AdminStudentsPage() {
  const [roster, setRoster] = useState<StudentRosterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState("الكل");
  const [search, setSearch] = useState("");

  // حالة إضافة / تعديل تلميذ
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentRosterItem | null>(null);
  const [studentName, setStudentName] = useState("");
  const [className, setClassName] = useState("1م1");
  const [groupName, setGroupName] = useState("فوج 1");
  const [birthDate, setBirthDate] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [gender, setGender] = useState("M");

  // حالة نافذة الاستيراد من جسور
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJsonText, setImportJsonText] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [importFeedback, setImportFeedback] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // جلب قائمة التلاميذ
  const fetchRoster = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/grades?className=&trimester=1");
      const data = await res.json();
      if (data.students) {
        setRoster(
          data.students.map((s: any) => ({
            id: s.studentId,
            studentName: s.studentName,
            className: s.className,
            groupName: s.groupName,
            birthDate: s.birthDate,
            gender: s.gender,
            parentPhone: s.parentPhone || "",
          }))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoster();
  }, []);

  const normalizeClass = (c?: string) => (c ? c.replace(/\s+/g, "").trim() : "");

  const filteredRoster = useMemo(() => {
    return roster.filter((s) => {
      const matchCls =
        selectedClass === "الكل" ||
        normalizeClass(s.className) === normalizeClass(selectedClass);
      const matchSearch =
        s.studentName.toLowerCase().includes(search.toLowerCase()) ||
        (s.parentPhone && s.parentPhone.includes(search)) ||
        (s.birthDate && s.birthDate.includes(search));
      return matchCls && matchSearch;
    });
  }, [roster, selectedClass, search]);

  // حفظ تلميذ جديد أو تعديل
  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) return;

    const studentPayload: StudentRosterItem = {
      id: editingStudent ? editingStudent.id : `rst_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      studentName: studentName.trim(),
      className,
      groupName: groupName as any,
      birthDate: birthDate.trim(),
      parentPhone: parentPhone.trim(),
      gender: gender as any,
    };

    try {
      const res = await fetch("/api/students/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentsList: [studentPayload],
          mode: "merge",
        }),
      });
      if (res.ok) {
        setShowAddModal(false);
        setEditingStudent(null);
        resetForm();
        fetchRoster();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (s: StudentRosterItem) => {
    setEditingStudent(s);
    setStudentName(s.studentName);
    setClassName(s.className);
    setGroupName(s.groupName || "فوج 1");
    setBirthDate(s.birthDate || "");
    setParentPhone(s.parentPhone || "");
    setGender(s.gender || "M");
    setShowAddModal(true);
  };

  const handleDelete = async (s: StudentRosterItem) => {
    if (!confirm(`هل أنت متأكد من حذف التلميذ "${s.studentName}" من الفوج؟`)) return;

    const updated = roster.filter((item) => item.id !== s.id);
    setRoster(updated);
    try {
      await fetch("/api/students/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentsList: updated,
          mode: "replace",
        }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setStudentName("");
    setClassName("1م1");
    setGroupName("فوج 1");
    setBirthDate("");
    setParentPhone("");
    setGender("M");
  };

  // استيراد من جسور
  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setImportError(null);
    setImportFeedback(null);
    if (!importJsonText.trim()) {
      setImportError("يرجى لصق نص ملف JSON الخاص بموقع جسور أولاً");
      return;
    }

    setImportLoading(true);
    try {
      const res = await fetch("/api/students/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawJson: importJsonText,
          mode: "merge",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل الاستيراد");

      setImportFeedback(data.message || "تم استيراد التلاميذ بنجاح!");
      fetchRoster();
      setTimeout(() => {
        setShowImportModal(false);
        setImportJsonText("");
        setImportFeedback(null);
      }, 1500);
    } catch (err: any) {
      setImportError(err.message || "حدث خطأ أثناء الاستيراد");
    } finally {
      setImportLoading(false);
    }
  };

  // رفع ملف JSON من الجهاز
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportJsonText(content);
    };
    reader.readAsText(file);
  };

  // تصدير نسخة احتياطية
  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(roster, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `students_roster_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="pb-16 pt-3 fade-up space-y-4 max-w-6xl mx-auto">
      {/* رأس الصفحة وزر الرجوع */}
      <div className="flex items-center gap-3 bg-white p-3.5 rounded-2xl border border-emerald-100 shadow-2xs">
        <Link
          href="/admin"
          className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 hover:bg-emerald-100 active:scale-95 transition shrink-0"
          aria-label="الرجوع للوحة التحكم"
        >
          <ArrowRight className="w-5 h-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h1 className="text-base font-black text-slate-900 truncate">
              إدارة الأفواج وقوائم التلاميذ
            </h1>
            <span className="text-[11px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded-full border border-emerald-200">
              {roster.length} تلميذاً 👥
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-bold truncate">
            الأستاذ محمد عدايكة — متوسطة المجاهد باهي علي
          </p>
        </div>

        {/* أزرار الإجراءات السريعة */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white hover:from-emerald-700 hover:to-teal-800 text-xs font-black flex items-center gap-1.5 shadow-xs transition active:scale-95"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">استيراد من جسور</span>
          </button>

          <button
            onClick={handleExport}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-black flex items-center gap-1.5 transition active:scale-95"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">تصدير</span>
          </button>

          <button
            onClick={() => {
              resetForm();
              setEditingStudent(null);
              setShowAddModal(true);
            }}
            className="px-3 py-2 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200 text-xs font-black flex items-center gap-1.5 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة تلميذ</span>
          </button>
        </div>
      </div>

      {/* شريط الفلترة والبحث */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* اختيار الفوج */}
        <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {CLASSES.map((cls) => (
            <button
              key={cls}
              onClick={() => setSelectedClass(cls)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition border shrink-0 ${
                selectedClass === cls
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              {cls}
            </button>
          ))}
        </div>

        {/* خانة البحث السريع */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو تاريخ الميلاد..."
            className="w-full h-10 pr-9 pl-3 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
        </div>
      </div>

      {/* جدول التلاميذ */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-500 font-black border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 w-12 text-center">#</th>
                <th className="py-3 px-3">اسم ولقب التلميذ</th>
                <th className="py-3 px-3">القسم</th>
                <th className="py-3 px-3">الفوج الفرعي</th>
                <th className="py-3 px-3">تاريخ الميلاد (كود الولي)</th>
                <th className="py-3 px-3">هاتف الولي</th>
                <th className="py-3 px-3 text-center w-24">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-bold">
                    جاري تحميل قائمة التلاميذ...
                  </td>
                </tr>
              ) : filteredRoster.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-bold">
                    لا يوجد تلاميذ مطابقون في هذا القسم. اضغط على «استيراد من جسور» لإدراجهم بنقرة واحدة!
                  </td>
                </tr>
              ) : (
                filteredRoster.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-black text-slate-900">{s.studentName}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 font-black border border-emerald-200 text-[11px]">
                        {s.className}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-600">{s.groupName || "فوج 1"}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                      {s.birthDate || <span className="text-slate-300 font-sans">غير مسجل</span>}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-600">
                      {s.parentPhone || <span className="text-slate-300 font-sans">—</span>}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleEdit(s)}
                          className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition active:scale-95"
                          title="تعديل"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(s)}
                          className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition active:scale-95"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* نافذة استيراد ملف جسور (JSON) */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 fade-up">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <FileJson className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-slate-900">
                  استيراد قوائم التلاميذ من موقع جسور
                </h3>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-50 text-slate-400 hover:text-slate-600 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              يمكنك رفع ملف JSON المُصدّر من موقع جسور مباشرة، أو نسخ ولصق محتواه في المربع أدناه. سيقوم النظام فوراً بتوزيع التلاميذ على أقسامهم (1م1، 1م2، 1م3، 2م3) وحفظ تواريخ الميلاد.
            </p>

            <form onSubmit={handleImportSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  اختيار ملف من جهازك:
                </label>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  أو الصق نص الـ JSON هنا:
                </label>
                <textarea
                  rows={6}
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  placeholder='الصق كود JSON هنا... مثلا: [{"studentName": "...", "className": "1م1", "birthDate": "2013-05-14"}]'
                  className="w-full p-3 font-mono text-[11px] bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition outline-none"
                />
              </div>

              {importError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {importFeedback && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{importFeedback}</span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="flex-1 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={importLoading}
                  className="flex-1 h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs shadow-xs transition disabled:opacity-60"
                >
                  {importLoading ? "جاري الاستيراد..." : "بدء الاستيراد والحفظ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* نافذة إضافة / تعديل تلميذ */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 fade-up">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900">
                {editingStudent ? "تعديل بيانات التلميذ" : "إضافة تلميذ جديد للفوج"}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-50 text-slate-400 hover:text-slate-600 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">اسم ولقب التلميذ:</label>
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="مثال: رحماني مرام"
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">القسم:</label>
                  <select
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none font-bold"
                  >
                    {CLASSES.filter((c) => c !== "الكل").map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">الفوج الفرعي:</label>
                  <select
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none font-bold"
                  >
                    <option value="فوج 1">فوج 1</option>
                    <option value="فوج 2">فوج 2</option>
                    <option value="القسم كامل">القسم كامل</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">تاريخ الميلاد (كود استعلام الولي):</label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">هاتف الولي:</label>
                  <input
                    type="tel"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    placeholder="0661..."
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">الجنس:</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none font-bold"
                  >
                    <option value="M">ذكر 👦</option>
                    <option value="F">أنثى 👧</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-xs transition"
                >
                  حفظ البيانات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
