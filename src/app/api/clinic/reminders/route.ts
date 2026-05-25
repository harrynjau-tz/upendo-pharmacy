import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Hairuhusiwi" }, { status: 403 });
  }

  const today = new Date();
  const in7Days = new Date();
  in7Days.setDate(today.getDate() + 7);

  // Patients whose medicines are due within 7 days or overdue
  const upcoming = await prisma.clinicPatientMedicine.findMany({
    where: { nextRefillDate: { lte: in7Days } },
    include: {
      patient: true,
      medicine: true,
    },
    orderBy: { nextRefillDate: "asc" },
  });

  return NextResponse.json(
    upcoming.map((r) => {
      const daysLeft = Math.ceil((new Date(r.nextRefillDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return {
        id: r.id,
        patientId: r.patientId,
        patientName: r.patient.name,
        patientPhone: r.patient.phone,
        medicineName: r.medicine.name,
        dosage: r.dosage,
        quantityPerRefill: r.quantityPerRefill,
        nextRefillDate: r.nextRefillDate,
        daysLeft,
        overdue: daysLeft < 0,
      };
    })
  );
}
