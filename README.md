# Indica e Conta

API de indicação com NestJS, MongoDB, Redis e RabbitMQ, além de um frontend React.

## Executar localmente

Requer Node.js 20.19+ e Docker Compose.

1. Na raiz, inicie MongoDB, Redis e RabbitMQ:

   ```sh
   docker compose up -d
   ```

2. No backend, configure `backend/.env` com base em `backend/.env.example` e inicie a API:

   ```sh
   cd backend
   npm install
   npm run dev
   ```

3. Em outro terminal, configure `frontend/.env` com base em `frontend/.env.example` e inicie a interface:

   ```sh
   cd frontend
   npm install
   npm run dev
   ```

O frontend usa `VITE_API_BASE_URL` para acessar a API. A API libera por padrão a origem `http://localhost:5173`, configurável por `FRONTEND_ORIGIN`.

## API

- Swagger UI: `http://localhost:3000/docs` (especificação OpenAPI em `/docs-json`).
- `POST /customers`: recebe `{ "name": "...", "email": "..." }`; opcionalmente recebe `parent_customer_id`. Retorna o cadastro criado e `customer_id`.
- `GET /customers`: lista os clientes cadastrados.
- `GET /reports`: retorna uma lista de `{ "customer_id": "...", "total_indications": 0 }`.

Clientes são persistidos no MongoDB e armazenados no Redis pela chave `customer:{customer_id}`. Uma indicação valida o cliente pai via Redis e usa o MongoDB como fallback. Eventos `customer.indication.created` são processados pelo RabbitMQ; o placar é eventualmente consistente e pode levar alguns segundos para atualizar.