

const express = require('express');
const router = express.Router();

const {generateToken}  = require("../utils/generateToken")
const {registerUser,loginUser}= require("../controllers/authController");
const isLoggedIn = require("../middlewares/isLoggedIn");
const userModel = require("../models/user-models");
const orderModel = require("../models/order-models");



router.post("/register",registerUser);
router.post("/login",loginUser);

router.get("/account", isLoggedIn, async function (req, res) {
  try {
    const user = await userModel.findById(req.user._id);
const orders = await orderModel
  .find({ user: req.user._id })
  .populate("items.product")
  .sort({ createdAt: -1 });



    res.render("myaccount", {
      user,
      cartCount: user.cart.length,
      ordersCount: user.orders.length,
      orders,
      ordersCount: orders.length,
      showLogout: true   
    });
  } catch (err) {
    console.error("ACCOUNT ERROR:", err);
    res.redirect("/shop");
  }
});


router.get("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "lax",
  });
  


  req.flash("success", "Logged out successfully");
  res.redirect("/");
  

  
});



module.exports= router;

