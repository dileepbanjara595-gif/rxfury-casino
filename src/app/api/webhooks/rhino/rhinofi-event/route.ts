import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client using the Service Role Key
// This bypasses Row Level Security (RLS) to securely update balances from the backend
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    // Validate if the event is a successful deposit
    // Adjust these field names based on Rhino.fi's exact event payload structure
    const eventType = payload.event || payload.type;
    if (eventType !== 'DEPOSIT_COMPLETED' && eventType !== 'deposit.success') {
      // Return 200 to acknowledge receipt of non-deposit events
      return NextResponse.json({ success: true, message: 'Event ignored' }, { status: 200 });
    }

    // Extract relevant data
    // Rhino.fi should return the custom metadata you passed during SDA creation (e.g., userId)
    const userId = payload.metadata?.userId || payload.userId;
    const rawAmount = payload.amount;
    const currency = payload.currency || payload.token;

    if (!userId || !rawAmount) {
      console.error('Webhook Error: Missing required fields', payload);
      return NextResponse.json({ error: 'Invalid payload structure' }, { status: 400 });
    }

    // Safely parse the amount to float to avoid JS precision issues
    const amountToCredit = parseFloat(rawAmount.toString());

    if (isNaN(amountToCredit) || amountToCredit <= 0) {
      return NextResponse.json({ error: 'Invalid deposit amount' }, { status: 400 });
    }

    console.log(`Processing deposit of ${amountToCredit} ${currency} for user ${userId}`);

    // Call Supabase RPC to safely increment the balance without race conditions
    const { error: rpcError } = await supabaseAdmin.rpc('increment_user_balance', {
      user_id: userId,
      amount: amountToCredit
    });

    if (rpcError) {
      console.error('Supabase RPC Error (Increment Balance):', rpcError);
      
      // Fallback: Direct Update (if RPC is not created yet)
      console.log('Attempting fallback direct update...');
      const { data: profile, error: fetchError } = await supabaseAdmin
        .from('profiles')
        .select('mainWalletBalance')
        .eq('id', userId)
        .single();
        
      if (fetchError || !profile) {
        console.error('Webhook Error: User profile not found', fetchError);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const newBalance = Number(profile.mainWalletBalance || 0) + amountToCredit;
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ mainWalletBalance: newBalance })
        .eq('id', userId);
        
      if (updateError) {
        throw updateError;
      }
    }

    // Optional: Log the transaction
    await supabaseAdmin.from('transactions').insert({
      user_id: userId,
      type: 'DEPOSIT',
      amount: amountToCredit,
      currency: currency,
      status: 'COMPLETED',
      provider: 'rhino',
      reference_id: payload.transactionId || payload.id || `dep_${Date.now()}`
    });

    console.log(`Successfully credited ${amountToCredit} ${currency} to user ${userId}`);

    return NextResponse.json({ success: true, message: 'Deposit successfully processed' }, { status: 200 });

  } catch (error: any) {
    console.error('Webhook Processing Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

export async function GET() { return NextResponse.json({ success: true, message: 'GET request received. Webhook is active.' }, { status: 200 }); }

