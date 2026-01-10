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

  // Create parent comments first
  const parentComments = await commentModel.insertMany([
    // iPhone 15 Pro Max - Question 1
    {
      userId: users.bidders[0]._id,
      productId: products[0]._id,
      content: 'Máy còn bảo hành Apple không ạ?',
      parentId: null,
      isDeleted: false,
    },
    // iPhone 15 Pro Max - Question 2
    {
      userId: users.bidders[1]._id,
      productId: products[0]._id,
      content: 'Shop có hỗ trợ trả góp không ạ?',
      parentId: null,
      isDeleted: false,
    },
    // Rolex Submariner - Question 1
    {
      userId: users.bidders[2]._id,
      productId: products[4]._id,
      content: 'Đồng hồ có giấy tờ chứng nhận chính hãng không shop?',
      parentId: null,
      isDeleted: false,
    },
    // Rolex Submariner - Question 2
    {
      userId: users.bidders[0]._id,
      productId: products[4]._id,
      content: 'Đồng hồ này có chống nước tốt không ạ?',
      parentId: null,
      isDeleted: false,
    },
    // Air Jordan 1 - Question
    {
      userId: users.bidders[3]._id,
      productId: products[7]._id,
      content: 'Shop có size 42 không ạ?',
      parentId: null,
      isDeleted: false,
    },
    // MacBook Pro - Question
    {
      userId: users.bidders[1]._id,
      productId: products[2]._id,
      content: 'Máy đã qua sử dụng hay mới nguyên seal ạ?',
      parentId: null,
      isDeleted: false,
    },
    // LV Neverfull - Question
    {
      userId: users.bidders[0]._id,
      productId: products[12]._id,
      content: 'Túi có kèm hộp và túi vải không shop?',
      parentId: null,
      isDeleted: false,
    },
    // iPad Pro M4 - Question 1
    {
      userId: users.bidders[0]._id,
      productId: products[30]._id,
      content: 'iPad có kèm Apple Pencil không shop?',
      parentId: null,
      isDeleted: false,
    },
    // iPad Pro M4 - Question 2
    {
      userId: users.bidders[2]._id,
      productId: products[30]._id,
      content: 'Màn hình có bị lỗi gì không ạ? Máy mới hay cũ?',
      parentId: null,
      isDeleted: false,
    },
  ]);

  // Create reply comments with parentId
  const replyComments = await commentModel.insertMany([
    // Reply to iPhone question 1
    {
      userId: users.sellers[0]._id,
      productId: products[0]._id,
      content: 'Dạ máy còn bảo hành Apple 11 tháng ạ, fullbox kèm theo',
      parentId: parentComments[0]._id,
      isDeleted: false,
    },
    // Reply to Rolex question 1
    {
      userId: users.sellers[1]._id,
      productId: products[4]._id,
      content: 'Dạ có đầy đủ box, giấy tờ, thẻ bảo hành quốc tế ạ',
      parentId: parentComments[2]._id,
      isDeleted: false,
    },
    // Reply to Air Jordan question
    {
      userId: users.sellers[2]._id,
      productId: products[7]._id,
      content: 'Dạ có đủ size từ 38-45 ạ, bạn đặt giá thắng là ship ngay',
      parentId: parentComments[4]._id,
      isDeleted: false,
    },
    // Reply to MacBook question
    {
      userId: users.sellers[0]._id,
      productId: products[2]._id,
      content: 'Máy mới 100%, nguyên seal Apple, chưa active ạ',
      parentId: parentComments[5]._id,
      isDeleted: false,
    },
    // Reply to LV Neverfull question
    {
      userId: users.sellers[4]._id,
      productId: products[12]._id,
      content: 'Dạ có đầy đủ box, dustbag, giấy tờ chính hãng ạ',
      parentId: parentComments[6]._id,
      isDeleted: false,
    },
    // Reply to iPad Pro M4 question 1
    {
      userId: users.sellers[0]._id,
      productId: products[30]._id,
      content: 'Dạ iPad không kèm Pencil ạ, nhưng shop có bán riêng nếu bạn cần',
      parentId: parentComments[7]._id,
      isDeleted: false,
    },
    // Reply to iPad Pro M4 question 2
    {
      userId: users.sellers[0]._id,
      productId: products[30]._id,
      content: 'Máy mới 100% chưa active, màn hình nguyên zin không tỳ vết ạ',
      parentId: parentComments[8]._id,
      isDeleted: false,
    },
  ]);

  const totalComments = parentComments.length + replyComments.length;
  console.log(`   ✅ Created ${totalComments} comments (${parentComments.length} questions, ${replyComments.length} replies)`);

  return [...parentComments, ...replyComments];
}
