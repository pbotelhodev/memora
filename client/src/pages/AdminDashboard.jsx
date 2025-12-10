import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import {
  LayoutDashboard,
  PartyPopper,
  Ticket,
  Users,
  LogOut,
  TrendingUp,
  Image as ImageIcon,
  DollarSign,
  Search,
  Trash2,
  Plus,
  Check,
  X,
  Loader2,
  Wallet,
  ArrowUpRight, // Icone de Saque
  Banknote, // Icone de Dinheiro
} from "lucide-react";
import "../styles/AdminDashboard.css";
import logoMemora from "../assets/logo-memora.png";

// ============================================================================
// 1. DASHBOARD HOME
// ============================================================================
const DashboardHome = ({ stats, recentFestas }) => (
  <div className="animate-fade-in">
    <header className="content-header">
      <h1>Visão Geral</h1>
    </header>

    <div className="kpi-grid">
      <div className="kpi-card revenue">
        <div className="kpi-icon">
          <DollarSign size={24} />
        </div>
        <div className="kpi-info">
          <span>Faturamento Bruto</span>
          <h3>
            R${" "}
            {stats.faturamento.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
            })}
          </h3>
        </div>
      </div>
      <div className="kpi-card">
        <div className="kpi-icon purple">
          <PartyPopper size={24} />
        </div>
        <div className="kpi-info">
          <span>Total de Festas</span>
          <h3>{stats.totalFestas}</h3>
        </div>
      </div>
      <div className="kpi-card">
        <div className="kpi-icon blue">
          <Users size={24} />
        </div>
        <div className="kpi-info">
          <span>Afiliados Ativos</span>
          <h3>{stats.totalAfiliados}</h3>
        </div>
      </div>
      <div className="kpi-card">
        <div className="kpi-icon green">
          <Ticket size={24} />
        </div>
        <div className="kpi-info">
          <span>Cupons Usados</span>
          <h3>{stats.totalCuponsUsados}</h3>
        </div>
      </div>
    </div>

    <div className="recent-section">
      <h3>Últimas Festas Criadas</h3>
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Festa</th>
              <th>Cliente</th>
              <th>Data</th>
              <th>Status</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            {recentFestas.map((festa) => (
              <tr key={festa.id}>
                <td>
                  <span className="festa-name">{festa.nome_festa}</span>
                  <span className="festa-slug">/{festa.slug}</span>
                </td>
                <td>{festa.nome_cliente}</td>
                <td>
                  {new Date(festa.created_at).toLocaleDateString("pt-BR")}
                </td>
                <td>
                  <span
                    className={`status-tag ${
                      festa.status === "PENDENTE" ? "pending" : "active"
                    }`}
                  >
                    {festa.status}
                  </span>
                </td>
                <td>
                  R$ {Number(festa.valor_pago).toFixed(2).replace(".", ",")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

// ============================================================================
// 2. FESTAS MANAGER
// ============================================================================
const FestasManager = () => {
  const [festas, setFestas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");

  const fetchFestas = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("festas")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setFestas(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchFestas();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Tem certeza? Isso apagará todas as fotos também."))
      return;
    await supabase.from("festas").delete().eq("id", id);
    fetchFestas();
  };

  const festasFiltradas = festas.filter(
    (f) =>
      (f.nome_festa?.toLowerCase() || "").includes(busca.toLowerCase()) ||
      (f.nome_cliente?.toLowerCase() || "").includes(busca.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <header className="content-header">
        <h1>Gerenciar Festas</h1>
        <div className="header-actions">
          <div className="search-bar">
            <Search size={18} />
            <input
              type="text"
              placeholder="Buscar..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <button className="btn-refresh" onClick={fetchFestas}>
            Atualizar
          </button>
        </div>
      </header>

      <div className="table-container">
        {loading ? (
          <div className="p-20 text-center">Carregando...</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Festa / Slug</th>
                <th>Cliente</th>
                <th>Data</th>
                <th>Cupom</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {festasFiltradas.map((f) => (
                <tr key={f.id}>
                  <td>
                    <span className="festa-name">{f.nome_festa}</span>
                    <span className="festa-slug">{f.slug}</span>
                  </td>
                  <td>
                    <div style={{ fontSize: "0.85rem" }}>{f.nome_cliente}</div>
                    <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                      {f.whatsapp}
                    </div>
                  </td>
                  <td>{new Date(f.data_festa).toLocaleDateString("pt-BR")}</td>
                  <td>{f.cupom_usado || "-"}</td>
                  <td>
                    <span
                      className={`status-tag ${
                        f.status === "PENDENTE" ? "pending" : "active"
                      }`}
                    >
                      {f.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn-icon-delete"
                      onClick={() => handleDelete(f.id)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// 3. CUPONS & AFILIADOS
// ============================================================================
const CuponsManager = () => {
  const [cupons, setCupons] = useState([]);
  const [loading, setLoading] = useState(true);

  const [novoCodigo, setNovoCodigo] = useState("");
  const [novoTipo, setNovoTipo] = useState("porcentagem");
  const [novoValor, setNovoValor] = useState(0);
  const [removeMarca, setRemoveMarca] = useState(false);
  const [parceiroNome, setParceiroNome] = useState("");
  const [parceiroPix, setParceiroPix] = useState("");
  const [parceiroCpf, setParceiroCpf] = useState("");
  const [comissao, setComissao] = useState(0);

  const [criando, setCriando] = useState(false);

  const fetchCupons = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("cupons")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setCupons(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchCupons();
  }, []);

  const handleCriarCupom = async (e) => {
    e.preventDefault();
    if (!novoCodigo) return alert("Código obrigatório");
    if (comissao > 0 && !parceiroCpf)
      return alert("CPF obrigatório para afiliados!");

    setCriando(true);
    try {
      const { error } = await supabase.from("cupons").insert([
        {
          codigo: novoCodigo.toUpperCase().trim(),
          tipo: novoTipo,
          valor_desconto: novoValor,
          remove_marca_dagua: removeMarca,
          ativo: true,
          parceiro_nome: parceiroNome || null,
          parceiro_pix: parceiroPix || null,
          parceiro_cpf: parceiroCpf || null,
          comissao_por_venda: comissao,
        },
      ]);

      if (error) throw error;

      alert("Criado com sucesso!");
      setNovoCodigo("");
      setNovoValor(0);
      setParceiroNome("");
      setParceiroPix("");
      setParceiroCpf("");
      setComissao(0);
      fetchCupons();
    } catch (err) {
      alert("Erro: " + err.message);
    } finally {
      setCriando(false);
    }
  };

  const handleToggleStatus = async (id, statusAtual) => {
    await supabase.from("cupons").update({ ativo: !statusAtual }).eq("id", id);
    fetchCupons();
  };

  const handleDeleteCupom = async (id) => {
    if (!window.confirm("Apagar permanentemente?")) return;
    await supabase.from("cupons").delete().eq("id", id);
    fetchCupons();
  };

  return (
    <div className="animate-fade-in">
      <header className="content-header">
        <h1>Cupons & Afiliados</h1>
      </header>

      <div className="dash-card mb-20" style={{ marginBottom: 20 }}>
        <h3>Novo Cupom</h3>
        <form onSubmit={handleCriarCupom} className="form-inline-grid">
          <div className="form-group">
            <label>Código</label>
            <input
              type="text"
              placeholder="Ex: JULIA10"
              value={novoCodigo}
              onChange={(e) => setNovoCodigo(e.target.value)}
              required
              className="input-admin"
            />
          </div>
          <div className="form-group">
            <label>Desconto Cliente</label>
            <div style={{ display: "flex", gap: 5 }}>
              <select
                value={novoTipo}
                onChange={(e) => setNovoTipo(e.target.value)}
                className="input-admin"
              >
                <option value="porcentagem">%</option>
                <option value="valor_fixo">R$</option>
                <option value="isencao">Grátis</option>
              </select>
              <input
                type="number"
                placeholder="10"
                value={novoValor}
                onChange={(e) => setNovoValor(e.target.value)}
                className="input-admin"
                style={{ width: 80 }}
                disabled={novoTipo === "isencao"}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Parceiro (Opcional)</label>
            <input
              type="text"
              placeholder="Nome"
              value={parceiroNome}
              onChange={(e) => setParceiroNome(e.target.value)}
              className="input-admin"
            />
          </div>
          <div className="form-group">
            <label>CPF (Login)</label>
            <input
              type="text"
              placeholder="Apenas números"
              value={parceiroCpf}
              onChange={(e) => setParceiroCpf(e.target.value)}
              className="input-admin"
            />
          </div>
          <div className="form-group">
            <label>Chave Pix</label>
            <input
              type="text"
              placeholder="Chave Pix"
              value={parceiroPix}
              onChange={(e) => setParceiroPix(e.target.value)}
              className="input-admin"
            />
          </div>
          <div className="form-group">
            <label>Comissão (%)</label>
            <input
              type="number"
              placeholder="0"
              value={comissao}
              onChange={(e) => setComissao(e.target.value)}
              className="input-admin"
              min="0"
              max="100"
            />
          </div>

          <div
            className="form-group checkbox-group"
            style={{ alignSelf: "center" }}
          >
            <label
              style={{
                display: "flex",
                gap: 5,
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={removeMarca}
                onChange={(e) => setRemoveMarca(e.target.checked)}
                style={{ width: 20, height: 20 }}
              />
              Sem Marca D'água?
            </label>
          </div>

          <button
            type="submit"
            className="btn-create"
            disabled={criando}
            style={{ gridColumn: "span 2" }}
          >
            {criando ? (
              <Loader2 className="spin" size={18} />
            ) : (
              <Plus size={18} />
            )}{" "}
            Cadastrar
          </button>
        </form>
      </div>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Parceiro</th>
              <th>Comissão</th>
              <th>Vendas</th>
              <th>Status</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            {cupons.map((c) => (
              <tr key={c.id} style={{ opacity: c.ativo ? 1 : 0.5 }}>
                <td style={{ fontWeight: "bold", color: "#a855f7" }}>
                  {c.codigo}
                </td>
                <td>
                  <div style={{ fontWeight: 600 }}>
                    {c.parceiro_nome || "-"}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                    {c.parceiro_pix}
                  </div>
                </td>
                <td>
                  {Number(c.comissao_por_venda) > 0 ? (
                    <span style={{ color: "#10b981", fontWeight: "bold" }}>
                      {c.comissao_por_venda}%
                    </span>
                  ) : (
                    "0%"
                  )}
                </td>
                <td>{c.usados}</td>
                <td>
                  <span
                    className={`status-tag ${c.ativo ? "active" : "pending"}`}
                  >
                    {c.ativo ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td style={{ display: "flex", gap: 10 }}>
                  <button
                    className="btn-icon-delete"
                    onClick={() => handleToggleStatus(c.id, c.ativo)}
                  >
                    {c.ativo ? <X size={18} /> : <Check size={18} />}
                  </button>
                  <button
                    className="btn-icon-delete"
                    onClick={() => handleDeleteCupom(c.id)}
                  >
                    <Trash2 size={18} color="#ef4444" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============================================================================
// 4. FINANCEIRO (ASAAS + SAQUES)
// ============================================================================
const FinanceiroManager = () => {
  const [resumo, setResumo] = useState({
    bruto: 0,
    comissoes: 0,
    liquido: 0,
    saldoAsaas: 0,
  });
  const [afiliadosParaPagar, setAfiliadosParaPagar] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal de Saque
  const [modalSaqueAberto, setModalSaqueAberto] = useState(false);
  const [valorSaque, setValorSaque] = useState("");
  const [processandoSaque, setProcessandoSaque] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    // 1. Dados Internos (Festas e Comissões)
    const { data: vendas } = await supabase
      .from("festas")
      .select("valor_pago, cupom_usado")
      .neq("status", "PENDENTE");
    const { data: cupons } = await supabase
      .from("cupons")
      .select("*")
      .not("parceiro_nome", "is", null);

    let totalBruto = 0;
    let totalComissoes = 0;
    const receitaPorCupom = {};

    vendas?.forEach((v) => {
      const valor = Number(v.valor_pago) || 0;
      totalBruto += valor;
      if (v.cupom_usado) {
        const code = v.cupom_usado.toUpperCase();
        receitaPorCupom[code] = (receitaPorCupom[code] || 0) + valor;
      }
    });

    const listaPagamentos = [];
    cupons?.forEach((cupom) => {
      const receita = receitaPorCupom[cupom.codigo] || 0;
      const comissaoTotal =
        receita * ((Number(cupom.comissao_por_venda) || 0) / 100);
      const jaPago = Number(cupom.total_pago_parceiro) || 0;
      const pendente = comissaoTotal - jaPago;

      if (pendente > 0) totalComissoes += pendente;
      if (pendente >= 50) {
        listaPagamentos.push({
          ...cupom,
          valor: pendente,
          receitaGerada: receita,
        });
      }
    });

    // 2. INTEGRAÇÃO ASAAS (Simulação para V1)
    // No futuro, isso virá de: await axios.get('/api/asaas/balance')
    // Por enquanto, assumimos que Saldo Asaas = (Total Bruto - Taxa Asaas 5%) - Comissões Pagas - Saques Realizados
    // Vamos simplificar e mostrar o Líquido Estimado como Saldo Disponível
    const saldoDisponivelSimulado = totalBruto - totalComissoes;

    setResumo({
      bruto: totalBruto,
      comissoes: totalComissoes,
      liquido: saldoDisponivelSimulado, // Isso é o que você "tem"
      saldoAsaas: saldoDisponivelSimulado, // Placeholder para API real
    });
    setAfiliadosParaPagar(listaPagamentos);
    setLoading(false);
  };

  const handleSolicitarSaque = async (e) => {
    e.preventDefault();
    setProcessandoSaque(true);

    // AQUI ENTRARIA A CHAMADA REAL PARA O ASAAS (via Backend)
    // await axios.post('/api/asaas/transfer', { value: valorSaque })

    setTimeout(() => {
      alert(`Solicitação de saque de R$ ${valorSaque} enviada com sucesso!`);
      setProcessandoSaque(false);
      setModalSaqueAberto(false);
      setValorSaque("");
      // Aqui você salvaria no banco em uma tabela 'saques' para histórico
    }, 1500);
  };

  // Baixa de Pagamento de Afiliado
  const handleMarcarComoPago = async (cupomId, valorPago) => {
    if (!window.confirm(`Confirma PIX de R$ ${valorPago.toFixed(2)}?`)) return;
    const { data: cupom } = await supabase
      .from("cupons")
      .select("total_pago_parceiro")
      .eq("id", cupomId)
      .single();
    const novoTotal = (Number(cupom.total_pago_parceiro) || 0) + valorPago;
    await supabase
      .from("cupons")
      .update({ total_pago_parceiro: novoTotal })
      .eq("id", cupomId);
    alert("Pagamento registrado!");
    carregarDados();
  };

  return (
    <div className="animate-fade-in">
      <header className="content-header">
        <h1>Financeiro & Asaas</h1>
      </header>

      {/* --- NOVO: CARD DE SALDO ASAAS COM BOTÃO DE SAQUE --- */}
      <div className="kpi-grid">
        <div
          className="kpi-card revenue"
          style={{
            gridColumn: "span 2",
            background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
            border: "1px solid #334155",
          }}
        >
          <div
            className="kpi-icon"
            style={{ background: "rgba(16, 185, 129, 0.2)", color: "#10b981" }}
          >
            <Banknote size={28} />
          </div>
          <div className="kpi-info" style={{ flex: 1 }}>
            <span style={{ fontSize: "0.9rem", color: "#94a3b8" }}>
              Saldo Disponível (Asaas)
            </span>
            <h2 style={{ fontSize: "2rem", margin: 0, color: "white" }}>
              R${" "}
              {resumo.saldoAsaas.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </h2>
            <small style={{ color: "#64748b" }}>Atualizado agora</small>
          </div>
          <button
            className="btn-create"
            style={{
              width: "auto",
              padding: "0 30px",
              height: 50,
              background: "#a855f7",
            }}
            onClick={() => setModalSaqueAberto(true)}
          >
            <ArrowUpRight size={20} style={{ marginRight: 8 }} /> Solicitar
            Saque
          </button>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon blue">
            <Users size={24} />
          </div>
          <div className="kpi-info">
            <span>Comissões Pendentes</span>
            <h3>
              R${" "}
              {resumo.comissoes.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </h3>
          </div>
        </div>
      </div>

      {/* LISTA DE PAGAMENTOS AFILIADOS */}
      <div className="dash-card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h3>⚠️ Folha de Pagamento Afiliados</h3>
          <span className="status-tag pending">Dia 05</span>
        </div>

        {loading ? (
          <p>Carregando...</p>
        ) : afiliadosParaPagar.length === 0 ? (
          <div style={{ textAlign: "center", padding: 30, color: "#64748b" }}>
            <Check size={40} style={{ marginBottom: 10, opacity: 0.5 }} />
            <p>Nenhum pagamento pendente.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Parceiro</th>
                <th>Pix</th>
                <th>Vendas</th>
                <th>A Pagar</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {afiliadosParaPagar.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 600 }}>
                    {item.nome}
                    <br />
                    <small style={{ color: "#a855f7" }}>{item.codigo}</small>
                  </td>
                  <td style={{ fontFamily: "monospace" }}>{item.pix}</td>
                  <td>R$ {item.receitaGerada.toFixed(2)}</td>
                  <td style={{ color: "#10b981", fontWeight: "bold" }}>
                    R$ {item.valor.toFixed(2)}
                  </td>
                  <td>
                    <button
                      className="btn-create"
                      style={{ height: 34, background: "#10b981" }}
                      onClick={() => handleMarcarComoPago(item.id, item.valor)}
                    >
                      Pagar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* --- MODAL DE SAQUE --- */}
      {modalSaqueAberto && (
        <div className="modal-overlay">
          <div className="modal-content fade-in" style={{ maxWidth: 400 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <h2 style={{ margin: 0, fontSize: "1.2rem" }}>Solicitar Saque</h2>
              <button
                onClick={() => setModalSaqueAberto(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSolicitarSaque}>
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label>Valor do Saque (R$)</label>
                <input
                  type="number"
                  className="input-admin"
                  placeholder="0,00"
                  value={valorSaque}
                  onChange={(e) => setValorSaque(e.target.value)}
                  required
                  min="10"
                />
                <small style={{ color: "#64748b", marginTop: 5 }}>
                  Taxa de saque: R$ 2,00 (Asaas)
                </small>
              </div>
              <button
                type="submit"
                className="btn-create"
                disabled={processandoSaque}
              >
                {processandoSaque ? (
                  <Loader2 className="spin" />
                ) : (
                  "Confirmar Transferência"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 5. ADMINS
// ============================================================================
const AdminsManager = () => {
  const [admins, setAdmins] = useState([]);
  useEffect(() => {
    const fetchAdmins = async () => {
      const { data } = await supabase.from("admins").select("*");
      if (data) setAdmins(data);
    };
    fetchAdmins();
  }, []);

  return (
    <div className="animate-fade-in">
      <header className="content-header">
        <h1>Administradores</h1>
      </header>
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>User ID</th>
              <th>Nível</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => (
              <tr key={a.id}>
                <td>{a.nome}</td>
                <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                  {a.user_id}
                </td>
                <td>
                  <span className="status-tag active">{a.nivel}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============================================================================
// LAYOUT PRINCIPAL
// ============================================================================
const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState({
    faturamento: 0,
    totalFestas: 0,
    totalFotos: 0,
    festasAtivas: 0,
    totalAfiliados: 0,
    totalCuponsUsados: 0,
  });
  const [recentFestas, setRecentFestas] = useState([]);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/admin");
        return;
      }
      const { data } = await supabase
        .from("admins")
        .select("nome")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (data) setAdminName(data.nome);
      else setAdminName("Admin");
      await fetchDashboardData();
      setLoading(false);
    };
    checkAuth();
  }, []);

  const fetchDashboardData = async () => {
    const { count: countFestas } = await supabase
      .from("festas")
      .select("*", { count: "exact", head: true });
    const { data: pagos } = await supabase
      .from("festas")
      .select("valor_pago")
      .neq("status", "PENDENTE");
    const totalGrana =
      pagos?.reduce((acc, curr) => acc + (Number(curr.valor_pago) || 0), 0) ||
      0;
    const { count: countFotos } = await supabase
      .from("fotos")
      .select("*", { count: "exact", head: true });
    const { data: ultimas } = await supabase
      .from("festas")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);
    const { data: cuponsData } = await supabase
      .from("cupons")
      .select("usados, parceiro_nome");
    const totalCuponsUsados =
      cuponsData?.reduce((acc, curr) => acc + (curr.usados || 0), 0) || 0;
    const totalAfiliados =
      cuponsData?.filter((c) => c.parceiro_nome).length || 0;

    setStats({
      faturamento: totalGrana,
      totalFestas: countFestas || 0,
      totalFotos: countFotos || 0,
      festasAtivas: pagos?.length || 0,
      totalAfiliados,
      totalCuponsUsados,
    });
    setRecentFestas(ultimas || []);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin");
  };

  if (loading)
    return (
      <div className="admin-loading">
        <Loader2 className="spin" size={40} />
      </div>
    );

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <img src={logoMemora} alt="Memora" />
          <span>Admin</span>
        </div>
        <nav className="sidebar-nav">
          <button
            className={`nav-link ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            <LayoutDashboard size={20} /> Dashboard
          </button>
          <button
            className={`nav-link ${activeTab === "festas" ? "active" : ""}`}
            onClick={() => setActiveTab("festas")}
          >
            <PartyPopper size={20} /> Festas
          </button>
          <button
            className={`nav-link ${activeTab === "cupons" ? "active" : ""}`}
            onClick={() => setActiveTab("cupons")}
          >
            <Ticket size={20} /> Cupons & Afiliados
          </button>
          <button
            className={`nav-link ${activeTab === "financeiro" ? "active" : ""}`}
            onClick={() => setActiveTab("financeiro")}
          >
            <Wallet size={20} /> Financeiro
          </button>
          <button
            className={`nav-link ${activeTab === "admins" ? "active" : ""}`}
            onClick={() => setActiveTab("admins")}
          >
            <Users size={20} /> Admins
          </button>
        </nav>
        <div className="sidebar-footer">
          <div className="admin-user-info">
            <div className="admin-avatar">
              {adminName.charAt(0).toUpperCase()}
            </div>
            <div className="admin-details">
              <span className="name">{adminName}</span>
              <span className="role">CEO</span>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-logout-icon">
            <LogOut size={18} />
          </button>
        </div>
      </aside>
      <main className="admin-content">
        {activeTab === "dashboard" && (
          <DashboardHome stats={stats} recentFestas={recentFestas} />
        )}
        {activeTab === "festas" && <FestasManager />}
        {activeTab === "cupons" && <CuponsManager />}
        {activeTab === "financeiro" && <FinanceiroManager />}
        {activeTab === "admins" && <AdminsManager />}
      </main>
    </div>
  );
};

export default AdminDashboard;
