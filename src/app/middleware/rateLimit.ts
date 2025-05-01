import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

export class RateLimiter {
  private store: RateLimitStore = {};
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      windowMs: config.windowMs || 900000, // 15 minutes
      maxRequests: config.maxRequests || 100,
      message: config.message || 'Too many requests, please try again later.',
    };
  }

  private getKey(req: NextRequest): string {
    const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
    return `${ip}`;
  }

  private cleanup(): void {
    const now = Date.now();
    Object.keys(this.store).forEach((key) => {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    });
  }

  public check(req: NextRequest): { allowed: boolean; remaining: number; resetTime: number } {
    this.cleanup();

    const key = this.getKey(req);
    const now = Date.now();

    if (!this.store[key]) {
      this.store[key] = {
        count: 1,
        resetTime: now + this.config.windowMs,
      };
    } else {
      if (now > this.store[key].resetTime) {
        this.store[key] = {
          count: 1,
          resetTime: now + this.config.windowMs,
        };
      } else {
        this.store[key].count++;
      }
    }

    const remaining = Math.max(0, this.config.maxRequests - this.store[key].count);
    const allowed = this.store[key].count <= this.config.maxRequests;

    return {
      allowed,
      remaining,
      resetTime: this.store[key].resetTime,
    };
  }

  public middleware() {
    return (req: NextRequest) => {
      const { allowed, remaining, resetTime } = this.check(req);

      const response = allowed
        ? NextResponse.next()
        : NextResponse.json(
            { error: this.config.message },
            { status: 429 }
          );

      response.headers.set('X-RateLimit-Limit', this.config.maxRequests.toString());
      response.headers.set('X-RateLimit-Remaining', remaining.toString());
      response.headers.set('X-RateLimit-Reset', resetTime.toString());

      return response;
    };
  }
}

// Create a singleton instance
const rateLimiter = new RateLimiter({
  windowMs: Number(process.env.NEXT_PUBLIC_RATE_LIMIT_WINDOW) || 900000,
  maxRequests: Number(process.env.NEXT_PUBLIC_RATE_LIMIT_MAX_REQUESTS) || 100,
});

export default rateLimiter.middleware(); 