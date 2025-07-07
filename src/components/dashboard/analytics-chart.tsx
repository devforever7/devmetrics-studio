"use client"

import { Line, LineChart, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"
import { useTheme } from "next-themes"
import { ChartConfig, ChartContainer } from "@/components/ui/chart"
import { useDashboardData } from "@/lib/hooks/use-dashboard-data"


const chartConfig = {
  users: {
    label: "Active Users",
    color: "var(--chart-1)",
  },
  events: {
    label: "Events", 
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

const getEmptyData = () => {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    return {
      name: date.toLocaleDateString('en-US', { weekday: 'short' }),
      users: 0,
      events: 0,
      date: date.toISOString().split('T')[0]
    }
  })
}

export function AnalyticsChart() {
  const { stats, loading } = useDashboardData()
  const { theme } = useTheme()

  const data = stats?.last_7_days || getEmptyData()

  if (loading) {
    return (
      <div className="w-full h-[350px] flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading analytics...</div>
      </div>
    )
  }

  return (
    <div className="@container w-full">
      <ChartContainer config={chartConfig} className="h-[350px] @[400px]:h-[300px] @[600px]:h-[350px] w-full">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.3} />
          <XAxis 
            dataKey="name" 
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb', strokeWidth: 1 }}
            tick={{ fill: '#000000', fontSize: 10, fontWeight: 600 }}
            tickMargin={8}
          />
          <YAxis 
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb', strokeWidth: 1 }}
            tick={{ fill: '#000000', fontSize: 10, fontWeight: 600 }}
            tickMargin={8}
            domain={[0, 'dataMax + 2']}
            width={35}
          />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px'
          }}
          cursor={{ 
            stroke: theme === 'dark' ? '#ffffff' : '#374151', 
            strokeWidth: 2,
            strokeDasharray: '4 4'
          }}
        />
        <Line
          type="monotone"
          dataKey="users"
          stroke={theme === 'dark' ? '#fbbf24' : 'var(--chart-1)'}
          strokeWidth={3}
          dot={{ 
            fill: theme === 'dark' ? '#fbbf24' : 'var(--chart-1)', 
            stroke: theme === 'dark' ? '#fbbf24' : 'var(--chart-1)', 
            strokeWidth: 2, 
            r: 5 
          }}
          name={chartConfig.users.label}
        />
        <Line
          type="monotone"
          dataKey="events"
          stroke={theme === 'dark' ? '#34d399' : 'var(--chart-2)'}
          strokeWidth={3}
          dot={{ 
            fill: theme === 'dark' ? '#34d399' : 'var(--chart-2)', 
            stroke: theme === 'dark' ? '#34d399' : 'var(--chart-2)', 
            strokeWidth: 2, 
            r: 5 
          }}
          name={chartConfig.events.label}
        />
      </LineChart>
    </ChartContainer>
    </div>
  )
}