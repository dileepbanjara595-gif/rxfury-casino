import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

function generateCrashMultiplier() {
  const r = Math.random();
  if (r < 0.05) return 1.00;
  const multiplier = 0.99 / (1 - r);
  return Math.max(1.00, Number(multiplier.toFixed(2)));
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const game = searchParams.get("game");

    if (!game) {
      return NextResponse.json({ error: "Game parameter required" }, { status: 400 });
    }

    if (game === "aviator") {
      return await handleAviatorState();
    } else if (game === "wingo") {
      const mode = searchParams.get("mode") || "wingo_1m";
      return await handleWingoState(mode);
    }

    return NextResponse.json({ error: "Unsupported game" }, { status: 400 });
  } catch (error) {
    console.error("Game State Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

async function handleAviatorState() {
  let latestSession = await prisma.gameSession.findFirst({
    where: { gameName: "aviator" },
    orderBy: { createdAt: "desc" }
  });

  const now = Date.now();
  let needsNewSession = false;

  if (!latestSession) {
    needsNewSession = true;
  } else {
    const crashMultiplier = parseFloat(latestSession.resultOutcome || "1.00");
    const flightDurationSecs = 10 * Math.log(crashMultiplier);
    const totalDurationSecs = 15 + flightDurationSecs + 5;
    const sessionAgeSecs = (now - latestSession.createdAt.getTime()) / 1000;

    if (sessionAgeSecs >= totalDurationSecs) {
      needsNewSession = true;
    }
  }

  if (needsNewSession) {
    const crashMultiplier = generateCrashMultiplier();
    
    latestSession = await prisma.gameSession.create({
      data: {
        gameName: "aviator",
        serverSeed: Math.random().toString(36).substring(2, 15),
        resultOutcome: crashMultiplier.toString(),
        status: "BETTING",
      }
    });
  }

  const sessionAgeSecs = (now - latestSession!.createdAt.getTime()) / 1000;
  const crashMultiplier = parseFloat(latestSession!.resultOutcome || "1.00");
  const flightDurationSecs = 10 * Math.log(crashMultiplier);
  
  let currentState = "WAITING_FOR_BETS";
  let timeRemaining = 0;
  let currentMultiplier = 1.00;

  if (sessionAgeSecs < 15) {
    currentState = "WAITING_FOR_BETS";
    timeRemaining = 15 - sessionAgeSecs;
  } else if (sessionAgeSecs < 15 + flightDurationSecs) {
    currentState = "GAME_RUNNING";
    const flightTime = sessionAgeSecs - 15;
    currentMultiplier = Math.exp(0.1 * flightTime);
  } else {
    currentState = "CRASHED";
    currentMultiplier = crashMultiplier;
    timeRemaining = (15 + flightDurationSecs + 5) - sessionAgeSecs;
  }

  return NextResponse.json({
    sessionId: latestSession!.id,
    startTime: latestSession!.createdAt.getTime(),
    state: currentState,
    timeRemaining: Math.max(0, timeRemaining),
    currentMultiplier: Number(currentMultiplier.toFixed(2)),
    crashMultiplier: currentState === "CRASHED" ? crashMultiplier : null
  });
}

async function handleWingoState(mode: string) {
  let duration = 60;
  if (mode === "wingo_10s") duration = 10;
  else if (mode === "wingo_30s") duration = 30;
  else if (mode === "wingo_1m") duration = 60;
  else if (mode === "wingo_5m") duration = 300;
  else if (mode === "wingo_10m") duration = 600;
   
  const now = new Date();
  
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const secondsSinceMidnight = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const periodNum = Math.floor(secondsSinceMidnight / duration) + 1;
  const periodId = `${dateStr}${duration}${periodNum.toString().padStart(4, "0")}`;

  const periodStartTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).getTime() + (Math.floor(secondsSinceMidnight / duration) * duration * 1000);
  const timeLeft = Math.max(0, (periodStartTime + duration * 1000 - now.getTime()) / 1000);

  let session = await prisma.gameSession.findFirst({
    where: { gameName: "wingo", id: periodId }
  });

  if (!session) {
    const number = Math.floor(Math.random() * 10);
    const size = number <= 4 ? "Small" : "Big";
    let color = "Red";
    if ([1, 3, 7, 9].includes(number)) color = "Green";
    else if ([0, 5].includes(number)) color = "Violet";
    
    const resultJson = JSON.stringify({ number, size, color });

    session = await prisma.gameSession.create({
      data: {
        id: periodId,
        gameName: "wingo",
        serverSeed: Math.random().toString(36).substring(2, 15),
        resultOutcome: resultJson,
        status: "BETTING"
      }
    });
  }

  return NextResponse.json({
    periodId: session.id,
    timeLeft,
    duration,
    status: timeLeft > 5 ? "BETTING" : "RESOLVING"
  });
}
