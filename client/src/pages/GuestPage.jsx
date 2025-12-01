import { useEffect, useState, useRef } from "react";
import { Home, Camera, User, Image, RefreshCw } from "lucide-react";
import { useParams } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import "../styles/GuestPage.css";

const GuestPage = () => {
  //Espiao da url(slug)
  const { slug } = useParams();

  //O database
  const [festa, setFesta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(false);

  //States
  const [abaAtiva, setAbaAtiva] = useState("feed");
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState("environment");

  //Refs
  const videoRef = useRef(null);

  const buscarFesta = async () => {
    setLoading(true);
    setErro(false);

    const { data, error } = await supabase
      .from("festas")
      .select("*")
      .eq("slug", slug) //Filtro e o que desejamos encontrar
      .single();

    if (error) {
      console.log("Erro:", error);
      setErro(true);
    } else {
      setFesta(data);
    }
    setLoading(false);
  };

  /* //Handles */

  const handleArquivo = (event) => {
    const arquivo = event.target.files[0];
    if (arquivo) {
      console.log("Arquivo selecionado:", arquivo.name);
      // Aqui vamos fazer o upload depois
    }
  };

  const iniciarCamera = async () => {
    try {
      // Pede acesso à câmera traseira (environment)
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode },
      });

      setStream(mediaStream);

      // Se o elemento de vídeo já existir na tela, liga ele
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Erro ao acessar câmera:", err);
      alert("Precisamos da permissão da câmera para tirar fotos!");
    }
  };

  const toggleCameraFacing = () => {
    // Se o modo atual é 'environment' (traseira), muda para 'user' (frontal), e vice-versa.
    setFacingMode((currentMode) =>
      currentMode === "environment" ? "user" : "environment"
    );
    // O useEffect perceberá a mudança e reiniciará a câmera automaticamente.
  };

  const handleArquivoGaleria = (event) => {
    const arquivo = event.target.files[0];
    if (arquivo) {
      console.log("Arquivo da Galeria selecionado:", arquivo.name);
      // Aqui no futuro vamos pular a captura e ir direto para o upload.
    }
  };

  //effects

  useEffect(() => {
    if (!slug) return;
    buscarFesta();
  }, [slug]);

  useEffect(() => {
    if (abaAtiva === "camera") {
      iniciarCamera();
    } else {
      // Se saiu da aba da câmera, desliga a luzinha da câmera pra economizar bateria
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
    }
  }, [abaAtiva, facingMode]);

  //Returns

  //Tela erro
  if (erro) {
    return (
      <div className="container-guest screen">
        <h1 className="title-error">404</h1>
        <p className="messenger-error">Ops! Essa festa não existe</p>
      </div>
    );
  }
  //fluxo de carregando
  if (!festa) {
    return (
      <div className="container-guest">
        <p style={{ color: "white", textAlign: "center", marginTop: "50vh" }}>
          Carregando festa...
        </p>
      </div>
    );
  }

  //Fluxo normal
  return (
    <div className="container-guest">
      {/* Header */}
      {abaAtiva === "feed" && (
        <header className="header-party">
          <h1>{festa?.nome_festa}</h1>
        </header>
      )}

      {/* Conteudo */}
      <main className="app-content">
        {abaAtiva === "feed" && (
          <div className="text-center mt-10 text-slate-500">
            <p>📸 Aqui vai entrar o Feed de Fotos</p>
          </div>
        )}

        {abaAtiva === "camera" && (
          <div className="camera-container">
            {/* O Player de Vídeo (O Espelho) */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="video-preview"
            />

            {/* NOVIDADE: A FAIXA DE CONTROLES NO RODAPÉ */}
            <div className="camera-controles-strip">
              {/* Botão Galeria (1) - Esquerda */}
              <input
                type="file"
                id="galeria-input"
                accept="image/*" // Permite selecionar arquivos de imagem
                className="input-invisivel input-invisivel" // Vamos esconder isso no CSS
                onChange={handleArquivoGaleria}
              />
              <label htmlFor="galeria-input" className="botao-galeria">
                <Image size={40} />
              </label>

              {/* Botão Disparo (2) - Central (Função para capturar a foto de fato) */}
              <button className="botao-disparo">
                <div className="botao-disparo-interno"></div>
              </button>

              {/* Botão Virar Câmera (3) - Direita */}
              <button className="botao-flip" onClick={toggleCameraFacing}>
                <RefreshCw size={40} />
              </button>
            </div>
          </div>
        )}
        {/* Se a aba for PERFIL, mostra isso */}
        {abaAtiva === "perfil" && (
          <div className="text-center mt-10 text-slate-500">
            <p>👤 Aqui vai entrar o Perfil do Usuário</p>
          </div>
        )}
      </main>
      {/* Nav-bar */}
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
          onClick={() => setAbaAtiva("camera")}
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
