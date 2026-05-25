import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Images are now compressed and base64-encoded on the client side.
// This endpoint validates and passes through the base64 data URL.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Hairuhusiwi" }, { status: 403 });
  }

  const { dataUrl } = await req.json();

  if (!dataUrl || !dataUrl.startsWith("data:image/")) {
    return NextResponse.json({ error: "Picha si sahihi" }, { status: 400 });
  }

  // Roughly check size (base64 ~4/3 of original bytes)
  const approxBytes = Math.round((dataUrl.length * 3) / 4);
  if (approxBytes > 2 * 1024 * 1024) {
    return NextResponse.json({ error: "Picha ni kubwa mno baada ya kubana" }, { status: 400 });
  }

  return NextResponse.json({ url: dataUrl });
}
