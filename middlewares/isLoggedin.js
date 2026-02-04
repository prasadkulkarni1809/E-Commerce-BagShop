const jwt = require("jsonwebtoken");
const userModel = require("../models/user-models");
console.log("VERIFY SECRET USED:", process.env.JWT_SECRET);

module.exports = async function isLoggedIn(req, res, next) {
  try {
    const token = req.cookies.token;

    if (!token) {
      req.flash("error", "Please login first");
      return res.redirect("/");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await userModel
      .findById(decoded._id)
      .select("-password");

    if (!user) {
      req.flash("error", "User not found");
      return res.redirect("/");
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("AUTH ERROR:", err.message);
    req.flash("error", "Session expired. Please login again.");
    return res.redirect("/");
  }
};
