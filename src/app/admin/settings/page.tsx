"use client";

import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft, Store, Phone, MapPin, Mail, Globe,
  CreditCard, Truck, Lock, Save, Upload, CheckCircle,
} from "lucide-react";

type Settings = Record<string, string>;

const TABS = [
  { id: "duka", label: "Maelezo ya Duka", icon: Store },
  { id: "malipo", label: "Malipo", icon: CreditCard },
  { id: "uwasilishaji", label: "Uwasilishaji", icon: Truck },
  { id: "nywila", label: "Badilisha Nywila", icon: Lock },
];

export default function AdminSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("duka");
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);

  // Password change state
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [pwLoading, setPwLoading] = useState(false);

  const user = session?.user as { role?: string } | undefined;

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && user?.role !== "admin") router.push("/");
  }, [status, user, router]);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setSettings(data);
        if (data.logo) setLogoPreview(data.logo);
        setLoading(false);
      });
  }, []);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const set = (key: string, value: string) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const saveSettings = async () => {
    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    if (res.ok) showToast("Mipangilio imehifadhiwa!");
    else showToast("Kuna tatizo, jaribu tena", "error");
    setSaving(false);
  };

  const compressImage = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const img = new window.Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const MAX_W = 400;
        const scale = img.width > MAX_W ? MAX_W / img.width : 1;
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png", 0.9));
      };
      img.onerror = reject;
      img.src = objectUrl;
    });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await compressImage(file);
      setLogoPreview(dataUrl);
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl }),
      });
      const data = await res.json();
      if (res.ok) {
        set("logo", data.url);
      } else {
        showToast(data.error || "Tatizo la kupakia logo", "error");
        setLogoPreview(settings.logo || "");
      }
    } catch {
      showToast("Tatizo la kusoma picha. Jaribu tena.", "error");
      setLogoPreview(settings.logo || "");
    }
    setUploading(false);
  };

  const changePassword = async () => {
    if (pwForm.newPassword !== pwForm.confirm) {
      return showToast("Nywila mpya hazilingani", "error");
    }
    setPwLoading(true);
    const res = await fetch("/api/admin/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      showToast("Nywila imebadilishwa!");
      setPwForm({ currentPassword: "", newPassword: "", confirm: "" });
    } else {
      showToast(data.error, "error");
    }
    setPwLoading(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="flex justify-center py-20 text-gray-400">Inapakia...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 right-4 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all
          ${toast.type === "success" ? "bg-green-600" : "bg-red-500"}`}>
          {toast.type === "success" && <CheckCircle size={18} />}
          {toast.msg}
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-8">
        <Link href="/admin" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm mb-6 font-medium">
          <ArrowLeft size={16} /> Rudi Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-3">
          ⚙️ Mipangilio
        </h1>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar tabs */}
          <div className="lg:w-56 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow p-3 flex flex-row lg:flex-col gap-1">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition w-full text-left
                      ${activeTab === tab.id
                        ? "bg-blue-600 text-white shadow"
                        : "text-gray-600 hover:bg-gray-100"}`}
                  >
                    <Icon size={18} />
                    <span className="hidden lg:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="bg-white rounded-2xl shadow p-6 space-y-6">

              {/* ===== DUKA ===== */}
              {activeTab === "duka" && (
                <>
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Store size={20} className="text-blue-600" /> Maelezo ya Duka
                  </h2>

                  {/* Logo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Logo ya Duka</label>
                    <div className="flex items-center gap-4">
                      <div
                        className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center cursor-pointer hover:border-blue-400 transition overflow-hidden"
                        onClick={() => logoRef.current?.click()}
                      >
                        {logoPreview ? (
                          <Image src={logoPreview} alt="Logo" width={96} height={96} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-center">
                            <Upload className="mx-auto text-gray-300" size={24} />
                            <p className="text-xs text-gray-400 mt-1">Logo</p>
                          </div>
                        )}
                      </div>
                      <div>
                        <button
                          onClick={() => logoRef.current?.click()}
                          className="border border-blue-300 text-blue-600 px-4 py-2 rounded-lg text-sm hover:bg-blue-50 transition flex items-center gap-2"
                        >
                          <Upload size={15} />
                          {uploading ? "Inapakia..." : "Badilisha Logo"}
                        </button>
                        <p className="text-xs text-gray-400 mt-1">PNG, JPG — Hadi 5MB</p>
                      </div>
                      <input ref={logoRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field icon={<Store size={16} />} label="Jina la Duka" value={settings.storeName || ""} onChange={(v) => set("storeName", v)} placeholder="Upendo Pharmacy" />
                    <Field icon={<Phone size={16} />} label="Nambari ya Simu" value={settings.phone || ""} onChange={(v) => set("phone", v)} placeholder="+255 7XX XXX XXX" />
                    <Field icon={<Mail size={16} />} label="Barua pepe" value={settings.email || ""} onChange={(v) => set("email", v)} placeholder="info@upendopharmacy.co.tz" type="email" />
                    <Field icon={<Globe size={16} />} label="Website" value={settings.website || ""} onChange={(v) => set("website", v)} placeholder="www.upendopharmacy.co.tz" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                      <MapPin size={16} className="text-gray-400" /> Anwani
                    </label>
                    <textarea
                      value={settings.address || ""}
                      onChange={(e) => set("address", e.target.value)}
                      rows={2}
                      placeholder="Mtaa, Mji, Mkoa"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Maelezo Mafupi ya Duka</label>
                    <textarea
                      value={settings.description || ""}
                      onChange={(e) => set("description", e.target.value)}
                      rows={3}
                      placeholder="Dawa bora, huduma ya kwanza..."
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>

                  <SaveButton onClick={saveSettings} loading={saving} />
                </>
              )}

              {/* ===== MALIPO ===== */}
              {activeTab === "malipo" && (
                <>
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <CreditCard size={20} className="text-blue-600" /> Mipangilio ya Malipo
                  </h2>

                  <div className="space-y-4">
                    <Toggle
                      label="Ruhusu Pesa Taslimu (Cash on Delivery)"
                      desc="Wateja watalipa wakipokea dawa"
                      checked={settings.enableCash !== "false"}
                      onChange={(v) => set("enableCash", v ? "true" : "false")}
                    />
                    <Toggle
                      label="Ruhusu Malipo ya M-Pesa"
                      desc="Wateja watalipa kupitia simu"
                      checked={settings.enableMpesa !== "false"}
                      onChange={(v) => set("enableMpesa", v ? "true" : "false")}
                    />
                  </div>

                  <Field
                    icon={<Phone size={16} />}
                    label="Nambari ya M-Pesa ya Duka"
                    value={settings.mpesaNumber || ""}
                    onChange={(v) => set("mpesaNumber", v)}
                    placeholder="+255 7XX XXX XXX"
                  />
                  <Field
                    icon={<Store size={16} />}
                    label="Jina la Mpokeaji (M-Pesa)"
                    value={settings.mpesaName || ""}
                    onChange={(v) => set("mpesaName", v)}
                    placeholder="Upendo Pharmacy"
                  />

                  <SaveButton onClick={saveSettings} loading={saving} />
                </>
              )}

              {/* ===== UWASILISHAJI ===== */}
              {activeTab === "uwasilishaji" && (
                <>
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Truck size={20} className="text-blue-600" /> Mipangilio ya Uwasilishaji
                  </h2>

                  <Toggle
                    label="Toa Uwasilishaji Bure"
                    desc="Wateja hawatalipia usafirishaji"
                    checked={settings.freeDelivery === "true"}
                    onChange={(v) => set("freeDelivery", v ? "true" : "false")}
                  />

                  {settings.freeDelivery !== "true" && (
                    <Field
                      icon={<Truck size={16} />}
                      label="Bei ya Uwasilishaji (TZS)"
                      value={settings.deliveryFee || ""}
                      onChange={(v) => set("deliveryFee", v)}
                      placeholder="2000"
                      type="number"
                    />
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Muda wa Uwasilishaji</label>
                    <select
                      value={settings.deliveryTime || ""}
                      onChange={(e) => set("deliveryTime", e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                    >
                      <option value="">Chagua muda</option>
                      <option value="1-2 masaa">Masaa 1-2</option>
                      <option value="2-4 masaa">Masaa 2-4</option>
                      <option value="Siku moja">Siku moja</option>
                      <option value="Siku 2-3">Siku 2-3</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Maeneo Tunayowasilisha</label>
                    <textarea
                      value={settings.deliveryAreas || ""}
                      onChange={(e) => set("deliveryAreas", e.target.value)}
                      rows={3}
                      placeholder="Mfano: Dar es Salaam, Dodoma, Mwanza..."
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>

                  <SaveButton onClick={saveSettings} loading={saving} />
                </>
              )}

              {/* ===== NYWILA ===== */}
              {activeTab === "nywila" && (
                <>
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Lock size={20} className="text-blue-600" /> Badilisha Nywila
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nywila ya Sasa</label>
                      <input
                        type="password"
                        value={pwForm.currentPassword}
                        onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nywila Mpya</label>
                      <input
                        type="password"
                        value={pwForm.newPassword}
                        onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="Angalau herufi 6"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Thibitisha Nywila Mpya</label>
                      <input
                        type="password"
                        value={pwForm.confirm}
                        onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                        className={`w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm
                          ${pwForm.confirm && pwForm.confirm !== pwForm.newPassword ? "border-red-400" : "border-gray-300"}`}
                        placeholder="Rudia nywila mpya"
                      />
                      {pwForm.confirm && pwForm.confirm !== pwForm.newPassword && (
                        <p className="text-red-500 text-xs mt-1">Nywila hazilingani</p>
                      )}
                    </div>
                    <button
                      onClick={changePassword}
                      disabled={pwLoading || !pwForm.currentPassword || !pwForm.newPassword || pwForm.newPassword !== pwForm.confirm}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
                    >
                      <Lock size={16} />
                      {pwLoading ? "Inabadilisha..." : "Badilisha Nywila"}
                    </button>
                  </div>
                </>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable components
function Field({ icon, label, value, onChange, placeholder, type = "text" }: {
  icon?: React.ReactNode; label: string; value: string;
  onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
        <span className="text-gray-400">{icon}</span> {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
      />
    </div>
  );
}

function Toggle({ label, desc, checked, onChange }: {
  label: string; desc: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition">
      <div>
        <p className="font-medium text-gray-800 text-sm">{label}</p>
        <p className="text-gray-500 text-xs mt-0.5">{desc}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${checked ? "bg-blue-600" : "bg-gray-300"}`}
      >
        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${checked ? "translate-x-7" : "translate-x-1"}`} />
      </button>
    </div>
  );
}

function SaveButton({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
    >
      <Save size={18} />
      {loading ? "Inahifadhi..." : "Hifadhi Mipangilio"}
    </button>
  );
}
