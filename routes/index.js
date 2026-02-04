const express = require("express");
const router = express.Router();
const crypto = require("crypto");

const isLoggedIn = require("../middlewares/isLoggedIn");
const productModel = require("../models/product-model");
const userModel = require("../models/user-models");
const orderModel = require("../models/order-models");

const razorpay = require("../config/razorpay");

// =====================
// HOME
// =====================
router.get("/", (req, res) => {
  res.render("index", {
    error: req.flash("error"),
    success: req.flash("success"),
  });
});

// =====================
// SHOP
// =====================
router.get("/shop", isLoggedIn, async (req, res) => {
  try {
    const { sort, collection, filter } = req.query;

    const cartCount = req.user.cart.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    let query = {};
    if (collection === "discount" || filter === "discount") {
      query.discount = { $gt: 0 };
    }

    let productsQuery = productModel.find(query);

    if (sort === "price_low") productsQuery.sort({ price: 1 });
    if (sort === "price_high") productsQuery.sort({ price: -1 });

    const products = await productsQuery;

    res.render("shop", {
      products,
      sort,
      cartCount,
      showLogout: false,
    });
  } catch (err) {
    console.error("SHOP ERROR:", err);
    res.redirect("/");
  }
});

// =====================
// ADD TO CART
// =====================
router.get("/addtocart/:productid", isLoggedIn, async (req, res) => {
  try {
    const user = await userModel.findById(req.user._id);
    const productId = req.params.productid;

    const cartItem = user.cart.find(
      item => item.product && item.product.toString() === productId
    );

    if (cartItem) {
      cartItem.quantity += 1;
    } else {
      user.cart.push({ product: productId, quantity: 1 });
    }

    await user.save();
    req.flash("success", "Product added to cart");
    res.redirect("/shop");
  } catch (err) {
    console.error("ADD TO CART ERROR:", err);
    res.redirect("/shop");
  }
});

// =====================
// CART
// =====================
router.get("/cart", isLoggedIn, async (req, res) => {
  try {
    const user = await userModel
      .findById(req.user._id)
      .populate("cart.product");

    const safeCart = user.cart.filter(
      item => item.product && item.product._id
    );

    if (safeCart.length !== user.cart.length) {
      user.cart = safeCart;
      await user.save();
    }

    const cartItems = safeCart.map(item => ({
      _id: item.product._id,
      name: item.product.name,
      price: item.product.price,
      discount: item.product.discount || 0,
      image: item.product.image,
      quantity: item.quantity,
    }));

    let mrp = 0;
    let discount = 0;

    cartItems.forEach(i => {
      mrp += i.price * i.quantity;
      discount += (i.price * i.discount / 100) * i.quantity;
    });

    const totals = {
      mrp,
      discount,
      platformFee: 20,
      final: Math.round(mrp - discount + 20),
    };

    res.render("cart", { cartItems, totals, showLogout: false });
  } catch (err) {
    console.error("CART ERROR:", err);
    res.redirect("/shop");
  }
});

// =====================
// CART ACTIONS
// =====================
router.get("/cart/increase/:productid", isLoggedIn, async (req, res) => {
  const user = await userModel.findById(req.user._id);
  const item = user.cart.find(
    i => i.product.toString() === req.params.productid
  );
  if (item) item.quantity++;
  await user.save();
  res.redirect("/cart");
});

router.get("/cart/decrease/:productid", isLoggedIn, async (req, res) => {
  const user = await userModel.findById(req.user._id);
  const item = user.cart.find(
    i => i.product.toString() === req.params.productid
  );

  if (item) {
    item.quantity--;
    if (item.quantity <= 0) {
      user.cart = user.cart.filter(
        i => i.product.toString() !== req.params.productid
      );
    }
    await user.save();
  }
  res.redirect("/cart");
});

router.get("/cart/remove/:productid", isLoggedIn, async (req, res) => {
  const user = await userModel.findById(req.user._id);
  user.cart = user.cart.filter(
    item => item.product.toString() !== req.params.productid
  );
  await user.save();
  res.redirect("/cart");
});

// =====================
// CHECKOUT PAGE
// =====================
router.get("/checkout", isLoggedIn, async (req, res) => {
  const user = await userModel
    .findById(req.user._id)
    .populate("cart.product");

  if (!user.cart.length) {
    req.flash("error", "Cart is empty");
    return res.redirect("/shop");
  }

  let subtotal = 0;
  user.cart.forEach(i => {
    subtotal += i.product.price * i.quantity;
  });

  const totals = {
    subtotal,
    platformFee: 20,
    final: subtotal + 20,
  };

  res.render("checkout", {
    cart: user.cart,
    totals,
    showLogout: false,
  });
});

// =====================
// PLACE ORDER
// =====================
router.post("/checkout", isLoggedIn, async (req, res) => {
  try {
    const { address, city, pincode, phone, paymentMethod } = req.body;

    const user = await userModel
      .findById(req.user._id)
      .populate("cart.product");

    if (!user.cart.length) return res.redirect("/cart");

    let subtotal = 0;
    const items = user.cart.map(i => {
      subtotal += i.product.price * i.quantity;
      return {
        product: i.product._id,
        quantity: i.quantity,
        price: i.product.price,
      };
    });

    const order = await orderModel.create({
      user: user._id,
      items,
      address,
      city,
      pincode,
      phone,
      paymentMethod, // "COD" or "ONLINE"
      amount: subtotal + 20,
      paymentStatus: paymentMethod === "COD" ? "PENDING" : "CREATED",
    });

    if (paymentMethod === "COD") {
      user.cart = [];
      await user.save();
      return res.redirect("/orders/success");
    }

    res.redirect(`/orders/pay/${order._id}`);
  } catch (err) {
    console.error("CHECKOUT ERROR:", err);
    res.redirect("/checkout");
  }
});

// =====================
// RAZORPAY PAYMENT
// =====================
router.get("/orders/pay/:orderId", isLoggedIn, async (req, res) => {
  try {
    const order = await orderModel.findById(req.params.orderId);
    if (!order) return res.redirect("/cart");

    const razorpayOrder = await razorpay.orders.create({
      amount: order.amount * 100,
      currency: "INR",
      receipt: order._id.toString(),
    });

    order.razorpay = { orderId: razorpayOrder.id };
    await order.save();

    res.render("razorpay", {
      order,
      razorpayKey: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("PAY ROUTE ERROR:", err);
    res.redirect("/cart");
  }
});

// =====================
// PAYMENT VERIFY
// =====================
router.post("/payment/verify", isLoggedIn, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expected !== razorpay_signature) {
    return res.status(400).json({ success: false });
  }

  const order = await orderModel.findOne({
    "razorpay.orderId": razorpay_order_id,
  });

  order.paymentStatus = "PAID";
  order.razorpay.paymentId = razorpay_payment_id;
  order.razorpay.signature = razorpay_signature;
  await order.save();

  const user = await userModel.findById(order.user);
  user.cart = [];
  await user.save();

  res.json({ success: true });
});

// =====================
// SUCCESS PAGE
// =====================
router.get("/orders/success", isLoggedIn, (req, res) => {
  res.render("order-success");
});

module.exports = router;
