"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { 
  Users, 
  Eye, 
  MousePointer
} from "lucide-react"
import { AnalyticsChart } from "@/components/dashboard/analytics-chart"
import { RecentEvents } from "@/components/dashboard/recent-events"
import { useDashboardData } from "@/lib/hooks/use-dashboard-data"

export default function DashboardPage() {
  const { stats, loading } = useDashboardData()

  if (loading) {
    return (
      <TooltipProvider>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Loading your analytics...</p>
          </div>
        </div>
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor your application&apos;s performance in real-time
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Tooltip>
              <TooltipTrigger asChild>
                <Users className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Total unique users who have visited your application</p>
              </TooltipContent>
            </Tooltip>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.stats?.total_users?.toLocaleString() || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.stats?.total_events?.toLocaleString() || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events Today</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.stats?.events_today?.toLocaleString() || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>User Activity</CardTitle>
            <CardDescription>
              Your user engagement over the last 7 days
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <AnalyticsChart />
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Events</CardTitle>
            <CardDescription>
              Latest user interactions with your app
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecentEvents />
          </CardContent>
        </Card>
      </div>

      </div>
    </TooltipProvider>
  )
}