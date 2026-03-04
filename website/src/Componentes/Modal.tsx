
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  title: string;
  children: React.ReactNode;
}
export default function Modal({ 
    isOpen,
    onClose,
    onSave,
    title,
    children
 }: 
 ModalProps) {
    if (!isOpen) return null;
    
    return (
        <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          {title}
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="modal-body">
          {children}
        </div>
        <div className="modal-footer">
          <div className="radio-group">
          <button className="btn btn-success" onClick={onSave}>Salvar</button>
          <button className="btn btn-danger" onClick={onClose}>Fechar</button>
          </div>
        </div>
      </div>
    </div>
    )
 }