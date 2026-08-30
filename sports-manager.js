const WebSocket = require('ws');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fetch = require('node-fetch');

const API_KEY = 'sfh_lAII8ahStRHWMDuHPerwV5-yw6MTXa2z';
const BASE_URL = 'https://livefeedapi.com/api/v1';

class SportsManager {
  constructor(io) {
    this.io = io;
    this.ws = null;
    this.matches = new Map();
    
    // We mock the actual connection to livefeedapi since the endpoint might not be physically up or requires auth in this sandbox.
    // In a real environment, we would connect directly to wss://livefeedapi.com/api/v1/live/ws?apiKey=...
    this.initMockLiveFeed();
  }

  // Real Implementation for Production
  async fetchLiveEvents() {
    try {
       const res = await fetch(\`\${BASE_URL}/live/events\`, {
          headers: { 'x-api-key': API_KEY }
       });
       if(res.ok) {
          const data = await res.json();
          // Update DB...
       }
    } catch(e) { console.error('LiveFeed API Rate Limit / Error', e); }
  }

  initMockLiveFeed() {
    console.log("SPORTS MANAGER: Connecting to LiveFeed API (Mocked for Sandbox)");
    
    // Pre-populate some dummy matches for the sandbox
    const dummyMatches = [
      { id: 'm1', betradarId: 'br-101', sport: 'Cricket', title: 'India vs Australia', status: 'LIVE', startTime: new Date(), isSuspended: false },
      { id: 'm2', betradarId: 'br-102', sport: 'Football', title: 'Real Madrid vs Barcelona', status: 'LIVE', startTime: new Date(), isSuspended: false },
      { id: 'm3', betradarId: 'br-103', sport: 'Tennis', title: 'Djokovic vs Alcaraz', status: 'LIVE', startTime: new Date(), isSuspended: false }
    ];

    // Seed DB asynchronously
    setTimeout(async () => {
      try {
        for (const m of dummyMatches) {
          await prisma.sportsMatch.upsert({
            where: { betradarId: m.betradarId },
            update: { status: m.status },
            create: m
          });
        }
      } catch(e) {}
    }, 2000);

    // Mock WebSocket incoming odds every 3 seconds
    setInterval(async () => {
       try {
          // Fetch DB matches to respect Admin suspensions
          const dbMatches = await prisma.sportsMatch.findMany({ where: { status: 'LIVE' } });
          const oddsUpdate = [];

          dbMatches.forEach(match => {
             if (!match.isSuspended) {
                // Generate fluctuating odds
                const p1 = (Math.random() * 2 + 1.1).toFixed(2);
                const px = (Math.random() * 4 + 2.0).toFixed(2);
                const p2 = (Math.random() * 3 + 1.5).toFixed(2);
                
                oddsUpdate.push({
                   betradarId: match.betradarId,
                   sport: match.sport,
                   title: match.title,
                   odds: {
                      '1': { back: p1, lay: (parseFloat(p1) + 0.05).toFixed(2) },
                      'X': { back: px, lay: (parseFloat(px) + 0.05).toFixed(2) },
                      '2': { back: p2, lay: (parseFloat(p2) + 0.05).toFixed(2) }
                   }
                });
             }
          });

          // Broadcast to connected clients in 'sports' room
          this.io.to('sports').emit('sports:odds', oddsUpdate);
       } catch (error) {
          console.error("Sports Sync Error:", error);
       }
    }, 3000);
  }

  handleClient(socket) {
     socket.on('sports:join', () => {
        socket.join('sports');
     });
     socket.on('sports:leave', () => {
        socket.leave('sports');
     });
  }
}

module.exports = SportsManager;
