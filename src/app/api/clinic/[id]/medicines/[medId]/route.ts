import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Refill - update lastRefillDate and recalculate nextRefillDate
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; medId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Hairuhusiwi" }, { status: 403 });
  }
  const { medId } = await params;
  const body = await req.json();

  const existing = await prisma.clinicPatientMedicine.findUnique({ where: { id: medId } });
  if (!existing) return NextResponse.json({ error: "Haipatikani" }, { status: 404 });

  const daysSupply = body.daysSupply ?? existing.daysSupply;
  const refillDate = body.lastRefillDate ? new Date(body.lastRefillDate) : new Date();
  const nextRefillDate = new Date(refillDate);
  nextRefillDate.setDate(nextRefillDate.getDate() + Number(daysSupply));

  const updated = await prisma.clinicPatientMedicine.update({
    where: { id: medId },
    data: {
      dosage: body.dosage ?? existing.dosage,
      daysSupply: Number(daysSupply),
      quantityPerRefill: body.quantityPerRefill ?? existing.quantityPerRefill,
      lastRefillDate: refillDate,
      nextRefillDate,
    },
    include: { medicine: { include: { category: true } } },
  });

  return NextResponse.json(updated);
}

// Remove medicine from patient
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; medId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Hairuhusiwi" }, { status: 403 });
  }
  const { medId } = await params;
  await prisma.clinicPatientMedicine.delete({ where: { id: medId } });
  return NextResponse.json({ message: "Imefutwa" });
}
