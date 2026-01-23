const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema({
  filename: String,       
  fileUrl: String,        
  key: String,            //  Stores the S3 ID
  uploadedBy: String,     
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('File', FileSchema);