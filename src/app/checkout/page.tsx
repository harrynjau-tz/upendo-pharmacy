"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type CartItem = {
  id: string;
  quantity: number;
  medicine: { name: string; price: number };
};

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [cart, setCart] = useState<{ items: CartItem[] } | null>(null);
  const [form, setForm] = useState({
    paymentMethod: "cash",
    mpesaNumber: "",
    address: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetch("/api/cart").then((r) => r.json()).then(setCart);
    }
  }, [session]);

  const total = cart?.items.reduce((s, i) => s + i.medicine.price * i.quantity, 0) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.address) return alert("Weka anwani yako");
    if (form.paymentMethod === "mpesa" && !form.mpesaNumber) {
      return alert("Weka nambari yako ya M-Pesa");
    }
    setLoading(true);

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      router.push("/orders?success=1");
    } else {
      alert("Kuna tatizo, jaribu tena");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Malipo</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Maelezo ya Order</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Anwani ya Uwasilishaji *</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Mtaa, Mji, Mkoa"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Njia ya Malipo *</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "cash", label: "💵 Pesa Taslimu", desc: "Lipa ukipokea" },
                  { value: "mpesa", label: "📱 M-Pesa", desc: "Lipa simu" },
                ].map((p) => (
                  <label
                    key={p.value}
                    className={`border-2 rounded-xl p-3 cursor-pointer transition ${
                      form.paymentMethod === p.value
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={p.value}
                      checked={form.paymentMethod === p.value}
                      onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                      className="hidden"
                    />
                    <div className="font-semibold text-sm">{p.label}</div>
                    <div className="text-xs text-gray-500">{p.desc}</div>
                  </label>
                ))}
              </div>
            </div>

            {form.paymentMethod === "mpesa" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nambari ya M-Pesa *</label>
                <input
                  type="tel"
                  value={form.mpesaNumber}
                  onChange={(e) => setForm({ ...form, mpesaNumber: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+255 7XX XXX XXX"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Maelezo Mengine</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Maagizo maalum (si lazima)"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition text-lg"
            >
              {loading ? "Inatuma..." : `Tuma Order - TZS ${total.toLocaleString()}`}
            </button>
          </form>

          {/* Order Summary */}
          <div className="bg-white rounded-2xl shadow p-6 h-fit">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Muhtasari wa Order</h2>
            {cart?.items.map((item) => (
              <div key={item.id} className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-700">{item.medicine.name} x{item.quantity}</span>
                <span className="font-medium">TZS {(item.medicine.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
            <div className="flex justify-between pt-4 font-bold text-lg">
              <span>Jumla</span>
              <span className="text-blue-700">TZS {total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
