const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],

    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    pincode: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },

    paymentMethod: {
      type: String,
      enum: ["COD", "ONLINE"], // ✅ IMPORTANT FIX
      required: true,
    },

    amount: {
      type: Number,
      required: true, // ✅ REQUIRED
    },
razorpay: {
  orderId: String,
  paymentId: String,
  signature: String
},
status: {
  type: String,
  enum: ["PLACED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"],
  default: "PLACED"
},
    status: {
      type: String,
      enum: ["PLACED", "PAID", "FAILED"],
      default: "PLACED",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("order", orderSchema);
