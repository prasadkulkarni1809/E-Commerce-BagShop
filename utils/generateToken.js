const jwt = require("jsonwebtoken");

module.exports = function generateToken(user) {
  console.log("TOKEN PAYLOAD:", user); // 🔥 DEBUG

  return jwt.sign(
    {
      _id: user._id,
      role: user.role // 🔥 MUST be here
    },
    process.env.JWT_SECRET
  );
};  