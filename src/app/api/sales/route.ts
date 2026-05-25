import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Hairuhusiwi" }, { status: 403 });
  }

  const sales = await prisma.sale.findMany({
    include: { medicine: { include: { category: true } } },
    orderBy: { soldAt: "desc" },
  });

  return NextResponse.json(sales);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Hairuhusiwi" }, { status: 403 });
  }

  const { medicineId, quantity, unitPrice, notes } = await req.json();

  if (!medicineId || !quantity || !unitPrice) {
    return NextResponse.json({ error: "Jaza sehemu zote" }, { status: 400 });
  }

  const medicine = await prisma.medicine.findUnique({ where: { id: medicineId } });
  if (!medicine) {
    return NextResponse.json({ error: "Dawa haipatikani" }, { status: 404 });
  }
  if (medicine.stock < quantity) {
    return NextResponse.json({ error: `Stoo haitoshi. Zilizobaki: ${medicine.stock}` }, { status: 400 });
  }

  // Record sale and reduce stock in one transaction
  const [sale] = await prisma.$transaction([
    prisma.sale.create({
      data: {
        medicineId,
        quantity,
        unitPrice,
        costPrice: medicine.costPrice,
        totalAmount: quantity * unitPrice,
        notes: notes || null,
      },
      include: { medicine: true },
    }),
    prisma.medicine.update({
      where: { id: medicineId },
      data: { stock: { decrement: quantity } },
    }),
  ]);

  return NextResponse.json(sale);
}
