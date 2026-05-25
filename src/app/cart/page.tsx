"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Trash2, ShoppingBag } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type CartItem = {
  id: string;
  quantity: number;
  medicine: { id: string; name: string; price: number; stock: number };
};

type Cart = { id: string; items: CartItem[] };

export default function CartPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetch("/api/cart")
        .then((r) => r.json())
        .then(setCart)
        .finally(() => setLoading(false));
    }
  }, [session]);

  const removeItem = async (itemId: string) => {
    await fetch("/api/cart", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId }),
    });
    setCart((prev) =>
      prev ? { ...prev, items: prev.items.filter((i) => i.id !== itemId) } : prev
    );
  };

  const total = cart?.items.reduce((s, i) => s + i.medicine.price * i.quantity, 0) || 0;

  if (loading) return <div className="min-h-screen bg-gray-50"><Navbar /><div className="flex justify-center py-20 text-gray-400">Inapakia...</div></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Kikapu Changu</h1>

        {!cart || cart.items.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow">
            <ShoppingBag className="mx-auto text-gray-300 mb-4" size={60} />
            <p className="text-gray-400 text-lg mb-4">Kikapu chako kiko tupu</p>
            <Link href="/medicines" className="bg-blue-600 text-white px-6 py-2.5 rounded-full hover:bg-blue-700 transition">
              Angalia Dawa
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl shadow p-4 flex items-center gap-4">
                  <div className="bg-blue-50 w-16 h-16 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">
                    💊
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{item.medicine.name}</h3>
                    <p className="text-blue-600 font-bold">TZS {item.medicine.price.toLocaleString()}</p>
                    <p className="text-gray-500 text-sm">Idadi: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800">
                      TZS {(item.medicine.price * item.quantity).toLocaleString()}
                    </p>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-400 hover:text-red-600 mt-2"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="bg-white rounded-2xl shadow p-6 h-fit">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Muhtasari</h2>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Vitu ({cart.items.length})</span>
                <span>TZS {total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between mb-4">
                <span className="text-gray-600">Usafirishaji</span>
                <span className="text-green-600">Bure</span>
              </div>
              <div className="border-t pt-4 flex justify-between font-bold text-lg mb-6">
                <span>Jumla</span>
                <span className="text-blue-700">TZS {total.toLocaleString()}</span>
              </div>
              <Link
                href="/checkout"
                className="w-full bg-blue-600 text-white py-3 rounded-lg text-center block font-semibold hover:bg-blue-700 transition"
              >
                Endelea Kulipa
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
