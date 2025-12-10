import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AuthModule } from './auth/auth.module';
import { LoggerModule } from './logger/logger.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { AdminModule } from './admin/admin.module';
import { BidsModule } from './bids/bids.module';
import { UsersModule } from './users/users.module';
import { WatchlistModule } from './watchlist/watchlist.module';
import { SchedulerModule as AppSchedulerModule } from './scheduler/scheduler.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGO_URI'),
      }),
    }),
    LoggerModule,
    AuthModule,
    CategoriesModule,
    ProductsModule,
    AdminModule,
    BidsModule,
    UsersModule,
    WatchlistModule,
    AppSchedulerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
