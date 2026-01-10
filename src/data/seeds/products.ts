import { Model } from 'mongoose';
import { Product } from '../../products/schemas/product.schema';

interface SeedUsersResult {
  admin: any;
  sellers: any[];
  bidders: any[];
}

interface SeedCategoriesResult {
  parents: any[];
  children: any[];
}

export async function seedProducts(
  productModel: Model<Product>,
  users: SeedUsersResult,
  categories: SeedCategoriesResult,
) {
  console.log('📦 Seeding products...');

  // Clear existing products
  await productModel.deleteMany({});

  const now = new Date();
  const endTime2027 = new Date('2027-06-30T23:59:59.000Z');

  const products = await productModel.insertMany([
    // ========== TechStore Vietnam - Điện tử ==========
    {
      name: 'iPhone 15 Pro Max 256GB - Xanh Titan',
      description:
        '<p>iPhone 15 Pro Max phiên bản mới nhất với chip A17 Pro, camera 48MP, khung titan cao cấp.</p><ul><li>Màn hình Super Retina XDR 6.7 inch</li><li>Chip A17 Pro 3nm</li><li>Camera chính 48MP</li><li>Pin 4422mAh</li><li>Sạc nhanh USB-C</li></ul>',
      categoryId: categories.children[0]._id, // Điện thoại di động
      sellerId: users.sellers[0]._id,
      images: [
        'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=800',
        'https://images.unsplash.com/photo-1611472173362-3f53dbd65d80?w=800',
        'https://images.unsplash.com/photo-1632633728024-e1fd4bef561a?w=800',
        'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800',
      ],
      startPrice: 25000000,
      currentPrice: 25000000,
      stepPrice: 500000,
      buyNowPrice: 32000000,
      startTime: now,
      endTime: endTime2027,
      autoExtend: true,
      allowUnratedBidders: false,
      status: 'active',
      bidCount: 0,
    },
    {
      name: 'Samsung Galaxy S24 Ultra 512GB',
      description:
        '<p>Samsung Galaxy S24 Ultra - Flagship đỉnh cao với bút S Pen, camera 200MP, hiệu năng mạnh mẽ.</p><ul><li>Màn hình Dynamic AMOLED 6.8 inch</li><li>Snapdragon 8 Gen 3 for Galaxy</li><li>Camera 200MP + zoom 100x</li><li>Bút S Pen tích hợp</li><li>Pin 5000mAh</li></ul>',
      categoryId: categories.children[0]._id,
      sellerId: users.sellers[0]._id,
      images: [
        'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800',
        'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800',
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800',
        'https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=800',
      ],
      startPrice: 28000000,
      currentPrice: 28000000,
      stepPrice: 500000,
      buyNowPrice: 35000000,
      startTime: now,
      endTime: endTime2027,
      autoExtend: true,
      allowUnratedBidders: true,
      status: 'active',
      bidCount: 0,
    },
    {
      name: 'MacBook Pro M3 Max 16 inch - 36GB RAM, 1TB SSD',
      description:
        '<p>MacBook Pro với chip M3 Max, hiệu năng đỉnh cao cho công việc sáng tạo chuyên nghiệp.</p><ul><li>Chip M3 Max 16 nhân CPU, 40 nhân GPU</li><li>RAM 36GB Unified Memory</li><li>SSD 1TB</li><li>Màn hình Liquid Retina XDR 16.2 inch</li><li>Pin 100Wh - 22 giờ</li></ul>',
      categoryId: categories.children[1]._id, // Máy tính xách tay
      sellerId: users.sellers[0]._id,
      images: [
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800',
        'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800',
        'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800',
        'https://images.unsplash.com/photo-1629131726692-1accd0c53ce0?w=800',
      ],
      startPrice: 80000000,
      currentPrice: 80000000,
      stepPrice: 2000000,
      buyNowPrice: 95000000,
      startTime: now,
      endTime: endTime2027,
      autoExtend: false,
      allowUnratedBidders: false,
      status: 'active',
      bidCount: 0,
    },
    {
      name: 'iPad Pro 13 inch M4 2024 - 256GB WiFi + Cellular',
      description:
        '<p>iPad Pro thế hệ mới nhất với chip M4, màn hình OLED Tandem tuyệt đẹp.</p><ul><li>Chip M4 với Neural Engine</li><li>Màn hình Ultra Retina XDR 13 inch</li><li>Camera ProRes 12MP</li><li>Hỗ trợ Apple Pencil Pro</li><li>Magic Keyboard</li></ul>',
      categoryId: categories.children[2]._id, // Máy tính bảng
      sellerId: users.sellers[0]._id,
      images: [
        'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800',
        'https://images.unsplash.com/photo-1585790050230-5dd28404f27a?w=800',
        'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800',
        'https://images.unsplash.com/photo-1587033411391-5d9e51cce126?w=800',
      ],
      startPrice: 32000000,
      currentPrice: 32000000,
      stepPrice: 1000000,
      buyNowPrice: 40000000,
      startTime: now,
      endTime: endTime2027,
      autoExtend: true,
      allowUnratedBidders: true,
      status: 'active',
      bidCount: 0,
    },

    // ========== LuxuryWatch Store - Đồng hồ ==========
    {
      name: 'Rolex Submariner Date 41mm - Thép không gỉ',
      description:
        '<p>Đồng hồ lặn huyền thoại Rolex Submariner với khả năng chống nước 300m, máy Chronometer chính hãng.</p><ul><li>Vỏ thép Oystersteel 41mm</li><li>Máy Caliber 3235 tự động</li><li>Chống nước 300m</li><li>Khóa Oysterlock an toàn</li><li>Kính sapphire chống trầy</li></ul>',
      categoryId: categories.children[5]._id, // Đồng hồ
      sellerId: users.sellers[1]._id,
      images: [
        'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800',
        'https://images.unsplash.com/photo-1587836374288-ac270ec1e9e3?w=800',
        'https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?w=800',
        'https://images.unsplash.com/photo-1594534475808-b18fc33b045e?w=800',
      ],
      startPrice: 250000000,
      currentPrice: 250000000,
      stepPrice: 5000000,
      buyNowPrice: 320000000,
      startTime: now,
      endTime: endTime2027,
      autoExtend: true,
      allowUnratedBidders: false,
      status: 'active',
      bidCount: 0,
    },
    {
      name: 'Omega Speedmaster Moonwatch Professional',
      description:
        '<p>Chiếc đồng hồ đầu tiên trên Mặt trăng, biểu tượng của lịch sử không gian.</p><ul><li>Máy Calibre 3861 Manual Wind</li><li>Vỏ thép 42mm</li><li>Kính Hesalite</li><li>Chronograph 3 mặt phụ</li><li>Dây đeo thép hoặc NATO</li></ul>',
      categoryId: categories.children[5]._id,
      sellerId: users.sellers[1]._id,
      images: [
        'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=800',
        'https://images.unsplash.com/photo-1533139502658-0198f920d8e8?w=800',
        'https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?w=800',
        'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800',
      ],
      startPrice: 150000000,
      currentPrice: 150000000,
      stepPrice: 3000000,
      startTime: now,
      endTime: endTime2027,
      autoExtend: false,
      allowUnratedBidders: false,
      status: 'active',
      bidCount: 0,
    },
    {
      name: 'Patek Philippe Nautilus 5711/1A-014 - Limited Edition',
      description:
        '<p>Đồng hồ Nautilus huyền thoại phiên bản giới hạn với mặt số xanh Tiffany độc đáo.</p><ul><li>Máy Calibre 26-330 S C tự động</li><li>Vỏ thép 40mm</li><li>Mặt số xanh Tiffany hiếm</li><li>Chống nước 120m</li><li>Kính sapphire trong suốt</li></ul>',
      categoryId: categories.children[5]._id,
      sellerId: users.sellers[1]._id,
      images: [
        'https://images.unsplash.com/photo-1548169874-53e85f753f1e?w=800',
        'https://images.unsplash.com/photo-1587836374988-f3391f5b677b?w=800',
        'https://images.unsplash.com/photo-1451290337906-ac938fc89bce?w=800',
        'https://images.unsplash.com/photo-1622434641406-a158123450f9?w=800',
      ],
      startPrice: 5000000000,
      currentPrice: 5000000000,
      stepPrice: 50000000,
      startTime: now,
      endTime: endTime2027,
      autoExtend: true,
      allowUnratedBidders: false,
      status: 'active',
      bidCount: 0,
    },

    // ========== SneakerHead Shop - Giày dép ==========
    {
      name: 'Nike Air Jordan 1 Retro High OG "Chicago Lost & Found"',
      description:
        '<p>Air Jordan 1 phiên bản "Lost & Found" với thiết kế cổ điển Chicago Bulls colorway.</p><ul><li>Chất liệu da cao cấp aged</li><li>Colorway Chicago Bulls đỏ-trắng-đen</li><li>Đế giữa Nike Air</li><li>Size đầy đủ từ 38-45</li><li>Box đặc biệt vintage</li></ul>',
      categoryId: categories.children[4]._id, // Giày dép
      sellerId: users.sellers[2]._id,
      images: [
        'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800',
        'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=800',
        'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800',
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
      ],
      startPrice: 8000000,
      currentPrice: 8000000,
      stepPrice: 200000,
      buyNowPrice: 12000000,
      startTime: now,
      endTime: endTime2027,
      autoExtend: true,
      allowUnratedBidders: true,
      status: 'active',
      bidCount: 0,
    },
    {
      name: 'Adidas Yeezy Boost 350 V2 "Onyx"',
      description:
        '<p>Yeezy 350 V2 phối màu Onyx đen toàn thân, thiết kế iconic từ Kanye West.</p><ul><li>Upper Primeknit cao cấp</li><li>Boost midsole êm ái</li><li>Màu Onyx đen toàn thân</li><li>Stripe đặc trưng Yeezy</li><li>Size 39-44</li></ul>',
      categoryId: categories.children[4]._id,
      sellerId: users.sellers[2]._id,
      images: [
        'https://images.unsplash.com/photo-1597045566677-8cf032ed6634?w=800',
        'https://images.unsplash.com/photo-1520256862855-398228c41684?w=800',
        'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800',
        'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800',
      ],
      startPrice: 6000000,
      currentPrice: 6000000,
      stepPrice: 150000,
      buyNowPrice: 9000000,
      startTime: now,
      endTime: endTime2027,
      autoExtend: false,
      allowUnratedBidders: true,
      status: 'active',
      bidCount: 0,
    },
    {
      name: 'Nike Dunk Low "Panda Black White"',
      description:
        '<p>Nike Dunk Low phối màu Panda cực hot, thiết kế cổ điển dễ phối đồ.</p><ul><li>Upper da cao cấp</li><li>Colorway đen-trắng Panda</li><li>Đế cao su bền chắc</li><li>Unisex - Nam/Nữ</li><li>Size 36-45</li></ul>',
      categoryId: categories.children[4]._id,
      sellerId: users.sellers[2]._id,
      images: [
        'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800',
        'https://images.unsplash.com/photo-1584735175315-9d5df23860e6?w=800',
        'https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=800',
        'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800',
      ],
      startPrice: 3500000,
      currentPrice: 3500000,
      stepPrice: 100000,
      buyNowPrice: 5500000,
      startTime: now,
      endTime: endTime2027,
      autoExtend: true,
      allowUnratedBidders: true,
      status: 'active',
      bidCount: 0,
    },

    // ========== Art Gallery Saigon - Nghệ thuật ==========
    {
      name: 'Tranh Sơn Dầu "Phố Cổ Hà Nội" - Họa Sĩ Bùi Xuân Phái',
      description:
        '<p>Bức tranh sơn dầu quý hiếm của họa sĩ Bùi Xuân Phái, mô tả khung cảnh phố cổ Hà Nội xưa.</p><ul><li>Kích thước 80x120cm</li><li>Chất liệu sơn dầu trên canvas</li><li>Ký tên tác giả</li><li>Có giấy chứng nhận</li><li>Khung tranh gỗ cao cấp</li></ul>',
      categoryId: categories.children[8]._id, // Tranh vẽ
      sellerId: users.sellers[3]._id,
      images: [
        'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800',
        'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=800',
        'https://images.unsplash.com/photo-1578926375605-eaf7559b0461?w=800',
        'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=800',
      ],
      startPrice: 500000000,
      currentPrice: 500000000,
      stepPrice: 10000000,
      startTime: now,
      endTime: endTime2027,
      autoExtend: true,
      allowUnratedBidders: false,
      status: 'active',
      bidCount: 0,
    },
    {
      name: 'Tượng Đồng Phật Bà Quan Âm - Triều Nguyễn (Thế Kỷ 19)',
      description:
        '<p>Tượng Phật Bà Quan Âm bằng đồng thời Nguyễn, có giá trị lịch sử và nghệ thuật cao.</p><ul><li>Chiều cao 45cm</li><li>Chất liệu đồng đỏ</li><li>Thời Nguyễn (1802-1945)</li><li>Tạo hình tinh xảo</li><li>Có giấy chứng nhận nguồn gốc</li></ul>',
      categoryId: categories.children[9]._id, // Đồ cổ
      sellerId: users.sellers[3]._id,
      images: [
        'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=800',
        'https://images.unsplash.com/photo-1549298916-c6c5f85fa167?w=800',
        'https://images.unsplash.com/photo-1605792657660-596af9009e82?w=800',
        'https://images.unsplash.com/photo-1615880484746-a134be9a6ecf?w=800',
      ],
      startPrice: 200000000,
      currentPrice: 200000000,
      stepPrice: 5000000,
      startTime: now,
      endTime: endTime2027,
      autoExtend: false,
      allowUnratedBidders: false,
      status: 'active',
      bidCount: 0,
    },

    // ========== Fashion House - Túi xách ==========
    {
      name: 'Louis Vuitton Neverfull MM Monogram Canvas',
      description:
        '<p>Túi tote iconic của Louis Vuitton, thiết kế sang trọng, dung tích lớn, phù hợp đi làm và du lịch.</p><ul><li>Chất liệu Monogram Canvas</li><li>Size MM (31x29x17cm)</li><li>Quai da Vachetta</li><li>Túi pouch kèm theo</li><li>Made in France</li></ul>',
      categoryId: categories.children[6]._id, // Túi xách
      sellerId: users.sellers[4]._id,
      images: [
        'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800',
        'https://images.unsplash.com/photo-1564422167509-4f3827c39184?w=800',
        'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800',
        'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800',
      ],
      startPrice: 35000000,
      currentPrice: 35000000,
      stepPrice: 1000000,
      buyNowPrice: 45000000,
      startTime: now,
      endTime: endTime2027,
      autoExtend: true,
      allowUnratedBidders: true,
      status: 'active',
      bidCount: 0,
    },
    {
      name: 'Hermès Birkin 30 Togo Leather - Gold Hardware',
      description:
        '<p>Chiếc túi xa xỉ nhất thế giới - Hermès Birkin 30, chất liệu da Togo cao cấp.</p><ul><li>Da Togo Leather bền đẹp</li><li>Size 30cm</li><li>Khóa vàng Gold Hardware</li><li>Màu Étoupe trung tính</li><li>Handmade tại Paris</li></ul>',
      categoryId: categories.children[6]._id,
      sellerId: users.sellers[4]._id,
      images: [
        'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800',
        'https://images.unsplash.com/photo-1591561954557-26941169b49e?w=800',
        'https://images.unsplash.com/photo-1564422167509-4f3827c39184?w=800',
        'https://images.unsplash.com/photo-1614179524305-ed7d51d0edc5?w=800',
      ],
      startPrice: 800000000,
      currentPrice: 800000000,
      stepPrice: 20000000,
      startTime: now,
      endTime: endTime2027,
      autoExtend: true,
      allowUnratedBidders: false,
      status: 'active',
      bidCount: 0,
    },
    {
      name: 'Chanel Classic Flap Medium Caviar Leather',
      description:
        '<p>Túi Chanel Classic Flap huyền thoại, biểu tượng của thời trang sang trọng.</p><ul><li>Da Caviar dập vân</li><li>Size Medium 25cm</li><li>Dây xích vàng</li><li>Khóa CC classic</li><li>Made in Italy</li></ul>',
      categoryId: categories.children[6]._id,
      sellerId: users.sellers[4]._id,
      images: [
        'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800',
        'https://images.unsplash.com/photo-1585487000143-c4f09e7e3326?w=800',
        'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800',
        'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800',
      ],
      startPrice: 120000000,
      currentPrice: 120000000,
      stepPrice: 3000000,
      buyNowPrice: 150000000,
      startTime: now,
      endTime: endTime2027,
      autoExtend: false,
      allowUnratedBidders: false,
      status: 'active',
      bidCount: 0,
    },

    // ========== Thêm 5 sản phẩm mới ==========
    {
      name: 'Sony PlayStation 5 Slim Digital Edition',
      description:
        '<p>PlayStation 5 phiên bản Slim mới nhất, thiết kế gọn nhẹ hơn với hiệu năng mạnh mẽ.</p><ul><li>CPU AMD Zen 2 8-core</li><li>GPU 10.28 TFLOPS RDNA 2</li><li>SSD 1TB siêu nhanh</li><li>Ray tracing thời gian thực</li><li>2 tay cầm DualSense</li></ul>',
      categoryId: categories.children[3]._id, // Máy chơi game
      sellerId: users.sellers[0]._id,
      images: [
        'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800',
        'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=800',
        'https://images.unsplash.com/photo-1622297845775-5ff3fef71d13?w=800',
        'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800',
      ],
      startPrice: 12000000,
      currentPrice: 12000000,
      stepPrice: 300000,
      buyNowPrice: 15000000,
      startTime: now,
      endTime: endTime2027,
      autoExtend: true,
      allowUnratedBidders: true,
      status: 'active',
      bidCount: 0,
    },
    {
      name: 'Canon EOS R5 Mark II - Body Only',
      description:
        '<p>Máy ảnh mirrorless chuyên nghiệp Canon EOS R5 Mark II với cảm biến full-frame 45MP.</p><ul><li>Cảm biến Full-frame 45MP</li><li>Video 8K 30fps RAW</li><li>IBIS 8 stops chống rung</li><li>AF Eye Control mới</li><li>Chụp 30fps burst</li></ul>',
      categoryId: categories.children[1]._id, // Máy tính xách tay (hoặc tạo category camera)
      sellerId: users.sellers[0]._id,
      images: [
        'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800',
        'https://images.unsplash.com/photo-1606049032802-ff28f4099e93?w=800',
        'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=800',
        'https://images.unsplash.com/photo-1613141411244-0e4b6782d17e?w=800',
      ],
      startPrice: 95000000,
      currentPrice: 95000000,
      stepPrice: 2000000,
      startTime: now,
      endTime: endTime2027,
      autoExtend: false,
      allowUnratedBidders: false,
      status: 'active',
      bidCount: 0,
    },
    {
      name: 'Gucci Dionysus GG Supreme Medium Shoulder Bag',
      description:
        '<p>Túi vai Gucci Dionysus với họa tiết GG Supreme đặc trưng và chi tiết hổ phách độc đáo.</p><ul><li>Canvas GG Supreme</li><li>Size Medium</li><li>Khóa tiger head</li><li>Dây xích có thể tháo</li><li>Made in Italy</li></ul>',
      categoryId: categories.children[6]._id, // Túi xách
      sellerId: users.sellers[4]._id,
      images: [
        'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800',
        'https://images.unsplash.com/photo-1591561954557-26941169b49e?w=800',
        'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800',
        'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800',
      ],
      startPrice: 55000000,
      currentPrice: 55000000,
      stepPrice: 1500000,
      buyNowPrice: 70000000,
      startTime: now,
      endTime: endTime2027,
      autoExtend: true,
      allowUnratedBidders: true,
      status: 'active',
      bidCount: 0,
    },
    {
      name: 'Fossil Gen 6 Smartwatch - Stainless Steel',
      description:
        '<p>Đồng hồ thông minh Fossil Gen 6 với Wear OS, thiết kế thời trang kết hợp công nghệ.</p><ul><li>Chip Snapdragon Wear 4100+</li><li>Màn hình AMOLED 1.28 inch</li><li>Wear OS by Google</li><li>Theo dõi sức khỏe toàn diện</li><li>Pin 24 giờ</li></ul>',
      categoryId: categories.children[5]._id, // Đồng hồ
      sellerId: users.sellers[1]._id,
      images: [
        'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800',
        'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800',
        'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800',
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
      ],
      startPrice: 6000000,
      currentPrice: 6000000,
      stepPrice: 150000,
      buyNowPrice: 8000000,
      startTime: now,
      endTime: endTime2027,
      autoExtend: true,
      allowUnratedBidders: true,
      status: 'active',
      bidCount: 0,
    },
    {
      name: 'Bộ Bàn Ghế Gỗ Gụ Tự Nhiên - Phong Cách Tối Giản',
      description:
        '<p>Bộ bàn ăn gỗ gụ tự nhiên cao cấp, thiết kế hiện đại tối giản, phù hợp không gian sang trọng.</p><ul><li>Chất liệu gỗ gụ tự nhiên</li><li>1 bàn + 6 ghế</li><li>Kích thước bàn 180x90cm</li><li>Sơn PU bền màu</li><li>Bảo hành 2 năm</li></ul>',
      categoryId: categories.children[15]._id, // Nội thất
      sellerId: users.sellers[3]._id,
      images: [
        'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800',
        'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800',
        'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=800',
        'https://images.unsplash.com/photo-1551298698-66b830a4f11c?w=800',
      ],
      startPrice: 45000000,
      currentPrice: 45000000,
      stepPrice: 1000000,
      startTime: now,
      endTime: endTime2027,
      autoExtend: false,
      allowUnratedBidders: true,
      status: 'active',
      bidCount: 0,
    },

    // ========== Thêm 10 sản phẩm mới (2 cho mỗi danh mục cha) ==========
    // Điện tử (2 products)
    {
      name: 'Apple AirPods Pro 2nd Gen - USB-C',
      description:
        '<p>AirPods Pro thế hệ 2 với chip H2, chống ồn chủ động ANC 2x mạnh hơn, cổng sạc USB-C.</p><ul><li>Chip H2 thế hệ mới</li><li>ANC chống ồn chủ động</li><li>Spatial Audio 3D</li><li>Pin 30 giờ với case</li><li>Chống nước IPX4</li></ul>',
      categoryId: categories.parents[0]._id, // Điện tử
      sellerId: users.sellers[0]._id,
      images: [
        'https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=800',
        'https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?w=800',
        'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=800',
        'https://images.unsplash.com/photo-1625177675850-fa585f8ca42b?w=800',
      ],
      startPrice: 5500000,
      currentPrice: 5500000,
      stepPrice: 100000,
      buyNowPrice: 7000000,
      startTime: now,
      endTime: endTime2027,
      autoExtend: true,
      allowUnratedBidders: true,
      status: 'active',
      bidCount: 0,
    },
    {
      name: 'Sony WH-1000XM5 Wireless Headphones - Midnight Black',
      description:
        '<p>Tai nghe cao cấp Sony WH-1000XM5 với chống ồn hàng đầu, chất lượng âm thanh Hi-Res.</p><ul><li>8 microphones chống ồn</li><li>LDAC Hi-Res Audio</li><li>Pin 30 giờ</li><li>Sạc nhanh 3 phút = 3 giờ nghe</li><li>Multipoint connection</li></ul>',
      categoryId: categories.parents[0]._id, // Điện tử
      sellerId: users.sellers[0]._id,
      images: [
        'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800',
        'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800',
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
        'https://images.unsplash.com/photo-1545127398-14699f92334b?w=800',
      ],
      startPrice: 7000000,
      currentPrice: 7000000,
      stepPrice: 150000,
      buyNowPrice: 9000000,
      startTime: now,
      endTime: endTime2027,
      autoExtend: true,
      allowUnratedBidders: true,
      status: 'active',
      bidCount: 0,
    },

    // Thời trang (2 products)
    {
      name: 'Ray-Ban Aviator Classic Gold - Kính Mát Hàng Đầu',
      description:
        '<p>Kính mát Ray-Ban Aviator phong cách phi công classic, gọng vàng cao cấp.</p><ul><li>Gọng kim loại mạ vàng</li><li>Tròng thủy tinh chống UV</li><li>Size 58mm standard</li><li>Made in Italy</li><li>Case và khăn lau kèm theo</li></ul>',
      categoryId: categories.parents[1]._id, // Thời trang
      sellerId: users.sellers[4]._id,
      images: [
        'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800',
        'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800',
        'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=800',
        'https://images.unsplash.com/photo-1577803645773-f96470509666?w=800',
      ],
      startPrice: 3500000,
      currentPrice: 3500000,
      stepPrice: 100000,
      buyNowPrice: 5000000,
      startTime: now,
      endTime: endTime2027,
      autoExtend: false,
      allowUnratedBidders: true,
      status: 'active',
      bidCount: 0,
    },
    {
      name: 'Áo Khoác Da Nam Cao Cấp - Leather Jacket',
      description:
        '<p>Áo khoác da bò thật 100%, phong cách biker hiện đại, chất lượng cao cấp.</p><ul><li>Da bò thật Nappa</li><li>Lót lụa cao cấp</li><li>Khóa kéo YKK Nhật</li><li>Size M, L, XL</li><li>Bảo hành 2 năm</li></ul>',
      categoryId: categories.parents[1]._id, // Thời trang
      sellerId: users.sellers[4]._id,
      images: [
        'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800',
        'https://images.unsplash.com/photo-1520975954732-35dd22299614?w=800',
        'https://images.unsplash.com/photo-1594938328870-f3a0d55d0d1f?w=800',
        'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800',
      ],
      startPrice: 8000000,
      currentPrice: 8000000,
      stepPrice: 200000,
      buyNowPrice: 12000000,
      startTime: now,
      endTime: endTime2027,
      autoExtend: true,
      allowUnratedBidders: true,
      status: 'active',
      bidCount: 0,
    },

    // Nghệ thuật (2 products)
    {
      name: 'Bình Gốm Sứ Bát Tràng - Họa Tiết Rồng Phượng',
      description:
        '<p>Bình gốm sứ Bát Tràng cao cấp, vẽ tay họa tiết rồng phượng truyền thống.</p><ul><li>Chiều cao 45cm</li><li>Gốm sứ Bát Tràng</li><li>Vẽ tay thủ công</li><li>Màu men xanh cổ</li><li>Có giấy chứng nhận</li></ul>',
      categoryId: categories.parents[2]._id, // Nghệ thuật
      sellerId: users.sellers[3]._id,
      images: [
        'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=800',
        'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=800',
        'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800',
        'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=800',
      ],
      startPrice: 15000000,
      currentPrice: 15000000,
      stepPrice: 500000,
      startTime: now,
      endTime: endTime2027,
      autoExtend: false,
      allowUnratedBidders: false,
      status: 'active',
      bidCount: 0,
    },
    {
      name: 'Tranh Thêu Tay Hoa Sen - Handmade Embroidery',
      description:
        '<p>Tranh thêu tay Việt Nam, họa tiết hoa sen thuần Việt, công phu tỉ mỉ.</p><ul><li>Kích thước 60x90cm</li><li>Thêu tay 100%</li><li>Khung gỗ mít</li><li>Thời gian thêu 3 tháng</li><li>Chỉ lụa cao cấp</li></ul>',
      categoryId: categories.parents[2]._id, // Nghệ thuật
      sellerId: users.sellers[3]._id,
      images: [
        'https://images.unsplash.com/photo-1582738411706-bfc8e691d1c2?w=800',
        'https://images.unsplash.com/photo-1533158326339-7f3cf2404354?w=800',
        'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=800',
        'https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=800',
      ],
      startPrice: 12000000,
      currentPrice: 12000000,
      stepPrice: 300000,
      startTime: now,
      endTime: endTime2027,
      autoExtend: true,
      allowUnratedBidders: true,
      status: 'active',
      bidCount: 0,
    },

    // Xe cộ (2 products)
    {
      name: 'Xe Đạp Đua Giant TCR Advanced Pro - Carbon Frame',
      description:
        '<p>Xe đạp đua Giant cao cấp, khung carbon siêu nhẹ, groupset Shimano 105.</p><ul><li>Khung carbon Advanced Grade</li><li>Groupset Shimano 105 R7000</li><li>Trọng lượng 8.5kg</li><li>Size M (170-180cm)</li><li>Bảo hành 5 năm khung</li></ul>',
      categoryId: categories.parents[3]._id, // Xe cộ
      sellerId: users.sellers[2]._id,
      images: [
        'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=800',
        'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800',
        'https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?w=800',
        'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800',
      ],
      startPrice: 35000000,
      currentPrice: 35000000,
      stepPrice: 1000000,
      buyNowPrice: 45000000,
      startTime: now,
      endTime: endTime2027,
      autoExtend: true,
      allowUnratedBidders: true,
      status: 'active',
      bidCount: 0,
    },
    {
      name: 'Yamaha NVX 155 VVA 2024 - Phiên Bản Đặc Biệt',
      description:
        '<p>Xe tay ga thể thao Yamaha NVX 155 phiên bản 2024, động cơ VVA mạnh mẽ.</p><ul><li>Động cơ 155cc VVA</li><li>Công suất 15.4 HP</li><li>ABS 2 kênh</li><li>Phanh đĩa trước sau</li><li>Bảo hành 3 năm chính hãng</li></ul>',
      categoryId: categories.parents[3]._id, // Xe cộ
      sellerId: users.sellers[1]._id,
      images: [
        'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800',
        'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=800',
        'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=800',
        'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800',
      ],
      startPrice: 50000000,
      currentPrice: 50000000,
      stepPrice: 1000000,
      buyNowPrice: 58000000,
      startTime: now,
      endTime: endTime2027,
      autoExtend: false,
      allowUnratedBidders: true,
      status: 'active',
      bidCount: 0,
    },

    // Nhà cửa & Đời sống (2 products)
    {
      name: 'Máy Pha Cà Phê Breville Barista Express - Espresso Machine',
      description:
        '<p>Máy pha cà phê espresso cao cấp Breville, tích hợp máy xay hạt, chuyên nghiệp.</p><ul><li>Máy xay Conical Burr</li><li>Áp suất 15 bar</li><li>Bình hơi sữa tự động</li><li>Nhiệt độ PID chính xác</li><li>Bảo hành 2 năm</li></ul>',
      categoryId: categories.parents[4]._id, // Nhà cửa & Đời sống
      sellerId: users.sellers[3]._id,
      images: [
        'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800',
        'https://images.unsplash.com/photo-1585493649115-e3cd22718e3e?w=800',
        'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800',
        'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800',
      ],
      startPrice: 15000000,
      currentPrice: 15000000,
      stepPrice: 500000,
      buyNowPrice: 20000000,
      startTime: now,
      endTime: endTime2027,
      autoExtend: true,
      allowUnratedBidders: true,
      status: 'active',
      bidCount: 0,
    },
    {
      name: 'Đèn Chùm Pha Lê Cao Cấp - Crystal Chandelier',
      description:
        '<p>Đèn chùm pha lê châu Âu, thiết kế sang trọng, ánh sáng lung linh rực rỡ.</p><ul><li>Pha lê K9 cao cấp</li><li>Đường kính 80cm</li><li>12 bóng LED</li><li>Khung inox mạ vàng</li><li>Phù hợp trần 3-4m</li></ul>',
      categoryId: categories.parents[4]._id, // Nhà cửa & Đời sống
      sellerId: users.sellers[3]._id,
      images: [
        'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800',
        'https://images.unsplash.com/photo-1565183928294-7d22ca3f4824?w=800',
        'https://images.unsplash.com/photo-1540932239986-30128078f3c5?w=800',
        'https://images.unsplash.com/photo-1524485258441-e25ff2e71832?w=800',
      ],
      startPrice: 25000000,
      currentPrice: 25000000,
      stepPrice: 500000,
      startTime: now,
      endTime: endTime2027,
      autoExtend: false,
      allowUnratedBidders: true,
      status: 'active',
      bidCount: 0,
    },

    
    {
      name: 'iPad Pro M4',
      description:
        '<p>iPad Pro với chip M4 mạnh mẽ, màn hình Ultra Retina XDR, thiết kế mỏng nhẹ.</p><ul><li>Chip M4 thế hệ mới</li><li>Màn hình Ultra Retina XDR 11 inch</li><li>Camera 12MP với LiDAR</li><li>Hỗ trợ Apple Pencil Pro</li><li>USB-C Thunderbolt</li></ul>',
      categoryId: categories.children[2]._id, // Máy tính bảng
      sellerId: users.sellers[0]._id,
      images: [
        'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800',
        'https://2tmobile.com/wp-content/uploads/2024/04/ipad-pro-2024-m4-silver-space-black-2tmobile.jpg',
        'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800',
        'https://images.unsplash.com/photo-1587033411391-5d9e51cce126?w=800',
      ],
      startPrice: 5000000,
      currentPrice: 5000000,
      stepPrice: 200000,
      buyNowPrice: 20000000,
      startTime: now,
      endTime: endTime2027,
      autoExtend: true,
      allowUnratedBidders: true,
      status: 'active',
      bidCount: 0,
    },
  ]);

  console.log(`   ✅ Created ${products.length} products`);

  return products;
}
