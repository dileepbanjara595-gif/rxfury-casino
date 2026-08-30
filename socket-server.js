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
// AUTHENTICATION MIDDLEWARE FOR WEBSOCKETS
// ----------------------------------------------------
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
  const userId = socket.handshake.auth?.userId || socket.handshake.query?.userId;
  const email = socket.handshake.auth?.email;

  // Store user info on socket instance
  socket.user = {
    id: userId || token || socket.id,
    email: email || "user@rxfury.com",
    authenticated: Boolean(token || userId)
  };

  console.log(`[Socket Auth] Connection handshake: Socket ${socket.id} (User: ${socket.user.id}, Auth: ${socket.user.authenticated})`);
  next();
});

// ----------------------------------------------------
// REDIS IN-MEMORY CACHING HELPERS
// ----------------------------------------------------
async function setCachedGameState(key, state) {
  if (!isRedisConnected) return;
  try {
    await cacheClient.set(key, JSON.stringify(state), "EX", 60);
  } catch (e) {}
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

let aviatorHistory = [1.24, 2.50, 1.05, 5.40, 1.12, 18.90, 1.01, 3.20, 2.14, 1.88, 4.30, 1.15, 12.45];

let aviatorState = {
  state: CRASH_STATES.WAITING_FOR_BETS,
  timeRemaining: 15.0,
  currentSessionId: `AV-${Date.now().toString().slice(-6)}`,
  currentMultiplier: 1.00,
  crashMultiplier: 0
};

let aviatorActiveBets = [];

function generateCrashMultiplier() {
  const r = Math.random();
  if (r < 0.05) return 1.00;
  const multiplier = 0.99 / (1 - r);
  return Math.max(1.00, Number(multiplier.toFixed(2)));
}

let lastTickTime = Date.now();

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
      aviatorState.timeRemaining = 5.0;

      // Add to live session history
      aviatorHistory.unshift(aviatorState.crashMultiplier);
      if (aviatorHistory.length > 30) aviatorHistory.pop();

      // Broadcast history update to all clients
      io.to("aviator").emit("game:history", aviatorHistory);
      io.to("game:aviator").emit("game:history", aviatorHistory);

      aviatorActiveBets = [];
    }
  } else if (aviatorState.state === CRASH_STATES.CRASHED) {
    aviatorState.timeRemaining -= dt;

    if (aviatorState.timeRemaining <= 0) {
      aviatorState.state = CRASH_STATES.WAITING_FOR_BETS;
      aviatorState.timeRemaining = 15.0;
      aviatorState.currentSessionId = `AV-${Date.now().toString().slice(-6)}`;
      aviatorState.currentMultiplier = 1.00;
    }
  }

  const broadcastPayload = {
    state: aviatorState.state,
    timeRemaining: Number(Math.max(0, aviatorState.timeRemaining).toFixed(1)),
    currentSessionId: aviatorState.currentSessionId,
    currentMultiplier: Number(aviatorState.currentMultiplier.toFixed(2)),
    crashMultiplier: aviatorState.state === CRASH_STATES.CRASHED ? aviatorState.crashMultiplier : null,
    history: aviatorHistory.slice(0, 10)
  };

  setCachedGameState("game:aviator:state", broadcastPayload);

  // Broadcast ticks to both rooms
  io.to("aviator").emit("gameStateUpdate", broadcastPayload);
  io.to("game:aviator").emit("gameStateUpdate", broadcastPayload);
  io.to("game:aviator").emit("game:tick", broadcastPayload);
}

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

        io.to(mode.id).emit("game_result", {
          mode: mode.id,
          periodId: currentPeriod,
          result
        });
        io.to(`game:wingo:${mode.id}`).emit("game_result", {
          mode: mode.id,
          periodId: currentPeriod,
          result
        });

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

    setCachedGameState(`game:wingo:${mode.id}:state`, tickPayload);

    io.to(mode.id).emit("game_tick", tickPayload);
    io.to(`game:wingo:${mode.id}`).emit("game_tick", tickPayload);
    io.to(`game:wingo:${mode.id}`).emit("game:tick", tickPayload);
  }, 1000);
});

// ----------------------------------------------------
// SOCKET CONNECTION & EVENT HANDLERS
// ----------------------------------------------------
io.on("connection", (socket) => {
  // Aviator join
  socket.on("join_aviator", async () => {
    socket.join("aviator");
    socket.join("game:aviator");
    console.log(`Socket ${socket.id} (User: ${socket.user?.id}) joined aviator`);

    // Send immediate initial state & history
    const cached = await getCachedGameState("game:aviator:state");
    const payload = cached || {
      state: aviatorState.state,
      timeRemaining: Number(Math.max(0, aviatorState.timeRemaining).toFixed(1)),
      currentSessionId: aviatorState.currentSessionId,
      currentMultiplier: Number(aviatorState.currentMultiplier.toFixed(2)),
      crashMultiplier: aviatorState.state === CRASH_STATES.CRASHED ? aviatorState.crashMultiplier : null,
      history: aviatorHistory.slice(0, 10)
    };

    socket.emit("gameStateUpdate", payload);
    socket.emit("game:tick", payload);
    socket.emit("game:history", aviatorHistory.slice(0, 15));
  });

  // Wingo join
  socket.on("join_game", async (modeId) => {
    gameModes.forEach((m) => {
      socket.leave(m.id);
      socket.leave(`game:wingo:${m.id}`);
    });

    socket.join(modeId);
    socket.join(`game:wingo:${modeId}`);
    console.log(`Socket ${socket.id} (User: ${socket.user?.id}) joined Wingo mode ${modeId}`);

    const cached = await getCachedGameState(`game:wingo:${modeId}:state`);
    const payload = cached || gameStates[modeId];

    if (payload) {
      socket.emit("game_tick", payload);
      socket.emit("game:tick", payload);
      socket.emit("game:history", payload.history || []);
    }
  });

  socket.on("disconnect", () => {
    // Clean up
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    redisConnected: isRedisConnected,
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Stateless Game Engine (Socket.io + Redis + Auth) running on http://localhost:${PORT}`);
});
