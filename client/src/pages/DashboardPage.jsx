import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom"; // Para pegar o ID da URL
import { supabase } from "../services/supabaseClient"; // Para buscar no banco
import {
  MonitorPlay,
  Share2,
  Copy,
  Download,
  Trash2,
  Image as ImageIcon,
  LogOut,
  Lock,
  Clock,
} from "lucide-react";
import "../styles/DashboardPage.css";

const DashboardPage = () => {
  const { slug } = useParams(); // Pega o 'niver-joao-xyz' da URL

  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState(null);

  // Fotos (Ainda mockadas, depois conectamos no Storage)
  //const [photos, setPhotos] = useState([]);

  // --- BUSCAR DADOS REAIS NO BANCO ---
  useEffect(()=> {
    document.title = "Memora | Gerenciar evento";
  }, []);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const { data, error } = await supabase
          .from("festas")
          .select("*")
          .eq("slug", slug) // Busca a festa com esse código
          .single(); // Retorna apenas 1 item

        if (error) throw error;
        setEventData(data); // Salva os dados no estado
      } catch (err) {
        console.error("Erro ao buscar festa:", err);
        // Opcional: Redirecionar para home se não achar
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchEvent();
    }
  }, [slug]);

  // --- FUNÇÕES DE AÇÃO ---
  const handleCopyLink = () => {
    // Copia o link público da festa (não o do painel)
    const linkFesta = `${window.location.origin}/feed/${slug}`;
    navigator.clipboard.writeText(linkFesta);
    alert("Link da festa copiado!");
  };

  const handleWhatsappShare = () => {
    const linkFesta = `${window.location.origin}/feed/${slug}`;
    const texto = `Galera, acesse a minah rede social por aqui: ${linkFesta}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`);
  };

  // --- TELA DE CARREGAMENTO ---
  if (loading) {
    return (
      <div
        className="dashboard-container"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        Carregando painel...
      </div>
    );
  }

  // --- SE NÃO ACHOU ---
  if (!eventData) {
    return (
      <div
        className="dashboard-container"
        style={{ paddingTop: "100px", textAlign: "center" }}
      >
        Evento não encontrado. Verifique o link.
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header>
        <div className="header-profile-area">
          <div className="header-profile">
            <div className="avatar-circle">
              {eventData.nome_cliente.charAt(0)}
            </div>
            <span className="welcome-text">
              <p>
                Olá, <strong>{eventData.nome_cliente.split(" ")[0]}</strong>
              </p>
            </span>
          </div>
          <button className="btn-logout" title="Sair">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        {/* Barra de Status */}
        <div className="event-status-bar">
          <div className="event-info">
            <p>Gerenciando evento:</p>
            {/* DADO REAL DO BANCO */}
            <h1>{eventData.nome_festa}</h1>
          </div>
          <div
            className="status-badge"
            style={{
              color: eventData.status === "PENDENTE" ? "#FBBF24" : "#10B981",
              borderColor:
                eventData.status === "PENDENTE" ? "#FBBF24" : "#10B981",
              background:
                eventData.status === "PENDENTE"
                  ? "rgba(251, 191, 36, 0.1)"
                  : "rgba(16, 185, 129, 0.1)",
            }}
          >
            <div
              className="live-dot"
              style={{
                background:
                  eventData.status === "PENDENTE" ? "#FBBF24" : "#10B981",
              }}
            ></div>
            {eventData.status === "PENDENTE"
              ? "AGUARDANDO PAGAMENTO"
              : "SISTEMA NO AR"}
          </div>
        </div>

        <div className="dashboard-grid">
          {/* Card de Acesso */}
          {/* --- CARD DE ACESSO (COM TRAVA DE PAGAMENTO) --- */}
          <div className="dash-card access-card">
            <h3>Acesso dos Convidados</h3>

            {eventData.status === "PENDENTE" ? (
              /* CENÁRIO 1: AINDA NÃO PAGOU (BLOQUEADO) */
              <div className="locked-state" style={{ padding: "20px 0" }}>
                <div
                  className="locked-icon"
                  style={{
                    background: "rgba(239, 68, 68, 0.1)",
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    margin: "0 auto 15px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#EF4444",
                  }}
                >
                  <Lock size={40} />
                </div>

                <h4 style={{ color: "#EF4444", marginBottom: "10px" }}>
                  QR Code Bloqueado
                </h4>
                <p
                  style={{
                    color: "#94A3B8",
                    fontSize: "0.9rem",
                    marginBottom: "20px",
                  }}
                >
                  Identificamos que o pagamento ainda está pendente. O QR Code
                  será liberado automaticamente assim que o Pix for compensado.
                </p>

                {/* Botão para ver o Pix de novo (Opcional, se você salvou o link do pagamento no banco) */}
                <button
                  className="btn-primary"
                  style={{ fontSize: "0.9rem", padding: "10px 20px" }}
                >
                  Pagar Agora
                </button>
              </div>
            ) : (
              /* CENÁRIO 2: PAGAMENTO CONFIRMADO (LIBERADO) */
              <>
                <div className="qr-box">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://www.appmemora.com.br/${eventData.slug}`}
                    alt="QR Code"
                  />
                </div>

                <div className="link-box">
                  <span
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    appmemora.com.br/feed/{slug}
                  </span>
                  <button className="btn-icon" onClick={handleCopyLink}>
                    <Copy size={18} />
                  </button>
                </div>

                <button className="btn-outline">
                  <Download
                    size={18}
                    style={{ marginRight: "8px", verticalAlign: "middle" }}
                  />
                  Baixar Plaquinha PDF
                </button>
              </>
            )}
          </div>

          {/* Card de Ações */}
          {/* Card de Ações */}
          <div className="dash-card actions-card">
            <button
              className="btn-action btn-tv"
              onClick={() => alert("Abrir Telão")}
              disabled={eventData.status === "PENDENTE"} // <--- DESABILITA
              style={{
                opacity: eventData.status === "PENDENTE" ? 0.5 : 1,
                cursor:
                  eventData.status === "PENDENTE" ? "not-allowed" : "pointer",
              }}
            >
              {eventData.status === "PENDENTE" ? (
                <Lock size={40} />
              ) : (
                <MonitorPlay size={40} />
              )}
              <div className="action-text">
                <h3>Abrir Modo Telão</h3>
                <p>
                  {eventData.status === "PENDENTE"
                    ? "Disponível após pagamento"
                    : "Exibir slideshow em tempo real"}
                </p>
              </div>
            </button>

            {/* Mesma coisa para o botão de compartilhar */}
            <button
              className="btn-action btn-share"
              onClick={handleWhatsappShare}
              disabled={eventData.status === "PENDENTE"}
              style={{
                opacity: eventData.status === "PENDENTE" ? 0.5 : 1,
                cursor:
                  eventData.status === "PENDENTE" ? "not-allowed" : "pointer",
              }}
            >
              {eventData.status === "PENDENTE" ? (
                <Lock size={40} />
              ) : (
                <Share2 size={40} />
              )}
              <div className="action-text">
                <h3>Compartilhar Link</h3>
                <p>
                  {eventData.status === "PENDENTE"
                    ? "Disponível após pagamento"
                    : "Enviar convite no WhatsApp"}
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* ... (Galeria de fotos continua igual por enquanto) ... */}
      </div>
    </div>
  );
};

export default DashboardPage;
