const fs = require('node:fs');
const path = require('node:path');

const storageDirectory = path.resolve(__dirname, '../../storage');

function resolveFilePath(filename) {
  const filePath = path.resolve(storageDirectory, filename);

  if (!filePath.startsWith(`${storageDirectory}${path.sep}`)) {
    return null;
  }

  return filePath;
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

module.exports = {
  resolveFilePath,
  fileExists,
};
