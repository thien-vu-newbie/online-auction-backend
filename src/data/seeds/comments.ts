import { Model } from 'mongoose';
import { Comment } from '../../comments/schemas/comment.schema';

export async function seedComments(
  commentModel: Model<Comment>,
  users: any,
  products: any[],
) {
  console.log('💬 Seeding comments...');

  // Clear existing comments
  await commentModel.deleteMany({});

  const comments = await commentModel.insertMany([
    // Comments on iPhone 15 Pro Max
    {
      userId: users.bidders[0]._id,
      productId: products[0]._id,
      content: 'Máy còn bảo hành Apple không ạ?',
      parentId: null,
      isDeleted: false,
    },
    {
      userId: users.sellers[0]._id, // TechStore Vietnam replies
      productId: products[0]._id,
      content: 'Dạ máy còn bảo hành Apple 11 tháng ạ, fullbox kèm theo',
      parentId: null,
      isDeleted: false,
    },
    {
      userId: users.bidders[1]._id,
      productId: products[0]._id,
      content: 'Shop có hỗ trợ trả góp không ạ?',
      parentId: null,
      isDeleted: false,
    },

    // Comments on Rolex Submariner
    {
      userId: users.bidders[2]._id,
      productId: products[4]._id,
      content: 'Đồng hồ có giấy tờ chứng nhận chính hãng không shop?',
      parentId: null,
      isDeleted: false,
    },
    {
      userId: users.sellers[1]._id, // LuxuryWatch Store replies
      productId: products[4]._id,
      content: 'Dạ có đầy đủ box, giấy tờ, thẻ bảo hành quốc tế ạ',
      parentId: null,
      isDeleted: false,
    },
    {
      userId: users.bidders[0]._id,
      productId: products[4]._id,
      content: 'Đồng hồ này có chống nước tốt không ạ?',
      parentId: null,
      isDeleted: false,
    },

    // Comments on Air Jordan 1
    {
      userId: users.bidders[3]._id,
      productId: products[7]._id,
      content: 'Shop có size 42 không ạ?',
      parentId: null,
      isDeleted: false,
    },
    {
      userId: users.sellers[2]._id, // SneakerHead Shop replies
      productId: products[7]._id,
      content: 'Dạ có đủ size từ 38-45 ạ, bạn đặt giá thắng là ship ngay',
      parentId: null,
      isDeleted: false,
    },

    // Comments on MacBook Pro
    {
      userId: users.bidders[1]._id,
      productId: products[2]._id,
      content: 'Máy đã qua sử dụng hay mới nguyên seal ạ?',
      parentId: null,
      isDeleted: false,
    },
    {
      userId: users.sellers[0]._id,
      productId: products[2]._id,
      content: 'Máy mới 100%, nguyên seal Apple, chưa active ạ',
      parentId: null,
      isDeleted: false,
    },

    // Comments on LV Neverfull
    {
      userId: users.bidders[0]._id,
      productId: products[12]._id,
      content: 'Túi có kèm hộp và túi vải không shop?',
      parentId: null,
      isDeleted: false,
    },
    {
      userId: users.sellers[4]._id, // Fashion House replies
      productId: products[12]._id,
      content: 'Dạ có đầy đủ box, dustbag, giấy tờ chính hãng ạ',
      parentId: null,
      isDeleted: false,
    },
  ]);

  console.log(`   ✅ Created ${comments.length} comments`);

  return comments;
}
