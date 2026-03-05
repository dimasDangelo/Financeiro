import { useEffect, useMemo, useState } from 'react';
import Modal from './Componentes/Modal';
import Movimento from './Componentes/Movimento';
import './styles/App.css';

type TipoMovimento = 'ENTRADA' | 'SAIDA';

type Transacao = {
  id: number;
  tipo: TipoMovimento;
  descricao: string;
  valor: number;
  data_movimento: string;
  forma_pagamento: 'DEBITO' | 'CREDITO';
};

const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:3001';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

function App() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [modalMovimentoOpen, setModalMovimentoOpen] = useState(false);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const [mesSelecionado, setMesSelecionado] = useState(currentMonth);

  const carregarTransacoes = async () => {
    try {
      setCarregando(true);
      setErro(null);
      const resposta = await fetch(`${API_BASE_URL}/api/transacoes`);
      if (!resposta.ok) {
        throw new Error('Não foi possível carregar as transações.');
      }

      const dados = await resposta.json();
      setTransacoes(dados);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao carregar transações.');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarTransacoes();
  }, []);

  const opcoesMes = useMemo(() => {
    const meses = new Set<string>([currentMonth]);

    transacoes.forEach((transacao) => {
      meses.add(transacao.data_movimento.slice(0, 7));
    });

    return Array.from(meses).sort((a, b) => b.localeCompare(a));
  }, [transacoes, currentMonth]);

  const transacoesDoMes = useMemo(
    () => transacoes.filter((transacao) => transacao.data_movimento.slice(0, 7) === mesSelecionado),
    [transacoes, mesSelecionado]
  );

  const resumo = useMemo(() => {
    const entradas = transacoesDoMes
      .filter((transacao) => transacao.tipo === 'ENTRADA')
      .reduce((acc, transacao) => acc + Number(transacao.valor), 0);

    const gastos = transacoesDoMes
      .filter((transacao) => transacao.tipo === 'SAIDA')
      .reduce((acc, transacao) => acc + Number(transacao.valor), 0);

    return {
      entradas,
      gastos,
      saldo: entradas - gastos,
    };
  }, [transacoesDoMes]);

  return (
    <main className="dashboard-page">
      <section className="dashboard-header">
        <div>
          <h1>Dashboard Financeiro</h1>
          <p>Acompanhe os gastos do mês atual e consulte meses anteriores.</p>
        </div>
        <button className="btn dashboard-cta" onClick={() => setModalMovimentoOpen(true)}>
          + Nova transação
        </button>
      </section>

      {erro && <p className="feedback erro">{erro}</p>}

      <section className="dashboard-filtros">
        <label htmlFor="mes">Mês de referência</label>
        <select id="mes" value={mesSelecionado} onChange={(e) => setMesSelecionado(e.target.value)}>
          {opcoesMes.map((mes) => (
            <option key={mes} value={mes}>
              {new Date(`${mes}-01T00:00:00`).toLocaleDateString('pt-BR', {
                month: 'long',
                year: 'numeric',
              })}
            </option>
          ))}
        </select>
      </section>

      <section className="resumo-grid">
        <article className="resumo-card entradas">
          <h3>Entradas</h3>
          <strong>{currencyFormatter.format(resumo.entradas)}</strong>
        </article>
        <article className="resumo-card gastos">
          <h3>Gastos</h3>
          <strong>{currencyFormatter.format(resumo.gastos)}</strong>
        </article>
        <article className="resumo-card saldo">
          <h3>Saldo do mês</h3>
          <strong>{currencyFormatter.format(resumo.saldo)}</strong>
        </article>
      </section>

      <section className="transacoes-card">
        <h2>Lançamentos do mês</h2>

        {carregando ? (
          <p>Carregando transações...</p>
        ) : transacoesDoMes.length === 0 ? (
          <p>Nenhuma transação registrada para o mês selecionado.</p>
        ) : (
          <div className="transacoes-lista">
            {transacoesDoMes.map((transacao) => (
              <article key={transacao.id} className="transacao-item">
                <div>
                  <p>{transacao.descricao || 'Sem descrição'}</p>
                  <span>
                    {new Date(`${transacao.data_movimento}T00:00:00`).toLocaleDateString('pt-BR')} •{' '}
                    {transacao.forma_pagamento}
                  </span>
                </div>
                <strong className={transacao.tipo === 'ENTRADA' ? 'valor-entrada' : 'valor-saida'}>
                  {transacao.tipo === 'ENTRADA' ? '+' : '-'}
                  {currencyFormatter.format(Number(transacao.valor))}
                </strong>
              </article>
            ))}
          </div>
        )}
      </section>

      <Modal
        isOpen={modalMovimentoOpen}
        onClose={() => setModalMovimentoOpen(false)}
        title="Adicionar transação"
        hideFooter
      >
        <Movimento
          onSaved={() => {
            carregarTransacoes();
            setModalMovimentoOpen(false);
          }}
        />
      </Modal>
    </main>
  );
}

export default App;
