import { NextRequest, NextResponse } from 'next/server';

/**
 * Helius webhook endpoint for transaction monitoring
 * Based on your tests/helius-transaction-monitor.ts
 */
export async function POST(request: NextRequest) {
  try {
    const webhookData = await request.json();
    
    // Process Helius webhook data
    console.log('Helius webhook received:', webhookData);
    
    // TODO: Process game-related transactions
    // - Game creation transactions
    // - Move transactions  
    // - Winner payout transactions
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Helius webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'Helius webhook endpoint active',
    timestamp: new Date().toISOString()
  });
}