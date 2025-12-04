import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  // Admin: Tạo category mới
  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    // Validate parent category exists (nếu có)
    if (createCategoryDto.parentId) {
      const parentCategory = await this.categoryModel.findById(createCategoryDto.parentId);
      
      if (!parentCategory) {
        throw new NotFoundException('Parent category not found');
      }

      // Kiểm tra parent category phải là level 1 (không có parentId)
      if (parentCategory.parentId) {
        throw new BadRequestException('Cannot create 3-level category. Parent must be level 1.');
      }
    }

    const category = new this.categoryModel(createCategoryDto);
    return category.save();
  }

  // Public: Lấy tất cả categories (2-level hierarchy)
  async findAll(): Promise<any[]> {
    // Lấy tất cả categories
    const categories = await this.categoryModel.find().lean();

    // Tạo cấu trúc 2 cấp
    const level1Categories = categories.filter(cat => !cat.parentId);
    
    const result = level1Categories.map(parent => ({
      ...parent,
      children: categories.filter(
        cat => cat.parentId && cat.parentId.toString() === parent._id.toString()
      ),
    }));

    return result;
  }

  // Public: Lấy category theo ID
  async findOne(id: string): Promise<Category> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid category ID');
    }

    const category = await this.categoryModel.findById(id);
    
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  // Admin: Cập nhật category
  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid category ID');
    }

    // Validate parent category (nếu update parentId)
    if (updateCategoryDto.parentId) {
      const parentCategory = await this.categoryModel.findById(updateCategoryDto.parentId);
      
      if (!parentCategory) {
        throw new NotFoundException('Parent category not found');
      }

      // Không cho phép set parent là chính nó
      if (updateCategoryDto.parentId === id) {
        throw new BadRequestException('Category cannot be its own parent');
      }

      // Kiểm tra parent category phải là level 1
      if (parentCategory.parentId) {
        throw new BadRequestException('Parent must be level 1 category');
      }
    }

    const category = await this.categoryModel.findByIdAndUpdate(
      id,
      updateCategoryDto,
      { new: true },
    );

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  // Admin: Xóa category (chỉ khi productCount = 0)
  async remove(id: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid category ID');
    }

    const category = await this.categoryModel.findById(id);

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Mục 4.1 - Không được xóa category đã có sản phẩm
    if (category.productCount > 0) {
      throw new BadRequestException(
        `Cannot delete category with ${category.productCount} product(s). Remove products first.`
      );
    }

    // Kiểm tra xem có category con không
    const childrenCount = await this.categoryModel.countDocuments({ parentId: category._id });
    
    if (childrenCount > 0) {
      throw new BadRequestException(
        `Cannot delete category with ${childrenCount} subcategory(ies). Remove subcategories first.`
      );
    }

    await this.categoryModel.findByIdAndDelete(id);

    return { message: 'Category deleted successfully' };
  }

  // Helper: Increment product count khi thêm sản phẩm
  async incrementProductCount(categoryId: string): Promise<void> {
    await this.categoryModel.findByIdAndUpdate(
      categoryId,
      { $inc: { productCount: 1 } },
    );
  }

  // Helper: Decrement product count khi xóa sản phẩm
  async decrementProductCount(categoryId: string): Promise<void> {
    await this.categoryModel.findByIdAndUpdate(
      categoryId,
      { $inc: { productCount: -1 } },
    );
  }
}
