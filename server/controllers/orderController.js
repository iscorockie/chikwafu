import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { priceOrder, isCentral, CURRENCY } from "../config/pricing.js";

export const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, couponCode } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ message: "No order items" });

    const region = shippingAddress?.region || shippingAddress?.city || "";

    // Cash on delivery is only offered where our own riders deliver.
    if (paymentMethod === "cod" && !isCentral(region)) {
      return res.status(400).json({
        message: "Cash on delivery is only available in Kampala, Wakiso and Mukono.",
      });
    }

    // Resolve every line and check stock BEFORE touching any of it, so a
    // failure part-way through cannot leave earlier products decremented.
    let itemsPrice = 0;
    const orderItems = [];
    const toDecrement = [];

    for (const it of items) {
      const qty = Math.max(1, parseInt(it.qty, 10) || 1);
      const product = await Product.findById(it.product);
      if (!product) return res.status(404).json({ message: `Product not found: ${it.product}` });
      if (product.stock < qty) {
        return res.status(400).json({
          message: `${product.name} — only ${product.stock} left in stock`,
        });
      }
      // Price is taken from the database, never from the request body.
      itemsPrice += product.price * qty;
      orderItems.push({
        product: product._id,
        name: product.name,
        image: product.images?.[0] || "",
        price: product.price,
        qty,
      });
      toDecrement.push({ product, qty });
    }

    // Ugandan pricing: flat delivery by region, free over the threshold,
    // and 18% VAT extracted from the (VAT-inclusive) total rather than
    // added on top.
    const pricing = priceOrder({ itemsPrice, region, couponCode });

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      currency: CURRENCY,
      itemsPrice: pricing.itemsPrice,
      discount: pricing.discount,
      couponCode: pricing.couponCode,
      shippingPrice: pricing.shippingPrice,
      taxPrice: pricing.taxPrice,
      totalPrice: pricing.totalPrice,
    });

    // Only now commit the stock movement.
    await Promise.all(
      toDecrement.map(({ product, qty }) => {
        product.stock -= qty;
        return product.save();
      })
    );

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate("user", "name email").sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    order.status = req.body.status || order.status;
    if (req.body.status === "delivered") order.deliveredAt = new Date();
    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const [totalOrders, totalRevenueAgg, totalProducts, statusCounts] = await Promise.all([
      Order.countDocuments(),
      Order.aggregate([{ $match: { status: { $ne: "cancelled" } } }, { $group: { _id: null, sum: { $sum: "$totalPrice" } } }]),
      Product.countDocuments(),
      Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    ]);
    res.json({
      totalOrders,
      totalRevenue: totalRevenueAgg[0]?.sum || 0,
      totalProducts,
      statusCounts,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
