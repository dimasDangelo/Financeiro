const express = require('express');
const cors = require('cors');

const cartaoRoutes = require('./routes/cartaoRoutes');
const transacaoRoutes = require('./routes/transacaoRoutes');
const parcelaRoutes = require('./routes/parcelaRoutes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/cartoes', cartaoRoutes);
app.use('/api/transacoes', transacaoRoutes);
app.use('/api/parcelas', parcelaRoutes);

app.use(errorHandler);

module.exports = app;
