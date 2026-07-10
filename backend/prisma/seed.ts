import { PrismaClient, Role, ProductStatus, OrderStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/hairotic?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // 1. Clean existing records
  await prisma.auditLog.deleteMany({});
  await prisma.customerNote.deleteMany({});
  await prisma.reviewPhoto.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.orderStatusHistory.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.cart.deleteMany({});
  await prisma.wishlist.deleteMany({});
  await prisma.inventory.deleteMany({});
  await prisma.productImage.deleteMany({});
  await prisma.productVariant.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.collection.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.address.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Create Users (Admin, Staff, and Customer)
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash('password123', salt);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@hairotic.ng',
      phone: '+2348011112222',
      passwordHash,
      role: Role.ADMIN,
      mfaEnabled: false,
    },
  });

  const staff = await prisma.user.create({
    data: {
      email: 'staff@hairotic.ng',
      phone: '+2348022223333',
      passwordHash,
      role: Role.STAFF,
      mfaEnabled: false,
    },
  });

  const customer = await prisma.user.create({
    data: {
      email: 'customer@gmail.com',
      phone: '+2348033334444',
      passwordHash,
      role: Role.CUSTOMER,
    },
  });

  // 3. Create Categories
  const catBob = await prisma.category.create({
    data: { name: 'Bob Hairs', slug: 'bob-hairs', description: 'Blunt cuts, closures, and classic bob wigs.' },
  });

  const catStraight = await prisma.category.create({
    data: { name: 'Straight Hairs', slug: 'straight-hairs', description: 'Premium silky bone straight hair bundles and wigs.' },
  });

  const catCurly = await prisma.category.create({
    data: { name: 'Curly Hairs', slug: 'curly-hairs', description: 'Bounce, volume, and luxurious curly wigs.' },
  });

  const catCoily = await prisma.category.create({
    data: { name: 'Coily Hairs', slug: 'coily-hairs', description: 'Authentic afro kinky coils and protective extensions.' },
  });

  // 4. Create Collections
  const colBestsellers = await prisma.collection.create({
    data: { name: 'Best Sellers', slug: 'best-sellers', description: 'The most popular units in Lagos.' },
  });

  const colNewDrops = await prisma.collection.create({
    data: { name: 'New Drops', slug: 'new-drops', description: 'Freshly sourced high-quality drops.' },
  });

  console.log('Categories and Collections seeded.');

  // Helper function to seed a product with variants
  const createProductHelper = async (
    name: string,
    slug: string,
    description: string,
    categoryId: string,
    collectionId: string | null,
    images: string[],
    lengths: string[],
    texture: string,
    basePrice: number // in NGN
  ) => {
    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        categoryId,
        collectionId,
        status: ProductStatus.PUBLISHED,
      },
    });

    for (let i = 0; i < lengths.length; i++) {
      const len = lengths[i];
      const priceOffset = i * 25000; // Increase price by 25k NGN per length increase
      const priceInKobo = (basePrice + priceOffset) * 100;
      const compareAtPriceInKobo = (basePrice + priceOffset + 15000) * 100; // 15k discount comparative

      const variant = await prisma.productVariant.create({
        data: {
          productId: product.id,
          sku: `HR-${slug.toUpperCase()}-${len}IN`,
          price: priceInKobo,
          compareAtPrice: compareAtPriceInKobo,
          attributes: { length: len, texture },
        },
      });

      // Add image for this variant
      await prisma.productImage.create({
        data: {
          productVariantId: variant.id,
          url: images[i % images.length],
          position: 0,
        },
      });

      if (images.length > 1) {
        // Add secondary image
        await prisma.productImage.create({
          data: {
            productVariantId: variant.id,
            url: images[(i + 1) % images.length],
            position: 1,
          },
        });
      }

      // Add inventory
      await prisma.inventory.create({
        data: {
          productVariantId: variant.id,
          quantity: 10 + i * 2,
          lowStockThreshold: 3,
        },
      });
    }

    return product;
  };

  // 5. Seed Products
  // Bob Hairs
  await createProductHelper(
    'Lola Blunt Cut Bob Wig',
    'lola-blunt-bob',
    'A sharp, premium cut closure wig made from 100% Vietnamese human hair. Lays flat, feels soft, and holds shine all day.',
    catBob.id,
    colBestsellers.id,
    ['/bob-hairs/02ab823d3a0c332042b5a6c3b3f99282.jpg', '/bob-hairs/2d0454f23e05f4a8e3b6c76ff466b580.jpg'],
    ['10', '12', '14'],
    'straight',
    85000
  );

  await createProductHelper(
    'Classic Chic Closure Bob',
    'classic-chic-bob',
    'Perfect everyday wig with zero glue needed. Pre-plucked closure with soft natural volume bob shape.',
    catBob.id,
    colNewDrops.id,
    ['/bob-hairs/deb96943abdd8693bc7cd6910ff8a879.jpg', '/bob-hairs/e5ada6a44b4cee068499cac637d48d2a.jpg'],
    ['12', '14'],
    'straight',
    95000
  );

  // Straight Hairs
  await createProductHelper(
    'Premium Bone Straight Bundles',
    'premium-bone-straight',
    'Super double drawn luxury bone straight hair. Lays completely flat, super silky touch, no shedding or tangles.',
    catStraight.id,
    colBestsellers.id,
    ['/straight-hairs/07f51f04c30a9ecd6659cb058a95859f.jpg', '/straight-hairs/13f4b3f9d1e25df2f6a74d4600cb5766.jpg'],
    ['18', '20', '22', '24'],
    'straight',
    180000
  );

  await createProductHelper(
    'Sleek Silk Straight Wig',
    'sleek-silk-straight',
    'Glueless frontal wig giving you the ultimate scalp illusion. Can be heat styled, colored, and parted anywhere.',
    catStraight.id,
    null,
    ['/straight-hairs/185fe686f5da0947e75f3bff9adfe1dc.jpg', '/straight-hairs/31e8670dd3cc32374263cef8f046e791.jpg'],
    ['20', '22', '24'],
    'straight',
    210000
  );

  // Curly Hairs
  await createProductHelper(
    'Deep Wave Luxury Curly',
    'deep-wave-luxury-curly',
    'High definition bouncy curls. Retains pattern effortlessly when wet, minimal maintenance, premium styling.',
    catCurly.id,
    colBestsellers.id,
    ['/curly/0443d651affacccaf4e669a72ffc5247.jpg', '/curly/05fc97c545a00c437884cdf4cfb5c082.jpg'],
    ['18', '20', '22'],
    'curly',
    140000
  );

  await createProductHelper(
    'Water Wave HD Lace Wig',
    'water-wave-hd-lace',
    'Wet and wavy look with premium definition. HD lace gives completely invisible hairline transition.',
    catCurly.id,
    colNewDrops.id,
    ['/curly/0f8a601422862360393536d6b810f2e0.jpg', '/curly/131a5b0c507705120a8fb52fddd7c6a2.jpg'],
    ['22', '24', '26'],
    'curly',
    165000
  );

  // Coily Hairs
  await createProductHelper(
    'Afro Kinky Coils Bundles',
    'afro-kinky-coils',
    'Raw kinky texture mimicking natural 4C coils. Full from root to tip, takes dye perfectly, premium raw grade.',
    catCoily.id,
    colNewDrops.id,
    ['/coily-hairs/061b881e9eb397ca7e74298a5a2bb46f.jpg', '/coily-hairs/07c47b76fed43496e3e9520dd7cbf54c.jpg'],
    ['14', '16', '18'],
    'coily',
    120000
  );

  console.log('Products, Variants, Images, and Inventory seeded successfully!');
  console.log('Seeding finished!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
