import { NextRequest, NextResponse } from 'next/server'
import { lookupContactServer } from '@/lib/lookup-contact-server'
import { hashPhoneNumberServer, bytesToHexServer } from '@/lib/hash-utils'

/**
 * API Route: GET /api/spam/[phoneNumber]
 * 
 * Returns spam/contact data for a phone number in JSON format
 * 
 * Example: GET /api/spam/01
 * Example: GET /api/spam/+15551234567
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ phoneNumber: string }> | { phoneNumber: string } }
) {
  try {
    // Handle both Promise and direct params (Next.js 15+ uses Promise)
    const resolvedParams = params instanceof Promise ? await params : params
    // Decode URL-encoded phone number (e.g., %2B becomes +)
    const phoneNumber = decodeURIComponent(resolvedParams.phoneNumber)

    if (!phoneNumber || phoneNumber.trim().length === 0) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    // Hash the phone number (server-side)
    const phoneHashBytes = hashPhoneNumberServer(phoneNumber)
    const phoneHashHex = bytesToHexServer(phoneHashBytes)

    // Lookup contact on-chain (server-side)
    const contact = await lookupContactServer(phoneNumber)

    if (!contact) {
      return NextResponse.json({
        found: false,
        phoneNumber,
        phoneHash: phoneHashHex,
        message: 'No contact found for this phone number',
      })
    }

    // Return contact data in JSON format
    return NextResponse.json({
      found: true,
      phoneNumber,
      phoneHash: phoneHashHex,
      contact: {
        name: contact.name,
        phoneHash: phoneHashHex,
        walletPubkey: '0x' + bytesToHexServer(contact.wallet_pubkey),
        blobId: contact.blob_id,
        suiObjectId: contact.sui_object_id,
        spamCount: contact.spam_count.toString(),
        notSpamCount: contact.not_spam_count.toString(),
        spamType: contact.spam_type || '',
      },
      spamInfo: {
        spamReports: Number(contact.spam_count),
        notSpamReports: Number(contact.not_spam_count),
        spamType: contact.spam_type || null,
        isReportedAsSpam: Number(contact.spam_count) > 0,
      },
    })
  } catch (error) {
    console.error('❌ API Error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to lookup contact',
        found: false,
      },
      { status: 500 }
    )
  }
}

