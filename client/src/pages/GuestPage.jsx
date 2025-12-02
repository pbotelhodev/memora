import { useEffect, useState, useRef } from "react";
import { Home, Camera, User, Image, RefreshCw } from "lucide-react";
import { useParams } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import "../styles/GuestPage.css";
import { nanoid } from "nanoid";
import logoMemora from "../assets/logo-memora.png";

const GuestPage = () => {
  //Espiao da url(slug)
  const { slug } = useParams();

  // ESTADOS PARA O LOGIN DO CONVIDADO
  const [localUserId, setLocalUserId] = useState(null);
  const [nomeConvidado, setNomeConvidado] = useState("");
  const [fotoPerfil, setFotoPerfil] = useState(null);
  const [mostrarEntry, setMostrarEntry] = useState(false);
  const [dadosPerfil, setDadosPerfil] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  //O database
  const [festa, setFesta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(false);

  //States
  const [abaAtiva, setAbaAtiva] = useState("feed");
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState("environment");
  const [authError, setAuthError] = useState(false);

  //Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const formRef = useRef(null);

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

  const ensureGuestAuth = async () => {
    // 1. Verifica se já existe uma sessão válida
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // Se não há usuário Supabase, cria um novo (primeiro acesso)
      const { error } = await supabase.auth.signInAnonymously();

      if (error) {
        console.error("ERRO CRÍTICO NA CRIAÇÃO DE CONVIDADO:", error);

        setAuthError(true);
        return false; // Falha na criação da sessão
      }
      console.log("Sessão de convidado anônimo iniciada com sucesso.");
    } else {
      console.log(`Sessão de convidado ativa: ${user.id}`);
    }

    // Retorna TRUE se a sessão foi encontrada ou criada com sucesso
    return true;
  };

  const enviarParaUpload = async (fotoBlob, nomeArquivo) => {
    setLoading(true); // Começa a girar o loader na tela
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      console.error("DEBUG: Usuário não autenticado. O token falhou.");
      alert("Sua sessão falhou. Por favor, recarregue a página.");
      setLoading(false);
      return null;
    }
    // O caminho completo do arquivo no bucket
    const pathArquivo = `${festa.slug}/${nomeArquivo}`;

    // Chama o serviço de Storage do Supabase
    const { data, error } = await supabase.storage
      .from("fotos-eventos") // Nome do nosso Bucket
      .upload(pathArquivo, fotoBlob, {
        cacheControl: "3600", // Armazenamento em cache de 1 hora
        upsert: false, // Garante que não sobrescreva arquivos existentes
      });

    setLoading(false); // Termina o loader

    if (error) {
      console.error("Erro no upload para o Storage:", error);
      alert("Falha ao enviar a foto! Tente novamente.");
      return null;
    }

    // Retorna o caminho do arquivo no Storage
    return data.path;
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

  const capturarFoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    // 1. Defina o tamanho do quadrado de corte (TARGET SIZE)
    const tamanhoDoQuadrado = Math.min(video.videoWidth, video.videoHeight);

    // 2. Calcula o DESLOCAMENTO (onde o corte começa para centralizar)
    const dx = (video.videoWidth - tamanhoDoQuadrado) / 2; // Deslocamento horizontal
    const dy = (video.videoHeight - tamanhoDoQuadrado) / 2; // Deslocamento vertical

    // 3. Ajusta o Canvas para o tamanho exato do quadrado de saída
    canvas.width = tamanhoDoQuadrado;
    canvas.height = tamanhoDoQuadrado;

    // 4. Desenha o frame, CORTANDO as bordas
    context.drawImage(
      video,
      dx,
      dy,
      tamanhoDoQuadrado,
      tamanhoDoQuadrado,
      0,
      0,
      tamanhoDoQuadrado,
      tamanhoDoQuadrado
    );

    const fotoBlob = await converterCanvasParaBlob(canvas);

    const uniqueId = nanoid(8); //Gera um ID de 8 caracteres
    const nomeArquivo = `memora-${uniqueId}.jpeg`;

    if (fotoBlob) {
      const urlStorage = await enviarParaUpload(fotoBlob, nomeArquivo);

      if (urlStorage) {
        // NOVIDADE: Chama o banco para salvar o URL
        await inserirMetadataFoto(urlStorage);
      }
    }

    // console.log("Foto capturada e cortada no formato 1:1!");
    // Próximo passo: Conversão.
  };

  const converterCanvasParaBlob = (canvas) => {
    return new Promise((resolve) => {
      // Usa o método nativo do Canvas para criar um arquivo (Blob)
      // 'image/jpeg' é mais leve que PNG, ideal para fotos de feed
      canvas.toBlob(
        (blob) => {
          resolve(blob);
        },
        "image/jpeg",
        0.9
      ); // 0.9 é a qualidade (90%)
    });
  };

  const inserirMetadataFoto = async (storagePath) => {
    setLoading(true);

    // 1. OBTEM O USUÁRIO LOGADO para inserir o ID correto
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      setLoading(false);
      alert(
        "Erro: Você precisa estar logado para postar fotos! Tente recarregar a página."
      );
      return false;
    }

    const userId = userData.user.id; // Captura o ID de autenticação do Supabase

    // 2. Obter o URL Público da foto
    const { data: urlData } = supabase.storage
      .from("fotos-eventos")
      .getPublicUrl(storagePath);

    const publicUrl = urlData.publicUrl; // Este é o link final da foto

    // 3. Inserir na tabela 'fotos'
    const { error } = await supabase.from("fotos").insert([
      {
        festa_id: festa.id,
        user_id: userId, // NOVIDADE: Salvamos quem tirou a foto
        url: publicUrl,
      },
    ]);

    setLoading(false);

    if (error) {
      console.error("Erro ao salvar foto no banco:", error);
      alert("Erro interno ao registrar foto.");
      return false;
    }

    // Sucesso! Volta para a aba Feed
    console.log(`Foto salva no feed: ${publicUrl}`);
    setAbaAtiva("feed");
    return true;
  };

  const inserirDadosConvidado = async (nanoId) => {
    // 1. Obtém o usuário JWT
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return false;

    const { error } = await supabase
      .from("convidados")
      // ⚡️ CORREÇÃO CRÍTICA: Use .upsert() ao invés de .insert() ⚡️
      .upsert(
        [
          {
            auth_id: userData.user.id,
            local_nano_id: nanoId,
            festa_id: festa.id,
            nome: nomeConvidado,
          },
        ],
        {
          onConflict: "auth_id", // Garante que a atualização seja pela chave auth_id
        }
      );

    if (error) {
      console.error("Erro ao salvar dados do convidado:", error);
      alert("Falha ao salvar seu perfil. Tente novamente.");
      return false;
    }

    console.log("Dados do convidado salvos/atualizados no banco.");
    return true;
  };

  const atualizarFotoPerfilConvidado = async (urlStorage) => {
    // 1. Obtém o usuário logado para saber qual linha atualizar
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return false;

    const userId = userData.user.id; // ID de autenticação do Supabase

    // 2. Atualiza a tabela 'convidados' com a URL da foto de perfil
    const { error } = await supabase
      .from("convidados")
      .update({
        // 🚨 ATENÇÃO: Verifique se o nome da sua coluna é 'url_foto_perfil'
        foto_perfil_url: urlStorage,
      })
      .eq("auth_id", userId); // Atualiza a linha do usuário logado

    if (error) {
      console.error("Erro ao atualizar foto de perfil do convidado:", error);
      alert("Erro interno ao registrar a foto de perfil.");
      return false;
    }

    console.log(`Foto de perfil salva no banco: ${urlStorage}`);
    return true;
  };

  const handleEntrySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // 1. Cria a sessão JWT
    if (!nomeConvidado) {
      alert("Por favor, preencha seu nome.");
      setLoading(false);
      return;
    }

    const authSuccess = await ensureGuestAuth();

    if (!authSuccess) {
      setLoading(false);
      return;
    }

    // 2. Persistência do Nome no BD
    const newGuestId = nanoid(10);
    const dadosSalvos = await inserirDadosConvidado(newGuestId);

    if (!dadosSalvos) {
      setLoading(false);
      setAuthError(true);
      return;
    }

    let fotoUrlFinal = null;

    if (fotoPerfil) {
      // Reutiliza a lógica de upload, enviando o File (que é um Blob)
      const uniqueId = nanoid(8);
      const nomeArquivo = `perfil-${uniqueId}.jpeg`; // Nome genérico para perfil

      const urlStorage = await enviarParaUpload(fotoPerfil, nomeArquivo);

      if (urlStorage) {
        // Se o upload foi bem-sucedido, atualiza a coluna do convidado com a URL
        const urlCompleta = supabase.storage
          .from("fotos-eventos")
          .getPublicUrl(urlStorage).data.publicUrl;

        await atualizarFotoPerfilConvidado(urlCompleta);
        fotoUrlFinal = urlCompleta;
      }
    }

    // AÇÕES DE SUCESSO (O nome está no banco)
    localStorage.setItem("memora_guest_id", newGuestId);
    setLocalUserId(newGuestId);
    setMostrarEntry(false);
    setLoading(false);
    setAbaAtiva("feed");
  };

  const carregarDadosConvidado = async () => {
    // Busca o usuário logado para obter o ID (JWT)
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return null;

    // Busca na tabela convidados usando o ID de autenticação
    const { data, error } = await supabase
      .from("convidados")
      .select("nome, foto_perfil_url") // Pega o nome e o link da foto
      .eq("auth_id", userData.user.id)
      .single();

    if (error) {
      console.error("Erro ao buscar perfil:", error);
      return null;
    }

    // Retorna o objeto: { nome: 'Seu Nome', foto_perfil_url: 'http://...' }
    return data;
  };

  //effects

  useEffect(() => {
    // Só carrega se o usuário está logado (tem ID local) E a aba for 'perfil'
    if (abaAtiva === "perfil" && localUserId) {
      const fetchProfile = async () => {
        setLoadingProfile(true); // Liga o loader específico

        const perfil = await carregarDadosConvidado();

        if (perfil) {
          setDadosPerfil(perfil); // Salva o nome e a URL
        } else {
          console.log("DEBUG: Perfil não encontrado no banco de dados.");
        }

        setLoadingProfile(false); // Desliga o loader
      };

      fetchProfile();
    }
  }, [abaAtiva, localUserId]); // Dispara quando a aba muda ou quando o localUserId é setado (primeiro login)
  useEffect(() => {
    if (!slug) return;

    // Estado local para garantir que só checamos uma vez
    const checkInitialLoad = async () => {
      // 1. Busca os dados da festa (carrega o ID da festa)
      await buscarFesta();

      // 2. Checa o ID Local (memora_guest_id)
      const savedUserId = localStorage.getItem("memora_guest_id");

      if (savedUserId) {
        // Se tem ID Local: Tentamos revalidar a sessão Supabase
        setLocalUserId(savedUserId);
        const authSuccess = await ensureGuestAuth();

        if (!authSuccess) {
          // Se a sessão JWT falhou, forçamos o login de novo
          setMostrarEntry(true);
          console.log(
            "Sessão expirada. Redirecionando para login de convidado."
          );
        } else {
          // Se a sessão JWT revalidou, mostra o App
          setMostrarEntry(false);
        }
      } else {
        // Se NÃO tem ID Local, mostra o formulário para criar a conta
        setMostrarEntry(true);
      }
    };

    checkInitialLoad();
  }, [slug]);

  useEffect(() => {
    let currentStream = null; // Guarda o stream para a função de limpeza

    if (abaAtiva === "camera") {
      // 1. Inicia a câmera (usando o facingMode)
      const setupCamera = async () => {
        try {
          const mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facingMode },
          });

          currentStream = mediaStream; // Guarda o stream recém-criado
          setStream(mediaStream); // Atualiza o estado

          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
            videoRef.current.play(); // NOVIDADE: Força o play no celular, se permitido
          }
        } catch (err) {
          console.error("Erro ao acessar câmera:", err);
          setErro(true); // Pode ser útil para mostrar uma tela de erro na câmera
        }
      };

      setupCamera();
    }

    // 2. A FUNÇÃO DE LIMPEZA (RODA AO SAIR DA ABA OU MUDAR O FACINGMODE)
    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
        setStream(null);
        console.log("Câmera desligada.");
      }
    };
  }, [abaAtiva, facingMode]);

  //Returns

  //tela login
  if (mostrarEntry) {
    return (
      <div className="container-guest entry-page-layout">
        <form
          ref={formRef}
          onSubmit={handleEntrySubmit}
          className="entry-form-box"
        >
          {/* LOGO E TÍTULO */}
          <div className="header-entry">
            <img src={logoMemora} />
            <p className="welcome-subtitle">
              Bem-vindo(a) à festa:
              <span className="nome-festa-destaque"> {festa?.nome_festa}</span>
            </p>
          </div>

          {/* INPUT: FOTO DA GALERIA */}
          <label htmlFor="foto-galeria" className="profile-photo-block">
            <Image size={32} />
            <span className="photo-label">
              {fotoPerfil ? fotoPerfil.name : "Escolher Foto de Perfil"}
            </span>
          </label>
          <input
            type="file"
            id="foto-galeria"
            accept="image/*"
            className="input-invisivel" // Mantém a classe existente
            onChange={(e) => {
              setFotoPerfil(e.target.files[0]);
              console.log("FOTO DE PERFIL SELECIONADA:", e.target.files[0]);
            }}
          />

          {/* INPUT: NOME DO CONVIDADO */}
          <input
            type="text"
            placeholder="Seu nome (ex: Pedro Oliveira)"
            className="input-guest-name"
            value={nomeConvidado}
            onChange={(e) => setNomeConvidado(e.target.value)}
            required
          />

          {/* BOTÃO ENTRAR */}
          <button type="submit" className="btn-entry-primary">
            Entrar na Festa!
          </button>
        </form>
      </div>
    );
  }

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

            <canvas ref={canvasRef} className="canvas-invisivel" />

            <div className="camera-controles-strip">
              {/* Botão Galeria (1) - Esquerda */}
              <input
                type="file"
                id="galeria-input"
                accept="image/*"
                className="input-invisivel"
                onChange={handleArquivoGaleria}
              />
              <label htmlFor="galeria-input" className="botao-galeria">
                <Image size={35} />
              </label>

              {/* Botão Disparo (2) - Central (Função para capturar a foto de fato) */}
              <button className="botao-disparo" onClick={capturarFoto}>
                <div className="botao-disparo-interno"></div>
              </button>

              {/* Botão Virar Câmera (3) - Direita */}
              <button className="botao-flip" onClick={toggleCameraFacing}>
                <RefreshCw size={35} />
              </button>
            </div>
          </div>
        )}
        {/* Se a aba for PERFIL, mostra isso */}
        {abaAtiva === "perfil" && (
          <div className="profile-page-container">
            {/* 1. Loader Específico */}
            {loadingProfile && (
              <p className="loading-text">Carregando Perfil...</p>
            )}
            {/* 2. Conteúdo Principal do Perfil */}
            {!loadingProfile && dadosPerfil && (
              <div className="profile-card">
                <div className="profile-photo-wrapper">
                  {/* SE TEM FOTO, USA A URL. SE NÃO, MOSTRA O ÍCONE USER (Lucide) */}

                  {dadosPerfil.foto_perfil_url ? (
                    <img
                      src={dadosPerfil.foto_perfil_url}
                      alt={`Foto de perfil de ${dadosPerfil.nome}`}
                      className="profile-photo"
                    />
                  ) : (
                    <div className="profile-placeholder">
                      <User size={90} color="#7C3AED" />
                      {/* Ícone Lucide */}
                    </div>
                  )}
                </div>

                <h2 className="profile-name">{dadosPerfil.nome}</h2>
                <p className="profile-tag">
                  Convidado(a) da Festa <br /> {festa.nome_festa}
                </p>
              </div>
            )}
            {/* 3. Mensagem de Erro/Falha */}
            {!loadingProfile && !dadosPerfil && localUserId && (
              <div className="text-center mt-10 text-slate-500">
                <p>
                  Não foi possível carregar seu perfil. Tente recarregar a
                  página.
                </p>
              </div>
            )}
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
