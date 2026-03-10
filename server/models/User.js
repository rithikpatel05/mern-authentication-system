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
    default: 'user'
  },

  createdAt: {
    type: Date,
    default: Date.now
  },

  // Subscription fields
  plan: { 
    type: String, 
    enum: ["FREE", "SILVER", "GOLD", "PLATINUM"], 
    default: "FREE" 
  },

  planStartDate: { 
    type: Date 
  }

}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);