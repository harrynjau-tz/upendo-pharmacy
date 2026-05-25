"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { ShoppingCart, Search, AlertCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Medicine = {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image?: string;
  requiresPrescription: boolean;
  category?: { name: string };
};

type Category = { id: string; name: string };

export default function MedicinesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [adding, setAdding] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    fetch(`/api/medicines?search=${search}&category=${selectedCategory}`)
      .then((r) => r.json())
      .then(setMedicines);
  }, [search, selectedCategory]);

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
  }, []);

  const addToCart = async (medicineId: string) => {
    if (!session) {
      router.push("/login");
      return;
    }
    setAdding(medicineId);
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ medicineId, quantity: 1 }),
    });
    if (res.ok) {
      setToast("Dawa imeongezwa kwenye cart!");
      setTimeout(() => setToast(""), 3000);
    }
    setAdding(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {toast && (
        <div className="fixed top-20 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {toast}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Dawa Zetu</h1>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Tafuta dawa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Aina Zote</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Grid */}
        {medicines.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">💊</div>
            <p>Hakuna dawa zilizopatikana</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {medicines.map((med) => (
              <div key={med.id} className="bg-white rounded-2xl shadow hover:shadow-md transition overflow-hidden">
                <div className="bg-blue-50 h-36 flex items-center justify-center overflow-hidden">
                  {med.image ? (
                    <Image
                      src={med.image}
                      alt={med.name}
                      width={200}
                      height={144}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-5xl">💊</span>
                  )}
                </div>
                <div className="p-4">
                  {med.category && (
                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                      {med.category.name}
                    </span>
                  )}
                  <h3 className="font-bold text-gray-800 mt-2 mb-1">{med.name}</h3>
                  {med.description && (
                    <p className="text-gray-500 text-sm mb-2 line-clamp-2">{med.description}</p>
                  )}
                  {med.requiresPrescription && (
                    <div className="flex items-center gap-1 text-orange-500 text-xs mb-2">
                      <AlertCircle size={12} />
                      <span>Inahitaji daktari</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-blue-700 font-bold text-lg">
                      TZS {med.price.toLocaleString()}
                    </span>
                    <span className={`text-xs ${med.stock > 0 ? "text-green-600" : "text-red-500"}`}>
                      {med.stock > 0 ? `Ipo (${med.stock})` : "Imeisha"}
                    </span>
                  </div>
                  <button
                    onClick={() => addToCart(med.id)}
                    disabled={med.stock === 0 || adding === med.id}
                    className="mt-3 w-full bg-blue-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
                  >
                    <ShoppingCart size={16} />
                    {adding === med.id ? "Inaongeza..." : "Ongeza Cart"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
