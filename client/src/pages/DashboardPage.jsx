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
  CreditCard,
} from "lucide-react";

// MODAL REUTILIZADO
import PaymentModal from "../components/PaymentModal";
import "../styles/DashboardPage.css";

// IMPORT DA REGRA DE TEMPO (NOVO)
import { isDownloadLiberado, getPrazoLimite } from "../utils/dateRules";

// ASSETS
import templateImg from "../assets/template-plaquinha.png";
import poppinsFont from "../assets/Poppins-Bold.ttf";
import logoFull from "../assets/logo-full.png";

const DashboardPage = () => {
  const { slug } = useParams();

  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [isTvMode, setIsTvMode] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // MODAL PAGAMENTO
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentDataForModal, setPaymentDataForModal] = useState(null);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);

  // REALTIME
  useEffect(() => {
    document.title = "Memora | Gerenciar evento";
    fetchEventAndPhotos();

    const channel = supabase
      .channel("dashboard-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "fotos" },
        async (payload) => {
          const novaFotoRaw = payload.new;
          if (eventData && novaFotoRaw.festa_id !== eventData.id) return;
          let nomeAutor = "Anônimo";
          let fotoAutor = null;
          if (novaFotoRaw.user_id) {
            const { data: autorData } = await supabase
              .from("convidados")
              .select("nome, foto_perfil_url")
              .eq("auth_id", novaFotoRaw.user_id)
              .single();
            if (autorData) {
              nomeAutor = autorData.nome;
              fotoAutor = autorData.foto_perfil_url;
            }
          }
          const novaFotoCompleta = {
            ...novaFotoRaw,
            url_final: novaFotoRaw.url_foto || novaFotoRaw.url,
            nome_final: novaFotoRaw.nome || nomeAutor,
            foto_autor: fotoAutor,
          };
          setPhotos((prev) => [...prev, novaFotoCompleta]);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "festas" },
        (payload) => {
          if (payload.new.slug === slug) {
            setEventData((prev) => ({
              ...prev,
              status: payload.new.status,
              nome_festa: payload.new.nome_festa,
              pix_copia_cola: payload.new.pix_copia_cola,
            }));
            if (payload.new.status !== "PENDENTE") setShowPaymentModal(false);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [slug, eventData?.id]);

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

        const userIds = [
          ...new Set(fotos.map((f) => f.user_id).filter((id) => id)),
        ];
        let mapaDeUsuarios = {};
        if (userIds.length > 0) {
          const { data: usersData } = await supabase
            .from("convidados")
            .select("auth_id, nome, foto_perfil_url")
            .in("auth_id", userIds);
          if (usersData) {
            usersData.forEach((user) => {
              mapaDeUsuarios[user.auth_id] = {
                nome: user.nome,
                foto: user.foto_perfil_url,
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
            foto_autor: dadosUsuario.foto || null,
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

  const handleOpenPayment = () => {
    const dadosParaPagamento = {
      slug: eventData.slug,
      valor: eventData.valor_pago,
      cliente: {
        nome: eventData.nome_cliente,
        cpf: eventData.cpf_cliente,
        email: eventData.email_cliente,
        phone: eventData.whatsapp,
        cep: eventData.cep,
        numero: eventData.numero_residencia,
      },
    };
    setPaymentDataForModal(dadosParaPagamento);
    setShowPaymentModal(true);
  };

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

  useEffect(() => {
    let interval;
    if (isTvMode && photos.length > 0) {
      interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % photos.length);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isTvMode, photos]);

  // --- NOVA LÓGICA DE DOWNLOAD (12H) ---
  const checkDownloadStatus = () => {
    if (!eventData) return { available: false, label: "..." };

    const liberado = isDownloadLiberado(eventData.data_festa);

    if (liberado) {
      return { available: true, label: "Liberado" };
    } else {
      const dataLimite = getPrazoLimite(eventData.data_festa);
      // Formata a data bonitinha: "12/10 às 12:00"
      const dataFormatada = dataLimite
        ? dataLimite.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
          }) + " às 12:00"
        : "";
      return { available: false, label: dataFormatada };
    }
  };

  const downloadStatus = checkDownloadStatus();

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

  const handleDeletePhoto = async (photoId, photoUrl) => {
    const confirmacao = window.confirm("Excluir esta foto permanentemente?");
    if (!confirmacao) return;

    try {
      // 1. TENTA APAGAR DO STORAGE PRIMEIRO
      // (Se falhar aqui, a gente vê o erro antes de apagar do banco)
      if (photoUrl) {
        // Extrai o caminho relativo da URL
        // Ex: https://.../fotos-eventos/minha-festa/foto.jpg -> minha-festa/foto.jpg
        const relativePath = photoUrl.split("/fotos-eventos/")[1];

        if (relativePath) {
          const pathDecoded = decodeURIComponent(relativePath);
          console.log("Tentando apagar arquivo no path:", pathDecoded);

          const { data, error: storageError } = await supabase.storage
            .from("fotos-eventos")
            .remove([pathDecoded]);

          if (storageError) {
            console.error("ERRO NO STORAGE:", storageError);
            alert("Erro ao apagar arquivo físico: " + storageError.message);
            // Decida se quer parar aqui ou continuar para apagar do banco
            // return;
          } else {
            console.log("Arquivo deletado com sucesso:", data);
          }
        } else {
          console.warn(
            "Não foi possível extrair o caminho do arquivo da URL:",
            photoUrl
          );
        }
      }

      // 2. APAGA DO BANCO DE DADOS
      const { error: dbError } = await supabase
        .from("fotos")
        .delete()
        .eq("id", photoId);

      if (dbError) throw dbError;

      // 3. ATUALIZA A TELA
      setPhotos((prev) => prev.filter((photo) => photo.id !== photoId));
      if (selectedPhoto && selectedPhoto.id === photoId) setSelectedPhoto(null);
    } catch (error) {
      console.error("Erro geral ao deletar:", error);
      alert("Erro ao processar exclusão.");
    }
  };

  const loadImageToBase64 = async (url) => {
    /* ... */ try {
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
    /* ... */ try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      return null;
    }
  };

  const handleGeneratePDF = async () => {
    setGeneratingPdf(true);
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&margin=0&data=https://www.appmemora.com.br/feed/${eventData.slug}`;
    try {
      const [bgBase64, qrBase64, fontBase64] = await Promise.all([
        loadImageToBase64(templateImg),
        loadImageToBase64(qrUrl),
        loadFontToBase64(poppinsFont),
      ]);
      if (!bgBase64) throw new Error("Template não encontrado.");
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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/feed/${slug}`);
    alert("Link copiado!");
  };
  const handleWhatsappShare = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(
        `Galera, postem as fotos aqui: ${window.location.origin}/feed/${slug}`
      )}`
    );
  };

  if (loading)
    return <div className="loading-screen">Carregando painel...</div>;
  if (!eventData)
    return <div className="error-screen">Evento não encontrado.</div>;

  return (
    <div className="dashboard-container">
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        paymentData={paymentDataForModal}
      />

      {selectedPhoto && (
        <div
          className="photo-modal-overlay"
          onClick={() => setSelectedPhoto(null)}
        >
          {" "}
          <div
            className="photo-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            {" "}
            <img src={selectedPhoto.url_final} alt="Zoom" />{" "}
            <button
              className="btn-close-modal"
              onClick={() => setSelectedPhoto(null)}
            >
              {" "}
              <X size={24} />{" "}
            </button>{" "}
            <div className="modal-info-bar">
              {" "}
              <span>👤 {selectedPhoto.nome_final}</span>{" "}
              <div className="modal-actions-group">
                {" "}
                <button
                  className="btn-modal-action download"
                  onClick={() =>
                    saveAs(
                      selectedPhoto.url_final,
                      `memora-${selectedPhoto.id}.jpg`
                    )
                  }
                >
                  {" "}
                  <Download size={20} />{" "}
                </button>{" "}
                <button
                  className="btn-modal-action delete"
                  onClick={() =>
                    handleDeletePhoto(selectedPhoto.id, selectedPhoto.url_final)
                  }
                >
                  {" "}
                  <Trash2 size={20} />{" "}
                </button>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </div>
      )}

      {isTvMode && (
        <div className="tv-overlay">
          {" "}
          <button className="btn-close-tv" onClick={() => setIsTvMode(false)}>
            {" "}
            <X size={40} />{" "}
          </button>{" "}
          <div className="tv-layout-container">
            {" "}
            <div className="tv-side-column left">
              {" "}
              <div className="tv-qr-box">
                {" "}
                <p>Participe!</p>{" "}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=https://www.appmemora.com.br/feed/${eventData.slug}`}
                  alt="QR Code"
                />{" "}
                <span>Aponte a câmera</span>{" "}
              </div>{" "}
              <div className="tv-side-watermark animate-fade">
                <img src={logoFull || ""} alt="Memora" />
              </div>{" "}
            </div>{" "}
            <div className="tv-center-column">
              {" "}
              {photos.length > 0 ? (
                <div className="tv-card-display animate-fade">
                  {" "}
                  <div className="tv-card-header">
                    {" "}
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
                    )}{" "}
                    <span className="tv-username">
                      {photos[currentSlide].nome_final}
                    </span>{" "}
                  </div>{" "}
                  <div className="tv-card-image-wrapper">
                    {" "}
                    <img
                      src={
                        photos[currentSlide].url_final ||
                        photos[currentSlide].url
                      }
                      alt="Slide"
                    />{" "}
                  </div>{" "}
                </div>
              ) : (
                <div className="tv-empty-state">
                  {" "}
                  <h1>Aguardando fotos...</h1>{" "}
                  <p>Seja o primeiro a aparecer no telão!</p>{" "}
                </div>
              )}{" "}
            </div>{" "}
            <div className="tv-side-column right">
              {" "}
              <div className="tv-qr-box">
                {" "}
                <p>Participe!</p>{" "}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=https://www.appmemora.com.br/feed/${eventData.slug}`}
                  alt="QR Code"
                />{" "}
                <span>Aponte a câmera</span>{" "}
              </div>{" "}
              <div className="tv-side-watermark animate-fade">
                <img src={logoFull || ""} alt="Memora" />
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </div>
      )}

      <header>
        <div className="header-profile-area">
          <div className="header-profile">
            {" "}
            <div className="avatar-circle">
              {eventData.nome_cliente.charAt(0)}
            </div>{" "}
            <span className="welcome-text">
              <p>
                Olá, <strong>{eventData.nome_cliente.split(" ")[0]}</strong>
              </p>
            </span>{" "}
          </div>
          <Link to={ROUTES.HOME}>
            {" "}
            <button className="btn-logout" title="Sair">
              <LogOut size={20} />
            </button>{" "}
          </Link>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="event-status-bar">
          <div className="event-info">
            {" "}
            <p>Gerenciando evento:</p>{" "}
            {isEditingName ? (
              <div className="edit-title-wrapper">
                {" "}
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="input-title-edit"
                  autoFocus
                />{" "}
                <div className="edit-actions">
                  {" "}
                  <button
                    onClick={handleUpdateName}
                    className="btn-icon-action save"
                    disabled={isSavingName}
                  >
                    {" "}
                    {isSavingName ? (
                      <Loader2 size={20} className="spin" />
                    ) : (
                      <Check size={20} />
                    )}{" "}
                  </button>{" "}
                  <button
                    onClick={() => setIsEditingName(false)}
                    className="btn-icon-action cancel"
                  >
                    <X size={20} />
                  </button>{" "}
                </div>{" "}
              </div>
            ) : (
              <div className="title-display-wrapper">
                {" "}
                <h1>{eventData.nome_festa}</h1>{" "}
                <button
                  className="btn-edit-pencil"
                  onClick={() => {
                    setNewName(eventData.nome_festa);
                    setIsEditingName(true);
                  }}
                  title="Editar nome"
                >
                  <Edit2 size={18} />
                </button>{" "}
              </div>
            )}{" "}
            <span className="photo-counter">
              {photos.length} fotos capturadas
            </span>{" "}
          </div>
          <div
            className={`status-badge ${
              eventData.status === "PENDENTE" ? "warning" : "success"
            }`}
          >
            {" "}
            <div className="live-dot"></div>{" "}
            {eventData.status === "PENDENTE"
              ? "AGUARDANDO PAGAMENTO"
              : "SISTEMA NO AR"}{" "}
          </div>
        </div>

        <div className="dashboard-grid">
          {/* CARD DE ACESSO */}
          <div className="dash-card access-card">
            <h3>Acesso dos Convidados</h3>
            {eventData.status === "PENDENTE" ? (
              <div className="locked-state">
                <Lock size={40} className="lock-icon" />
                {eventData.pix_copia_cola ? (
                  <>
                    <h4>Pagamento Pendente</h4>
                    <p style={{ fontSize: "0.9rem", color: "#94a3b8" }}>
                      Escaneie o QR Code para liberar:
                    </p>
                    <div
                      style={{
                        margin: "15px 0",
                        padding: "10px",
                        background: "white",
                        borderRadius: "8px",
                        border: "1px solid #ddd",
                      }}
                    >
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=10&data=${encodeURIComponent(
                          eventData.pix_copia_cola
                        )}`}
                        alt="QR Pix"
                        style={{
                          display: "block",
                          width: "150px",
                          height: "150px",
                        }}
                      />
                    </div>
                    <button
                      className="btn-outline"
                      onClick={() => {
                        navigator.clipboard.writeText(eventData.pix_copia_cola);
                        alert("Código PIX copiado!");
                      }}
                      style={{
                        fontSize: "0.85rem",
                        padding: "8px 16px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "10px",
                      }}
                    >
                      {" "}
                      <Copy size={16} /> Copiar Código{" "}
                    </button>
                    <button
                      onClick={handleOpenPayment}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#a855f7",
                        textDecoration: "underline",
                        cursor: "pointer",
                        fontSize: "0.8rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      {" "}
                      <CreditCard size={14} /> Prefere pagar com cartão?{" "}
                    </button>
                    <p
                      style={{
                        fontSize: "0.8rem",
                        marginTop: "15px",
                        color: "#64748b",
                      }}
                    >
                      {" "}
                      A tela atualizará sozinha após o pagamento. 🪄{" "}
                    </p>
                  </>
                ) : (
                  <>
                    <h4>QR Code Bloqueado</h4>
                    <p>Realize o pagamento para liberar o acesso.</p>
                    <button className="btn-primary" onClick={handleOpenPayment}>
                      {" "}
                      Pagar Agora{" "}
                    </button>
                  </>
                )}
              </div>
            ) : (
              <>
                <div className="qr-box">
                  {" "}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://www.appmemora.com.br/feed/${eventData.slug}`}
                    alt="QR Code"
                  />{" "}
                </div>
                <div className="link-box">
                  {" "}
                  <span>appmemora.com.br/feed/{slug}</span>{" "}
                  <button onClick={handleCopyLink}>
                    <Copy size={16} />
                  </button>{" "}
                </div>
                <button
                  className="btn-outline btn-print"
                  onClick={handleGeneratePDF}
                  disabled={generatingPdf}
                >
                  {" "}
                  {generatingPdf ? (
                    <Loader2 size={18} className="spin" />
                  ) : (
                    <Printer size={18} style={{ marginRight: "8px" }} />
                  )}{" "}
                  {generatingPdf ? "Gerando Arte..." : "Baixar Plaquinha PDF"}{" "}
                </button>
              </>
            )}
          </div>

          <div className="dash-card actions-card">
            <button
              className="btn-action btn-tv"
              onClick={() => setIsTvMode(true)}
              disabled={eventData.status === "PENDENTE"}
            >
              {" "}
              <MonitorPlay size={32} />{" "}
              <div className="action-text">
                <h3>Modo Telão</h3>
                <p>Exibir slideshow ao vivo</p>
              </div>{" "}
            </button>
            <button
              className="btn-action btn-share"
              onClick={handleWhatsappShare}
              disabled={eventData.status === "PENDENTE"}
            >
              {" "}
              <Share2 size={32} />{" "}
              <div className="action-text">
                <h3>Convidar</h3>
                <p>Enviar link no WhatsApp</p>
              </div>{" "}
            </button>

            {/* LÓGICA DO DOWNLOAD (12H) */}
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
                    <p>Libera em: {downloadStatus.label}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="moderation-gallery-section">
          <div className="gallery-header">
            {" "}
            <h2>Galeria do Evento</h2>{" "}
            <p>
              Clique na foto para ampliar. Baixe na <strong>esquerda</strong> ou
              exclua na <strong>direita</strong>.
            </p>{" "}
          </div>
          {photos.length === 0 ? (
            <div className="gallery-empty">
              <p>Nenhuma foto postada ainda.</p>
            </div>
          ) : (
            <div className="gallery-grid">
              {" "}
              {[...photos].reverse().map((photo) => (
                <div key={photo.id} className="photo-card-moderation">
                  {" "}
                  <div className="photo-wrapper">
                    {" "}
                    <img
                      src={photo.url_final}
                      alt={`Foto de ${photo.nome_final}`}
                      loading="lazy"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                      onClick={() => setSelectedPhoto(photo)}
                      style={{ cursor: "pointer" }}
                    />{" "}
                    <button
                      className="btn-overlay btn-download-photo"
                      onClick={(e) => {
                        e.stopPropagation();
                        saveAs(photo.url_final, `memora-${photo.id}.jpg`);
                      }}
                      title="Baixar foto"
                    >
                      <Download size={16} />
                    </button>{" "}
                    <button
                      className="btn-overlay btn-delete-photo"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePhoto(photo.id, photo.url_final);
                      }}
                      title="Excluir foto"
                    >
                      <Trash2 size={16} />
                    </button>{" "}
                  </div>{" "}
                  <div className="photo-info">
                    {" "}
                    <span className="user-name">
                      👤 {photo.nome_final}
                    </span>{" "}
                    <span className="photo-time">
                      {new Date(photo.created_at).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>{" "}
                  </div>{" "}
                </div>
              ))}{" "}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
