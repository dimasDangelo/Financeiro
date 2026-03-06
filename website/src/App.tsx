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
  total_parcelas: number;
  numero_parcela: number | null;
};

type Cartao = {
  id: number;
  nome: string;
  limite: number;
  fechamento_dia: number;
  vencimento_dia: number;
  ativo: boolean;
};

type AbaPainel = 'lancamentos' | 'gastos-cartao' | 'cartoes';

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
  const [cartaoSelecionado, setCartaoSelecionado] = useState('todos');

  const [cartaoEditando, setCartaoEditando] = useState<Cartao | null>(null);
  const [novoNomeCartao, setNovoNomeCartao] = useState('');
  const [modalExcluirCartaoOpen, setModalExcluirCartaoOpen] = useState(false);
  const [cartaoParaExcluir, setCartaoParaExcluir] = useState<Cartao | null>(null);

  const [modalExcluirTransacaoOpen, setModalExcluirTransacaoOpen] = useState(false);
  const [transacaoParaExcluir, setTransacaoParaExcluir] = useState<Transacao | null>(null);

  const hoje = new Date();
  const mesAtual = String(hoje.getMonth() + 1).padStart(2, '0');
  const anoAtual = String(hoje.getFullYear());
  const [mesSelecionado, setMesSelecionado] = useState(mesAtual);
  const [anoSelecionado, setAnoSelecionado] = useState(anoAtual);

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

  const cartoesTabela = useMemo(
    () =>
      cartoes.map((cartao) => ({
        id: cartao.id,
        nome: cartao.nome,
        limite: Number(cartao.limite),
        fechamento: cartao.fechamento_dia,
        vencimento: cartao.vencimento_dia,
        status: cartao.ativo ? 'Ativo' : 'Inativo',
      })),
    [cartoes]
  );

  const abrirEdicaoCartao = (cartao: Cartao) => {
    setCartaoEditando(cartao);
    setNovoNomeCartao(cartao.nome);
    setErro(null);
  };

  const salvarEdicaoCartao = async () => {
    if (!cartaoEditando) {
      return;
    }

    const nomeNormalizado = novoNomeCartao.trim();
    if (!nomeNormalizado) {
      setErro('Nome do cartão é obrigatório.');
      return;
    }

    const nomeDuplicado = cartoes.some(
      (cartao) => cartao.id !== cartaoEditando.id && cartao.nome.toLowerCase() === nomeNormalizado.toLowerCase()
    );

    if (nomeDuplicado) {
      setErro('Já existe cartão com esse nome.');
      return;
    }

    try {
      setErro(null);
      const resposta = await fetch(`${API_BASE_URL}/api/cartoes/${cartaoEditando.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nomeNormalizado }),
      });

      const dados = await resposta.json();
      if (!resposta.ok) {
        throw new Error(dados?.mensagem || 'Erro ao editar cartão.');
      }

      setCartaoEditando(null);
      setNovoNomeCartao('');
      await carregarTransacoes();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao editar cartão.');
    }
  };

  const alterarStatusCartao = async (cartao: Cartao) => {
    try {
      setErro(null);
      const resposta = await fetch(`${API_BASE_URL}/api/cartoes/${cartao.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !cartao.ativo }),
      });

      const dados = await resposta.json();
      if (!resposta.ok) {
        throw new Error(dados?.mensagem || 'Erro ao atualizar status do cartão.');
      }

      await carregarTransacoes();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao atualizar status do cartão.');
    }
  };

  const excluirCartao = async () => {
    if (!cartaoParaExcluir) {
      return;
    }

    try {
      setErro(null);
      const resposta = await fetch(`${API_BASE_URL}/api/cartoes/${cartaoParaExcluir.id}`, {
        method: 'DELETE',
      });

      if (!resposta.ok) {
        const dados = await resposta.json();
        throw new Error(dados?.mensagem || 'Erro ao excluir cartão.');
      }

      setModalExcluirCartaoOpen(false);
      setCartaoParaExcluir(null);
      await carregarTransacoes();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao excluir cartão.');
    }
  };

  const descricaoComParcela = (transacao: Transacao) => {
    if (transacao.forma_pagamento !== 'CREDITO' || transacao.total_parcelas <= 1 || !transacao.numero_parcela) {
      return transacao.descricao || 'Sem descrição';
    }

    const parcelaAtual = String(transacao.numero_parcela).padStart(2, '0');
    const totalParcelas = String(transacao.total_parcelas).padStart(2, '0');
    return `${transacao.descricao || 'Sem descrição'} ${parcelaAtual}/${totalParcelas}`;
  };

  const abrirExcluirTransacao = (transacao: Transacao) => {
    setTransacaoParaExcluir(transacao);
    setModalExcluirTransacaoOpen(true);
  };

  const excluirTransacao = async () => {
    if (!transacaoParaExcluir) {
      return;
    }

    try {
      setErro(null);
      const resposta = await fetch(`${API_BASE_URL}/api/transacoes/${transacaoParaExcluir.transacao_id}`, {
        method: 'DELETE',
      });

      if (!resposta.ok) {
        const dados = await resposta.json();
        throw new Error(dados?.mensagem || 'Erro ao excluir transação.');
      }

      setModalExcluirTransacaoOpen(false);
      setTransacaoParaExcluir(null);
      await carregarTransacoes();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao excluir transação.');
    }
  };

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
              className={`aba-painel ${abaAtiva === 'gastos-cartao' ? 'ativa' : ''}`}
              onClick={() => setAbaAtiva('gastos-cartao')}
            >
              Gastos por cartão
            </button>
            <button
              className={`aba-painel ${abaAtiva === 'cartoes' ? 'ativa' : ''}`}
              onClick={() => setAbaAtiva('cartoes')}
            >
              Cartões
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
                    <p>{descricaoComParcela(transacao)}</p>
                    <span>
                      {new Date(`${transacao.data_movimento}T00:00:00`).toLocaleDateString('pt-BR')} •{' '}
                      {transacao.forma_pagamento}
                      {transacao.forma_pagamento === 'CREDITO' && transacao.cartao_id
                        ? ` • ${cartoes.find((cartao) => cartao.id === transacao.cartao_id)?.nome || 'Cartão excluído'}`
                        : ''}
                    </span>
                  </div>
                  <div className="transacao-item-acoes">
                    <strong className={transacao.tipo === 'ENTRADA' ? 'valor-entrada' : 'valor-saida'}>
                      {transacao.tipo === 'ENTRADA' ? '+' : '-'}
                      {currencyFormatter.format(Number(transacao.valor))}
                    </strong>
                    <button className="btn-icon-danger" onClick={() => abrirExcluirTransacao(transacao)}>
                      🗑️
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )
        ) : abaAtiva === 'gastos-cartao' ? (
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
        ) : (
          <StyledGrid
            columns={[
              { key: 'nome', label: 'Nome' },
              { key: 'status', label: 'Status' },
              {
                key: 'limite',
                label: 'Limite',
                render: (value) => currencyFormatter.format(Number(value)),
              },
              { key: 'fechamento', label: 'Fechamento' },
              { key: 'vencimento', label: 'Vencimento' },
              {
                key: 'acoes',
                label: 'Ações',
                render: (_, row) => {
                  const cartao = cartoes.find((item) => item.id === row.id);
                  if (!cartao) return null;

                  return (
                    <div className="acoes-cartao-linha">
                      <button className="btn btn-small" onClick={() => abrirEdicaoCartao(cartao)}>
                        Editar
                      </button>
                      <button
                        className="btn btn-small"
                        onClick={() => alterarStatusCartao(cartao)}
                      >
                        {cartao.ativo ? 'Desativar' : 'Ativar'}
                      </button>
                      <button
                        className="btn btn-danger btn-small"
                        onClick={() => {
                          setCartaoParaExcluir(cartao);
                          setModalExcluirCartaoOpen(true);
                        }}
                      >
                        Excluir
                      </button>
                    </div>
                  );
                },
              },
            ]}
            rows={cartoesTabela as (Record<string, string | number> & { id: string | number })[]}
            getRowId={(row) => row.id}
            emptyMessage="Nenhum cartão cadastrado."
          />
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

      <Modal
        isOpen={!!cartaoEditando}
        onClose={() => setCartaoEditando(null)}
        onSave={salvarEdicaoCartao}
        title="Editar cartão"
      >
        <div className="grupo">
          <label>Nome do cartão</label>
          <input
            type="text"
            value={novoNomeCartao}
            onChange={(event) => setNovoNomeCartao(event.target.value)}
            maxLength={20}
          />
        </div>
      </Modal>

      <Modal
        isOpen={modalExcluirCartaoOpen}
        onClose={() => setModalExcluirCartaoOpen(false)}
        onSave={excluirCartao}
        title="Excluir cartão"
      >
        <p>
          Deseja realmente excluir o cartão <strong>{cartaoParaExcluir?.nome}</strong>? As transações já feitas vão
          permanecer sem vínculo com cartão.
        </p>
      </Modal>

      <Modal
        isOpen={modalExcluirTransacaoOpen}
        onClose={() => setModalExcluirTransacaoOpen(false)}
        onSave={excluirTransacao}
        title="Excluir transação"
      >
        <p>Deseja realmente excluir esta transação?</p>
      </Modal>
    </main>
  );
}

export default App;
