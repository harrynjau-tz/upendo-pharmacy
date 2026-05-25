import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Hairuhusiwi" }, { status: 403 });
  }

  // All medicines with their order items and direct sales
  const medicines = await prisma.medicine.findMany({
    include: {
      category: true,
      orderItems: { include: { order: true } },
      sales: true,
    },
    orderBy: { name: "asc" },
  });

  // Overall order stats
  const allOrders = await prisma.order.findMany({
    where: { status: { not: "cancelled" } },
  });

  // All direct sales
  const allSales = await prisma.sale.findMany();

  const reportRows = medicines.map((med) => {
    // From orders
    const soldItems = med.orderItems.filter((oi) => oi.order.status !== "cancelled");
    const qtyFromOrders = soldItems.reduce((s, oi) => s + oi.quantity, 0);
    const revenueFromOrders = soldItems.reduce((s, oi) => s + oi.price * oi.quantity, 0);

    // From direct sales
    const qtyFromSales = med.sales.reduce((s, sale) => s + sale.quantity, 0);
    const revenueFromDirectSales = med.sales.reduce((s, sale) => s + sale.totalAmount, 0);

    const qtySold = qtyFromOrders + qtyFromSales;
    const revenueFromSales = revenueFromOrders + revenueFromDirectSales;
    const costOfSold = med.costPrice * qtySold;
    const profitFromSales = revenueFromSales - costOfSold;
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
      qtyFromOrders,
      qtyFromSales,
      revenueFromSales,
      costOfSold,
      profitFromSales,
    };
  });

  const totalOrderRevenue = allOrders.reduce((s, o) => s + o.total, 0);
  const totalDirectSalesRevenue = allSales.reduce((s, sale) => s + sale.totalAmount, 0);
  const totalRevenue = totalOrderRevenue + totalDirectSalesRevenue;
  const totalStockValue = reportRows.reduce((s, r) => s + r.stockValue, 0);
  const totalPotentialRevenue = reportRows.reduce((s, r) => s + r.potentialRevenue, 0);
  const totalProfitFromSales = reportRows.reduce((s, r) => s + r.profitFromSales, 0);
  const totalPotentialProfit = reportRows.reduce((s, r) => s + r.potentialProfit, 0);

  return NextResponse.json({
    rows: reportRows,
    summary: {
      totalRevenue,
      totalOrderRevenue,
      totalDirectSalesRevenue,
      totalSalesCount: allSales.length,
      totalStockValue,
      totalPotentialRevenue,
      totalProfitFromSales,
      totalPotentialProfit,
      totalOrders: allOrders.length,
      totalMedicines: medicines.length,
    },
  });
}
