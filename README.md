# DevMetrics Studio

https://devmetrics-studio.vercel.app/

A modern event tracking and analytics platform built with **Next.js**, **React**, **TypeScript**, and **Supabase**. This full-stack application enables users to create projects and track user events in real-time, providing comprehensive analytics through a beautiful dashboard interface.

**Tech Stack:**
- **Frontend**: Next.js 15 with React and TypeScript
- **Backend**: Supabase PostgreSQL database with real-time subscriptions
- **API**: Next.js API routes for event ingestion
- **Real-time**: Supabase real-time subscriptions for live dashboard updates
- **Authentication**: Supabase Auth with email and GitHub OAuth
- **UI Components**: Responsive shadcn/ui components with Tailwind CSS
- **Testing & CI/CD**: Unit tests with Jest, automated testing in GitHub Actions

Users can create projects, obtain API keys, and track various user events (page views, button clicks, form submissions, etc.) in their applications. The dashboard provides real-time analytics, event export capabilities, and detailed project management.

## Getting Started

### Local Development Setup

1. **Clone and install dependencies**
   ```bash
   git clone <your-repo-url>
   cd devmetrics-studio
   npm install
   ```

2. **Login to Supabase**
   ```bash
   # Login with your access token (get from https://supabase.com/dashboard/account/tokens)
   npx supabase login --token <your_access_token>
   ```

3. **Link to your remote Supabase project**
   ```bash
   # Link to your remote project (replace with your project reference)
   npx supabase link --project-ref your_project_ref
   ```

   **Finding your project reference:**
   - In your Supabase dashboard URL: `https://supabase.com/dashboard/project/[PROJECT_REF]`

4. **Initialize Supabase locally (first time creates config.toml file)**
   ```bash
   npx supabase init
   ```

5. **Start local services (first time downloads Docker images)**
   ```bash
   # Start Supabase locally (requires Docker)
   npx supabase start
   
   # Start development server
   npm run dev
   ```

6. **Verify setup**
   ```bash
   npx supabase status
   ```
   
   This should show services running on:
   - Studio URL: http://127.0.0.1:54323

7. **Stop services when done**
   ```bash
   npx supabase stop
   ```

8. **Local user creation restriction**

   **NOTE:** These restrictions do not apply on https://devmetrics-studio.vercel.app/

   Currently, your local user can only be created by email signup, not Github OAuth. Email confirmation will not be sent out.

   In order to create projects and send events locally:

   - Go to the Supabase Studio Auth Users page: http://127.0.0.1:54323/project/default/auth/users
   - Get your user ID and copy it
   - Go to the local database editor: http://127.0.0.1:54323/project/default/editor/18171?schema=public
   - Manually insert your user record into the `users` table


### Commands

- `npm run dev` - Start development server
- `npx supabase start` - Start Supabase services locally
- `npx supabase stop` - Stop Supabase services
- `npx supabase migration up` - Run database migrations locally
- `npx supabase db push` - Push database changes to remote
- `npx supabase status` - Check local services status

### Environment Variables

**Local Development:**
- `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0`

**Production:**
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key

## Deployment

**Vercel + GitHub Actions:**
- Push to `main` branch triggers auto-deployment
- Environment variables set in Vercel dashboard and GitHub Actions secrets
- Connected to production Supabase project

## MCP Configuration

The project uses MCP (Model Context Protocol) for enhanced development:
- **Supabase MCP**: Database queries and schema access
- **Context7 MCP**: Enhanced context management
- Configuration in `.mcp.json`

## Development Tools

### Claude Code Integration
Project context and development guidelines are maintained in `CLAUDE.md` to help Claude Code understand the codebase structure, conventions, and development patterns.

### UI Components
The project uses **shadcn/ui** component library. Base components have been pre-installed in `src/components/ui/` and can be extended with:
```bash
npx shadcn-ui@latest add [component-name]
```

## Architecture & Performance

### Frontend Data Management
- **Centralized Data Hooks**: All frontend components subscribe to `useDashboardData()` and `useProjectsData()` hooks instead of making direct database calls
- **Request Deduplication**: Multiple components share the same data source, preventing duplicate API calls
- **Real-time Updates**: Components automatically receive updates when database changes occur via Supabase real-time subscriptions
- **Intelligent Caching**: 30-second cache with real-time invalidation ensures fresh data while minimizing database load
- **Debounced Refreshes**: 500ms debouncing prevents database spam during rapid-fire events

