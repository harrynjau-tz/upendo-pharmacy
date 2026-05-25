import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Hairuhusiwi" }, { status: 403 });
  }

  const { currentPassword, newPassword } = await req.json();
  const userId = (session.user as { id: string }).id;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "Mtumiaji hapatikani" }, { status: 404 });

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) return NextResponse.json({ error: "Nywila ya sasa si sahihi" }, { status: 400 });

  if (newPassword.length < 6) {
    return NextResponse.json({ error: "Nywila mpya iwe na herufi 6 au zaidi" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });

  return NextResponse.json({ message: "Nywila imebadilishwa" });
}
