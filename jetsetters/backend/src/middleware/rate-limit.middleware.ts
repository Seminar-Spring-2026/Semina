import type { Request, Response, NextFunction } from 'express';

export interface RateLimitOptions {
  windowMs: number;
  limit: number;
  key?: (req: Request) => string;
}

export function createRateLimiter(options: RateLimitOptions) {
  const { windowMs, limit } = options;
  const keyFn = options.key || ((req: Request) => req.ip || 'unknown');

  const buckets = new Map<string, { count: number; resetAt: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = keyFn(req);

    const existing = buckets.get(key);
    if (!existing || existing.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    existing.count += 1;
    buckets.set(key, existing);

    if (existing.count > limit) {
      res.status(429).json({
        success: false,
        error: 'Too many requests. Please slow down.',
      });
      return;
    }

    next();
  };
}

