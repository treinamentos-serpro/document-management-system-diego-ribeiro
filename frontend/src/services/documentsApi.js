const API_BASE_URL = '/api';

async function getErrorMessage(response) {
  const data = await response.json().catch(() => null);
  return data?.message || 'Não foi possível concluir a operação.';
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response;
}

function createOwnerHeaders(owner) {
  return { 'x-user-id': owner };
}

export async function uploadDocument(file, owner) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await request('/upload', {
    method: 'POST',
    headers: createOwnerHeaders(owner),
    body: formData,
  });

  return response.json();
}

export async function listDocuments(owner, options = {}) {
  const response = await request('/documents', {
    headers: createOwnerHeaders(owner),
    ...options,
  });

  return response.json();
}

export async function downloadDocument(document, owner) {
  const response = await request(`/documents/${document.id}/download`, {
    headers: createOwnerHeaders(owner),
  });
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement('a');

  link.href = url;
  link.download = document.originalName;
  link.click();
  URL.revokeObjectURL(url);
}