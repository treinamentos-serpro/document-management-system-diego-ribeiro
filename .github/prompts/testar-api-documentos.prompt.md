---
description: "Cria e executa testes de integração para os contratos HTTP de upload, listagem e download de documentos."
name: testar-api-documentos
argument-hint: "foco opcional (ex.: upload, isolamento por usuário ou todos os contratos)"
agent: api-integration-tests
---

# Testar API de Documentos

Crie ou melhore testes de integração HTTP para a API de documentos do DMS. Considere o foco opcional informado: `${input:foco:todos os contratos}`.

Os contratos a validar estão em [especificação do DMS](../../docs/specs/dms-spec.md) e a implementação está em `backend/src`.

Requisitos:

- Use `node:test`, `node:assert`, `fetch` nativo e servidor Express temporário em porta efêmera.
- Cubra upload, listagem, download, validação de `x-user-id` e isolamento entre usuários conforme o foco solicitado.
- Verifique status HTTP, corpo e ausência de detalhes internos como `storedFilename` e caminhos locais.
- Limpe os arquivos de teste gravados em `backend/storage`.
- Não adicione dependências externas e não altere o frontend.
- Execute `cd backend && npm test` antes de concluir.

Entregue um resumo breve dos testes criados ou ajustados e do resultado da execução.