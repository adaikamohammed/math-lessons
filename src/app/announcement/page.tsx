"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  Clock,
  MapPin,
  BookOpen,
  Scale,
  Users,
  GraduationCap,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  FolderCheck,
  ChevronDown,
} from "lucide-react";

export default function AnnouncementPage() {
  const [activeTab, setActiveTab] = useState<"all" | "support" | "supplies" | "charter" | "reception">("all");

  return (
    <div className="pb-16 pt-3 fade-up space-y-5">
      {/* رأس الصفحة وزر الرجوع */}
      <div className="flex items-center gap-3 bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs">
        <Link
          href="/"
          className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 active:scale-95 transition shrink-0"
          aria-label="الرجوع للرئيسية"
        >
          <ArrowRight className="w-5 h-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/60 mb-0.5">
            <Sparkles className="w-3 h-3 text-amber-600" /> إعلان هام وتوجيهات رسمية
          </span>
          <h1 className="text-base font-extrabold text-slate-900 truncate">
            دروس الدعم والتوجيهات التربوية
          </h1>
          <p className="text-[11px] text-slate-500">
            الأستاذ محمد عدايكة — متوسطة المجاهد باهي علي
          </p>
        </div>
      </div>

      {/* شريط التبويبات السريعة للتنقل */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-bold">
        {[
          { id: "all", label: "📋 الدليل كاملاً" },
          { id: "support", label: "🏫 دروس الدعم" },
          { id: "supplies", label: "📚 الكراريس والأدوات" },
          { id: "charter", label: "⚖️ ميثاق التقويم" },
          { id: "reception", label: "🤝 ساعة الاستقبال" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition shrink-0 ${
              activeTab === tab.id
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-100 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ==================== 1. قسم دروس الدعم ==================== */}
      {(activeTab === "all" || activeTab === "support") && (
        <section className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-5 text-white shadow-md space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-black">حصص الدعم المدرسي في مادة الرياضيات</h2>
              <p className="text-xs text-emerald-100">تحت إشراف الأستاذ محمد عدايكة</p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-2xl p-3.5 border border-white/20 text-xs space-y-2">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-emerald-200 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">المكان: </span>
                <span>أكاديمية ستار سكول (مقابل صيدلية دو، وتحديداً فوق وكالة قميرة للسياحة والسفر).</span>
              </div>
            </div>
          </div>

          {/* مواعيد الأفواج */}
          <div className="grid sm:grid-cols-2 gap-3">
            {/* 1 متوسط */}
            <div className="bg-white rounded-2xl p-4 text-slate-800 shadow-sm border border-emerald-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-extrabold text-xs">
                  السنة الأولى متوسط (1م)
                </span>
                <span className="text-[11px] text-slate-400 font-bold">فوج الدعم</span>
              </div>
              <div className="text-xs space-y-1.5 pt-1">
                <div className="flex items-center gap-2 text-slate-700">
                  <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>الانطلاق:</strong> السبت 10 أكتوبر 2026</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>التوقيت:</strong> من 12:00 إلى 14:00 زوالاً</span>
                </div>
              </div>
            </div>

            {/* 2 متوسط */}
            <div className="bg-white rounded-2xl p-4 text-slate-800 shadow-sm border border-sky-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg bg-sky-100 text-sky-800 font-extrabold text-xs">
                  السنة الثانية متوسط (2م)
                </span>
                <span className="text-[11px] text-slate-400 font-bold">فوج الدعم</span>
              </div>
              <div className="text-xs space-y-1.5 pt-1">
                <div className="flex items-center gap-2 text-slate-700">
                  <Calendar className="w-4 h-4 text-sky-600 shrink-0" />
                  <span><strong>الانطلاق:</strong> السبت 10 أكتوبر 2026</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Clock className="w-4 h-4 text-sky-600 shrink-0" />
                  <span><strong>التوقيت:</strong> من 08:00 إلى 10:00 صباحاً</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ==================== 2. قسم الأدوات وتنظيم الكراريس ==================== */}
      {(activeTab === "all" || activeTab === "supplies") && (
        <section className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-800">الأدوات المدرسية وطريقة مسك وتنظيم الكراريس</h2>
              <p className="text-[11px] text-slate-400">تعليمات صارمة تضمن للتلميذ التفوق وحصد نقاط التقويم</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            {/* كراس الدروس */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  كراس الدروس (192 صفحة)
                </span>
                <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                  عليه 5 نقاط في التقويم
                </span>
              </div>
              <ul className="space-y-1.5 text-slate-600 pr-3 list-disc marker:text-emerald-500 text-[11px] leading-relaxed">
                <li><strong>تنظيم صارم وخط واضح:</strong> كراس منظم ومكتوب بطريقة صحيحة تُمكّن التلميذ من المراجعة الجيدة.</li>
                <li><strong>بداية كل مقطع تعليمي:</strong> نقوم بطي ورقة ونكتب فيها اسم المقطع التعليمي.</li>
                <li><strong>آخر 10 أوراق:</strong> تُخصص لحل الفروض والامتحانات السابقة وتصحيحها.</li>
                <li><strong className="text-red-600">تنبيه صارم في التقويم المستمر:</strong> لن يتم التهاون في الدروس الناقصة؛ فمثلاً إذا أنجزنا 20 درساً في الفصل وينقصك 3 دروس تنال (0 من 5) في نقطة الكراس!</li>
              </ul>
            </div>

            {/* كراس المحاولات */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <div className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                كراس المحاولات (96 صفحة)
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                مخصص للمحاولات الفردية داخل القسم، وحل الواجبات المنزلية في البيت. لا يُشترط كتابة التاريخ وإن كان أفضل، لكن <strong>الأهم هو بذل الجهد والمحاولة المستمرة في كل تمرين</strong>.
              </p>
            </div>

            {/* كراس الأعمال الموجهة */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <div className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                كراس الأعمال الموجهة (96 صفحة)
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                يُستعمل <strong>حصراً في حصص التفويج (نصف القسم)</strong> لحل سلاسل التمارين التطبيقية. يجب أن يكون منظماً جداً لأنه يمثل مرجعاً أساسياً ومكثفاً لمراجعة الاختبارات.
              </p>
            </div>

            {/* قاعدة الكتاب المدرسي واللوازم الهندسية */}
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
              <div className="font-extrabold text-amber-900 text-xs flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                قاعدة الكتاب المدرسي والأدوات الهندسية
              </div>
              <div className="text-amber-800 text-[11px] space-y-1 leading-relaxed">
                <p>
                  📖 <strong>كتاب الرياضيات:</strong> لتخفيف ثقل الحقيبة، يُكتفى بـ <strong>كتاب واحد مشترك لكل طاولة</strong> (تلميذين). لكن عدم وجود أي كتاب على الطاولة يعني إنقاص علامة لكلا التلميذين!
                </p>
                <p>
                  📐 <strong>اللوازم الضرورية دائماً:</strong> السيالة، المسطرة، والأدوات الهندسية كاملة (الكوس، نصف الدائرة، المدور).
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ==================== 3. قسم ميثاق التقويم والشفافية ==================== */}
      {(activeTab === "all" || activeTab === "charter") && (
        <section className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-800">ميثاق العمل والتقويم والعدل بين التلاميذ</h2>
              <p className="text-[11px] text-slate-400">مبادئ ثابتة يلتزم بها الأستاذ في تدريس أبنائكم</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            {/* بطاقة 1: العدل التام في العلامات */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <h3 className="font-extrabold text-slate-800 flex items-center gap-1.5 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                التنقيط وفق نظام دقيق أدق من الشعرة
              </h3>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                التسجيل في دروس الدعم معي <strong>لا يعني مطلقاً إعطاء الفرض أو الامتحان أو أي زيادة في النقاط</strong>. هذا يتعارض مع مبادئنا وتربيتنا. العلامة هي تحصيل حاصل لمجهود التلميذ وفهمه، وأشهد الله أن كل ذي حق سيأخذ حقه بدقة متناهية ودون مجاملة.
              </p>
            </div>

            {/* بطاقة 2: من يحتاج الدعم؟ */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <h3 className="font-extrabold text-slate-800 flex items-center gap-1.5 text-xs">
                <HelpCircle className="w-4 h-4 text-sky-600 shrink-0" />
                هل يحتاج كل تلميذ إلى دروس الدعم؟
              </h3>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                <strong>ليس كل التلاميذ بحاجة إليها!</strong> التلاميذ المتفوقون أنصحهم بالمراجعة الفردية بالبيت وحل الواجبات. إنما دروس الدعم وُجدت لمن يجد صعوبة في الانضباط والمراجعة بمفرده في البيت.
              </p>
            </div>

            {/* بطاقة 3: الانضباط بدون ضرب */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <h3 className="font-extrabold text-slate-800 flex items-center gap-1.5 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                طريقة التدريس وضبط القسم
              </h3>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                الضرب ممنوع قانونياً ولا أستعمله كوسيلة للضبط. ما عليّ هو تقديم الدرس على أكمل وجه؛ لا أجلس على الكرسي طيلة الحصة، بل أتنقل بين التلاميذ، أشرح، وأجيب عن الأسئلة، وأقدم واجباً منزلياً في كل حصة لترسيخ الفهم. ابنك لن يحتاج الدعم إن تابع واجتهد في القسم والبيت.
              </p>
            </div>

            {/* بطاقة 4: شعار الأستاذ */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-1 text-center py-3">
              <p className="font-bold text-emerald-800 text-xs">
                قال رسول الله ﷺ: «إن الله يحب إذا عمل أحدكم عملاً أن يتقنه»
              </p>
              <p className="text-emerald-700 text-[11px]">
                شعارنا إتقان العمل وبذل أقصى مجهود لضمان فهم واستيعاب أبنائكم دون أي تقصير.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ==================== 4. قسم استقبال الأولياء ==================== */}
      {(activeTab === "all" || activeTab === "reception") && (
        <section className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-800">ساعة استقبال أولياء الأمور</h2>
              <p className="text-[11px] text-slate-400">التواصل المستمر لصالح التلميذ من بداية السنة</p>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2.5 text-xs">
            <div className="flex items-center gap-2 text-emerald-800 font-extrabold">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>الموعد: كل يوم أربعاء من 10:00 إلى 11:00 صباحاً</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              <strong>رسالة من القلب لأولياء الأمور:</strong> أرحب بكم بكل سرور في ساعة الاستقبال للاطمئنان على مستوى أبنائكم. نرجو أن يكون الحرص من بداية السنة (تفقد الكراس، التأكد من حل الواجبات، متابعة الانضباط)، وليس فقط الحضور بعد إعلان كشوف النقاط للمطالبة بزيادة العلامات؛ فالتنقيط أمانة وعدل لا محاباة فيه.
            </p>
          </div>
        </section>
      )}

      {/* ==================== 5. نبذة عن الأستاذ والمنصة ==================== */}
      <section className="bg-slate-900 text-white rounded-3xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-xs font-black">نبذة عن الأستاذ في مجال التعليم</h3>
            <p className="text-[10px] text-slate-400">محمد عدايكة — باحث وأستاذ مادة الرياضيات</p>
          </div>
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          • طالب دكتوراه (سنة 4) بجامعة برج بوعريرج.<br />
          • من مؤسسي منصة <strong>تعلم بلس</strong> لتطوير التعليم رقمياً، وتطبيقات تعليمية متوفرة على متجر Google Play.<br />
          • تم تطوير هذا الموقع الخاص بالدروس لمساعدة التلاميذ على تدارك أي درس غابوا عنه، لكن تبقى الكتابة الحية في القسم هي الأساس الإلزامي.
        </p>
      </section>

      {/* زر العودة للدروس */}
      <div className="text-center pt-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 active:scale-95 transition shadow-sm"
        >
          <span>العودة لاختيار السنة الدراسية والدروس</span>
          <ArrowRight className="w-4 h-4 rotate-180" />
        </Link>
      </div>
    </div>
  );
}
