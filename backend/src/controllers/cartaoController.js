const db = require('../config/database');

async function listar(req, res, next) {
  try {
    const [rows] = await db.query('SELECT * FROM cartao ORDER BY id DESC');
    return res.json(rows);
  } catch (err) {
    return next(err);
  }
}

async function buscarPorId(req, res, next) {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM cartao WHERE id = ?', [id]);

    if (!rows.length) {
      return res.status(404).json({ mensagem: 'Cartão não encontrado.' });
    }

    return res.json(rows[0]);
  } catch (err) {
    return next(err);
  }
}

async function criar(req, res, next) {
  try {
    const { nome, limite, fechamento_dia, vencimento_dia, ativo = true } = req.body;

    if (!nome || limite === undefined || !fechamento_dia || !vencimento_dia) {
      return res.status(400).json({
        mensagem: 'Campos obrigatórios: nome, limite, fechamento_dia, vencimento_dia.'
      });
    }

    const [result] = await db.query(
      `INSERT INTO cartao (nome, limite, fechamento_dia, vencimento_dia, ativo)
       VALUES (?, ?, ?, ?, ?)`,
      [nome, limite, fechamento_dia, vencimento_dia, ativo]
    );

    const [rows] = await db.query('SELECT * FROM cartao WHERE id = ?', [result.insertId]);
    return res.status(201).json(rows[0]);
  } catch (err) {
    return next(err);
  }
}

async function atualizar(req, res, next) {
  try {
    const { id } = req.params;
    const { nome, limite, fechamento_dia, vencimento_dia, ativo } = req.body;

    const [exists] = await db.query('SELECT id FROM cartao WHERE id = ?', [id]);
    if (!exists.length) {
      return res.status(404).json({ mensagem: 'Cartão não encontrado.' });
    }

    await db.query(
      `UPDATE cartao
       SET nome = COALESCE(?, nome),
           limite = COALESCE(?, limite),
           fechamento_dia = COALESCE(?, fechamento_dia),
           vencimento_dia = COALESCE(?, vencimento_dia),
           ativo = COALESCE(?, ativo)
       WHERE id = ?`,
      [nome, limite, fechamento_dia, vencimento_dia, ativo, id]
    );

    const [rows] = await db.query('SELECT * FROM cartao WHERE id = ?', [id]);
    return res.json(rows[0]);
  } catch (err) {
    return next(err);
  }
}

async function remover(req, res, next) {
  try {
    const { id } = req.params;

    const [result] = await db.query('DELETE FROM cartao WHERE id = ?', [id]);
    if (!result.affectedRows) {
      return res.status(404).json({ mensagem: 'Cartão não encontrado.' });
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
