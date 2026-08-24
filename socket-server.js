const { Server } = require("socket.io");
const http = require("http");
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// ==========================================
// NEW: MULTIPLAYER CRASH / AVIATOR ENGINE
// ==========================================

const CRASH_STATES = {
  WAITING_FOR_BETS: 'WAITING_FOR_BETS',
  GAME_RUNNING: 'GAME_RUNNING',
  CRASHED: 'CRASHED'
};

let aviatorState = {
  state: CRASH_STATES.WAITING_FOR_BETS,
  timeRemaining: 15.0, // 15 seconds betting phase
  currentSessionId: `SESSION_${Date.now()}`,
  currentMultiplier: 1.00,
  crashMultiplier: 0
};

function generateCrashMultiplier() {
  const r = Math.random();
  if (r < 0.05) return 1.00; // 5% instant crash at 1.00x
  // Simple curve
  const multiplier = 0.99 / (1 - r);
  return Math.max(1.00, Number(multiplier.toFixed(2)));
}

let lastTickTime = Date.now();

function aviatorLoop() {
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
  } 
  else if (aviatorState.state === CRASH_STATES.GAME_RUNNING) {
    aviatorState.currentMultiplier += (dt * aviatorState.currentMultiplier * 0.1);

    if (aviatorState.currentMultiplier >= aviatorState.crashMultiplier) {
      aviatorState.currentMultiplier = aviatorState.crashMultiplier; // Snap to exact
      aviatorState.state = CRASH_STATES.CRASHED;
      aviatorState.timeRemaining = 5.0; // 5 seconds showing crash result
    }
  } 
  else if (aviatorState.state === CRASH_STATES.CRASHED) {
    aviatorState.timeRemaining -= dt;
    
    if (aviatorState.timeRemaining <= 0) {
      // Reset for next round
      aviatorState.state = CRASH_STATES.WAITING_FOR_BETS;
      aviatorState.timeRemaining = 15.0;
      aviatorState.currentSessionId = `SESSION_${Date.now()}`;
      aviatorState.currentMultiplier = 1.00;
    }
  }

  // Broadcast every 100ms for smoothness
  io.to('aviator').emit('gameStateUpdate', {
    state: aviatorState.state,
    timeRemaining: Number(Math.max(0, aviatorState.timeRemaining).toFixed(1)),
    currentSessionId: aviatorState.currentSessionId,
    currentMultiplier: Number(aviatorState.currentMultiplier.toFixed(2))
  });
}

// Run the Aviator loop at 10 ticks per second (100ms)
setInterval(aviatorLoop, 100);

// Update connection logic for aviator
io.on("connection", (socket) => {
  socket.on("join_aviator", () => {
    socket.join('aviator');
    console.log(`Socket ${socket.id} joined aviator`);
    socket.emit('gameStateUpdate', {
      state: aviatorState.state,
      timeRemaining: Number(Math.max(0, aviatorState.timeRemaining).toFixed(1)),
      currentSessionId: aviatorState.currentSessionId,
      currentMultiplier: Number(aviatorState.currentMultiplier.toFixed(2))
    });
  });
});

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`Universal Game Engine (Socket.io) running on http://localhost:${PORT}`);
});

// ==========================================
// WINGO / BIG & SMALL ENGINE
// ==========================================

const gameModes = [
  { id: 'wingo_10s', duration: 10, name: '10 Sec' },
  { id: 'wingo_30s', duration: 30, name: '30 Sec' },
  { id: 'wingo_1m', duration: 60, name: '1 Min' },
  { id: 'wingo_5m', duration: 300, name: '5 Min' },
  { id: 'wingo_10m', duration: 600, name: '10 Min' },
];

const gameStates = {};

function generatePeriodId(duration) {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const secondsSinceMidnight = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const periodNum = Math.floor(secondsSinceMidnight / duration) + 1;
  return `${dateStr}${duration}${periodNum.toString().padStart(4, '0')}`;
}

function generateWingoResult() {
  const number = Math.floor(Math.random() * 10);
  const size = number <= 4 ? 'Small' : 'Big';
  let color = 'Red';
  let colors = ['Red'];
  
  if ([1, 3, 7, 9].includes(number)) {
    color = 'Green';
    colors = ['Green'];
  } else if ([2, 4, 6, 8].includes(number)) {
    color = 'Red';
    colors = ['Red'];
  } else if (number === 0) {
    color = 'Violet/Red';
    colors = ['Violet', 'Red'];
  } else if (number === 5) {
    color = 'Violet/Green';
    colors = ['Violet', 'Green'];
  }

  return { number, size, color, colors };
}

gameModes.forEach(mode => {
  let periodId = generatePeriodId(mode.duration);
  let timeLeft = mode.duration - (Math.floor(Date.now() / 1000) % mode.duration);
  let isResolving = false;
  let history = Array.from({length: 10}).map((_, i) => {
     const res = generateWingoResult();
     return { periodId: `${periodId.slice(0, -1)}${i}`, ...res };
  });

  gameStates[mode.id] = {
    mode: mode.id,
    periodId,
    timeLeft,
    history
  };

  setInterval(() => {
    timeLeft = mode.duration - (Math.floor(Date.now() / 1000) % mode.duration);
    
    if (timeLeft === mode.duration || timeLeft === 0) {
      if (!isResolving) {
        isResolving = true;
        const result = generateWingoResult();
        const currentPeriod = periodId;
        
        gameStates[mode.id].history.unshift({ periodId: currentPeriod, ...result });
        if (gameStates[mode.id].history.length > 50) gameStates[mode.id].history.pop();

        io.to(mode.id).emit('game_result', {
          mode: mode.id,
          periodId: currentPeriod,
          result
        });

        periodId = generatePeriodId(mode.duration);
        
        setTimeout(() => { isResolving = false; }, 1000);
      }
      timeLeft = mode.duration; 
    }

    gameStates[mode.id].periodId = periodId;
    gameStates[mode.id].timeLeft = timeLeft;

    io.to(mode.id).emit('game_tick', {
      mode: mode.id,
      periodId,
      timeLeft,
      history: gameStates[mode.id].history.slice(0, 10)
    });

  }, 1000);
});

// We need to attach Wingo event listeners to existing socket connections.
// Since io.on('connection') is already defined in socket-server.js for Aviator,
// we will intercept connections there.

io.on("connection", (socket) => {
  socket.on("join_game", (modeId) => {
    // Leave other wingo modes
    gameModes.forEach(m => socket.leave(m.id));
    
    socket.join(modeId);
    console.log(`Socket ${socket.id} joined Wingo mode ${modeId}`);
    
    // Send immediate state
    if (gameStates[modeId]) {
      socket.emit('game_tick', gameStates[modeId]);
    }
  });
});
