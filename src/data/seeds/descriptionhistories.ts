import { Model } from 'mongoose';
import { DescriptionHistory } from '../../products/schemas/description-history.schema';

export async function seedDescriptionHistories(
  descriptionHistoryModel: Model<DescriptionHistory>,
  products: any[],
) {
  console.log('📝 Seeding description histories...');

  // Clear existing description histories
  await descriptionHistoryModel.deleteMany({});

  const now = new Date();

  const histories = await descriptionHistoryModel.insertMany([
    // Description update for iPhone 15 Pro Max
    {
      productId: products[0]._id,
      content:
        '<p><strong>Cập nhật:</strong> Máy đã kích hoạt bảo hành Apple Care+, bảo hành 2 năm thay vì 1 năm.</p>',
      addedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1 day ago
    },
    {
      productId: products[0]._id,
      content:
        '<p><strong>Thông báo:</strong> Đã giảm giá mua ngay từ 35 triệu xuống 32 triệu do muốn bán nhanh.</p>',
      addedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000), // 12 hours ago
    },

    // Description update for Rolex Submariner
    {
      productId: products[4]._id,
      content:
        '<p><strong>Bổ sung:</strong> Đồng hồ có thêm dây đeo NATO chính hãng Rolex trị giá 15 triệu.</p>',
      addedAt: new Date(now.getTime() - 48 * 60 * 60 * 1000), // 2 days ago
    },

    // Description update for MacBook Pro
    {
      productId: products[2]._id,
      content:
        '<p><strong>Cập nhật:</strong> Tặng kèm túi chống sốc Incase trị giá 2 triệu cho người thắng đấu giá.</p>',
      addedAt: new Date(now.getTime() - 36 * 60 * 60 * 1000), // 1.5 days ago
    },

    // Description update for Air Jordan 1
    {
      productId: products[7]._id,
      content:
        '<p><strong>Thông báo:</strong> Giày đã được LC (Legit Check) bởi CheckCheck App - 100% authentic.</p>',
      addedAt: new Date(now.getTime() - 18 * 60 * 60 * 1000), // 18 hours ago
    },

    // Description update for Hermès Birkin
    {
      productId: products[13]._id,
      content:
        '<p><strong>Bổ sung:</strong> Túi kèm theo hộp gỗ Hermès đặc biệt, dustbag, ribbon và giấy chứng nhận.</p>',
      addedAt: new Date(now.getTime() - 60 * 60 * 60 * 1000), // 2.5 days ago
    },
  ]);

  console.log(`   ✅ Created ${histories.length} description histories`);

  return histories;
}
