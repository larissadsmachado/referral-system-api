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

## Encerrar

Pare a interface e a API com `Ctrl+C` nos respectivos terminais. Para parar os serviços do Docker, execute na raiz:

```powershell
docker compose down
```

Os dados do MongoDB ficam em um volume do Docker e são mantidos ao parar os containers.
