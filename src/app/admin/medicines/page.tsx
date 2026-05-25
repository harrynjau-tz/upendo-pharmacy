"use client";

import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Edit, Trash2, X, Upload, ImageIcon, ArrowLeft } from "lucide-react";
import Image from "next/image";

type Medicine = {
  id: string;
  name: string;
  description: string;
  price: number;
  costPrice: number;
  stock: number;
  image?: string;
  requiresPrescription: boolean;
  categoryId?: string;
  category?: { name: string };
};

type Category = { id: string; name: string };

const emptyForm = {
  name: "",
  description: "",
  price: "",
  costPrice: "",
  stock: "",
  requiresPrescription: false,
  categoryId: "",
  image: "",
};

export default function AdminMedicinesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const user = session?.user as { role?: string } | undefined;

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && user?.role !== "admin") router.push("/");
  }, [status, user, router]);

  const fetchMedicines = () => {
    fetch(`/api/medicines?search=${search}`).then((r) => r.json()).then(setMedicines);
  };

  useEffect(() => { fetchMedicines(); }, [search]);
  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
  }, []);

  const openAdd = () => {
    setForm(emptyForm);
    setPreview("");
    setEditId(null);
    setShowModal(true);
  };

  const openEdit = (med: Medicine) => {
    setForm({
      name: med.name,
      description: med.description || "",
      price: String(med.price),
      costPrice: String(med.costPrice || 0),
      stock: String(med.stock),
      requiresPrescription: med.requiresPrescription,
      categoryId: med.categoryId || "",
      image: med.image || "",
    });
    setPreview(med.image ? med.image : "");
    setEditId(med.id);
    setShowModal(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();

    if (res.ok) {
      setForm((prev) => ({ ...prev, image: data.url }));
    } else {
      alert(data.error || "Tatizo la kupakia picha");
      setPreview(form.image || "");
    }
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploading) return;
    setLoading(true);
    const body = {
      name: form.name,
      description: form.description || null,
      price: parseFloat(form.price),
      costPrice: parseFloat(form.costPrice) || 0,
      stock: parseInt(form.stock),
      requiresPrescription: form.requiresPrescription,
      categoryId: form.categoryId || null,
      image: form.image || null,
    };

    const url = editId ? `/api/medicines/${editId}` : "/api/medicines";
    const method = editId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.error || "Tatizo la kuhifadhi, jaribu tena");
      setLoading(false);
      return;
    }

    setShowModal(false);
    fetchMedicines();
    setLoading(false);
  };

  const deleteMedicine = async (id: string) => {
    if (!confirm("Una uhakika wa kufuta dawa hii?")) return;
    await fetch(`/api/medicines/${id}`, { method: "DELETE" });
    fetchMedicines();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link href="/admin" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm mb-6 font-medium">
          <ArrowLeft size={16} /> Rudi Dashboard
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Simamia Dawa</h1>
          <button
            onClick={openAdd}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
          >
            <Plus size={18} /> Ongeza Dawa
          </button>
        </div>

        <input
          type="text"
          placeholder="Tafuta dawa..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm border border-gray-300 rounded-lg px-4 py-2.5 mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="bg-white rounded-2xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-blue-50">
              <tr>
                {["Picha", "Jina", "Aina", "Bei (TZS)", "Stoo", "Daktari", "Vitendo"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-gray-600 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {medicines.map((med) => (
                <tr key={med.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-2">
                    {med.image ? (
                      <Image
                        src={med.image}
                        alt={med.name}
                        width={48}
                        height={48}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-xl">
                        💊
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">{med.name}</td>
                  <td className="px-4 py-3 text-gray-500">{med.category?.name || "-"}</td>
                  <td className="px-4 py-3 text-blue-600 font-semibold">{med.price.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      med.stock <= 10 ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"
                    }`}>
                      {med.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">{med.requiresPrescription ? "Ndiyo" : "Hapana"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(med)} className="text-blue-500 hover:text-blue-700">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => deleteMedicine(med.id)} className="text-red-400 hover:text-red-600">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {medicines.length === 0 && (
            <div className="text-center py-12 text-gray-400">Hakuna dawa</div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{editId ? "Hariri Dawa" : "Ongeza Dawa Mpya"}</h2>
              <button onClick={() => setShowModal(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Picha ya Dawa</label>
                <div
                  className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-blue-400 transition"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {preview ? (
                    <div className="relative">
                      <Image
                        src={preview}
                        alt="Preview"
                        width={200}
                        height={200}
                        className="w-full h-40 object-contain rounded-lg mx-auto"
                      />
                      <p className="text-xs text-gray-400 mt-2">Bonyeza kubadilisha picha</p>
                    </div>
                  ) : (
                    <div className="py-4">
                      <ImageIcon className="mx-auto text-gray-300 mb-2" size={40} />
                      <p className="text-gray-500 text-sm">Bonyeza hapa kupakia picha</p>
                      <p className="text-gray-400 text-xs mt-1">JPG, PNG au WebP — Hadi 5MB</p>
                    </div>
                  )}
                  {uploading && (
                    <div className="mt-2 flex items-center justify-center gap-2 text-blue-600 text-sm">
                      <Upload size={16} className="animate-bounce" />
                      Inapakia picha...
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jina la Dawa *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Maelezo</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bei ya Kuuzia (TZS) *</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min={0}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bei ya Kununulia (TZS)</label>
                  <input
                    type="number"
                    value={form.costPrice}
                    onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min={0}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Idadi (Stoo) *</label>
                  <input
                    type="number"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min={0}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Aina</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Chagua aina</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.requiresPrescription}
                  onChange={(e) => setForm({ ...form, requiresPrescription: e.target.checked })}
                  className="w-4 h-4 accent-blue-600"
                />
                <span className="text-sm text-gray-700">Inahitaji cheti cha daktari</span>
              </label>
              <button
                type="submit"
                disabled={loading || uploading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {loading ? "Inasave..." : uploading ? "Subiri picha..." : editId ? "Hifadhi Mabadiliko" : "Ongeza Dawa"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
