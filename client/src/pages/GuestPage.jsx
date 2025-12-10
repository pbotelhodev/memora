import { useEffect, useState, useRef } from "react";
import {
  Home,
  Camera,
  User,
  Image as ImageIcon,
  RefreshCw,
  X,
  Check,
  Download,
  Pencil,
  Save,
  XCircle,
  Loader2,
  Lock, // Importado para caso a festa encerre (regra 12h visual)
} from "lucide-react";
import { useParams } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import "../styles/GuestPage.css";
import { nanoid } from "nanoid";
import logoMemora from "../assets/logo-memora.png";
import poweredImage from "../assets/logo-full.png";
// IMPORT DA REGRA DE TEMPO
import { podePostarFoto } from "../utils/dateRules";

const GuestPage = () => {
  const { slug } = useParams();

  // --- ESTADOS ---
  const [localUserId, setLocalUserId] = useState(null);
  const [nomeConvidado, setNomeConvidado] = useState("");
  const [fotoPerfil, setFotoPerfil] = useState(null);
  const [mostrarEntry, setMostrarEntry] = useState(false);
  const [dadosPerfil, setDadosPerfil] = useState(null);

  // Estados de Edição de Nome
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempUserName, setTempUserName] = useState("");

  // BD & Regras de Negócio
  const [festa, setFesta] = useState(null);
  const [removeMarcaDagua, setRemoveMarcaDagua] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(false);

  // --- PAGINAÇÃO ---
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE_SIZE = 50;

  // Navegação
  const [abaAtiva, setAbaAtiva] = useState("feed");
  const [facingMode, setFacingMode] = useState("environment");

  // FEEDS
  const [fotosFeed, setFotosFeed] = useState([]);
  const [fotosPerfil, setFotosPerfil] = useState([]);

  // CÂMERA
  const [modoCamera, setModoCamera] = useState("feed");
  const [fotoPreview, setFotoPreview] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [botaoEnviar, setBotaoEnviar] = useState(true);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const formRef = useRef(null);

  // --- FUNÇÕES DE BD (BUSCAR FESTA + REGRA DO CUPOM) ---
  const buscarFesta = async () => {
    setLoading(true);
    setErro(false);

    // 1. Busca dados da festa
    const { data: festaData, error } = await supabase
      .from("festas")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error) {
      console.log("Erro:", error);
      setErro(true);
      setLoading(false);
      return;
    }

    setFesta(festaData);

    // 2. VERIFICAÇÃO DO CUPOM NO BANCO DE DADOS
    if (festaData.cupom) {
      const { data: cupomData } = await supabase
        .from("cupons")
        .select("remove_marca_dagua")
        .eq("codigo", festaData.cupom)
        .maybeSingle();

      if (cupomData?.remove_marca_dagua) {
        setRemoveMarcaDagua(true);
      } else {
        setRemoveMarcaDagua(false);
      }
    } else {
      setRemoveMarcaDagua(false);
    }

    setLoading(false);
  };

  const ensureGuestAuth = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) return false;
    }
    return true;
  };

  const enviarParaUpload = async (fotoBlob, nomeArquivo) => {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      alert("Sessão inválida.");
      setLoading(false);
      return null;
    }

    const pathArquivo = `${festa.slug}/${nomeArquivo}`;
    const { data, error } = await supabase.storage
      .from("fotos-eventos")
      .upload(pathArquivo, fotoBlob, { cacheControl: "3600", upsert: false });

    setLoading(false);
    if (error) {
      alert("Falha no envio.");
      return null;
    }
    return data.path;
  };

  // --- BUSCA DO FEED COM PAGINAÇÃO ---
  const buscarFotosDoFeed = async (pageNumber = 0) => {
    if (!festa?.id) return;

    if (pageNumber === 0) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    const from = pageNumber * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data: fotosData, error } = await supabase
      .from("fotos")
      .select("*")
      .eq("festa_id", festa.id)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Erro feed:", error);
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    if (fotosData.length < PAGE_SIZE) {
      setHasMore(false);
    } else {
      setHasMore(true);
    }

    if (!fotosData || fotosData.length === 0) {
      if (pageNumber === 0) setFotosFeed([]);
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    const userIds = [...new Set(fotosData.map((f) => f.user_id))];
    const { data: autoresData } = await supabase
      .from("convidados")
      .select("auth_id, nome, foto_perfil_url")
      .in("auth_id", userIds);

    const feedMapeado = fotosData.map((foto) => {
      const autor = autoresData?.find((a) => a.auth_id === foto.user_id);
      return {
        ...foto,
        convidados: autor || { nome: "Convidado", foto_perfil_url: null },
      };
    });

    if (pageNumber === 0) {
      setFotosFeed(feedMapeado);
    } else {
      setFotosFeed((prev) => [...prev, ...feedMapeado]);
    }

    setPage(pageNumber);
    setLoading(false);
    setLoadingMore(false);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    buscarFotosDoFeed(nextPage);
  };

  const handleRefresh = () => {
    setPage(0);
    buscarFotosDoFeed(0);
  };

  const buscarFotosDoPerfil = async () => {
    if (!festa?.id) return;
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { data } = await supabase
      .from("fotos")
      .select("*")
      .eq("festa_id", festa.id)
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false });

    if (data) setFotosPerfil(data);
  };

  const inserirMetadataFotoFeed = async (storagePath) => {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const { data: urlData } = supabase.storage
      .from("fotos-eventos")
      .getPublicUrl(storagePath);

    const { error } = await supabase.from("fotos").insert([
      {
        festa_id: festa.id,
        user_id: userData.user.id,
        url: urlData.publicUrl,
      },
    ]);

    setLoading(false);
    if (!error) {
      setAbaAtiva("feed");
      handleRefresh();
    }
  };

  // --- DOWNLOAD INTELIGENTE ---
  const handleDownloadFoto = (url) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    document.title = "Baixando...";

    const deveAplicarMarca = !removeMarcaDagua;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);

      if (deveAplicarMarca) {
        const watermark = new window.Image();
        watermark.src = poweredImage;
        watermark.crossOrigin = "anonymous";

        watermark.onload = () => {
          const wmWidth = canvas.width * 0.3;
          const aspectRatio = watermark.height / watermark.width;
          const wmHeight = wmWidth * aspectRatio;

          const x = (canvas.width - wmWidth) / 2;
          const y = canvas.height - wmHeight - 30;

          ctx.shadowColor = "rgba(0,0,0,0.5)";
          ctx.shadowBlur = 15;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 4;

          ctx.drawImage(watermark, x, y, wmWidth, wmHeight);
          saveCanvas(canvas);
        };

        watermark.onerror = () => {
          saveCanvas(canvas);
        };
      } else {
        saveCanvas(canvas);
      }
    };

    img.onerror = () => {
      alert("Erro ao processar imagem.");
      saveOriginal(url);
    };
  };

  const saveCanvas = (canvas) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = `memora-${nanoid(6)}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
        document.title = "Memora";
      },
      "image/jpeg",
      0.95
    );
  };

  const saveOriginal = (url) => {
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.download = `memora-${nanoid(6)}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- CÂMERA LOGIC ---
  const handleDisparoCamera = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    const targetAspectRatio = 4 / 5;

    let cropWidth, cropHeight, dx, dy;

    if (videoWidth / videoHeight > targetAspectRatio) {
      cropHeight = videoHeight;
      cropWidth = videoHeight * targetAspectRatio;
      dx = (videoWidth - cropWidth) / 2;
      dy = 0;
    } else {
      cropWidth = videoWidth;
      cropHeight = videoWidth / targetAspectRatio;
      dx = 0;
      dy = (videoHeight - cropHeight) / 2;
    }

    canvas.width = cropWidth;
    canvas.height = cropHeight;

    canvas
      .getContext("2d")
      .drawImage(
        video,
        dx,
        dy,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight
      );

    canvas.toBlob(
      (blob) => {
        if (blob) {
          setFotoPreview(blob);
          setPreviewUrl(URL.createObjectURL(blob));
        }
      },
      "image/jpeg",
      0.95
    );
  };

  const handleConfirmarEnvio = async () => {
    setBotaoEnviar(false);
    if (!fotoPreview) return;
    const uniqueId = nanoid(8);

    if (modoCamera === "feed") {
      const url = await enviarParaUpload(
        fotoPreview,
        `memora-feed-${uniqueId}.jpeg`
      );
      if (url) await inserirMetadataFotoFeed(url);
    } else {
      const url = await enviarParaUpload(
        fotoPreview,
        `memora-perfil-${uniqueId}.jpeg`
      );
      if (url) {
        const { data } = supabase.storage
          .from("fotos-eventos")
          .getPublicUrl(url);
        await atualizarFotoPerfilConvidado(data.publicUrl);
        setDadosPerfil((prev) => ({
          ...prev,
          foto_perfil_url: data.publicUrl,
        }));
        setAbaAtiva("perfil");
      }
    }
    setFotoPreview(null);
    setPreviewUrl(null);
    setBotaoEnviar(true);
  };

  const handleDescartarFoto = () => {
    setFotoPreview(null);
    setPreviewUrl(null);
  };

  // --- FUNÇÕES DE EDIÇÃO DE NOME ---
  const handleEditClick = () => {
    if (dadosPerfil?.nome) {
      setTempUserName(dadosPerfil.nome);
      setIsEditingName(true);
    }
  };

  const handleSaveNewName = async () => {
    if (!tempUserName.trim()) return;

    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("convidados")
      .update({ nome: tempUserName })
      .eq("auth_id", userData.user.id);

    setLoading(false);
    if (!error) {
      setDadosPerfil((prev) => ({ ...prev, nome: tempUserName }));
      setIsEditingName(false);
    } else {
      console.error("Erro ao salvar nome:", error);
      alert("Falha ao salvar nome. Tente novamente.");
    }
  };

  // --- ENTRY E PERFIL ---
  const handleEntrySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (!nomeConvidado) {
      alert("Nome obrigatório");
      setLoading(false);
      return;
    }
    if (!(await ensureGuestAuth())) {
      setLoading(false);
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    const newGuestId = nanoid(10);
    const { error } = await supabase.from("convidados").upsert(
      [
        {
          auth_id: userData.user.id,
          local_nano_id: newGuestId,
          festa_id: festa.id,
          nome: nomeConvidado,
        },
      ],
      { onConflict: "auth_id" }
    );

    if (error) {
      setLoading(false);
      return;
    }
    if (fotoPerfil) {
      const uniqueId = nanoid(8);
      const url = await enviarParaUpload(
        fotoPerfil,
        `perfil-inicial-${uniqueId}.jpeg`
      );
      if (url) {
        const { data } = supabase.storage
          .from("fotos-eventos")
          .getPublicUrl(url);
        await atualizarFotoPerfilConvidado(data.publicUrl);
      }
    }
    localStorage.setItem("memora_guest_nanoID", newGuestId);
    setLocalUserId(newGuestId);
    setMostrarEntry(false);
    setLoading(false);
    setAbaAtiva("feed");
  };

  const carregarDadosConvidado = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return null;
    const { data } = await supabase
      .from("convidados")
      .select("nome, foto_perfil_url")
      .eq("auth_id", userData.user.id)
      .single();
    return data;
  };

  const atualizarFotoPerfilConvidado = async (url) => {
    const { data: u } = await supabase.auth.getUser();
    await supabase
      .from("convidados")
      .update({ foto_perfil_url: url })
      .eq("auth_id", u.user.id);
  };

  const handleArquivoGaleria = async (event) => {
    const arquivo = event.target.files[0];
    if (!arquivo) return;
    if (modoCamera === "feed") {
      const objectUrl = URL.createObjectURL(arquivo);
      setFotoPreview(arquivo);
      setPreviewUrl(objectUrl);
    } else {
      setLoading(true);
      const uniqueId = nanoid(8);
      const url = await enviarParaUpload(
        arquivo,
        `perfil-galeria-${uniqueId}.jpeg`
      );
      if (url) {
        const { data } = supabase.storage
          .from("fotos-eventos")
          .getPublicUrl(url);
        await atualizarFotoPerfilConvidado(data.publicUrl);
        setDadosPerfil((prev) => ({
          ...prev,
          foto_perfil_url: data.publicUrl,
        }));
        setAbaAtiva("perfil");
      }
      setLoading(false);
    }
  };

  // --- EFFECTS ---
  useEffect(() => {
    if (!slug) return;
    buscarFesta();
    const savedId = localStorage.getItem("memora_guest_nanoID");
    if (savedId) {
      setLocalUserId(savedId);
      ensureGuestAuth().then((ok) => {
        if (ok) setMostrarEntry(false);
        else setMostrarEntry(true);
      });
    } else setMostrarEntry(true);
  }, [slug]);

  useEffect(() => {
    let currentStream = null;
    if (abaAtiva === "camera" && !previewUrl) {
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 4096 },
          height: { ideal: 2160 },
        },
      };

      navigator.mediaDevices
        .getUserMedia(constraints)
        .then((s) => {
          currentStream = s;
          if (videoRef.current) videoRef.current.srcObject = s;
        })
        .catch((e) => console.error("Erro Cam:", e));
    }
    if (festa?.id && localUserId) {
      if (abaAtiva === "feed") buscarFotosDoFeed(0);
      if (abaAtiva === "perfil") {
        carregarDadosConvidado().then((d) => d && setDadosPerfil(d));
        buscarFotosDoPerfil();
      }
    }
    return () => {
      if (currentStream) currentStream.getTracks().forEach((t) => t.stop());
    };
  }, [abaAtiva, facingMode, festa?.id, localUserId, previewUrl]);

  // --- CHECAGEM DE HORÁRIO PARA POSTAGEM ---
  // Verifica se ainda está dentro das 12h do dia seguinte
  const podePostar = festa ? podePostarFoto(festa.data_festa) : false;

  // --- RENDER ---
  if (mostrarEntry) {
    return (
      <div className="container-guest entry-page-layout">
        <form
          ref={formRef}
          onSubmit={handleEntrySubmit}
          className="entry-form-box"
        >
          <div className="header-entry">
            <img src={logoMemora} alt="Logo" />
            <p className="welcome-subtitle">
              <span className="nome-festa-destaque"> {festa?.nome_festa}</span>
            </p>
          </div>
          <label htmlFor="foto-entry" className="profile-photo-block">
            <ImageIcon size={32} />
            <span className="photo-label">
              {fotoPerfil ? "Foto selecionada" : "Foto de Perfil"}
            </span>
          </label>
          <input
            type="file"
            id="foto-entry"
            accept="image/*"
            className="input-invisivel"
            onChange={(e) => setFotoPerfil(e.target.files[0])}
          />
          <input
            type="text"
            placeholder="Seu nome"
            className="input-guest-name"
            value={nomeConvidado}
            onChange={(e) => setNomeConvidado(e.target.value)}
            required
          />
          <button type="submit" className="btn-entry-primary">
            Entrar!
          </button>
        </form>
      </div>
    );
  }

  if (erro)
    return (
      <div className="container-guest screen">
        <h1 className="title-error">404</h1>
      </div>
    );

  if (!festa)
    return (
      <div className="container-guest">
        <p className="loading-text">Carregando...</p>
      </div>
    );

  return (
    <div className="container-guest">
      {abaAtiva === "feed" && (
        <header className="header-party">
          <h1 className="header-gradient-title">{festa?.nome_festa}</h1>
          <button className="btn-refresh" onClick={handleRefresh}>
            <RefreshCw size={15} />
          </button>
        </header>
      )}

      <main className="app-content">
        {abaAtiva === "feed" && (
          <div className="feed-container">
            {loading && fotosFeed.length === 0 && (
              <p className="loading-text">Carregando...</p>
            )}

            {!loading && fotosFeed.length > 0 ? (
              <div className="photos-list-column">
                {fotosFeed.map((foto) => (
                  <div key={foto.id} className="instagram-card">
                    <div className="card-header">
                      {foto.convidados?.foto_perfil_url ? (
                        <img
                          src={foto.convidados.foto_perfil_url}
                          alt="Avatar"
                          className="card-avatar"
                        />
                      ) : (
                        <div className="card-avatar-placeholder">
                          <User size={14} />
                        </div>
                      )}
                      <span className="card-username">
                        {foto.convidados?.nome}
                      </span>
                    </div>
                    <div className="card-image-wrapper">
                      <img src={foto.url} alt="Post" className="photo-image" />
                    </div>
                    <div className="card-actions">
                      <p className="feed-hashtag">
                        <span className="hashtag-symbol">#</span>
                        {festa?.nome_festa?.replace(/\s+/g, "")}
                      </p>
                    </div>
                  </div>
                ))}

                {hasMore && (
                  <div className="load-more-container">
                    <button
                      className="btn-load-more"
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                    >
                      {loadingMore ? "Buscando..." : "Ver mais fotos"}
                    </button>
                  </div>
                )}
                {!hasMore && <p className="end-of-feed">Você viu tudo! 🎉</p>}
              </div>
            ) : (
              !loading && <p className="no-photos">Seja o primeiro a postar!</p>
            )}
          </div>
        )}

        {abaAtiva === "camera" && (
          <div className="camera-container">
            {previewUrl ? (
              <div className="preview-mode-container">
                <img src={previewUrl} alt="Preview" className="preview-image" />

                <div className="camera-controles-strip preview-controls">
                  <button
                    onClick={handleDescartarFoto}
                    className="btn-action-cancel"
                  >
                    <X size={32} color="white" />
                  </button>
                  {botaoEnviar ? (
                    <button
                      onClick={handleConfirmarEnvio}
                      className="btn-action-confirm"
                    >
                      <Check size={32} color="white" />
                    </button>
                  ) : null}
                </div>
              </div>
            ) : (
              <>
                <div className="camera-header-warning">
                  {modoCamera === "perfil"
                    ? "Nova Foto de Perfil"
                    : "Postar no Feed"}
                </div>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className={`video-preview ${
                    facingMode === "user" ? "mirrored" : ""
                  }`}
                />
                <canvas ref={canvasRef} className="canvas-invisivel" />
                <div className="camera-controles-strip">
                  <input
                    type="file"
                    id="galeria-cam"
                    accept="image/*"
                    className="input-invisivel"
                    onChange={handleArquivoGaleria}
                  />
                  <label htmlFor="galeria-cam" className="botao-galeria">
                    <ImageIcon />
                  </label>
                  <button
                    className="botao-disparo"
                    onClick={handleDisparoCamera}
                  >
                    <div className="botao-disparo-interno"></div>
                  </button>
                  <button
                    className="botao-flip"
                    onClick={() =>
                      setFacingMode((prev) =>
                        prev === "environment" ? "user" : "environment"
                      )
                    }
                  >
                    <RefreshCw />
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {abaAtiva === "perfil" && (
          <div className="profile-page-container">
            {dadosPerfil && (
              <div className="profile-card">
                <div className="profile-photo-wrapper">
                  {dadosPerfil.foto_perfil_url ? (
                    <img
                      src={dadosPerfil.foto_perfil_url}
                      className="profile-photo"
                      alt="Perfil"
                    />
                  ) : (
                    <div className="profile-placeholder">
                      <User size={50} color="#7C3AED" />
                    </div>
                  )}
                </div>

                {isEditingName ? (
                  <div className="profile-name-edit-wrapper">
                    <input
                      type="text"
                      className="input-edit-name"
                      value={tempUserName}
                      onChange={(e) => setTempUserName(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") handleSaveNewName();
                      }}
                      disabled={loading}
                    />
                    <button
                      onClick={handleSaveNewName}
                      className="btn-edit-name"
                    >
                      <Save size={20} color="#22c55e" />
                    </button>
                    <button
                      onClick={() => setIsEditingName(false)}
                      className="btn-edit-name"
                    >
                      <XCircle size={20} color="#ef4444" />
                    </button>
                  </div>
                ) : (
                  <div className="profile-name-edit-wrapper">
                    <h2 className="profile-name">{dadosPerfil.nome}</h2>
                    <button
                      onClick={handleEditClick}
                      className="btn-edit-name"
                      disabled={loading}
                    >
                      <Pencil size={16} color="currentColor" />
                    </button>
                  </div>
                )}

                <button
                  className="btn-entry-primary btn-profile-edit"
                  onClick={() => {
                    setModoCamera("perfil");
                    setAbaAtiva("camera");
                  }}
                  disabled={loading}
                >
                  Trocar Foto de Perfil
                </button>
              </div>
            )}

            <div className="profile-photos-grid">
              {fotosPerfil.length > 0 ? (
                fotosPerfil.map((foto) => (
                  <div
                    key={foto.id}
                    className="profile-grid-item"
                    onClick={() => handleDownloadFoto(foto.url)}
                  >
                    <img
                      src={foto.url}
                      className="profile-grid-img"
                      alt="Minha foto"
                    />
                    <div className="download-overlay">
                      <Download size={12} color="white" />
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-photos-text">Você ainda não postou fotos.</p>
              )}
            </div>
          </div>
        )}
      </main>

      <nav className="bottom-nav">
        <button
          className={`nav-item ${abaAtiva === "feed" ? "active" : ""}`}
          onClick={() => setAbaAtiva("feed")}
        >
          <Home size={24} />
          <span className="nav-label">Feed</span>
        </button>

        {/* --- BOTÃO DE CÂMERA (LÓGICA 12H) --- */}
        <button
          className={`nav-item ${abaAtiva === "camera" ? "active" : ""} ${
            !podePostar ? "disabled" : ""
          }`} // Adiciona classe disabled
          onClick={() => {
            if (podePostar) {
              setModoCamera("feed");
              setAbaAtiva("camera");
            }
          }}
          disabled={!podePostar} // Desabilita o clique real
        >
          {podePostar ? (
            <>
              <Camera size={24} />
              <span className="nav-label">Postar</span>
            </>
          ) : (
            <>
              <Lock size={24} />
              <span className="nav-label">Encerrado</span>
            </>
          )}
        </button>

        <button
          className={`nav-item ${abaAtiva === "perfil" ? "active" : ""}`}
          onClick={() => setAbaAtiva("perfil")}
        >
          <User size={24} />
          <span className="nav-label">Perfil</span>
        </button>
      </nav>
    </div>
  );
};

export default GuestPage;
