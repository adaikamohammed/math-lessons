"use client";

import { useState, useMemo, ChangeEvent, FormEvent } from "react";
import {
  X,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileText,
  Smartphone,
  Sparkles,
  Camera,
  Image as ImageIcon,
  Loader2,
  Gift,
  Trophy,
} from "lucide-react";
import imageCompression from "browser-image-compression";
import {
  RewardChallengeTier,
  RewardChallengeTierId,
  REWARD_TIERS,
} from "@/lib/types";

interface StudentOption {
  studentName: string;
  className: string;
  tierId: RewardChallengeTierId;
}

interface RewardProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: StudentOption[];
  preSelectedStudent?: StudentOption | null;
  onSuccess?: () => void;
}

export default function RewardProofModal({
  isOpen,
  onClose,
  students,
  preSelectedStudent,
  onSuccess,
}: RewardProofModalProps) {
  const [selectedClass, setSelectedClass] = useState<string>(
    preSelectedStudent?.className || "1م1"
  );
  const [selectedStudentName, setSelectedStudentName] = useState<string>(
    preSelectedStudent?.studentName || ""
  );
  const [parentPhone, setParentPhone] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // تحديث القسم واسم التلميذ عند تغيير preSelectedStudent
  const currentStudent = useMemo(() => {
    if (preSelectedStudent && preSelectedStudent.studentName === selectedStudentName) {
      return preSelectedStudent;
    }
    return students.find(
      (s) => s.className === selectedClass && s.studentName === selectedStudentName
    );
  }, [students, selectedClass, selectedStudentName, preSelectedStudent]);

  const currentTier: RewardChallengeTier | undefined = useMemo(() => {
    const tierId = currentStudent?.tierId;
    return REWARD_TIERS.find((t) => t.id === tierId);
  }, [currentStudent]);

  // قائمة تلاميذ القسم المختار
  const classStudents = useMemo(() => {
    return students
      .filter((s) => s.className === selectedClass)
      .sort((a, b) => a.studentName.localeCompare(b.studentName, "ar"));
  }, [students, selectedClass]);

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    setError("");
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("يرجى اختيار ملف صورة صالح (JPG أو PNG)");
      return;
    }

    try {
      // ضغط الصورة تلقائياً لتسريع الرفع
      const options = {
        maxSizeMB: 1.5,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };
      const compressed = await imageCompression(file, options);
      setImageFile(compressed);
      const url = URL.createObjectURL(compressed);
      setPreviewUrl(url);
    } catch {
      // في حال تعذر الضغط نستخدم الملف الأصلي
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedStudentName) {
      setError("يرجى اختيار اسم التلميذ من القائمة");
      return;
    }

    if (!imageFile) {
      setError("يرجى إرفاق صورة واضحة لكشف النقاط أو ورقة الاختبار");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("studentName", selectedStudentName);
      formData.append("className", selectedClass);
      formData.append("tierId", currentStudent?.tierId || "tier1_remontada");
      formData.append("parentPhone", parentPhone.trim());
      formData.append("notes", notes.trim());
      formData.append("file", imageFile);

      const res = await fetch("/api/rewards/claim", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "حدث خطأ أثناء رفع الصورة");
      }

      setIsSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || "تعذر إرسال الطلب، يرجى المحاولة مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setIsSuccess(false);
    setImageFile(null);
    setPreviewUrl(null);
    setParentPhone("");
    setNotes("");
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto border border-slate-200 text-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* رأس النافذة */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
          <button
            type="button"
            onClick={handleReset}
            className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition flex items-center justify-center"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5 justify-end">
                <span>تأكيد الإنجاز ورفع كشف النقاط</span>
                <span className="text-lg">📸</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                إرسال إثبات علامة الاختبار أو كشف الفصل للأستاذ محمد عدايكة
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-emerald-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
              <Gift className="w-5 h-5" />
            </div>
          </div>
        </div>

        {isSuccess ? (
          /* حالة النجاح */
          <div className="p-6 sm:p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-lg font-black text-slate-900">
                تم استلام كشف النقاط بنجاح! 🏆
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                تهانينا للتلميذ(ة){" "}
                <strong className="text-emerald-700">{selectedStudentName}</strong> على هذا
                الإنجاز والاجتهاد. ستصل صورة الكشف مباشرة للأستاذ لمراجعتها وتأكيد التكريم
                واستحقاق الهدية بإذن الله.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3 text-[11px] text-amber-900 leading-relaxed font-medium">
              💡 سيتم إعلان الفائزين المؤكدين وتكريمهم داخل الأقسام من طرف الأستاذ محمد عدايكة.
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="w-full py-3 rounded-2xl bg-emerald-700 text-white font-black text-sm shadow-md hover:bg-emerald-800 active:scale-98 transition"
            >
              تم، العودة إلى صفحة التحدي
            </button>
          </div>
        ) : (
          /* نموذج الإدخال */
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            {/* 1. اختيار القسم والتلميذ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">
                  1. اختر القسم الدراسي:
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => {
                    setSelectedClass(e.target.value);
                    setSelectedStudentName("");
                  }}
                  className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition"
                >
                  <option value="1م1">1 متوسط 1 (1م1)</option>
                  <option value="1م2">1 متوسط 2 (1م2)</option>
                  <option value="1م3">1 متوسط 3 (1م3)</option>
                  <option value="2م3">2 متوسط 3 (2م3)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">
                  2. اسم التلميذ(ة):
                </label>
                <select
                  value={selectedStudentName}
                  onChange={(e) => setSelectedStudentName(e.target.value)}
                  className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition"
                >
                  <option value="">-- اضغط لاختيار اسم التلميذ --</option>
                  {classStudents.map((s) => (
                    <option key={s.studentName} value={s.studentName}>
                      {s.studentName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* بطاقة توضيح فئة التلميذ وشرطه المطلوب */}
            {currentStudent && currentTier && (
              <div className="bg-gradient-to-r from-emerald-50 via-teal-50/50 to-amber-50 p-3.5 rounded-2xl border border-emerald-200/90 space-y-1.5 animate-in fade-in">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-black text-emerald-900 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>فئة التحدي المسجلة:</span>
                  </span>
                  <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-white text-emerald-800 border border-emerald-200 shadow-2xs">
                    {currentTier.badge}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-700">
                  {currentTier.name}
                </div>
                <div className="text-xs font-black text-amber-900 bg-white/80 p-2 rounded-xl border border-amber-200/70 flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>الشرط المطلوب للفوز بالهدية: {currentTier.conditionText}</span>
                </div>
              </div>
            )}

            {/* 2. منطقة رفع صورة كشف النقاط */}
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1.5">
                3. صورة كشف النقاط الرسمي أو ورقة الاختبار 📄:
              </label>

              {previewUrl ? (
                <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500/80 bg-slate-50 group">
                  <img
                    src={previewUrl}
                    alt="معاينة كشف النقاط"
                    className="w-full max-h-56 object-contain mx-auto"
                  />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                    <label
                      htmlFor="proof-upload-input"
                      className="cursor-pointer bg-white text-slate-800 text-xs font-black px-3 py-1.5 rounded-xl shadow-md hover:bg-slate-100 transition"
                    >
                      تغيير الصورة
                    </label>
                  </div>
                </div>
              ) : (
                <label
                  htmlFor="proof-upload-input"
                  className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl bg-slate-50 hover:bg-emerald-50/30 transition cursor-pointer text-center group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-emerald-600 flex items-center justify-center shadow-2xs group-hover:scale-105 transition mb-2">
                    <Camera className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-black text-slate-800">
                    اضغط لالتقاط صورة أو اختيارها من الجهاز
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1">
                    تصوير واضح لكشف النقاط أو صفحة علامة مادة الرياضيات
                  </span>
                </label>
              )}

              <input
                id="proof-upload-input"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

            {/* 3. رقم هاتف الولي وملاحظة */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  رقم هاتف الولي (اختياري للتواصل):
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    placeholder="06 / 07 / 05..."
                    dir="ltr"
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-hidden text-right transition"
                  />
                  <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  ملاحظة أو تعليق (اختياري):
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثلاً: علامة الاختبار 20 والمعدل 16.5..."
                  className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition"
                />
              </div>
            </div>

            {/* تنبيه تنظيمي للأولياء */}
            <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl text-[10px] text-amber-900 leading-relaxed font-semibold">
              ⚠️ <strong>تنبيه:</strong> توزع الهدايا بحسب عدد الفائزين، وقد يتم تشديد معايير
              المفاضلة في حال كان عدد الفائزين أكثر من المتوقع لتكريم الأكثر استحقاقاً.
            </div>

            {/* أزرار الإجراء */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs shadow-md shadow-emerald-600/20 active:scale-98 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري الرفع والإرسال للأستاذ...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>إرسال وتأكيد الفوز بالهدية ✓</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleReset}
                disabled={loading}
                className="px-4 py-3 rounded-2xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition"
              >
                إلغاء
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
