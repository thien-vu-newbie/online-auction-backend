import { SetMetadata } from '@nestjs/common';

export const REQUIRE_SELLER_ACTIVE_KEY = 'requireSellerActive';
export const RequireSellerActive = () => SetMetadata(REQUIRE_SELLER_ACTIVE_KEY, true);
