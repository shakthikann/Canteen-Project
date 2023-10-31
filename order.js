const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  username: String,
  item: String,
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
