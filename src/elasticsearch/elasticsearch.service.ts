import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService as NestElasticsearchService } from '@nestjs/elasticsearch';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product } from '../products/schemas/product.schema';
import { Category, CategoryDocument } from '../categories/schemas/category.schema';

export interface ProductSearchBody {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  categoryName: string;
  sellerId: string;
  sellerName: string;
  currentPrice: number;
  buyNowPrice?: number;
  startTime: Date;
  endTime: Date;
  status: string;
  bidCount: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ElasticsearchService {
  private readonly logger = new Logger(ElasticsearchService.name);
  private readonly index = 'products';

  constructor(
    private readonly esService: NestElasticsearchService,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  async createIndex() {
    const checkIndex = await this.esService.indices.exists({ index: this.index });
    
    if (checkIndex) {
      this.logger.log(`Index "${this.index}" already exists`);
      return;
    }

    await this.esService.indices.create({
      index: this.index,
      body: {
        settings: {
          analysis: {
            analyzer: {
              vietnamese_analyzer: {
                type: 'custom',
                tokenizer: 'standard',
                filter: ['lowercase', 'asciifolding'],
              },
            },
          },
        },
        mappings: {
          properties: {
            id: { type: 'keyword' },
            name: { 
              type: 'text',
              analyzer: 'vietnamese_analyzer',
              fields: {
                keyword: { type: 'keyword' },
              },
            },
            description: { 
              type: 'text',
              analyzer: 'vietnamese_analyzer',
            },
            categoryId: { type: 'keyword' },
            categoryName: { 
              type: 'text',
              analyzer: 'vietnamese_analyzer',
            },
            sellerId: { type: 'keyword' },
            sellerName: { type: 'text' },
            currentPrice: { type: 'long' },
            buyNowPrice: { type: 'long' },
            startTime: { type: 'date' },
            endTime: { type: 'date' },
            status: { type: 'keyword' },
            bidCount: { type: 'integer' },
            createdAt: { type: 'date' },
            updatedAt: { type: 'date' },
          },
        },
      } as any,
    } as any);

    this.logger.log(`Index "${this.index}" created successfully`);
  }

  async indexProduct(product: any): Promise<void> {
    try {
      const body: ProductSearchBody = {
        id: product._id.toString(),
        name: product.name,
        description: product.description,
        categoryId: product.categoryId?._id?.toString() || product.categoryId?.toString(),
        categoryName: product.categoryId?.name || '',
        sellerId: product.sellerId?._id?.toString() || product.sellerId?.toString(),
        sellerName: product.sellerId?.fullName || '',
        currentPrice: product.currentPrice,
        buyNowPrice: product.buyNowPrice,
        startTime: product.startTime,
        endTime: product.endTime,
        status: product.status,
        bidCount: product.bidCount,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      };

      await this.esService.index({
        index: this.index,
        id: product._id.toString(),
        body,
      } as any);

      this.logger.debug(`Product ${product._id} indexed successfully`);
    } catch (error) {
      this.logger.error(`Error indexing product ${product._id}:`, error);
      throw error;
    }
  }

  async updateProduct(productId: string, product: Partial<ProductSearchBody>): Promise<void> {
    try {
      await this.esService.update({
        index: this.index,
        id: productId,
        body: {
          doc: product,
        },
      } as any);

      this.logger.debug(`Product ${productId} updated successfully`);
    } catch (error) {
      this.logger.error(`Error updating product ${productId}:`, error);
      throw error;
    }
  }

  async deleteProduct(productId: string): Promise<void> {
    try {
      await this.esService.delete({
        index: this.index,
        id: productId,
      });

      this.logger.debug(`Product ${productId} deleted successfully`);
    } catch (error) {
      this.logger.error(`Error deleting product ${productId}:`, error);
      throw error;
    }
  }

  async search(params: {
    query?: string;
    categoryId?: string;
    sortBy?: string;
    page?: number;
    limit?: number;
  }): Promise<{ products: any[]; total: number }> {
    const { query, categoryId, sortBy = 'created_desc', page = 1, limit = 10 } = params;

    const must: any[] = [];

    if (query) {
        must.push({
    multi_match: {
      query,
      fields: ['name^5', 'description^2'],
      operator: 'and',   
      fuzziness: 'AUTO',
    },
  });
    }

    if (categoryId) {
      // Check if this is a parent category (has children)
      const childCategories = await this.categoryModel
        .find({ parentId: new Types.ObjectId(categoryId) })
        .select('_id')
        .lean();
      
      if (childCategories.length > 0) {
        // Parent category: search in parent + all children
        const categoryIds = [categoryId, ...childCategories.map(c => c._id.toString())];
        must.push({ terms: { categoryId: categoryIds } });
      } else {
        // Child category or leaf: exact match
        must.push({ term: { categoryId } });
      }
    }

    // Build sort
    const sort: any[] = [];
    switch (sortBy) {
      case 'endTime_desc':
        sort.push({ endTime: 'desc' });
        break;
      case 'price_asc':
        sort.push({ currentPrice: 'asc' });
        break;
      case 'created_desc':
      default:
        sort.push({ createdAt: 'desc' });
        break;
    }

    const from = (page - 1) * limit;

    try {
      const { hits } = await this.esService.search({
        index: this.index,
        body: {
          query: {
            bool: { must },
          },
          sort,
          from,
          size: limit,
        },
      } as any);

      const products = hits.hits.map((hit: any) => ({
        _id: hit._source.id,
        ...hit._source,
        _score: hit._score,
      }));

      return {
        products,
        total: typeof hits.total === 'number' ? hits.total : hits.total?.value || 0,
      };
    } catch (error) {
      this.logger.error('Error searching products:', error);
      throw error;
    }
  }

  async bulkIndex(products: any[]): Promise<void> {
    const body = products.flatMap((product) => [
      { index: { _index: this.index, _id: product._id.toString() } },
      {
        id: product._id.toString(),
        name: product.name,
        description: product.description,
        categoryId: product.categoryId?._id?.toString() || product.categoryId?.toString(),
        categoryName: product.categoryId?.name || '',
        sellerId: product.sellerId?._id?.toString() || product.sellerId?.toString(),
        sellerName: product.sellerId?.fullName || '',
        currentPrice: product.currentPrice,
        buyNowPrice: product.buyNowPrice,
        startTime: product.startTime,
        endTime: product.endTime,
        status: product.status,
        bidCount: product.bidCount,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      },
    ]);

    await this.esService.bulk({ body });
    this.logger.log(`Bulk indexed ${products.length} products`);
  }

  async deleteIndex(): Promise<void> {
    try {
      const exists = await this.esService.indices.exists({ index: this.index });
      if (!exists) {
        this.logger.log(`Index "${this.index}" does not exist, skip delete`);
        return;
      }

      await this.esService.indices.delete({ index: this.index });
      this.logger.log(`Index "${this.index}" deleted successfully`);
    } catch (error) {
      this.logger.error(`Error deleting index ${this.index}:`, error);
      throw error;
    }
  }
}
