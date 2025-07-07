"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Code } from "lucide-react"

export default function DocsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Documentation</h1>
        <p className="text-muted-foreground">
          Learn how to send events to DevMetrics Studio
        </p>
      </div>

      {/* How to Send Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Sending Events
          </CardTitle>
          <CardDescription>
            Send HTTP requests to track events from your application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-medium mb-2">1. Get Your API Key</h2>
              <p className="text-sm text-muted-foreground mb-2">
                Go to Projects → Create a project → Copy your API key
              </p>
            </div>
            
            <div>
              <h2 className="text-lg font-medium mb-2">2. Send Events via HTTP</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-md font-medium mb-2">Single Event</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Send individual events:
                  </p>
                  <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                    <div>curl -X POST https://devmetrics-studio.vercel.app/api/events \</div>
                    <div className="ml-2">-H "Content-Type: application/json" \</div>
                    <div className="ml-2">-H "x-api-key: your-project-api-key" \</div>
                    <div className="ml-2">-d '{`{`}</div>
                    <div className="ml-6">"event_type": "page_view",</div>
                    <div className="ml-6">"event_data": {`{`}"page": "/landing"{`}`},</div>
                    <div className="ml-6">"user_id": "user_123",</div>
                    <div className="ml-6">"session_id": "session_456"</div>
                    <div className="ml-2">{`}`}'</div>
                  </div>
                </div>

                <div>
                  <h3 className="text-md font-medium mb-2">Batch Events (Recommended)</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Send multiple events in one request for better performance:
                  </p>
                  <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                    <div>curl -X POST https://devmetrics-studio.vercel.app/api/events \</div>
                    <div className="ml-2">-H "Content-Type: application/json" \</div>
                    <div className="ml-2">-H "x-api-key: your-project-api-key" \</div>
                    <div className="ml-2">-d '[</div>
                    <div className="ml-4">{`{`}</div>
                    <div className="ml-6">"event_type": "page_view",</div>
                    <div className="ml-6">"event_data": {`{`}"page": "/landing"{`}`},</div>
                    <div className="ml-6">"user_id": "user_123"</div>
                    <div className="ml-4">{`}`},</div>
                    <div className="ml-4">{`{`}</div>
                    <div className="ml-6">"event_type": "button_click",</div>
                    <div className="ml-6">"event_data": {`{`}"button": "cta_hero"{`}`},</div>
                    <div className="ml-6">"user_id": "user_123"</div>
                    <div className="ml-4">{`}`}</div>
                    <div className="ml-2">]'</div>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    <strong>Limits:</strong> Maximum 100 events per batch • 60 requests per minute per API key
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-medium mb-2">3. Event Types</h2>
              <p className="text-sm text-muted-foreground mb-2">
                Common event types you can track:
              </p>
              <div className="space-y-2">
                <div className="bg-muted p-3 rounded-lg font-mono text-sm">
                  <div className="font-medium">Page Views:</div>
                  <div className="text-muted-foreground">"event_type": "page_view"</div>
                </div>
                <div className="bg-muted p-3 rounded-lg font-mono text-sm">
                  <div className="font-medium">Button Clicks:</div>
                  <div className="text-muted-foreground">"event_type": "button_click"</div>
                </div>
                <div className="bg-muted p-3 rounded-lg font-mono text-sm">
                  <div className="font-medium">Form Submissions:</div>
                  <div className="text-muted-foreground">"event_type": "form_submit"</div>
                </div>
                <div className="bg-muted p-3 rounded-lg font-mono text-sm">
                  <div className="font-medium">Custom Events:</div>
                  <div className="text-muted-foreground">"event_type": "feature_used"</div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-medium mb-2">4. JavaScript Integration</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-md font-medium mb-2">Simple Tracking</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Basic function for immediate event sending:
                  </p>
                  <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                    <div className="text-green-600">// Simple tracking function</div>
                    <div>function trackEvent(eventType, eventData) {`{`}</div>
                    <div className="ml-2">fetch('/api/events', {`{`}</div>
                    <div className="ml-4">method: 'POST',</div>
                    <div className="ml-4">headers: {`{`}</div>
                    <div className="ml-6">'Content-Type': 'application/json',</div>
                    <div className="ml-6">'x-api-key': 'your-api-key'</div>
                    <div className="ml-4">{`}`},</div>
                    <div className="ml-4">body: JSON.stringify({`{`}</div>
                    <div className="ml-6">event_type: eventType,</div>
                    <div className="ml-6">event_data: eventData</div>
                    <div className="ml-4">{`}`})</div>
                    <div className="ml-2">{`}`})</div>
                    <div>{`}`}</div>
                  </div>
                </div>

                <div>
                  <h3 className="text-md font-medium mb-2">Batch Tracker (Recommended)</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Efficient batch tracking for better performance:
                  </p>
                  <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto">
                    <div className="text-green-600">// Batch event tracker class</div>
                    <div>class EventTracker {`{`}</div>
                    <div className="ml-4">constructor(apiKey) {`{`}</div>
                    <div className="ml-8">this.apiKey = apiKey</div>
                    <div className="ml-8">this.events = []</div>
                    <div className="ml-8">this.batchSize = 50</div>
                    <div className="ml-8">this.flushInterval = 5000</div>
                    <div className="ml-8">setInterval(() =&gt; this.flush(), this.flushInterval)</div>
                    <div className="ml-4">{`}`}</div>
                    <div className="ml-4"></div>
                    <div className="ml-4">track(eventType, eventData) {`{`}</div>
                    <div className="ml-8">this.events.push({`{`}</div>
                    <div className="ml-12">event_type: eventType,</div>
                    <div className="ml-12">event_data: eventData</div>
                    <div className="ml-8">{`}`})</div>
                    <div className="ml-8">if (this.events.length &gt;= this.batchSize) this.flush()</div>
                    <div className="ml-4">{`}`}</div>
                    <div className="ml-4"></div>
                    <div className="ml-4">flush() {`{`}</div>
                    <div className="ml-8">if (this.events.length === 0) return</div>
                    <div className="ml-8">const batch = this.events.splice(0, 100)</div>
                    <div className="ml-8">fetch('/api/events', {`{`}</div>
                    <div className="ml-12">method: 'POST',</div>
                    <div className="ml-12">headers: {`{`}</div>
                    <div className="ml-16">'Content-Type': 'application/json',</div>
                    <div className="ml-16">'x-api-key': this.apiKey</div>
                    <div className="ml-12">{`}`},</div>
                    <div className="ml-12">body: JSON.stringify(batch)</div>
                    <div className="ml-8">{`}`})</div>
                    <div className="ml-4">{`}`}</div>
                    <div>{`}`}</div>
                    <div className="mt-4 text-green-600">// Usage</div>
                    <div>const tracker = new EventTracker('your-api-key')</div>
                    <div>tracker.track('page_view', {`{`} page: location.pathname {`}`})</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}