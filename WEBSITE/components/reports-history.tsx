"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ExternalLink } from "lucide-react"
import { useState } from "react"

interface Report {
  id: string
  number: string
  category: string[]
  bond: number
  status: "pending" | "verified" | "challenged"
  timestamp: Date
  reports: number
}

interface ReportsHistoryProps {
  reports: Report[]
}

export function ReportsHistory({ reports }: ReportsHistoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "bg-accent/10 text-accent border border-accent/20"
      case "challenged":
        return "bg-destructive/10 text-destructive border border-destructive/20"
      case "pending":
        return "bg-yellow-500/10 text-yellow-600 border border-yellow-500/20"
      default:
        return ""
    }
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / 3600000)
    const minutes = Math.floor(diff / 60000)

    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="sticky top-24 space-y-4">
      <Card className="p-6 bg-background border border-border/50">
        <h3 className="font-semibold mb-4">Recent Reports</h3>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {reports.length === 0 ? (
            <p className="text-sm text-foreground/60">No reports yet</p>
          ) : (
            reports.map((report) => (
              <div
                key={report.id}
                className="border border-border/30 rounded hover:border-primary/30 transition cursor-pointer"
              >
                <button
                  onClick={() => setExpandedId(expandedId === report.id ? null : report.id)}
                  className="w-full p-3 flex items-center justify-between"
                >
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-mono text-xs mb-1">{report.number}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {report.category.map((cat) => (
                        <Badge key={cat} variant="outline" className="text-xs">
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 flex-shrink-0 ml-2 transition ${expandedId === report.id ? "rotate-180" : ""}`}
                  />
                </button>

                {expandedId === report.id && (
                  <div className="p-3 border-t border-border/30 bg-secondary/20 text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-foreground/60">Bond:</span>
                      <span>{report.bond.toFixed(2)} tokens</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground/60">Reports:</span>
                      <span>{report.reports}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-foreground/60">Status:</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(report.status)}`}>
                        {report.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground/60">Reported:</span>
                      <span>{formatDate(report.timestamp)}</span>
                    </div>
                    <a href="#" className="flex items-center gap-2 text-primary hover:underline pt-2">
                      View on-chain
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Card>

      <Card className="p-4 bg-accent/5 border border-accent/20">
        <p className="text-xs leading-relaxed">
          <strong>Challenge Window:</strong> Reports are challengeable for 7 days. After verification, they become
          permanent records.
        </p>
      </Card>
    </div>
  )
}
