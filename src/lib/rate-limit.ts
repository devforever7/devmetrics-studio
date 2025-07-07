// Simple in-memory rate limiter
// For production, consider using Redis or database-backed solution

interface RateLimitEntry {
  count: number
  resetTime: number
}

class RateLimiter {
  private requests = new Map<string, RateLimitEntry>()
  
  async check(identifier: string, maxRequests: number, windowMs: number): Promise<boolean> {
    const now = Date.now()
    const entry = this.requests.get(identifier)
    
    if (!entry || now > entry.resetTime) {
      // First request or window expired
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + windowMs
      })
      return true
    }
    
    if (entry.count >= maxRequests) {
      // Rate limit exceeded
      return false
    }
    
    // Increment counter
    entry.count++
    return true
  }
  
  // Clean up expired entries periodically
  cleanup() {
    const now = Date.now()
    for (const [key, entry] of this.requests.entries()) {
      if (now > entry.resetTime) {
        this.requests.delete(key)
      }
    }
  }
}

export const rateLimiter = new RateLimiter()

// Clean up expired entries every 5 minutes
setInterval(() => {
  rateLimiter.cleanup()
}, 5 * 60 * 1000)

export async function getClientIdentifier(request: Request): Promise<string> {
  // Use API key as identifier (could also use IP address)
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '')
  
  if (apiKey) {
    return `api_key:${apiKey}`
  }
  
  // Fallback to IP address
  const forwardedFor = request.headers.get('x-forwarded-for')
  const ip = forwardedFor ? forwardedFor.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'
  return `ip:${ip}`
}