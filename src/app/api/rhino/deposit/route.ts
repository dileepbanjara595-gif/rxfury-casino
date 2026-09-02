import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    // 1. Authenticate user properly
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    // 2. Extract and log payload
    const body = await request.json();
    console.log("Rhino Deposit Request Payload received from frontend:", body);

    // Extract preferred naming (currency/network) falling back to asset/depositChains
    const currency = body.currency || body.asset || 'USDT';
    const network = body.network || (body.depositChains && body.depositChains[0]) || 'TRC20';
    const userId = session.user.id; // Override with secure session ID

    if (!currency || !network) {
      return NextResponse.json({ error: 'Missing required fields: currency and network' }, { status: 400 });
    }

    const apiSecret = process.env.RHINO_API_SECRET || "SECRET-1ae4cef7-6064-43e9-bc81-6ad10dee9e10";
    if (!apiSecret) {
      return NextResponse.json({ error: 'Rhino API key is not configured' }, { status: 500 });
    }

    // 3. Map network to Rhino-compatible chain names if necessary
    // Example: TRC20 -> TRON, ERC20 -> ETHEREUM, BEP20 -> BSC
    let rhinoChain = network.toUpperCase();
    if (rhinoChain === 'TRC20') rhinoChain = 'TRON';
    if (rhinoChain === 'ERC20') rhinoChain = 'ETHEREUM';
    if (rhinoChain === 'BEP20') rhinoChain = 'BSC';

    const rhinoPayload = {
      depositChains: [rhinoChain],
      asset: currency.toUpperCase(),
      destination: 'vault',
      metadata: {
        platformUserId: userId
      }
    };
    
    console.log("Sending payload to Rhino.fi API:", rhinoPayload);

    // 4. Send to Rhino
    const response = await fetch('https://api.rhino.fi/sda/deposit-addresses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiSecret,
        'x-api-key': apiSecret
      },
      body: JSON.stringify(rhinoPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Rhino.fi API Error Status:', response.status);
      console.error('Rhino.fi API Error Response:', errorText);
      return NextResponse.json({ 
        error: 'Failed to generate Rhino Smart Deposit Address', 
        details: errorText 
      }, { status: response.status >= 400 && response.status < 500 ? 400 : response.status });
    }

    const data = await response.json();
    console.log("Rhino API Live Response SUCCESS:", JSON.stringify(data));

    return NextResponse.json({
      success: true,
      address: typeof data.address === "string" ? data.address : (data.depositAddress || data.sda || data.payload?.address || "Address parsing failed"),
      details: data
    });

  } catch (error: any) {
    console.error('Error in Rhino Deposit API block:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error', payloadDetails: error.stack }, { status: 500 });
  }
}
