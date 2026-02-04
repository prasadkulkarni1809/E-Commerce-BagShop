const express = require("express");
const app = express();
require("dotenv").config();

// =====================
// DATABASE
// =====================
require("./config/mongoose-connection");

// =====================
// CORE MODULES
// =====================
const path = require("path");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const flash = require("connect-flash");

// =====================
// CUSTOM MIDDLEWARE
// =====================


// =====================
// BODY PARSERS
// =====================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =====================
// STATIC FILES
// =====================
app.use(express.static(path.join(__dirname, "public")));

// =====================
// COOKIES (JWT lives here)
// =====================
app.use(cookieParser());

// =====================
// VIEW ENGINE
// =====================
app.set("view engine", "ejs");

// =====================
// SESSION + FLASH
// =====================
console.log("RAZORPAY KEY:", process.env.RAZORPAY_KEY_ID);
console.log("RAZORPAY SECRET:", process.env.RAZORPAY_KEY_SECRET);

app.use(
  session({
    secret: process.env.EXPRESS_SESSION_SECRET || "devsecret",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(flash());

// =====================
// 🔑 ATTACH USER GLOBALLY (JWT → req.user)
// ⚠️ MUST COME BEFORE res.locals
// =====================

// =====================
// 🌍 GLOBAL LOCALS (ALL EJS + PARTIALS)
// =====================
app.use(async (req, res, next) => {
  if (req.user) {
    // 🔥 REFRESH USER FROM DB
    const freshUser = await userModel
      .findById(req.user._id)
      .select("cart");

    res.locals.cartCount = freshUser.cart.length;
   
  } else {
    res.locals.cartCount = 0;
  }
// console.log( res.locals.cartCount );
  next();
});

app.use((req, res, next) => {
  res.locals.error = req.flash("error") || [];
  res.locals.success = req.flash("success") || [];
  next();
});

// =====================
// ROUTES
// =====================
const indexRouter = require("./routes/index");
const usersRouter = require("./routes/usersRouter");
const ownersRouter = require("./routes/ownersRouter");
const productsRouter = require("./routes/productsRouter");

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/owners", ownersRouter);
app.use("/products", productsRouter);

// =====================
// SERVER
// =====================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  // console.log("NODE_ENV =", process.env.NODE_ENV || "development");
});
