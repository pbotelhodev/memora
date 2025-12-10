import React, { useState } from "react";
import { supabase } from "../services/supabaseClient";
import { maskCPF } from "../utils/mask";
import {
  Wallet,
  TrendingUp,
  Users,
  ChevronRight,
  Loader2,
  Lock,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import "../styles/AffiliatePage.css";
import logoMemora from "../assets/logo-memora.png";

const AffiliatePage = () => {
  // Estados de Login
  const [codigo, setCodigo] = useState("");
  const [cpf, setCpf] = useState("");

  // Estados de Dados
  const [parceiro, setParceiro] = useState(null);
  const [vendas, setVendas] = useState([]);

  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  // Aplica a máscara no CPF visualmente enquanto digita
  const handleCpfChange = (e) => {
    setCpf(maskCPF(e.target.value));
  };

  // --- LÓGICA DE LOGIN (CORRIGIDA) ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErro("");

    try {
      if (!codigo || !cpf) {
        throw new Error("Por favor, preencha o Código e o CPF.");
      }

      // 1. LIMPA O CPF (Remove pontos e traços)
      // O banco tem "12345678900", então precisamos enviar igual.
      const cpfLimpo = cpf.replace(/\D/g, "");

      // 2. Busca o Cupom
      const { data: cupomData, error } = await supabase
        .from("cupons")
        .select("*")
        .eq("codigo", codigo.toUpperCase().trim())
        .eq("parceiro_cpf", cpfLimpo) // <--- USA O CPF LIMPO AQUI
        .eq("ativo", true)
        .maybeSingle();

      if (error) {
        console.error("Erro Supabase:", error);
        throw new Error("Erro de conexão. Tente novamente.");
      }

      if (!cupomData) {
        throw new Error(
          "Dados incorretos. Verifique se o Código e o CPF estão iguais ao cadastro."
        );
      }

      // 3. Busca as vendas
      const { data: vendasData } = await supabase
        .from("festas")
        .select("nome_cliente, nome_festa, created_at, status, valor_pago")
        .eq("cupom_usado", cupomData.codigo)
        .neq("status", "PENDENTE")
        .order("created_at", { ascending: false });

      setParceiro(cupomData);
      setVendas(vendasData || []);
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- CÁLCULOS FINANCEIROS ---
  const calcularFinanceiro = () => {
    if (!parceiro) return { saldo: 0, liberado: false, totalVendas: 0 };

    const totalVendas = vendas.length;
    const porcentagem = Number(parceiro.comissao_por_venda) || 0;

    let totalGerado = 0;
    vendas.forEach((venda) => {
      const valorFesta = Number(venda.valor_pago) || 0;
      // Aplica a % sobre o valor da festa
      totalGerado += valorFesta * (porcentagem / 100);
    });

    const jaPago = Number(parceiro.total_pago_parceiro) || 0;
    const saldoAtual = totalGerado - jaPago;

    return {
      saldo: saldoAtual > 0 ? saldoAtual : 0,
      totalVendas,
      liberado: saldoAtual >= 50,
    };
  };

  // --- TELA DE LOGIN ---
  if (!parceiro) {
    return (
      <div className="affiliate-login-container">
        <div className="affiliate-card fade-in">
          <img
            src={logoMemora}
            alt="Memora Partners"
            className="logo-partners"
          />
          <h2>Área do Parceiro</h2>
          <p>Acesso restrito para afiliados</p>

          <form onSubmit={handleLogin}>
            <div className="login-inputs-stack">
              <div className="input-box">
                <input
                  type="text"
                  placeholder="CÓDIGO DO CUPOM"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  className="input-login-partner"
                />
              </div>
              <div className="input-box">
                <input
                  type="tel"
                  placeholder="SEU CPF"
                  value={cpf}
                  onChange={handleCpfChange}
                  className="input-login-partner"
                  maxLength={14}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-login-partner"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="spin" size={20} />
              ) : (
                <>
                  Acessar Painel <ChevronRight size={20} />
                </>
              )}
            </button>

            {erro && (
              <span className="error-msg">
                <ShieldCheck size={14} /> {erro}
              </span>
            )}
          </form>
        </div>
      </div>
    );
  }

  // --- DASHBOARD ---
  const fin = calcularFinanceiro();

  return (
    <div className="affiliate-dashboard">
      <header className="affiliate-header">
        <div className="user-welcome">
          <div className="avatar-letter">
            {parceiro.parceiro_nome?.charAt(0) || "P"}
          </div>
          <div>
            <h3>{parceiro.parceiro_nome || "Parceiro"}</h3>
            <span className="badge-code">#{parceiro.codigo}</span>
          </div>
        </div>
        <button className="btn-sair" onClick={() => setParceiro(null)}>
          <LogOut size={16} style={{ marginRight: 5 }} /> Sair
        </button>
      </header>

      <div className="balance-card animate-slide-up">
        <div className="balance-header">
          <span>Saldo Disponível</span>
          <Wallet size={20} />
        </div>
        <h1>
          R$ {fin.saldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </h1>

        <div className="payout-status">
          {fin.liberado ? (
            <div className="status-badge success">
              <TrendingUp size={14} /> Saque liberado para dia 05
            </div>
          ) : (
            <div className="status-badge locked">
              <Lock size={14} /> Mínimo para saque: R$ 50,00
            </div>
          )}
        </div>
      </div>

      <div
        className="sales-section animate-slide-up"
        style={{ animationDelay: "0.1s" }}
      >
        <div className="section-title">
          <h3>Vendas Realizadas ({fin.totalVendas})</h3>
          <span style={{ fontSize: "0.8rem", color: "#a855f7" }}>
            Comissão: {parceiro.comissao_por_venda}%
          </span>
        </div>

        {vendas.length === 0 ? (
          <div className="empty-state">
            <p>Nenhuma venda registrada ainda.</p>
          </div>
        ) : (
          <div className="sales-list">
            {vendas.map((venda, index) => {
              const valorFesta = Number(venda.valor_pago) || 0;
              const ganho =
                valorFesta * (Number(parceiro.comissao_por_venda) / 100);

              return (
                <div key={index} className="sale-item">
                  <div className="sale-icon">
                    {" "}
                    <Users size={18} />{" "}
                  </div>
                  <div className="sale-info">
                    <h4>{venda.nome_festa}</h4>
                    <p>
                      {new Date(venda.created_at).toLocaleDateString("pt-BR")} •{" "}
                      {venda.nome_cliente.split(" ")[0]}
                    </p>
                  </div>
                  <div className="sale-value">
                    <span className="value">+ R$ {ganho.toFixed(2)}</span>
                    <span className="date">
                      Venda: R$ {valorFesta.toFixed(0)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AffiliatePage;
