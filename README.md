# Indica e Conta

Aplicação de indicação de clientes com API NestJS, MongoDB, Redis e RabbitMQ, além de uma interface web em React.

## Requisitos

- Node.js 20.19 ou superior
- npm
- Docker Desktop com Docker Compose

## Primeira execução

Execute os comandos abaixo no PowerShell, a partir da pasta raiz do projeto.

### 1. Configure as variáveis de ambiente

Crie os arquivos `.env` a partir dos exemplos:

```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
```

Os valores de exemplo são suficientes para executar os serviços localmente. Altere-os se estiver usando portas ou serviços diferentes.

### 2. Inicie MongoDB, Redis e RabbitMQ

Ainda na raiz do projeto:

```powershell
docker compose up -d
```

Confira se os serviços estão ativos:

```powershell
docker compose ps
```

### 3. Inicie a API

Abra um terminal na raiz do projeto:

```powershell
cd backend
npm install
npm run dev
```

`npm install` é necessário apenas na primeira execução (ou quando as dependências mudarem). A API ficará disponível em `http://localhost:3000`. Mantenha esse terminal aberto.

### 4. Inicie a interface web

Abra um segundo terminal na raiz do projeto:

```powershell
cd frontend
npm install
npm run dev
```

`npm install` é necessário apenas na primeira execução (ou quando as dependências mudarem). Abra o endereço exibido pelo Vite, normalmente `http://localhost:5173`. Mantenha também esse terminal aberto.

## Próximas execuções

Depois da configuração inicial, não é necessário repetir `npm install` nem recriar os arquivos `.env`. Na raiz do projeto, inicie os serviços:

```powershell
docker compose up -d
```

Em dois terminais separados, inicie a API e a interface:

```powershell
cd backend
npm run dev
```

```powershell
cd frontend
npm run dev
```

## Swagger e API

O Swagger é servido pela API; não precisa iniciar um processo separado. Com a API em execução, abra:

- Swagger UI: <http://localhost:3000/docs>
- Especificação OpenAPI em JSON: <http://localhost:3000/docs-json>

Endpoints principais:

- `POST /customers`: cria um cliente com `name` e `email`; aceita opcionalmente `parent_customer_id`.
- `GET /customers`: lista os clientes.
- `GET /reports`: retorna o total de indicações por cliente.

## Roteiro de testes no Postman

Use `POST http://localhost:3000/customers`, selecione **Body > raw > JSON** e envie os exemplos abaixo. Se já tiver usado um e-mail, troque-o por outro único.

### Sucesso: criar um cliente

```json
{
  "name": "Cliente base de teste",
  "email": "cliente.base.teste@example.com"
}
```

Esperado: **201 Created**, com um `customer_id` gerado, `type: "NORMAL"` e `parent_customer_id: null`. Copie o `customer_id` retornado para o próximo teste. A API também grava esse cliente no Redis.

### Sucesso: criar um cliente indicado e testar o cache

Use o ID copiado no teste anterior:

```json
{
  "name": "Cliente indicado de teste",
  "email": "cliente.indicado.teste@example.com",
  "parent_customer_id": "<customer_id copiado>"
}
```

Esperado: **201 Created**, com `parent_customer_id` igual ao ID do cliente base. Como ele foi criado no teste anterior, a busca do indicador deve encontrá-lo no Redis.

Para conferir a chave no Redis, substitua `<customer_id>` pelo ID real:

```powershell
docker compose exec redis redis-cli GET customer:<customer_id>
```

Para testar também o caminho de cache miss, remova somente essa chave de teste:

```powershell
docker compose exec redis redis-cli DEL customer:<customer_id>
```

Envie novamente a requisição de cliente indicado, usando outro e-mail e o mesmo `parent_customer_id`. Esperado: **201 Created**; a API busca o indicador no MongoDB e o grava novamente no Redis.

### Erro: formato inválido do `parent_customer_id`

```json
{
  "name": "Teste de ID inválido",
  "email": "teste.id.invalido@example.com",
  "parent_customer_id": "abc"
}
```

Esperado: **400 Bad Request**, com uma mensagem de validação indicando que `parent_customer_id` deve ser um ID Mongo válido.

### Erro: indicador não encontrado

Use um ObjectId de 24 caracteres que não exista no banco (o exemplo abaixo funciona se nenhum registro tiver esse ID):

```json
{
  "name": "Teste de indicador inexistente",
  "email": "teste.indicador.inexistente@example.com",
  "parent_customer_id": "000000000000000000000000"
}
```

Esperado: **400 Bad Request**, com a mensagem `O customer indicado em parent_customer_id não foi encontrado.`

### Erro: e-mail duplicado ou inválido

- **Duplicado:** envie duas vezes o mesmo body de criação, sem `parent_customer_id`. A primeira requisição deve retornar **201 Created**; a segunda, **409 Conflict**, com a mensagem `Este e-mail já está cadastrado.`
- **Inválido:** envie `"email": "nao-e-email"`. Esperado: **400 Bad Request**, com uma mensagem de validação do e-mail.

As respostas de erro incluem `statusCode`, `error`, `message`, `timestamp` e `path`. Os valores exatos de `timestamp` e `path` dependem da requisição.

## Encerrar

Pare a interface e a API com `Ctrl+C` nos respectivos terminais. Para parar os serviços do Docker, execute na raiz:

```powershell
docker compose down
```

Os dados do MongoDB ficam em um volume do Docker e são mantidos ao parar os containers.
