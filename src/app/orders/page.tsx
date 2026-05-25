"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { Suspense } from "react";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const statusLabels: Record<string, string> = {
  pending: "Inasubiri",
  confirmed: "Imethibitishwa",
  delivered: "Imefika",
  cancelled: "Imefutwa",
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
  createdAt: string;
  items: OrderItem[];
};

function OrdersContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetch("/api/orders")
        .then((r) => r.json())
        .then(setOrders)
        .finally(() => setLoading(false));
    }
  }, [session]);

  if (loading) return <div className="flex justify-center py-20 text-gray-400">Inapakia...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 mb-6 flex items-center gap-3">
          <CheckCircle size={24} />
          <span>Order yako imetumwa! Tutawasiliana nawe hivi karibuni.</span>
        </div>
      )}

      <h1 className="text-3xl font-bold text-gray-800 mb-8">Maagizo Yangu</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow text-gray-400">
          <div className="text-5xl mb-4">📦</div>
          <p>Huna maagizo bado</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl shadow p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Order #{order.id.slice(-8).toUpperCase()}</p>
                  <p className="text-sm text-gray-400">{new Date(order.createdAt).toLocaleDateString("sw")}</p>
                </div>
                <div className="flex gap-2">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusColors[order.status]}`}>
                    {statusLabels[order.status]}
                  </span>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                    order.paymentStatus === "paid" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                  }`}>
                    {order.paymentStatus === "paid" ? "Imelipwa" : "Haijalipwa"}
                  </span>
                </div>
              </div>

              <div className="border-t pt-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between py-1 text-sm">
                    <span className="text-gray-600">{item.medicine.name} x{item.quantity}</span>
                    <span>TZS {(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="border-t mt-4 pt-4 flex flex-wrap justify-between items-center gap-2">
                <div className="text-sm text-gray-500">
                  <span>{order.paymentMethod === "mpesa" ? "M-Pesa" : "Pesa Taslimu"}</span>
                  <span className="mx-2">•</span>
                  <span>{order.address}</span>
                </div>
                <span className="font-bold text-blue-700 text-lg">
                  TZS {order.total.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Suspense fallback={<div className="flex justify-center py-20">Inapakia...</div>}>
        <OrdersContent />
      </Suspense>
    </div>
  );
}
