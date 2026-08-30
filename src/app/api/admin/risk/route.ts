import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await prisma.settings.findMany({
      where: {
        key: {
          in: ['aviator_new_rtp', 'aviator_old_rtp', 'mines_new_rtp', 'mines_old_rtp', 'k3_new_rtp', 'k3_old_rtp']
        }
      }
    });

    const config: Record<string, number> = {
      aviator_new_rtp: 50, aviator_old_rtp: 30,
      mines_new_rtp: 50, mines_old_rtp: 30,
      k3_new_rtp: 50, k3_old_rtp: 30
    };

    settings.forEach(s => {
      config[s.key] = parseFloat(s.value);
    });

    return NextResponse.json(config);
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
    const keys = ['aviator_new_rtp', 'aviator_old_rtp', 'mines_new_rtp', 'mines_old_rtp', 'k3_new_rtp', 'k3_old_rtp'];

    for (const key of keys) {
      if (body[key] !== undefined) {
        const val = Number(body[key]);
        if (isNaN(val) || val < 10 || val > 90) {
           return NextResponse.json({ error: `RTP for ${key} must be between 10% and 90%` }, { status: 400 });
        }
        await prisma.settings.upsert({
          where: { key },
          update: { value: val.toString() },
          create: { key, value: val.toString() }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin Risk POST Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
