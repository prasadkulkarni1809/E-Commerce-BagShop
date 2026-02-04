const jwt = require("jsonwebtoken");
console.log("TOKEN SECRET USED:", process.env.JWT_SECRET);

module.exports = function generateToken(user) {
  return jwt.sign(
    {
      _id: user._id,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
  
};
