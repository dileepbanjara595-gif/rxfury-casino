import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: Request) {
  try {
    const { userId, asset = 'USDT', depositChains = ['TRON', 'BASE', 'BSC', 'POLYGON'] } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const apiSecret = process.env.RHINO_API_SECRET;
    if (!apiSecret) {
      return NextResponse.json({ error: 'Rhino API key is not configured' }, { status: 500 });
    }

    // According to Rhino.fi architecture, Smart Deposit Addresses (SDAs) 
    // are typically managed via their REST API endpoint.
    const response = await fetch('https://api.rhino.fi/sda/deposit-addresses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Depending on Rhino's strict auth format, this might be 'x-api-key' or 'Authorization'
        'Authorization': `Bearer ${apiSecret}`,
        'x-api-key': apiSecret
      },
      body: JSON.stringify({
        depositChains,
        asset,
        destination: 'vault', // Settle into the Rhino vault for this platform
        metadata: {
          platformUserId: userId // Attach the RXFURY user ID to track this deposit automatically
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Rhino.fi API Error:', errorText);
      return NextResponse.json({ error: 'Failed to generate Rhino Smart Deposit Address' }, { status: response.status });
    }

    const data = await response.json();

    // Optionally: Store the generated address mapping in your database using Supabase
    // await supabase.from('deposit_addresses').insert({ user_id: userId, address: data.address, provider: 'rhino' });

    return NextResponse.json({
      success: true,
      address: data.address, // The generated multi-chain deposit address
      details: data
    });

  } catch (error: any) {
    console.error('Error in Rhino Deposit API:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
