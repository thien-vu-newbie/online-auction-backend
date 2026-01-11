import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Override handleRequest to make authentication optional
  handleRequest(err: any, user: any) {
    // If there's an error or no user, just return null (don't throw)
    // This allows the request to proceed without authentication
    if (err || !user) {
      return null;
    }
    return user;
  }

  // Override canActivate to always return true
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      // Try to authenticate using JWT strategy
      await super.canActivate(context);
    } catch (err) {
      // If authentication fails, just continue (don't throw)
    }
    // Always allow the request to proceed
    return true;
  }
}
