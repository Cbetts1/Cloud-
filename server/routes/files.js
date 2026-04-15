const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { read, write } = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const STORAGE_DIR = path.join(__dirname, '..', '..', process.env.STORAGE_DIR || 'storage');
if (!fs.existsSync(STORAGE_DIR)) fs.mkdirSync(STORAGE_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, STORAGE_DIR),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE_MB || '100', 10) * 1024 * 1024;
const upload = multer({ storage, limits: { fileSize: MAX_FILE_SIZE } });

// All file routes require authentication
router.use(authMiddleware);

// GET /files — list files owned by the logged-in user
router.get('/', (req, res) => {
  const db = read();
  const files = db.files
    .filter((f) => f.ownerId === req.user.id)
    .map(({ id, originalName, size, mimeType, uploadedAt }) => ({
      id,
      name: originalName,
      size,
      mimeType,
      uploadedAt,
    }));
  res.json({ files });
});

// POST /files/upload — upload one or more files
router.post('/upload', upload.array('files', 20), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files provided' });
  }
  const db = read();
  const uploaded = req.files.map((f) => {
    const record = {
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      ownerId: req.user.id,
      originalName: f.originalname,
      storedName: f.filename,
      size: f.size,
      mimeType: f.mimetype,
      uploadedAt: new Date().toISOString(),
    };
    db.files.push(record);
    return { id: record.id, name: record.originalName, size: record.size, mimeType: record.mimeType };
  });
  write(db);
  res.status(201).json({ uploaded });
});

// GET /files/:id/download — download a file
router.get('/:id/download', (req, res) => {
  const db = read();
  const file = db.files.find((f) => f.id === req.params.id && f.ownerId === req.user.id);
  if (!file) return res.status(404).json({ error: 'File not found' });
  const filePath = path.join(STORAGE_DIR, file.storedName);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File data missing from storage' });
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
  res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
  res.sendFile(filePath);
});

// DELETE /files/:id — delete a file
router.delete('/:id', (req, res) => {
  const db = read();
  const idx = db.files.findIndex((f) => f.id === req.params.id && f.ownerId === req.user.id);
  if (idx === -1) return res.status(404).json({ error: 'File not found' });
  const [file] = db.files.splice(idx, 1);
  write(db);
  const filePath = path.join(STORAGE_DIR, file.storedName);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  res.json({ message: 'File deleted', id: file.id });
});

module.exports = router;
