"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LecturerNotificationsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/lecturer/room-issues");
  }, [router]);

  return null;
}