### Database Optimization
- **Optimized RPC Functions**: Custom PostgreSQL functions (`get_dashboard_stats`, `get_user_projects`, `get_events_for_export`) combine multiple queries into single database calls
- **Reduced Table Scans**: Database functions use proper indexes and optimized SELECT statements to minimize performance impact
- **Abstracted Logic**: Complex data aggregation logic is handled server-side in PostgreSQL, reducing client-side processing

### Security & Rate Limiting
- **API Rate Limiting**: Events API endpoint implements rate limiting (60 requests/minute per API key) with in-memory tracking
- **Row Level Security (RLS)**: Enabled on `projects` and `users` tables, filtering data based on authenticated user ID from JWT tokens
- **API Key Authentication**: Events endpoint validates API keys against project ownership before accepting data
- **Batch Processing**: Supports up to 100 events per batch request for efficient data ingestion

### Real-time Performance
- **Single Subscription Per Tab**: Each browser tab maintains one real-time subscription instead of multiple per component
- **Cache Invalidation**: Real-time events automatically invalidate cached data, ensuring UI updates reflect latest database state
- **Cross-tab Independence**: Each browser tab operates independently with its own data management and real-time connections

## Usage

### Create a Project
1. Sign up and log in to the dashboard
2. Create a new project to get an API key
3. Use the API key to send events

### Send Events

#### Single Event
Send HTTP requests to track individual events:

```bash
# Production
curl -X POST https://your-app.vercel.app/api/events \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-project-api-key" \
  -d '{
    "event_type": "page_view",
    "event_data": {"page": "/landing"},
    "user_id": "user_123",
    "session_id": "session_456"
  }'

# Local Development  
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-project-api-key" \
  -d '{
    "event_type": "page_view",
    "event_data": {"page": "/landing"},
    "user_id": "user_123",
    "session_id": "session_456"
  }'
```

#### Batch Events (Recommended)
Send multiple events in a single request for better performance:

```bash
curl -X POST https://your-app.vercel.app/api/events \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-project-api-key" \
  -d '[
    {
      "event_type": "page_view",
      "event_data": {"page": "/landing"},
      "user_id": "user_123",
      "session_id": "session_456"
    },
    {
      "event_type": "button_click",
      "event_data": {"button": "cta_hero"},
      "user_id": "user_123",
      "session_id": "session_456"
    },
    {
      "event_type": "form_submit",
      "event_data": {"form": "newsletter"},
      "user_id": "user_456",
      "session_id": "session_789"
    }
  ]'
```

**Batch Limits:**
- Maximum 100 events per batch
- Rate limit: 60 requests per minute per API key

### JavaScript Tracking

#### Single Event
```javascript
function trackEvent(eventType, eventData, userId = null, sessionId = null) {
  fetch('/api/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'your-project-api-key'
    },
    body: JSON.stringify({
      event_type: eventType,
      event_data: eventData,
      user_id: userId,
      session_id: sessionId
    })
  })
}
```

#### Batch Tracking (Recommended)
```javascript
class EventTracker {
  constructor(apiKey) {
    this.apiKey = apiKey
    this.eventQueue = []
    this.batchSize = 50
    this.flushInterval = 5000 // 5 seconds
    
    // Auto-flush periodically
    setInterval(() => this.flush(), this.flushInterval)
  }
  
  track(eventType, eventData, userId = null, sessionId = null) {
    this.eventQueue.push({
      event_type: eventType,
      event_data: eventData,
      user_id: userId,
      session_id: sessionId
    })
    
    // Auto-flush when batch is full
    if (this.eventQueue.length >= this.batchSize) {
      this.flush()
    }
  }
  
  flush() {
    if (this.eventQueue.length === 0) return
    
    const events = this.eventQueue.splice(0, 100) // Max 100 per batch
    
    fetch('/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey
      },
      body: JSON.stringify(events)
    }).catch(error => {
      console.error('Failed to send events:', error)
      // Re-queue events on failure
      this.eventQueue.unshift(...events)
    })
  }
}

// Usage
const tracker = new EventTracker('your-project-api-key')
tracker.track('page_view', { page: '/landing' })
tracker.track('button_click', { button: 'signup' })
// Events will be sent in batches automatically
```