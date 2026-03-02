import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@marketplace.com' },
    update: {},
    create: {
      email: 'admin@marketplace.com',
      password: passwordHash,
      name: 'Admin User',
      role: Role.ADMIN,
    },
  });

  const seller = await prisma.user.upsert({
    where: { email: 'seller@marketplace.com' },
    update: {},
    create: {
      email: 'seller@marketplace.com',
      password: passwordHash,
      name: 'Demo Seller',
      role: Role.SELLER,
    },
  });

  const buyer = await prisma.user.upsert({
    where: { email: 'user@marketplace.com' },
    update: {},
    create: {
      email: 'user@marketplace.com',
      password: passwordHash,
      name: 'Demo User',
      role: Role.USER,
    },
  });

  const electronics = await prisma.category.upsert({
    where: { slug: 'electronics' },
    update: {},
    create: {
      name: 'Electronics',
      slug: 'electronics',
    },
  });

  const clothing = await prisma.category.upsert({
    where: { slug: 'clothing' },
    update: {},
    create: {
      name: 'Clothing',
      slug: 'clothing',
    },
  });

  const books = await prisma.category.upsert({
    where: { slug: 'books' },
    update: {},
    create: {
      name: 'Books',
      slug: 'books',
    },
  });

  const phones = await prisma.category.upsert({
    where: { slug: 'phones' },
    update: {},
    create: {
      name: 'Phones',
      slug: 'phones',
      parentId: electronics.id,
    },
  });

  const laptops = await prisma.category.upsert({
    where: { slug: 'laptops' },
    update: {},
    create: {
      name: 'Laptops',
      slug: 'laptops',
      parentId: electronics.id,
    },
  });

  const products = [
    {
      title: 'Wireless Headphones',
      description:
        'Premium noise-cancelling wireless headphones with 30-hour battery life.',
      price: 79.99,
      images: ['/images/headphones.jpg'],
      stock: 50,
      isPublished: true,
      sellerId: seller.id,
      categoryId: electronics.id,
    },
    {
      title: 'Smartphone Pro Max',
      description:
        'Latest flagship smartphone with advanced camera system and 5G connectivity.',
      price: 999.99,
      images: ['/images/phone.jpg'],
      stock: 25,
      isPublished: true,
      sellerId: seller.id,
      categoryId: phones.id,
    },
    {
      title: 'Laptop Ultra',
      description:
        'Lightweight laptop with M-series chip, 16GB RAM, 512GB SSD.',
      price: 1299.99,
      images: ['/images/laptop.jpg'],
      stock: 15,
      isPublished: true,
      sellerId: seller.id,
      categoryId: laptops.id,
    },
    {
      title: 'Cotton T-Shirt',
      description:
        'Comfortable 100% organic cotton t-shirt, available in multiple colors.',
      price: 24.99,
      images: ['/images/tshirt.jpg'],
      stock: 200,
      isPublished: true,
      sellerId: seller.id,
      categoryId: clothing.id,
    },
    {
      title: 'TypeScript Handbook',
      description:
        'Comprehensive guide to TypeScript for modern web development.',
      price: 34.99,
      images: ['/images/book.jpg'],
      stock: 100,
      isPublished: true,
      sellerId: seller.id,
      categoryId: books.id,
    },
    {
      title: 'Mechanical Keyboard',
      description: 'RGB mechanical keyboard with Cherry MX switches.',
      price: 129.99,
      images: ['/images/keyboard.jpg'],
      stock: 30,
      isPublished: true,
      sellerId: seller.id,
      categoryId: electronics.id,
    },
  ];

  const productCount = await prisma.product.count();
  if (productCount === 0) {
    await prisma.product.createMany({ data: products });
  }

  console.log('Seeded:');
  console.log(`  Users: ${admin.name}, ${seller.name}, ${buyer.name}`);
  console.log(
    `  Categories: ${electronics.name}, ${clothing.name}, ${books.name}, ${phones.name}, ${laptops.name}`,
  );
  console.log(`  Products: ${await prisma.product.count()} total`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
