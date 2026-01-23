const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  
  // --- FIX IS HERE: Remove 'required: true' ---
  password: { type: String }, 
  
  provider: { type: String, default: 'local' },
  picture: { type: String },
  refreshToken: { type: String },
  
  // MFA Fields
  mfaSecret: { type: String },
  mfaExpires: { type: Date },
  
  // Social IDs
  linkedinId: { type: String },
  facebookId: { type: String }
});

module.exports = mongoose.model('User', UserSchema);