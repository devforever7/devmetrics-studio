import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface DashboardStats {
  stats: {
    total_users: number
    total_events: number
    events_today: number
  }
  last_7_days: Array<{
    name: string
    users: number
    events: number
    date: string
  }>
  event_type_counts: {
    page_views: number
    user_actions: number
    errors: number
  }
  recent_events: Array<{
    id: string
    event_type: string
    event_data: any
    user_id: string | null
    session_id: string | null
    created_at: string
    project?: {
      name: string
    }
  }>
}

let globalStats: DashboardStats | null = null
let globalLoading = false
let globalError: Error | null = null
let subscribers = new Set<() => void>()
let lastFetchTime = 0
let debounceTimer: NodeJS.Timeout | null = null

const CACHE_DURATION = 30000 // 30 seconds
const DEBOUNCE_DELAY = 500 // 500ms

const supabase = createClient()

async function fetchDashboardStats() {

  if (globalLoading) {
    return globalStats
  }
  
  const now = Date.now()
  const cacheAge = now - lastFetchTime

  if (globalStats && cacheAge < CACHE_DURATION) {
    return globalStats
  }

  try {
    globalLoading = true
    globalError = null
    notifySubscribers() // Notify that loading started
    
    const { data, error } = await supabase.rpc('get_dashboard_stats')
    
    if (error) {
      console.error('Dashboard stats error:', error)
      throw error
    }
    
    globalStats = data
    lastFetchTime = now
    globalLoading = false
    notifySubscribers()
    
    return data
  } catch (error) {
    console.error('fetchDashboardStats error:', error)
    globalError = error as Error
    globalLoading = false
    notifySubscribers()
    throw error
  }
}

function notifySubscribers() {
  subscribers.forEach(callback => callback())
}

function debouncedRefresh() {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  
  debounceTimer = setTimeout(() => {
    fetchDashboardStats().catch((error) => {
      console.error('fetchDashboardStats failed in debounce timer:', error)
    })
  }, DEBOUNCE_DELAY)
}

// Single real-time subscription for all components
let realtimeSubscription: any = null
let subscriberCount = 0

function setupRealtimeSubscription() {
  if (realtimeSubscription) {
    return
  }
  
  realtimeSubscription = supabase
    .channel('global-dashboard-events')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'events'
      },
      () => {
        // Clear cache so fresh data gets fetched when debounce timer fires
        globalStats = null
        lastFetchTime = 0
        debouncedRefresh()
      }
    )
    .subscribe()
}

function cleanupRealtimeSubscription() {
  if (realtimeSubscription && subscriberCount === 0) {
    supabase.removeChannel(realtimeSubscription)
    realtimeSubscription = null
  }
}

export function useDashboardData() {
  const [stats, setStats] = useState<DashboardStats | null>(globalStats)
  const [loading, setLoading] = useState(globalStats ? false : true)
  const [error, setError] = useState<Error | null>(globalError)
  const subscriberRef = useRef<(() => void) | undefined>(undefined)

  useEffect(() => {
    subscriberCount++
    setupRealtimeSubscription()

    // Create subscriber callback
    subscriberRef.current = () => {
      setStats(globalStats)
      setLoading(globalLoading)
      setError(globalError)
    }

    subscribers.add(subscriberRef.current)

    // Initial fetch if no data
    if (!globalStats && !globalLoading) {
      fetchDashboardStats().catch(() => {
        // Error already handled in fetchDashboardStats
      })
    } else {
      setStats(globalStats)
      setLoading(globalLoading)
      setError(globalError)
    }

    return () => {
      subscriberCount--
      if (subscriberRef.current) {
        subscribers.delete(subscriberRef.current)
      }
      cleanupRealtimeSubscription()
    }
  }, [])

  const refresh = async () => {
    try {
      setLoading(true)
      await fetchDashboardStats()
    } catch (error) {
      // Error already handled in fetchDashboardStats
    }
  }

  return {
    stats,
    loading,
    error,
    refresh
  }
}

// Utility to invalidate cache when needed
export function invalidateDashboardCache() {
  globalStats = null
  lastFetchTime = 0
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
}