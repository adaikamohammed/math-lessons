"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
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
  FileSpreadsheet,
  X,
  Calendar,
  Phone,
  BookOpen,
  Sparkles,
  School,
  Check,
  Filter,
  Eye,
  FileUp,
  CheckSquare,
  Square,
  ArrowRightLeft,
  UserCheck,
  UserX,
  Layers,
  ChevronDown,
} from "lucide-react";
import * as XLSX from "xlsx";
import { StudentRosterItem } from "@/lib/types";

// الأفواج الأربعة الرسمية للأستاذ
export const TEACHER_CLASSES = ["1م1", "1م2", "1م3", "2م3"] as const;
export type TeacherClass = (typeof TEACHER_CLASSES)[number];

// دالة لتوحيد وتصحيح أسماء الأفواج بدقة (إزالة المسافات، تصحيح 2م1 -> 1م2، 3م1 -> 1م3، إلخ)
export function normalizeClassName(raw?: string): TeacherClass {
  if (!raw) return "1م1";
  const s = raw.replace(/\s+/g, "").trim();
  if (s === "1م1" || s === "1-1" || s === "11") return "1م1";
  if (s === "1م2" || s === "2م1" || s === "1-2" || s === "12" || s === "م12") return "1م2";
  if (s === "1م3" || s === "3م1" || s === "1-3" || s === "13" || s === "م13") return "1م3";
  if (s === "2م3" || s === "3م2" || s === "2-3" || s === "23" || s === "م23") return "2م3";
  if (s.startsWith("1م") || s.endsWith("م1")) {
    if (s.includes("1")) return "1م1";
    if (s.includes("2")) return "1م2";
    if (s.includes("3")) return "1م3";
  }
  if (s.startsWith("2م") || s.endsWith("م2")) {
    return "2م3";
  }
  return "1م1";
}

