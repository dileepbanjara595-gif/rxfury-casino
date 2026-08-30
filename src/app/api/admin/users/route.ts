import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(users);
  } catch (e) { return NextResponse.json({ error: "Error" }, { status: 500 }); }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const { email, password, mainWalletBalance, role } = await req.json();
    const systematicId = 'FURY-' + Math.random().toString(36).substring(2, 7).toUpperCase();
    const passwordHash = password ? bcrypt.hashSync(password, 10) : 'TEMP_HASH';
    
    const user = await prisma.user.create({
      data: { email, systematicId, passwordHash, role, mainWalletBalance: parseFloat(mainWalletBalance) }
    });
    return NextResponse.json({ success: true, user });
  } catch (e) { return NextResponse.json({ error: "Error" }, { status: 500 }); }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const { id, email, password, mainWalletBalance, role } = await req.json();
    let dataToUpdate: any = { email, role, mainWalletBalance: parseFloat(mainWalletBalance) };
    if (password) dataToUpdate.passwordHash = bcrypt.hashSync(password, 10);
    
    const user = await prisma.user.update({
      where: { id },
      data: dataToUpdate
    });
    return NextResponse.json({ success: true, user });
  } catch (e) { return NextResponse.json({ error: "Error" }, { status: 500 }); }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const { id } = await req.json();
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) { return NextResponse.json({ error: "Error" }, { status: 500 }); }
}
