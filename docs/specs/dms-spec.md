# Especificação - Document Management System

## 1. Objetivo

Disponibilizar uma aplicação web para que usuários enviem, listem e baixem seus documentos, com arquivos armazenados localmente e metadados mantidos em memória.

## 2. Escopo

### Dentro do escopo

- Upload de um documento por requisição.
- Armazenamento do arquivo no filesystem local da aplicação.
- Registro em memória dos metadados do documento enviado.
- Listagem dos documentos do usuário identificado na requisição.
- Download de um documento pelo identificador, limitado ao respectivo dono.
- Interface React para envio, listagem e download dos documentos.

### Fora do escopo

- Autenticação, autorização baseada em sessão ou gestão de credenciais.
- Armazenamento externo, em nuvem ou integração com serviços de terceiros.
- Versionamento, edição, exclusão, busca avançada ou compartilhamento de documentos.
- Persistência permanente dos metadados, banco de dados e recuperação após reinício da aplicação.
- Upload em lote, arquivos em pastas e permissões entre usuários.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O sistema deve receber um arquivo em uma requisição `multipart/form-data` para `POST /upload`. |
| RF-02 | O envio deve exigir o cabeçalho `x-user-id` preenchido para identificar o dono do documento. |
| RF-03 | O sistema deve aceitar um único arquivo por requisição, no campo `file`, com tamanho máximo de 50 MB. |
| RF-04 | Ao aceitar o upload, o sistema deve gravar o arquivo em `backend/storage` e gerar um identificador único para o documento. |
| RF-05 | Ao concluir o upload, o sistema deve registrar em memória os metadados públicos `id`, `originalName`, `size`, `uploadedAt` e `owner`. |
| RF-06 | O sistema deve retornar os metadados públicos do documento criado, sem expor o nome ou o caminho interno do arquivo armazenado. |
| RF-07 | O sistema deve listar, em `GET /documents`, somente os documentos cujo `owner` corresponda ao valor de `x-user-id`. |
| RF-08 | A listagem deve ser ordenada por data de envio decrescente, do mais recente para o mais antigo. |
| RF-09 | O sistema deve disponibilizar o conteúdo binário de um documento em `GET /documents/:id/download` quando o identificador existir e pertencer ao usuário da requisição. |
| RF-10 | O download deve preservar o nome original do arquivo no cabeçalho de resposta. |
| RF-11 | O sistema deve responder com erro apropriado quando o usuário não for informado, o arquivo não for enviado, o tamanho máximo for ultrapassado ou o documento não existir para o usuário. |
| RF-12 | O frontend deve usar o prefixo `/api` para enviar, listar e baixar documentos pelo backend. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | O backend deve utilizar Node.js, Express e módulos CommonJS. |
| RNF-02 | Os arquivos devem ser gravados exclusivamente no filesystem local, em `backend/storage`, com `multer` e `diskStorage`. |
| RNF-03 | Os metadados devem ser mantidos exclusivamente em memória nesta fase; reiniciar a aplicação elimina os registros de documentos. |
| RNF-04 | O limite de upload deve ser configurável pela variável `UPLOAD_MAX_SIZE_BYTES`, com padrão de 52.428.800 bytes (50 MB). |
| RNF-05 | A porta do backend deve ser configurável pela variável `PORT`, mantendo uma porta padrão documentada pela aplicação. |
| RNF-06 | O nome físico do arquivo deve ser gerado pela aplicação, sem usar diretamente o nome informado pelo cliente como caminho de destino. |
| RNF-07 | O sistema não deve aceitar caminhos de arquivo fornecidos pelo cliente para leitura ou download; o arquivo deve ser localizado apenas por metadado interno associado ao identificador do documento. |
| RNF-08 | Mensagens retornadas ao usuário e comentários no código devem estar em português; símbolos de código devem usar nomes em inglês. |
| RNF-09 | Falhas de entrada HTTP e de leitura ou escrita no filesystem devem ser tratadas nos limites do sistema e retornar respostas HTTP consistentes. |
| RNF-10 | O frontend deve usar React com Vite, componentes funcionais, Hooks e comunicação via `fetch`. |

## 5. Modelo de dados

### Metadados públicos do documento

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `id` | string | Sim | Identificador único gerado pelo sistema. |
| `originalName` | string | Sim | Nome original do arquivo recebido no upload. |
| `size` | number | Sim | Tamanho do arquivo em bytes. |
| `uploadedAt` | string | Sim | Data e hora do upload no padrão ISO 8601 em UTC. |
| `owner` | string | Sim | Identificador recebido no cabeçalho `x-user-id`. |

Exemplo de representação pública:

```json
{
  "id": "c7b58e0a-2faa-4dcf-bc77-7d921f86a3a5",
  "originalName": "relatorio.pdf",
  "size": 284731,
  "uploadedAt": "2026-09-01T14:30:00.000Z",
  "owner": "usuario-123"
}
```

