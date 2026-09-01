const { randomUUID } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const documentsRepository = require('../repositories/documents.repository');

const storageDirectory = path.resolve(__dirname, '../../storage');

function toPublicMetadata(document) {
  const { storedFilename, ...metadata } = document;
  return metadata;
}

function createDocument(file, owner) {
  const document = {
    id: randomUUID(),
    originalName: file.originalname,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner,
    storedFilename: file.filename,
  };

  return toPublicMetadata(documentsRepository.create(document));
}

function listDocuments(owner) {
  return documentsRepository
    .findByOwner(owner)
    .sort((firstDocument, secondDocument) => (
      new Date(secondDocument.uploadedAt) - new Date(firstDocument.uploadedAt)
    ))
    .map(toPublicMetadata);
}

function getDocumentForDownload(id, owner) {
  const document = documentsRepository.findByIdAndOwner(id, owner);

  if (!document) {
    return null;
  }

  const filePath = path.resolve(storageDirectory, document.storedFilename);

  if (!filePath.startsWith(`${storageDirectory}${path.sep}`) || !fs.existsSync(filePath)) {
    return null;
  }

  return {
    filePath,
    originalName: document.originalName,
  };
}

module.exports = {
  createDocument,
  getDocumentForDownload,
  listDocuments,
};