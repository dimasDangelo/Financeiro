const db = require('../config/database');

async function listar(req, res, next) {
  try {
    const [rows] = await db.query('SELECT * FROM parcela ORDER BY id DESC');
    return res.json(rows);
  } catch (err) {
    return next(err);
  }
}

async function buscarPorId(req, res, next) {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM parcela WHERE id = ?', [id]);

    if (!rows.length) {
      return res.status(404).json({ mensagem: 'Parcela não encontrada.' });
    }

    return res.json(rows[0]);
  } catch (err) {
    return next(err);
  }
}

async function criar(req, res, next) {
  try {
    const { transacao_id, numero_parcela, valor, data_vencimento, paga = false } = req.body;

    if (!transacao_id || !numero_parcela || valor === undefined || !data_vencimento) {
      return res.status(400).json({
        mensagem: 'Campos obrigatórios: transacao_id, numero_parcela, valor, data_vencimento.'
      });
    }

    const [result] = await db.query(
      `INSERT INTO parcela (transacao_id, numero_parcela, valor, data_vencimento, paga)
       VALUES (?, ?, ?, ?, ?)`,
      [transacao_id, numero_parcela, valor, data_vencimento, paga]
    );

    const [rows] = await db.query('SELECT * FROM parcela WHERE id = ?', [result.insertId]);
    return res.status(201).json(rows[0]);
  } catch (err) {
    return next(err);
  }
}

async function atualizar(req, res, next) {
  try {
    const { id } = req.params;
    const { transacao_id, numero_parcela, valor, data_vencimento, paga } = req.body;

    const [exists] = await db.query('SELECT id FROM parcela WHERE id = ?', [id]);
    if (!exists.length) {
      return res.status(404).json({ mensagem: 'Parcela não encontrada.' });
    }

    await db.query(
      `UPDATE parcela
       SET transacao_id = COALESCE(?, transacao_id),
           numero_parcela = COALESCE(?, numero_parcela),
           valor = COALESCE(?, valor),
           data_vencimento = COALESCE(?, data_vencimento),
           paga = COALESCE(?, paga)
       WHERE id = ?`,
      [transacao_id, numero_parcela, valor, data_vencimento, paga, id]
    );

    const [rows] = await db.query('SELECT * FROM parcela WHERE id = ?', [id]);
    return res.json(rows[0]);
  } catch (err) {
    return next(err);
  }
}

async function remover(req, res, next) {
  try {
    const { id } = req.params;

    const [result] = await db.query('DELETE FROM parcela WHERE id = ?', [id]);
    if (!result.affectedRows) {
      return res.status(404).json({ mensagem: 'Parcela não encontrada.' });
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
