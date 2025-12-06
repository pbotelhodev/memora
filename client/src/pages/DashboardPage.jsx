import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ROUTES } from "../routes";
import { supabase } from "../services/supabaseClient";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import {
  MonitorPlay,
  Share2,
  Copy,
  Download,
  LogOut,
  Lock,
  X,
  Loader2,
  CalendarClock,
  Printer,
  Edit2,
  Check,
} from "lucide-react";
import "../styles/DashboardPage.css";

// --- IMPORTS DOS ASSETS ---
import templateImg from "../assets/template-plaquinha.png";
import poppinsFont from "../assets/Poppins-Bold.ttf";
import logoFull from "../assets/powered-memora.png";

const DashboardPage = () => {
  const { slug } = useParams();

  // --- STATES DE DADOS ---
  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState(null);
  const [photos, setPhotos] = useState([]);

  // --- STATES DE UI ---
  const [isTvMode, setIsTvMode] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // --- STATES DE EDIÇÃO DE NOME ---
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);

  // --- 1. BUSCAR DADOS E REALTIME ---
  useEffect(() => {
    document.title = "Memora | Gerenciar evento";
    fetchEventAndPhotos();

    const channel = supabase
      .channel("dashboard-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "fotos" },
        (payload) => {
          // --- MUDANÇA 1: ORDEM DAS FOTOS ---
          // Antes: [payload.new, ...prev] (Nova no começo)
          // Agora: [...prev, payload.new] (Nova no final -> Cronológico)
          setPhotos((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [slug]);

  const fetchEventAndPhotos = async () => {
    try {
      const { data: festa, error: festaError } = await supabase
        .from("festas")
        .select("*")
        .eq("slug", slug)
        .single();

      if (festaError) throw festaError;
      setEventData(festa);

      if (festa) {
        const { data: fotos, error: fotosError } = await supabase
          .from("fotos")
          .select("*")
          .eq("festa_id", festa.id)
          // --- MUDANÇA 2: ORDEM DO BANCO ---
          // ascending: true = Mais antigas primeiro (Cronológico)
          .order("created_at", { ascending: true });

        if (fotosError) throw fotosError;
        setPhotos(fotos || []);
      }
    } catch (err) {
      console.error("Erro ao carregar dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- 2. LÓGICA DE ATUALIZAR NOME ---
  const handleUpdateName = async () => {
    if (!newName.trim()) return alert("O nome não pode ficar vazio.");
    setIsSavingName(true);

    try {
      const { error } = await supabase
        .from("festas")
        .update({ nome_festa: newName })
        .eq("id", eventData.id);

      if (error) throw error;
      setEventData({ ...eventData, nome_festa: newName });
      setIsEditingName(false);
    } catch (error) {
      console.error("Erro ao atualizar nome:", error);
      alert("Erro ao salvar. Tente novamente.");
    } finally {
      setIsSavingName(false);
    }
  };

  // --- 3. LÓGICA DO SLIDESHOW ---
  useEffect(() => {
    let interval;
    if (isTvMode && photos.length > 0) {
      interval = setInterval(() => {
        // Vai passando: Foto 1, Foto 2, Foto 3...
        setCurrentSlide((prev) => (prev + 1) % photos.length);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isTvMode, photos]);

  // --- 4. DOWNLOAD ZIP ---
  const checkDownloadAvailability = () => {
    if (!eventData) return { available: false, date: "" };
    const eventDate = new Date(eventData.data_festa + "T00:00:00");
    const unlockDate = new Date(eventDate);
    unlockDate.setDate(eventDate.getDate() + 2);
    const now = new Date();
    return {
      available: now >= unlockDate,
      unlockDateStr: unlockDate.toLocaleDateString("pt-BR"),
    };
  };

  const handleDownloadZip = async () => {
    if (photos.length === 0) return alert("Sem fotos para baixar.");
    setDownloading(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder(`fotos-${slug}`);
      const promises = photos.map(async (photo, index) => {
        const response = await fetch(photo.url);
        const blob = await response.blob();
        folder.file(`foto_${index + 1}.jpg`, blob);
      });
      await Promise.all(promises);
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `memora-${slug}-completo.zip`);
    } catch (error) {
      alert("Erro ao gerar ZIP.", error);
    } finally {
      setDownloading(false);
    }
  };

  // --- AUXILIARES PDF ---
  const loadImageToBase64 = async (url) => {
    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.warn("Erro img:", url, error);
      return null;
    }
  };

  const loadFontToBase64 = async (url) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result.split(",")[1];
          resolve(base64);
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.warn("Erro font:", url, error);
      return null;
    }
  };

  // --- 5. GERAR PDF (TEMPLATE) ---
  const handleGeneratePDF = async () => {
    setGeneratingPdf(true);
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&margin=0&data=https://www.appmemora.com.br/feed/${eventData.slug}`;
    const backgroundUrl = templateImg;
    const fontUrl = poppinsFont;

    try {
      const [bgBase64, qrBase64, fontBase64] = await Promise.all([
        loadImageToBase64(backgroundUrl),
        loadImageToBase64(qrUrl),
        loadFontToBase64(fontUrl),
      ]);

      if (!bgBase64) throw new Error("Template não encontrado.");
      if (!qrBase64) throw new Error("QR Code não gerado.");

      if (fontBase64) {
        doc.addFileToVFS("Poppins.ttf", fontBase64);
        doc.addFont("Poppins.ttf", "Poppins", "bold");
        doc.setFont("Poppins", "bold");
      } else {
        doc.setFont("helvetica", "bold");
      }

      // --- POSIÇÕES DO PDF ---
      const titleY = 55;
      const titleColor = "#6b21a8";
      const titleSize = 32;
      const qrSize = 70;
      const qrY = 75;
      const qrX = (210 - qrSize) / 2;

      // --- DESENHO DO PDF ---
      doc.addImage(bgBase64, "PNG", 0, 0, 210, 297);
      doc.setFontSize(titleSize);
      doc.setTextColor(titleColor);
      doc.text(eventData.nome_festa, 105, titleY, {
        align: "center",
        maxWidth: 160,
      });
      doc.addImage(qrBase64, "PNG", qrX, qrY, qrSize, qrSize);

      doc.save(`plaquinha-${slug}.pdf`);
    } catch (error) {
      console.error("Erro PDF:", error);
      alert("Erro ao gerar PDF.");
    } finally {
      setGeneratingPdf(false);
    }
  };

  // --- INTERFACE ---
  const handleCopyLink = () => {
    const linkFesta = `${window.location.origin}/feed/${slug}`;
    navigator.clipboard.writeText(linkFesta);
    alert("Link copiado!");
  };

  const handleWhatsappShare = () => {
    const linkFesta = `${window.location.origin}/feed/${slug}`;
    const texto = `Galera, postem as fotos aqui: ${linkFesta}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`);
  };

  if (loading)
    return <div className="loading-screen">Carregando painel...</div>;
  if (!eventData)
    return <div className="error-screen">Evento não encontrado.</div>;

  const downloadStatus = checkDownloadAvailability();

  return (
    <div className="dashboard-container">
      {/* --- TV OVERLAY (MODO TELÃO) --- */}
      {isTvMode && (
        <div className="tv-overlay">
          {photos.length > 0 ? (
            <div className="tv-slide-container">
              <img
                src={photos[currentSlide].url}
                className="tv-image animate-fade"
                alt="Slideshow"
              />
            </div>
          ) : (
            <div className="tv-empty">
              <h1>Aguardando fotos...</h1>
              <p>Seja o primeiro a postar!</p>
            </div>
          )}

          <div className="tv-ui-layer">
            <div className="tv-logo-area">
              <img src={logoFull || ""} alt="Memora" />
            </div>
            <button className="btn-close-tv" onClick={() => setIsTvMode(false)}>
              <X size={32} />
            </button>
            <div className="tv-qr-card">
              <p>Participe também!</p>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=0&data=https://www.appmemora.com.br/feed/${eventData.slug}`}
                alt="QR"
              />
              <span>Aponte a câmera</span>
            </div>
          </div>
        </div>
      )}

      {/* --- HEADER --- */}
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
          <Link to={ROUTES.HOME}>
            <button className="btn-logout" title="Sair">
              <LogOut size={20} />
            </button>
          </Link>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="event-status-bar">
          <div className="event-info">
            <p>Gerenciando evento:</p>

            {/* LÓGICA DE EDIÇÃO DE NOME */}
            {isEditingName ? (
              <div className="edit-title-wrapper">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="input-title-edit"
                  autoFocus
                />
                <div className="edit-actions">
                  <button
                    onClick={handleUpdateName}
                    className="btn-icon-action save"
                    disabled={isSavingName}
                  >
                    {isSavingName ? (
                      <Loader2 size={20} className="spin" />
                    ) : (
                      <Check size={20} />
                    )}
                  </button>
                  <button
                    onClick={() => setIsEditingName(false)}
                    className="btn-icon-action cancel"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="title-display-wrapper">
                <h1>{eventData.nome_festa}</h1>
                <button
                  className="btn-edit-pencil"
                  onClick={() => {
                    setNewName(eventData.nome_festa);
                    setIsEditingName(true);
                  }}
                  title="Editar nome"
                >
                  <Edit2 size={18} />
                </button>
              </div>
            )}

            <span className="photo-counter">
              {photos.length} fotos capturadas
            </span>
          </div>

          <div
            className={`status-badge ${
              eventData.status === "PENDENTE" ? "warning" : "success"
            }`}
          >
            <div className="live-dot"></div>
            {eventData.status === "PENDENTE"
              ? "AGUARDANDO PAGAMENTO"
              : "SISTEMA NO AR"}
          </div>
        </div>

        <div className="dashboard-grid">
          {/* CARD ACESSO */}
          <div className="dash-card access-card">
            <h3>Acesso dos Convidados</h3>
            {eventData.status === "PENDENTE" ? (
              <div className="locked-state">
                <Lock size={40} className="lock-icon" />
                <h4>QR Code Bloqueado</h4>
                <p>Realize o pagamento para liberar o acesso.</p>
                <button className="btn-primary">Pagar Agora</button>
              </div>
            ) : (
              <>
                <div className="qr-box">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://www.appmemora.com.br/feed/${eventData.slug}`}
                    alt="QR Code"
                  />
                </div>
                <div className="link-box">
                  <span>appmemora.com.br/feed/{slug}</span>
                  <button onClick={handleCopyLink}>
                    <Copy size={16} />
                  </button>
                </div>
                <button
                  className="btn-outline btn-print"
                  onClick={handleGeneratePDF}
                  disabled={generatingPdf}
                >
                  {generatingPdf ? (
                    <Loader2 size={18} className="spin" />
                  ) : (
                    <Printer size={18} style={{ marginRight: "8px" }} />
                  )}
                  {generatingPdf ? "Gerando Arte..." : "Baixar Plaquinha PDF"}
                </button>
              </>
            )}
          </div>

          {/* CARD AÇÕES */}
          <div className="dash-card actions-card">
            <button
              className="btn-action btn-tv"
              onClick={() => setIsTvMode(true)}
              disabled={eventData.status === "PENDENTE"}
            >
              <MonitorPlay size={32} />
              <div className="action-text">
                <h3>Modo Telão</h3>
                <p>Exibir slideshow ao vivo</p>
              </div>
            </button>

            <button
              className="btn-action btn-share"
              onClick={handleWhatsappShare}
              disabled={eventData.status === "PENDENTE"}
            >
              <Share2 size={32} />
              <div className="action-text">
                <h3>Convidar</h3>
                <p>Enviar link no WhatsApp</p>
              </div>
            </button>

            <div className="zip-area">
              {downloadStatus.available ? (
                <button
                  className="btn-action btn-zip-active"
                  onClick={handleDownloadZip}
                  disabled={downloading}
                >
                  {downloading ? (
                    <Loader2 className="spin" size={32} />
                  ) : (
                    <Download size={32} />
                  )}
                  <div className="action-text">
                    <h3>Baixar Tudo</h3>
                    <p>
                      {downloading ? "Compactando..." : "Download ZIP Completo"}
                    </p>
                  </div>
                </button>
              ) : (
                <div className="btn-action btn-zip-locked">
                  <CalendarClock size={32} />
                  <div className="action-text">
                    <h3>Download Bloqueado</h3>
                    <p>Libera em: {downloadStatus.unlockDateStr}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
