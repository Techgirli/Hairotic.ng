import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { ExecutionContext } from '@nestjs/common';

type SetHeaderFn = (key: string, value: string) => void;

/**
 * Adapter-agnostic ThrottlerGuard.
 *
 * `@nestjs/throttler` writes rate-limit headers via the Express-style
 * `res.header(...)`. The Cloudflare fetch adapter's response surface exposes
 * `setHeader` (Express/Node style) or web `Headers` instead, so every request
 * crashed with `TypeError: res.header is not a function` at guard time. This
 * subclass keeps all throttling logic (tracker, storage, block duration) and
 * only adapts how the headers are written.
 */
@Injectable()
export class ThrottlerWorkerGuard extends ThrottlerGuard {
  protected getRequestResponse(context: ExecutionContext): {
    req: any;
    res: any;
  } {
    const http = context.switchToHttp();
    const req = (http.getRequest as (...args: unknown[]) => unknown)();
    const res = (http.getResponse as (...args: unknown[]) => unknown)() as {
      header?: any;
      setHeader?: SetHeaderFn;
      headers?: Headers;
    };

    if (res && typeof res.header !== 'function') {
      res.header = this.resolveSetHeader(res);
    }

    return { req, res };
  }

  private resolveSetHeader(res: {
    setHeader?: SetHeaderFn;
    headers?: Headers;
  }): SetHeaderFn {
    if (typeof res.setHeader === 'function') {
      return (key, value) => res.setHeader?.(key, value);
    }
    if (res.headers && typeof res.headers.set === 'function') {
      return (key, value) => {
        res.headers?.set(key, value);
        return undefined;
      };
    }
    return () => undefined;
  }
}
