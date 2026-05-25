import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Hairuhusiwi" }, { status: 403 });
  }

  const [totalOrders, totalRevenue, totalMedicines, totalCustomers, pendingOrders, lowStock] =
    await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { total: true }, where: { status: "delivered" } }),
      prisma.medicine.count(),
      prisma.user.count({ where: { role: "customer" } }),
      prisma.order.count({ where: { status: "pending" } }),
      prisma.medicine.findMany({ where: { stock: { lte: 10 } }, select: { id: true, name: true, stock: true } }),
    ]);

  return NextResponse.json({
    totalOrders,
    totalRevenue: totalRevenue._sum.total || 0,
    totalMedicines,
    totalCustomers,
    pendingOrders,
    lowStock,
  });
}
