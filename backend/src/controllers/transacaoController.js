const db = require('../config/database');

const TIPOS = ['ENTRADA', 'SAIDA'];
const FORMAS_PAGAMENTO = ['DEBITO', 'CREDITO'];

function validarEntrada(payload) {
  const { tipo, valor, data_movimento, forma_pagamento } = payload;

  if (!TIPOS.includes(tipo)) {
    return 'Campo "tipo" deve ser ENTRADA ou SAIDA.';
  }

  if (!FORMAS_PAGAMENTO.includes(forma_pagamento)) {
    return 'Campo "forma_pagamento" deve ser DEBITO ou CREDITO.';
  }

  if (valor === undefined || Number(valor) <= 0) {
    return 'Campo "valor" deve ser maior que zero.';
  }

  if (!data_movimento) {
    return 'Campo "data_movimento" é obrigatório.';
  }

  return null;
}

async function listar(req, res, next) {
  try {
    const [rows] = await db.query('SELECT * FROM transacao ORDER BY id DESC');
    return res.json(rows);
  } catch (err) {
    return next(err);
  }
}

async function buscarPorId(req, res, next) {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM transacao WHERE id = ?', [id]);

    if (!rows.length) {
      return res.status(404).json({ mensagem: 'Transação não encontrada.' });
    }

    return res.json(rows[0]);
  } catch (err) {
    return next(err);
  }
}

async function criar(req, res, next) {
  try {
    const erroValidacao = validarEntrada(req.body);
    if (erroValidacao) {
      return res.status(400).json({ mensagem: erroValidacao });
    }

    const {
      tipo,
      descricao,
      valor,
      data_movimento,
      forma_pagamento,
      cartao_id = null,
      total_parcelas = 1
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO transacao
       (tipo, descricao, valor, data_movimento, forma_pagamento, cartao_id, total_parcelas)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [tipo, descricao, valor, data_movimento, forma_pagamento, cartao_id, total_parcelas]
    );

    const [rows] = await db.query('SELECT * FROM transacao WHERE id = ?', [result.insertId]);
    return res.status(201).json(rows[0]);
  } catch (err) {
    return next(err);
  }
}

async function atualizar(req, res, next) {
  try {
    const { id } = req.params;

    const [exists] = await db.query('SELECT id FROM transacao WHERE id = ?', [id]);
    if (!exists.length) {
      return res.status(404).json({ mensagem: 'Transação não encontrada.' });
    }

    const {
      tipo,
      descricao,
      valor,
      data_movimento,
      forma_pagamento,
      cartao_id,
      total_parcelas
    } = req.body;

    await db.query(
      `UPDATE transacao
       SET tipo = COALESCE(?, tipo),
           descricao = COALESCE(?, descricao),
           valor = COALESCE(?, valor),
           data_movimento = COALESCE(?, data_movimento),
           forma_pagamento = COALESCE(?, forma_pagamento),
           cartao_id = COALESCE(?, cartao_id),
           total_parcelas = COALESCE(?, total_parcelas)
       WHERE id = ?`,
      [tipo, descricao, valor, data_movimento, forma_pagamento, cartao_id, total_parcelas, id]
    );

    const [rows] = await db.query('SELECT * FROM transacao WHERE id = ?', [id]);
    return res.json(rows[0]);
  } catch (err) {
    return next(err);
  }
}

async function remover(req, res, next) {
  try {
    const { id } = req.params;

    const [result] = await db.query('DELETE FROM transacao WHERE id = ?', [id]);
    if (!result.affectedRows) {
      return res.status(404).json({ mensagem: 'Transação não encontrada.' });
    }

    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listar,
  buscarPorId,
  criar,
  atualizar,
  remover
};
