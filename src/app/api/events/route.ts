import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { rateLimiter, getClientIdentifier } from '@/lib/rate-limit'

export async function POST(request: Request) {
  try {
    // Rate limiting check
    const identifier = await getClientIdentifier(request)
    const isAllowed = await rateLimiter.check(identifier, 60, 60 * 1000) // 60 requests per minute
    
    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Maximum 60 requests per minute.' },
        { status: 429 }
      )
    }

    // Get API key from headers
    const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing API key' },
        { status: 401 }
      )
    }

    // Parse event data - support both single event and batch
    const body = await request.json()
    
    // Check if it's a batch request
    const isBatch = Array.isArray(body)
    const events = isBatch ? body : [body]
    
    // Validate batch size
    if (events.length === 0) {
      return NextResponse.json(
        { error: 'No events provided' },
        { status: 400 }
      )
    }
    
    if (events.length > 100) {
      return NextResponse.json(
        { error: 'Batch size cannot exceed 100 events' },
        { status: 400 }
      )
    }
    
    // Validate each event
    for (const event of events) {
      if (!event.event_type) {
        return NextResponse.json(
          { error: 'Missing event_type in one or more events' },
          { status: 400 }
        )
      }
    }

    // Initialize Supabase client
    const supabase = await createClient()

    // Find project by API key
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('api_key', apiKey)
      .maybeSingle()

    if (projectError) {
      console.error('Database error:', projectError)
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }

    if (!project) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }

    // Prepare batch insert data
    const insertData = events.map(event => ({
      project_id: project.id,
      event_type: event.event_type,
      event_data: event.event_data || {},
      user_id: event.user_id || null,
      session_id: event.session_id || null
    }))

    // Insert events (batch or single)
    const { data: insertedEvents, error: eventError } = await supabase
      .from('events')
      .insert(insertData)
      .select()

    if (eventError) {
      console.error('Event insert error:', eventError)
      console.error('Attempted insert data:', insertData)
      return NextResponse.json(
        { error: 'Failed to create events', details: eventError.message },
        { status: 500 }
      )
    }

    // Return appropriate response based on batch vs single
    if (isBatch) {
      return NextResponse.json({
        success: true,
        events_created: insertedEvents?.length || 0,
        event_ids: insertedEvents?.map(e => e.id) || []
      })
    } else {
      return NextResponse.json({
        success: true,
        event_id: insertedEvents?.[0]?.id
      })
    }

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// CORS headers for browser requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Max-Age': '86400',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key, Authorization',
    },
  })
}