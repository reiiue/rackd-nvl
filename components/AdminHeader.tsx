"use client";

import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function AdminHeader() {
  async function handleLogout() {
    await supabase.auth.signOut();

    window.location.href = "/admin/login";
  }

  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="flex items-center"
            aria-label="Go to Admin Dashboard"
          >
            <Image
              src="/mosd.png"
              alt="rackd.nvl"
              width={150}
              height={55}
              priority
              className="h-16 w-auto object-contain"
            />
          </Link>

          <div className="h-6 w-px bg-neutral-200" />

          <p className="text-xs text-neutral-400">
            Admin
          </p>
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          className="text-sm text-neutral-500 transition hover:text-black"
        >
          Logout
        </button>
      </div>
    </header>
  );
}