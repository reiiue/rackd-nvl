"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  function closeMenu() {
    setIsOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
        {/* Logo */}
        <Link
          href="/"
          onClick={closeMenu}
          className="flex items-center"
          aria-label="rackd.nvl Home"
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

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-7 text-sm md:flex">
          <Link
            href="/"
            className="transition hover:text-neutral-500"
          >
            Home
          </Link>

          <Link
            href="/shop"
            className="transition hover:text-neutral-500"
          >
            Shop
          </Link>

          {/* <Link
            href="/about"
            className="transition hover:text-neutral-500"
          >
            About
          </Link> */}
        </nav>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-10 w-10 items-center justify-center md:hidden"
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
        >
          {isOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="border-t border-neutral-200 bg-white md:hidden">
          <nav className="mx-auto max-w-7xl px-5 py-4">
            <div className="flex flex-col">
              <Link
                href="/"
                onClick={closeMenu}
                className="border-b border-neutral-100 py-4 text-sm"
              >
                Home
              </Link>

              <Link
                href="/shop"
                onClick={closeMenu}
                className="border-b border-neutral-100 py-4 text-sm"
              >
                Shop
              </Link>

              {/* <Link
                href="/about"
                onClick={closeMenu}
                className="py-4 text-sm"
              >
                About
              </Link> */}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}