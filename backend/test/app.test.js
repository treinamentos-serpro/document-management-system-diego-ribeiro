const { test, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const app = require('../src/app');

const storageDirectory = path.resolve(__dirname, '../storage');

let server;
let baseUrl;

before(() => {
  server = app.listen(0);
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(() => {
  server.close();
});

function uniqueOwner(label) {
  return `${label}-${randomUUID()}`;
}

function buildUploadForm(content, filename) {
  const form = new FormData();
  form.append('file', new Blob([content]), filename);
  return form;
}

async function uploadDocument(owner, content = 'conteúdo de teste', filename = 'arquivo.txt') {
  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: owner ? { 'x-user-id': owner } : {},
    body: buildUploadForm(content, filename),
  });
  const body = await response.json();
  return { response, body };
}

// Teste de fumaça do seed: garante que o app Express foi exportado.
test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('GET /health retorna status ok', async () => {
  const response = await fetch(`${baseUrl}/health`);
  const body = await response.json();

  assert.strictEqual(response.status, 200);
  assert.deepStrictEqual(body, { status: 'ok' });
});

test('POST /upload com x-user-id e arquivo válido retorna 201 e metadados públicos', async () => {
  const owner = uniqueOwner('upload-ok');
  const { response, body } = await uploadDocument(owner, 'olá mundo', 'relatorio.pdf');

  assert.strictEqual(response.status, 201);
  assert.strictEqual(body.originalName, 'relatorio.pdf');
  assert.strictEqual(body.owner, owner);
  assert.strictEqual(typeof body.id, 'string');
  assert.strictEqual(typeof body.size, 'number');
  assert.strictEqual(typeof body.uploadedAt, 'string');
  assert.strictEqual(body.storedFilename, undefined, 'não deve expor storedFilename');
  assert.strictEqual(
    Object.values(body).some((value) => typeof value === 'string' && value.includes(storageDirectory)),
    false,
    'não deve expor caminho local do arquivo',
  );
});

test('POST /upload sem x-user-id retorna 400', async () => {
  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: buildUploadForm('conteúdo', 'arquivo.txt'),
  });
  const body = await response.json();

  assert.strictEqual(response.status, 400);
  assert.strictEqual(typeof body.message, 'string');
});

test('POST /upload sem campo file retorna 400', async () => {
  const owner = uniqueOwner('upload-sem-arquivo');
  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'x-user-id': owner },
    body: new FormData(),
  });
  const body = await response.json();

  assert.strictEqual(response.status, 400);
  assert.strictEqual(typeof body.message, 'string');
});

test('GET /documents lista somente os documentos do usuário requisitante', async () => {
  const ownerA = uniqueOwner('lista-a');
  const ownerB = uniqueOwner('lista-b');

  await uploadDocument(ownerA, 'arquivo do dono a', 'a.txt');
  await uploadDocument(ownerB, 'arquivo do dono b', 'b.txt');

  const response = await fetch(`${baseUrl}/documents`, {
    headers: { 'x-user-id': ownerA },
  });
  const body = await response.json();

  assert.strictEqual(response.status, 200);
  assert.strictEqual(body.length, 1);
  assert.strictEqual(body[0].owner, ownerA);
  assert.strictEqual(body[0].storedFilename, undefined, 'não deve expor storedFilename');
});

test('GET /documents/:id/download retorna o conteúdo e preserva o nome original', async () => {
  const owner = uniqueOwner('download-ok');
  const conteudoEsperado = 'conteúdo binário de teste';
  const { body: uploaded } = await uploadDocument(owner, conteudoEsperado, 'meu documento.txt');

  const response = await fetch(`${baseUrl}/documents/${uploaded.id}/download`, {
    headers: { 'x-user-id': owner },
  });
  const conteudoRecebido = await response.text();
  const disposition = response.headers.get('content-disposition') || '';

  assert.strictEqual(response.status, 200);
  assert.strictEqual(conteudoRecebido, conteudoEsperado);
  assert.ok(disposition.includes('meu documento.txt'), 'deve preservar o nome original no cabeçalho');
});

test('GET /documents/:id/download inexistente retorna 404', async () => {
  const owner = uniqueOwner('download-inexistente');
  const response = await fetch(`${baseUrl}/documents/${randomUUID()}/download`, {
    headers: { 'x-user-id': owner },
  });
  const body = await response.json();

  assert.strictEqual(response.status, 404);
  assert.strictEqual(typeof body.message, 'string');
});

test('GET /documents/:id/download de outro usuário retorna 404', async () => {
  const owner = uniqueOwner('download-dono');
  const outroUsuario = uniqueOwner('download-invasor');
  const { body: uploaded } = await uploadDocument(owner, 'conteúdo privado', 'privado.txt');

  const response = await fetch(`${baseUrl}/documents/${uploaded.id}/download`, {
    headers: { 'x-user-id': outroUsuario },
  });
  const body = await response.json();

  assert.strictEqual(response.status, 404);
  assert.strictEqual(typeof body.message, 'string');
});

after(() => {
  const entries = fs.readdirSync(storageDirectory).filter((entry) => entry !== '.gitkeep');
  for (const entry of entries) {
    fs.rmSync(path.join(storageDirectory, entry), { force: true });
  }
});
