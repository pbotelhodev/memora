import React, { useState, useEffect } from "react";
import {
  X,
  CreditCard,
  QrCode,
  Copy,
  CheckCircle,
  Loader2,
  User,
  CalendarDays,
  Lock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import Inputs from "./Inputs"; // Reutilizando seu componente de input
import { maskCardNumber, maskCardExpiry, maskCVV } from "../utils/mask"; // Suas máscaras
import "../styles/PaymentModal.css";

// URL da API (Ngrok)
const API_URL = "https://api-memora.onrender.com";

const PaymentModal = ({ isOpen, onClose, paymentData }) => {
  const navigate = useNavigate();

  // --- STATES ---
  const [method, setMethod] = useState("PIX"); // PIX ou CARD
  const [loading, setLoading] = useState(false);

  // States do Pix
  const [pixResult, setPixResult] = useState(null);
  const [copied, setCopied] = useState(false);

  // States do Cartão
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  // --- CORREÇÃO BUG 1: RESETAR AO ABRIR ---
  useEffect(() => {
    if (isOpen) {
      setPixResult(null); // Limpa o QR Code antigo
      setMethod("PIX"); // Reseta para a aba inicial
      setLoading(false);
      // Limpa formulário do cartão
      setCardName("");
      setCardNumber("");
      setCardExpiry("");
      setCardCvv("");
    }
  }, [isOpen]);

  if (!isOpen || !paymentData) return null;

  // --- FUNÇÃO DE PAGAMENTO ---
  const handleConfirmPayment = async () => {
    setLoading(true);

    try {
      // Payload base
      const payload = {
        nome: paymentData.cliente.nome,
        cpf: paymentData.cliente.cpf,
        email: paymentData.cliente.email,
        valor: paymentData.valor,
        tipo: method,
        cep: paymentData.cliente.cep, // <--- O servidor precisa disso!
        numero: paymentData.cliente.numero, // <--- E disso!
        phone: paymentData.cliente.phone, // <--- E disso!
      };
      console.log("ENVIANDO PARA O SERVIDOR:", payload);
      // Se for cartão, adiciona os dados extras
      if (method === "CREDIT_CARD") {
        payload.card = {
          holderName: cardName,
          number: cardNumber.replace(/\s/g, ""), // Remove espaços pra enviar
          expiryMonth: cardExpiry.split("/")[0],
          expiryYear: cardExpiry.split("/")[1],
          ccv: cardCvv,
        };
      }

      const response = await fetch(`${API_URL}/criar-pagamento`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await response.json();

      if (json.sucesso) {
        // CENÁRIO PIX (Mostra QR Code)
        if (json.tipo === "PIX") {
          await salvarIdPagamento(json.pagamentoId);
          setPixResult(json);
        }

        // CENÁRIO CARTÃO (Redireciona ou Avisa)
        else if (json.tipo === "CREDIT_CARD") {
          await salvarIdPagamento(json.pagamentoId);

          if (json.status === "CONFIRMED") {
            alert("Pagamento Aprovado! 🎉");
            navigate(`/painel/${paymentData.slug}`);
          } else {
            alert(
              "Pagamento em análise. Assim que aprovar, você receberá um e-mail."
            );
            // Pode fechar o modal ou limpar
            onClose();
          }
        }
      } else {
        alert("Erro no pagamento: " + json.erro);
      }
    } catch (error) {
      console.error(error);
      alert("Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  // Função auxiliar pra salvar o ID no Supabase
  const salvarIdPagamento = async (idPagamento) => {
    await supabase
      .from("festas")
      .update({ asaas_id: idPagamento })
      .eq("slug", paymentData.slug);
  };

  // --- RENDER: SELEÇÃO E FORMULÁRIO ---
  const renderSelection = () => (
    <>
      <div className="method-tabs">
        <button
          className={`tab-btn ${method === "PIX" ? "active" : ""}`}
          onClick={() => setMethod("PIX")}
        >
          <QrCode size={20} /> PIX
        </button>
        <button
          className={`tab-btn ${method === "CREDIT_CARD" ? "active" : ""}`}
          onClick={() => setMethod("CREDIT_CARD")}
        >
          <CreditCard size={20} /> Cartão
        </button>
      </div>

      {/* --- FORMULÁRIO DO CARTÃO --- */}
      {method === "CREDIT_CARD" && (
        <div className="card-form-container" style={{ textAlign: "left" }}>
          <Inputs
            label="Número do Cartão"
            placeholder="0000 0000 0000 0000"
            icon={<CreditCard size={18} />}
            value={cardNumber}
            onChange={(e) => setCardNumber(maskCardNumber(e.target.value))}
          />
          <Inputs
            label="Nome Impresso"
            placeholder="Como no cartão"
            icon={<User size={18} />}
            value={cardName}
            onChange={(e) => setCardName(e.target.value.toUpperCase())}
          />
          <div style={{ display: "flex", gap: "10px" }}>
            <Inputs
              label="Validade"
              placeholder="MM/AAAA"
              icon={<CalendarDays size={18} />}
              value={cardExpiry}
              onChange={(e) => setCardExpiry(maskCardExpiry(e.target.value))}
            />
            <Inputs
              label="CVV"
              placeholder="123"
              icon={<Lock size={18} />}
              type="tel"
              maxLen={4}
              value={cardCvv}
              onChange={(e) => setCardCvv(maskCVV(e.target.value))}
            />
          </div>
        </div>
      )}

      {/* --- INFO DO PIX --- */}
      {method === "PIX" && (
        <div className="pix-info">
          <p>Aprovação imediata via QR Code. O método mais rápido.</p>
        </div>
      )}

      <button
        className="btn-pay-confirm"
        onClick={handleConfirmPayment}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="spin" />
        ) : (
          `Pagar R$ ${paymentData.valor}`
        )}
      </button>
    </>
  );

  // --- RENDER: RESULTADO DO PIX ---
  const renderPixResult = () => (
    <div className="pix-result">
      <img
        src={`data:image/png;base64,${pixResult.qrCodeImagem}`}
        alt="QR Code"
        style={{ width: "180px", display: "block", margin: "0 auto 20px" }}
      />

      <div className="copy-box">
        <input readOnly value={pixResult.pixCopiaCola} />
        <button
          onClick={() => {
            navigator.clipboard.writeText(pixResult.pixCopiaCola);
            setCopied(true);
          }}
        >
          {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
        </button>
      </div>

      <button
        className="btn-success"
        onClick={() => navigate(`/painel/${paymentData.slug}`)}
        style={{
          marginTop: "20px",
          width: "100%",
          padding: "15px",
          background: "#10B981",
          border: "none",
          color: "white",
          borderRadius: "10px",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        Já fiz o pagamento
      </button>
    </div>
  );

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <button className="btn-close" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="modal-header">
          <h2>{pixResult ? "Escaneie para Pagar" : "Finalizar Compra"}</h2>
          <p>Sua festa: {paymentData.slug}</p>
        </div>

        {pixResult ? renderPixResult() : renderSelection()}
      </div>
    </div>
  );
};

export default PaymentModal;
