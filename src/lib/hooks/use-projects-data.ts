import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ProjectData {
  id: string
  name: string
  api_key: string
  created_at: string
  event_count?: number
}

let globalProjects: ProjectData[] | null = null
let globalLoading = false
let globalError: Error | null = null
let subscribers = new Set<() => void>()
let lastFetchTime = 0
let debounceTimer: NodeJS.Timeout | null = null

const CACHE_DURATION = 30000 // 30 seconds
const DEBOUNCE_DELAY = 500 // 500ms

const supabase = createClient()

async function fetchProjects() {
  if (globalLoading) return globalProjects
  
  const now = Date.now()
  if (globalProjects && (now - lastFetchTime) < CACHE_DURATION) {
    return globalProjects
  }

  try {
    globalLoading = true
    globalError = null
    notifySubscribers() // Notify that loading started
    
    const { data, error } = await supabase.rpc('get_user_projects')
    
    if (error) throw error
    
    globalProjects = data || []
    lastFetchTime = now
    globalLoading = false
    notifySubscribers()
    
    return data
  } catch (error) {
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
    fetchProjects().catch(console.error)
  }, DEBOUNCE_DELAY)
}

// Single real-time subscription for all components
let realtimeSubscription: any = null
let subscriberCount = 0

function setupRealtimeSubscription() {
  if (realtimeSubscription) return
  
  realtimeSubscription = supabase
    .channel('global-projects-events')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'events'
      },
      (payload) => {
        console.log('Real-time event received:', payload.eventType, 'on table:', payload.table)
        // Clear cache so fresh data gets fetched when debounce timer fires
        globalProjects = null
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

export function useProjectsData() {
  const [projects, setProjects] = useState<ProjectData[]>(globalProjects || [])
  const [loading, setLoading] = useState(globalProjects ? false : true)
  const [error, setError] = useState<Error | null>(globalError)
  const subscriberRef = useRef<(() => void) | undefined>(undefined)

  useEffect(() => {
    subscriberCount++
    setupRealtimeSubscription()

    // Create subscriber callback
    subscriberRef.current = () => {
      setProjects(globalProjects || [])
      setLoading(globalLoading)
      setError(globalError)
    }

    subscribers.add(subscriberRef.current)

    // Initial fetch if no data
    if (!globalProjects && !globalLoading) {
      setLoading(true)
      fetchProjects().catch(() => {
        // Error already handled in fetchProjects
      })
    } else {
      setProjects(globalProjects || [])
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
      await fetchProjects()
    } catch (error) {
      // Error already handled in fetchProjects
    }
  }

  return {
    projects,
    loading,
    error,
    refresh
  }
}

// Utility to invalidate cache when needed
export function invalidateProjectsCache() {
  globalProjects = null
  lastFetchTime = 0
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
}