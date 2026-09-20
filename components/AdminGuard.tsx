"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      console.log("AdminGuard session:", session);

      if (!session) {
        window.location.href = "/admin/login";
        return;
      }

      setChecking(false);
    }

    checkAuth();
  }, []);

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-neutral-500">
          Checking authentication...
        </p>
      </main>
    );
  }

  return <>{children}</>;
}