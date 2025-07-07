import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, BarChart3 } from "lucide-react"
import Link from "next/link"

export function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-6 w-6" />
            <h1 className="font-bold text-xl">DevMetrics Studio</h1>
          </div>
          <nav className="flex items-center space-x-6">
            <Link href="/login">
              <Button variant="outline" size="sm">Sign In</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1">
        <div className="container mx-auto px-4 py-24 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4" variant="secondary">
              Built for developers, by developers
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Understand Your Users
              <span className="text-primary"> Without the Complexity</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Real-time analytics for your projects.
            </p>
          </div>
        </div>
      </section>



      {/* CTA Section */}
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Understand Your Users?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join developers who ship better products with DevMetrics
          </p>
          <Link href="/signup">
            <Button size="lg" variant="secondary">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <BarChart3 className="h-5 w-5" />
              <span className="font-semibold">DevMetrics Studio</span>
            </div>
            <div className="flex space-x-6 text-sm text-muted-foreground">
              <a href="https://github.com/devforever7/devmetrics-studio" className="hover:text-primary">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}