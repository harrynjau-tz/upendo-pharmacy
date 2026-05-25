"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const statusLabels: Record<string, string> = {
  pending: "Inasubiri",
  confirmed: "Imethibitishwa",
  delivered: "Imefika",
  cancelled: "Imefutwa",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

type OrderItem = {
  id: string;
  quantity: number;
  price: number;
  medicine: { name: string };
};

type Order = {
  id: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  total: number;
  address: string;
  notes?: string;
  mpesaNumber?: string;
  createdAt: string;
  items: OrderItem[];
  user: { name: string; email: string; phone?: string };
};

export default function AdminOrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const user = session?.user as { role?: string } | undefined;

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && user?.role !== "admin") router.push("/");
  }, [status, user, router]);

  useEffect(() => {
    if (user?.role === "admin") {
      fetch("/api/orders")
        .then((r) => r.json())
        .then(setOrders)
        .finally(() => setLoading(false));
    }
  }, [user]);

  const updateOrder = async (id: string, orderStatus: string, paymentStatus: string) => {
    await fetch(`/api/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: orderStatus, paymentStatus }),
    });
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: orderStatus, paymentStatus } : o))
    );
  };

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  if (loading) return <div className="min-h-screen bg-gray-50"><Navbar /><div className="flex justify-center py-20 text-gray-400">Inapakia...</div></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link href="/admin" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm mb-6 font-medium">
          <ArrowLeft size={16} /> Rudi Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Simamia Maagizo</h1>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { value: "all", label: "Yote" },
            { value: "pending", label: "Yanasubiri" },
            { value: "confirmed", label: "Yamethibitishwa" },
            { value: "delivered", label: "Yamefika" },
            { value: "cancelled", label: "Yamefutwa" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                filter === f.value
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-blue-300"
              }`}
            >
              {f.label} {f.value === "all" ? `(${orders.length})` : `(${orders.filter(o => o.status === f.value).length})`}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filtered.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl shadow p-6">
              <div className="flex flex-wrap justify-between gap-4 mb-4">
                <div>
                  <p className="font-bold text-gray-800">
                    Order #{order.id.slice(-8).toUpperCase()}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleString("sw")}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Mteja: <strong>{order.user.name}</strong> — {order.user.phone || order.user.email}
                  </p>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusColors[order.status]}`}>
                    {statusLabels[order.status]}
                  </span>
                  <span className="text-xs text-gray-500">
                    {order.paymentMethod === "mpesa" ? `M-Pesa: ${order.mpesaNumber}` : "Pesa Taslimu"}
                  </span>
                  <span className={`text-xs px-3 py-1 rounded-full ${
                    order.paymentStatus === "paid" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {order.paymentStatus === "paid" ? "Imelipwa" : "Haijalipwa"}
                  </span>
                </div>
              </div>

              {/* Items */}
              <div className="bg-gray-50 rounded-xl p-3 mb-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm py-1">
                    <span>{item.medicine.name} x{item.quantity}</span>
                    <span>TZS {(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
                <div className="border-t mt-2 pt-2 flex justify-between font-bold">
                  <span>Jumla</span>
                  <span className="text-blue-700">TZS {order.total.toLocaleString()}</span>
                </div>
              </div>

              <div className="text-sm text-gray-500 mb-4">
                <strong>Anwani:</strong> {order.address}
                {order.notes && <> • <strong>Maelezo:</strong> {order.notes}</>}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {order.status === "pending" && (
                  <button
                    onClick={() => updateOrder(order.id, "confirmed", order.paymentStatus)}
                    className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-blue-700 transition"
                  >
                    Thibitisha
                  </button>
                )}
                {order.status === "confirmed" && (
                  <button
                    onClick={() => updateOrder(order.id, "delivered", "paid")}
                    className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-green-700 transition"
                  >
                    Imefika
                  </button>
                )}
                {order.status !== "cancelled" && order.status !== "delivered" && (
                  <button
                    onClick={() => updateOrder(order.id, "cancelled", order.paymentStatus)}
                    className="bg-red-50 text-red-600 border border-red-200 px-4 py-1.5 rounded-lg text-sm hover:bg-red-100 transition"
                  >
                    Futa
                  </button>
                )}
                {order.paymentStatus === "unpaid" && order.status !== "cancelled" && (
                  <button
                    onClick={() => updateOrder(order.id, order.status, "paid")}
                    className="bg-green-50 text-green-700 border border-green-200 px-4 py-1.5 rounded-lg text-sm hover:bg-green-100 transition"
                  >
                    Weka Imelipwa
                  </button>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl shadow text-gray-400">
              Hakuna maagizo
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
