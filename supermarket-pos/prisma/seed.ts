import { PrismaClient } from "../app/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { id: "cat-fruits" },
      update: {},
      create: { id: "cat-fruits", nameAr: "خضروات وفواكه", nameEn: "Fruits & Vegetables", color: "#22c55e", icon: "🍎" },
    }),
    prisma.category.upsert({
      where: { id: "cat-dairy" },
      update: {},
      create: { id: "cat-dairy", nameAr: "ألبان وأجبان", nameEn: "Dairy", color: "#3b82f6", icon: "🥛" },
    }),
    prisma.category.upsert({
      where: { id: "cat-bread" },
      update: {},
      create: { id: "cat-bread", nameAr: "مخبوزات", nameEn: "Bakery", color: "#f59e0b", icon: "🍞" },
    }),
    prisma.category.upsert({
      where: { id: "cat-drinks" },
      update: {},
      create: { id: "cat-drinks", nameAr: "مشروبات", nameEn: "Beverages", color: "#06b6d4", icon: "🥤" },
    }),
    prisma.category.upsert({
      where: { id: "cat-meat" },
      update: {},
      create: { id: "cat-meat", nameAr: "لحوم ودواجن", nameEn: "Meat & Poultry", color: "#ef4444", icon: "🥩" },
    }),
    prisma.category.upsert({
      where: { id: "cat-snacks" },
      update: {},
      create: { id: "cat-snacks", nameAr: "وجبات خفيفة", nameEn: "Snacks", color: "#8b5cf6", icon: "🍫" },
    }),
  ]);

  console.log(`Created ${categories.length} categories`);

  const products = [
    { barcode: "6001234000001", nameAr: "تفاح أحمر", nameEn: "Red Apple", categoryId: "cat-fruits", price: 5.5, cost: 3, unit: "كيلو", stock: 100 },
    { barcode: "6001234000002", nameAr: "موز", nameEn: "Banana", categoryId: "cat-fruits", price: 4.0, cost: 2.5, unit: "كيلو", stock: 80 },
    { barcode: "6001234000003", nameAr: "طماطم", nameEn: "Tomato", categoryId: "cat-fruits", price: 3.5, cost: 2, unit: "كيلو", stock: 60 },
    { barcode: "6001234000004", nameAr: "حليب كامل الدسم", nameEn: "Full Fat Milk", categoryId: "cat-dairy", price: 8.0, cost: 5.5, unit: "لتر", stock: 50 },
    { barcode: "6001234000005", nameAr: "جبنة بيضاء", nameEn: "White Cheese", categoryId: "cat-dairy", price: 15.0, cost: 10, unit: "كيلو", stock: 30 },
    { barcode: "6001234000006", nameAr: "زبادي", nameEn: "Yogurt", categoryId: "cat-dairy", price: 6.0, cost: 4, unit: "حبة", stock: 40 },
    { barcode: "6001234000007", nameAr: "خبز عيش بلدي", nameEn: "Local Bread", categoryId: "cat-bread", price: 3.5, cost: 2, unit: "كيس", stock: 100 },
    { barcode: "6001234000008", nameAr: "كرواسون", nameEn: "Croissant", categoryId: "cat-bread", price: 5.0, cost: 3, unit: "حبة", stock: 30 },
    { barcode: "6001234000009", nameAr: "مياه معدنية 1.5L", nameEn: "Mineral Water 1.5L", categoryId: "cat-drinks", price: 3.0, cost: 1.5, unit: "زجاجة", stock: 200 },
    { barcode: "6001234000010", nameAr: "عصير برتقال", nameEn: "Orange Juice", categoryId: "cat-drinks", price: 12.0, cost: 8, unit: "زجاجة", stock: 60 },
    { barcode: "6001234000011", nameAr: "كولا 330ml", nameEn: "Cola 330ml", categoryId: "cat-drinks", price: 5.0, cost: 3, unit: "علبة", stock: 120 },
    { barcode: "6001234000012", nameAr: "دجاج كامل", nameEn: "Whole Chicken", categoryId: "cat-meat", price: 35.0, cost: 25, unit: "كيلو", stock: 20 },
    { barcode: "6001234000013", nameAr: "لحم بقري مفروم", nameEn: "Ground Beef", categoryId: "cat-meat", price: 80.0, cost: 60, unit: "كيلو", stock: 15 },
    { barcode: "6001234000014", nameAr: "شيبس بطاطس", nameEn: "Potato Chips", categoryId: "cat-snacks", price: 7.0, cost: 4.5, unit: "حبة", stock: 80 },
    { barcode: "6001234000015", nameAr: "شوكولاتة", nameEn: "Chocolate", categoryId: "cat-snacks", price: 10.0, cost: 7, unit: "حبة", stock: 50 },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { barcode: p.barcode },
      update: {},
      create: p,
    });
  }

  console.log(`Created ${products.length} products`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
