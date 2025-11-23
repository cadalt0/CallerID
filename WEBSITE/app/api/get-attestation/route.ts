import { NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';

export async function GET() {
  try {
    console.log('🔐 API: Received get_attestation request');
    
    // Generate mock attestation (same format as server.ts)
    const attestation = 'pseudo-attestation';
    const public_key = randomBytes(32).toString('hex');
    
    console.log('✅ API: Generated attestation');
    console.log('  Attestation:', attestation);
    console.log('  Public Key:', public_key);
    
    return NextResponse.json({
      attestation,
      public_key,
    });
  } catch (error) {
    console.error('❌ API: Error generating attestation:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

