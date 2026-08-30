import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const settings = await prisma.settings.findMany();
    const config: Record<string, string> = {};
    settings.forEach(s => {
      config[s.key] = s.value;
    });

    // Provide default fallback values if they don't exist in the database yet
    return NextResponse.json({
      activeUpiId: config.activeUpiId || 'rxfury@ybl',
      upiQrUrl: config.upiQrUrl || '',
      cryptoAddress: config.cryptoAddress || 'TY3wTz... (Set in Admin Panel)',
    });
  } catch (error) {
    console.error("Settings GET Error:", error);
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
    
    // Save all keys in the body
    for (const [key, value] of Object.entries(body)) {
      if (typeof value === 'string') {
        await prisma.settings.upsert({
          where: { key },
          update: { value },
          create: { key, value }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Settings POST Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