// دالة لمعالجة وتوحيد تواريخ الإكسل بمختلف الصيغ (Serial number, DD/MM/YYYY, YYYY-MM-DD)
function parseExcelDate(val: any): string {
  if (!val) return "";
  if (typeof val === "number") {
    try {
      const date = new Date(Math.round((val - 25569) * 86400 * 1000));
      const y = date.getUTCFullYear();
      const m = String(date.getUTCMonth() + 1).padStart(2, "0");
      const d = String(date.getUTCDate()).padStart(2, "0");
      if (y > 1990 && y < 2030) return `${y}-${m}-${d}`;
    } catch {
      // fallback
    }
  }
  const str = String(val).trim();
  const dmyMatch = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (dmyMatch) {
    const d = dmyMatch[1].padStart(2, "0");
    const m = dmyMatch[2].padStart(2, "0");
    const y = dmyMatch[3];
    return `${y}-${m}-${d}`;
  }
  const ymdMatch = str.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
  if (ymdMatch) {
    const y = ymdMatch[1];
    const m = ymdMatch[2].padStart(2, "0");
    const d = ymdMatch[3].padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return str;
}

export default function AdminStudentsPage() {
  const [roster, setRoster] = useState<StudentRosterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [subgroupFilter, setSubgroupFilter] = useState<"all" | "فوج 1" | "فوج 2">("all");
  const [genderFilter, setGenderFilter] = useState<"all" | "M" | "F">("all");

  // التحديد المتعدد (Bulk Selection)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // تنبيهات الرسائل
  const [alertMsg, setAlertMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // حالة إضافة / تعديل تلميذ فردي
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentRosterItem | null>(null);
  const [studentName, setStudentName] = useState("");
  const [className, setClassName] = useState<TeacherClass>("1م1");
  const [groupName, setGroupName] = useState<"فوج 1" | "فوج 2">("فوج 1");
  const [birthDate, setBirthDate] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [gender, setGender] = useState<"M" | "F">("M");
  const [isRepeater, setIsRepeater] = useState(false);

  // حالة نافذة النقل الجماعي (Bulk Move Modal)
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [targetMoveClass, setTargetMoveClass] = useState<TeacherClass>("1م1");

  // حالة نافذة معاينة واستيراد ملف Excel
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [excelPreviewRows, setExcelPreviewRows] = useState<StudentRosterItem[]>([]);
  const [excelFileName, setExcelFileName] = useState("");
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");
  const [importLoading, setImportLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // إظهار تنبيه مؤقت
  const notify = (type: "ok" | "err", text: string) => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg(null), 4500);
  };

  // جلب قائمة التلاميذ وتوحيد أسماء الأفواج تلقائياً
  const fetchRoster = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/grades?className=&trimester=1");
      const data = await res.json();
      if (data.students) {
        let hasUnnormalized = false;
        const normalized: StudentRosterItem[] = data.students.map((s: any) => {
          const normCls = normalizeClassName(s.className);
          if (s.className !== normCls) {
            hasUnnormalized = true;
          }
          return {
            id: s.studentId || s.id,
            studentName: s.studentName,
            className: normCls,
            groupName: s.groupName || "فوج 1",
            birthDate: s.birthDate || "",
            gender: s.gender === "ذكر" || s.gender === "M" ? "M" : "F",
            isRepeater: Boolean(s.isRepeater),
            parentPhone: s.parentPhone || "",
          };
        });

        setRoster(normalized);

        // إذا كان هناك أي قسم غير موحد، نحفظه في السيرفر فوراً ليتم تنظيف القاعدة نهائياً
        if (hasUnnormalized && normalized.length > 0) {
          fetch("/api/students/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ studentsList: normalized, mode: "replace" }),
          }).catch(() => {});
        }
      }
    } catch (err) {
      console.error(err);
      notify("err", "تعذر جلب بيانات التلاميذ من الخادم");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoster();
  }, []);

  // التلاميذ بعد الفلترة بالقسم، البحث، الفوج، والجنس
  const filteredRoster = useMemo(() => {
    return roster.filter((s) => {
      const matchCls =
        selectedClass === "all" || s.className === selectedClass;

      const matchSearch =
        !search.trim() ||
        s.studentName.toLowerCase().includes(search.toLowerCase()) ||
        (s.parentPhone && s.parentPhone.includes(search)) ||
        (s.birthDate && s.birthDate.includes(search));

      const matchSubgroup =
        subgroupFilter === "all" || (s.groupName || "فوج 1") === subgroupFilter;

      const studentGender = s.gender === "ذكر" || s.gender === "M" ? "M" : "F";
      const matchGender = genderFilter === "all" || studentGender === genderFilter;

      return matchCls && matchSearch && matchSubgroup && matchGender;
    });
  }, [roster, selectedClass, search, subgroupFilter, genderFilter]);

  // إحصائيات الأفواج الأربعة والإجمالي
  const classCounts = useMemo(() => {
    const counts: Record<string, number> = { "1م1": 0, "1م2": 0, "1م3": 0, "2م3": 0 };
    roster.forEach((s) => {
      const c = normalizeClassName(s.className);
      if (counts[c] !== undefined) counts[c]++;
    });
    return counts;
  }, [roster]);

  const stats = useMemo(() => {
    const base =
      selectedClass === "all"
        ? roster
        : roster.filter((s) => s.className === selectedClass);

    const total = base.length;
    const male = base.filter((s) => s.gender === "M" || s.gender === "ذكر").length;
    const female = total - male;
    const g1 = base.filter((s) => (s.groupName || "فوج 1") === "فوج 1").length;
    const g2 = base.filter((s) => (s.groupName || "فوج 1") === "فوج 2").length;
    const repeaters = base.filter((s) => s.isRepeater).length;
    const newStudents = total - repeaters;

    return { total, male, female, g1, g2, repeaters, newStudents };
  }, [roster, selectedClass]);

  // منطق التحديد المتعدد (Selection logic)
  const isAllVisibleSelected = useMemo(() => {
    if (filteredRoster.length === 0) return false;
    return filteredRoster.every((s) => selectedIds.has(s.id));
  }, [filteredRoster, selectedIds]);

  const toggleSelectAllVisible = () => {
    if (isAllVisibleSelected) {
      const next = new Set(selectedIds);
      filteredRoster.forEach((s) => next.delete(s.id));
      setSelectedIds(next);
    } else {
      const next = new Set(selectedIds);
      filteredRoster.forEach((s) => next.add(s.id));
      setSelectedIds(next);
    }
  };

  const toggleSelectRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // حفظ التعديلات الجماعية على السيرفر
  const saveUpdatedRoster = async (updated: StudentRosterItem[], msgSuccess: string) => {
    setSaving(true);
    setRoster(updated);
    try {
      const res = await fetch("/api/students/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentsList: updated,
          mode: "replace",
        }),
      });
      if (!res.ok) throw new Error("فشل الحفظ على السيرفر");
      notify("ok", msgSuccess);
      clearSelection();
    } catch (err: any) {
      console.error(err);
      notify("err", err.message || "حدث خطأ أثناء الحفظ");
      fetchRoster(); // إعادة التحميل عند الخطأ
    } finally {
      setSaving(false);
    }
  };

  // 1. عملية جماعية: نقل التلاميذ المحددين إلى فوج آخر
  const handleBulkMoveClass = async () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    const updated = roster.map((s) => {
      if (selectedIds.has(s.id)) {
        return { ...s, className: targetMoveClass };
      }
      return s;
    });

    await saveUpdatedRoster(
      updated,
      `✅ تم بنجاح نقل ${count} تلميذاً إلى فوج ${targetMoveClass}!`
    );
    setShowMoveModal(false);
  };

  // 2. عملية جماعية: تغيير الفوج الفرعي (فوج 1 أو فوج 2)
  const handleBulkSetSubgroup = async (targetGroup: "فوج 1" | "فوج 2") => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    const updated = roster.map((s) => {
      if (selectedIds.has(s.id)) {
        return { ...s, groupName: targetGroup };
      }
      return s;
    });

    await saveUpdatedRoster(
      updated,
      `✅ تم تعيين ${count} تلميذاً في «${targetGroup}» بنجاح!`
    );
  };

  // 3. عملية جماعية: تغيير الجنس (ذكر / أنثى)
  const handleBulkSetGender = async (targetGender: "M" | "F") => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    const updated = roster.map((s) => {
      if (selectedIds.has(s.id)) {
        return { ...s, gender: targetGender };
      }
      return s;
    });

    const label = targetGender === "M" ? "ذكور" : "إناث";
    await saveUpdatedRoster(
      updated,
      `✅ تم تحويل ${count} تلميذاً إلى «${label}» بنجاح!`
    );
  };

  // 4. عملية جماعية: تغيير الحالة (جديد / معيد)
  const handleBulkSetRepeater = async (isRep: boolean) => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    const updated = roster.map((s) => {
      if (selectedIds.has(s.id)) {
        return { ...s, isRepeater: isRep };
      }
      return s;
    });

    const label = isRep ? "معيدون 🔁" : "جدد ✅";
    await saveUpdatedRoster(
      updated,
      `✅ تم تحديث حالة ${count} تلميذاً إلى «${label}»!`
    );
  };

  // 5. عملية جماعية: حذف التلاميذ المحددين
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    if (!confirm(`⚠️ هل أنت متأكد تماماً من حذف ${count} تلميذاً من القائمة نهائياً؟`)) {
      return;
    }

    const updated = roster.filter((s) => !selectedIds.has(s.id));
    await saveUpdatedRoster(
      updated,
      `🗑️ تم حذف ${count} تلميذاً من القائمة بنجاح.`
    );
  };

  // تبديل سريع للفوج الفرعي بالضغط عليه مباشرة في الجدول
  const handleQuickToggleSubgroup = async (s: StudentRosterItem) => {
    const nextGroup = (s.groupName || "فوج 1") === "فوج 1" ? "فوج 2" : "فوج 1";
    const updated = roster.map((item) =>
      item.id === s.id ? { ...item, groupName: nextGroup } : item
    );
    setRoster(updated);
    try {
      await fetch("/api/students/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentsList: updated, mode: "replace" }),
      });
      notify("ok", `تم تحويل ${s.studentName} إلى ${nextGroup}`);
    } catch {
      notify("err", "فشل التحديث السريع");
    }
  };

  // معالجة ملف الإكسل
  const handleProcessExcelBuffer = (buffer: ArrayBuffer, fileName: string) => {
    try {
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        notify("err", "ملف الإكسل فارغ ولا يحتوي على أوراق عمل!");
        return;
      }
      const worksheet = workbook.Sheets[firstSheetName];
      const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      if (!rawRows || rawRows.length === 0) {
        notify("err", "لم يتم العثور على أي بيانات داخل ملف الإكسل!");
        return;
      }

      const parsedStudents: StudentRosterItem[] = [];

      rawRows.forEach((row, idx) => {
        const nameKey = Object.keys(row).find((k) => {
          const lk = k.trim().toLowerCase();
          return (
            lk.includes("اسم") ||
            lk.includes("لقب") ||
            lk.includes("تلميذ") ||
            lk === "name" ||
            lk === "fullname" ||
            lk === "nom"
          );
        });
        const studentNameVal = nameKey ? String(row[nameKey]).trim() : "";
        if (!studentNameVal) return;

        const classKey = Object.keys(row).find((k) => {
          const lk = k.trim().toLowerCase();
          return lk.includes("قسم") || lk.includes("فوج") || lk.includes("صف") || lk === "class" || lk === "classe";
        });
        let rawClassVal = classKey ? String(row[classKey]).trim() : "";
        if (!rawClassVal) {
          rawClassVal = selectedClass !== "all" ? selectedClass : "1م1";
        }
        const classVal = normalizeClassName(rawClassVal);

        const subgroupKey = Object.keys(row).find((k) => {
          const lk = k.trim().toLowerCase();
          return (
            (lk.includes("فوج") && lk.includes("فرعي")) ||
            lk.includes("مجموعة") ||
            lk === "group" ||
            lk === "subgroup" ||
            lk === "groupe"
          );
        });
        let groupVal: "فوج 1" | "فوج 2" = "فوج 1";
        if (subgroupKey) {
          const subText = String(row[subgroupKey]).trim();
          if (subText.includes("2") || subText.includes("٢")) groupVal = "فوج 2";
        }

        const birthKey = Object.keys(row).find((k) => {
          const lk = k.trim().toLowerCase();
          return (
            lk.includes("ميلاد") ||
            lk.includes("تاريخ") ||
            lk === "dob" ||
            lk === "birthdate" ||
            lk.includes("naissance")
          );
        });
        const birthVal = birthKey ? parseExcelDate(row[birthKey]) : "";

        const genderKey = Object.keys(row).find((k) => {
          const lk = k.trim().toLowerCase();
          return lk.includes("جنس") || lk.includes("نوع") || lk === "gender" || lk === "sexe" || lk === "sex";
        });
        let genderVal: "M" | "F" = "M";
        if (genderKey) {
          const gText = String(row[genderKey]).trim().toLowerCase();
          if (gText.includes("أنثى") || gText.includes("بنت") || gText === "f" || gText === "female") {
            genderVal = "F";
          }
        }

        const repeaterKey = Object.keys(row).find((k) => {
          const lk = k.trim().toLowerCase();
          return lk.includes("حالة") || lk.includes("معيد") || lk.includes("إعادة") || lk === "repeater" || lk === "redoublant";
        });
        let isRepeaterVal = false;
        if (repeaterKey) {
          const rText = String(row[repeaterKey]).trim().toLowerCase();
          if (rText.includes("معيد") || rText === "نعم" || rText === "true" || rText === "1" || rText === "oui") {
            isRepeaterVal = true;
          }
        }

        const phoneKey = Object.keys(row).find((k) => {
          const lk = k.trim().toLowerCase();
          return lk.includes("هاتف") || lk.includes("جوال") || lk === "phone" || lk === "tel" || lk === "telephone";
        });
        const phoneVal = phoneKey ? String(row[phoneKey]).trim() : "";

        parsedStudents.push({
          id: `excel_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
          studentName: studentNameVal,
          className: classVal,
          groupName: groupVal,
          birthDate: birthVal,
          gender: genderVal,
          isRepeater: isRepeaterVal,
          parentPhone: phoneVal,
        });
      });

      if (parsedStudents.length === 0) {
        notify("err", "لم يتم التعرف على أسماء التلاميذ في ملف الإكسل. يرجى مراجعة رؤوس الأعمدة!");
        return;
      }

      setExcelPreviewRows(parsedStudents);
      setExcelFileName(fileName);
      setShowExcelModal(true);
    } catch (err: any) {
      console.error(err);
      notify("err", `حدث خطأ أثناء قراءة ملف الإكسل: ${err.message || "تنسيق غير مدعوم"}`);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      handleProcessExcelBuffer(buffer, file.name);
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      handleProcessExcelBuffer(buffer, file.name);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleConfirmExcelImport = async () => {
    if (excelPreviewRows.length === 0) return;
    setImportLoading(true);

    try {
      const res = await fetch("/api/students/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentsList: excelPreviewRows,
          mode: importMode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل حفظ بيانات الإكسل");

      notify("ok", `🎉 تم استيراد وحفظ ${excelPreviewRows.length} تلميذاً بنجاح في قاعدة البيانات!`);
      setShowExcelModal(false);
      setExcelPreviewRows([]);
      fetchRoster();
    } catch (err: any) {
      notify("err", err.message || "حدث خطأ أثناء الحفظ");
    } finally {
      setImportLoading(false);
    }
  };

  // تنزيل نموذج فارغ للتسجيل
  const handleDownloadBlankTemplate = () => {
    const sampleData = [
      {
        "الرقم": 1,
        "الاسم واللقب": "محمد بن أحمد",
        "القسم": "1م1",
        "الفوج الفرعي": "فوج 1",
        "تاريخ الميلاد": "2012-05-14",
        "الجنس": "ذكر",
        "الحالة": "جديد",
        "هاتف الولي": "0661234567",
        "ملاحظات": "",
      },
      {
        "الرقم": 2,
        "الاسم واللقب": "فاطمة الزهراء علي",
        "القسم": "1م2",
        "الفوج الفرعي": "فوج 2",
        "تاريخ الميلاد": "2012-09-21",
        "الجنس": "أنثى",
        "الحالة": "جديد",
        "هاتف الولي": "0669876543",
        "ملاحظات": "",
      },
      {
        "الرقم": 3,
        "الاسم واللقب": "أمين باهي",
        "القسم": "1م3",
        "الفوج الفرعي": "فوج 1",
        "تاريخ الميلاد": "2011-11-03",
        "الجنس": "ذكر",
        "الحالة": "معيد",
        "هاتف الولي": "0665554433",
        "ملاحظات": "تلميذ معيد",
      },
      {
        "الرقم": 4,
        "الاسم واللقب": "ياسين شريف",
        "القسم": "2م3",
        "الفوج الفرعي": "فوج 2",
        "تاريخ الميلاد": "2011-03-18",
        "الجنس": "ذكر",
        "الحالة": "جديد",
        "هاتف الولي": "0667778899",
        "ملاحظات": "",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "قائمة التلاميذ");
    XLSX.writeFile(workbook, "نموذج_تسجيل_التلاميذ_موقع_الرياضيات.xlsx");
  };

  // تصدير القائمة كملف Excel
  const handleExportCurrentRosterExcel = () => {
    const target =
      selectedClass === "all"
        ? roster
        : roster.filter((s) => s.className === selectedClass);

    if (target.length === 0) {
      notify("err", "لا يوجد تلاميذ لتصديرهم في هذا الفوج!");
      return;
    }

    const exportRows = target.map((s, idx) => ({
      "الرقم": idx + 1,
      "الاسم واللقب": s.studentName,
      "القسم": s.className,
      "الفوج الفرعي": s.groupName || "فوج 1",
      "تاريخ الميلاد": s.birthDate || "",
      "الجنس": s.gender === "M" || s.gender === "ذكر" ? "ذكر" : "أنثى",
      "الحالة": s.isRepeater ? "معيد" : "جديد",
      "هاتف الولي": s.parentPhone || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    const sheetName = selectedClass === "all" ? "جميع التلاميذ" : `فوج ${selectedClass}`;
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.substring(0, 31));

    const fileName =
      selectedClass === "all"
        ? `قائمة_جميع_التلاميذ_${new Date().toISOString().slice(0, 10)}.xlsx`
        : `قائمة_تلاميذ_${selectedClass}_${new Date().toISOString().slice(0, 10)}.xlsx`;

    XLSX.writeFile(workbook, fileName);
    notify("ok", `تم تحميل ملف الإكسل بنجاح: ${fileName}`);
  };

  // حفظ تلميذ يدوي فردي
  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) return;

    const studentPayload: StudentRosterItem = {
      id: editingStudent ? editingStudent.id : `rst_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      studentName: studentName.trim(),
      className: normalizeClassName(className),
      groupName: groupName as any,
      birthDate: birthDate.trim(),
      parentPhone: parentPhone.trim(),
      gender: gender as any,
      isRepeater,
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
        notify("ok", "تم حفظ بيانات التلميذ بنجاح");
      }
    } catch (err) {
      console.error(err);
      notify("err", "فشل حفظ التلميذ");
    }
  };

  const handleEdit = (s: StudentRosterItem) => {
    setEditingStudent(s);
    setStudentName(s.studentName);
    setClassName(normalizeClassName(s.className));
    setGroupName(s.groupName === "فوج 2" ? "فوج 2" : "فوج 1");
    setBirthDate(s.birthDate || "");
    setParentPhone(s.parentPhone || "");
    setGender(s.gender === "ذكر" || s.gender === "M" ? "M" : "F");
    setIsRepeater(Boolean(s.isRepeater));
    setShowAddModal(true);
  };

  const handleDelete = async (s: StudentRosterItem) => {
    if (!confirm(`هل أنت متأكد من حذف التلميذ "${s.studentName}" من القائمة؟`)) return;

    const updated = roster.filter((item) => item.id !== s.id);
    await saveUpdatedRoster(updated, `تم حذف التلميذ ${s.studentName}`);
  };

  const resetForm = () => {
    setStudentName("");
    setClassName(selectedClass !== "all" ? (selectedClass as TeacherClass) : "1م1");
    setGroupName("فوج 1");
    setBirthDate("");
    setParentPhone("");
    setGender("M");
    setIsRepeater(false);
  };

  return (
    <div className="pb-24 pt-3 fade-up space-y-4 max-w-6xl mx-auto px-2 sm:px-4" dir="rtl">
      {/* مدخل رفع ملف الإكسل المخفي */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx, .xls, .csv"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* شريط الإشعارات والتنبيهات */}
      {alertMsg && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-black flex items-center justify-between gap-2 border animate-in fade-in duration-200 shadow-xs ${
            alertMsg.type === "ok"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-700 border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {alertMsg.type === "ok" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            )}
            <span>{alertMsg.text}</span>
          </div>
          <button onClick={() => setAlertMsg(null)} className="p-1 hover:opacity-70">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ─── رأس الصفحة المطور مع أزرار الإكسل البارزة ─── */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 hover:bg-emerald-100 active:scale-95 transition shrink-0"
              title="الرجوع للوحة التحكم"
            >
              <ArrowRight className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-slate-900">
                  إدارة وتفويج التلاميذ
                </h1>
                <span className="text-[11px] bg-emerald-100 text-emerald-800 font-black px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {roster.length} تلميذ 👥
                </span>
                {saving && (
                  <span className="text-[11px] bg-amber-100 text-amber-800 font-black px-2 py-0.5 rounded-full animate-pulse">
                    جاري الحفظ...
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-bold">
                الأستاذ محمد عدايكة — متوسطة المجاهد باهي علي — الوادي
              </p>
            </div>
          </div>

          {/* أزرار الإجراءات الرئيسية الملونة */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* زر رفع ملف الإكسل */}
            <button
              onClick={() => fileInputRef.current?.click()}
              type="button"
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-black transition shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95 ring-2 ring-emerald-500/20"
              title="اضغط لرفع ملف Excel أو CSV لقائمة تلاميذك مباشرة"
            >
              <FileUp className="w-4 h-4 text-emerald-200" />
              <span>📥 رفع ملف Excel</span>
            </button>

            {/* زر تنزيل نموذج فارغ */}
            <button
              onClick={handleDownloadBlankTemplate}
              type="button"
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="تنزيل نموذج Excel فارغ معبأ بالعناوين النموذجية لتسجيل التلاميذ"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>نموذج Excel فارغ</span>
            </button>

            {/* زر تصدير القائمة */}
            <button
              onClick={handleExportCurrentRosterExcel}
              type="button"
              className="px-3 py-2 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="تصدير التلاميذ الحاليين إلى ملف Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600" />
              <span>تصدير Excel 📊</span>
            </button>

            {/* زر إضافة تلميذ يدوي */}
            <button
              onClick={() => {
                resetForm();
                setEditingStudent(null);
                setShowAddModal(true);
              }}
              type="button"
              className="px-3 py-2 rounded-xl bg-slate-900 text-white hover:bg-black text-xs font-black flex items-center gap-1.5 transition active:scale-95"
            >
              <Plus className="w-4 h-4 text-amber-300" />
              <span>إضافة تلميذ</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── محدد الأفواج الأربعة فقط بدقة (1م1، 1م2، 1م3، 2م3) ─── */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <School className="w-4 h-4 text-emerald-700" />
            <h2 className="text-xs sm:text-sm font-black text-slate-900">
              اختر الفوج لعرض وتعديل تلاميذه وتفويجهم:
            </h2>
          </div>
          <span className="text-[11px] font-bold text-slate-400">
            الأفواج الرسمية المسندة: 1م1، 1م2، 1م3، 2م3
          </span>
        </div>

        {/* تبويبات الأفواج الأربعة الصافية */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          {/* زر جميع الأقسام */}
          <button
            onClick={() => {
              setSelectedClass("all");
              clearSelection();
            }}
            className={`px-3.5 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-2xs ${
              selectedClass === "all"
                ? "bg-slate-900 text-white ring-2 ring-slate-800/40 shadow-sm scale-102"
                : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>جميع الأقسام</span>
            <span
              className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-bold ${
                selectedClass === "all" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-800"
              }`}
            >
              {roster.length}
            </span>
          </button>

          {/* تبويبات الأفواج الأربعة المحددة فقط */}
          {TEACHER_CLASSES.map((cls) => {
            const count = classCounts[cls] || 0;
            const isSelected = selectedClass === cls;
            return (
              <button
                key={cls}
                onClick={() => {
                  setSelectedClass(cls);
                  clearSelection();
                }}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-2xs ${
                  isSelected
                    ? "bg-gradient-to-r from-emerald-800 to-teal-800 text-white ring-2 ring-emerald-500/40 shadow-sm scale-102"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 hover:border-slate-300"
                }`}
              >
                <School className={`w-3.5 h-3.5 ${isSelected ? "text-amber-300" : "text-emerald-700"}`} />
                <span>فوج {cls}</span>
                <span
                  className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-bold ${
                    isSelected ? "bg-white/20 text-white" : "bg-slate-200 text-slate-800"
                  }`}
                >
                  {count} تلميذ
                </span>
                {isSelected && <Check className="w-3.5 h-3.5 text-amber-300" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── بطاقة الجدول مع الإحصائيات الملونة والبحث ─── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* شريط الإحصائيات الملونة الدقيقة */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
              <h3 className="text-sm sm:text-base font-black text-slate-900">
                {selectedClass === "all" ? (
                  "قائمة جميع التلاميذ في كافة الأفواج"
                ) : (
                  <span>
                    قائمة وتوثيق تلاميذ: <strong className="text-emerald-800 font-black">فوج {selectedClass}</strong>
                  </span>
                )}
              </h3>
            </div>

            {/* شارات الإحصائيات الملونة */}
            <div className="flex items-center gap-2 text-xs font-bold flex-wrap pt-0.5">
              <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-xl border border-slate-200 font-bold">
                الإجمالي: <strong className="text-slate-900 font-mono font-black">{stats.total}</strong>
              </span>
              <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-1 rounded-xl font-bold">
                👦 ذكور: <strong>{stats.male}</strong>
              </span>
              <span className="bg-pink-50 text-pink-800 border border-pink-200 px-2.5 py-1 rounded-xl font-bold">
                👧 بنات: <strong>{stats.female}</strong>
              </span>
              <span className="bg-purple-50 text-purple-900 border border-purple-200 px-2.5 py-1 rounded-xl font-bold">
                👥 فوج 1: <strong>{stats.g1}</strong>
              </span>
              <span className="bg-amber-50 text-amber-950 border border-amber-200 px-2.5 py-1 rounded-xl font-bold">
                👥 فوج 2: <strong>{stats.g2}</strong>
              </span>
              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-xl font-bold">
                جدد: <strong>{stats.newStudents}</strong>
              </span>
              {stats.repeaters > 0 && (
                <span className="bg-red-50 text-red-700 border border-red-300 px-2.5 py-1 rounded-xl font-black">
                  🔁 معيدون: <strong>{stats.repeaters}</strong>
                </span>
              )}
            </div>
          </div>

          {/* فلاتر سريعة للبحث والتفويج */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* فلتر الفوج الفرعي */}
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 text-xs font-bold">
              <button
                onClick={() => setSubgroupFilter("all")}
                className={`px-2 py-1 rounded-lg transition ${
                  subgroupFilter === "all" ? "bg-slate-900 text-white font-black" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                الكل
              </button>
              <button
                onClick={() => setSubgroupFilter("فوج 1")}
                className={`px-2 py-1 rounded-lg transition ${
                  subgroupFilter === "فوج 1" ? "bg-purple-700 text-white font-black" : "text-slate-600 hover:text-purple-800"
                }`}
              >
                فوج 1
              </button>
              <button
                onClick={() => setSubgroupFilter("فوج 2")}
                className={`px-2 py-1 rounded-lg transition ${
                  subgroupFilter === "فوج 2" ? "bg-amber-700 text-white font-black" : "text-slate-600 hover:text-amber-800"
                }`}
              >
                فوج 2
              </button>
            </div>

            {/* خانة البحث */}
            <div className="relative w-full sm:w-60">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث بالاسم أو تاريخ الميلاد..."
                className="w-full h-9 pr-8 pl-3 text-xs font-bold bg-white border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute left-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ─── منطقة الإفلات السريع إذا كان الفوج فارغاً ─── */}
        {filteredRoster.length === 0 && !loading && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={`m-6 p-8 rounded-3xl border-2 border-dashed text-center transition-all ${
              isDragOver
                ? "border-emerald-500 bg-emerald-50/50 scale-[1.01]"
                : "border-slate-300 bg-slate-50/50 hover:bg-slate-50"
            }`}
          >
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3 shadow-2xs">
              <FileUp className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-black text-slate-900 mb-1">
              لا توجد أسماء تلاميذ معروضة في هذا الفوج حالياً
            </h3>
            <p className="text-xs text-slate-500 font-bold max-w-md mx-auto mb-4">
              اسحب وأفلت ملف إكسل (XLSX / XLS / CSV) هنا مباشرة، أو اضغط على الزر أدناه لتصفح ملف التلاميذ من جهازك
            </p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <button
                onClick={() => fileInputRef.current?.click()}
                type="button"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs transition active:scale-95 flex items-center gap-2"
              >
                <FileUp className="w-4 h-4" />
                <span>اختيار ملف Excel من جهازك</span>
              </button>
              <button
                onClick={handleDownloadBlankTemplate}
                type="button"
                className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition flex items-center gap-1.5"
              >
                <Download className="w-4 h-4 text-slate-500" />
                <span>تحميل نموذج فارغ للتعبئة</span>
              </button>
            </div>
          </div>
        )}

        {/* ─── جدول قائمة التلاميذ مع التحديد المتعدد ─── */}
        {filteredRoster.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100/90 text-slate-700 font-black border-b border-slate-200">
                <tr>
                  {/* مربع اختيار الكل */}
                  <th className="py-3 px-3 w-10 text-center">
                    <button
                      type="button"
                      onClick={toggleSelectAllVisible}
                      className="text-slate-600 hover:text-emerald-700 transition"
                      title={isAllVisibleSelected ? "إلغاء تحديد الكل" : "تحديد الكل"}
                    >
                      {isAllVisibleSelected ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-2 w-10 text-center">#</th>
                  <th className="py-3 px-3.5">اسم ولقب التلميذ</th>
                  <th className="py-3 px-3.5">القسم</th>
                  <th className="py-3 px-3.5">الفوج الفرعي</th>
                  <th className="py-3 px-3.5">تاريخ الميلاد (رمز دخول الولي 🔑)</th>
                  <th className="py-3 px-3.5">الجنس</th>
                  <th className="py-3 px-3.5">الحالة</th>
                  <th className="py-3 px-3.5">هاتف الولي</th>
                  <th className="py-3 px-3.5 text-center w-24">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRoster.map((s, idx) => {
                  const isMale = s.gender === "M" || s.gender === "ذكر";
                  const isSelected = selectedIds.has(s.id);
                  return (
                    <tr
                      key={s.id}
                      className={`transition group ${
                        isSelected
                          ? "bg-emerald-50/80 hover:bg-emerald-100/80"
                          : "hover:bg-slate-50/80"
                      }`}
                    >
                      {/* مربع اختيار السطر */}
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(s.id)}
                          className="w-4 h-4 rounded text-emerald-600 accent-emerald-600 cursor-pointer"
                        />
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                              isMale ? "bg-blue-100 text-blue-700" : "bg-pink-100 text-pink-700"
                            }`}
                          >
                            {isMale ? "👦" : "👧"}
                          </span>
                          <span className="font-black text-slate-900 group-hover:text-emerald-800 transition">
                            {s.studentName}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3.5">
                        <span className="inline-block px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-black font-mono">
                          {s.className}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5">
                        <button
                          type="button"
                          onClick={() => handleQuickToggleSubgroup(s)}
                          className={`inline-block px-2 py-0.5 rounded-lg font-bold text-[11px] cursor-pointer hover:scale-105 active:scale-95 transition ${
                            (s.groupName || "فوج 1") === "فوج 1"
                              ? "bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100"
                              : "bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100"
                          }`}
                          title="انقر للتبديل الفوري بين فوج 1 وفوج 2"
                        >
                          {s.groupName || "فوج 1"} ⇄
                        </button>
                      </td>
                      <td className="py-2.5 px-3.5">
                        {s.birthDate ? (
                          <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                            {s.birthDate}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">غير محدد</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-lg text-[11px] font-bold ${
                            isMale ? "text-blue-700 bg-blue-50" : "text-pink-700 bg-pink-50"
                          }`}
                        >
                          {isMale ? "ذكر" : "أنثى"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5">
                        {s.isRepeater ? (
                          <span className="inline-block px-2 py-0.5 rounded-lg text-[11px] font-black bg-red-50 text-red-700 border border-red-200">
                            معيد
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700">
                            جديد
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3.5 font-mono text-slate-600">
                        {s.parentPhone ? (
                          <a
                            href={`tel:${s.parentPhone}`}
                            className="hover:text-emerald-700 hover:underline flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{s.parentPhone}</span>
                          </a>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3.5 text-center">
                        <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition">
                          <button
                            onClick={() => handleEdit(s)}
                            className="p-1.5 rounded-lg text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition"
                            title="تعديل بيانات التلميذ"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(s)}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                            title="حذف من الفوج"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── شريط العمليات الجماعية العائم (Bulk Actions Floating Bar) ─── */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-4xl w-[94%] bg-slate-900/95 backdrop-blur-md text-white p-3 sm:p-4 rounded-3xl shadow-2xl border border-slate-700 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500 text-slate-900 font-mono font-black text-xs px-2.5 py-1 rounded-xl">
              {selectedIds.size} محدد
            </span>
            <span className="text-xs font-bold hidden sm:inline text-slate-300">
              تم تحديد {selectedIds.size} من أصل {filteredRoster.length} تلميذاً
            </span>
          </div>

          {/* أزرار العمليات الجماعية */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* نقل إلى فوج آخر */}
            <button
              onClick={() => setShowMoveModal(true)}
              type="button"
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition flex items-center gap-1 cursor-pointer active:scale-95"
              title="نقل التلاميذ المحددين إلى فوج آخر (1م1، 1م2، 1م3، 2م3)"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>نقل الفوج 🔄</span>
            </button>

            {/* تفويج فرعي: فوج 1 */}
            <button
              onClick={() => handleBulkSetSubgroup("فوج 1")}
              type="button"
              className="px-2.5 py-1.5 rounded-xl bg-purple-900 hover:bg-purple-800 text-purple-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <span>فوج 1</span>
            </button>

            {/* تفويج فرعي: فوج 2 */}
            <button
              onClick={() => handleBulkSetSubgroup("فوج 2")}
              type="button"
              className="px-2.5 py-1.5 rounded-xl bg-amber-900 hover:bg-amber-800 text-amber-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <span>فوج 2</span>
            </button>

            {/* تعيين كذكور */}
            <button
              onClick={() => handleBulkSetGender("M")}
              type="button"
              className="px-2 py-1.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-blue-200 text-xs font-bold transition cursor-pointer active:scale-95"
              title="تعيين الجنس: ذكر"
            >
              👦 ذكور
            </button>

            {/* تعيين كإناث */}
            <button
              onClick={() => handleBulkSetGender("F")}
              type="button"
              className="px-2 py-1.5 rounded-xl bg-pink-900 hover:bg-pink-800 text-pink-200 text-xs font-bold transition cursor-pointer active:scale-95"
              title="تعيين الجنس: أنثى"
            >
              👧 إناث
            </button>

            {/* تعيين الحالة: جدد */}
            <button
              onClick={() => handleBulkSetRepeater(false)}
              type="button"
              className="px-2 py-1.5 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-emerald-200 text-xs font-bold transition cursor-pointer active:scale-95"
              title="تعيين الحالة: جديد"
            >
              جدد
            </button>

            {/* تعيين الحالة: معيدون */}
            <button
              onClick={() => handleBulkSetRepeater(true)}
              type="button"
              className="px-2 py-1.5 rounded-xl bg-red-900 hover:bg-red-800 text-red-200 text-xs font-bold transition cursor-pointer active:scale-95"
              title="تعيين الحالة: معيد"
            >
              معيدون 🔁
            </button>

            {/* حذف المحدد */}
            <button
              onClick={handleBulkDelete}
              type="button"
              className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black transition flex items-center gap-1 cursor-pointer active:scale-95"
              title="حذف جميع التلاميذ المحددين"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>حذف 🗑️</span>
            </button>

            {/* إلغاء التحديد */}
            <button
              onClick={clearSelection}
              type="button"
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              title="إلغاء التحديد"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ─── نافذة النقل الجماعي للأفواج (Move Modal) ─── */}
      {showMoveModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-slate-900">
                  نقل التلاميذ إلى فوج آخر
                </h3>
              </div>
              <button
                onClick={() => setShowMoveModal(false)}
                className="w-7 h-7 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 font-bold">
              سيتم نقل <strong className="text-emerald-700 font-mono font-black">{selectedIds.size} تلميذاً</strong> محدداً إلى الفوج المختار:
            </p>

            <div className="grid grid-cols-2 gap-2">
              {TEACHER_CLASSES.map((cls) => (
                <button
                  key={cls}
                  type="button"
                  onClick={() => setTargetMoveClass(cls)}
                  className={`p-3 rounded-2xl border text-center transition font-black text-xs cursor-pointer ${
                    targetMoveClass === cls
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : "bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  فوج {cls}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowMoveModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleBulkMoveClass}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>تأكيد النقل إلى فوج {targetMoveClass}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── نافذة معاينة وتأكيد استيراد ملف Excel ─── */}
      {showExcelModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900">
                    معاينة استيراد ملف Excel
                  </h3>
                  <p className="text-xs text-slate-500 font-bold truncate max-w-xs sm:max-w-md">
                    الملف: <span className="font-mono text-emerald-700">{excelFileName}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowExcelModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ملخص البيانات المقروءة */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[11px] font-bold">التلاميذ المكتشفون</span>
                <strong className="text-emerald-700 text-base font-mono font-black">
                  {excelPreviewRows.length}
                </strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[11px] font-bold">الأقسام المكتشفة</span>
                <strong className="text-slate-800 text-xs font-mono font-black">
                  {Array.from(new Set(excelPreviewRows.map((r) => r.className))).join("، ") || "1م1"}
                </strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[11px] font-bold">ذكور / إناث</span>
                <strong className="text-blue-700 text-xs font-bold">
                  {excelPreviewRows.filter((r) => r.gender === "M").length} ذ /{" "}
                  {excelPreviewRows.filter((r) => r.gender === "F").length} أ
                </strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[11px] font-bold">فوج 1 / 2</span>
                <strong className="text-purple-700 text-xs font-bold">
                  {excelPreviewRows.filter((r) => r.groupName === "فوج 1").length} ف1 /{" "}
                  {excelPreviewRows.filter((r) => r.groupName === "فوج 2").length} ف2
                </strong>
              </div>
            </div>

            {/* وضع الاستيراد */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold">
              <span className="text-slate-700">طريقة الحفظ في الموقع:</span>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="merge"
                    checked={importMode === "merge"}
                    onChange={() => setImportMode("merge")}
                    className="accent-emerald-600"
                  />
                  <span>دمج وتحديث (مستحسن)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-red-700">
                  <input
                    type="radio"
                    name="importMode"
                    value="replace"
                    checked={importMode === "replace"}
                    onChange={() => setImportMode("replace")}
                    className="accent-red-600"
                  />
                  <span>استبدال الكل</span>
                </label>
              </div>
            </div>

            {/* جدول عينة من الأسطر */}
            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                  <tr>
                    <th className="py-2 px-3">الاسم واللقب</th>
                    <th className="py-2 px-3">القسم</th>
                    <th className="py-2 px-3">الفوج</th>
                    <th className="py-2 px-3">تاريخ الميلاد</th>
                    <th className="py-2 px-3">الجنس</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {excelPreviewRows.slice(0, 10).map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-bold text-slate-900">{r.studentName}</td>
                      <td className="py-2 px-3 font-mono">{r.className}</td>
                      <td className="py-2 px-3">{r.groupName}</td>
                      <td className="py-2 px-3 font-mono text-slate-600">{r.birthDate || "-"}</td>
                      <td className="py-2 px-3">{r.gender === "M" ? "ذكر" : "أنثى"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {excelPreviewRows.length > 10 && (
                <div className="py-2 text-center text-[11px] font-bold text-slate-500 bg-slate-50 border-t border-slate-100">
                  + {excelPreviewRows.length - 10} تلميذاً إضافياً سيتم استيرادهم أيضاً
                </div>
              )}
            </div>

            {/* أزرار التأكيد */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowExcelModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={importLoading}
                onClick={handleConfirmExcelImport}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition shadow-xs flex items-center gap-2 disabled:opacity-50"
              >
                {importLoading ? (
                  <span>جاري الاستيراد والحفظ...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>تأكيد استيراد {excelPreviewRows.length} تلميذاً الآن</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── نافذة إضافة / تعديل تلميذ فردي ─── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm sm:text-base font-black text-slate-900">
                {editingStudent ? "تعديل بيانات التلميذ" : "إضافة تلميذ جديد"}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-3 text-xs">
              <div>
                <label className="block font-black text-slate-700 mb-1">الاسم واللقب *</label>
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="مثال: محمد بن أحمد"
                  className="w-full h-10 px-3 font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-black text-slate-700 mb-1">القسم</label>
                  <select
                    value={className}
                    onChange={(e) => setClassName(e.target.value as TeacherClass)}
                    className="w-full h-10 px-3 font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none font-mono"
                  >
                    {TEACHER_CLASSES.map((c) => (
                      <option key={c} value={c}>
                        فوج {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-black text-slate-700 mb-1">الفوج الفرعي</label>
                  <select
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value as "فوج 1" | "فوج 2")}
                    className="w-full h-10 px-3 font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none"
                  >
                    <option value="فوج 1">فوج 1</option>
                    <option value="فوج 2">فوج 2</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-black text-slate-700 mb-1">
                  تاريخ الميلاد (رمز دخول الولي 🔑)
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full h-10 px-3 font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-black text-slate-700 mb-1">الجنس</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as "M" | "F")}
                    className="w-full h-10 px-3 font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none"
                  >
                    <option value="M">ذكر 👦</option>
                    <option value="F">أنثى 👧</option>
                  </select>
                </div>
                <div>
                  <label className="block font-black text-slate-700 mb-1">الحالة</label>
                  <select
                    value={isRepeater ? "yes" : "no"}
                    onChange={(e) => setIsRepeater(e.target.value === "yes")}
                    className="w-full h-10 px-3 font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none"
                  >
                    <option value="no">جديد</option>
                    <option value="yes">معيد 🔁</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-black text-slate-700 mb-1">هاتف الولي (اختياري)</label>
                <input
                  type="tel"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  placeholder="0661234567"
                  className="w-full h-10 px-3 font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black transition shadow-xs"
                >
                  حفظ التلميذ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
