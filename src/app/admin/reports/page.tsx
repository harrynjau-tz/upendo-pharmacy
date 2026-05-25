"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, TrendingUp, Package, DollarSign,
  Download, BarChart2, ShoppingBag,
} from "lucide-react";
import * as XLSX from "xlsx";

type ReportRow = {
  id: string;
  name: string;
  category: string;
  sellingPrice: number;
  costPrice: number;
  profitMargin: number;
  stock: number;
  stockValue: number;
  potentialRevenue: number;
  potentialProfit: number;
  qtySold: number;
  revenueFromSales: number;
  costOfSold: number;
  profitFromSales: number;
};

type Summary = {
  totalRevenue: number;
  totalStockValue: number;
  totalPotentialRevenue: number;
  totalProfitFromSales: number;
  totalPotentialProfit: number;
  totalOrders: number;
  totalMedicines: number;
};

const fmt = (n: number | null | undefined) => `TZS ${(n ?? 0).toLocaleString()}`;
const n = (v: number | null | undefined) => (v ?? 0).toLocaleString();

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"mauzo" | "stoo" | "faida">("mauzo");

  const user = session?.user as { role?: string } | undefined;

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && user?.role !== "admin") router.push("/");
  }, [status, user, router]);

  useEffect(() => {
    if (user?.role === "admin") {
      fetch("/api/admin/reports")
        .then((r) => r.json())
        .then((d) => { setRows(d.rows); setSummary(d.summary); setLoading(false); });
    }
  }, [user]);

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Muhtasari
    const summaryData = [
      ["RIPOTI YA UPENDO PHARMACY", ""],
      ["Tarehe", new Date().toLocaleDateString("sw-TZ")],
      [""],
      ["MUHTASARI", ""],
      ["Jumla ya Mauzo (Orders zisizofutwa)", fmt(summary?.totalRevenue || 0)],
      ["Faida Halisi (Mauzo)", fmt(summary?.totalProfitFromSales || 0)],
      ["Thamani ya Stoo (Mtaji Dukani)", fmt(summary?.totalStockValue || 0)],
      ["Mapato Yanayoweza Kupatikana (Stoo)", fmt(summary?.totalPotentialRevenue || 0)],
      ["Faida Inayoweza Kupatikana (Stoo)", fmt(summary?.totalPotentialProfit || 0)],
      ["Jumla ya Maagizo", summary?.totalOrders || 0],
      ["Aina za Dawa", summary?.totalMedicines || 0],
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
    ws1["!cols"] = [{ wch: 40 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, ws1, "Muhtasari");

    // Sheet 2: Mauzo kwa Dawa
    const mauzoHeaders = [
      "Jina la Dawa", "Aina", "Bei ya Kuuzia (TZS)", "Bei ya Kununulia (TZS)",
      "Faida kwa Kitengo (TZS)", "Iliyouzwa (Idadi)", "Mapato (TZS)",
      "Gharama ya Iliyouzwa (TZS)", "Faida Halisi (TZS)"
    ];
    const mauzoData = rows.map((r) => [
      r.name, r.category, r.sellingPrice, r.costPrice, r.profitMargin,
      r.qtySold, r.revenueFromSales, r.costOfSold, r.profitFromSales,
    ]);
    const ws2 = XLSX.utils.aoa_to_sheet([mauzoHeaders, ...mauzoData]);
    ws2["!cols"] = [{ wch: 28 }, { wch: 18 }, { wch: 18 }, { wch: 20 }, { wch: 20 }, { wch: 16 }, { wch: 18 }, { wch: 22 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, ws2, "Mauzo kwa Dawa");

    // Sheet 3: Stoo & Mtaji
    const stooHeaders = [
      "Jina la Dawa", "Aina", "Bei ya Kununulia (TZS)", "Bei ya Kuuzia (TZS)",
      "Stoo (Idadi)", "Thamani ya Stoo (TZS)", "Mapato ya Stoo (TZS)", "Faida ya Stoo (TZS)"
    ];
    const stooData = rows.map((r) => [
      r.name, r.category, r.costPrice, r.sellingPrice,
      r.stock, r.stockValue, r.potentialRevenue, r.potentialProfit,
    ]);
    const ws3 = XLSX.utils.aoa_to_sheet([stooHeaders, ...stooData]);
    ws3["!cols"] = [{ wch: 28 }, { wch: 18 }, { wch: 20 }, { wch: 18 }, { wch: 14 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws3, "Stoo na Mtaji");

    XLSX.writeFile(wb, `Upendo_Pharmacy_Ripoti_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="flex justify-center py-20 text-gray-400">Inapakia ripoti...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link href="/admin" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm mb-6 font-medium">
          <ArrowLeft size={16} /> Rudi Dashboard
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <BarChart2 className="text-blue-600" size={32} /> Ripoti za Biashara
          </h1>
          <button
            onClick={exportExcel}
            className="bg-green-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-green-700 transition font-semibold shadow"
          >
            <Download size={18} /> Pakua Excel
          </button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Jumla ya Mauzo", value: fmt(summary.totalRevenue), icon: <ShoppingBag size={24} className="text-blue-600" />, bg: "bg-blue-50", sub: `Maagizo ${summary.totalOrders}` },
              { label: "Faida (Mauzo)", value: fmt(summary.totalProfitFromSales), icon: <TrendingUp size={24} className="text-green-600" />, bg: "bg-green-50", sub: "Faida halisi iliyopatikana" },
              { label: "Mtaji Dukani (Stoo)", value: fmt(summary.totalStockValue), icon: <Package size={24} className="text-purple-600" />, bg: "bg-purple-50", sub: "Bei ya kununulia × idadi" },
              { label: "Faida ya Stoo", value: fmt(summary.totalPotentialProfit), icon: <DollarSign size={24} className="text-orange-600" />, bg: "bg-orange-50", sub: "Iwapo stoo yote itauzwa" },
            ].map((c, i) => (
              <div key={i} className="bg-white rounded-2xl shadow p-5">
                <div className={`${c.bg} w-12 h-12 rounded-xl flex items-center justify-center mb-3`}>
                  {c.icon}
                </div>
                <p className="text-xs text-gray-500 mb-1">{c.label}</p>
                <p className="text-xl font-bold text-gray-800 leading-tight">{c.value}</p>
                <p className="text-xs text-gray-400 mt-1">{c.sub}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {([
            { id: "mauzo", label: "Mauzo" },
            { id: "stoo", label: "Stoo & Mtaji" },
            { id: "faida", label: "Faida" },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition ${
                tab === t.id ? "bg-blue-600 text-white shadow" : "bg-white text-gray-600 border border-gray-200 hover:border-blue-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow overflow-x-auto">
          {tab === "mauzo" && (
            <table className="w-full text-sm">
              <thead className="bg-blue-50">
                <tr>
                  {["Dawa", "Aina", "Bei Kuuzia", "Iliyouzwa", "Mapato", "Gharama", "Faida"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-gray-600 font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{r.name}</td>
                    <td className="px-4 py-3 text-gray-500">{r.category}</td>
                    <td className="px-4 py-3 text-blue-600">{n(r.sellingPrice)}</td>
                    <td className="px-4 py-3 font-semibold">{r.qtySold ?? 0}</td>
                    <td className="px-4 py-3 text-green-700 font-medium">{n(r.revenueFromSales)}</td>
                    <td className="px-4 py-3 text-red-500">{n(r.costOfSold)}</td>
                    <td className="px-4 py-3">
                      <span className={`font-bold ${(r.profitFromSales ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {n(r.profitFromSales)}
                      </span>
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 border-blue-200 bg-blue-50 font-bold">
                  <td className="px-4 py-3 text-blue-800" colSpan={4}>JUMLA</td>
                  <td className="px-4 py-3 text-green-700">{n(rows.reduce((s, r) => s + (r.revenueFromSales ?? 0), 0))}</td>
                  <td className="px-4 py-3 text-red-500">{n(rows.reduce((s, r) => s + (r.costOfSold ?? 0), 0))}</td>
                  <td className="px-4 py-3 text-green-600">{n(rows.reduce((s, r) => s + (r.profitFromSales ?? 0), 0))}</td>
                </tr>
              </tbody>
            </table>
          )}

          {tab === "stoo" && (
            <table className="w-full text-sm">
              <thead className="bg-purple-50">
                <tr>
                  {["Dawa", "Aina", "Bei Kununulia", "Bei Kuuzia", "Stoo", "Thamani (Mtaji)", "Mapato ya Stoo"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-gray-600 font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{r.name}</td>
                    <td className="px-4 py-3 text-gray-500">{r.category}</td>
                    <td className="px-4 py-3 text-red-500">{n(r.costPrice)}</td>
                    <td className="px-4 py-3 text-blue-600">{n(r.sellingPrice)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${(r.stock ?? 0) <= 10 ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}>
                        {r.stock ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-purple-700 font-semibold">{n(r.stockValue)}</td>
                    <td className="px-4 py-3 text-green-700">{n(r.potentialRevenue)}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-purple-200 bg-purple-50 font-bold">
                  <td className="px-4 py-3 text-purple-800" colSpan={5}>JUMLA</td>
                  <td className="px-4 py-3 text-purple-700">{n(rows.reduce((s, r) => s + (r.stockValue ?? 0), 0))}</td>
                  <td className="px-4 py-3 text-green-700">{n(rows.reduce((s, r) => s + (r.potentialRevenue ?? 0), 0))}</td>
                </tr>
              </tbody>
            </table>
          )}

          {tab === "faida" && (
            <table className="w-full text-sm">
              <thead className="bg-green-50">
                <tr>
                  {["Dawa", "Aina", "Bei Kununulia", "Bei Kuuzia", "Faida/Kitengo", "Iliyouzwa", "Faida Halisi", "Faida ya Stoo"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-gray-600 font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows
                  .sort((a, b) => b.profitFromSales - a.profitFromSales)
                  .map((r) => (
                    <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{r.name}</td>
                      <td className="px-4 py-3 text-gray-500">{r.category}</td>
                      <td className="px-4 py-3 text-red-500">{n(r.costPrice)}</td>
                      <td className="px-4 py-3 text-blue-600">{n(r.sellingPrice)}</td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${(r.profitMargin ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {n(r.profitMargin)}
                        </span>
                      </td>
                      <td className="px-4 py-3">{r.qtySold ?? 0}</td>
                      <td className="px-4 py-3">
                        <span className={`font-bold ${(r.profitFromSales ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {n(r.profitFromSales)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-orange-600 font-medium">{n(r.potentialProfit)}</td>
                    </tr>
                  ))}
                <tr className="border-t-2 border-green-200 bg-green-50 font-bold">
                  <td className="px-4 py-3 text-green-800" colSpan={6}>JUMLA</td>
                  <td className="px-4 py-3 text-green-700">{n(rows.reduce((s, r) => s + (r.profitFromSales ?? 0), 0))}</td>
                  <td className="px-4 py-3 text-orange-600">{n(rows.reduce((s, r) => s + (r.potentialProfit ?? 0), 0))}</td>
                </tr>
              </tbody>
            </table>
          )}
        </div>

        <p className="text-xs text-gray-400 mt-4 text-center">
          * Ripoti inajumuisha maagizo yote isipokuwa yaliyofutwa. Tarehe: {new Date().toLocaleDateString("sw-TZ")}
        </p>
      </div>
    </div>
  );
}
