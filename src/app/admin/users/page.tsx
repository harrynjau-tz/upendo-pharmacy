"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, Search, Phone, Mail, MapPin, ShoppingBag, Calendar } from "lucide-react";

type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  createdAt: string;
  _count: { orders: number };
  orders: { total: number; status: string; createdAt: string }[];
};

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("sw-TZ", { day: "2-digit", month: "short", year: "numeric" });

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<User | null>(null);

  const user = session?.user as { role?: string } | undefined;

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && user?.role !== "admin") router.push("/");
  }, [status, user, router]);

  useEffect(() => {
    if (user?.role === "admin") {
      fetch("/api/admin/users")
        .then((r) => r.json())
        .then((data) => { setUsers(data); setLoading(false); });
    }
  }, [user]);

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.phone || "").includes(search)
  );

  if (loading)
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center py-20 text-gray-400">Inapakia...</div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link href="/admin" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm mb-6 font-medium">
          <ArrowLeft size={16} /> Rudi Dashboard
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Users size={30} className="text-blue-600" /> Watumiaji Waliojisajili
          </h1>
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-600 font-medium shadow-sm">
            Jumla: <span className="text-blue-600 font-bold">{users.length}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow p-5 flex items-center gap-4">
            <div className="bg-blue-50 p-3 rounded-xl"><Users size={24} className="text-blue-600" /></div>
            <div>
              <p className="text-gray-500 text-sm">Watumiaji Wote</p>
              <p className="text-2xl font-bold text-gray-800">{users.length}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow p-5 flex items-center gap-4">
            <div className="bg-green-50 p-3 rounded-xl"><ShoppingBag size={24} className="text-green-600" /></div>
            <div>
              <p className="text-gray-500 text-sm">Waliowahi Agiza</p>
              <p className="text-2xl font-bold text-gray-800">{users.filter((u) => u._count.orders > 0).length}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow p-5 flex items-center gap-4">
            <div className="bg-orange-50 p-3 rounded-xl"><Users size={24} className="text-orange-500" /></div>
            <div>
              <p className="text-gray-500 text-sm">Hawajawahi Agiza</p>
              <p className="text-2xl font-bold text-gray-800">{users.filter((u) => u._count.orders === 0).length}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User List */}
          <div className="lg:col-span-1">
            {/* Search */}
            <div className="relative mb-3">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tafuta jina, email, simu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
              />
            </div>

            <div className="bg-white rounded-2xl shadow overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 text-sm font-semibold text-gray-600">
                {filtered.length} mtumiaji
              </div>
              {filtered.length === 0 ? (
                <div className="py-10 text-center text-gray-400 text-sm">Hakuna watumiaji wanaolingana</div>
              ) : (
                <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                  {filtered.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => setSelected(u)}
                      className={`w-full text-left px-4 py-3.5 hover:bg-blue-50 transition ${selected?.id === u.id ? "bg-blue-50 border-r-2 border-blue-600" : ""}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800 truncate text-sm">{u.name}</p>
                          <p className="text-xs text-gray-400 truncate">{u.email}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${u._count.orders > 0 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                              {u._count.orders > 0 ? `Maagizo ${u._count.orders}` : "Hajawahi agiza"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* User Detail */}
          <div className="lg:col-span-2">
            {!selected ? (
              <div className="bg-white rounded-2xl shadow p-10 text-center text-gray-400">
                <Users size={48} className="mx-auto mb-3 opacity-20" />
                <p>Chagua mtumiaji upande wa kushoto kuona maelezo</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Profile Card */}
                <div className="bg-white rounded-2xl shadow p-6">
                  <div className="flex items-start gap-5">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-2xl shrink-0">
                      {selected.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-gray-800">{selected.name}</h2>
                      <div className="space-y-1.5 mt-2">
                        <p className="text-sm text-gray-500 flex items-center gap-2">
                          <Mail size={14} className="text-gray-400" /> {selected.email}
                        </p>
                        {selected.phone && (
                          <p className="text-sm text-gray-500 flex items-center gap-2">
                            <Phone size={14} className="text-gray-400" /> {selected.phone}
                          </p>
                        )}
                        {selected.address && (
                          <p className="text-sm text-gray-500 flex items-center gap-2">
                            <MapPin size={14} className="text-gray-400" /> {selected.address}
                          </p>
                        )}
                        <p className="text-sm text-gray-400 flex items-center gap-2">
                          <Calendar size={14} className="text-gray-400" /> Alijisajili: {fmtDate(selected.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="bg-white rounded-2xl shadow p-6">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <ShoppingBag size={18} className="text-blue-600" /> Muhtasari wa Maagizo
                  </h3>
                  {selected._count.orders === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <ShoppingBag size={36} className="mx-auto mb-2 opacity-20" />
                      <p className="text-sm">Mtumiaji huyu hajawahi agiza dawa</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 rounded-xl p-4 text-center">
                        <p className="text-3xl font-bold text-blue-600">{selected._count.orders}</p>
                        <p className="text-sm text-gray-500 mt-1">Jumla ya Maagizo</p>
                      </div>
                      <div className="bg-green-50 rounded-xl p-4 text-center">
                        <p className="text-sm text-gray-500 mb-1">Agizo la Mwisho</p>
                        <p className="text-sm font-semibold text-gray-700">
                          {selected.orders[0] ? fmtDate(selected.orders[0].createdAt) : "—"}
                        </p>
                        {selected.orders[0] && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${
                            selected.orders[0].status === "delivered" ? "bg-green-100 text-green-700" :
                            selected.orders[0].status === "pending" ? "bg-yellow-100 text-yellow-700" :
                            "bg-gray-100 text-gray-600"
                          }`}>
                            {selected.orders[0].status === "delivered" ? "Imefikishwa" :
                             selected.orders[0].status === "pending" ? "Inasubiri" :
                             selected.orders[0].status === "processing" ? "Inafanyiwa kazi" : selected.orders[0].status}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="mt-4">
                    <Link
                      href={`/admin/orders?user=${selected.id}`}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                    >
                      <ShoppingBag size={14} /> Angalia maagizo yake yote →
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
