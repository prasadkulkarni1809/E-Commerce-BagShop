const jwt = require("jsonwebtoken");

const userModel = require("../models/user-models");
const ownerModel = require("../models/owner-model");

module.exports = async function isLoggedIn(req, res, next) {
  try {
    const token = req.cookies.token;

    if (!token) {
      req.flash("error", "Please login first");
      return res.redirect("/");
    }

    // ✅ verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("DECODED TOKEN:", decoded);

    // =====================
    // 🔍 Check USER first
    // =====================
    let user = await userModel
      .findById(decoded._id)
      .select("-password")
      .lean();

    if (user) {
      console.log("✅ User authenticated");

      // 🔥 FIX: ensure cart always exists
      if (!user.cart) user.cart = [];

      req.user = user; // ✅ full object (IMPORTANT)
      return next();
    }

    // =====================
    // 🔥 If not user → check OWNER
    // =====================
    console.log("Not user, checking owner...");

    let owner = await ownerModel
      .findById(decoded._id)
      .select("-password")
      .lean();

    if (owner) {
      console.log("✅ Owner authenticated");

     req.owner = owner;
req.user = owner; // optional compatibility
      return next();
    }

    // ❌ Neither found
    req.flash("error", "User not found");
    return res.redirect("/");

  } catch (err) {
    console.error("AUTH ERROR:", err.message);
    req.flash("error", "Session expired. Please login again.");
    return res.redirect("/");
  }
};