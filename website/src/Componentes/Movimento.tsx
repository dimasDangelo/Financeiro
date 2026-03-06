import { useEffect, useMemo, useState } from "react";
import Modal from "./Modal";
import FieldError from "./FieldError";
import Select from "./Select";

type FormaPagamento = "DEBITO" | "CREDITO";
type TipoMovimento = "ENTRADA" | "SAIDA";

type Cartao = {
  id: number;
  nome: string;
};

const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:3001";

type MovimentoProps = {
  onSaved?: () => void;
};

const formatCurrencyMask = (value: string) => {
  const onlyDigits = value.replace(/\D/g, "");
  if (!onlyDigits) return "";

  const amount = Number(onlyDigits) / 100;
  return amount.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const parseCurrencyMask = (value: string) => {
  if (!value) return 0;
  return Number(value.replace(/\./g, "").replace(",", "."));
};

export function Movimento({ onSaved }: MovimentoProps) {
  const [tipo, setTipo] = useState<TipoMovimento>("ENTRADA");
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>("DEBITO");
  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  const [carregandoCartoes, setCarregandoCartoes] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const [input, setInput] = useState({
    descricao: "",
    valor: "",
    data: "",
    cartao: "",
    totalParcelas: "1",
  });

  const [newCard, setNewCard] = useState({
    nome: "",
    limite: "",
    fechamento: "",
    vencimento: "",
  });

  const [modalCartaoOpen, setModalCartaoOpen] = useState(false);

  const [inputErrors, setInputErrors] = useState({
    nome: false,
    limite: false,
    fechamento: false,
    vencimento: false,
  });

  async function carregarCartoes() {
    try {
      setCarregandoCartoes(true);
      const resposta = await fetch(`${API_BASE_URL}/api/cartoes`);
      if (!resposta.ok) {
        throw new Error("Não foi possível buscar os cartões cadastrados.");
      }

      const dados = await resposta.json();
      setCartoes(dados);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar cartões.");
    } finally {
      setCarregandoCartoes(false);
    }
  }

  useEffect(() => {
    carregarCartoes();
  }, []);

  const optionsCard = useMemo(
    () => cartoes.map((card) => ({ value: String(card.id), label: card.nome })),
    [cartoes]
  );

  const resetInputcard = () => {
    setNewCard({
      nome: "",
      limite: "",
      fechamento: "",
      vencimento: "",
    });
  };

  const resetInputErrors = () => {
    setInputErrors({
      nome: false,
      limite: false,
      fechamento: false,
      vencimento: false,
    });
  };

  const validateInputsCard = async () => {
    resetInputErrors();

    const errorsFound = {
      nome: false,
      limite: false,
      fechamento: false,
      vencimento: false,
    };

    if (newCard.nome.trim() === "") {
      errorsFound.nome = true;
    }
    const limiteNumerico = parseCurrencyMask(newCard.limite);
    if (Number.isNaN(limiteNumerico) || limiteNumerico <= 0) {
      errorsFound.limite = true;
    }
    if (
      Number.isNaN(parseInt(newCard.fechamento, 10)) ||
      parseInt(newCard.fechamento, 10) < 1 ||
      parseInt(newCard.fechamento, 10) > 31
    ) {
      errorsFound.fechamento = true;
    }
    if (
      Number.isNaN(parseInt(newCard.vencimento, 10)) ||
      parseInt(newCard.vencimento, 10) < 1 ||
      parseInt(newCard.vencimento, 10) > 31
    ) {
      errorsFound.vencimento = true;
    }

    if (Object.values(errorsFound).some((item) => item)) {
      setInputErrors(errorsFound);
      return;
    }

    try {
      setErro(null);
      const resposta = await fetch(`${API_BASE_URL}/api/cartoes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: newCard.nome.trim(),
          limite: limiteNumerico,
          fechamento_dia: Number(newCard.fechamento),
          vencimento_dia: Number(newCard.vencimento),
        }),
      });

      const dados = await resposta.json();
      if (!resposta.ok) {
        throw new Error(dados?.mensagem || "Erro ao cadastrar cartão.");
      }

      await carregarCartoes();
      setInput((prev) => ({ ...prev, cartao: String(dados.id) }));
      setMensagem("Cartão cadastrado com sucesso.");
      setModalCartaoOpen(false);
      resetInputcard();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao cadastrar cartão.");
    }
  };

  const handlechange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    if (name === "valor") {
      setInput((prev) => ({ ...prev, [name]: formatCurrencyMask(value) }));
      return;
    }

    if (name === "totalParcelas") {
      if (value === "" || /^\d+$/.test(value)) {
        setInput((prev) => ({ ...prev, [name]: value }));
      }
      return;
    }

    setInput((prev) => ({ ...prev, [name]: value }));
  };

  const handlechangeNewCard = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    if (name === "limite") {
      setNewCard((prev) => ({ ...prev, [name]: formatCurrencyMask(value) }));
      return;
    }

    if (name === "fechamento" || name === "vencimento") {
      if (!/^\d*$/.test(value)) return;
    }

    setNewCard((prev) => ({ ...prev, [name]: value }));
  };

  const salvarMovimento = async () => {
    try {
      setErro(null);
      setMensagem(null);

      if (!input.descricao.trim()) throw new Error("Informe a descrição do movimento.");
      const valorNumerico = parseCurrencyMask(input.valor);
      if (!input.valor || valorNumerico <= 0) throw new Error("Informe um valor maior que zero.");
      if (!input.data) throw new Error("Informe a data do movimento.");
      if (formaPagamento === "CREDITO" && !input.cartao) throw new Error("Selecione um cartão.");

      const totalParcelas = Number(input.totalParcelas || "1");
      if (formaPagamento === "CREDITO" && totalParcelas < 1) {
        throw new Error("Total de parcelas deve ser no mínimo 1.");
      }

      setSalvando(true);
      const resposta = await fetch(`${API_BASE_URL}/api/transacoes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo,
          descricao: input.descricao.trim(),
          valor: valorNumerico,
          data_movimento: input.data,
          forma_pagamento: formaPagamento,
          cartao_id: formaPagamento === "CREDITO" ? Number(input.cartao) : null,
          total_parcelas: formaPagamento === "CREDITO" ? totalParcelas : 1,
        }),
      });

      const dados = await resposta.json();
      if (!resposta.ok) {
        throw new Error(dados?.mensagem || "Erro ao salvar transação.");
      }

      setMensagem("Movimento salvo com sucesso.");
      setInput({ descricao: "", valor: "", data: "", cartao: "", totalParcelas: "1" });
      onSaved?.();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar movimento.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="movimento-container">
      {mensagem && <p className="feedback sucesso">{mensagem}</p>}
      {erro && <p className="feedback erro">{erro}</p>}

      <div className="grupo">
        <label>Tipo</label>
        <div className="radio-group">
          <label className="tipo-opcao tipo-opcao-entrada">
            <input
              type="radio"
              value="ENTRADA"
              checked={tipo === "ENTRADA"}
              onChange={() => setTipo("ENTRADA")}
            />
            Entrada
          </label>

          <label className="tipo-opcao tipo-opcao-saida">
            <input
              type="radio"
              value="SAIDA"
              checked={tipo === "SAIDA"}
              onChange={() => setTipo("SAIDA")}
            />
            Saída
          </label>
        </div>
      </div>
      <div className="grupo">
        <label>Descrição</label>
        <input
          type="text"
          name="descricao"
          value={input.descricao}
          onChange={handlechange}
          placeholder="Ex: Supermercado"
        />
      </div>

      <div className="grupo">
        <label>Valor</label>
        <input
          type="text"
          name="valor"
          value={input.valor}
          onChange={handlechange}
          placeholder="0,00"
          inputMode="decimal"
        />
      </div>

      <div className="grupo">
        <label>Data do Movimento</label>
        <input type="date" name="data" value={input.data} onChange={handlechange} />
      </div>

      <div className="grupo">
        <label>Forma de Pagamento</label>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              value="DEBITO"
              checked={formaPagamento === "DEBITO"}
              onChange={() => setFormaPagamento("DEBITO")}
            />
            Débito
          </label>
          <label>
            <input
              type="radio"
              value="CREDITO"
              checked={formaPagamento === "CREDITO"}
              onChange={() => setFormaPagamento("CREDITO")}
            />
            Crédito
          </label>
        </div>
      </div>

      {formaPagamento === "CREDITO" && (
        <div className="credito-box">
          <div className="grupo">
            <label>Cartão</label>
            <Select
              name="cartao"
              NameAction="Adicionar um novo cartão"
              onAction={() => setModalCartaoOpen(true)}
              onChange={handlechange}
              options={optionsCard}
              value={input.cartao}
              placeholder={carregandoCartoes ? "Carregando cartões..." : "Selecione um cartão"}
            />
          </div>
          <div className="grupo">
            <label>Total de Parcelas</label>
            <input
              type="text"
              name="totalParcelas"
              value={input.totalParcelas}
              onChange={handlechange}
              placeholder="1"
            />
          </div>
        </div>
      )}

      <button className="btn btn-active" onClick={salvarMovimento} disabled={salvando}>
        {salvando ? "Salvando..." : "Salvar"}
      </button>

      <Modal
        isOpen={modalCartaoOpen}
        onClose={() => setModalCartaoOpen(false)}
        onSave={validateInputsCard}
        title="Novo Cartão"
      >
        <div className="grupo">
          <span>Nome do Cartão *</span>
          <input
            type="text"
            name="nome"
            value={newCard.nome}
            onChange={handlechangeNewCard}
            maxLength={20}
            placeholder="ex: Bradesco"
          />
          <FieldError error={inputErrors.nome} />
        </div>

        <div className="grupo">
          <span>Limite do Cartão *</span>
          <input
            type="text"
            name="limite"
            value={newCard.limite}
            onChange={handlechangeNewCard}
            maxLength={15}
            placeholder="ex: 1000"
            inputMode="decimal"
          />
          <FieldError error={inputErrors.limite} msg="Limite deve ser maior que zero" />
        </div>

        <div className="grupo">
          <span>Fechamento dia *</span>
          <input
            type="text"
            name="fechamento"
            value={newCard.fechamento}
            onChange={handlechangeNewCard}
            maxLength={2}
            placeholder="ex: 17"
          />
          <FieldError error={inputErrors.fechamento} msg="Informe um dia válido (1-31)" />
        </div>

        <div className="grupo">
          <span>Vencimento dia *</span>
          <input
            type="text"
            name="vencimento"
            value={newCard.vencimento}
            onChange={handlechangeNewCard}
            maxLength={2}
            placeholder="ex: 20"
          />
          <FieldError error={inputErrors.vencimento} msg="Informe um dia válido (1-31)" />
        </div>
      </Modal>
    </div>
  );
}
export default Movimento;
