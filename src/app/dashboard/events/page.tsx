"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Zap, 
  MousePointer, 
  Eye, 
  Users,
  Clock,
  Download,
  FileDown,
  FileJson
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useDashboardData } from "@/lib/hooks/use-dashboard-data"

interface Event {
  id: string
  event_type: string
  event_data: any
  user_id: string | null
  session_id: string | null
  created_at: string
  project_id: string | null
  project?: {
    name: string
  }
}


const eventTypeIcons = {
  page_view: Eye,
  click: MousePointer,
  form_submit: Zap,
  error: Zap,
  user_action: Users
}

const eventTypeBadges = {
  page_view: "secondary",
  click: "outline",
  form_submit: "secondary", 
  error: "destructive",
  user_action: "secondary"
} as const

export default function EventsPage() {
  const { stats: dashboardStats, loading } = useDashboardData()
  const [exporting, setExporting] = useState(false)
  const supabase = createClient()

  const recentEvents = dashboardStats?.recent_events || []
  const stats = {
    totalEvents: dashboardStats?.stats?.total_events || 0,
    pageViews: dashboardStats?.event_type_counts?.page_views || 0,
    userActions: dashboardStats?.event_type_counts?.user_actions || 0,
    errors: dashboardStats?.event_type_counts?.errors || 0
  }

  const fetchEventsForExport = async () => {
    // Use the optimized export function (limited to 10,000 events)
    const { data: allEvents, error } = await supabase
      .rpc('get_events_for_export')

    if (error) throw error
    return allEvents || []
  }

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const formatCSV = (events: Event[]) => {
    const headers = ['ID', 'Type', 'User ID', 'Session ID', 'Data', 'Created At']
    return [
      headers.join(','),
      ...events.map(event => [
        event.id,
        event.event_type,
        event.user_id || 'anonymous',
        event.session_id || 'N/A',
        JSON.stringify(event.event_data || {}),
        new Date(event.created_at).toLocaleString()
      ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    ].join('\n')
  }

  const formatJSON = (events: Event[]) => {
    const exportData = {
      exported_at: new Date().toISOString(),
      total_events: events.length,
      events
    }
    return JSON.stringify(exportData, null, 2)
  }

  const exportEvents = async (format: 'csv' | 'json') => {
    setExporting(true)
    try {
      const events = await fetchEventsForExport()
      const dateString = new Date().toISOString().split('T')[0]
      
      if (format === 'csv') {
        const content = formatCSV(events)
        downloadFile(content, `events-export-${dateString}.csv`, 'text/csv')
      } else {
        const content = formatJSON(events)
        downloadFile(content, `events-export-${dateString}.json`, 'application/json')
      }

      const exportedCount = events.length
      const limitMessage = exportedCount >= 10000 ? ' (limited to 10,000 most recent)' : ''
      toast.success(`${exportedCount} events exported successfully${limitMessage}`)
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export events')
    } finally {
      setExporting(false)
    }
  }

  const exportToCSV = () => exportEvents('csv')
  const exportToJSON = () => exportEvents('json')


  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Events</h1>
          <p className="text-muted-foreground">Loading event data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Events</h1>
          <p className="text-muted-foreground">
            Track and analyze user interactions in real-time
          </p>
        </div>
        <div className="flex items-center gap-2 sm:flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={exporting} className="w-full sm:w-auto">
                <Download className="mr-2 h-4 w-4" />
                {exporting ? 'Exporting...' : 'Export'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportToCSV}>
                <FileDown className="mr-2 h-4 w-4" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToJSON}>
                <FileJson className="mr-2 h-4 w-4" />
                Export as JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEvents.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              All events across projects
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Page Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pageViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Page view events only
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Actions</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.userActions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Clicks and form submits
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.errors.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Error events tracked
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Events Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
          <CardDescription>
            Latest user interactions and system events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Metadata</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentEvents.map((event: any) => {
                const IconComponent = eventTypeIcons[event.event_type as keyof typeof eventTypeIcons] || Zap
                const badgeVariant = eventTypeBadges[event.event_type as keyof typeof eventTypeBadges] || "secondary"
                
                return (
                  <TableRow key={event.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4" />
                        <Badge variant={badgeVariant}>
                          {event.event_type.replace('_', ' ')}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {event.user_id || 'anonymous'}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {event.event_data?.page && `Page: ${event.event_data.page}`}
                        {event.event_data?.element && `Element: ${event.event_data.element}`}
                        {event.event_data?.url && `URL: ${event.event_data.url}`}
                        {event.event_data?.error && `Error: ${event.event_data.error}`}
                        {!event.event_data?.page && !event.event_data?.element && !event.event_data?.url && !event.event_data?.error && 'Event data'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {new Date(event.created_at).toLocaleString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-muted-foreground space-y-1">
                        {event.project && (
                          <div>Project: {event.project.name}</div>
                        )}
                        {event.event_data && Object.keys(event.event_data).length > 0 && (
                          <div className="max-w-32 truncate">
                            {JSON.stringify(event.event_data).slice(0, 30)}...
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}