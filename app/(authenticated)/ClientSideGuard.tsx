"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export function ClientSideGuard({ role }: { role: string }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (role === 'employer' && pathname.startsWith('/talent/')) {
       router.push('/employer/hub');
    } else if (role !== 'employer' && pathname.startsWith('/employer/')) {
       router.push('/talent/dashboard');
    }
  }, [role, pathname, router]);

  return null;
}
