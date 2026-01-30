const express = require('express');
const router = express.Router();
const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const File = require('../models/File');
const verifyToken = require('../middleware/verifyToken'); 

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// 🟢 1. UPLOAD CONFIG WITH SIZE LIMIT
const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.AWS_BUCKET_NAME,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      cb(null, Date.now().toString() + '-' + file.originalname);
    }
  }),
  // 👇 STRICT 10MB LIMIT
  limits: { fileSize: 10 * 1024 * 1024 } 
});

// 2. UPLOAD ROUTE (With Error Handling for Size)
router.post('/upload', verifyToken, (req, res, next) => {
    // We wrap the upload in a standard function to catch Multer errors manually
    const uploadSingle = upload.single('file');

    uploadSingle(req, res, async (err) => {
        if (err) {
            // Check for specific Multer error
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ message: "File too large! Max 10MB." });
            }
            return res.status(500).json({ message: "Upload Error", error: err.message });
        }
        
        // If no error, proceed to save logic
        next();
    });
}, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const newFile = new File({
      filename: req.file.originalname,
      fileUrl: req.file.location,
      s3Key: req.file.key,
      ownerId: req.user.id,
      ownerEmail: req.body.userEmail || "Unknown"
    });

    await newFile.save();
    res.json({ message: "Success", file: newFile });
  } catch (error) {
    console.error("Save Error:", error);
    res.status(500).json({ message: "Database Error", error: error.message });
  }
});

// 3. GET FILES ROUTE
router.get('/all-files', verifyToken, async (req, res) => {
  try {
    const files = await File.find().sort({ createdAt: -1 });
    
    const filesWithLinks = await Promise.all(files.map(async (fileDoc) => {
        const file = fileDoc.toObject();
        if (file.s3Key) {
            const command = new GetObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME, 
                Key: file.s3Key,
                ResponseContentDisposition: `attachment; filename="${file.filename}"`
            });
            file.downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        }
        return file;
    }));

    res.json(filesWithLinks);
  } catch (error) {
    console.error("Fetch Error:", error);
    res.status(500).json({ message: "Error fetching files" });
  }
});

// 4. DELETE ROUTE
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: "File not found" });

    if (file.s3Key) {
        const deleteCommand = new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: file.s3Key,
        });
        await s3Client.send(deleteCommand);
    }

    await File.findByIdAndDelete(req.params.id);
    res.json({ message: "File deleted successfully" });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ message: "Delete failed", error: error.message });
  }
});

module.exports = router;