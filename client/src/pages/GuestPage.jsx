import { useEffect, useState, useRef } from "react";
import { Home, Camera, User, Image, RefreshCw, X, Check } from "lucide-react"; // Removi Heart
import { useParams } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import "../styles/GuestPage.css";
import { nanoid } from "nanoid";
import logoMemora from "../assets/logo-memora.png";

const GuestPage = () => {
  const { slug } = useParams();

  // --- ESTADOS ---
  const [localUserId, setLocalUserId] = useState(null);
  const [nomeConvidado, setNomeConvidado] = useState("");
  const [fotoPerfil, setFotoPerfil] = useState(null);
  const [mostrarEntry, setMostrarEntry] = useState(false);
  const [dadosPerfil, setDadosPerfil] = useState(null);

  // Dados do BD
  const [festa, setFesta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(false);

  // Navegação
  const [abaAtiva, setAbaAtiva] = useState("feed");
  const [facingMode, setFacingMode] = useState("environment");

  // FEEDS
  const [fotosFeed, setFotosFeed] = useState([]);
  const [fotosPerfil, setFotosPerfil] = useState([]);

  // CÂMERA, PREVIEW E LEGENDA
  const [modoCamera, setModoCamera] = useState("feed");
  const [fotoPreview, setFotoPreview] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [legenda, setLegenda] = useState(""); // <--- NOVO: Estado da legenda

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const formRef = useRef(null);

  // --- 1. INICIALIZAÇÃO ---
  const buscarFesta = async () => {
    setLoading(true);
    setErro(false);
    const { data, error } = await supabase
      .from("festas")
      .select("*")
      .eq("slug", slug)
      .single();
    if (error) {
      console.log("Erro:", error);
      setErro(true);
    } else {
      setFesta(data);
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

  // --- 2. BUSCA DE DADOS (SIMPLIFICADA - SEM LIKES) ---

  const buscarFotosDoFeed = async () => {
    if (!festa?.id) return;

    // A. Busca TODAS as fotos desta festa (incluindo legenda)
    const { data: fotosData } = await supabase
      .from("fotos")
      .select("*")
      .eq("festa_id", festa.id)
      .order("created_at", { ascending: false });

    if (!fotosData || fotosData.length === 0) {
      setFotosFeed([]);
      return;
    }

    // B. Coleta IDs para buscar autores
    const userIds = [...new Set(fotosData.map((f) => f.user_id))];

    // C. Busca Autores (Convidados)
    const { data: autoresData } = await supabase
      .from("convidados")
      .select("auth_id, nome, foto_perfil_url")
      .in("auth_id", userIds);

    // D. Monta o objeto final
    const feedCompleto = fotosData.map((foto) => {
      const autor = autoresData?.find((a) => a.auth_id === foto.user_id);
      return {
        ...foto,
        convidados: autor || { nome: "Convidado", foto_perfil_url: null },
      };
    });
    setFotosFeed(feedCompleto);
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

  // FUNÇÃO DE INSERÇÃO NO BANCO (AGORA COM LEGENDA)
  const inserirMetadataFotoFeed = async (storagePath, textoLegenda) => {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const { data: urlData } = supabase.storage
      .from("fotos-eventos")
      .getPublicUrl(storagePath);

    // Inserindo com legenda
    const { error } = await supabase.from("fotos").insert([
      {
        festa_id: festa.id,
        user_id: userData.user.id,
        url: urlData.publicUrl,
        legenda: textoLegenda, // <--- Salva no banco
      },
    ]);

    setLoading(false);
    if (!error) {
      setAbaAtiva("feed");
      await buscarFotosDoFeed();
    }
  };

  // --- 3. CÂMERA E PREVIEW ---
  const handleDisparoCamera = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Corte 4:5
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
      0.9
    );
  };

  const handleConfirmarEnvio = async () => {
    if (!fotoPreview) return;
    const uniqueId = nanoid(8);

    if (modoCamera === "feed") {
      const url = await enviarParaUpload(
        fotoPreview,
        `memora-feed-${uniqueId}.jpeg`
      );
      // Passa a legenda junto
      if (url) await inserirMetadataFotoFeed(url, legenda);
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
    // Limpeza
    setFotoPreview(null);
    setPreviewUrl(null);
    setLegenda(""); // Limpa legenda
  };

  const handleDescartarFoto = () => {
    setFotoPreview(null);
    setPreviewUrl(null);
    setLegenda("");
  };

  // --- 4. ENTRY E PERFIL ---
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
    const { error } = await supabase
      .from("convidados")
      .upsert(
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
    localStorage.setItem("memora_guest_id", newGuestId);
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

    // Se for Feed, vamos abrir o preview para por legenda
    if (modoCamera === "feed") {
      const objectUrl = URL.createObjectURL(arquivo);
      setFotoPreview(arquivo); // Salva o blob
      setPreviewUrl(objectUrl); // Mostra o preview
      // O usuário vai clicar em "Confirmar" e a legenda vai junto
    } else {
      // Se for perfil, sobe direto
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
    const savedId = localStorage.getItem("memora_guest_id");
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
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode } })
        .then((s) => {
          currentStream = s;
          if (videoRef.current) videoRef.current.srcObject = s;
        })
        .catch((e) => console.error("Erro Cam:", e));
    }
    if (festa?.id && localUserId) {
      if (abaAtiva === "feed") buscarFotosDoFeed();
      if (abaAtiva === "perfil") {
        carregarDadosConvidado().then((d) => d && setDadosPerfil(d));
        buscarFotosDoPerfil();
      }
    }
    return () => {
      if (currentStream) currentStream.getTracks().forEach((t) => t.stop());
    };
  }, [abaAtiva, facingMode, festa?.id, localUserId, previewUrl]);

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
              Bem-vindo(a) à festa:{" "}
              <span className="nome-festa-destaque"> {festa?.nome_festa}</span>
            </p>
          </div>
          <label htmlFor="foto-entry" className="profile-photo-block">
            <Image size={32} />
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
          <h1>{festa?.nome_festa}</h1>
        </header>
      )}

      <main className="app-content">
        {abaAtiva === "feed" && (
          <div className="feed-container">
            {loading && <p className="loading-text">Carregando...</p>}
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
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            marginRight: 10,
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            background: "#333",
                            marginRight: 10,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <User size={16} />
                        </div>
                      )}
                      <span style={{ fontWeight: "bold" }}>
                        {foto.convidados?.nome}
                      </span>
                    </div>
                    <div className="card-image-wrapper">
                      <img src={foto.url} alt="Post" className="photo-image" />
                    </div>
                    {/* LEGENDA NO LUGAR DA CURTIDA */}
                    <div className="card-actions" style={{ padding: "15px" }}>
                      {foto.legenda && (
                        <p
                          style={{
                            margin: 0,
                            fontSize: "0.95rem",
                            color: "#e2e8f0",
                          }}
                        >
                          <span
                            style={{ fontWeight: "bold", marginRight: "6px" }}
                          >
                            {foto.convidados?.nome}
                          </span>
                          {foto.legenda}
                        </p>
                      )}
                      {!foto.legenda && (
                        <p
                          style={{
                            margin: 0,
                            fontSize: "0.8rem",
                            color: "#64748b",
                          }}
                        >
                          Postado recentemente
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-photos">Seja o primeiro a postar!</p>
            )}
          </div>
        )}

        {abaAtiva === "camera" && (
          <div className="camera-container">
            {previewUrl ? (
              <div className="preview-mode-container">
                <img
                  src={previewUrl}
                  alt="Preview"
                  style={{
                    flex: 1,
                    objectFit: "contain",
                    width: "100%",
                    backgroundColor: "#000",
                  }}
                />

                {/* INPUT DE LEGENDA (Aparece só no feed) */}
                {modoCamera === "feed" && (
                  <div style={{ padding: "10px 20px", background: "black" }}>
                    <input
                      type="text"
                      placeholder="Escreva uma legenda..."
                      className="caption-input"
                      value={legenda}
                      onChange={(e) => setLegenda(e.target.value)}
                    />
                  </div>
                )}

                <div
                  className="camera-controles-strip"
                  style={{ justifyContent: "center", gap: "20px" }}
                >
                  <button
                    onClick={handleDescartarFoto}
                    style={{
                      background: "#ef4444",
                      border: "none",
                      borderRadius: "50%",
                      width: 60,
                      height: 60,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <X size={32} color="white" />
                  </button>
                  <button
                    onClick={handleConfirmarEnvio}
                    style={{
                      background: "#22c55e",
                      border: "none",
                      borderRadius: "50%",
                      width: 60,
                      height: 60,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <Check size={32} color="white" />
                  </button>
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
                  className="video-preview"
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
                    <Image />
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
                <h2 className="profile-name">{dadosPerfil.nome}</h2>
                <button
                  className="btn-entry-primary"
                  style={{
                    maxWidth: "200px",
                    margin: "10px auto",
                    padding: "10px",
                  }}
                  onClick={() => {
                    setModoCamera("perfil");
                    setAbaAtiva("camera");
                  }}
                >
                  Trocar Foto de Perfil
                </button>
              </div>
            )}
            <div className="profile-grid-title">Minhas Fotos</div>
            <div className="profile-photos-grid">
              {fotosPerfil.length > 0 ? (
                fotosPerfil.map((foto) => (
                  <div key={foto.id} className="profile-grid-item">
                    <img
                      src={foto.url}
                      className="profile-grid-img"
                      alt="Minha foto"
                    />
                  </div>
                ))
              ) : (
                <p
                  style={{
                    color: "#64748b",
                    padding: "20px",
                    gridColumn: "span 3",
                    textAlign: "center",
                  }}
                >
                  Você ainda não postou fotos.
                </p>
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
        <button
          className={`nav-item ${abaAtiva === "camera" ? "active" : ""}`}
          onClick={() => {
            setModoCamera("feed");
            setAbaAtiva("camera");
          }}
        >
          <Camera size={24} />
          <span className="nav-label">Postar</span>
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
