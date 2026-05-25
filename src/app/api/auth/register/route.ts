import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, phone, address } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Tafadhali jaza sehemu zote" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email tayari imetumika" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, phone, address },
    });

    return NextResponse.json({ message: "Akaunti imetengenezwa", userId: user.id });
  } catch {
    return NextResponse.json({ error: "Kuna tatizo, jaribu tena" }, { status: 500 });
  }
}
