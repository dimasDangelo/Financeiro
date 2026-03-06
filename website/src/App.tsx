import { useEffect, useMemo, useState } from 'react';
import Modal from './Componentes/Modal';
import Movimento from './Componentes/Movimento';
import StyledGrid from './Componentes/StyledGrid';
import './styles/App.css';

type TipoMovimento = 'ENTRADA' | 'SAIDA';

type Transacao = {
  id: number;
  transacao_id: number;
  tipo: TipoMovimento;
  descricao: string;
  valor: number;
  data_movimento: string;
  forma_pagamento: 'DEBITO' | 'CREDITO';
  cartao_id: number | null;
};

type Cartao = {
  id: number;
  nome: string;
};

type AbaPainel = 'lancamentos' | 'cartoes';

const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:3001';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

function App() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [modalMovimentoOpen, setModalMovimentoOpen] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<AbaPainel>('lancamentos');

  const hoje = new Date();
  const mesAtual = String(hoje.getMonth() + 1).padStart(2, '0');
  const anoAtual = String(hoje.getFullYear());
  const [mesSelecionado, setMesSelecionado] = useState(mesAtual);
  const [anoSelecionado, setAnoSelecionado] = useState(anoAtual);
  const [cartaoSelecionado, setCartaoSelecionado] = useState('todos');

  const carregarTransacoes = async () => {
    try {
      setCarregando(true);
      setErro(null);

      const [transacoesResposta, cartoesResposta] = await Promise.all([
        fetch(`${API_BASE_URL}/api/transacoes`),
        fetch(`${API_BASE_URL}/api/cartoes`),
      ]);

      if (!transacoesResposta.ok) {
        throw new Error('Não foi possível carregar as transações.');
      }

      if (!cartoesResposta.ok) {
        throw new Error('Não foi possível carregar os cartões.');
      }

      const [transacoesDados, cartoesDados] = await Promise.all([
        transacoesResposta.json(),
        cartoesResposta.json(),
      ]);

      setTransacoes(transacoesDados);
      setCartoes(cartoesDados);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao carregar informações do dashboard.');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarTransacoes();
  }, []);

  const opcoesMes = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => {
        const value = String(index + 1).padStart(2, '0');
        const label = new Date(2000, index, 1).toLocaleDateString('pt-BR', { month: 'long' });
        return {
          value,
          label: label.charAt(0).toUpperCase() + label.slice(1),
        };
      }),
    []
  );

  const opcoesAno = useMemo(() => {
    const anos = new Set<string>([anoAtual]);
    transacoes.forEach((transacao) => {
      anos.add(transacao.data_movimento.slice(0, 4));
    });

    return Array.from(anos).sort((a, b) => Number(b) - Number(a));
  }, [transacoes, anoAtual]);

  const transacoesDoMes = useMemo(
    () =>
      transacoes.filter(
        (transacao) =>
          transacao.data_movimento.slice(0, 4) === anoSelecionado &&
          transacao.data_movimento.slice(5, 7) === mesSelecionado
      ),
    [transacoes, anoSelecionado, mesSelecionado]
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

  const gastosPorCartao = useMemo(() => {
    return transacoesDoMes
      .filter((transacao) => transacao.tipo === 'SAIDA' && transacao.forma_pagamento === 'CREDITO')
      .filter((transacao) => (cartaoSelecionado === 'todos' ? true : String(transacao.cartao_id) === cartaoSelecionado))
      .map((transacao) => {
        const cartaoNome =
          cartoes.find((cartao) => cartao.id === transacao.cartao_id)?.nome || 'Cartão não identificado';

        return {
          id: transacao.id,
          descricao: transacao.descricao || 'Sem descrição',
          cartao: cartaoNome,
          data: new Date(`${transacao.data_movimento}T00:00:00`).toLocaleDateString('pt-BR'),
          valor: Number(transacao.valor),
        };
      });
  }, [transacoesDoMes, cartaoSelecionado, cartoes]);

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
        <div>
          <p className="filtro-titulo">Referência</p>
          <span className="filtro-subtitulo">Selecione o mês e o ano para análise</span>
        </div>

        <div className="filtro-referencia-grid">
          <div className="filtro-campo">
            <label htmlFor="mes">Mês</label>
            <select id="mes" value={mesSelecionado} onChange={(e) => setMesSelecionado(e.target.value)}>
              {opcoesMes.map((mes) => (
                <option key={mes.value} value={mes.value}>
                  {mes.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filtro-campo">
            <label htmlFor="ano">Ano</label>
            <select id="ano" value={anoSelecionado} onChange={(e) => setAnoSelecionado(e.target.value)}>
              {opcoesAno.map((ano) => (
                <option key={ano} value={ano}>
                  {ano}
                </option>
              ))}
            </select>
          </div>
        </div>
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
        <div className="transacoes-topo">
          <h2>Painel de movimentações</h2>
          <div className="abas-painel" role="tablist" aria-label="Visualização de movimentações">
            <button
              className={`aba-painel ${abaAtiva === 'lancamentos' ? 'ativa' : ''}`}
              onClick={() => setAbaAtiva('lancamentos')}
            >
              Lançamentos
            </button>
            <button
              className={`aba-painel ${abaAtiva === 'cartoes' ? 'ativa' : ''}`}
              onClick={() => setAbaAtiva('cartoes')}
            >
              Gastos por cartão
            </button>
          </div>
        </div>

        {carregando ? (
          <p>Carregando dados...</p>
        ) : abaAtiva === 'lancamentos' ? (
          transacoesDoMes.length === 0 ? (
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
          )
        ) : (
          <div className="gastos-cartao-painel">
            <div className="gastos-cartao-filtro">
              <label htmlFor="cartao">Cartão</label>
              <select
                id="cartao"
                value={cartaoSelecionado}
                onChange={(e) => setCartaoSelecionado(e.target.value)}
              >
                <option value="todos">Todos os cartões</option>
                {cartoes.map((cartao) => (
                  <option key={cartao.id} value={String(cartao.id)}>
                    {cartao.nome}
                  </option>
                ))}
              </select>
            </div>

            <StyledGrid
              columns={[
                { key: 'descricao', label: 'Descrição' },
                { key: 'cartao', label: 'Cartão' },
                { key: 'data', label: 'Data' },
                {
                  key: 'valor',
                  label: 'Valor',
                  render: (value) => (
                    <strong className="grid-valor-saida">
                      {currencyFormatter.format(Number(value))}
                    </strong>
                  ),
                },
              ]}
              rows={gastosPorCartao}
              getRowId={(row) => row.id}
              emptyMessage="Sem gastos de crédito para os filtros selecionados."
            />
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
