const express = require('express');
const router = express.Router();
const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const File = require('../models/File');
const verifyToken = require('../middleware/verifyToken'); 
const User = require('../models/User');

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// 1. UPLOAD CONFIG WITH SIZE LIMIT (Direct to S3 Streaming)
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
  limits: { fileSize: 10 * 1024 * 1024 } // STRICT 10MB LIMIT
});

// 2. UPLOAD ROUTE (Standard)
router.post('/upload', verifyToken, (req, res, next) => {
    const uploadSingle = upload.single('file');
    uploadSingle(req, res, async (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ message: "File too large! Max 10MB." });
            }
            return res.status(500).json({ message: "Upload Error", error: err.message });
        }
        next();
    });
}, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    // Save the AWS S3 URL and Key directly to MongoDB
    const newFile = new File({
      filename: req.file.originalname,
      fileUrl: req.file.location, 
      s3Key: req.file.key,
      ownerId: req.user.id,
      ownerEmail: req.body.userEmail || "Unknown"
    });

    await newFile.save();

    // 🟢 REDIS INVALIDATION: Wipe the outdated cache!
    const redisClient = req.app.get("redis");
    if (redisClient) {
        await redisClient.del("files_db_cache");
    }

    // 🟢 WEBSOCKET: Shout that a new file was added!
    const io = req.app.get("io");
    if (io) {
        io.emit("files_changed"); 
    }

    res.json({ message: "Success", file: newFile });
  } catch (error) {
    console.error("Save Error:", error);
    res.status(500).json({ message: "Database Error", error: error.message });
  }
});

// 3. GET FILES ROUTE
router.get('/all-files', verifyToken, async (req, res) => {
    try {
        const cognitoId = req.user.sub || req.user.id;
        const redisClient = req.app.get("redis");
        const userCacheKey = `user_profile_${cognitoId}`;

        let user;

        const cachedUser = await redisClient.get(userCacheKey);
        if (cachedUser) {
            user = JSON.parse(cachedUser);
            console.log(`👤 FAST LOAD: User Profile (${user.plan}) from Redis!`);
        } else {
            console.log("🐌 SLOW LOAD: Fetching User Profile from MongoDB!");
            user = await User.findOne({ cognitoId: cognitoId });
            if (!user) return res.status(401).json({ message: "User not found" });
            await redisClient.set(userCacheKey, JSON.stringify(user), { EX: 3600 });
        }

        let rawFiles;
        const cachedFiles = await redisClient.get("files_db_cache");

        if (cachedFiles) {
            console.log("🚀 FAST LOAD: Serving file list from Redis Cache!");
            rawFiles = JSON.parse(cachedFiles);
        } else {
            console.log("🐌 SLOW LOAD: Fetching file list from MongoDB!");
            rawFiles = await File.find().sort({ createdAt: -1 });
            await redisClient.set("files_db_cache", JSON.stringify(rawFiles));
        }
        
        const filesWithLinks = await Promise.all(rawFiles.map(async (fileDoc) => {
            const file = fileDoc.toObject ? fileDoc.toObject() : fileDoc; 

            if (file.s3Key && (user.plan === "SILVER" || user.plan === "GOLD" || user.plan === "PLATINUM")) {
                const command = new GetObjectCommand({
                    Bucket: process.env.AWS_BUCKET_NAME, 
                    Key: file.s3Key,
                    ResponseContentDisposition: `attachment; filename="${file.filename}"`
                });
                file.downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
            } else if (!file.downloadUrl) {
                file.downloadUrl = null; 
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
    
    const user = await User.findOne({ cognitoId: req.user.sub || req.user.id });
    if (!user) return res.status(401).json({ message: "User not found" });
    
    if (user.plan !== "GOLD" && user.plan !== "PLATINUM") {
      return res.status(403).json({ message: "Only Gold/Platinum members can delete files. Upgrade your plan!" });
    }

    if (file.s3Key) {
        const deleteCommand = new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: file.s3Key,
        });
        await s3Client.send(deleteCommand);
    }

    await File.findByIdAndDelete(req.params.id);

    const redisClient = req.app.get("redis");
    if (redisClient) {
        await redisClient.del("files_db_cache");
    }

    const io = req.app.get("io");
    if (io) {
        io.emit("files_changed"); 
    }

    res.json({ message: "File deleted successfully" });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ message: "Delete failed", error: error.message });
  }
});

module.exports = router;