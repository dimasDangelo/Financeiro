const db = require('../config/database');

const TIPOS = ['ENTRADA', 'SAIDA'];
const FORMAS_PAGAMENTO = ['DEBITO', 'CREDITO'];

function adicionarMeses(dataBase, mesesParaAdicionar) {
  const data = new Date(`${dataBase}T00:00:00`);
  data.setMonth(data.getMonth() + mesesParaAdicionar);
  return data.toISOString().slice(0, 10);
}

function calcularValoresParcelas(valorTotal, quantidadeParcelas) {
  const valorEmCentavos = Math.round(Number(valorTotal) * 100);
  const valorBaseParcela = Math.floor(valorEmCentavos / quantidadeParcelas);
  const restante = valorEmCentavos % quantidadeParcelas;

  return Array.from({ length: quantidadeParcelas }, (_, index) => {
    const centavosParcela = valorBaseParcela + (index < restante ? 1 : 0);
    return centavosParcela / 100;
  });
}

function validarEntrada(payload) {
  const { tipo, valor, data_movimento, forma_pagamento, total_parcelas = 1 } = payload;

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

  if (!Number.isInteger(Number(total_parcelas)) || Number(total_parcelas) < 1) {
    return 'Campo "total_parcelas" deve ser um inteiro maior ou igual a 1.';
  }

  return null;
}

async function listar(req, res, next) {
  try {
    const [rows] = await db.query(
      `SELECT
         CASE
           WHEN t.forma_pagamento = 'CREDITO' AND t.total_parcelas > 1 THEN -p.id
           ELSE t.id
         END AS id,
         t.id AS transacao_id,
         t.tipo,
         t.descricao,
         CASE
           WHEN t.forma_pagamento = 'CREDITO' AND t.total_parcelas > 1 THEN p.valor
           ELSE t.valor
         END AS valor,
         CASE
           WHEN t.forma_pagamento = 'CREDITO' AND t.total_parcelas > 1 THEN p.data_vencimento
           ELSE t.data_movimento
         END AS data_movimento,
         t.forma_pagamento,
         t.cartao_id,
         t.total_parcelas,
         p.numero_parcela,
         p.paga
       FROM transacao t
       LEFT JOIN parcela p ON p.transacao_id = t.id
       WHERE t.forma_pagamento <> 'CREDITO'
          OR t.total_parcelas = 1
          OR p.id IS NOT NULL
       ORDER BY data_movimento DESC, transacao_id DESC, p.numero_parcela DESC`
    );

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
  const connection = await db.getConnection();

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

    const quantidadeParcelas = Number(total_parcelas) || 1;

    await connection.beginTransaction();

    const [result] = await connection.query(
      `INSERT INTO transacao
       (tipo, descricao, valor, data_movimento, forma_pagamento, cartao_id, total_parcelas)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [tipo, descricao, valor, data_movimento, forma_pagamento, cartao_id, quantidadeParcelas]
    );

    if (forma_pagamento === 'CREDITO' && quantidadeParcelas > 1) {
      const valoresParcelas = calcularValoresParcelas(valor, quantidadeParcelas);

      for (let index = 0; index < quantidadeParcelas; index += 1) {
        await connection.query(
          `INSERT INTO parcela (transacao_id, numero_parcela, valor, data_vencimento, paga)
           VALUES (?, ?, ?, ?, false)`,
          [
            result.insertId,
            index + 1,
            valoresParcelas[index],
            adicionarMeses(data_movimento, index)
          ]
        );
      }
    }

    await connection.commit();

    const [rows] = await connection.query('SELECT * FROM transacao WHERE id = ?', [result.insertId]);
    return res.status(201).json(rows[0]);
  } catch (err) {
    await connection.rollback();
    return next(err);
  } finally {
    connection.release();
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
