import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const banners = await prisma.banner.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
  });
  return NextResponse.json(banners);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Hairuhusiwi" }, { status: 403 });
  }

  const data = await req.json();
  const count = await prisma.banner.count();
  const banner = await prisma.banner.create({
    data: { ...data, order: count },
  });
  return NextResponse.json(banner);
}
