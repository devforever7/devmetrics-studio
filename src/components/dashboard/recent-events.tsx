"use client"

import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useDashboardData } from "@/lib/hooks/use-dashboard-data"

const eventColors: Record<string, string> = {
  page_view: "bg-blue-100 text-blue-800",
  button_click: "bg-green-100 text-green-800", 
  form_submit: "bg-purple-100 text-purple-800",
  feature_used: "bg-orange-100 text-orange-800",
  error: "bg-red-100 text-red-800",
  default: "bg-gray-100 text-gray-800"
}

function getRelativeTime(dateString: string) {
  const now = new Date()
  const date = new Date(dateString)
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return `${diffInSeconds}s ago`
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  return `${Math.floor(diffInSeconds / 86400)}d ago`
}

export function RecentEvents() {
  const { stats, loading } = useDashboardData()
  const events = stats?.recent_events || []

  if (loading) {
    return (
      <div className="@container w-full">
        <ScrollArea className="h-[350px] @[400px]:h-[300px] @[600px]:h-[350px] pr-2 @[400px]:pr-4">
          <div className="space-y-3 @[400px]:space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-1 flex-1">
                  <div className="h-4 @[400px]:h-6 bg-muted rounded animate-pulse" />
                  <div className="h-3 @[400px]:h-4 bg-muted rounded animate-pulse w-24 @[400px]:w-32" />
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="@container w-full">
        <ScrollArea className="h-[350px] @[400px]:h-[300px] @[600px]:h-[350px] pr-2 @[400px]:pr-4">
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <p className="text-sm">No events yet</p>
              <p className="text-xs hidden @[400px]:block">Events will appear here when your projects receive them</p>
            </div>
          </div>
        </ScrollArea>
      </div>
    )
  }

  return (
    <div className="@container w-full h-full">
      <ScrollArea className="h-[350px] @[400px]:h-[300px] @[600px]:h-[350px] pr-2 @[400px]:pr-4">
        <div className="space-y-2 @[400px]:space-y-3 pb-4">
          {events.map((event: any) => (
            <div key={event.id} className="flex items-start @[400px]:items-center justify-between py-2 @[400px]:py-3 border-b border-border/30 last:border-b-0">
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-1 @[400px]:gap-2 flex-wrap">
                  <Badge 
                    variant="secondary" 
                    className={`text-xs @[400px]:text-sm ${eventColors[event.event_type] || eventColors.default}`}
                  >
                    {event.event_type}
                  </Badge>
                  <span className="text-xs @[400px]:text-sm font-medium truncate">
                    {event.event_data?.page || event.event_data?.button || 'N/A'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className="@[400px]:inline hidden">{event.user_id || 'Anonymous'} • </span>
                  {getRelativeTime(event.created_at)}
                </p>
              </div>
            </div>
          ))}
          {events.length < 8 && (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <p className="text-xs">More events will appear here as they occur</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}