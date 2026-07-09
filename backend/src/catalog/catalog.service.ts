import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductStatus } from '@prisma/client';

@Injectable()
export class CatalogService {
  constructor(private prisma: PrismaService) {}

  async getProducts(query: {
    search?: string;
    categorySlug?: string;
    collectionSlug?: string;
    lengths?: string[];
    textures?: string[];
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
    limit?: number;
    cursor?: string;
  }) {
    const limit = query.limit ? Number(query.limit) : 24;
    const where: any = {
      status: ProductStatus.PUBLISHED,
    };

    // 1. Text Search
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // 2. Category Filter
    if (query.categorySlug) {
      where.category = { slug: query.categorySlug };
    }

    // 3. Collection Filter
    if (query.collectionSlug) {
      where.collection = { slug: query.collectionSlug };
    }

    // 4. Variant Attributes (Length, Texture) & Price Filters
    const variantWhere: any = {};

    if (query.lengths && query.lengths.length > 0) {
      variantWhere.OR = query.lengths.map((len) => ({
        attributes: {
          path: ['length'],
          equals: len,
        },
      }));
    }

    if (query.textures && query.textures.length > 0) {
      const textureConditions = query.textures.map((tex) => ({
        attributes: {
          path: ['texture'],
          equals: tex,
        },
      }));
      if (variantWhere.OR) {
        // If we already have length filters, we must intersect them
        // In Prisma, we can nest them inside AND
        variantWhere.AND = [
          { OR: variantWhere.OR },
          { OR: textureConditions },
        ];
        delete variantWhere.OR;
      } else {
        variantWhere.OR = textureConditions;
      }
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      variantWhere.price = {};
      if (query.minPrice !== undefined) {
        variantWhere.price.gte = Number(query.minPrice);
      }
      if (query.maxPrice !== undefined) {
        variantWhere.price.lte = Number(query.maxPrice);
      }
    }

    // Connect variant filters back to product query
    if (Object.keys(variantWhere).length > 0) {
      where.variants = {
        some: variantWhere,
      };
    }

    // 5. Cursor Pagination
    const paginateParams: any = {};
    if (query.cursor) {
      paginateParams.cursor = { id: query.cursor };
      paginateParams.skip = 1; // Skip the cursor element itself
    }

    // 6. Sorting
    let orderBy: any = { createdAt: 'desc' }; // default: newest
    if (query.sort) {
      switch (query.sort) {
        case 'price_asc':
          orderBy = { variants: { _min: { price: 'asc' } } };
          break;
        case 'price_desc':
          orderBy = { variants: { _min: { price: 'desc' } } };
          break;
        case 'newest':
          orderBy = { createdAt: 'desc' };
          break;
        case 'rating_desc':
          orderBy = { reviews: { _count: 'desc' } }; // fallback for rating sorting
          break;
      }
    }

    const products = await this.prisma.product.findMany({
      where,
      take: limit,
      ...paginateParams,
      orderBy,
      include: {
        category: true,
        collection: true,
        variants: {
          include: {
            images: { orderBy: { position: 'asc' } },
            inventory: true,
          },
        },
        reviews: {
          select: { rating: true },
        },
      },
    });

    const nextCursor = products.length === limit ? products[products.length - 1].id : null;

    return {
      products,
      nextCursor,
    };
  }

  async getProductBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        collection: true,
        variants: {
          include: {
            images: { orderBy: { position: 'asc' } },
            inventory: true,
          },
        },
        reviews: {
          include: {
            photos: true,
            customer: {
              select: { id: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product || product.status !== ProductStatus.PUBLISHED) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async getCollections() {
    return this.prisma.collection.findMany({
      where: { published: true },
    });
  }

  async getCollectionBySlug(slug: string) {
    const collection = await this.prisma.collection.findUnique({
      where: { slug },
    });
    if (!collection || !collection.published) {
      throw new NotFoundException('Collection not found');
    }
    return collection;
  }

  async getCategories() {
    return this.prisma.category.findMany({
      where: { published: true },
    });
  }

  async getCategoryBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
    });
    if (!category || !category.published) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }
}
