"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";

type Category = { id: string; name: string };

export default function AdminCategoriesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const user = session?.user as { role?: string } | undefined;

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && user?.role !== "admin") router.push("/");
  }, [status, user, router]);

  const fetchCategories = () => {
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
  };

  useEffect(() => { fetchCategories(); }, []);

  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setName("");
    fetchCategories();
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/admin" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm mb-6 font-medium">
          <ArrowLeft size={16} /> Rudi Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Simamia Aina za Dawa</h1>

        <form onSubmit={addCategory} className="flex gap-3 mb-8">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jina la aina (mfano: Dawa za Malaria)"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50 transition"
          >
            <Plus size={18} />
            Ongeza
          </button>
        </form>

        <div className="bg-white rounded-2xl shadow">
          {categories.map((cat, i) => (
            <div
              key={cat.id}
              className={`flex items-center px-6 py-4 ${i > 0 ? "border-t border-gray-100" : ""}`}
            >
              <span className="text-2xl mr-3">🏷️</span>
              <span className="text-gray-800 font-medium">{cat.name}</span>
            </div>
          ))}
          {categories.length === 0 && (
            <div className="text-center py-12 text-gray-400">Hakuna aina bado</div>
          )}
        </div>
      </div>
    </div>
  );
}
