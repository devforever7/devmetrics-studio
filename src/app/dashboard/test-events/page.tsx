"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function TestEventsPage() {
  const [apiKey, setApiKey] = useState("")
  const [eventType, setEventType] = useState("button_click")
  const [eventData, setEventData] = useState('{"button": "test", "page": "test-page"}')
  const [userId, setUserId] = useState("test_user_123")
  const [sessionId, setSessionId] = useState("test_session_456")
  const [response, setResponse] = useState("")
  const [loading, setLoading] = useState(false)

  const sendEvent = async () => {
    if (!apiKey.trim()) {
      setResponse("❌ Please enter an API key")
      return
    }

    setLoading(true)
    setResponse("⏳ Sending event...")

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({
          event_type: eventType,
          event_data: JSON.parse(eventData),
          user_id: userId || null,
          session_id: sessionId || null
        })
      })

      const data = await res.json()
      
      if (res.ok) {
        setResponse(`✅ Event sent successfully!\n\nResponse: ${JSON.stringify(data, null, 2)}`)
      } else {
        setResponse(`❌ Error: ${data.error}\n\nFull response: ${JSON.stringify(data, null, 2)}`)
      }
    } catch (error) {
      setResponse(`❌ Network error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const sendSampleEvents = async () => {
    if (!apiKey.trim()) {
      setResponse("❌ Please enter an API key")
      return
    }

    setLoading(true)
    setResponse("⏳ Sending sample events...")

    const sampleEvents = [
      {
        event_type: "page_view",
        event_data: { page: "/landing", referrer: "google.com", title: "DevMetrics Landing" },
        user_id: "user_001",
        session_id: "session_abc"
      },
      {
        event_type: "button_click",
        event_data: { button: "cta_hero", text: "Get Started", page: "/landing" },
        user_id: "user_001",
        session_id: "session_abc"
      },
      {
        event_type: "form_submit",
        event_data: { form: "contact", fields: ["email", "message"] },
        user_id: "user_002",
        session_id: "session_def"
      },
      {
        event_type: "feature_used",
        event_data: { feature: "export_data", format: "csv" },
        user_id: "user_003",
        session_id: "session_ghi"
      }
    ]

    try {
      // Send all events in a single batch request
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify(sampleEvents)
      })

      const data = await res.json()
      
      if (res.ok) {
        setResponse(`✅ Sample events sent in batch!\n\nResponse: ${JSON.stringify(data, null, 2)}\n\nCheck your dashboard to see the events!`)
      } else {
        setResponse(`❌ Error: ${data.error}\n\nFull response: ${JSON.stringify(data, null, 2)}`)
      }
    } catch (error) {
      setResponse(`❌ Error sending sample events: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Event Testing</h1>
        <p className="text-muted-foreground">
          Test your DevMetrics API by sending sample events
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Send Custom Event</CardTitle>
            <CardDescription>
              Configure and send a custom event to test your API
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">Project API Key</Label>
              <Input
                id="api-key"
                placeholder="dm_your_api_key_here"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Get this from your Projects page
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-type">Event Type</Label>
              <Input
                id="event-type"
                placeholder="button_click"
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-data">Event Data (JSON)</Label>
              <Textarea
                id="event-data"
                placeholder='{"button": "signup", "page": "landing"}'
                value={eventData}
                onChange={(e) => setEventData(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="user-id">User ID </Label>
                <Input
                  id="user-id"
                  placeholder="user_123"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={sendEvent} disabled={loading} className="flex-1">
                {loading ? "Sending..." : "Send Event"}
              </Button>
              <Button onClick={sendSampleEvents} variant="outline" disabled={loading}>
                Send Sample Events
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Response</CardTitle>
            <CardDescription>
              API response will appear here
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded text-sm whitespace-pre-wrap min-h-[200px]">
              {response || "No events sent yet. Enter your API key and click 'Send Event' to test."}
            </pre>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Quick Start</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Go to <strong>Dashboard → Projects</strong> and create a new project</li>
            <li>Copy the API key from your project</li>
            <li>Paste it in the "Project API Key" field above</li>
            <li>Click "Send Sample Events" to populate your dashboard with test data</li>
            <li>Check your dashboard to see the events appear in real-time</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}