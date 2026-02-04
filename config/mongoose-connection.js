const mongoose = require("mongoose");
const config = require("config");
const debug = require("debug")("development:mongoose");

mongoose.connect(`${config.get("MONGODB_URI")}/ecommerce`)
  .then(() => {
    debug("connected to MongoDB");
  })
  .catch(err => {
    debug(err);
  });

module.exports = mongoose.connection;
