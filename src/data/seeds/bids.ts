import { Model } from 'mongoose';
import { Bid } from '../../bids/schemas/bid.schema';
import { Product } from '../../products/schemas/product.schema';

export async function seedBids(
  bidModel: Model<Bid>,
  productModel: Model<Product>,
  products: any[],
  bidders: any[],
) {
  console.log('💰 Seeding bids...');

  // Clear existing bids
  await bidModel.deleteMany({});

  const now = new Date();

  const bids = await bidModel.insertMany([
    // ========== Product 0: iPhone 15 Pro Max (5 bids) ==========
    {
      productId: products[0]._id,
      bidderId: bidders[0]._id,
      bidAmount: 25500000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 10 * 60 * 60 * 1000),
    },
    {
      productId: products[0]._id,
      bidderId: bidders[1]._id,
      bidAmount: 26000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 8 * 60 * 60 * 1000),
    },
    {
      productId: products[0]._id,
      bidderId: bidders[2]._id,
      bidAmount: 26500000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 6 * 60 * 60 * 1000),
    },
    {
      productId: products[0]._id,
      bidderId: bidders[3]._id,
      bidAmount: 27000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 3 * 60 * 60 * 1000),
    },
    {
      productId: products[0]._id,
      bidderId: bidders[0]._id,
      bidAmount: 27500000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 1 * 60 * 60 * 1000),
    },

    // ========== Product 1: Samsung Galaxy S24 Ultra (5 bids) ==========
    {
      productId: products[1]._id,
      bidderId: bidders[1]._id,
      bidAmount: 28500000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 12 * 60 * 60 * 1000),
    },
    {
      productId: products[1]._id,
      bidderId: bidders[3]._id,
      bidAmount: 29000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 10 * 60 * 60 * 1000),
    },
    {
      productId: products[1]._id,
      bidderId: bidders[0]._id,
      bidAmount: 29500000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 7 * 60 * 60 * 1000),
    },
    {
      productId: products[1]._id,
      bidderId: bidders[2]._id,
      bidAmount: 30000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 4 * 60 * 60 * 1000),
    },
    {
      productId: products[1]._id,
      bidderId: bidders[1]._id,
      bidAmount: 30500000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },

    // ========== Product 2: MacBook Pro M3 Max (6 bids) ==========
    {
      productId: products[2]._id,
      bidderId: bidders[0]._id,
      bidAmount: 82000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 15 * 60 * 60 * 1000),
    },
    {
      productId: products[2]._id,
      bidderId: bidders[2]._id,
      bidAmount: 84000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 12 * 60 * 60 * 1000),
    },
    {
      productId: products[2]._id,
      bidderId: bidders[3]._id,
      bidAmount: 86000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 9 * 60 * 60 * 1000),
    },
    {
      productId: products[2]._id,
      bidderId: bidders[1]._id,
      bidAmount: 88000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 6 * 60 * 60 * 1000),
    },
    {
      productId: products[2]._id,
      bidderId: bidders[0]._id,
      bidAmount: 90000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 3 * 60 * 60 * 1000),
    },
    {
      productId: products[2]._id,
      bidderId: bidders[2]._id,
      bidAmount: 92000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 1 * 60 * 60 * 1000),
    },

    // ========== Product 3: iPad Pro (5 bids) ==========
    {
      productId: products[3]._id,
      bidderId: bidders[1]._id,
      bidAmount: 33000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 11 * 60 * 60 * 1000),
    },
    {
      productId: products[3]._id,
      bidderId: bidders[2]._id,
      bidAmount: 34000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 9 * 60 * 60 * 1000),
    },
    {
      productId: products[3]._id,
      bidderId: bidders[0]._id,
      bidAmount: 35000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 7 * 60 * 60 * 1000),
    },
    {
      productId: products[3]._id,
      bidderId: bidders[3]._id,
      bidAmount: 36000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 4 * 60 * 60 * 1000),
    },
    {
      productId: products[3]._id,
      bidderId: bidders[1]._id,
      bidAmount: 37000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },

    // ========== Product 4: Rolex Submariner (7 bids) ==========
    {
      productId: products[4]._id,
      bidderId: bidders[0]._id,
      bidAmount: 255000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 20 * 60 * 60 * 1000),
    },
    {
      productId: products[4]._id,
      bidderId: bidders[2]._id,
      bidAmount: 260000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 18 * 60 * 60 * 1000),
    },
    {
      productId: products[4]._id,
      bidderId: bidders[1]._id,
      bidAmount: 265000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 15 * 60 * 60 * 1000),
    },
    {
      productId: products[4]._id,
      bidderId: bidders[3]._id,
      bidAmount: 270000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 12 * 60 * 60 * 1000),
    },
    {
      productId: products[4]._id,
      bidderId: bidders[0]._id,
      bidAmount: 275000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 9 * 60 * 60 * 1000),
    },
    {
      productId: products[4]._id,
      bidderId: bidders[2]._id,
      bidAmount: 280000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 5 * 60 * 60 * 1000),
    },
    {
      productId: products[4]._id,
      bidderId: bidders[1]._id,
      bidAmount: 285000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },

    // ========== Product 5: Omega Speedmaster (5 bids) ==========
    {
      productId: products[5]._id,
      bidderId: bidders[2]._id,
      bidAmount: 153000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 13 * 60 * 60 * 1000),
    },
    {
      productId: products[5]._id,
      bidderId: bidders[0]._id,
      bidAmount: 156000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 11 * 60 * 60 * 1000),
    },
    {
      productId: products[5]._id,
      bidderId: bidders[3]._id,
      bidAmount: 159000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 8 * 60 * 60 * 1000),
    },
    {
      productId: products[5]._id,
      bidderId: bidders[1]._id,
      bidAmount: 162000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 5 * 60 * 60 * 1000),
    },
    {
      productId: products[5]._id,
      bidderId: bidders[2]._id,
      bidAmount: 165000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 3 * 60 * 60 * 1000),
    },

    // ========== Product 6: Patek Philippe Nautilus (8 bids) ==========
    {
      productId: products[6]._id,
      bidderId: bidders[0]._id,
      bidAmount: 5050000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    },
    {
      productId: products[6]._id,
      bidderId: bidders[1]._id,
      bidAmount: 5100000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 22 * 60 * 60 * 1000),
    },
    {
      productId: products[6]._id,
      bidderId: bidders[2]._id,
      bidAmount: 5150000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 20 * 60 * 60 * 1000),
    },
    {
      productId: products[6]._id,
      bidderId: bidders[3]._id,
      bidAmount: 5200000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 18 * 60 * 60 * 1000),
    },
    {
      productId: products[6]._id,
      bidderId: bidders[0]._id,
      bidAmount: 5250000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 15 * 60 * 60 * 1000),
    },
    {
      productId: products[6]._id,
      bidderId: bidders[1]._id,
      bidAmount: 5300000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 12 * 60 * 60 * 1000),
    },
    {
      productId: products[6]._id,
      bidderId: bidders[2]._id,
      bidAmount: 5350000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 8 * 60 * 60 * 1000),
    },
    {
      productId: products[6]._id,
      bidderId: bidders[3]._id,
      bidAmount: 5400000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 4 * 60 * 60 * 1000),
    },

    // ========== Product 7: Air Jordan 1 (6 bids) ==========
    {
      productId: products[7]._id,
      bidderId: bidders[1]._id,
      bidAmount: 8200000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 14 * 60 * 60 * 1000),
    },
    {
      productId: products[7]._id,
      bidderId: bidders[3]._id,
      bidAmount: 8400000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 12 * 60 * 60 * 1000),
    },
    {
      productId: products[7]._id,
      bidderId: bidders[0]._id,
      bidAmount: 8600000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 10 * 60 * 60 * 1000),
    },
    {
      productId: products[7]._id,
      bidderId: bidders[2]._id,
      bidAmount: 8800000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 7 * 60 * 60 * 1000),
    },
    {
      productId: products[7]._id,
      bidderId: bidders[1]._id,
      bidAmount: 9000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 4 * 60 * 60 * 1000),
    },
    {
      productId: products[7]._id,
      bidderId: bidders[3]._id,
      bidAmount: 9200000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },

    // ========== Product 8: Yeezy 350 (5 bids) ==========
    {
      productId: products[8]._id,
      bidderId: bidders[0]._id,
      bidAmount: 6150000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 10 * 60 * 60 * 1000),
    },
    {
      productId: products[8]._id,
      bidderId: bidders[2]._id,
      bidAmount: 6300000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 8 * 60 * 60 * 1000),
    },
    {
      productId: products[8]._id,
      bidderId: bidders[1]._id,
      bidAmount: 6450000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 6 * 60 * 60 * 1000),
    },
    {
      productId: products[8]._id,
      bidderId: bidders[3]._id,
      bidAmount: 6600000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 4 * 60 * 60 * 1000),
    },
    {
      productId: products[8]._id,
      bidderId: bidders[0]._id,
      bidAmount: 6750000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },

    // ========== Product 9: Nike Dunk Low (5 bids) ==========
    {
      productId: products[9]._id,
      bidderId: bidders[2]._id,
      bidAmount: 3600000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 9 * 60 * 60 * 1000),
    },
    {
      productId: products[9]._id,
      bidderId: bidders[1]._id,
      bidAmount: 3700000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 7 * 60 * 60 * 1000),
    },
    {
      productId: products[9]._id,
      bidderId: bidders[3]._id,
      bidAmount: 3800000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 5 * 60 * 60 * 1000),
    },
    {
      productId: products[9]._id,
      bidderId: bidders[0]._id,
      bidAmount: 3900000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 3 * 60 * 60 * 1000),
    },
    {
      productId: products[9]._id,
      bidderId: bidders[2]._id,
      bidAmount: 4000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 1 * 60 * 60 * 1000),
    },

    // ========== Product 10: Tranh Sơn Dầu (6 bids) ==========
    {
      productId: products[10]._id,
      bidderId: bidders[0]._id,
      bidAmount: 510000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 16 * 60 * 60 * 1000),
    },
    {
      productId: products[10]._id,
      bidderId: bidders[1]._id,
      bidAmount: 520000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 14 * 60 * 60 * 1000),
    },
    {
      productId: products[10]._id,
      bidderId: bidders[2]._id,
      bidAmount: 530000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 11 * 60 * 60 * 1000),
    },
    {
      productId: products[10]._id,
      bidderId: bidders[3]._id,
      bidAmount: 540000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 8 * 60 * 60 * 1000),
    },
    {
      productId: products[10]._id,
      bidderId: bidders[0]._id,
      bidAmount: 550000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 5 * 60 * 60 * 1000),
    },
    {
      productId: products[10]._id,
      bidderId: bidders[1]._id,
      bidAmount: 560000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 3 * 60 * 60 * 1000),
    },

    // ========== Product 11: Tượng Đồng Phật Bà Quan Âm (5 bids) ==========
    {
      productId: products[11]._id,
      bidderId: bidders[2]._id,
      bidAmount: 205000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 12 * 60 * 60 * 1000),
    },
    {
      productId: products[11]._id,
      bidderId: bidders[0]._id,
      bidAmount: 210000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 10 * 60 * 60 * 1000),
    },
    {
      productId: products[11]._id,
      bidderId: bidders[3]._id,
      bidAmount: 215000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 7 * 60 * 60 * 1000),
    },
    {
      productId: products[11]._id,
      bidderId: bidders[1]._id,
      bidAmount: 220000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 4 * 60 * 60 * 1000),
    },
    {
      productId: products[11]._id,
      bidderId: bidders[2]._id,
      bidAmount: 225000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },

    // ========== Product 12: LV Neverfull (5 bids) ==========
    {
      productId: products[12]._id,
      bidderId: bidders[1]._id,
      bidAmount: 36000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 11 * 60 * 60 * 1000),
    },
    {
      productId: products[12]._id,
      bidderId: bidders[3]._id,
      bidAmount: 37000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 9 * 60 * 60 * 1000),
    },
    {
      productId: products[12]._id,
      bidderId: bidders[0]._id,
      bidAmount: 38000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 7 * 60 * 60 * 1000),
    },
    {
      productId: products[12]._id,
      bidderId: bidders[2]._id,
      bidAmount: 39000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 4 * 60 * 60 * 1000),
    },
    {
      productId: products[12]._id,
      bidderId: bidders[1]._id,
      bidAmount: 40000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },

    // ========== Product 13: Hermès Birkin (7 bids) ==========
    {
      productId: products[13]._id,
      bidderId: bidders[0]._id,
      bidAmount: 820000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 18 * 60 * 60 * 1000),
    },
    {
      productId: products[13]._id,
      bidderId: bidders[2]._id,
      bidAmount: 840000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 16 * 60 * 60 * 1000),
    },
    {
      productId: products[13]._id,
      bidderId: bidders[1]._id,
      bidAmount: 860000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 13 * 60 * 60 * 1000),
    },
    {
      productId: products[13]._id,
      bidderId: bidders[3]._id,
      bidAmount: 880000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 10 * 60 * 60 * 1000),
    },
    {
      productId: products[13]._id,
      bidderId: bidders[0]._id,
      bidAmount: 900000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 7 * 60 * 60 * 1000),
    },
    {
      productId: products[13]._id,
      bidderId: bidders[2]._id,
      bidAmount: 920000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 4 * 60 * 60 * 1000),
    },
    {
      productId: products[13]._id,
      bidderId: bidders[1]._id,
      bidAmount: 940000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },

    // ========== Product 14: Chanel Classic Flap (5 bids) ==========
    {
      productId: products[14]._id,
      bidderId: bidders[3]._id,
      bidAmount: 123000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 10 * 60 * 60 * 1000),
    },
    {
      productId: products[14]._id,
      bidderId: bidders[1]._id,
      bidAmount: 126000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 8 * 60 * 60 * 1000),
    },
    {
      productId: products[14]._id,
      bidderId: bidders[2]._id,
      bidAmount: 129000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 6 * 60 * 60 * 1000),
    },
    {
      productId: products[14]._id,
      bidderId: bidders[0]._id,
      bidAmount: 132000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 3 * 60 * 60 * 1000),
    },
    {
      productId: products[14]._id,
      bidderId: bidders[3]._id,
      bidAmount: 135000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 1 * 60 * 60 * 1000),
    },

    // ========== Product 15: Sony PlayStation 5 (5 bids) ==========
    {
      productId: products[15]._id,
      bidderId: bidders[0]._id,
      bidAmount: 12300000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 9 * 60 * 60 * 1000),
    },
    {
      productId: products[15]._id,
      bidderId: bidders[2]._id,
      bidAmount: 12600000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 7 * 60 * 60 * 1000),
    },
    {
      productId: products[15]._id,
      bidderId: bidders[1]._id,
      bidAmount: 12900000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 5 * 60 * 60 * 1000),
    },
    {
      productId: products[15]._id,
      bidderId: bidders[3]._id,
      bidAmount: 13200000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 3 * 60 * 60 * 1000),
    },
    {
      productId: products[15]._id,
      bidderId: bidders[0]._id,
      bidAmount: 13500000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 1 * 60 * 60 * 1000),
    },

    // ========== Product 16: Canon EOS R5 Mark II (6 bids) ==========
    {
      productId: products[16]._id,
      bidderId: bidders[1]._id,
      bidAmount: 97000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 14 * 60 * 60 * 1000),
    },
    {
      productId: products[16]._id,
      bidderId: bidders[3]._id,
      bidAmount: 99000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 12 * 60 * 60 * 1000),
    },
    {
      productId: products[16]._id,
      bidderId: bidders[0]._id,
      bidAmount: 101000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 9 * 60 * 60 * 1000),
    },
    {
      productId: products[16]._id,
      bidderId: bidders[2]._id,
      bidAmount: 103000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 6 * 60 * 60 * 1000),
    },
    {
      productId: products[16]._id,
      bidderId: bidders[1]._id,
      bidAmount: 105000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 3 * 60 * 60 * 1000),
    },
    {
      productId: products[16]._id,
      bidderId: bidders[3]._id,
      bidAmount: 107000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 1 * 60 * 60 * 1000),
    },

    // ========== Product 17: Gucci Dionysus (5 bids) ==========
    {
      productId: products[17]._id,
      bidderId: bidders[2]._id,
      bidAmount: 56500000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 10 * 60 * 60 * 1000),
    },
    {
      productId: products[17]._id,
      bidderId: bidders[0]._id,
      bidAmount: 58000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 8 * 60 * 60 * 1000),
    },
    {
      productId: products[17]._id,
      bidderId: bidders[3]._id,
      bidAmount: 59500000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 6 * 60 * 60 * 1000),
    },
    {
      productId: products[17]._id,
      bidderId: bidders[1]._id,
      bidAmount: 61000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 3 * 60 * 60 * 1000),
    },
    {
      productId: products[17]._id,
      bidderId: bidders[2]._id,
      bidAmount: 62500000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 1 * 60 * 60 * 1000),
    },

    // ========== Product 18: Fossil Gen 6 (5 bids) ==========
    {
      productId: products[18]._id,
      bidderId: bidders[1]._id,
      bidAmount: 6150000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 8 * 60 * 60 * 1000),
    },
    {
      productId: products[18]._id,
      bidderId: bidders[3]._id,
      bidAmount: 6300000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 6 * 60 * 60 * 1000),
    },
    {
      productId: products[18]._id,
      bidderId: bidders[0]._id,
      bidAmount: 6450000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 4 * 60 * 60 * 1000),
    },
    {
      productId: products[18]._id,
      bidderId: bidders[2]._id,
      bidAmount: 6600000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },
    {
      productId: products[18]._id,
      bidderId: bidders[1]._id,
      bidAmount: 6750000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 30 * 60 * 1000),
    },

    // ========== Product 19: Bộ Bàn Ghế Gỗ Gụ (5 bids) ==========
    {
      productId: products[19]._id,
      bidderId: bidders[0]._id,
      bidAmount: 46000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 12 * 60 * 60 * 1000),
    },
    {
      productId: products[19]._id,
      bidderId: bidders[2]._id,
      bidAmount: 47000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 10 * 60 * 60 * 1000),
    },
    {
      productId: products[19]._id,
      bidderId: bidders[1]._id,
      bidAmount: 48000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 7 * 60 * 60 * 1000),
    },
    {
      productId: products[19]._id,
      bidderId: bidders[3]._id,
      bidAmount: 49000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 4 * 60 * 60 * 1000),
    },
    {
      productId: products[19]._id,
      bidderId: bidders[0]._id,
      bidAmount: 50000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },

    // ========== Product 20: AirPods Pro 2nd Gen (5 bids) ==========
    {
      productId: products[20]._id,
      bidderId: bidders[1]._id,
      bidAmount: 5600000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 11 * 60 * 60 * 1000),
    },
    {
      productId: products[20]._id,
      bidderId: bidders[2]._id,
      bidAmount: 5700000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 9 * 60 * 60 * 1000),
    },
    {
      productId: products[20]._id,
      bidderId: bidders[0]._id,
      bidAmount: 5800000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 6 * 60 * 60 * 1000),
    },
    {
      productId: products[20]._id,
      bidderId: bidders[3]._id,
      bidAmount: 5900000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 3 * 60 * 60 * 1000),
    },
    {
      productId: products[20]._id,
      bidderId: bidders[1]._id,
      bidAmount: 6000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 1 * 60 * 60 * 1000),
    },

    // ========== Product 21: Sony WH-1000XM5 (6 bids) ==========
    {
      productId: products[21]._id,
      bidderId: bidders[0]._id,
      bidAmount: 7150000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 13 * 60 * 60 * 1000),
    },
    {
      productId: products[21]._id,
      bidderId: bidders[2]._id,
      bidAmount: 7300000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 11 * 60 * 60 * 1000),
    },
    {
      productId: products[21]._id,
      bidderId: bidders[1]._id,
      bidAmount: 7450000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 8 * 60 * 60 * 1000),
    },
    {
      productId: products[21]._id,
      bidderId: bidders[3]._id,
      bidAmount: 7600000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 5 * 60 * 60 * 1000),
    },
    {
      productId: products[21]._id,
      bidderId: bidders[0]._id,
      bidAmount: 7750000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },
    {
      productId: products[21]._id,
      bidderId: bidders[2]._id,
      bidAmount: 7900000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 30 * 60 * 1000),
    },

    // ========== Product 22: Ray-Ban Aviator (5 bids) ==========
    {
      productId: products[22]._id,
      bidderId: bidders[3]._id,
      bidAmount: 3600000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 10 * 60 * 60 * 1000),
    },
    {
      productId: products[22]._id,
      bidderId: bidders[1]._id,
      bidAmount: 3700000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 8 * 60 * 60 * 1000),
    },
    {
      productId: products[22]._id,
      bidderId: bidders[0]._id,
      bidAmount: 3800000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 5 * 60 * 60 * 1000),
    },
    {
      productId: products[22]._id,
      bidderId: bidders[2]._id,
      bidAmount: 3900000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },
    {
      productId: products[22]._id,
      bidderId: bidders[3]._id,
      bidAmount: 4000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 45 * 60 * 1000),
    },

    // ========== Product 23: Áo Khoác Da Nam (5 bids) ==========
    {
      productId: products[23]._id,
      bidderId: bidders[0]._id,
      bidAmount: 8200000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 14 * 60 * 60 * 1000),
    },
    {
      productId: products[23]._id,
      bidderId: bidders[2]._id,
      bidAmount: 8400000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 11 * 60 * 60 * 1000),
    },
    {
      productId: products[23]._id,
      bidderId: bidders[1]._id,
      bidAmount: 8600000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 7 * 60 * 60 * 1000),
    },
    {
      productId: products[23]._id,
      bidderId: bidders[3]._id,
      bidAmount: 8800000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 3 * 60 * 60 * 1000),
    },
    {
      productId: products[23]._id,
      bidderId: bidders[0]._id,
      bidAmount: 9000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 1 * 60 * 60 * 1000),
    },

    // ========== Product 24: Bình Gốm Sứ Bát Tràng (6 bids) ==========
    {
      productId: products[24]._id,
      bidderId: bidders[1]._id,
      bidAmount: 15500000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 15 * 60 * 60 * 1000),
    },
    {
      productId: products[24]._id,
      bidderId: bidders[3]._id,
      bidAmount: 16000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 13 * 60 * 60 * 1000),
    },
    {
      productId: products[24]._id,
      bidderId: bidders[0]._id,
      bidAmount: 16500000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 10 * 60 * 60 * 1000),
    },
    {
      productId: products[24]._id,
      bidderId: bidders[2]._id,
      bidAmount: 17000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 7 * 60 * 60 * 1000),
    },
    {
      productId: products[24]._id,
      bidderId: bidders[1]._id,
      bidAmount: 17500000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 4 * 60 * 60 * 1000),
    },
    {
      productId: products[24]._id,
      bidderId: bidders[3]._id,
      bidAmount: 18000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },

    // ========== Product 25: Tranh Thêu Tay Hoa Sen (5 bids) ==========
    {
      productId: products[25]._id,
      bidderId: bidders[2]._id,
      bidAmount: 12300000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 12 * 60 * 60 * 1000),
    },
    {
      productId: products[25]._id,
      bidderId: bidders[0]._id,
      bidAmount: 12600000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 9 * 60 * 60 * 1000),
    },
    {
      productId: products[25]._id,
      bidderId: bidders[3]._id,
      bidAmount: 12900000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 6 * 60 * 60 * 1000),
    },
    {
      productId: products[25]._id,
      bidderId: bidders[1]._id,
      bidAmount: 13200000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 3 * 60 * 60 * 1000),
    },
    {
      productId: products[25]._id,
      bidderId: bidders[2]._id,
      bidAmount: 13500000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 1 * 60 * 60 * 1000),
    },

    // ========== Product 26: Xe Đạp Đua Giant (5 bids) ==========
    {
      productId: products[26]._id,
      bidderId: bidders[0]._id,
      bidAmount: 36000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 11 * 60 * 60 * 1000),
    },
    {
      productId: products[26]._id,
      bidderId: bidders[1]._id,
      bidAmount: 37000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 9 * 60 * 60 * 1000),
    },
    {
      productId: products[26]._id,
      bidderId: bidders[3]._id,
      bidAmount: 38000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 6 * 60 * 60 * 1000),
    },
    {
      productId: products[26]._id,
      bidderId: bidders[2]._id,
      bidAmount: 39000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 3 * 60 * 60 * 1000),
    },
    {
      productId: products[26]._id,
      bidderId: bidders[0]._id,
      bidAmount: 40000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 1 * 60 * 60 * 1000),
    },

    // ========== Product 27: Yamaha NVX 155 (6 bids) ==========
    {
      productId: products[27]._id,
      bidderId: bidders[1]._id,
      bidAmount: 51000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 16 * 60 * 60 * 1000),
    },
    {
      productId: products[27]._id,
      bidderId: bidders[3]._id,
      bidAmount: 52000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 14 * 60 * 60 * 1000),
    },
    {
      productId: products[27]._id,
      bidderId: bidders[0]._id,
      bidAmount: 53000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 11 * 60 * 60 * 1000),
    },
    {
      productId: products[27]._id,
      bidderId: bidders[2]._id,
      bidAmount: 54000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 8 * 60 * 60 * 1000),
    },
    {
      productId: products[27]._id,
      bidderId: bidders[1]._id,
      bidAmount: 55000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 4 * 60 * 60 * 1000),
    },
    {
      productId: products[27]._id,
      bidderId: bidders[3]._id,
      bidAmount: 56000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },

    // ========== Product 28: Máy Pha Cà Phê Breville (5 bids) ==========
    {
      productId: products[28]._id,
      bidderId: bidders[2]._id,
      bidAmount: 15500000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 10 * 60 * 60 * 1000),
    },
    {
      productId: products[28]._id,
      bidderId: bidders[0]._id,
      bidAmount: 16000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 8 * 60 * 60 * 1000),
    },
    {
      productId: products[28]._id,
      bidderId: bidders[1]._id,
      bidAmount: 16500000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 5 * 60 * 60 * 1000),
    },
    {
      productId: products[28]._id,
      bidderId: bidders[3]._id,
      bidAmount: 17000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },
    {
      productId: products[28]._id,
      bidderId: bidders[2]._id,
      bidAmount: 17500000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 45 * 60 * 1000),
    },

    // ========== Product 29: Đèn Chùm Pha Lê (5 bids) ==========
    {
      productId: products[29]._id,
      bidderId: bidders[1]._id,
      bidAmount: 25500000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 13 * 60 * 60 * 1000),
    },
    {
      productId: products[29]._id,
      bidderId: bidders[3]._id,
      bidAmount: 26000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 10 * 60 * 60 * 1000),
    },
    {
      productId: products[29]._id,
      bidderId: bidders[0]._id,
      bidAmount: 26500000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 7 * 60 * 60 * 1000),
    },
    {
      productId: products[29]._id,
      bidderId: bidders[2]._id,
      bidAmount: 27000000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 4 * 60 * 60 * 1000),
    },
    {
      productId: products[29]._id,
      bidderId: bidders[1]._id,
      bidAmount: 27500000,
      isRejected: false,
      bidTime: new Date(now.getTime() - 1 * 60 * 60 * 1000),
    },
  ]);

  console.log(`   ✅ Created ${bids.length} bids`);

  // Update products with bid count and current price
  console.log('   📊 Updating product bid counts and prices...');

  // Update all 30 products with their respective highest bids
  const productUpdates = [
    { index: 0, bidCount: 5, currentPrice: 27500000, winnerId: bidders[0]._id },
    { index: 1, bidCount: 5, currentPrice: 30500000, winnerId: bidders[1]._id },
    { index: 2, bidCount: 6, currentPrice: 92000000, winnerId: bidders[2]._id },
    { index: 3, bidCount: 5, currentPrice: 37000000, winnerId: bidders[1]._id },
    { index: 4, bidCount: 7, currentPrice: 285000000, winnerId: bidders[1]._id },
    { index: 5, bidCount: 5, currentPrice: 165000000, winnerId: bidders[2]._id },
    { index: 6, bidCount: 8, currentPrice: 5400000000, winnerId: bidders[3]._id },
    { index: 7, bidCount: 6, currentPrice: 9200000, winnerId: bidders[3]._id },
    { index: 8, bidCount: 5, currentPrice: 6750000, winnerId: bidders[0]._id },
    { index: 9, bidCount: 5, currentPrice: 4000000, winnerId: bidders[2]._id },
    { index: 10, bidCount: 6, currentPrice: 560000000, winnerId: bidders[1]._id },
    { index: 11, bidCount: 5, currentPrice: 225000000, winnerId: bidders[2]._id },
    { index: 12, bidCount: 5, currentPrice: 40000000, winnerId: bidders[1]._id },
    { index: 13, bidCount: 7, currentPrice: 940000000, winnerId: bidders[1]._id },
    { index: 14, bidCount: 5, currentPrice: 135000000, winnerId: bidders[3]._id },
    { index: 15, bidCount: 5, currentPrice: 13500000, winnerId: bidders[0]._id },
    { index: 16, bidCount: 6, currentPrice: 107000000, winnerId: bidders[3]._id },
    { index: 17, bidCount: 5, currentPrice: 62500000, winnerId: bidders[2]._id },
    { index: 18, bidCount: 5, currentPrice: 6750000, winnerId: bidders[1]._id },
    { index: 19, bidCount: 5, currentPrice: 50000000, winnerId: bidders[0]._id },
    { index: 20, bidCount: 5, currentPrice: 6000000, winnerId: bidders[1]._id },
    { index: 21, bidCount: 6, currentPrice: 7900000, winnerId: bidders[2]._id },
    { index: 22, bidCount: 5, currentPrice: 4000000, winnerId: bidders[3]._id },
    { index: 23, bidCount: 5, currentPrice: 9000000, winnerId: bidders[0]._id },
    { index: 24, bidCount: 6, currentPrice: 18000000, winnerId: bidders[3]._id },
    { index: 25, bidCount: 5, currentPrice: 13500000, winnerId: bidders[2]._id },
    { index: 26, bidCount: 5, currentPrice: 40000000, winnerId: bidders[0]._id },
    { index: 27, bidCount: 6, currentPrice: 56000000, winnerId: bidders[3]._id },
    { index: 28, bidCount: 5, currentPrice: 17500000, winnerId: bidders[2]._id },
    { index: 29, bidCount: 5, currentPrice: 27500000, winnerId: bidders[1]._id },
  ];

  for (const update of productUpdates) {
    await productModel.findByIdAndUpdate(products[update.index]._id, {
      bidCount: update.bidCount,
      currentPrice: update.currentPrice,
      currentWinnerId: update.winnerId,
    });
  }

  console.log('   ✅ Updated product statistics');

  return bids;
}
