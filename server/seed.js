import dotenv from "dotenv";
import connectDB from "./config/db.js";
import User from "./models/User.js";
import Category from "./models/Category.js";
import Product from "./models/Product.js";

dotenv.config();
await connectDB();

const run = async () => {
  await Promise.all([User.deleteMany(), Category.deleteMany(), Product.deleteMany()]);

  await User.create({
    name: "Chikwafu Admin",
    email: "admin@chikwafu.com",
    password: "admin123",
    role: "admin",
  });

  const categoryData = [
    { name: "Backpacks", icon: "backpack", itemCount: 120, featured: true },
    { name: "Headphones", icon: "headphones", itemCount: 150, featured: true },
    { name: "Watches", icon: "watch", itemCount: 80, featured: true },
    { name: "Wallets", icon: "wallet", itemCount: 90, featured: true },
    { name: "Gaming", icon: "gamepad", itemCount: 110, featured: true },
    { name: "Sunglasses", icon: "glasses", itemCount: 70, featured: true },
    { name: "Travel", icon: "luggage", itemCount: 60, featured: true },
    { name: "Speakers", icon: "speaker", itemCount: 40, featured: false },
  ];
  const categories = await Category.insertMany(categoryData);
  const byName = (n) => categories.find((c) => c.name === n)._id;

  const products = [
    {
      name: "AirPods Pro 2",
      brand: "Apple",
      category: byName("Headphones"),
      price: 189.0,
      compareAtPrice: 239.0,
      stock: 45,
      images: [],
      isFeatured: true,
      rating: 4.7,
      numReviews: 1248,
      description: "Active noise cancellation earbuds with adaptive audio and spatial sound.",
    },
    {
      name: "Galaxy Watch 6 Classic",
      brand: "Samsung",
      category: byName("Watches"),
      price: 299.0,
      compareAtPrice: 349.0,
      stock: 30,
      images: [],
      isFeatured: true,
      rating: 4.5,
      numReviews: 892,
      description: "Rotating bezel smartwatch with advanced health tracking.",
    },
    {
      name: "Classic Backpack",
      brand: "Herschel",
      category: byName("Backpacks"),
      price: 89.0,
      stock: 60,
      images: [],
      isFeatured: true,
      isNewArrival: true,
      rating: 4.4,
      numReviews: 664,
      description: "Durable everyday backpack with padded laptop compartment.",
    },
    {
      name: "WH-1000XM5 Headphones",
      brand: "Sony",
      category: byName("Headphones"),
      price: 299.0,
      compareAtPrice: 369.0,
      stock: 25,
      images: [],
      isFeatured: true,
      isFlashSale: true,
      rating: 4.3,
      numReviews: 1365,
      description: "Industry-leading noise cancelling over-ear headphones.",
    },
    {
      name: "Go 3 Speaker",
      brand: "JBL",
      category: byName("Speakers"),
      price: 49.0,
      stock: 80,
      images: [],
      isNewArrival: true,
      rating: 4.6,
      numReviews: 2365,
      description: "Portable waterproof Bluetooth speaker with punchy sound.",
    },
    {
      name: "K2 Keyboard",
      brand: "Keychron",
      category: byName("Gaming"),
      price: 89.0,
      stock: 40,
      images: [],
      isNewArrival: true,
      rating: 4.5,
      numReviews: 892,
      description: "Hot-swappable mechanical keyboard with RGB backlight.",
    },
    {
      name: "737 Power Bank",
      brand: "Anker",
      category: byName("Travel"),
      price: 99.0,
      stock: 55,
      images: [],
      isNewArrival: true,
      rating: 4.6,
      numReviews: 654,
      description: "24000mAh portable charger with fast charging support.",
    },
    {
      name: "Gen 6 Smartwatch",
      brand: "Fossil",
      category: byName("Watches"),
      price: 199.0,
      stock: 35,
      images: [],
      isNewArrival: true,
      rating: 4.2,
      numReviews: 785,
      description: "Stylish hybrid smartwatch with fitness tracking.",
    },
    {
      name: "Aviator Sunglasses",
      brand: "RayVision",
      category: byName("Sunglasses"),
      price: 59.0,
      compareAtPrice: 79.0,
      stock: 70,
      images: [],
      rating: 4.3,
      numReviews: 412,
      description: "Classic aviator sunglasses with UV400 polarized lenses.",
    },
    {
      name: "Leather Bifold Wallet",
      brand: "Fossil",
      category: byName("Wallets"),
      price: 39.0,
      stock: 90,
      images: [],
      rating: 4.4,
      numReviews: 320,
      description: "Genuine leather bifold wallet with RFID protection.",
    },
    {
      name: "Pro Gaming Controller",
      brand: "Xbox",
      category: byName("Gaming"),
      price: 69.0,
      stock: 50,
      images: [],
      isFlashSale: true,
      rating: 4.6,
      numReviews: 990,
      description: "Wireless controller with textured grip and remappable buttons.",
    },
    {
      name: "Carry-On Hardshell Luggage",
      brand: "Samsonite",
      category: byName("Travel"),
      price: 149.0,
      compareAtPrice: 199.0,
      stock: 20,
      images: [],
      isFlashSale: true,
      rating: 4.5,
      numReviews: 540,
      description: "Lightweight hardshell spinner luggage, cabin-approved size.",
    },
  ];

  await Product.insertMany(products);
  console.log("Seed complete. Admin login: admin@chikwafu.com / admin123");
  process.exit(0);
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
