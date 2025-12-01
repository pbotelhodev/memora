import React, { useState } from "react";
import { Copy, X, CheckCircle } from "lucide-react"; // Ícones bonitos
import "../styles/PaymentModal.css"; // Já vamos criar esse CSS
import { useNavigate } from "react-router-dom";

const PaymentModal = ({ isOpen, onClose, paymentData }) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !paymentData) return null;

  // Função para copiar o código Pix
  const handleCopy = () => {
    navigator.clipboard.writeText(paymentData.pixCopiaCola);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reseta o texto do botão em 2s
  };

  // --- ÁREA DE CONTEÚDO DINÂMICO (FUTURO PROOF) ---
  const renderContent = () => {
    switch (paymentData.type) {
      case "PIX":
        return (
          <div className="pix-content">
            <div className="qr-container">
              {/* Imagem que vem do Asaas */}
              <img
                src={`data:image/png;base64,${paymentData.qrCodeImagem}`}
                alt="QR Code Pix"
              />
            </div>

            <p className="instruction">
              Abra o app do seu banco e escaneie o código ou use o copia e cola:
            </p>

            <div className="copy-box">
              <input readOnly value={paymentData.pixCopiaCola} />
              <button onClick={handleCopy} className={copied ? "success" : ""}>
                {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
                {copied ? "Copiado!" : "Copiar"}
              </button>
            </div>
          </div>
        );

      case "CREDIT_CARD":
        return (
          <div className="card-content">
            {/* FUTURO: Aqui vai entrar o form de cartão ou msg de sucesso */}
            <h3>Pagamento via Cartão</h3>
            <p>Em breve...</p>
          </div>
        );

      default:
        return <p>Método desconhecido.</p>;
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <button className="btn-close" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="modal-header">
          <h2>Pagamento Pendente</h2>
          <p>Sua festa está reservada! Finalize para liberar.</p>
        </div>

        {/* 1. PRIMEIRO MOSTRA O QR CODE */}
        {renderContent()}

        {/* 2. DEPOIS MOSTRA OS BOTÕES DE AÇÃO */}
        <div
          className="modal-actions"
          style={{
            marginTop: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <button
            onClick={() => navigate(`/painel/${paymentData.slug}`)}
            className="btn-primary"
            style={{ width: "100%", justifyContent: "center" }} // Ajuste pra centralizar texto
          >
            Já fiz o pagamento! 🚀
          </button>

          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#64748B",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Fechar e pagar depois
          </button>
        </div>

        <div className="modal-footer">
          <p className="security-note">
            🔒 Após o pagamento, a liberação é automática em segundos.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
