import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WatchlistController } from './watchlist.controller';
import { WatchlistService } from './watchlist.service';
import { Watchlist, WatchlistSchema } from './schemas/watchlist.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Watchlist.name, schema: WatchlistSchema },
      { name: Product.name, schema: ProductSchema },
    ]),
  ],
  controllers: [WatchlistController],
  providers: [WatchlistService],
  exports: [WatchlistService],
})
export class WatchlistModule {}
