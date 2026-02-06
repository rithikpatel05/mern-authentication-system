const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  cognitoId: {
    type: String,
    required: true,
    unique: true
  },
  username: String,
  role: {
    type: String,
    default: 'user' // You can use 'admin' later if needed
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  // New fields for subscription plans
  plan: { type: String, enum: ["FREE", "SILVER", "GOLD", "PLATINUM"], default: "FREE" },
  planStartDate: { type: Date }
});

module.exports = mongoose.model('User', userSchema);