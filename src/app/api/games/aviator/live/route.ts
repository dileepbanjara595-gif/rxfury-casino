import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const url = 'https://bet7k-aviator-api.p.rapidapi.com/bet7k-aviator-latest';
    const options = {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'bet7k-aviator-api.p.rapidapi.com',
        'x-rapidapi-key': '7e99383812msh94bfc68e0efd9c1p1f4e7cjsn2a5caa8d72c6'
      }
    };

    const response = await fetch(url, options);

    if (!response.ok) {
      console.error('RapidAPI Fetch Error:', response.statusText);
      return NextResponse.json(
        { error: 'Failed to fetch live Aviator data', status: response.status },
        { status: 502 }
      );
    }

    const data = await response.json();

    // The precise schema of this rapidAPI depends on Bet7k endpoints.
    // Safely mapping common potential fields to the frontend state structure:
    let state = 'WAITING_FOR_BETS';
    if (data.status === 'running' || data.state === 'running' || data.is_flying) state = 'GAME_RUNNING';
    else if (data.status === 'crashed' || data.state === 'crashed' || data.has_crashed) state = 'CRASHED';

    const mappedState = {
      state,
      currentMultiplier: Number(data.current_multiplier || data.multiplier || data.value || data.x || 1.0),
      crashMultiplier: data.crash_multiplier || data.crash || null,
      timeRemaining: Number(data.time_remaining || data.timer || data.countdown || 0),
      currentSessionId: String(data.session_id || data.id || data.round_id || `live_${Date.now()}`),
      history: Array.isArray(data.history) 
        ? data.history.map((item: any) => typeof item === 'object' ? Number(item.multiplier || item.value || item.x || 1.0) : Number(item)) 
        : []
    };

    return NextResponse.json({
      success: true,
      data: mappedState,
      raw: data
    });

  } catch (error: any) {
    console.error('Aviator Live Route Error:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