### Estado interno do repositório

Além dos campos públicos, o repositório em memória deve conservar `storedFilename`, o nome físico gerado pelo `multer` para localizar o arquivo em `backend/storage`. Esse campo é interno, não integra o contrato de resposta e não deve ser exposto ao cliente.

Não há entidade de usuário persistida nesta fase. O valor não vazio de `x-user-id` é tratado como identificador opaco do dono.

## 6. Contratos de API

### Convenções gerais

- Base da API no backend: `/`.
- Base consumida pelo frontend: `/api`, encaminhada ao backend pelo proxy do Vite.
- O cabeçalho `x-user-id` é obrigatório nos endpoints de documentos.
- As respostas de erro usam JSON com o formato `{ "message": "..." }`.
- A API não expõe caminhos físicos ou `storedFilename`.

### POST /upload

Cria um documento e armazena o arquivo localmente.

**Cabeçalhos**

| Cabeçalho | Obrigatório | Descrição |
| --- | --- | --- |
| `x-user-id` | Sim | Identificador não vazio do dono do documento. |
| `Content-Type` | Sim | `multipart/form-data` com boundary definido pelo cliente HTTP. |

**Corpo**

| Campo | Tipo | Obrigatório | Regra |
| --- | --- | --- | --- |
| `file` | arquivo | Sim | Um único arquivo de qualquer tipo, com no máximo 50 MB. |

**Resposta de sucesso**

- Status: `201 Created`.
- Corpo: metadados públicos do documento criado.

```json
{
  "id": "c7b58e0a-2faa-4dcf-bc77-7d921f86a3a5",
  "originalName": "relatorio.pdf",
  "size": 284731,
  "uploadedAt": "2026-09-01T14:30:00.000Z",
  "owner": "usuario-123"
}
```

**Respostas de erro**

| Status | Quando ocorre | Corpo exemplo |
| --- | --- | --- |
| `400 Bad Request` | `x-user-id` ausente ou vazio; campo `file` ausente; mais de um arquivo enviado. | `{ "message": "O cabeçalho x-user-id é obrigatório." }` |
| `413 Payload Too Large` | Arquivo acima do limite configurado. | `{ "message": "O arquivo excede o tamanho máximo permitido de 50 MB." }` |
| `500 Internal Server Error` | Falha ao gravar o arquivo ou registrar seus metadados. | `{ "message": "Não foi possível concluir o envio do documento." }` |

### GET /documents

Lista os metadados dos documentos pertencentes ao usuário da requisição.

**Cabeçalhos**

| Cabeçalho | Obrigatório | Descrição |
| --- | --- | --- |
| `x-user-id` | Sim | Identificador não vazio do dono dos documentos consultados. |

**Resposta de sucesso**

- Status: `200 OK`.
- Corpo: array de metadados públicos, ordenado por `uploadedAt` em ordem decrescente.
- Quando não houver documentos, retorna `[]`.

```json
[
  {
    "id": "c7b58e0a-2faa-4dcf-bc77-7d921f86a3a5",
    "originalName": "relatorio.pdf",
    "size": 284731,
    "uploadedAt": "2026-09-01T14:30:00.000Z",
    "owner": "usuario-123"
  }
]
```

**Respostas de erro**

| Status | Quando ocorre | Corpo exemplo |
| --- | --- | --- |
| `400 Bad Request` | `x-user-id` ausente ou vazio. | `{ "message": "O cabeçalho x-user-id é obrigatório." }` |
| `500 Internal Server Error` | Falha inesperada ao consultar os metadados. | `{ "message": "Não foi possível listar os documentos." }` |

### GET /documents/:id/download

Baixa o conteúdo binário de um documento do usuário da requisição.

**Cabeçalhos**

| Cabeçalho | Obrigatório | Descrição |
| --- | --- | --- |
| `x-user-id` | Sim | Identificador não vazio do dono do documento. |

**Parâmetros de rota**

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `id` | string | Sim | Identificador do documento a baixar. |

**Resposta de sucesso**

- Status: `200 OK`.
- Corpo: conteúdo binário do arquivo.
- Cabeçalho `Content-Disposition`: `attachment`, com o nome original do arquivo.
- `Content-Type`: tipo detectado pelo arquivo armazenado ou `application/octet-stream` quando indisponível.

**Respostas de erro**

| Status | Quando ocorre | Corpo exemplo |
| --- | --- | --- |
| `400 Bad Request` | `x-user-id` ausente ou vazio; `id` ausente ou inválido. | `{ "message": "O cabeçalho x-user-id é obrigatório." }` |
| `404 Not Found` | Documento inexistente, pertencente a outro usuário ou arquivo físico não encontrado. | `{ "message": "Documento não encontrado." }` |
| `500 Internal Server Error` | Falha inesperada durante a leitura do arquivo. | `{ "message": "Não foi possível baixar o documento." }` |

