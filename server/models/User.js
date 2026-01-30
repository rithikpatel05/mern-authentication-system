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
  }
});

module.exports = mongoose.model('User', userSchema);