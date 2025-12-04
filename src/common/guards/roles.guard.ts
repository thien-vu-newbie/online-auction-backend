import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { REQUIRE_SELLER_ACTIVE_KEY } from '../decorators/require-seller-active.decorator';
import { User, UserDocument } from '../../users/schemas/user.schema';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId || request.user?.sub;

    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }

    // Fetch user from database to get latest role and seller expiry
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    // Admin has access to everything
    if (user.role === 'admin') {
      return true;
    }

    // Check if user has required role
    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
      throw new ForbiddenException(`Required role: ${requiredRoles.join(', ')}`);
    }

    // Special check for seller role - only if RequireSellerActive decorator is present
    if (requiredRoles.includes('seller')) {
      const requireSellerActive = this.reflector.getAllAndOverride<boolean>(REQUIRE_SELLER_ACTIVE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

      // Only check expiry for actions that require active seller (e.g., create new product)
      if (requireSellerActive) {
        if (!user.sellerUpgradeExpiry) {
          throw new ForbiddenException('Seller permission not granted. Please request upgrade from admin.');
        }

        const now = new Date();
        if (now > user.sellerUpgradeExpiry) {
          throw new ForbiddenException('Seller permission expired. Please request upgrade again.');
        }
      }
    }

    return true;
  }
}
