import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes } from 'node:crypto';
import { blake2b } from 'blakejs';

const INTENT_CONTACTS = 0;
const MOCK_SIGNING_SECRET = process.env.MOCK_SIGNING_SECRET ?? 'mock-secret';

type ContactRecord = {
  name: string;
  phone_hash: number[]; // Byte array to match Rust server format
  email: string;
  other: string;
};

function parseContacts(csv: string): ContactRecord[] {
  const lines = csv.split(/\r?\n/);
  const records: ContactRecord[] = [];
  for (const [index, rawLine] of lines.entries()) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;
    const fields = trimmed.split(',');
    if (index === 0 && looksLikeHeader(fields)) continue;
    if (fields.length < 2) {
      throw new Error('Each CSV row must include at least name and phone');
    }
    const name = fields[0]?.trim();
    const phone = fields[1]?.trim();
    const email = fields[2]?.trim() ?? '';
    const other =
      fields.length > 3
        ? fields
            .slice(3)
            .map((value) => value.trim())
            .filter(Boolean)
            .join(',')
        : '';
    if (!name || !phone) {
      throw new Error('CSV row missing name or phone number');
    }
    const digitsOnly = phone.replace(/\D/g, '');
    if (!digitsOnly) {
      throw new Error('Phone number must contain digits');
    }
    // Use blake2b256 (32 bytes = 256 bits) to match main server
    // Return as byte array to match Rust server format
    const phoneHashBytes = blake2b(digitsOnly, undefined, 32);
    const phoneHash = Array.from(phoneHashBytes);
    
    records.push({
      name,
      phone_hash: phoneHash, // Now a byte array [0-255, 0-255, ...]
      email,
      other,
    });
  }
  return records;
}

function looksLikeHeader(fields: string[]): boolean {
  if (!fields.length) return false;
  const first = fields[0].toLowerCase();
  return first.includes('name') || first.includes('contact');
}

function signResponse(response: object, timestamp: number): string {
  return createHash('sha256')
    .update(MOCK_SIGNING_SECRET)
    .update(String(timestamp))
    .update(JSON.stringify(response))
    .digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    console.log('📥 API: Received process_data request')
    const body = await request.json();
    
    console.log('📋 API: Request body structure:', {
      hasPayload: !!body.payload,
      hasCSV: !!(body.payload?.csv),
      csvLength: body.payload?.csv?.length || 0,
    })
    
    // Validate payload structure
    if (!body.payload || !body.payload.csv) {
      console.error('❌ API: Missing payload.csv')
      return NextResponse.json(
        { error: 'Missing payload.csv in request body' },
        { status: 400 }
      );
    }

    console.log('📄 API: CSV content preview:', body.payload.csv.substring(0, 200))
    
    const contacts = parseContacts(body.payload.csv);
    console.log(`✅ API: Parsed ${contacts.length} contact(s)`)
    
    if (!contacts.length) {
      console.error('❌ API: No contacts parsed from CSV')
      return NextResponse.json(
        { error: 'CSV payload must include at least one row' },
        { status: 400 }
      );
    }

    const timestamp_ms = Date.now();
    const response = {
      intent: INTENT_CONTACTS,
      timestamp_ms,
      data: { contacts },
    };
    const signature = signResponse(response, timestamp_ms);
    
    console.log('✅ API: Generated signature:', signature.substring(0, 20) + '...')
    console.log('📤 API: Sending response')
    
    return NextResponse.json({ response, signature });
  } catch (error) {
    console.error('❌ API: Error processing data:', error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

