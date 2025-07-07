import { POST, OPTIONS } from '../route'
import { createClient } from '@/lib/supabase/server'
import { rateLimiter } from '@/lib/rate-limit'

// Mock the Supabase client
jest.mock('@/lib/supabase/server')

// Mock the rate limiter
jest.mock('@/lib/rate-limit', () => ({
  rateLimiter: {
    check: jest.fn().mockResolvedValue(true),
  },
  getClientIdentifier: jest.fn().mockResolvedValue('test-identifier'),
}))

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: class NextResponse extends Response {
    constructor(body?: BodyInit | null, init?: ResponseInit) {
      super(body, init)
    }
    static json(data: any, init?: ResponseInit) {
      return new Response(JSON.stringify(data), {
        ...init,
        headers: {
          'content-type': 'application/json',
          ...(init?.headers || {}),
        },
      })
    }
  },
}))

describe('POST /api/events', () => {
  const mockSupabase = {
    from: jest.fn(),
  }

  const mockFrom = {
    select: jest.fn(),
    insert: jest.fn(),
  }

  const mockSelect = {
    eq: jest.fn(),
    maybeSingle: jest.fn(),
    single: jest.fn(),
  }

  const mockInsert = {
    select: jest.fn(),
  }

  const mockInsertSelect = {
    single: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
    mockSupabase.from.mockReturnValue(mockFrom)
    mockFrom.select.mockReturnValue(mockSelect)
    mockFrom.insert.mockReturnValue(mockInsert)
    mockInsert.select.mockReturnValue(mockInsertSelect)
    mockSelect.eq.mockReturnValue(mockSelect)
    // Reset rate limiter to allow requests by default
    ;(rateLimiter.check as jest.Mock).mockResolvedValue(true)
  })

  it('should return 401 if API key is missing', async () => {
    const request = new Request('http://localhost:3000/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ event_type: 'test' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Missing API key')
  })

  it('should return 400 if event_type is missing', async () => {
    const request = new Request('http://localhost:3000/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'test-api-key',
      },
      body: JSON.stringify({}),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Missing event_type in one or more events')
  })

  it('should return 401 if API key is invalid', async () => {
    mockSelect.maybeSingle.mockResolvedValue({ data: null, error: null })

    const request = new Request('http://localhost:3000/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'invalid-api-key',
      },
      body: JSON.stringify({ event_type: 'test_event' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Invalid API key')
    expect(mockSupabase.from).toHaveBeenCalledWith('projects')
  })

  it('should create event successfully with valid API key', async () => {
    const mockProject = { id: 'project-123' }
    const mockEvent = { id: 'event-456' }

    mockSelect.maybeSingle.mockResolvedValue({ data: mockProject, error: null })
    mockInsert.select.mockResolvedValue({ data: [mockEvent], error: null })

    const request = new Request('http://localhost:3000/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'valid-api-key',
      },
      body: JSON.stringify({
        event_type: 'page_view',
        event_data: { url: '/home' },
        user_id: 'user-123',
        session_id: 'session-456',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.event_id).toBe('event-456')
    expect(mockFrom.insert).toHaveBeenCalledWith([{
      project_id: 'project-123',
      event_type: 'page_view',
      event_data: { url: '/home' },
      user_id: 'user-123',
      session_id: 'session-456',
    }])
  })

  it('should handle database errors gracefully', async () => {
    mockSelect.maybeSingle.mockResolvedValue({
      data: null,
      error: { message: 'Database connection failed' },
    })

    const request = new Request('http://localhost:3000/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'test-api-key',
      },
      body: JSON.stringify({ event_type: 'test_event' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Database error')
  })

  it('should accept API key from Authorization header', async () => {
    const mockProject = { id: 'project-123' }
    const mockEvent = { id: 'event-789' }

    mockSelect.maybeSingle.mockResolvedValue({ data: mockProject, error: null })
    mockInsert.select.mockResolvedValue({ data: [mockEvent], error: null })

    const request = new Request('http://localhost:3000/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid-api-key',
      },
      body: JSON.stringify({ event_type: 'test_event' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  // Rate limiting tests
  it('should return 429 when rate limit is exceeded', async () => {
    ;(rateLimiter.check as jest.Mock).mockResolvedValue(false)

    const request = new Request('http://localhost:3000/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'test-api-key',
      },
      body: JSON.stringify({ event_type: 'test_event' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(429)
    expect(data.error).toBe('Rate limit exceeded. Maximum 60 requests per minute.')
  })

  // Batch functionality tests
  it('should create multiple events in batch', async () => {
    const mockProject = { id: 'project-123' }
    const mockEvents = [
      { id: 'event-1' },
      { id: 'event-2' },
      { id: 'event-3' }
    ]

    mockSelect.maybeSingle.mockResolvedValue({ data: mockProject, error: null })
    mockInsert.select.mockResolvedValue({ data: mockEvents, error: null })

    const batchEvents = [
      { event_type: 'page_view', event_data: { url: '/home' } },
      { event_type: 'button_click', event_data: { button: 'signup' } },
      { event_type: 'form_submit', event_data: { form: 'newsletter' } }
    ]

    const request = new Request('http://localhost:3000/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'valid-api-key',
      },
      body: JSON.stringify(batchEvents),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.events_created).toBe(3)
    expect(data.event_ids).toEqual(['event-1', 'event-2', 'event-3'])
    expect(mockFrom.insert).toHaveBeenCalledWith([
      { project_id: 'project-123', event_type: 'page_view', event_data: { url: '/home' }, user_id: null, session_id: null },
      { project_id: 'project-123', event_type: 'button_click', event_data: { button: 'signup' }, user_id: null, session_id: null },
      { project_id: 'project-123', event_type: 'form_submit', event_data: { form: 'newsletter' }, user_id: null, session_id: null }
    ])
  })

  it('should return 400 if batch size exceeds limit', async () => {
    const largeEvents = Array.from({ length: 101 }, (_, i) => ({
      event_type: `event_${i}`,
      event_data: {}
    }))

    const request = new Request('http://localhost:3000/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'test-api-key',
      },
      body: JSON.stringify(largeEvents),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Batch size cannot exceed 100 events')
  })

  it('should return 400 if one event in batch is missing event_type', async () => {
    const batchEvents = [
      { event_type: 'page_view', event_data: { url: '/home' } },
      { event_data: { button: 'signup' } }, // Missing event_type
      { event_type: 'form_submit', event_data: { form: 'newsletter' } }
    ]

    const request = new Request('http://localhost:3000/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'test-api-key',
      },
      body: JSON.stringify(batchEvents),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Missing event_type in one or more events')
  })

  it('should handle empty batch array', async () => {
    const request = new Request('http://localhost:3000/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'test-api-key',
      },
      body: JSON.stringify([]),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('No events provided')
  })
})

describe('OPTIONS /api/events', () => {
  it('should return CORS headers', async () => {
    const response = await OPTIONS()

    expect(response.status).toBe(200)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
    expect(response.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS')
    expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type, x-api-key, Authorization')
    expect(response.headers.get('Access-Control-Max-Age')).toBe('86400')
  })
})