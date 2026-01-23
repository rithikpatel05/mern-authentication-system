const router = require('express').Router();
const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const File = require('../models/File');
const verifyToken = require('../middleware/verifyToken');

// --- S3 CONFIG ---
const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY }
});

// --- MULTER CONFIG ---
const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.AWS_BUCKET_NAME,
        metadata: (req, file, cb) => cb(null, { fieldName: file.fieldname }),
        key: (req, file, cb) => cb(null, Date.now().toString() + '-' + file.originalname)
    })
});

// --- ROUTES ---

// Upload Route
router.post('/upload', verifyToken, upload.single('document'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    const newFile = new File({ filename: req.file.originalname, fileUrl: req.file.location, key: req.file.key, uploadedBy: req.user.name });
    await newFile.save();
    res.json({ message: "Upload Successful" });
});

// Get Files Route
router.get('/', async (req, res) => {
    try {
        const files = await File.find().sort({ createdAt: -1 });
        const filesWithSignedUrls = await Promise.all(files.map(async (file) => {
            let fileKey = file.key;
            if (!fileKey && file.fileUrl) {
                const rawKey = file.fileUrl.split('.com/')[1];
                fileKey = decodeURIComponent(rawKey); 
            }
            let signedUrl = null;
            if (fileKey) {
                const command = new GetObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: fileKey });
                signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
            }
            return { ...file._doc, fileUrl: signedUrl || file.fileUrl };
        }));
        res.json(filesWithSignedUrls);
    } catch (err) { res.status(500).json({ error: "Fetch error" }); }
});

module.exports = router;