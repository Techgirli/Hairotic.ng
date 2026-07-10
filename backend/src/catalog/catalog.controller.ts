import { Controller, Get, Param, Query } from '@nestjs/common';
import { CatalogService } from './catalog.service';

@Controller()
export class CatalogController {
  constructor(private catalogService: CatalogService) {}

  @Get('products')
  async getProducts(
    @Query('search') search?: string,
    @Query('categorySlug') categorySlug?: string,
    @Query('collectionSlug') collectionSlug?: string,
    @Query('lengths') lengthsInput?: string | string[],
    @Query('textures') texturesInput?: string | string[],
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('sort') sort?: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    // Normalize length query parameter into string array
    const lengths = lengthsInput
      ? Array.isArray(lengthsInput)
        ? lengthsInput
        : [lengthsInput]
      : [];

    // Normalize texture query parameter into string array
    const textures = texturesInput
      ? Array.isArray(texturesInput)
        ? texturesInput
        : [texturesInput]
      : [];

    const minPriceNum = minPrice ? Number(minPrice) : undefined;
    const maxPriceNum = maxPrice ? Number(maxPrice) : undefined;

    return this.catalogService.getProducts({
      search,
      categorySlug,
      collectionSlug,
      lengths,
      textures,
      minPrice: minPriceNum,
      maxPrice: maxPriceNum,
      sort,
      limit: limit ? Number(limit) : undefined,
      cursor,
    });
  }

  @Get('products/:slug')
  async getProductBySlug(@Param('slug') slug: string) {
    return this.catalogService.getProductBySlug(slug);
  }

  @Get('collections')
  async getCollections() {
    return this.catalogService.getCollections();
  }

  @Get('collections/:slug')
  async getCollectionBySlug(@Param('slug') slug: string) {
    return this.catalogService.getCollectionBySlug(slug);
  }

  @Get('categories')
  async getCategories() {
    return this.catalogService.getCategories();
  }

  @Get('categories/:slug')
  async getCategoryBySlug(@Param('slug') slug: string) {
    return this.catalogService.getCategoryBySlug(slug);
  }
}
