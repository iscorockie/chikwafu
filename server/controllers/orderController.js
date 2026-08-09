import Order from "../models/Order.js";
import Product from "../models/Product.js";

export const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ message: "No order items" });

    let itemsPrice = 0;
    const orderItems = [];
    for (const it of items) {
      const product = await Product.findById(it.product);
      if (!product) return res.status(404).json({ message: `Product not found: ${it.product}` });
      if (product.stock < it.qty) return res.status(400).json({ message: `${product.name} is out of stock` });
      itemsPrice += product.price * it.qty;
      orderItems.push({
        product: product._id,
        name: product.name,
        image: product.images[0] || "",
        price: product.price,
        qty: it.qty,
      });
      product.stock -= it.qty;
      await product.save();
    }

    const shippingPrice = itemsPrice > 99 ? 0 : 9.99;
    const taxPrice = Number((itemsPrice * 0.08).toFixed(2));
    const totalPrice = Number((itemsPrice + shippingPrice + taxPrice).toFixed(2));

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
    });

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
