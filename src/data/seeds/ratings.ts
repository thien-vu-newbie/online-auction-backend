import { Model } from 'mongoose';
import { Rating } from '../../ratings/schemas/rating.schema';

export async function seedRatings(
  ratingModel: Model<Rating>,
  users: any,
  products: any[],
) {
  console.log('⭐ Seeding ratings...');

  // Clear existing ratings
  await ratingModel.deleteMany({});

  const ratings = await ratingModel.insertMany([
    // TechStore Vietnam (seller) rating Nguyen Van A (buyer)
    {
      fromUserId: users.sellers[0]._id,
      toUserId: users.bidders[0]._id,
      productId: products[0]._id,
      rating: 1, // positive
      comment: 'Người mua thanh toán nhanh, giao dịch suôn sẻ',
      isSellerToWinner: true,
      isCancelledTransaction: false,
    },
    // Nguyen Van A rating TechStore Vietnam
    {
      fromUserId: users.bidders[0]._id,
      toUserId: users.sellers[0]._id,
      productId: products[0]._id,
      rating: 1, // positive
      comment: 'Sản phẩm đúng mô tả, giao hàng nhanh',
      isSellerToWinner: false,
      isCancelledTransaction: false,
    },
    // LuxuryWatch Store rating Le Van C
    {
      fromUserId: users.sellers[1]._id,
      toUserId: users.bidders[2]._id,
      productId: products[4]._id,
      rating: 1,
      comment: 'Khách hàng uy tín, giao dịch chuyên nghiệp',
      isSellerToWinner: true,
      isCancelledTransaction: false,
    },
    // Le Van C rating LuxuryWatch Store
    {
      fromUserId: users.bidders[2]._id,
      toUserId: users.sellers[1]._id,
      productId: products[4]._id,
      rating: 1,
      comment: 'Đồng hồ chính hãng, đẹp như mới',
      isSellerToWinner: false,
      isCancelledTransaction: false,
    },
    // SneakerHead Shop rating Tran Thi B
    {
      fromUserId: users.sellers[2]._id,
      toUserId: users.bidders[1]._id,
      productId: products[7]._id,
      rating: 1,
      comment: 'Người mua nhiệt tình, giao dịch tốt',
      isSellerToWinner: true,
      isCancelledTransaction: false,
    },
    // Tran Thi B rating SneakerHead Shop
    {
      fromUserId: users.bidders[1]._id,
      toUserId: users.sellers[2]._id,
      productId: products[7]._id,
      rating: 1,
      comment: 'Giày đẹp, fullbox, authentic',
      isSellerToWinner: false,
      isCancelledTransaction: false,
    },
    // Fashion House rating Pham Thi D
    {
      fromUserId: users.sellers[4]._id,
      toUserId: users.bidders[3]._id,
      productId: products[12]._id,
      rating: 1,
      comment: 'Giao dịch nhanh chóng, thanh toán đúng hạn',
      isSellerToWinner: true,
      isCancelledTransaction: false,
    },
    // Pham Thi D rating Fashion House
    {
      fromUserId: users.bidders[3]._id,
      toUserId: users.sellers[4]._id,
      productId: products[12]._id,
      rating: 1,
      comment: 'Túi xách authentic, đẹp long lanh',
      isSellerToWinner: false,
      isCancelledTransaction: false,
    },
  ]);

  console.log(`   ✅ Created ${ratings.length} ratings`);

  return ratings;
}
