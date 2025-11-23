"use client"

import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { X } from "lucide-react"

interface Contact {
  id: string
  name: string
  number: string
  email?: string
  other?: string
  hashed?: string
  include: boolean
}

interface ContactPreviewProps {
  contacts: Contact[]
  onToggle: (id: string) => void
  onRemove: (id: string) => void
}

export function ContactPreview({ contacts, onToggle, onRemove }: ContactPreviewProps) {
  return (
    <Card className="p-6 bg-background border border-border/50">
      <h3 className="font-semibold mb-4">
        Contacts Preview ({contacts.filter((c) => c.include).length} of {contacts.length})
      </h3>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {contacts.map((contact, idx) => (
          <div
            key={contact.id}
            className="flex items-center gap-3 p-3 bg-secondary/30 rounded hover:bg-secondary/50 transition"
            style={{
              opacity: 0,
              animation: `slideIn 300ms ease-out ${idx * 50}ms forwards`,
            }}
          >
            <Checkbox checked={contact.include} onCheckedChange={() => onToggle(contact.id)} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{contact.name}</p>
              <div className="text-xs text-foreground/60 space-y-0.5">
                <p className="truncate">{contact.number}</p>
                {contact.email && (
                  <p className="truncate text-foreground/50">📧 {contact.email}</p>
                )}
                {contact.other && (
                  <p className="truncate text-foreground/50">📝 {contact.other}</p>
                )}
                {contact.hashed && (
                  <p className="truncate text-foreground/40">🔐 {contact.hashed}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => onRemove(contact.id)}
              className="text-foreground/40 hover:text-destructive transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </Card>
  )
}
