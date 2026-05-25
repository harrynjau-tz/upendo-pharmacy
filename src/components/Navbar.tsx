"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { ShoppingCart, User, LogOut, Package, LayoutDashboard } from "lucide-react";
import { useState, useEffect } from "react";

export default function Navbar() {
  const { data: session } = useSession();
  const [cartCount, setCartCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  const user = session?.user as { role?: string; name?: string } | undefined;

  useEffect(() => {
    if (session) {
      fetch("/api/cart")
        .then((r) => r.json())
        .then((data) => setCartCount(data?.items?.length || 0))
        .catch(() => {});
    }
  }, [session]);

  return (
    <nav className="bg-blue-700 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-xl font-bold">
          <span className="text-2xl">💊</span>
          <span>Upendo Pharmacy</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/medicines" className="hover:text-blue-200 transition">Dawa</Link>
          {session ? (
            <>
              <Link href="/orders" className="hover:text-blue-200 flex items-center gap-1">
                <Package size={18} /> Maagizo
              </Link>
              {user?.role === "admin" && (
                <Link href="/admin" className="hover:text-blue-200 flex items-center gap-1">
                  <LayoutDashboard size={18} /> Admin
                </Link>
              )}
              <Link href="/cart" className="relative hover:text-blue-200">
                <ShoppingCart size={22} />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
              <div className="flex items-center gap-2">
                <User size={18} />
                <span className="text-sm">{user?.name}</span>
                <button
                  onClick={() => signOut()}
                  className="hover:text-red-300 ml-2"
                  title="Toka"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-blue-200">Ingia</Link>
              <Link
                href="/register"
                className="bg-white text-blue-700 px-4 py-1.5 rounded-full font-semibold hover:bg-blue-50 transition"
              >
                Jisajili
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-white"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span className="text-2xl">{menuOpen ? "✕" : "☰"}</span>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-blue-800 px-4 py-4 flex flex-col gap-4 text-sm">
          <Link href="/medicines" onClick={() => setMenuOpen(false)}>Dawa</Link>
          {session ? (
            <>
              <Link href="/cart" onClick={() => setMenuOpen(false)}>Cart ({cartCount})</Link>
              <Link href="/orders" onClick={() => setMenuOpen(false)}>Maagizo Yangu</Link>
              {user?.role === "admin" && (
                <Link href="/admin" onClick={() => setMenuOpen(false)}>Admin Dashboard</Link>
              )}
              <button onClick={() => signOut()} className="text-left text-red-300">Toka</button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setMenuOpen(false)}>Ingia</Link>
              <Link href="/register" onClick={() => setMenuOpen(false)}>Jisajili</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
