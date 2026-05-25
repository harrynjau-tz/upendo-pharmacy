import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Hairuhusiwi" }, { status: 403 });
  }
  const { id } = await params;
  const patient = await prisma.clinicPatient.findUnique({
    where: { id },
    include: {
      medicines: {
        include: { medicine: { include: { category: true } } },
        orderBy: { nextRefillDate: "asc" },
      },
    },
  });
  if (!patient) return NextResponse.json({ error: "Mteja hapatikani" }, { status: 404 });
  return NextResponse.json(patient);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Hairuhusiwi" }, { status: 403 });
  }
  const { id } = await params;
  const { name, phone, address, notes } = await req.json();
  const patient = await prisma.clinicPatient.update({
    where: { id },
    data: { name, phone, address, notes },
  });
  return NextResponse.json(patient);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Hairuhusiwi" }, { status: 403 });
  }
  const { id } = await params;
  await prisma.clinicPatient.delete({ where: { id } });
  return NextResponse.json({ message: "Imefutwa" });
}
