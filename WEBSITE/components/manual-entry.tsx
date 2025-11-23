"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus } from "lucide-react"

interface Contact {
  id: string
  name: string
  number: string
  email?: string
  other?: string
  hashed?: string
  include: boolean
}

interface ManualEntryProps {
  onAddContact: (contact: Omit<Contact, "id" | "include">) => void
}

export function ManualEntry({ onAddContact }: ManualEntryProps) {
  const [name, setName] = useState("")
  const [number, setNumber] = useState("")
  const [email, setEmail] = useState("")
  const [other, setOther] = useState("")
  const [bulkText, setBulkText] = useState("")
  const [showBulk, setShowBulk] = useState(false)

  const handleAddContact = () => {
    if (name && number) {
      onAddContact({
        name,
        number,
        email: email.trim() || undefined,
        other: other.trim() || undefined,
        hashed: Math.random().toString(16).substring(2, 10) + "...",
      })
      setName("")
      setNumber("")
      setEmail("")
      setOther("")
    }
  }

  const handleBulkParse = () => {
    const lines = bulkText.split("\n")
    lines.forEach((line) => {
      const match = line.match(/^(.*?)\s+([+\d\-\s()]+)$/)
      if (match) {
        onAddContact({
          name: match[1].trim(),
          number: match[2].trim(),
          hashed: Math.random().toString(16).substring(2, 10) + "...",
        })
      }
    })
    setBulkText("")
    setShowBulk(false)
  }

  return (
    <div className="space-y-6">
      {!showBulk ? (
        <Card className="p-6 bg-background border border-border/50">
          <h3 className="font-semibold mb-4">Add Contact</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Name</label>
              <Input placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Phone Number</label>
              <Input placeholder="+1 555 555 1234" value={number} onChange={(e) => setNumber(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Email (Optional)</label>
              <Input 
                type="email"
                placeholder="john.doe@example.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Other (Optional)</label>
              <Input 
                placeholder="Company, Notes, etc." 
                value={other} 
                onChange={(e) => setOther(e.target.value)} 
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddContact} className="rounded-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Contact
              </Button>
              <Button variant="outline" onClick={() => setShowBulk(true)} className="rounded-full">
                Add Multiple
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-6 bg-background border border-border/50">
          <h3 className="font-semibold mb-4">Paste Multiple Contacts</h3>
          <div className="space-y-4">
            <Textarea
              placeholder="John Doe +1 555 555 1234&#10;Jane Smith +1 555 555 5678"
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              rows={6}
            />
            <div className="flex gap-2">
              <Button onClick={handleBulkParse} className="rounded-full">
                Parse & Add
              </Button>
              <Button variant="outline" onClick={() => setShowBulk(false)} className="rounded-full">
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
