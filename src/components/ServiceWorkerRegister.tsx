"use client";

import { useEffect, useState } from "react";
import { WifiOff, Wifi, Sparkles } from "lucide-react";

export function ServiceWorkerRegister() {
  const [isOffline, setIsOffline] = useState(false);
  const [showBackOnline, setShowBackOnline] = useState(false);

  useEffect(() => {
    // 1. تسجيل Service Worker في المتصفح لدعم التصفح دون إنترنت
    if ("serviceWorker" in navigator && typeof window !== "undefined") {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          // فحص التحديثات
          reg.onupdatefound = () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
                  console.log("نسخة جديدة من المنصة متاحة أوفلاين.");
                }
              };
            }
          };
        })
        .catch((err) => {
          console.warn("Service Worker registration notice:", err);
        });
    }

    // 2. مراقبة حالة الاتصال بالإنترنت الحية
    const handleOnline = () => {
      setIsOffline(false);
      setShowBackOnline(true);
      const timer = setTimeout(() => setShowBackOnline(false), 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowBackOnline(false);
    };

    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      }
    };
  }, []);

  return (
    <>
      {/* تنبيه وضع عدم الاتصال (بدون إنترنت) */}
      {isOffline && (
        <div className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:left-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-slate-900/95 text-white px-4 py-2.5 rounded-2xl shadow-xl border border-amber-500/40 backdrop-blur-md flex items-center gap-3 text-xs max-w-md">
            <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <WifiOff className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-black text-amber-300">وضع عدم الاتصال مفعل ⚡</div>
              <div className="text-[11px] text-slate-300 truncate">
                يمكنك مراجعة الدروس والملخصات والمحاكي بدون إنترنت
              </div>
            </div>
          </div>
        </div>
      )}

      {/* تنبيه عودة الاتصال */}
      {showBackOnline && (
        <div className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:left-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-emerald-900/95 text-white px-4 py-2.5 rounded-2xl shadow-xl border border-emerald-500/40 backdrop-blur-md flex items-center gap-3 text-xs max-w-md">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Wifi className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-black text-emerald-300">عادت خدمة الإنترنت ✓</div>
              <div className="text-[11px] text-emerald-100 truncate">
                تمت مزامنة المنصة والبيانات مع الخادم بنجاح
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
