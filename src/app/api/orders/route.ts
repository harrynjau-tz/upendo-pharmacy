import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Login kwanza" }, { status: 401 });

  const user = session.user as { id: string; role: string };

  if (user.role === "admin") {
    const orders = await prisma.order.findMany({
      include: { user: true, items: { include: { medicine: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(orders);
  }

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: { items: { include: { medicine: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(orders);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Login kwanza" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const { paymentMethod, mpesaNumber, address, notes } = await req.json();

  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: { include: { medicine: true } } },
  });

  if (!cart || cart.items.length === 0) {
    return NextResponse.json({ error: "Cart iko tupu" }, { status: 400 });
  }

  const total = cart.items.reduce(
    (sum, item) => sum + item.medicine.price * item.quantity,
    0
  );

  const order = await prisma.order.create({
    data: {
      userId,
      total,
      paymentMethod,
      mpesaNumber,
      address,
      notes,
      items: {
        create: cart.items.map((item) => ({
          medicineId: item.medicineId,
          quantity: item.quantity,
          price: item.medicine.price,
        })),
      },
    },
  });

  // Clear cart after order
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

  return NextResponse.json(order);
}
