const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  orderid: {
    type: String,
    unique: true,
    required: true,
  },
  username: String,
  item: String,
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
