import { Model } from 'mongoose';
import { AutoBidConfig } from '../../bids/schemas/auto-bid-config.schema';

export async function seedAutoBidConfigs(
  autoBidConfigModel: Model<AutoBidConfig>,
  products: any[],
  bidders: any[],
) {
  console.log('🤖 Seeding auto-bid configs...');

  // Clear existing configs
  await autoBidConfigModel.deleteMany({});

  const configs = await autoBidConfigModel.insertMany([
    // Auto-bid for iPhone 15 Pro Max
    {
      bidderId: bidders[0]._id, // Nguyen Van A
      productId: products[0]._id,
      maxBidAmount: 30000000,
      isActive: true,
    },
    // Auto-bid for Samsung Galaxy S24 Ultra
    {
      bidderId: bidders[1]._id, // Tran Thi B
      productId: products[1]._id,
      maxBidAmount: 33000000,
      isActive: true,
    },
    // Auto-bid for MacBook Pro M3 Max
    {
      bidderId: bidders[2]._id, // Le Van C
      productId: products[2]._id,
      maxBidAmount: 92000000,
      isActive: true,
    },
    // Auto-bid for Rolex Submariner
    {
      bidderId: bidders[3]._id, // Pham Thi D
      productId: products[4]._id,
      maxBidAmount: 280000000,
      isActive: true,
    },
    // Auto-bid for Air Jordan 1
    {
      bidderId: bidders[0]._id,
      productId: products[7]._id,
      maxBidAmount: 10000000,
      isActive: true,
    },
  ]);

  console.log(`   ✅ Created ${configs.length} auto-bid configs`);

  return configs;
}