### GET /health

Endpoint técnico já previsto pelo seed do backend. Deve permanecer disponível para verificação de disponibilidade, mas não faz parte dos recursos de gestão de documentos e não exige `x-user-id`.

## 7. Decisões arquiteturais

### Organização do backend

O backend deve aplicar uma Clean Architecture simples dentro de `backend/src`, com o fluxo obrigatório de dependências abaixo:

```text
routes -> controllers -> services -> repositories
```

| Camada | Responsabilidades |
| --- | --- |
| `routes/` | Define os endpoints, aplica o middleware `multer` no upload e encaminha a requisição ao controller correspondente. Não contém regras de negócio. |
| `controllers/` | Traduz HTTP para chamadas de serviço, realiza validações básicas de entrada, converte resultados em respostas HTTP e mapeia erros conhecidos. |
| `services/` | Implementa as regras de negócio: criação de identificador, construção de metadados, filtragem por dono, ordenação, autorização simples do download e coordenação do acesso aos arquivos. |
| `repositories/` | Mantém, consulta e recupera metadados em memória. Não conhece objetos HTTP, Express ou React. |

O `multer` com `diskStorage` deve ser configurado no limite HTTP, pois transforma a entrada `multipart/form-data` em dados consumíveis pelo controller. A regra de negócio recebe apenas os atributos necessários do arquivo processado, sem depender de `req` ou `res`.

### Armazenamento

- Arquivos: `backend/storage`, em disco local, usando nome físico gerado pelo `multer`.
- Metadados: coleção em memória gerenciada por repositório.
- Relação: `storedFilename` interno vincula um metadado ao arquivo físico.
- Limitação aceita: após reiniciar o processo, os metadados deixam de existir, mesmo que arquivos remanesçam no diretório local.

### Organização do frontend

O frontend deve seguir a organização existente em `frontend/src`:

- `pages/`: composição das telas de gestão de documentos.
- `components/`: formulário de upload, lista de documentos e elementos reutilizáveis de interface.
- `services/`: chamadas `fetch` para `/api/upload`, `/api/documents` e `/api/documents/:id/download`.

O identificador do dono deve ser incluído em `x-user-id` nas chamadas ao backend. Como não há autenticação nesta fase, sua origem na interface deve ser simples, explícita e substituível em uma evolução futura.

## 8. Plano de execução

Este plano é um roteiro de implementação futura. Esta especificação não executa nenhuma das etapas abaixo nem cria arquivos de backend ou frontend.

1. Confirmar a estrutura existente, criar os módulos vazios necessários nas camadas do backend e centralizar as configurações de ambiente para porta, diretório de upload e limite de tamanho.
2. Configurar `multer` com `diskStorage` para gravar em `backend/storage`, gerar nomes físicos seguros e aplicar o limite de tamanho definido por ambiente.
3. Implementar o repositório em memória de metadados e seus métodos de criação, consulta por dono e busca por identificador e dono.
4. Implementar os serviços de upload, listagem e download, com geração de identificadores, ordenação, isolamento por dono e proteção contra acesso por caminho fornecido pelo cliente.
5. Implementar controllers e rotas para os três contratos de documentos, mantendo o endpoint técnico `/health` e padronizando o tratamento de erros HTTP.
6. Escrever e executar testes de backend com `node:test` para fluxos de sucesso, validação de `x-user-id`, arquivo ausente, limite de tamanho, listagem isolada por dono e download não autorizado ou inexistente.
7. Implementar o cliente de API do frontend e a tela React para informar o usuário, enviar arquivo, listar documentos e iniciar downloads, usando o prefixo `/api`.
8. Validar a integração frontend-backend, revisar mensagens em português, documentar as variáveis de ambiente e confirmar que nenhum mecanismo de armazenamento externo foi introduzido.

## 9. Critérios de aceitação

| ID | Critério |
| --- | --- |
| CA-01 | Um usuário com `x-user-id` válido consegue enviar um arquivo de até 50 MB e recebe `201` com todos os metadados públicos. |
| CA-02 | Um upload sem `x-user-id`, sem `file` ou com mais de um arquivo recebe `400` e uma mensagem em português. |
| CA-03 | Um upload acima do limite configurado recebe `413`, e o arquivo não é registrado como documento disponível. |
| CA-04 | A listagem de um usuário retorna somente seus documentos, do mais recente para o mais antigo, ou `[]` quando não há registros. |
| CA-05 | Um usuário consegue baixar um documento próprio com o nome original preservado. |
| CA-06 | Tentar baixar documento inexistente ou de outro dono retorna `404` sem revelar a existência ou os metadados do recurso. |
| CA-07 | Nenhuma resposta da API revela `storedFilename`, caminhos locais ou outros detalhes internos de armazenamento. |
| CA-08 | O backend não utiliza banco de dados, nuvem ou serviço externo para arquivos ou metadados. |