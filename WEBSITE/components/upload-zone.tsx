"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Upload, FileUp, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { animationConfig } from "@/lib/animations"

interface Contact {
  id: string
  name: string
  number: string
  hashed?: string
  include: boolean
}

interface ParsedVCFContact {
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
  raw: Record<string, string>
}

interface UploadZoneProps {
  onContactsAdded: (contacts: Contact[]) => void
  onParsedContactsAdded?: (parsedContacts: ParsedVCFContact[]) => void
}

export function UploadZone({ onContactsAdded, onParsedContactsAdded }: UploadZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const parseVCF = (content: string): { contacts: Contact[]; parsedContacts: ParsedVCFContact[] } => {
    // Handle line continuations (lines starting with space or tab)
    const normalizedContent = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
    const lines: string[] = []
    let currentLine = ""

    for (const line of normalizedContent.split("\n")) {
      if (line.match(/^[ \t]/)) {
        // Continuation line
        currentLine += line.substring(1)
      } else {
        if (currentLine) {
          lines.push(currentLine)
        }
        currentLine = line
      }
    }
    if (currentLine) {
      lines.push(currentLine)
    }

    const contacts: Contact[] = []
    const parsedContacts: ParsedVCFContact[] = []
    let currentContact: ParsedVCFContact | null = null
    let rawFields: Record<string, string> = {}

    for (const line of lines) {
      const trimmedLine = line.trim()
      if (!trimmedLine) continue

      if (trimmedLine.startsWith("BEGIN:VCARD")) {
        currentContact = {
          phones: [],
          emails: [],
          raw: {},
        }
        rawFields = {}
      } else if (trimmedLine.startsWith("END:VCARD")) {
        if (currentContact) {
          currentContact.raw = rawFields
          parsedContacts.push(currentContact)

          // Extract primary name and phone for Contact interface
          const name = currentContact.fullName || 
                      (currentContact.name ? 
                        [currentContact.name.prefix, currentContact.name.given, currentContact.name.additional, currentContact.name.family, currentContact.name.suffix]
                          .filter(Boolean).join(" ") : 
                        "Unknown")
          
          const primaryPhone = currentContact.phones[0]?.number || 
                              currentContact.phones.find(p => p.type?.toLowerCase().includes("cell"))?.number ||
                              currentContact.phones.find(p => p.type?.toLowerCase().includes("mobile"))?.number ||
                              ""

          if (name && primaryPhone) {
          contacts.push({
            id: Math.random().toString(),
              name,
              number: primaryPhone,
            hashed: Math.random().toString(16).substring(2, 10) + "...",
            include: true,
          })
        }
        }
        currentContact = null
        rawFields = {}
      } else if (currentContact) {
        // Parse VCF field
        const colonIndex = trimmedLine.indexOf(":")
        if (colonIndex === -1) continue

        const fieldPart = trimmedLine.substring(0, colonIndex)
        const value = trimmedLine.substring(colonIndex + 1).trim()

        // Store raw field
        rawFields[fieldPart] = value

        // Parse specific fields
        if (fieldPart.startsWith("FN")) {
          currentContact.fullName = value
        } else if (fieldPart.startsWith("N")) {
          const nameParts = value.split(";")
          currentContact.name = {
            family: nameParts[0] || "",
            given: nameParts[1] || "",
            additional: nameParts[2] || "",
            prefix: nameParts[3] || "",
            suffix: nameParts[4] || "",
          }
        } else if (fieldPart.startsWith("TEL")) {
          const typeMatch = fieldPart.match(/TYPE=([^:]+)/i)
          const types = typeMatch ? typeMatch[1].split(",").map(t => t.trim()) : []
          const type = types.length > 0 ? types.join(", ") : undefined
          
          // Clean phone number (remove formatting)
          const cleanNumber = value.replace(/[^\d+]/g, "")
          
          currentContact.phones.push({
            type,
            number: cleanNumber || value,
          })
        } else if (fieldPart.startsWith("EMAIL")) {
          const typeMatch = fieldPart.match(/TYPE=([^:]+)/i)
          const type = typeMatch ? typeMatch[1].trim() : undefined
          currentContact.emails.push({
            type,
            email: value,
          })
        } else if (fieldPart.startsWith("ORG")) {
          currentContact.organization = value
        } else if (fieldPart.startsWith("ADR")) {
          const addressParts = value.split(";")
          currentContact.address = addressParts.filter(Boolean).join(", ")
        } else if (fieldPart.startsWith("NOTE")) {
          currentContact.note = value
        } else if (fieldPart.startsWith("URL")) {
          currentContact.url = value
        }
      }
    }

    // Print all extracted data to terminal
    console.log("=".repeat(80))
    console.log("VCF FILE PARSED - EXTRACTED DATA")
    console.log("=".repeat(80))
    console.log(`\nTotal contacts found: ${parsedContacts.length}\n`)

    parsedContacts.forEach((contact, index) => {
      console.log(`\n--- Contact ${index + 1} ---`)
      console.log("Full Name:", contact.fullName || "N/A")
      
      if (contact.name) {
        console.log("Structured Name:")
        console.log("  Family:", contact.name.family || "N/A")
        console.log("  Given:", contact.name.given || "N/A")
        console.log("  Additional:", contact.name.additional || "N/A")
        console.log("  Prefix:", contact.name.prefix || "N/A")
        console.log("  Suffix:", contact.name.suffix || "N/A")
      }

      if (contact.phones.length > 0) {
        console.log("Phone Numbers:")
        contact.phones.forEach((phone, i) => {
          console.log(`  ${i + 1}. ${phone.number}${phone.type ? ` (${phone.type})` : ""}`)
        })
      }

      if (contact.emails.length > 0) {
        console.log("Email Addresses:")
        contact.emails.forEach((email, i) => {
          console.log(`  ${i + 1}. ${email.email}${email.type ? ` (${email.type})` : ""}`)
        })
      }

      if (contact.organization) {
        console.log("Organization:", contact.organization)
      }

      if (contact.address) {
        console.log("Address:", contact.address)
      }

      if (contact.note) {
        console.log("Note:", contact.note)
      }

      if (contact.url) {
        console.log("URL:", contact.url)
      }

      console.log("\nRaw VCF Fields:")
      Object.entries(contact.raw).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`)
      })
    })

    console.log("\n" + "=".repeat(80))
    console.log("SUMMARY")
    console.log("=".repeat(80))
    console.log(`Total contacts: ${parsedContacts.length}`)
    console.log(`Contacts with names: ${parsedContacts.filter(c => c.fullName || c.name).length}`)
    console.log(`Total phone numbers: ${parsedContacts.reduce((sum, c) => sum + c.phones.length, 0)}`)
    console.log(`Total email addresses: ${parsedContacts.reduce((sum, c) => sum + c.emails.length, 0)}`)
    console.log("=".repeat(80) + "\n")

    return { contacts, parsedContacts }
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      await processFile(file)
    }
  }

  const processFile = async (file: File) => {
    setError("")
    setIsProcessing(true)

    try {
      // Check file extension
      const fileName = file.name.toLowerCase()
      const isVCF = fileName.endsWith(".vcf") || fileName.endsWith(".vcard")
      
      if (!isVCF) {
        console.warn("⚠️  File extension is not .vcf or .vcard, but attempting to parse as VCF anyway")
      }

      // Log file information
      console.log("\n" + "=".repeat(80))
      console.log("FILE UPLOAD DETECTED")
      console.log("=".repeat(80))
      console.log("File Name:", file.name)
      console.log("File Size:", `${(file.size / 1024).toFixed(2)} KB`)
      console.log("File Type:", file.type || "Not specified")
      console.log("File Extension:", fileName.split(".").pop() || "None")
      console.log("Is VCF format:", isVCF ? "Yes" : "No (attempting anyway)")
      console.log("Last Modified:", new Date(file.lastModified).toLocaleString())
      console.log("=".repeat(80) + "\n")

      const content = await file.text()
      
      // Check if content looks like VCF
      const hasVCARD = content.includes("BEGIN:VCARD") && content.includes("END:VCARD")
      if (!hasVCARD) {
        console.warn("⚠️  File content doesn't contain BEGIN:VCARD/END:VCARD markers")
      }
      
      console.log("File content length:", content.length, "characters")
      console.log("Contains VCARD markers:", hasVCARD ? "Yes" : "No")
      console.log("First 200 characters of file:")
      console.log(content.substring(0, 200))
      console.log("\n")

      const { contacts, parsedContacts } = parseVCF(content)

      if (contacts.length === 0) {
        console.warn("⚠️  No valid contacts found in VCF file")
        setError("No valid contacts found in file")
      } else {
        console.log(`✅ Successfully parsed ${contacts.length} contact(s)`)
        onContactsAdded(contacts)
        // Also pass full parsed contacts if callback provided
        if (onParsedContactsAdded) {
          onParsedContactsAdded(parsedContacts)
        }
      }
    } catch (err) {
      console.error("❌ Error parsing VCF file:", err)
      if (err instanceof Error) {
        console.error("Error message:", err.message)
        console.error("Error stack:", err.stack)
      }
      setError("Failed to parse file. Please ensure it's a valid VCF file.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFile(e.target.files[0])
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      <Card
        className={`p-12 border-2 border-dashed transition ${
          isDragActive ? "border-primary bg-primary/5" : "border-border/50 bg-background"
        }`}
        style={{
          transform: isDragActive ? "scale(1.01)" : "scale(1)",
          transition: `transform ${animationConfig.duration.short}ms ${animationConfig.easing.standard}`,
        }}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center">
          <div className="mb-4">
            {isDragActive ? (
              <FileUp className="w-12 h-12 text-primary" />
            ) : (
              <Upload className="w-12 h-12 text-primary/60" />
            )}
          </div>

          <h3 className="text-lg font-semibold mb-2">
            {isDragActive ? "Drop your file here" : "Drop your VCF here, or click to browse"}
          </h3>
          <p className="text-foreground/60 text-sm mb-6">Supported formats: VCF</p>

          <Button 
            className="rounded-full" 
            disabled={isProcessing}
            onClick={handleButtonClick}
            type="button"
          >
              {isProcessing ? "Processing..." : "Choose File"}
            </Button>
            <input
            ref={fileInputRef}
              type="file"
            accept=".vcf,.vcard"
              onChange={handleFileInput}
              className="hidden"
              disabled={isProcessing}
            />

          <button className="text-sm text-primary mt-4 hover:underline">How to export VCF</button>
        </div>
      </Card>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded flex gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
    </div>
  )
}
