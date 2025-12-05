import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "../routes";
import { useParams } from "react-router-dom";
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
} from "lucide-react";
import "../styles/DashboardPage.css";

// --- IMPORTS DOS ASSETS ---
import templateImg from "../assets/template-plaquinha.png";
import poppinsFont from "../assets/Poppins-Bold.ttf";

const DashboardPage = () => {
  const { slug } = useParams();

  // --- STATES ---
  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState(null);
  const [photos, setPhotos] = useState([]);

  // States do Telão
  const [isTvMode, setIsTvMode] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // States do Download
  const [downloading, setDownloading] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // --- 1. BUSCAR DADOS ---
  useEffect(() => {
    document.title = "Memora | Gerenciar evento";
    fetchEventAndPhotos();

    const channel = supabase
      .channel("dashboard-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "fotos" },
        (payload) => {
          setPhotos((prev) => [payload.new, ...prev]);
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
          .order("created_at", { ascending: false });

        if (fotosError) throw fotosError;
        setPhotos(fotos || []);
      }
    } catch (err) {
      console.error("Erro ao carregar dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- 2. LÓGICA DO SLIDESHOW ---
  useEffect(() => {
    let interval;
    if (isTvMode && photos.length > 0) {
      interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % photos.length);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isTvMode, photos]);

  // --- 3. LÓGICA DO DOWNLOAD ZIP ---
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
      alert("Erro ao gerar ZIP.");
    } finally {
      setDownloading(false);
    }
  };

  // --- AUXILIAR: Carregar Imagem ---
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
      console.warn("Erro img:", url);
      return null;
    }
  };

  // --- AUXILIAR: Carregar Fonte Customizada ---
  const loadFontToBase64 = async (url) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          // O jsPDF precisa apenas da parte do código depois da vírgula
          const base64 = reader.result.split(",")[1];
          resolve(base64);
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.warn("Erro font:", url);
      return null;
    }
  };

  // --- 4. GERAR PDF (TEMPLATE + FONTE POPPINS) ---
  const handleGeneratePDF = async () => {
    setGeneratingPdf(true);
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // URLs
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&margin=0&data=https://www.appmemora.com.br/feed/${eventData.slug}`;
    const backgroundUrl = templateImg;
    const fontUrl = poppinsFont;

    try {
      // 1. Carrega tudo (Fundo, QR Code, Fonte)
      const [bgBase64, qrBase64, fontBase64] = await Promise.all([
        loadImageToBase64(backgroundUrl),
        loadImageToBase64(qrUrl),
        loadFontToBase64(fontUrl),
      ]);

      if (!bgBase64) throw new Error("Template não encontrado.");
      if (!qrBase64) throw new Error("QR Code não gerado.");

      // 2. Registra a fonte Poppins no PDF
      if (fontBase64) {
        doc.addFileToVFS("Poppins.ttf", fontBase64);
        doc.addFont("Poppins.ttf", "Poppins", "bold"); // Registra como 'Poppins' estilo 'bold'
        doc.setFont("Poppins", "bold"); // Ativa a fonte
      } else {
        // Fallback se a fonte falhar
        doc.setFont("helvetica", "bold");
      }

      // --- CONFIGURAÇÃO DE POSIÇÃO (AJUSTE FINO) ---

      // A. Título da Festa
      const titleY = 55; // Altura (Aumente para descer)
      const titleColor = "#6b21a8"; // Cor Roxo (#6b21a8) ou Branco (#ffffff) dependendo da sua arte
      const titleSize = 32; // Tamanho da fonte

      // B. QR Code
      const qrSize = 70; // Tamanho (90mm)
      const qrY = 75; // Altura (Aumente para descer)
      const qrX = (210 - qrSize) / 2; // Centralizado

      // --- DESENHANDO ---

      // Passo A: Fundo (Template)
      doc.addImage(bgBase64, "PNG", 0, 0, 210, 297);

      // Passo B: Título da Festa (Com fonte Poppins!)
      doc.setFontSize(titleSize);
      doc.setTextColor(titleColor);
      doc.text(eventData.nome_festa, 105, titleY, {
        align: "center",
        maxWidth: 160,
      });

      // Passo C: QR Code
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
      {/* TV OVERLAY */}
      {isTvMode && (
        <div className="tv-overlay">
          <div className="tv-controls">
            <div className="tv-qr-corner">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://www.appmemora.com.br/feed/${eventData.slug}`}
                alt="QR"
              />
              <span>Escaneie para postar</span>
            </div>
            <button className="btn-close-tv" onClick={() => setIsTvMode(false)}>
              <X size={32} />
            </button>
          </div>
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
        </div>
      )}

      {/* HEADER */}
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
            <h1>{eventData.nome_festa}</h1>
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
          {/* CARD DE ACESSO */}
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

          {/* CARD DE AÇÕES */}
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
