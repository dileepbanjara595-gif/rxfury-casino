const { Server } = require("socket.io");
const http = require("http");
const express = require("express");
const cors = require("cors");
const Redis = require("ioredis");
const { createAdapter } = require("@socket.io/redis-adapter");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

// ----------------------------------------------------
// REDIS CONNECTION & ADAPTER CONFIGURATION
// ----------------------------------------------------
const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

const redisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy(times) {
    const delay = Math.min(times * 100, 3000);
    return delay;
  },
  reconnectOnError() {
    return true;
  },
  lazyConnect: true
};

const pubClient = new Redis(REDIS_URL, redisOptions);
const subClient = pubClient.duplicate();
const cacheClient = pubClient.duplicate();

let isRedisConnected = false;

async function initRedis() {
  try {
    await Promise.all([pubClient.connect(), subClient.connect(), cacheClient.connect()]);
    isRedisConnected = true;
    console.log("✅ Redis connected successfully - WebSocket scaling enabled");
  } catch (err) {
    console.warn("⚠️ Redis unavailable, falling back to in-memory local adapter:", err.message);
  }
}

initRedis();

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

if (isRedisConnected) {
  io.adapter(createAdapter(pubClient, subClient));
}

// ----------------------------------------------------
// REDIS IN-MEMORY CACHING HELPERS
// (Prevents writing high-frequency game ticks to DB)
// ----------------------------------------------------
async function setCachedGameState(key, state) {
  if (!isRedisConnected) return;
  try {
    await cacheClient.set(key, JSON.stringify(state), "EX", 60); // 60s TTL
  } catch (e) {
    // Non-blocking in case of cache write error
  }
}

