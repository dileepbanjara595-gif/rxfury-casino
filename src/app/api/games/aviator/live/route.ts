import { NextResponse } from 'next/server';

export async function GET() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5-second strict timeout

  // Safe fallback data in case RapidAPI fails or times out
  const fallbackData = {
    state: 'WAITING_FOR_BETS',
    currentMultiplier: 1.0,
    crashMultiplier: null,
    timeRemaining: 0,
    currentSessionId: `live_fallback_${Date.now()}`,
    history: []
  };

  try {
    const url = 'https://bet7k-aviator-api.p.rapidapi.com/bet7k-aviator-latest';
    const options = {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'bet7k-aviator-api.p.rapidapi.com',
        'x-rapidapi-key': '7e99383812msh94bfc68e0efd9c1p1f4e7cjsn2a5caa8d72c6'
      },
      signal: controller.signal
    };

    const response = await fetch(url, options);
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('RapidAPI Fetch Error (Returning Fallback):', response.status, errorText);
      return NextResponse.json({ 
        success: false, 
        fallback: true,
        data: fallbackData,
        message: 'RapidAPI returned an error'
      }, { status: 200 }); // Return 200 so frontend doesn't crash
    }

    const data = await response.json();

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
    }, { status: 200 });

  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error('Aviator Live Route Exception (Returning Fallback):', error.message);
    
    // Return safe fallback JSON even on severe errors/timeouts
    return NextResponse.json({ 
      success: false,
      fallback: true,
      data: fallbackData,
      message: error.name === 'AbortError' ? 'Request timed out' : 'Internal Server Error'
    }, { status: 200 });
  }
}
