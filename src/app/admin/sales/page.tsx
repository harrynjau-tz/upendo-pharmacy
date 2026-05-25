"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShoppingCart, Plus, TrendingUp } from "lucide-react";

type Medicine = { id: string; name: string; price: number; costPrice: number; stock: number; category?: { name: string } };
type Sale = {
  id: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  costPrice: number;
  soldAt: string;
  notes?: string;
  medicine: { name: string; category?: { name: string } };
};

const fmt = (n: number) => `TZS ${n.toLocaleString()}`;

export default function SalesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [form, setForm] = useState({ medicineId: "", quantity: 1, unitPrice: "", notes: "" });

  const user = session?.user as { role?: string } | undefined;

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && user?.role !== "admin") router.push("/");
  }, [status, user, router]);

  useEffect(() => {
    if (user?.role === "admin") {
      Promise.all([
        fetch("/api/medicines").then((r) => r.json()),
        fetch("/api/sales").then((r) => r.json()),
      ]).then(([meds, s]) => {
        setMedicines(meds);
        setSales(s);
        setLoading(false);
      });
    }
  }, [user]);

  const selectedMed = medicines.find((m) => m.id === form.medicineId);

  const handleMedChange = (id: string) => {
    const med = medicines.find((m) => m.id === id);
    setForm((f) => ({ ...f, medicineId: id, unitPrice: med ? String(med.price) : "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        medicineId: form.medicineId,
        quantity: Number(form.quantity),
        unitPrice: Number(form.unitPrice),
        notes: form.notes,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg({ type: "err", text: data.error || "Tatizo limetokea" });
    } else {
      setMsg({ type: "ok", text: "Mauzo yamerekodiwa!" });
      setSales((prev) => [data, ...prev]);
      setMedicines((prev) =>
        prev.map((m) => m.id === form.medicineId ? { ...m, stock: m.stock - Number(form.quantity) } : m)
      );
      setForm({ medicineId: "", quantity: 1, unitPrice: "", notes: "" });
    }
    setSaving(false);
  };

  const totalSalesRevenue = sales.reduce((s, sale) => s + sale.totalAmount, 0);
  const totalSalesProfit = sales.reduce((s, sale) => s + (sale.totalAmount - sale.costPrice * sale.quantity), 0);

  if (loading) return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="flex justify-center py-20 text-gray-400">Inapakia...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link href="/admin" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm mb-6 font-medium">
          <ArrowLeft size={16} /> Rudi Dashboard
        </Link>

        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3 mb-8">
          <ShoppingCart className="text-blue-600" size={32} /> Rekodi Mauzo
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
                <Plus size={20} className="text-blue-600" /> Uza Dawa
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Dawa *</label>
                  <select
                    value={form.medicineId}
                    onChange={(e) => handleMedChange(e.target.value)}
                    required
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">-- Chagua dawa --</option>
                    {medicines.map((m) => (
                      <option key={m.id} value={m.id} disabled={m.stock === 0}>
                        {m.name} {m.stock === 0 ? "(Imeisha)" : `(Stoo: ${m.stock})`}
                      </option>
                    ))}
                  </select>
                  {selectedMed && (
                    <p className="text-xs text-gray-500 mt-1">
                      Bei ya kawaida: {fmt(selectedMed.price)} | Stoo: {selectedMed.stock}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Idadi *</label>
                  <input
                    type="number"
                    min={1}
                    max={selectedMed?.stock || 999}
                    value={form.quantity}
                    onChange={(e) => setForm((f) => ({ ...f, quantity: Number(e.target.value) }))}
                    required
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Bei Aliyouzia (TZS) *</label>
                  <input
                    type="number"
                    min={0}
                    value={form.unitPrice}
                    onChange={(e) => setForm((f) => ({ ...f, unitPrice: e.target.value }))}
                    required
                    placeholder="Weka bei halisi"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {form.unitPrice && form.quantity && (
                  <div className="bg-blue-50 rounded-xl p-3 text-sm">
                    <p className="text-gray-600">Jumla: <span className="font-bold text-blue-700">{fmt(Number(form.unitPrice) * Number(form.quantity))}</span></p>
                    {selectedMed && (
                      <p className="text-gray-600">Faida: <span className={`font-bold ${(Number(form.unitPrice) - selectedMed.costPrice) * Number(form.quantity) >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {fmt((Number(form.unitPrice) - selectedMed.costPrice) * Number(form.quantity))}
                      </span></p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Maelezo (si lazima)</label>
                  <input
                    type="text"
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="mfano: mteja wa kawaida"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {msg && (
                  <div className={`rounded-xl px-4 py-2.5 text-sm font-medium ${msg.type === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                    {msg.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {saving ? "Inasajili..." : "Sajili Mauzo"}
                </button>
              </form>
            </div>

            {/* Summary */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl shadow p-4">
                <p className="text-xs text-gray-500">Mapato Yote</p>
                <p className="text-lg font-bold text-blue-700">{fmt(totalSalesRevenue)}</p>
              </div>
              <div className="bg-white rounded-xl shadow p-4">
                <p className="text-xs text-gray-500">Faida Yote</p>
                <p className={`text-lg font-bold ${totalSalesProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {fmt(totalSalesProfit)}
                </p>
              </div>
            </div>
          </div>

          {/* Sales List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <TrendingUp size={20} className="text-blue-600" />
                <h2 className="text-lg font-bold text-gray-800">Historia ya Mauzo ({sales.length})</h2>
              </div>

              {sales.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <ShoppingCart size={40} className="mx-auto mb-3 opacity-30" />
                  <p>Hakuna mauzo yaliyorekodiwa bado</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {["Dawa", "Idadi", "Bei/Kitengo", "Jumla", "Faida", "Tarehe", "Maelezo"].map((h) => (
                          <th key={h} className="text-left px-4 py-3 text-gray-600 font-semibold whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sales.map((sale) => {
                        const profit = sale.totalAmount - sale.costPrice * sale.quantity;
                        return (
                          <tr key={sale.id} className="border-t border-gray-100 hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <p className="font-medium text-gray-800">{sale.medicine.name}</p>
                              <p className="text-xs text-gray-400">{sale.medicine.category?.name}</p>
                            </td>
                            <td className="px-4 py-3 font-semibold">{sale.quantity}</td>
                            <td className="px-4 py-3 text-blue-600">{fmt(sale.unitPrice)}</td>
                            <td className="px-4 py-3 font-bold text-gray-800">{fmt(sale.totalAmount)}</td>
                            <td className="px-4 py-3">
                              <span className={`font-bold ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                                {fmt(profit)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                              {new Date(sale.soldAt).toLocaleDateString("sw-TZ")}
                              <br />
                              <span className="text-xs">{new Date(sale.soldAt).toLocaleTimeString("sw-TZ", { hour: "2-digit", minute: "2-digit" })}</span>
                            </td>
                            <td className="px-4 py-3 text-gray-400 text-xs">{sale.notes || "-"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
