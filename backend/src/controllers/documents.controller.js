const documentsService = require('../services/documents.service');

function getOwner(request) {
  const owner = request.get('x-user-id');
  return owner && owner.trim();
}

function validateOwner(request, response) {
  if (getOwner(request)) {
    return true;
  }

  response.status(400).json({ message: 'O cabeçalho x-user-id é obrigatório.' });
  return false;
}

function uploadDocument(request, response) {
  if (!validateOwner(request, response)) {
    return;
  }

  if (!request.file) {
    response.status(400).json({ message: 'O arquivo é obrigatório.' });
    return;
  }

  try {
    const document = documentsService.createDocument(request.file, getOwner(request));
    response.status(201).json(document);
  } catch (error) {
    response.status(500).json({ message: 'Não foi possível concluir o envio do documento.' });
  }
}

function listDocuments(request, response) {
  if (!validateOwner(request, response)) {
    return;
  }

  try {
    response.json(documentsService.listDocuments(getOwner(request)));
  } catch (error) {
    response.status(500).json({ message: 'Não foi possível listar os documentos.' });
  }
}

function downloadDocument(request, response) {
  if (!validateOwner(request, response)) {
    return;
  }

  if (!request.params.id) {
    response.status(400).json({ message: 'O identificador do documento é obrigatório.' });
    return;
  }

  try {
    const document = documentsService.getDocumentForDownload(
      request.params.id,
      getOwner(request),
    );

    if (!document) {
      response.status(404).json({ message: 'Documento não encontrado.' });
      return;
    }

    response.download(document.filePath, document.originalName, (error) => {
      if (error && !response.headersSent) {
        response.status(500).json({ message: 'Não foi possível baixar o documento.' });
      }
    });
  } catch (error) {
    response.status(500).json({ message: 'Não foi possível baixar o documento.' });
  }
}

module.exports = {
  downloadDocument,
  listDocuments,
  uploadDocument,
};