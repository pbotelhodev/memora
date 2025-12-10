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
  ListOrdered,
} from "lucide-react";
// IMPORTANTE: Adicionei useLocation aqui
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import Inputs from "./Inputs";
import { maskCardNumber, maskCardExpiry, maskCVV } from "../utils/mask";
import "../styles/PaymentModal.css";

// URL da API (Render)
const API_URL = "https://api-memora.onrender.com";

const PaymentModal = ({ isOpen, onClose, paymentData }) => {
  const navigate = useNavigate();
  const location = useLocation(); // Hook para saber a URL atual

  // --- CONFIGURAÇÃO ---
  const MAX_PARCELAS = 3;

  // --- STATES ---
  const [method, setMethod] = useState("PIX");
  const [loading, setLoading] = useState(false);

  // State do Parcelamento
  const [installments, setInstallments] = useState(1);

  // States do Pix
  const [pixResult, setPixResult] = useState(null);
  const [copied, setCopied] = useState(false);

  // States do Cartão
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  // --- RESETAR AO ABRIR ---
  useEffect(() => {
    if (isOpen) {
      setPixResult(null);
      setMethod("PIX");
      setLoading(false);
      setInstallments(1);
      setCardName("");
      setCardNumber("");
      setCardExpiry("");
      setCardCvv("");
    }
  }, [isOpen]);

  if (!isOpen || !paymentData) return null;

  // --- LÓGICA DE REDIRECIONAMENTO ---
  const handleSuccessRedirect = () => {
    if (location.pathname.includes("/painel/")) {
      window.location.reload();
    } else {
      navigate(`/painel/${paymentData.slug}`);
    }
  };

  // --- CÁLCULO DE PARCELAS ---
  const valorTotal = parseFloat(paymentData.valor);

  const opcoesParcelamento = Array.from(
    { length: MAX_PARCELAS },
    (_, i) => i + 1
  );

  // --- FUNÇÃO DE PAGAMENTO ---
  const handleConfirmPayment = async () => {
    setLoading(true);

    try {
      const payload = {
        nome: paymentData.cliente.nome,
        cpf: paymentData.cliente.cpf,
        email: paymentData.cliente.email,
        valor: paymentData.valor,
        tipo: method,
        cep: paymentData.cliente.cep,
        numero: paymentData.cliente.numero,
        phone: paymentData.cliente.phone,
      };

      if (method === "CREDIT_CARD") {
        payload.card = {
          holderName: cardName,
          number: cardNumber.replace(/\s/g, ""),
          expiryMonth: cardExpiry.split("/")[0],
          expiryYear: cardExpiry.split("/")[1],
          ccv: cardCvv,
          installmentCount: installments,
          installmentValue: valorTotal / installments,
        };
      }

      console.log("ENVIANDO PAYLOAD:", payload);

      const response = await fetch(`${API_URL}/criar-pagamento`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await response.json();

      if (json.sucesso) {
        const pixParaSalvar = json.tipo === "PIX" ? json.pixCopiaCola : null;
        await salvarDadosPagamento(json.pagamentoId, pixParaSalvar);

        if (json.tipo === "PIX") {
          setPixResult(json);
        } else {
          if (json.status === "CONFIRMED") {
            alert("Pagamento Aprovado! 🎉");
            handleSuccessRedirect(); // Chama a função inteligente
          } else {
            alert("Pagamento em análise ou recusado.");
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

  const salvarDadosPagamento = async (idPagamento, pixCode) => {
    const dadosUpdate = { asaas_id: idPagamento };
    if (pixCode) {
      dadosUpdate.pix_copia_cola = pixCode;
    }
    await supabase
      .from("festas")
      .update(dadosUpdate)
      .eq("slug", paymentData.slug);
  };

  // --- RENDER DA SELEÇÃO ---
  const renderSelection = () => (
    <>
      <div className="value-display-area">
        <span className="label-total">Total a pagar</span>
        <h3>
          R$ {valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </h3>

        {installments > 1 && (
          <div className="installments-badge">
            <p>
              {installments}x de R${" "}
              {(valorTotal / installments).toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </p>
          </div>
        )}
      </div>

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

      {method === "CREDIT_CARD" && (
        <div className="card-form-container">
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

          <div className="row-inputs">
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

          <div className="input-wrapper mt-10">
            <label className="input-label">Parcelamento</label>
            <div className="input-field-container">
              <ListOrdered size={18} className="input-icon" />
              <select
                className="custom-select"
                value={installments}
                onChange={(e) => setInstallments(Number(e.target.value))}
              >
                {opcoesParcelamento.map((qtd) => {
                  const valorParcela = valorTotal / qtd;
                  return (
                    <option key={qtd} value={qtd}>
                      {qtd}x de R${" "}
                      {valorParcela.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      {qtd === 1 ? "(À vista)" : "(Sem juros)"}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>
      )}

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
        ) : method === "PIX" ? (
          `Pagar R$ ${valorTotal.toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
          })}`
        ) : (
          `Confirmar Pagamento`
        )}
      </button>
    </>
  );

  // --- RENDER: PIX RESULT ---
  const renderPixResult = () => (
    <div className="pix-result">
      <img
        src={`data:image/png;base64,${pixResult.qrCodeImagem}`}
        alt="QR Code"
        className="qr-img-result"
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

      {/* Botão agora usa a lógica inteligente */}
      <button className="btn-success" onClick={handleSuccessRedirect}>
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
