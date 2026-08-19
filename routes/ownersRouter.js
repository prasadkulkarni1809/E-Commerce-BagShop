  const express = require("express");
  const router = express.Router();

  const isLoggedIn = require("../middlewares/isLoggedin");

  const ownerModel = require("../models/owner-model");
  const productModel = require("../models/product-model");
  const orderModel = require("../models/order-models");
  const userModel = require("../models/user-models");


  // ===============================
  // 🔐 CREATE OWNER (ONLY ONCE)
  // ===============================
  router.post("/create", async (req, res) => {
    try {
      const existingOwner = await ownerModel.findOne();

      if (existingOwner) {
        return res
          .status(403)
          .send("Owner already exists. Not allowed to create another.");
      }

      const { fullname, email, password } = req.body;

      if (!fullname || !email || !password) {
        return res.status(400).send("All fields are required");
      }

      const newOwner = await ownerModel.create({
        fullname,
        email,
        password,
        role:"owner",
      }); 

      res.status(201).json(newOwner);

    } catch (err) {
      console.error(err);
      res.status(500).send("Server Error");
    }
  });


  // ===============================
  // 📊 ADMIN DASHBOARD (MAIN PAGE)
  // ===============================
router.get("/admin", isLoggedIn, async (req, res) => {
  try {
    // Only owner can access dashboard
    if (req.user.role !== "owner") {
      return res.send("Access Denied");
    }

    // Dashboard Counts
    const totalProducts = await productModel.countDocuments({
      seller: req.user._id
    });

    const totalOrders = await orderModel.countDocuments({
      "items.seller": req.user._id
    });

    const totalUsers = await userModel.countDocuments();

    // Latest 5 Orders
  const recentOrders = await orderModel
  .find({
    "items.seller": req.user._id
  })
  .sort({ createdAt: -1 })
  .limit(5)
  .populate("user")
  .populate("items.product");
    // Revenue
    const orders = await orderModel.find({
      "items.seller": req.user._id,
      status: {
        $in: ["PLACED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"]
      }
    });

    let totalRevenue = 0;

    orders.forEach(order => {
      order.items.forEach(item => {
        if (
          item.seller &&
          item.seller.toString() === req.user._id.toString()
        ) {
          totalRevenue += item.price * item.quantity;
        }
      });
    });

    // Render Dashboard
    res.render("admin/dashboard", {
      user: req.user,
      totalProducts,
      totalOrders,
      totalUsers,
      totalRevenue,
      recentOrders,
      ownerId: req.user._id
    });
    // console.log(recentOrders[0].items);

  } catch (err) {
    console.error(err);
    res.status(500).send("Dashboard Error");
  }
});

  // ===============================
  // 📦 ADMIN → ALL PRODUCTS PAGE
  // ===============================
  router.get("/admin/products", isLoggedIn, async (req, res) => {
    try {
      const products = await productModel.find({
      seller: req.user._id
  });

      res.render("admin/products", { products });

    } catch (err) {
      res.send(err.message);
    }
  });


  // ===============================
  // ➕ ADMIN → CREATE PRODUCT PAGE
  // ===============================
  router.get("/admin/create", isLoggedIn, (req, res) => {
    res.render("createproducts");
  });


  // ===============================
  // ❌ DELETE PRODUCT
  // ===============================
  router.post("/admin/delete/:id", isLoggedIn, async (req, res) => {
    try {
      await productModel.findByIdAndDelete(req.params.id);
      res.redirect("/owners/admin/products");
    } catch (err) {
      res.send(err.message);
    }
  });

router.post("/admin/order/:id/accept", isLoggedIn, async (req, res) => {
  try {

    await orderModel.findByIdAndUpdate(
      req.params.id,
      {
        status: "ACCEPTED",
        deliveryUpdate: "Seller accepted your order"
      }
    );

    res.redirect("/owners/admin/orders");

  } catch (err) {
    console.log(err);
    res.redirect("/owners/admin/orders");
  }
});
router.post("/admin/order/:id/reject", isLoggedIn, async (req, res) => {
  try {

    await orderModel.findByIdAndUpdate(
      req.params.id,
      {
        status: "REJECTED",
        deliveryUpdate: "Order rejected by seller"
      }
    );

    res.redirect("/owners/admin/orders");

  } catch (err) {
    console.log(err);
    res.redirect("/owners/admin/orders");
  }
});

router.post("/admin/order/:id/pack", isLoggedIn, async (req, res) => {
  try {

    await orderModel.findByIdAndUpdate(
      req.params.id,
      {
        status: "PACKED",
        deliveryUpdate: "Your order has been packed"
      }
    );

    res.redirect("/owners/admin/orders");

  } catch (err) {
    console.log(err);
    res.redirect("/owners/admin/orders");
  }
});

router.post("/admin/order/:id/ship", isLoggedIn, async (req, res) => {
  try {

    await orderModel.findByIdAndUpdate(
      req.params.id,
      {
        status: "SHIPPED",
        deliveryUpdate: "Your order has been shipped"
      }
    );

    res.redirect("/owners/admin/orders");

  } catch (err) {
    console.log(err);
    res.redirect("/owners/admin/orders");
  }
});

router.post("/admin/order/:id/outfordelivery", isLoggedIn, async (req, res) => {
  try {

    await orderModel.findByIdAndUpdate(
      req.params.id,
      {
        status: "OUT_FOR_DELIVERY",
        deliveryUpdate: "Out for delivery"
      }
    );

    res.redirect("/owners/admin/orders");

  } catch (err) {
    console.log(err);
    res.redirect("/owners/admin/orders");
  }
});
router.post("/admin/order/:id/deliver", isLoggedIn, async (req, res) => {
  try {

    await orderModel.findByIdAndUpdate(
      req.params.id,
      {
        status: "DELIVERED",
        deliveryUpdate: "Order delivered successfully"
      }
    );

    res.redirect("/owners/admin/orders");

  } catch (err) {
    console.log(err);
    res.redirect("/owners/admin/orders");
  }
});

router.post("/admin/order/:id/tracking", isLoggedIn, async (req, res) => {
  try {

    const {
      trackingNumber,
      courierPartner
    } = req.body;

    await orderModel.findByIdAndUpdate(
      req.params.id,
      {
        trackingNumber,
        courierPartner
      }
    );

    res.redirect("/owners/admin/orders");

  } catch (err) {
    console.log(err);
    res.redirect("/owners/admin/orders");
  }
});

router.post("/admin/order/:id/exchange-approve", isLoggedIn, async (req, res) => {
  try {

    await orderModel.findByIdAndUpdate(
      req.params.id,
      {
        exchangeStatus: "APPROVED"
      }
    );

    res.redirect("/owners/admin/orders");

  } catch (err) {
    console.log(err);
    res.redirect("/owners/admin/orders");
  }
});
router.post("/admin/order/:id/exchange-reject", isLoggedIn, async (req, res) => {
  try {

    await orderModel.findByIdAndUpdate(
      req.params.id,
      {
        exchangeStatus: "REJECTED"
      }
    );

    res.redirect("/owners/admin/orders");

  } catch (err) {
    console.log(err);
    res.redirect("/owners/admin/orders");
  }
});



router.get("/admin/orders", isLoggedIn, async (req, res) => {
  try {

    const orders = await orderModel
      .find({
        "items.seller": req.user._id
      })
      .populate("user")
      .populate("items.product");

    res.render("admin/orders", {
      orders
    });

  } catch (err) {
    console.log(err);
    res.send(err.message);
  }
});
  module.exports = router;