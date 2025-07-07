"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Plus, Code2, Copy, Trash2 } from "lucide-react"
import { useProjectsData, invalidateProjectsCache } from "@/lib/hooks/use-projects-data"

interface Project {
  id: string
  name: string
  api_key: string
  created_at: string
  event_count?: number
}

export default function ProjectsPage() {
  const { projects, refresh } = useProjectsData()
  const [newProjectName, setNewProjectName] = useState("")
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const createProject = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }

    const apiKey = `dm_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`

    const { data } = await supabase
      .from('projects')
      .insert({
        name: newProjectName,
        user_id: user.id,
        api_key: apiKey
      })
      .select()
      .single()

    if (data) {
      invalidateProjectsCache()
      refresh()
      setNewProjectName("")
      setIsOpen(false)
    }
    setLoading(false)
  }

  const deleteProject = async (projectId: string) => {
    if (!confirm('Are you sure? This will delete all events for this project.')) return

    await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)

    invalidateProjectsCache()
    refresh()
  }

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage your projects and API keys
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Create a new project to start tracking analytics
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="project-name">Project Name</Label>
                <Input
                  id="project-name"
                  placeholder="My Awesome App"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                />
              </div>
              <Button 
                onClick={createProject} 
                disabled={!newProjectName || loading}
                className="w-full"
              >
                {loading ? "Creating..." : "Create Project"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Code2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No projects yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first project to start tracking analytics
            </p>
            <Button onClick={() => setIsOpen(true)}>
              <Plus className="h-4 w-4" />
              Create Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      Created {new Date(project.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteProject(project.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">API Key</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(project.api_key)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <code className="text-xs bg-muted p-2 rounded block break-all">
                    {project.api_key}
                  </code>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <Badge variant="secondary">
                    {project.event_count || 0} events
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}