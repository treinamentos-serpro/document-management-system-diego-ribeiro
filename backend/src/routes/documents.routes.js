const { randomUUID } = require('node:crypto');
const path = require('node:path');
const express = require('express');
const multer = require('multer');
const documentsController = require('../controllers/documents.controller');

const maxUploadSize = Number(process.env.UPLOAD_MAX_SIZE_BYTES) || 50 * 1024 * 1024;
const storageDirectory = path.resolve(__dirname, '../../storage');

const storage = multer.diskStorage({
  destination: storageDirectory,
  filename: (request, file, callback) => {
    callback(null, `${randomUUID()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: maxUploadSize, files: 1 },
});

function validateOwner(request, response, next) {
  const owner = request.get('x-user-id');

  if (!owner || !owner.trim()) {
    response.status(400).json({ message: 'O cabeçalho x-user-id é obrigatório.' });
    return;
  }

  next();
}

const router = express.Router();

router.post('/upload', validateOwner, upload.single('file'), documentsController.uploadDocument);
router.get('/documents', validateOwner, documentsController.listDocuments);
router.get('/documents/:id/download', validateOwner, documentsController.downloadDocument);

module.exports = router;