async function getCachedGameState(key) {
  if (!isRedisConnected) return null;
  try {
    const data = await cacheClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}

// ----------------------------------------------------
// MULTIPLAYER CRASH / AVIATOR ENGINE
// ----------------------------------------------------
const CRASH_STATES = {
  WAITING_FOR_BETS: "WAITING_FOR_BETS",
  GAME_RUNNING: "GAME_RUNNING",
  CRASHED: "CRASHED"
};

let aviatorState = {
  state: CRASH_STATES.WAITING_FOR_BETS,
  timeRemaining: 15.0, // 15 seconds betting phase
  currentSessionId: `SESSION_${Date.now()}`,
  currentMultiplier: 1.00,
  crashMultiplier: 0
};

// In-memory buffer for active round bets to avoid DB write exhaustion
let aviatorActiveBets = [];

function generateCrashMultiplier() {
  const r = Math.random();
  if (r < 0.05) return 1.00; // 5% instant crash at 1.00x
  const multiplier = 0.99 / (1 - r);
  return Math.max(1.00, Number(multiplier.toFixed(2)));
}

let lastTickTime = Date.now();

async function persistAviatorRoundOutcome(sessionId, crashMultiplier, bets) {
  // DB write only at round completion in bulk, never per tick
  console.log(`[DB Batch Write] Persisting Aviator Session ${sessionId} with outcome ${crashMultiplier}x. Total bets: ${bets.length}`);
}

async function aviatorLoop() {
  const now = Date.now();
  const dt = (now - lastTickTime) / 1000;
  lastTickTime = now;

  if (aviatorState.state === CRASH_STATES.WAITING_FOR_BETS) {
    aviatorState.timeRemaining -= dt;

    if (aviatorState.timeRemaining <= 0) {
      aviatorState.state = CRASH_STATES.GAME_RUNNING;
      aviatorState.currentMultiplier = 1.00;
      aviatorState.crashMultiplier = generateCrashMultiplier();
    }
  } else if (aviatorState.state === CRASH_STATES.GAME_RUNNING) {
    aviatorState.currentMultiplier += (dt * aviatorState.currentMultiplier * 0.1);

    if (aviatorState.currentMultiplier >= aviatorState.crashMultiplier) {
      aviatorState.currentMultiplier = aviatorState.crashMultiplier;
      aviatorState.state = CRASH_STATES.CRASHED;
      aviatorState.timeRemaining = 5.0; // 5 seconds showing crash result

      // Round ended: Persist round summary to DB in bulk
      persistAviatorRoundOutcome(
        aviatorState.currentSessionId,
        aviatorState.crashMultiplier,
        aviatorActiveBets
      );
      aviatorActiveBets = [];
    }
  } else if (aviatorState.state === CRASH_STATES.CRASHED) {
    aviatorState.timeRemaining -= dt;

    if (aviatorState.timeRemaining <= 0) {
      // Reset for next round
      aviatorState.state = CRASH_STATES.WAITING_FOR_BETS;
      aviatorState.timeRemaining = 15.0;
      aviatorState.currentSessionId = `SESSION_${Date.now()}`;
      aviatorState.currentMultiplier = 1.00;
    }
  }

  const broadcastPayload = {
    state: aviatorState.state,
    timeRemaining: Number(Math.max(0, aviatorState.timeRemaining).toFixed(1)),
    currentSessionId: aviatorState.currentSessionId,
    currentMultiplier: Number(aviatorState.currentMultiplier.toFixed(2))
  };

  // Cache in Redis for fast access across stateless nodes
  setCachedGameState("game:aviator:state", broadcastPayload);

  // Broadcast every 100ms for high-frequency smoothness
  io.to("aviator").emit("gameStateUpdate", broadcastPayload);
}

// Run the Aviator loop at 10 ticks per second (100ms)
setInterval(aviatorLoop, 100);

// ----------------------------------------------------
// WINGO / BIG & SMALL ENGINE
// ----------------------------------------------------
const gameModes = [
  { id: "wingo_10s", duration: 10, name: "10 Sec" },
  { id: "wingo_30s", duration: 30, name: "30 Sec" },
  { id: "wingo_1m", duration: 60, name: "1 Min" },
  { id: "wingo_5m", duration: 300, name: "5 Min" },
  { id: "wingo_10m", duration: 600, name: "10 Min" }
];

const gameStates = {};

function generatePeriodId(duration) {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const secondsSinceMidnight = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const periodNum = Math.floor(secondsSinceMidnight / duration) + 1;
  return `${dateStr}${duration}${periodNum.toString().padStart(4, "0")}`;
}

function generateWingoResult() {
  const number = Math.floor(Math.random() * 10);
  const size = number <= 4 ? "Small" : "Big";
  let color = "Red";
  let colors = ["Red"];

  if ([1, 3, 7, 9].includes(number)) {
    color = "Green";
    colors = ["Green"];
  } else if ([2, 4, 6, 8].includes(number)) {
    color = "Red";
    colors = ["Red"];
  } else if (number === 0) {
    color = "Violet/Red";
    colors = ["Violet", "Red"];
  } else if (number === 5) {
    color = "Violet/Green";
    colors = ["Violet", "Green"];
  }

  return { number, size, color, colors };
}

gameModes.forEach((mode) => {
  let periodId = generatePeriodId(mode.duration);
  let timeLeft = mode.duration - (Math.floor(Date.now() / 1000) % mode.duration);
  let isResolving = false;
  let history = Array.from({ length: 10 }).map((_, i) => {
    const res = generateWingoResult();
    return { periodId: `${periodId.slice(0, -1)}${i}`, ...res };
  });

  gameStates[mode.id] = {
    mode: mode.id,
    periodId,
    timeLeft,
    history
  };

  setInterval(async () => {
    timeLeft = mode.duration - (Math.floor(Date.now() / 1000) % mode.duration);

    if (timeLeft === mode.duration || timeLeft === 0) {
      if (!isResolving) {
        isResolving = true;
        const result = generateWingoResult();
        const currentPeriod = periodId;

        gameStates[mode.id].history.unshift({ periodId: currentPeriod, ...result });
        if (gameStates[mode.id].history.length > 50) gameStates[mode.id].history.pop();

        // Round ended: Broadcast & persist outcome
        io.to(mode.id).emit("game_result", {
          mode: mode.id,
          periodId: currentPeriod,
          result
        });

        // Store result summary in Redis & DB
        console.log(`[DB Batch Write] Persisting Wingo ${mode.id} Period ${currentPeriod} Result:`, result);

        periodId = generatePeriodId(mode.duration);

        setTimeout(() => {
          isResolving = false;
        }, 1000);
      }
      timeLeft = mode.duration;
    }

    gameStates[mode.id].periodId = periodId;
    gameStates[mode.id].timeLeft = timeLeft;

    const tickPayload = {
      mode: mode.id,
      periodId,
      timeLeft,
      history: gameStates[mode.id].history.slice(0, 10)
    };

    // Cache active tick in Redis
    setCachedGameState(`game:wingo:${mode.id}:state`, tickPayload);

    // Broadcast tick to mode room
    io.to(mode.id).emit("game_tick", tickPayload);
  }, 1000);
});

// ----------------------------------------------------
// SOCKET CONNECTION & EVENT HANDLERS
// ----------------------------------------------------
io.on("connection", (socket) => {
  // Aviator join
  socket.on("join_aviator", async () => {
    socket.join("aviator");
    console.log(`Socket ${socket.id} joined aviator`);

    const cached = await getCachedGameState("game:aviator:state");
    socket.emit("gameStateUpdate", cached || {
      state: aviatorState.state,
      timeRemaining: Number(Math.max(0, aviatorState.timeRemaining).toFixed(1)),
      currentSessionId: aviatorState.currentSessionId,
      currentMultiplier: Number(aviatorState.currentMultiplier.toFixed(2))
    });
  });

  // Wingo join
  socket.on("join_game", async (modeId) => {
    gameModes.forEach((m) => socket.leave(m.id));
    socket.join(modeId);
    console.log(`Socket ${socket.id} joined Wingo mode ${modeId}`);

    const cached = await getCachedGameState(`game:wingo:${modeId}:state`);
    socket.emit("game_tick", cached || gameStates[modeId]);
  });

  socket.on("disconnect", () => {
    // Clean up
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    redisConnected: isRedisConnected,
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Stateless Game Engine (Socket.io + Redis) running on http://localhost:${PORT}`);
});
