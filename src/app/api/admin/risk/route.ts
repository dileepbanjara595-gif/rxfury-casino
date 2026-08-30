import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { redis } from "@/lib/redis";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Default RTPs if not set
    const aviatorRTP = await redis.get("rtp:aviator") || "97.0";
    const minesRTP = await redis.get("rtp:mines") || "96.5";
    const k3RTP = await redis.get("rtp:k3") || "98.0";

    return NextResponse.json({
      aviatorRTP: parseFloat(aviatorRTP),
      minesRTP: parseFloat(minesRTP),
      k3RTP: parseFloat(k3RTP),
    });
  } catch (error) {
    console.error("Admin Risk GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { aviatorRTP, minesRTP, k3RTP } = body;

    if (aviatorRTP) await redis.set("rtp:aviator", aviatorRTP.toString());
    if (minesRTP) await redis.set("rtp:mines", minesRTP.toString());
    if (k3RTP) await redis.set("rtp:k3", k3RTP.toString());

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin Risk POST Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
