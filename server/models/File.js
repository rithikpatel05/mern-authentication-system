const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  fileUrl: { type: String, required: true }, // Public S3 URL (optional usage)
  s3Key: { type: String, required: true },   // Required for generating signed URLs
  ownerId: { type: String, required: true }, // The Cognito User ID (sub)
  ownerEmail: { type: String },              // Useful for displaying "Uploaded by..."
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('File', fileSchema);