import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Login kwanza" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  let cart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: { include: { medicine: true } } },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId },
      include: { items: { include: { medicine: true } } },
    });
  }

  return NextResponse.json(cart);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Login kwanza" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const { medicineId, quantity } = await req.json();

  let cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId } });
  }

  const existing = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, medicineId },
  });

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + quantity },
    });
  } else {
    await prisma.cartItem.create({
      data: { cartId: cart.id, medicineId, quantity },
    });
  }

  return NextResponse.json({ message: "Dawa imeongezwa kwenye cart" });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Login kwanza" }, { status: 401 });

  const { itemId } = await req.json();
  await prisma.cartItem.delete({ where: { id: itemId } });
  return NextResponse.json({ message: "Dawa imeondolewa" });
}
