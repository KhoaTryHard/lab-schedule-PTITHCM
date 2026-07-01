"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TechnicianNotificationsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/technician/issues");
  }, [router]);

  return null;
}
