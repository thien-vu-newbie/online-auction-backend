import { Model } from 'mongoose';
import { Category } from '../../categories/schemas/category.schema';

export async function seedCategories(categoryModel: Model<Category>) {
  console.log('📂 Seeding categories...');
  
  // Clear existing categories
  await categoryModel.deleteMany({});

  // Create parent categories
  const parentCategories = await categoryModel.insertMany([
    { name: 'Điện tử', parentId: null, productCount: 0 },
    { name: 'Thời trang', parentId: null, productCount: 0 },
    { name: 'Nghệ thuật', parentId: null, productCount: 0 },
    { name: 'Xe cộ', parentId: null, productCount: 0 },
    { name: 'Nhà cửa & Đời sống', parentId: null, productCount: 0 },
  ]);

  console.log(`   ✅ Created ${parentCategories.length} parent categories`);

  // Create child categories
  const childCategories = await categoryModel.insertMany([
    // Điện tử
    {
      name: 'Điện thoại di động',
      parentId: parentCategories[0]._id,
      productCount: 0,
    },
    {
      name: 'Máy tính xách tay',
      parentId: parentCategories[0]._id,
      productCount: 0,
    },
    {
      name: 'Máy tính bảng',
      parentId: parentCategories[0]._id,
      productCount: 0,
    },
    {
      name: 'Phụ kiện điện tử',
      parentId: parentCategories[0]._id,
      productCount: 0,
    },
    // Thời trang
    {
      name: 'Giày dép',
      parentId: parentCategories[1]._id,
      productCount: 0,
    },
    {
      name: 'Đồng hồ',
      parentId: parentCategories[1]._id,
      productCount: 0,
    },
    {
      name: 'Túi xách',
      parentId: parentCategories[1]._id,
      productCount: 0,
    },
    {
      name: 'Trang sức',
      parentId: parentCategories[1]._id,
      productCount: 0,
    },
    // Nghệ thuật
    {
      name: 'Tranh vẽ',
      parentId: parentCategories[2]._id,
      productCount: 0,
    },
    {
      name: 'Đồ cổ',
      parentId: parentCategories[2]._id,
      productCount: 0,
    },
    {
      name: 'Tác phẩm điêu khắc',
      parentId: parentCategories[2]._id,
      productCount: 0,
    },
    // Xe cộ
    {
      name: 'Ô tô',
      parentId: parentCategories[3]._id,
      productCount: 0,
    },
    {
      name: 'Xe máy',
      parentId: parentCategories[3]._id,
      productCount: 0,
    },
    {
      name: 'Xe đạp',
      parentId: parentCategories[3]._id,
      productCount: 0,
    },
    // Nhà cửa & Đời sống
    {
      name: 'Nội thất',
      parentId: parentCategories[4]._id,
      productCount: 0,
    },
    {
      name: 'Đồ gia dụng',
      parentId: parentCategories[4]._id,
      productCount: 0,
    },
  ]);

  console.log(`   ✅ Created ${childCategories.length} child categories`);

  return {
    parents: parentCategories,
    children: childCategories,
  };
}
