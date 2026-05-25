import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const categoryId = searchParams.get("category") || "";

  const medicines = await prisma.medicine.findMany({
    where: {
      AND: [
        search ? { name: { contains: search } } : {},
        categoryId ? { categoryId } : {},
      ],
    },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(medicines);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Hairuhusiwi" }, { status: 403 });
  }

  const data = await req.json();
  const medicine = await prisma.medicine.create({ data });
  return NextResponse.json(medicine);
}
