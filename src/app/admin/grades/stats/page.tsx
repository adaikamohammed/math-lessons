"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import GradesStatsDashboard from "@/components/grades/GradesStatsDashboard";

function StatsContent() {
  const searchParams = useSearchParams();
  const initialClass = searchParams.get("class") || "1م1";
  const initialTrimester = (Number(searchParams.get("trimester") || 1) as 1 | 2 | 3);

  const [selectedClass, setSelectedClass] = useState(initialClass);
  const [trimester, setTrimester] = useState<1 | 2 | 3>(initialTrimester);

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4" dir="rtl">
      <GradesStatsDashboard
        currentClass={selectedClass}
        currentTrimester={trimester}
        onClassChange={(c) => setSelectedClass(c)}
        onTrimesterChange={(t) => setTrimester(t)}
      />
    </div>
  );
}

export default function AdminGradesStatsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      }
    >
      <StatsContent />
    </Suspense>
  );
}
