import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Hairuhusiwi" }, { status: 403 });
  }

  const patients = await prisma.clinicPatient.findMany({
    include: {
      medicines: {
        include: { medicine: { include: { category: true } } },
        orderBy: { nextRefillDate: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(patients);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Hairuhusiwi" }, { status: 403 });
  }

  const { name, phone, address, notes } = await req.json();
  if (!name || !phone) {
    return NextResponse.json({ error: "Jaza jina na simu" }, { status: 400 });
  }

  const patient = await prisma.clinicPatient.create({
    data: { name, phone, address, notes },
    include: { medicines: true },
  });

  return NextResponse.json(patient);
}
