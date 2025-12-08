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
  Trash2,
} from "lucide-react";
import "../styles/DashboardPage.css";

// --- IMPORTS DOS ASSETS ---
import templateImg from "../assets/template-plaquinha.png";
import poppinsFont from "../assets/Poppins-Bold.ttf";
import logoFull from "../assets/logo-full.png";

const DashboardPage = () => {
  const { slug } = useParams();

  // --- STATES DE DADOS ---
  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState(null);
  const [photos, setPhotos] = useState([]);

  // --- STATES DE UI ---
  const [isTvMode, setIsTvMode] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null); // Estado do Modal
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
          const novaFoto = {
            ...payload.new,
            nome_final: payload.new.nome || "Novo (Atualize a página)",
          };
          setPhotos((prev) => [...prev, novaFoto]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [slug]);

  // --- FETCH DE DADOS (COM CORREÇÃO DE NOMES E FOTO) ---
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
          .order("created_at", { ascending: true });

        if (fotosError) throw fotosError;

        // Correção de nomes e fotos (Auth ID -> Tabela convidados)
        const userIds = [
          ...new Set(fotos.map((f) => f.user_id).filter((id) => id)),
        ];

        let mapaDeUsuarios = {}; // Objeto para guardar nome e foto

        if (userIds.length > 0) {
          const { data: usersData } = await supabase
            .from("convidados")
            .select("auth_id, nome, foto_perfil_url") // <--- BUSCANDO A FOTO AQUI
            .in("auth_id", userIds);

          if (usersData) {
            usersData.forEach((user) => {
              mapaDeUsuarios[user.auth_id] = {
                nome: user.nome,
                foto: user.foto_perfil_url, // <--- GUARDANDO A FOTO
              };
            });
          }
        }

        const fotosComNomes = fotos.map((foto) => {
          const dadosUsuario = mapaDeUsuarios[foto.user_id] || {};
          return {
            ...foto,
            url_final: foto.url_foto || foto.url,
            nome_final: foto.nome || dadosUsuario.nome || "Anônimo",
            foto_autor: dadosUsuario.foto || null, // <--- PASSANDO A FOTO PRO OBJETO
          };
        });

        setPhotos(fotosComNomes || []);
      }
    } catch (err) {
      console.error("Erro dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- 2. UPDATE NOME DA FESTA ---
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
      console.error("Erro update:", error);
      alert("Erro ao salvar.");
    } finally {
      setIsSavingName(false);
    }
  };

  // --- 3. SLIDESHOW ---
  useEffect(() => {
    let interval;
    if (isTvMode && photos.length > 0) {
      interval = setInterval(() => {
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
        const response = await fetch(photo.url_final || photo.url);
        const blob = await response.blob();
        folder.file(`foto_${index + 1}.jpg`, blob);
      });
      await Promise.all(promises);
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `memora-${slug}-completo.zip`);
    } catch (error) {
      console.error("Erro ZIP:", error);
      alert("Erro ao gerar ZIP.");
    } finally {
      setDownloading(false);
    }
  };

  // --- 5. DELETAR FOTO ---
  const handleDeletePhoto = async (photoId, photoUrl) => {
    const confirmacao = window.confirm("Excluir esta foto permanentemente?");
    if (!confirmacao) return;

    try {
      const { error: dbError } = await supabase
        .from("fotos")
        .delete()
        .eq("id", photoId);

      if (dbError) throw dbError;

      // Tenta apagar do Storage
      try {
        if (photoUrl) {
          const urlObj = new URL(photoUrl);
          const pathParts = urlObj.pathname.split("/festas/");
          if (pathParts.length > 1) {
            const filePath = decodeURIComponent(pathParts[1]);
            await supabase.storage.from("festas").remove([filePath]);
          }
        }
      } catch (storageErr) {
        console.warn("Aviso storage:", storageErr);
      }

      setPhotos((prev) => prev.filter((photo) => photo.id !== photoId));

      // Fecha o modal se a foto apagada for a que está aberta
      if (selectedPhoto && selectedPhoto.id === photoId) {
        setSelectedPhoto(null);
      }
    } catch (error) {
      console.error("Erro deletar:", error);
      alert("Erro ao excluir.");
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
      return null;
    }
  };

  // --- 6. GERAR PDF ---
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

      const titleY = 55;
      const titleColor = "#6b21a8";
      const titleSize = 32;
      const qrSize = 70;
      const qrY = 75;
      const qrX = (210 - qrSize) / 2;

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
      {/* --- MODAL DE FOTO (LIGHTBOX) --- */}
      {selectedPhoto && (
        <div
          className="photo-modal-overlay"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="photo-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Imagem Principal */}
            <img src={selectedPhoto.url_final} alt="Zoom" />

            {/* Botão Fechar (Dentro da foto, topo direita) */}
            <button
              className="btn-close-modal"
              onClick={() => setSelectedPhoto(null)}
            >
              <X size={24} />
            </button>

            {/* Barra Inferior (Dentro da foto, fundo vidro) */}
            <div className="modal-info-bar">
              <span>👤 {selectedPhoto.nome_final}</span>

              <div className="modal-actions-group">
                <button
                  className="btn-modal-action download"
                  onClick={() =>
                    saveAs(
                      selectedPhoto.url_final,
                      `memora-${selectedPhoto.id}.jpg`
                    )
                  }
                  title="Baixar"
                >
                  <Download size={20} />
                </button>
                <button
                  className="btn-modal-action delete"
                  onClick={() =>
                    handleDeletePhoto(selectedPhoto.id, selectedPhoto.url_final)
                  }
                  title="Excluir"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TV OVERLAY (MODO TELÃO PRO) --- */}
      {isTvMode && (
        <div className="tv-overlay">
          {/* Botão Fechar */}
          <button className="btn-close-tv" onClick={() => setIsTvMode(false)}>
            <X size={40} />
          </button>

          {/* Layout Principal: Coluna Esq | Centro | Coluna Dir */}
          <div className="tv-layout-container">
            {/* 1. COLUNA ESQUERDA (QR + LOGO) */}
            <div className="tv-side-column left">
              <div className="tv-qr-box">
                <p>Participe!</p>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=https://www.appmemora.com.br/feed/${eventData.slug}`}
                  alt="QR Code"
                />
                <span>Aponte a câmera</span>
              </div>
              {/* MARCA D'ÁGUA LATERAL */}
              <div className="tv-side-watermark animate-fade">
                <img src={logoFull || ""} alt="Memora" />
              </div>
            </div>

            {/* 2. CONTEÚDO CENTRAL (CARD 4:5 + AVATAR) */}
            <div className="tv-center-column">
              {photos.length > 0 ? (
                <div className="tv-card-display animate-fade">
                  {/* Cabeçalho do Card (Nome) */}
                  <div className="tv-card-header">
                    {/* --- LÓGICA DO AVATAR --- */}
                    {photos[currentSlide].foto_autor ? (
                      <img
                        src={photos[currentSlide].foto_autor}
                        className="tv-avatar-img"
                        alt="Avatar"
                        onError={(e) => (e.target.style.display = "none")}
                      />
                    ) : (
                      <div className="tv-avatar-placeholder">
                        {(photos[currentSlide].nome_final || "A").charAt(0)}
                      </div>
                    )}
                    {/* ----------------------- */}

                    <span className="tv-username">
                      {photos[currentSlide].nome_final}
                    </span>
                  </div>

                  {/* Imagem do Card (Agora 4:5 Retrato) */}
                  <div className="tv-card-image-wrapper">
                    <img
                      src={
                        photos[currentSlide].url_final ||
                        photos[currentSlide].url
                      }
                      alt="Slide"
                    />
                  </div>
                </div>
              ) : (
                <div className="tv-empty-state">
                  <h1>Aguardando fotos...</h1>
                  <p>Seja o primeiro a aparecer no telão!</p>
                </div>
              )}
            </div>

            {/* 3. COLUNA DIREITA (QR + LOGO) */}
            <div className="tv-side-column right">
              <div className="tv-qr-box">
                <p>Participe!</p>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=https://www.appmemora.com.br/feed/${eventData.slug}`}
                  alt="QR Code"
                />
                <span>Aponte a câmera</span>
              </div>
              {/* MARCA D'ÁGUA LATERAL */}
              <div className="tv-side-watermark animate-fade">
                <img src={logoFull || ""} alt="Memora" />
              </div>
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

        {/* --- GALERIA DE MODERAÇÃO --- */}
        <div className="moderation-gallery-section">
          <div className="gallery-header">
            <h2>Galeria do Evento</h2>
            <p>
              Clique na foto para ampliar. Baixe na <strong>esquerda</strong> ou
              exclua na <strong>direita</strong>.
            </p>
          </div>

          {photos.length === 0 ? (
            <div className="gallery-empty">
              <p>Nenhuma foto postada ainda.</p>
            </div>
          ) : (
            <div className="gallery-grid">
              {[...photos].reverse().map((photo) => {
                const imgUrl = photo.url_final;
                const nomeAutor = photo.nome_final;

                return (
                  <div key={photo.id} className="photo-card-moderation">
                    <div className="photo-wrapper">
                      <img
                        src={imgUrl}
                        alt={`Foto de ${nomeAutor}`}
                        loading="lazy"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                        onClick={() => setSelectedPhoto(photo)} // Abre modal
                        style={{ cursor: "pointer" }}
                      />

                      {/* Botões Overlay (Lista) */}
                      <button
                        className="btn-overlay btn-download-photo"
                        onClick={(e) => {
                          e.stopPropagation();
                          saveAs(imgUrl, `memora-${photo.id}.jpg`);
                        }}
                        title="Baixar foto"
                      >
                        <Download size={16} />
                      </button>

                      <button
                        className="btn-overlay btn-delete-photo"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePhoto(photo.id, imgUrl);
                        }}
                        title="Excluir foto"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="photo-info">
                      <span className="user-name">👤 {nomeAutor}</span>
                      <span className="photo-time">
                        {new Date(photo.created_at).toLocaleTimeString(
                          "pt-BR",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
