import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Add medicine to patient
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Hairuhusiwi" }, { status: 403 });
  }
  const { id: patientId } = await params;
  const { medicineId, dosage, daysSupply, quantityPerRefill, lastRefillDate } = await req.json();

  if (!medicineId || !dosage || !daysSupply || !quantityPerRefill) {
    return NextResponse.json({ error: "Jaza sehemu zote" }, { status: 400 });
  }

  const refillDate = lastRefillDate ? new Date(lastRefillDate) : new Date();
  const nextRefillDate = new Date(refillDate);
  nextRefillDate.setDate(nextRefillDate.getDate() + Number(daysSupply));

  const entry = await prisma.clinicPatientMedicine.create({
    data: {
      patientId,
      medicineId,
      dosage,
      daysSupply: Number(daysSupply),
      quantityPerRefill: Number(quantityPerRefill),
      lastRefillDate: refillDate,
      nextRefillDate,
    },
    include: { medicine: { include: { category: true } } },
  });

  return NextResponse.json(entry);
}
