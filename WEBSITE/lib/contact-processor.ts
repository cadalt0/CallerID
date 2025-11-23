"use client"

/**
 * Contact Processor Service
 * Handles conversion of VCF contacts to CSV and processing via Nautilus API or local server
 */

interface VCFContact {
  fullName?: string
  name?: {
    family?: string
    given?: string
    additional?: string
    prefix?: string
    suffix?: string
  }
  phones: Array<{ type?: string; number: string }>
  emails: Array<{ type?: string; email: string }>
  organization?: string
  address?: string
  note?: string
  url?: string
}

interface ProcessedContact {
  name: string
  phone: string
  email: string
  other: string
}

interface ProcessDataResponse {
  response: {
    intent: number
    timestamp_ms: number
    data: {
      contacts: Array<{
        name: string
        phone_hash: number[] // Byte array (array of numbers 0-255)
        email: string
        other: string
      }>
    }
  }
  signature: string
}

/**
 * Convert VCF contact to CSV format
 */
function vcfContactToCSV(contact: VCFContact): ProcessedContact | null {
  // Extract name: prefer fullName, fallback to constructed name from N field
  const name =
    contact.fullName ||
    (contact.name
      ? [
          contact.name.prefix,
          contact.name.given,
          contact.name.additional,
          contact.name.family,
          contact.name.suffix,
        ]
          .filter(Boolean)
          .join(" ")
      : "")

  // Extract phone: prefer first phone, fallback to any phone
  const phone = contact.phones[0]?.number || contact.phones.find((p) => p.number)?.number || ""

  // Extract email: prefer first email
  const email = contact.emails[0]?.email || contact.emails.find((e) => e.email)?.email || ""

  // Extract other: combine organization, address, note, url, and other fields
  const otherParts: string[] = []
  if (contact.organization) otherParts.push(`ORG:${contact.organization}`)
  if (contact.address) otherParts.push(`ADR:${contact.address}`)
  if (contact.note) otherParts.push(`NOTE:${contact.note}`)
  if (contact.url) otherParts.push(`URL:${contact.url}`)
  
  // Add additional phone numbers (if more than one)
  if (contact.phones.length > 1) {
    contact.phones.slice(1).forEach((p) => {
      otherParts.push(`TEL${p.type ? `;${p.type}` : ""}:${p.number}`)
    })
  }
  
  // Add additional emails (if more than one)
  if (contact.emails.length > 1) {
    contact.emails.slice(1).forEach((e) => {
      otherParts.push(`EMAIL${e.type ? `;${e.type}` : ""}:${e.email}`)
    })
  }

  const other = otherParts.join(",")

  // Must have at least name and phone
  if (!name || !phone) {
    return null
  }

  return { name, phone, email, other }
}

/**
 * Convert array of VCF contacts to CSV string
 */
export function contactsToCSV(contacts: VCFContact[]): string {
  const csvRows: string[] = ["name,phone,email,other"]

  for (const contact of contacts) {
    const csvContact = vcfContactToCSV(contact)
    if (csvContact) {
      // Escape CSV values (handle commas and quotes)
      const escapeCSV = (value: string) => {
        if (value.includes(",") || value.includes('"') || value.includes("\n")) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }

      csvRows.push(
        [
          escapeCSV(csvContact.name),
          escapeCSV(csvContact.phone),
          escapeCSV(csvContact.email),
          escapeCSV(csvContact.other),
        ].join(",")
      )
    }
  }

  return csvRows.join("\n")
}

/**
 * Process contacts via API (Nautilus or local)
 */
