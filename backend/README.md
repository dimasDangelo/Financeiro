# Backend Financeiro (Node + Express)

API REST com CRUD para as tabelas `cartao`, `transacao` e `parcela` presentes em `sql/financeiro.sql`.

## Pré-requisitos

- Node.js 18+
- MySQL 8+

## Configuração

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Copie o arquivo de ambiente:
   ```bash
   cp .env.example .env
   ```
3. Ajuste os dados de conexão com o banco no `.env`.

## Executando

```bash
npm run dev
```

ou

```bash
npm start
```

## Endpoints

### Cartões
- `GET /api/cartoes`
- `GET /api/cartoes/:id`
- `POST /api/cartoes`
- `PUT /api/cartoes/:id`
- `DELETE /api/cartoes/:id`

### Transações
- `GET /api/transacoes`
- `GET /api/transacoes/:id`
- `POST /api/transacoes`
- `PUT /api/transacoes/:id`
- `DELETE /api/transacoes/:id`

### Parcelas
- `GET /api/parcelas`
- `GET /api/parcelas/:id`
- `POST /api/parcelas`
- `PUT /api/parcelas/:id`
- `DELETE /api/parcelas/:id`

## Healthcheck

- `GET /health`
