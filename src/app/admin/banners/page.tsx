"use client";

import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Upload, ImageIcon, GripVertical, ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type Banner = {
  id: string;
  image: string;
  title?: string;
  subtitle?: string;
  order: number;
  active: boolean;
};

export default function AdminBannersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newSubtitle, setNewSubtitle] = useState("");
  const [newImage, setNewImage] = useState("");
  const [toast, setToast] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const user = session?.user as { role?: string } | undefined;

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && user?.role !== "admin") router.push("/");
  }, [status, user, router]);

  const fetchBanners = () => {
    fetch("/api/banners").then((r) => r.json()).then(setBanners);
  };

  useEffect(() => { fetchBanners(); }, []);

  const compressImage = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const img = new window.Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const MAX_W = 1200;
        const scale = img.width > MAX_W ? MAX_W / img.width : 1;
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = reject;
      img.src = objectUrl;
    });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setPreview("");

    try {
      const dataUrl = await compressImage(file);
      setPreview(dataUrl);

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl }),
      });
      const data = await res.json();

      if (res.ok) {
        setNewImage(data.url);
      } else {
        alert(data.error || "Tatizo la kupakia picha");
        setPreview("");
      }
    } catch {
      alert("Tatizo la kusoma picha. Jaribu tena.");
      setPreview("");
    }
    setUploading(false);
  };

  const addBanner = async () => {
    if (!newImage) return alert("Pakia picha kwanza");
    setSaving(true);
    const res = await fetch("/api/banners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image: newImage,
        title: newTitle || null,
        subtitle: newSubtitle || null,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      alert(err.error || "Tatizo la kuhifadhi, jaribu tena");
      setSaving(false);
      return;
    }
    setNewImage("");
    setPreview("");
    setNewTitle("");
    setNewSubtitle("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    fetchBanners();
    setToast("Picha imeongezwa!");
    setTimeout(() => setToast(""), 3000);
    setSaving(false);
  };

  const deleteBanner = async (id: string) => {
    if (!confirm("Futa picha hii?")) return;
    await fetch(`/api/banners/${id}`, { method: "DELETE" });
    fetchBanners();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {toast && (
        <div className="fixed top-20 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {toast}
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/admin" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm mb-6 font-medium">
          <ArrowLeft size={16} /> Rudi Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Picha za Slideshow</h1>

        {/* Add new banner */}
        <div className="bg-white rounded-2xl shadow p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Plus size={20} className="text-blue-600" />
            Ongeza Picha Mpya
          </h2>

          {/* Upload area */}
          <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 transition mb-4"
            onClick={() => fileInputRef.current?.click()}
          >
            {preview ? (
              <div>
                <Image
                  src={preview}
                  alt="Preview"
                  width={800}
                  height={300}
                  className="w-full h-48 object-cover rounded-lg mx-auto"
                />
                <p className="text-xs text-gray-400 mt-2">Bonyeza kubadilisha picha</p>
              </div>
            ) : (
              <div className="py-6">
                <ImageIcon className="mx-auto text-gray-300 mb-3" size={48} />
                <p className="text-gray-500 font-medium">Bonyeza kupakia picha ya slideshow</p>
                <p className="text-gray-400 text-sm mt-1">JPG, PNG au WebP — Hadi 5MB</p>
                <p className="text-blue-500 text-xs mt-2">Picha bora: 1200 × 480 pixels</p>
              </div>
            )}
            {uploading && (
              <div className="flex items-center justify-center gap-2 text-blue-600 text-sm mt-3">
                <Upload size={16} className="animate-bounce" />
                Inapakia...
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Title & subtitle */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kichwa (si lazima)</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Mfano: Afya Yako Kwanza!"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Maelezo mafupi (si lazima)</label>
              <input
                type="text"
                value={newSubtitle}
                onChange={(e) => setNewSubtitle(e.target.value)}
                placeholder="Mfano: Dawa bora kwa bei nafuu"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            onClick={addBanner}
            disabled={!newImage || uploading || saving}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            {saving ? "Inaongeza..." : "Ongeza Picha kwenye Slideshow"}
          </button>
        </div>

        {/* Current banners */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            Picha Zilizopo ({banners.length})
          </h2>

          {banners.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <ImageIcon className="mx-auto mb-3 text-gray-200" size={48} />
              <p>Hakuna picha bado. Ongeza picha ya kwanza!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {banners.map((banner, i) => (
                <div key={banner.id} className="flex items-center gap-4 border border-gray-100 rounded-xl p-3 hover:bg-gray-50">
                  <GripVertical className="text-gray-300 flex-shrink-0" size={20} />
                  <span className="text-gray-400 text-sm font-mono w-5">{i + 1}</span>
                  <Image
                    src={banner.image}
                    alt={banner.title || `Picha ${i + 1}`}
                    width={120}
                    height={60}
                    className="w-28 h-16 object-cover rounded-lg flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">
                      {banner.title || <span className="text-gray-400 italic">Hakuna kichwa</span>}
                    </p>
                    {banner.subtitle && (
                      <p className="text-sm text-gray-500 truncate">{banner.subtitle}</p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteBanner(banner.id)}
                    className="text-red-400 hover:text-red-600 flex-shrink-0 p-1"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Preview link */}
        {banners.length > 0 && (
          <div className="mt-6 text-center">
            <Link
              href="/"
              target="_blank"
              className="text-blue-600 hover:underline text-sm"
            >
              Angalia slideshow kwenye homepage →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
