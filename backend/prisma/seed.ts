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
  const catWigs = await prisma.category.create({
    data: { name: 'Wigs', slug: 'wigs', description: 'Premium wigs including blunt cuts, closures, curly waves, and coily units.' },
  });

  const catExtensions = await prisma.category.create({
    data: { name: 'Extensions', slug: 'extensions', description: 'Premium tape-in and clip-in extensions.' },
  });

  const catBundle = await prisma.category.create({
    data: { name: 'Bundle', slug: 'bundle', description: 'Bounce, volume, and luxurious curly bundles.' },
  });

  const catStyling = await prisma.category.create({
    data: { name: 'Styling', slug: 'styling', description: 'Professional wig installation, styling, revamped care, and coily hair units.' },
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
  // Bob Hairs (now Wigs)
  await createProductHelper(
    'Lola Blunt Cut Bob Wig',
    'lola-blunt-bob',
    'A sharp, premium cut closure wig made from 100% Vietnamese human hair. Lays flat, feels soft, and holds shine all day.',
    catWigs.id,
    colBestsellers.id,
    [
      '/bob-hairs/02ab823d3a0c332042b5a6c3b3f99282.jpg',
      '/bob-hairs/2d0454f23e05f4a8e3b6c76ff466b580.jpg',
      '/bob-hairs/2d90fbd186d907f4c9ae5dcb21eac261.jpg',
      '/bob-hairs/3bf3e64b450bd319f4877f68089f9406.jpg',
      '/bob-hairs/4b2249f72bab268a1b71b7092f0376ff.jpg',
      '/bob-hairs/7dfec8bb246f41c69cb983e331cfcaac.jpg',
      '/bob-hairs/9c0938fcd9094c0d28af07b00298bcc5.jpg'
    ],
    ['10', '12', '14'],
    'straight',
    85000
  );

  await createProductHelper(
    'Classic Chic Closure Bob',
    'classic-chic-bob',
    'Perfect everyday wig with zero glue needed. Pre-plucked closure with soft natural volume bob shape.',
    catWigs.id,
    colNewDrops.id,
    [
      '/bob-hairs/9e4dc4b86e63fe6fccc3d4cab8b96215.jpg',
      '/bob-hairs/cb97d3608ba181d8947271aef6cd2d9a.jpg',
      '/bob-hairs/d889fc460dec62af86f73aed92407c15.jpg',
      '/bob-hairs/deb96943abdd8693bc7cd6910ff8a879.jpg',
      '/bob-hairs/e5ada6a44b4cee068499cac637d48d2a.jpg',
      '/bob-hairs/f7603c772d72ae50f2c4fbb94a7ce4f5.jpg',
      '/bob-hairs/f9cf7ebc537293f547e939faf8f4ac17.jpg',
      '/bob-hairs/videoframe_19691.png'
    ],
    ['12', '14'],
    'straight',
    95000
  );

  // Straight Hairs (moved to Wigs category)
  await createProductHelper(
    'Premium Bone Straight Bundles',
    'premium-bone-straight',
    'Super double drawn luxury bone straight hair. Lays completely flat, super silky touch, no shedding or tangles.',
    catWigs.id,
    colBestsellers.id,
    [
      '/wigs/07f51f04c30a9ecd6659cb058a95859f.jpg',
      '/wigs/13f4b3f9d1e25df2f6a74d4600cb5766.jpg',
      '/wigs/187f8747eb1b36732430abf7a9b8ea46.jpg',
      '/wigs/63d96f649f15eec9baf345fbae1a1162.jpg',
      '/wigs/7278f759121ce463932193423992ff7a.jpg',
      '/wigs/79f05317cc134a6702edc00d0d14f8c0.jpg',
      '/wigs/8c0d47963ee081fd43afef5f0d9f6dd6.jpg'
    ],
    ['18', '20', '22', '24'],
    'straight',
    180000
  );

  await createProductHelper(
    'Sleek Silk Straight Wig',
    'sleek-silk-straight',
    'Glueless frontal wig giving you the ultimate scalp illusion. Can be heat styled, colored, and parted anywhere.',
    catWigs.id,
    null,
    [
      '/wigs/185fe686f5da0947e75f3bff9adfe1dc.jpg',
      '/wigs/31e8670dd3cc32374263cef8f046e791.jpg',
      '/wigs/8fbfe0474edd5027a101397c528a6830.jpg',
      '/wigs/a14d8543e60511923b22767b7f51bec4.jpg',
      '/wigs/bcb3bad5911f442426b8d37b3a86fa2b.jpg',
      '/wigs/c504ed2595d650d6264a7d0e01e9cf2d.jpg',
      '/wigs/ed576d1a7e4299bfccf48bf9c9917988.jpg'
    ],
    ['20', '22', '24'],
    'straight',
    210000
  );

  // Extensions Category (new products from new images folder)
  await createProductHelper(
    'Raw Vietnamese Tape-Ins',
    'raw-vietnamese-tape-ins',
    '100% raw premium Vietnamese tape-in hair extensions. Full and thick from root to tip, natural black color.',
    catExtensions.id,
    colBestsellers.id,
    [
      '/extensions/IMG_5204.JPG',
      '/extensions/IMG_5205.JPG'
    ],
    ['18', '20', '22', '24'],
    'straight',
    110000
  );

  await createProductHelper(
    'Premium Double Drawn Clip-Ins',
    'premium-double-drawn-clip-ins',
    'Double drawn luxury clip-in extensions for instant volume and length. Lays flat, seamless clip attachments.',
    catExtensions.id,
    colNewDrops.id,
    [
      '/extensions/IMG_5206.JPG',
      '/extensions/IMG_5207.JPG'
    ],
    ['16', '18', '20', '22'],
    'straight',
    95000
  );

  await createProductHelper(
    'Luxury Seamless Weft Extensions',
    'luxury-seamless-weft',
    'Ultra-thin seamless weft hair extensions. Undetectable lay-flat design for a natural full volume transition.',
    catExtensions.id,
    colBestsellers.id,
    [
      '/extensions/IMG_5208.JPG',
      '/extensions/IMG_5209.JPG'
    ],
    ['18', '20', '22', '24'],
    'straight',
    120000
  );

  await createProductHelper(
    'Vietnamese Remy Ponytail Extension',
    'remy-ponytail-extension',
    'Drawstring ponytail extension with a security wrap-around comb. Perfect instant sleek high-ponytail.',
    catExtensions.id,
    colNewDrops.id,
    [
      '/extensions/IMG_5210.JPG',
      '/extensions/IMG_5211.JPG'
    ],
    ['18', '20', '22'],
    'straight',
    85000
  );

  await createProductHelper(
    'Premium I-Tip Hair Extensions',
    'premium-i-tips',
    'Cold-fusion I-tip micro-bead extensions. Premium raw quality hair strands for individual attachment styling.',
    catExtensions.id,
    colBestsellers.id,
    [
      '/extensions/IMG_5212.JPG',
      '/extensions/IMG_5213.JPG'
    ],
    ['18', '20', '22', '24'],
    'straight',
    140000
  );

  await createProductHelper(
    'Glueless Halo Hair Extensions',
    'halo-hair-extensions',
    'Instant wear halo hair extension on an invisible wire. Adds length and thick texture in under 30 seconds.',
    catExtensions.id,
    colNewDrops.id,
    [
      '/extensions/IMG_5216.JPG',
      '/extensions/IMG_5217.JPG'
    ],
    ['16', '18', '20', '22'],
    'straight',
    90000
  );

  await createProductHelper(
    'Luxury Kinky Straight Tape-ins',
    'kinky-straight-tape-ins',
    'Seamless tape-in extensions featuring a blown-out kinky straight texture. Blends perfectly with natural hair.',
    catExtensions.id,
    colBestsellers.id,
    [
      '/extensions/IMG_5240.JPG',
      '/extensions/IMG_5241.JPG'
    ],
    ['18', '20', '22', '24'],
    'straight',
    115000
  );

  // Wigs Category Products (including consolidated curly/coily items)
  await createProductHelper(
    'Deep Wave Luxury Curly',
    'deep-wave-luxury-curly',
    'High definition bouncy curls. Retains pattern effortlessly when wet, minimal maintenance, premium styling.',
    catWigs.id,
    colBestsellers.id,
    [
      '/wigs/0443d651affacccaf4e669a72ffc5247.jpg',
      '/wigs/05fc97c545a00c437884cdf4cfb5c082.jpg',
      '/wigs/09940124d21243da88f68647ece45ded.jpg',
      '/wigs/0f8a601422862360393536d6b810f2e0.jpg',
      '/wigs/131a5b0c507705120a8fb52fddd7c6a2.jpg',
      '/wigs/1be61dcda9c3131f2d68602af76390e5.jpg',
      '/wigs/2075bf9c80b569f51e669300e2264389.jpg',
      '/wigs/229e1dd1e493a5e43ba7e89595315e18.jpg',
      '/wigs/239ff6ec90727f2516f848079b374efa.jpg',
      '/wigs/3766bba0a3e81b0de1787d48e9004cd1.jpg',
      '/wigs/41cd8a391a19f0c02de40eb5a270224e.jpg',
      '/wigs/4a2ed81e420631766c32e61652f67478.jpg',
      '/wigs/5b29c5f5a9618d4e02940daa96bcf35d.jpg',
      '/wigs/6c0fb20fac12cc6f22b0e61943299717.jpg'
    ],
    ['18', '20', '22'],
    'curly',
    140000
  );

  await createProductHelper(
    'Water Wave HD Lace Wig',
    'water-wave-hd-lace',
    'Wet and wavy look with premium definition. HD lace gives completely invisible hairline transition.',
    catWigs.id,
    colNewDrops.id,
    [
      '/wigs/85a54d19d6192818e17a31e55013011e.jpg',
      '/wigs/8b68fb7b8dc91bf4a3505cd8f3957138.jpg',
      '/wigs/9bf0af63103d1ff802b1a1a1e63c44c9.jpg',
      '/wigs/9f4434bb79f7966ba60f469ddd804e7c.jpg',
      '/wigs/a658ccff807f5345a56326f18e7a41bd.jpg',
      '/wigs/b1c0118f823b1e1cb631d03496bc60f7.jpg',
      '/wigs/b6a768f5ccb6e11f5c3d056c7df71062.jpg',
      '/wigs/b77328cbf7e968c3328c9aa96e3bd780.jpg',
      '/wigs/c090f28bd5ffbc16ba585bfb86a78b11.jpg',
      '/wigs/c5370e4d660b1e51732c000c851a512f.jpg',
      '/wigs/db6d40187408cffb320402c754d8ed91.jpg',
      '/wigs/ebedc1773beb2660c967e60e3168e731.jpg',
      '/wigs/edff90d99fc08f81e06bc1c53eb614ab.jpg',
      '/wigs/f97b745787e369d2e63bbb951305387c.jpg'
    ],
    ['22', '24', '26'],
    'curly',
    165000
  );

  await createProductHelper(
    'Afro Kinky Coils Bundles',
    'afro-kinky-coils',
    'Raw kinky texture mimicking natural 4C coils. Full from root to tip, takes dye perfectly, premium raw grade.',
    catWigs.id,
    colNewDrops.id,
    [
      '/wigs/061b881e9eb397ca7e74298a5a2bb46f.jpg',
      '/wigs/07c47b76fed43496e3e9520dd7cbf54c.jpg',
      '/wigs/49751d1bfb1477449820f3d8921fc394.jpg',
      '/wigs/7e5236d09c219ec9fe98a7c536fe8fd5.jpg',
      '/wigs/86ab4bf6a840d8273b1ce727b9aa7b3d.jpg',
      '/wigs/89e0db581f5e8904fb40ee48eb5b52a0.jpg',
      '/wigs/906b39c2d9c6045037e58fb74c658e96.jpg',
      '/wigs/adc70ba5bab02153057cad2703c7f157.jpg',
      '/wigs/b279932de72ec6c1344ea22020cf88dc.jpg',
      '/wigs/b730b67704963448e9376f1f519cdc8e.jpg',
      '/wigs/c5c7aa3217ab8abc3be8218c15e4871a.jpg',
      '/wigs/ec72506e8ec4c09930e8e65cf7ea1ae6.jpg',
      '/wigs/ef1f4295df51143174f8a626eec5ddfd.jpg'
    ],
    ['14', '16', '18'],
    'coily',
    120000
  );

  // Bundles Category Products
  await createProductHelper(
    'Luxury Deep Wave Bundle',
    'luxury-deep-wave-bundle',
    '100% premium grade human hair deep wave bundle. Bouncy, thick, and holds its pattern beautifully.',
    catBundle.id,
    colBestsellers.id,
    [
      '/curly/IMG_5218.JPG',
      '/curly/IMG_5219.JPG',
      '/curly/IMG_5220.JPG'
    ],
    ['16', '18', '20', '22', '24'],
    'curly',
    110000
  );

  await createProductHelper(
    'Premium Water Wave Bundle',
    'premium-water-wave-bundle',
    'Luxurious water wave hair bundles. Offers a natural, beachy wave pattern that stays hydrated and sleek.',
    catBundle.id,
    colNewDrops.id,
    [
      '/curly/IMG_5221.JPG',
      '/curly/IMG_5222.JPG',
      '/curly/IMG_5223.JPG'
    ],
    ['18', '20', '22', '24'],
    'curly',
    125000
  );

  await createProductHelper(
    'Super Double Drawn Straight Bundle',
    'super-double-drawn-straight-bundle',
    'Thick straight hair bundles from root to tip. Offers maximum volume and a premium glossy shine.',
    catBundle.id,
    colBestsellers.id,
    [
      '/curly/IMG_5224.JPG',
      '/curly/IMG_5225.JPG',
      '/curly/IMG_5226.JPG'
    ],
    ['16', '18', '20', '22', '24'],
    'straight',
    130000
  );

  await createProductHelper(
    'Raw Cambodian Wavy Bundle',
    'raw-cambodian-wavy-bundle',
    'Unprocessed, luxury raw Cambodian wavy hair. Super thick, high-durability, and styles beautifully.',
    catBundle.id,
    colNewDrops.id,
    [
      '/curly/IMG_5227.JPG',
      '/curly/IMG_5228.JPG',
      '/curly/IMG_5229.JPG'
    ],
    ['18', '20', '22', '24'],
    'curly',
    140000
  );

  await createProductHelper(
    'Silky Straight Human Hair Bundle',
    'silky-straight-bundle',
    'Classic silky straight human hair bundles. Lays flat, resists tangling, and can be heat styled.',
    catBundle.id,
    colBestsellers.id,
    [
      '/curly/IMG_5230.JPG',
      '/curly/IMG_5231.JPG',
      '/curly/IMG_5232.JPG'
    ],
    ['16', '18', '20', '22'],
    'straight',
    115000
  );

  await createProductHelper(
    'Bouncy Curly Wave Bundle',
    'bouncy-curly-wave-bundle',
    'A soft, high-definition bouncy curly bundle. Retains shape effortlessly and feels extremely soft.',
    catBundle.id,
    colNewDrops.id,
    [
      '/curly/IMG_5233.JPG',
      '/curly/IMG_5234.JPG',
      '/curly/IMG_5235.JPG'
    ],
    ['16', '18', '20', '22'],
    'curly',
    120000
  );

  await createProductHelper(
    'Luxury Bohemian Curls Bundle',
    'luxury-bohemian-curls-bundle',
    'Ultimate boho curls hair bundles. Features a unique, messy-chic curl pattern that adds gorgeous volume.',
    catBundle.id,
    colBestsellers.id,
    [
      '/curly/IMG_5236.JPG',
      '/curly/IMG_5237.JPG',
      '/curly/IMG_5238.JPG',
      '/curly/IMG_5239.JPG',
      '/curly/IMG_5242.JPG'
    ],
    ['16', '18', '20', '22', '24'],
    'curly',
    135000
  );

  // Styling Category (Service Menu Products)
  await createProductHelper(
    'Premium Lace Wig Installation Service',
    'wig-install-service',
    'Professional, seamless lace melt using waterproof or glueless techniques. Includes flat braid-down, bald cap prep, lace tinting, hairline customization, and hot-tool styling.',
    catStyling.id,
    colBestsellers.id,
    ['/styling/wig_install.jpg'],
    ['standard'],
    'straight',
    25000
  );

  await createProductHelper(
    'Luxury Wig Revamp & Style Service',
    'wig-revamp-service',
    'Full wig spa service. Includes deep detangling, sulfate-free wash, moisture-rich deep conditioning, lace clean-up, and hot tool styling (sleek straight, soft curls, or wand waves).',
    catStyling.id,
    null,
    ['/styling/wig_revamp.jpg'],
    ['standard'],
    'straight',
    15000
  );

  await createProductHelper(
    'Custom Wig Coloring Service',
    'wig-coloring-service',
    'Custom hand-painted highlights, balayage, or single process hair coloring. Performed with premium products to maintain hair shine, bounce, and lace integrity.',
    catStyling.id,
    colNewDrops.id,
    ['/styling/wig_coloring.jpg'],
    ['standard'],
    'straight',
    30000
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
