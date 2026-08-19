const express = require("express");
const router = express.Router();
const upload = require("../config/multer-config");
const productModel = require("../models/product-model");
const isLoggedIn = require("../middlewares/isLoggedIn");

router.post(
  "/create",
    isLoggedIn,
  upload.single("image"),
  async function (req, res) {
    try {
      const {
        name,
        price,
        discount,
        bgcolor,
        panelcolor,
        textcolor,
      } = req.body;

      // ❌ Missing image
      if (!req.file) {
        req.flash("error", "Product image is required");
        return res.redirect("/products/create");
      }

      // ❌ Required fields check
      if (!name || !price) {
        req.flash("error", "Product name and price are required");
        return res.redirect("/products/create");
      }

console.log("REQ USER =", req.user);
      await productModel.create({
        name,
        price,
        discount,
        bgcolor,
        panelcolor,
        textcolor,
        image:
    `data:${req.file.mimetype};base64,` +
    req.file.buffer.toString("base64"), 
      seller: req.user._id// ✅ teacher-style
      });

      // ✅ Success
      req.flash("success", "Product created successfully");
      return res.redirect("/owners/admin");

    } catch (err) {
      console.error("CREATE PRODUCT ERROR:", err);

      req.flash("error", "Something went wrong while creating product");
      return res.redirect("/products/create");
    }
  }
);

module.exports = router;
