import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Hairuhusiwi" }, { status: 403 });
  }

  // All medicines with their order items
  const medicines = await prisma.medicine.findMany({
    include: {
      category: true,
      orderItems: {
        include: { order: true },
      },
    },
    orderBy: { name: "asc" },
  });

  // Overall order stats
  const allOrders = await prisma.order.findMany({
    where: { status: { not: "cancelled" } },
  });

  const reportRows = medicines.map((med) => {
    const soldItems = med.orderItems.filter(
      (oi) => oi.order.status !== "cancelled"
    );
    const qtySold = soldItems.reduce((s, oi) => s + oi.quantity, 0);
    const revenueFromMed = soldItems.reduce(
      (s, oi) => s + oi.price * oi.quantity,
      0
    );
    const costOfSold = med.costPrice * qtySold;
    const profitFromSales = revenueFromMed - costOfSold;
    const stockValue = med.costPrice * med.stock;
    const potentialRevenue = med.price * med.stock;
    const potentialProfit = (med.price - med.costPrice) * med.stock;

    return {
      id: med.id,
      name: med.name,
      category: med.category?.name || "-",
      sellingPrice: med.price,
      costPrice: med.costPrice,
      profitMargin: med.price - med.costPrice,
      stock: med.stock,
      stockValue,
      potentialRevenue,
      potentialProfit,
      qtySold,
      revenueFromSales: revenueFromMed,
      costOfSold,
      profitFromSales,
    };
  });

  const totalRevenue = allOrders.reduce((s, o) => s + o.total, 0);
  const totalStockValue = reportRows.reduce((s, r) => s + r.stockValue, 0);
  const totalPotentialRevenue = reportRows.reduce((s, r) => s + r.potentialRevenue, 0);
  const totalProfitFromSales = reportRows.reduce((s, r) => s + r.profitFromSales, 0);
  const totalPotentialProfit = reportRows.reduce((s, r) => s + r.potentialProfit, 0);

  return NextResponse.json({
    rows: reportRows,
    summary: {
      totalRevenue,
      totalStockValue,
      totalPotentialRevenue,
      totalProfitFromSales,
      totalPotentialProfit,
      totalOrders: allOrders.length,
      totalMedicines: medicines.length,
    },
  });
}
