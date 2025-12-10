import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BidsController } from './bids.controller';
import { BidsService } from './bids.service';
import { Bid, BidSchema } from './schemas/bid.schema';
import { AutoBidConfig, AutoBidConfigSchema } from './schemas/auto-bid-config.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { MailService } from '../common/services/mail.service';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Bid.name, schema: BidSchema },
      { name: AutoBidConfig.name, schema: AutoBidConfigSchema },
      { name: Product.name, schema: ProductSchema },
      { name: User.name, schema: UserSchema },
    ]),
    AdminModule, // Import AdminModule để dùng AdminService
  ],
  controllers: [BidsController],
  providers: [BidsService, MailService],
  exports: [BidsService],
})
export class BidsModule {}
