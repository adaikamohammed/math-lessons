"use client";

import { useEffect, useState } from "react";
import { getPersistedTeacherSession, type TeacherSession } from "./offlineAuth";

export function useProfile() {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(getPersistedTeacherSession());

  useEffect(() => {
    fetch("/api/auth")
      .then((res) => res.json())
      .then((d) => {
        if (d?.authenticated) {
          setProfile({
            id: "teacher_adaika",
            full_name: "الأستاذ محمد عدايكة",
            role: "teacher",
            subject: "الرياضيات",
            school_custom_name: "متوسطة المجاهد باهي علي",
            wilaya: "الوادي",
          });
        }
      })
      .catch(() => {});
  }, []);

  return { profile, loading };
}
