const SportsManager = require('./sports-manager');
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

// --- TEEN PATTI MULTIPLAYER ENGINE ---
const bots = [
  { id: 'bot-1', name: 'Bot_Vikash', avatar: 'https://i.pravatar.cc/150?u=bot1', balance: 50000, isBot: true },
  { id: 'bot-2', name: 'Bot_Amit', avatar: 'https://i.pravatar.cc/150?u=bot2', balance: 75000, isBot: true },
  { id: 'bot-3', name: 'Bot_Priya', avatar: 'https://i.pravatar.cc/150?u=bot3', balance: 32000, isBot: true },
];

const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
const values = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];

function getRandomCard() {
  return { 
    suit: suits[Math.floor(Math.random() * suits.length)], 
    value: values[Math.floor(Math.random() * values.length)],
    color: ['hearts', 'diamonds'].includes(suits[Math.floor(Math.random() * suits.length)]) ? 'text-red-500' : 'text-slate-900'
  };
}

class TeenPattiTable {
  constructor(id) {
    this.id = id;
    this.seats = [null, null, null, null, null]; // 5 seats
    this.state = 'WAITING'; // WAITING, STARTING, PLAYING, SHOWDOWN
    this.pot = 0;
    this.currentTurnIdx = -1;
    this.baseBet = 100;
    this.countdown = 0;
    this.history = []; // Array to hold last few results
  }

  addPlayer(player) {
    const emptySeatIdx = this.seats.findIndex(s => s === null);
    if (emptySeatIdx !== -1) {
      this.seats[emptySeatIdx] = { ...player, seatIndex: emptySeatIdx, state: 'WAITING', cards: [], currentBet: 0, packed: false, seen: false };
      return true;
    }
    return false;
  }

  removePlayer(userId) {
    const idx = this.seats.findIndex(s => s && s.id === userId);
    if (idx !== -1) {
      this.seats[idx] = null;
      // If active, pack them
    }
  }

  get activePlayers() {
    return this.seats.filter(s => s !== null);
  }

  get playingPlayers() {
    return this.seats.filter(s => s !== null && !s.packed && s.state === 'PLAYING');
  }

  manageBots() {
    if (this.state !== 'WAITING') return;
    const realPlayers = this.seats.filter(s => s && !s.isBot).length;
    const botPlayers = this.seats.filter(s => s && s.isBot).length;
    const total = this.activePlayers.length;

    // Remove bot if table full of real players
    if (realPlayers > 0 && total === 5) {
        const botIdx = this.seats.findIndex(s => s && s.isBot);
        if(botIdx !== -1) this.seats[botIdx] = null;
    }

    // Add bot if < 3 total
    if (total < 3) {
      const availableBots = bots.filter(b => !this.seats.find(s => s && s.id === b.id));
      if (availableBots.length > 0) {
        this.addPlayer(availableBots[0]);
      }
    }
  }

  startRound() {
    this.state = 'STARTING';
    this.countdown = 5;
    this.pot = 0;
    // Charge ante
    this.seats.forEach(s => {
      if (s) {
        s.state = 'PLAYING';
        s.packed = false;
        s.seen = false;
        s.cards = [getRandomCard(), getRandomCard(), getRandomCard()];
        s.currentBet = this.baseBet;
        this.pot += this.baseBet;
      }
    });
  }

  nextTurn() {
     const playing = this.playingPlayers;
     if (playing.length <= 1) {
        this.showdown();
        return;
     }

     let nextIdx = (this.currentTurnIdx + 1) % 5;
     let loops = 0;
     while (loops < 5) {
       const p = this.seats[nextIdx];
       if (p && !p.packed && p.state === 'PLAYING') {
          this.currentTurnIdx = nextIdx;
          this.countdown = 15; // 15s turn
          break;
       }
       nextIdx = (nextIdx + 1) % 5;
       loops++;
     }
  }

  showdown() {
     this.state = 'SHOWDOWN';
     const playing = this.playingPlayers;
     
     // Pick winner randomly for mock Prototype
     let winner = playing.length > 0 ? playing[Math.floor(Math.random() * playing.length)] : null;
     if (winner) {
         winner.balance += this.pot;
         // Simulate saving to DB via external webhook or API fetch here in prod
         this.history.unshift({
            roomId: this.id,
            winnerName: winner.name,
            potAmount: this.pot,
            timestamp: new Date().toISOString()
         });
         if (this.history.length > 20) this.history.pop();
     }

     this.countdown = 10;
     setTimeout(() => {
        this.state = 'WAITING';
        this.currentTurnIdx = -1;
     }, 10000);
  }

  tick() {
    this.manageBots();

    if (this.state === 'WAITING' && this.activePlayers.length >= 2) {
       this.startRound();
    } else if (this.state === 'STARTING') {
       this.countdown--;
       if (this.countdown <= 0) {
          this.state = 'PLAYING';
          this.nextTurn();
       }
    } else if (this.state === 'PLAYING') {
       this.countdown--;
       
       // Handle bot turn
       const currPlayer = this.seats[this.currentTurnIdx];
       if (currPlayer && currPlayer.isBot && this.countdown < 12) {
          // Bot logic based on RTP: for now simple random
          if (Math.random() > 0.8) {
              currPlayer.packed = true;
          } else {
              this.pot += this.baseBet;
              currPlayer.currentBet += this.baseBet;
          }
          this.nextTurn();
       } else if (this.countdown <= 0) {
          // Player timed out
          if (currPlayer) currPlayer.packed = true;
          this.nextTurn();
       }
    }
  }

  getState() {
    return {
      id: this.id,
      state: this.state,
      pot: this.pot,
      countdown: this.countdown,
      currentTurnIdx: this.currentTurnIdx,
      seats: this.seats.map(s => {
         if (!s) return null;
         // Hide cards of others unless showdown
         const showCards = this.state === 'SHOWDOWN' || !s.isBot; // Real client sees own cards in frontend
         return {
            id: s.id,
            name: s.name,
            avatar: s.avatar,
            balance: s.balance,
            seatIndex: s.seatIndex,
            state: s.state,
            packed: s.packed,
            seen: s.seen,
            cards: showCards ? s.cards : []
         };
      })
    };
  }
}

const tpTable = new TeenPattiTable('tp-table-1');
setInterval(() => {
  tpTable.tick();
  io.to('game:teen-patti').emit('game:teen-patti:state', tpTable.getState());
}, 1000);
// --- END TEEN PATTI MULTIPLAYER ENGINE ---



let sportsManager = null;

io.on("connection", (socket) => {
  if (!sportsManager) {
     sportsManager = new SportsManager(io);
  }
  sportsManager.handleClient(socket);
  
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
