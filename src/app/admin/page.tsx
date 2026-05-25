"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Package, ShoppingBag, Users, TrendingUp, AlertTriangle, Plus, Trash2, Settings } from "lucide-react";

type Stats = {
  totalOrders: number;
  totalRevenue: number;
  totalMedicines: number;
  totalCustomers: number;
  pendingOrders: number;
  lowStock: { id: string; name: string; stock: number }[];
};

type Banner = {
  id: string;
  image: string;
  title?: string;
  subtitle?: string;
};

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);

  const user = session?.user as { role?: string } | undefined;

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && user?.role !== "admin") router.push("/");
  }, [status, user, router]);

  useEffect(() => {
    if (user?.role === "admin") {
      fetch("/api/admin/stats").then((r) => r.json()).then(setStats);
      fetch("/api/banners").then((r) => r.json()).then(setBanners);
    }
  }, [user]);

  const deleteBanner = async (id: string) => {
    if (!confirm("Futa picha hii?")) return;
    await fetch(`/api/banners/${id}`, { method: "DELETE" });
    setBanners((prev) => prev.filter((b) => b.id !== id));
  };

  if (!stats) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex justify-center py-20 text-gray-400">Inapakia...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Dashboard ya Admin</h1>
          <Link
            href="/admin/settings"
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl shadow-sm hover:shadow hover:border-blue-300 hover:text-blue-600 transition font-medium text-sm"
          >
            <Settings size={18} />
            Mipangilio
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: "Jumla ya Maagizo", value: stats.totalOrders, icon: <ShoppingBag className="text-blue-600" size={28} />, bg: "bg-blue-50" },
            { label: "Mapato (Yaliyofika)", value: `TZS ${stats.totalRevenue.toLocaleString()}`, icon: <TrendingUp className="text-green-600" size={28} />, bg: "bg-green-50" },
            { label: "Aina za Dawa", value: stats.totalMedicines, icon: <Package className="text-purple-600" size={28} />, bg: "bg-purple-50" },
            { label: "Wateja", value: stats.totalCustomers, icon: <Users className="text-orange-600" size={28} />, bg: "bg-orange-50" },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl shadow p-6 flex items-center gap-4">
              <div className={`${s.bg} p-3 rounded-xl`}>{s.icon}</div>
              <div>
                <p className="text-gray-500 text-sm">{s.label}</p>
                <p className="text-2xl font-bold text-gray-800">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {stats.pendingOrders > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
              <h2 className="font-bold text-yellow-700 text-lg mb-2 flex items-center gap-2">
                <AlertTriangle size={20} />
                Maagizo Yanayosubiri
              </h2>
              <p className="text-yellow-600 text-4xl font-bold mb-3">{stats.pendingOrders}</p>
              <Link href="/admin/orders" className="text-yellow-700 underline text-sm">
                Angalia maagizo yote →
              </Link>
            </div>
          )}

          {stats.lowStock.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
              <h2 className="font-bold text-red-700 text-lg mb-3 flex items-center gap-2">
                <AlertTriangle size={20} />
                Dawa Zinazokwisha
              </h2>
              <div className="space-y-2">
                {stats.lowStock.slice(0, 5).map((m) => (
                  <div key={m.id} className="flex justify-between text-sm">
                    <span className="text-red-700">{m.name}</span>
                    <span className="font-bold text-red-600">Zilizo: {m.stock}</span>
                  </div>
                ))}
              </div>
              <Link href="/admin/medicines" className="text-red-700 underline text-sm mt-3 block">
                Simamia dawa →
              </Link>
            </div>
          )}
        </div>

        {/* Slideshow Banners Preview */}
        <div className="bg-white rounded-2xl shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              🖼️ Picha za Slideshow
              <span className="text-sm font-normal text-gray-400 ml-1">({banners.length} picha)</span>
            </h2>
            <Link
              href="/admin/banners"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition text-sm font-medium"
            >
              <Plus size={16} /> Ongeza Picha
            </Link>
          </div>

          {banners.length === 0 ? (
            <div className="border-2 border-dashed border-gray-200 rounded-xl py-12 text-center">
              <div className="text-4xl mb-3">🖼️</div>
              <p className="text-gray-400 mb-3">Hakuna picha za slideshow bado</p>
              <Link
                href="/admin/banners"
                className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-blue-700 transition inline-flex items-center gap-2"
              >
                <Plus size={15} /> Ongeza Picha ya Kwanza
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {banners.map((banner, i) => (
                <div key={banner.id} className="relative group rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                  <Image
                    src={banner.image}
                    alt={banner.title || `Picha ${i + 1}`}
                    width={400}
                    height={200}
                    className="w-full h-40 object-cover"
                  />
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200" />

                  {/* Badge number */}
                  <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    #{i + 1}
                  </div>

                  {/* Delete button - shows on hover */}
                  <button
                    onClick={() => deleteBanner(banner.id)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Futa picha"
                  >
                    <Trash2 size={14} />
                  </button>

                  {/* Title at bottom */}
                  {(banner.title || banner.subtitle) && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2">
                      {banner.title && (
                        <p className="text-white text-sm font-semibold truncate">{banner.title}</p>
                      )}
                      {banner.subtitle && (
                        <p className="text-gray-200 text-xs truncate">{banner.subtitle}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Add more tile */}
              <Link
                href="/admin/banners"
                className="border-2 border-dashed border-gray-200 rounded-xl h-40 flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 transition"
              >
                <Plus size={28} className="mb-1" />
                <span className="text-sm">Ongeza zaidi</span>
              </Link>
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { href: "/admin/clinic", label: "Kliniki", icon: "🏥" },
            { href: "/admin/sales", label: "Rekodi Mauzo", icon: "🛒" },
            { href: "/admin/medicines", label: "Simamia Dawa", icon: "💊" },
            { href: "/admin/orders", label: "Simamia Maagizo", icon: "📦" },
            { href: "/admin/categories", label: "Simamia Aina", icon: "🏷️" },
            { href: "/admin/banners", label: "Picha za Slideshow", icon: "🖼️" },
            { href: "/admin/reports", label: "Ripoti", icon: "📊" },
            { href: "/admin/settings", label: "Mipangilio", icon: "⚙️" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="bg-white rounded-2xl shadow p-6 text-center hover:shadow-md transition"
            >
              <div className="text-4xl mb-2">{link.icon}</div>
              <p className="font-semibold text-gray-800">{link.label}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
