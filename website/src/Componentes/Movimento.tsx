import { useEffect, useState } from "react";
import Modal from "./Modal";
import FieldError from "./FieldError";
import Select from "./Select";


export function Movimento() {
  const [tipo, setTipo] = useState<"ENTRADA" | "SAIDA">("ENTRADA");
  const [formaPagamento, setFormaPagamento] = useState<"DEBITO" | "CREDITO" | "PRAZO">("DEBITO");
  const [input, setInput] = useState({
    descricao: "",
    valor: 0,
    data: "",
    cartao: "",
    totalParcelas: 0,
  });
  const [newCard, setNewCard] = useState({
    nome: "",
    limite: "",
    fechamento: "",
    vencimento: "",
  });
  const [modalCartaoOpen, setModalCartaoOpen] = useState(false);
  const optionsCard = ["Nubank", "Itaú", "Inter"];
  const [inputErrors, setInputErrors] = useState({
    nome: false,
    limite: false,
    fechamento: false,
    vencimento: false,
  });

const ValidateInputsCard = () => {
  resetInputErrors();
  let errorsFound = {
    nome: false,
    limite: false,
    fechamento: false,
    vencimento: false,  
  };

  if (newCard.nome.trim() === "") {
    errorsFound.nome = true;
  }
  if (Number.isNaN(parseInt(newCard.limite)) || parseInt(newCard.limite) <= 0) {
    errorsFound.limite = true;
  }
  if (newCard.fechamento.trim() === "") {
    errorsFound.fechamento = true;
  }
  if (newCard.vencimento.trim() === "") {
    errorsFound.vencimento = true;
  }
  if(Object.values(errorsFound).some((error) => error === true)) {
    setInputErrors(errorsFound);
    return;
  }
    //aqui vou adicionar o cartão e fechar o modal
    setModalCartaoOpen(false);
    resetInputcard();

}
const resetInputcard = () => {
  setNewCard({
    nome: "",
    limite: "",
    fechamento: "",
    vencimento: "",
  });
}
const resetInputErrors = () => {
  setInputErrors({
    nome: false,
    limite: false,
    fechamento: false,
    vencimento: false,
  });
} 

const handlechange = (event: React.ChangeEvent<HTMLSelectElement>) => {
  const {name, value} = event.target;
    setInput({ ...input, [name]: value });
  }

const handlechangeNewCard = (event: React.ChangeEvent<HTMLInputElement>) => {
  const {name, value} = event.target;
  if(name === "limite" || name === "fechamento" || name === "vencimento") {
      if(!/^\d*$/.test(value)) return; // aceita apenas números
      setNewCard({ ...newCard, [name]: value });
    }
    setNewCard({ ...newCard, [name]: value });
  }

  return (
    <div className="movimento-container">
      <h2>Movimento Financeiro</h2>

      <div className="grupo">
        <label>Tipo</label>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              value="ENTRADA"
              checked={tipo === "ENTRADA"}
              onChange={() => setTipo("ENTRADA")}
            />
            Entrada
          </label>

          <label>
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
        <input type="text" placeholder="Ex: Supermercado" />
      </div>

      <div className="grupo">
        <label>Valor</label>
        <input type="number" step="0.01" />
      </div>

      <div className="grupo">
        <label>Data do Movimento</label>
        <input type="date" />
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
            <label>
            <input
              type="radio"
              value="PRAZO"
              checked={formaPagamento === "PRAZO"}
              onChange={() => setFormaPagamento("PRAZO")}
            />
            Prazo
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
          onAction={ () => setModalCartaoOpen(true)}
          onChange={ () => handlechange}
          options={optionsCard.map(card => ({value: card, label: card}))}
          value={input.cartao}          
          />
        </div>
          <div className="grupo">
            <label>Total de Parcelas</label>
            <input type="number" min={1} />
          </div>
        </div>
      )}

      <button className="btn btn-active" onClick={ValidateInputsCard}>Salvar</button>

      <Modal
        isOpen={modalCartaoOpen}
        onClose={() => setModalCartaoOpen(false)}
        onSave={ValidateInputsCard}
        title="Novo Cartão"
      >
        <div className="grupo">
        <span>Nome do Cartão *</span>
        <input type="text" name="nome" value={newCard.nome} onChange={handlechangeNewCard} maxLength={20} placeholder="ex: Bradesco" />
        <FieldError error={inputErrors.nome}/> 
        </div>

        <div className="grupo">
          <span>Limite do Cartão *</span>
        <input type="text" name="limite" value={newCard.limite} onChange={handlechangeNewCard} maxLength={7}  placeholder="ex: 1000" />
        <FieldError error={inputErrors.limite} msg="Limite deve ser maior que zero"/>
        </div>

         <div className="grupo">
          <span>Fechamento dia *</span>
        <input type="text" name="fechamento" value={newCard.fechamento} onChange={handlechangeNewCard} maxLength={2} placeholder="ex: 17" />       
        <FieldError error={inputErrors.fechamento}/>
        </div>

         <div className="grupo">
          <span>Vencimento dia *</span>
        <input type="text" name="vencimento" value={newCard.vencimento} onChange={handlechangeNewCard} maxLength={2} placeholder="ex: 20" />       
        <FieldError error={inputErrors.vencimento}/>
        </div>
        </Modal>
    </div>
  );
}
export default Movimento;
