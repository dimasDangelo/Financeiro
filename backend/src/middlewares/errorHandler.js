function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.status) {
    return res.status(err.status).json({ mensagem: err.message });
  }

  return res.status(500).json({ mensagem: 'Erro interno no servidor.' });
}

module.exports = errorHandler;