export async function processContacts(
  contacts: VCFContact[]
): Promise<ProcessDataResponse> {
  // Convert contacts to CSV
  const csv = contactsToCSV(contacts)
  
  console.log("=".repeat(80))
  console.log("CSV DATA PREPARATION")
  console.log("=".repeat(80))
  console.log("\n📄 Generated CSV Data:")
  console.log(csv)
  console.log("\n")
  
  console.log("📋 CSV Breakdown:")
  const csvLines = csv.split("\n")
  console.log(`  Total lines: ${csvLines.length}`)
  console.log(`  Header: ${csvLines[0]}`)
  console.log(`  Data rows: ${csvLines.length - 1}`)
  csvLines.slice(1).forEach((line, index) => {
    if (line.trim()) {
      const [name, phone, email, other] = line.split(",")
      console.log(`  Row ${index + 1}:`)
      console.log(`    Name: ${name}`)
      console.log(`    Phone: ${phone}`)
      console.log(`    Email: ${email || "N/A"}`)
      console.log(`    Other: ${other || "N/A"}`)
    }
  })
  console.log("\n")

  // Get environment variables (client-side accessible via NEXT_PUBLIC_ prefix)
  const nautilusMode = process.env.NEXT_PUBLIC_NAUTILUS_MODE || "off"
  const nautilusApi = process.env.NEXT_PUBLIC_NAUTILUS_API || ""

  console.log("🔧 Configuration:")
  console.log("  Nautilus Mode:", nautilusMode)
  console.log("  Nautilus API:", nautilusApi || "Not set")
  console.log("\n")

  // Determine which API to use
  const useNautilus = nautilusMode.toLowerCase() === "on" && nautilusApi

  const apiUrl = useNautilus
    ? `${nautilusApi}/process_data`
    : "/api/process-data"

  console.log("🚀 Calling API:", apiUrl)
  console.log("  Method: POST")
  console.log("  Payload:", JSON.stringify({ payload: { csv } }, null, 2))
  console.log("\n")

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        payload: {
          csv,
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ API Error Response:")
      console.error("  Status:", response.status)
      console.error("  Body:", errorText)
      throw new Error(`API request failed: ${response.status} - ${errorText}`)
    }

    const data = (await response.json()) as ProcessDataResponse
    
    console.log("✅ API Response Received:")
    console.log(JSON.stringify(data, null, 2))
    console.log("\n")

    // Print detailed encryption/processing data
    console.log("=".repeat(80))
    console.log("ENCRYPTION/PROCESSING DATA")
    console.log("=".repeat(80))
    console.log("\n📊 Processing Summary:")
    console.log(`  Intent: ${data.response.intent}`)
    console.log(`  Timestamp: ${new Date(data.response.timestamp_ms).toISOString()}`)
    console.log(`  Contacts Processed: ${data.response.data.contacts.length}`)
    console.log(`  Signature: ${data.signature}`)
    console.log("\n")

    console.log("🔐 Encrypted/Processed Contacts:")
    data.response.data.contacts.forEach((contact, index) => {
      console.log(`\n  Contact ${index + 1}:`)
      console.log(`    Name: ${contact.name}`)
      // phone_hash is now a byte array
      const phoneHashHex = contact.phone_hash.map(b => b.toString(16).padStart(2, '0')).join('')
      console.log(`    Phone Hash (BLAKE2b256): [${contact.phone_hash.length} bytes]`)
      console.log(`    Phone Hash (hex): ${phoneHashHex}`)
      console.log(`    Phone Hash (bytes): [${contact.phone_hash.join(', ')}]`)
      console.log(`    Email: ${contact.email || "N/A"}`)
      console.log(`    Other Data: ${contact.other || "N/A"}`)
    })
    console.log("\n")

    console.log("📝 Full Response Data:")
    console.log(JSON.stringify(data.response, null, 2))
    console.log("\n")

    console.log("🔑 Signature Details:")
    console.log(`  Signature Hash: ${data.signature}`)
    console.log(`  Signature Length: ${data.signature.length} characters`)
    console.log("=".repeat(80))
    console.log("\n")

    return data
  } catch (error) {
    console.error("❌ Error processing contacts:", error)
    throw error
  }
}

